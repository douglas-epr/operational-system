/**
 * MCP-style tool layer for the chatbot.
 *
 * Each tool is a server function that runs through a Supabase client
 * (RLS-clamped for non-admins, service-role for admin/manager on the
 * generic query_db / count_db tools). The LLM picks tools by emitting a
 * JSON envelope `{ tool: "list_my_projects", args: {} }`; the runtime
 * parses the envelope, executes the tool, feeds the result back to the
 * LLM, and re-prompts.
 *
 * Adding a tool: add an entry to TOOL_SCHEMAS (declares name, description,
 * and JSON args), then register a handler in runTool().
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/server";

export interface ToolSchema {
  name: string;
  description: string;
  args: Record<string, { type: string; description: string }>;
}

export const TOOL_SCHEMAS: ToolSchema[] = [
  {
    name: "list_my_projects",
    description: "Return id + name of every project the current user can see.",
    args: {},
  },
  {
    name: "get_project_status",
    description: "Return status, stage, estimated_time, real_time, and progress % for a single project.",
    args: { project_id: { type: "uuid", description: "The project id" } },
  },
  {
    name: "list_my_tasks",
    description: "Return open tasks (status not 'done') assigned to the current user, with due date.",
    args: {},
  },
  {
    name: "get_task",
    description: "Return a task with its name, status, level, dates, and the last 10 comments.",
    args: { task_id: { type: "uuid", description: "The task id" } },
  },
  {
    name: "list_my_internal_projects",
    description: "Return id + name of every internal project the user can see (staff-only).",
    args: {},
  },
  {
    name: "who_is",
    description: "Look up profiles by name (ilike). Returns up to 10 matches.",
    args: { query: { type: "string", description: "A name fragment to search for" } },
  },
  {
    name: "create_client_request_task",
    description:
      "Create a new task in the project's Client Requests kanban (status='not_started'). " +
      "Use this when the user asks the bot to add/log a client-side request, idea, or change. " +
      "Requires a project_id (the chatbot is project-scoped — the project_id is in the system prompt).",
    args: {
      project_id: { type: "uuid", description: "The project id to attach the task to." },
      name: { type: "string", description: "Short task title." },
      estimated_time: {
        type: "number",
        description: "Optional estimate in minutes (e.g. 120 for 2 hours).",
      },
    },
  },
  {
    name: "create_qa_request_task",
    description:
      "Create a new task in the project's QA Requests kanban (status='not_started'). " +
      "Use this when the user asks the bot to log a QA bug, regression, or testing item.",
    args: {
      project_id: { type: "uuid", description: "The project id to attach the task to." },
      name: { type: "string", description: "Short task title." },
      estimated_time: {
        type: "number",
        description: "Optional estimate in minutes.",
      },
    },
  },
  {
    name: "query_db",
    description:
      "Run a SELECT against any public-schema table. Returns up to 100 rows. " +
      "Admins/managers get an RLS-bypass client; everyone else is RLS-clamped. " +
      "Use this when the curated tools above don't fit. Reject auth.* and storage.* tables.",
    args: {
      table: { type: "string", description: "Public-schema table name (e.g. 'project', 'profiles', 'task')." },
      columns: { type: "string", description: "Comma-separated column list. Optional; defaults to '*'." },
      filters: {
        type: "array",
        description:
          "Optional array of {column, op, value}. Supported ops: eq, neq, gt, gte, lt, lte, like, ilike, is, in.",
      },
      limit: { type: "number", description: "Max rows to return (1–100). Optional; defaults to 50." },
      order_by: { type: "string", description: "Column to order by. Optional. Suffix with ' desc' for descending." },
    },
  },
  {
    name: "count_db",
    description:
      "Count rows in a public-schema table (with optional filters). Returns a single number. " +
      "Same access model as query_db.",
    args: {
      table: { type: "string", description: "Public-schema table name." },
      filters: {
        type: "array",
        description: "Optional array of {column, op, value}. Same op set as query_db.",
      },
    },
  },
  {
    name: "list_db_tables",
    description:
      "List every public-schema table the chatbot can query. Use this first when you don't know which table holds the data the user asked about.",
    args: {},
  },
  {
    name: "describe_db_table",
    description:
      "Return the column names + types of a public-schema table. Call this before query_db when you need to know what to filter on or which columns to select.",
    args: {
      table: { type: "string", description: "Public-schema table name." },
    },
  },
];

/** Render the tool catalog into a system-prompt-friendly string. */
export function renderToolCatalog(): string {
  return TOOL_SCHEMAS.map((t) => {
    const argsList = Object.entries(t.args)
      .map(([k, v]) => `      "${k}": <${v.type}>  // ${v.description}`)
      .join(",\n");
    const argsBlock = argsList ? `\n${argsList}\n    ` : "";
    return `- ${t.name}: ${t.description}\n  call as: { "tool": "${t.name}", "args": {${argsBlock}} }`;
  }).join("\n");
}

// ── Tool handlers ───────────────────────────────────────────────────────────

export type ToolResult = { ok: true; data: unknown } | { ok: false; error: string };

/** Filters supported by query_db / count_db. */
type FilterOp = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "like" | "ilike" | "is" | "in";
interface QueryFilter {
  column: string;
  op: FilterOp;
  value: unknown;
}

const ALLOWED_OPS: ReadonlySet<string> = new Set([
  "eq",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
  "like",
  "ilike",
  "is",
  "in",
]);

/**
 * Block tables outside the public schema. Bubble parity & blast-radius
 * containment: we only want the chatbot poking at app data, never auth.*
 * (which would leak password hashes/MFA secrets) or storage.* (file
 * metadata that the app already exposes via signed URLs anyway).
 */
function isAllowedTable(table: string): boolean {
  if (!table || typeof table !== "string") return false;
  const t = table.trim().toLowerCase();
  if (!t) return false;
  if (t.includes(" ") || t.includes(";") || t.includes("--")) return false;
  if (t.startsWith("auth.") || t.startsWith("storage.") || t.startsWith("pg_")) return false;
  if (t === "auth" || t === "storage") return false;
  // Disallow explicit cross-schema like "private.foo" — supabase-js doesn't
  // let us hop schemas anyway, but be defensive.
  if (t.includes(".")) return false;
  return true;
}

function parseFilters(raw: unknown): QueryFilter[] | { error: string } {
  if (raw == null) return [];
  if (!Array.isArray(raw)) return { error: "filters must be an array" };
  const out: QueryFilter[] = [];
  for (const f of raw as Array<Record<string, unknown>>) {
    if (!f || typeof f !== "object") return { error: "each filter must be an object" };
    const column = typeof f.column === "string" ? f.column : "";
    const op = typeof f.op === "string" ? f.op.toLowerCase() : "";
    if (!column) return { error: "filter.column is required" };
    if (!ALLOWED_OPS.has(op)) return { error: `unsupported op: ${op}` };
    out.push({ column, op: op as FilterOp, value: f.value });
  }
  return out;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function applyFilters(query: any, filters: QueryFilter[]): any {
  let q = query;
  for (const f of filters) {
    switch (f.op) {
      case "eq": q = q.eq(f.column, f.value); break;
      case "neq": q = q.neq(f.column, f.value); break;
      case "gt": q = q.gt(f.column, f.value); break;
      case "gte": q = q.gte(f.column, f.value); break;
      case "lt": q = q.lt(f.column, f.value); break;
      case "lte": q = q.lte(f.column, f.value); break;
      case "like": q = q.like(f.column, String(f.value)); break;
      case "ilike": q = q.ilike(f.column, String(f.value)); break;
      case "is": q = q.is(f.column, f.value as null | boolean); break;
      case "in": q = q.in(f.column, Array.isArray(f.value) ? f.value : [f.value]); break;
    }
  }
  return q;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Pick the right Supabase client for query_db/count_db.
 * - admin/manager → service-role (bypasses RLS) so the bot can answer
 *   "list every project" or "count all users" honestly.
 * - everyone else → user's RLS-clamped client. The bot will only ever
 *   see what the user themselves can see.
 */
function pickClient(userClient: SupabaseClient, userType: string): SupabaseClient {
  const elevated = userType === "admin" || userType === "manager";
  return elevated ? (createServiceClient() as unknown as SupabaseClient) : userClient;
}

export async function runTool(
  supabase: SupabaseClient,
  name: string,
  args: Record<string, unknown>,
  userType: string
): Promise<ToolResult> {
  try {
    switch (name) {
      case "list_my_projects": {
        const { data, error } = await supabase
          .from("project")
          .select("id, name, status, stage")
          .order("name");
        if (error) return { ok: false, error: error.message };
        return { ok: true, data };
      }
      case "get_project_status": {
        const id = String(args.project_id ?? "");
        if (!id) return { ok: false, error: "project_id is required" };
        const { data, error } = await supabase
          .from("project")
          .select(
            "id, name, status, stage, program, estimated_time, real_time, start_date_estimated, end_date_estimated, start_date_real, end_date_real"
          )
          .eq("id", id)
          .single();
        if (error) return { ok: false, error: error.message };
        const row = data as {
          estimated_time: number | null;
          real_time: number | null;
        };
        const progressPct =
          row.estimated_time && row.estimated_time > 0
            ? Math.round(((row.real_time ?? 0) / row.estimated_time) * 100)
            : null;
        return { ok: true, data: { ...data, progress_pct: progressPct } };
      }
      case "list_my_tasks": {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { ok: false, error: "not authenticated" };
        // assignees is now a UUID[] column directly on `task` — Postgres
        // contains-array operator does the membership check in one query.
        const { data, error } = await supabase
          .from("project_task")
          .select("id, name, status, level, end_date_estimated, project_id")
          .contains("assignees", [user.id])
          .neq("status", "done")
          .order("end_date_estimated", { ascending: true })
          .limit(100);
        if (error) return { ok: false, error: error.message };
        return { ok: true, data };
      }
      case "get_task": {
        const id = String(args.task_id ?? "");
        if (!id) return { ok: false, error: "task_id is required" };
        const { data: task, error } = await supabase
          .from("project_task")
          .select(
            "id, name, status, type, level, start_date_estimated, end_date_estimated, real_time, estimated_time, project_id"
          )
          .eq("id", id)
          .single();
        if (error) return { ok: false, error: error.message };
        const { data: comments } = await supabase
          .from("project_task_comment")
          .select("id, message, created_at")
          .eq("task_id", id)
          .order("created_at", { ascending: false })
          .limit(10);
        return { ok: true, data: { task, comments: comments ?? [] } };
      }
      case "list_my_internal_projects": {
        const { data, error } = await supabase
          .from("internal_project")
          .select("id, name, status, sector")
          .order("name");
        if (error) return { ok: false, error: error.message };
        return { ok: true, data };
      }
      case "who_is": {
        const q = String(args.query ?? "").trim();
        if (!q) return { ok: false, error: "query is required" };
        const { data, error } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, type")
          .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
          .limit(10);
        if (error) return { ok: false, error: error.message };
        return { ok: true, data };
      }
      case "create_client_request_task":
      case "create_qa_request_task": {
        const projectId = String(args.project_id ?? "");
        const taskName = String(args.name ?? "").trim();
        if (!projectId) return { ok: false, error: "project_id is required" };
        if (!taskName) return { ok: false, error: "name is required" };
        const taskType = name === "create_client_request_task" ? "client_requests" : "qa_requests";
        // Pick the next order int by counting existing tasks with the same
        // (project, type, status='not_started').
        const { data: peers } = await supabase
          .from("project_task")
          .select("order")
          .eq("project_id", projectId)
          .eq("type", taskType)
          .eq("status", "not_started");
        const peerOrders = ((peers ?? []) as Array<{ order: number | null }>).map(
          (p) => p.order ?? 0
        );
        const nextOrder = peerOrders.length > 0 ? Math.max(...peerOrders) + 1 : 0;
        const estTime = Number.isFinite(Number(args.estimated_time))
          ? Math.max(0, Math.trunc(Number(args.estimated_time)))
          : null;
        const insertRow: Record<string, unknown> = {
          project_id: projectId,
          name: taskName,
          type: taskType,
          level: "level_1",
          status: "not_started",
          order: nextOrder,
        };
        if (estTime != null) insertRow.estimated_time = estTime;
        const { data: created, error } = await supabase
          .from("project_task")
          .insert(insertRow as never)
          .select("id, name, type, status")
          .single();
        if (error) return { ok: false, error: error.message };
        return { ok: true, data: created };
      }
      case "query_db": {
        const table = String(args.table ?? "");
        if (!isAllowedTable(table)) return { ok: false, error: `table not allowed: ${table}` };
        const columns = typeof args.columns === "string" && args.columns.trim() ? args.columns : "*";
        const limitNum = Number(args.limit ?? 50);
        const limit = Number.isFinite(limitNum) ? Math.min(Math.max(1, Math.trunc(limitNum)), 100) : 50;
        const filters = parseFilters(args.filters);
        if (!Array.isArray(filters)) return { ok: false, error: filters.error };

        const client = pickClient(supabase, userType);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let q: any = (client as any).from(table).select(columns);
        q = applyFilters(q, filters);
        if (typeof args.order_by === "string" && args.order_by.trim()) {
          const raw = args.order_by.trim();
          const desc = / desc$/i.test(raw);
          const column = raw.replace(/ (asc|desc)$/i, "").trim();
          if (column) q = q.order(column, { ascending: !desc });
        }
        q = q.limit(limit);
        const { data, error } = await q;
        if (error) return { ok: false, error: error.message };
        return { ok: true, data };
      }
      case "count_db": {
        const table = String(args.table ?? "");
        if (!isAllowedTable(table)) return { ok: false, error: `table not allowed: ${table}` };
        const filters = parseFilters(args.filters);
        if (!Array.isArray(filters)) return { ok: false, error: filters.error };
        const client = pickClient(supabase, userType);
        // head:true skips returning rows — we only want the count.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let q: any = (client as any)
          .from(table)
          .select("*", { count: "exact", head: true });
        q = applyFilters(q, filters);
        const { count, error } = await q;
        if (error) return { ok: false, error: error.message };
        return { ok: true, data: { count: count ?? 0 } };
      }
      case "list_db_tables": {
        // Both branches read information_schema. supabase-js can't query it
        // directly via .from(), so we hit a curated PostgREST view? No —
        // simplest: use the service-role client for admin/manager (so
        // information_schema is reachable), and for non-elevated users we
        // still let them see the public table list (table NAMES are not
        // sensitive; their CONTENTS remain RLS-clamped on later query_db
        // calls).
        const client = pickClient(supabase, userType);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (client as any).rpc("public_table_list");
        if (error) {
          // If the RPC isn't deployed yet, fall back to a hardcoded shortlist
          // so the chatbot isn't dead in the water.
          return {
            ok: true,
            data: {
              // Fallback list — used only if the public_table_list RPC is
              // missing. Keep in sync with the canonical list in
              // src/lib/data/ideaPicker.ts and the prompts.md schema audit.
              tables: [
                "profiles", "project", "task", "project_task_comment",
                "internal_project", "internal_project_task", "internal_project_task_comment",
                "internal_goal", "internal_key_result", "internal_key_result_track",
                "idea", "idea_icp", "client", "talent", "company",
                "recommended_project", "prompt", "prompt_group", "sop", "lead",
                "user_ai_settings", "agency",
                "project_file", "project_link", "project_video", "project_work_feedback",
              ],
              note: "fallback list — public_table_list RPC is not deployed",
            },
          };
        }
        return { ok: true, data: { tables: data } };
      }
      case "describe_db_table": {
        const table = String(args.table ?? "");
        if (!isAllowedTable(table)) return { ok: false, error: `table not allowed: ${table}` };
        const client = pickClient(supabase, userType);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (client as any).rpc("public_table_columns", {
          p_table: table,
        });
        if (error) return { ok: false, error: error.message };
        return { ok: true, data: { table, columns: data } };
      }
      default:
        return { ok: false, error: `Unknown tool: ${name}` };
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
