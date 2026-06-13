/**
 * Project-scoped chatbot turn runner.
 *
 * Mirrors src/app/chat/_chatbot/run.ts but operates on either
 * `project_chatbot_message` (external) or `project_internal_chatbot_message`
 * (internal staff) rather than the private-per-user `private_chatbot_message`.
 *
 * The project_id is baked into the system prompt so the model knows it can
 * (and should) use create_client_request_task / create_qa_request_task
 * with that exact id.
 *
 * Author of every turn we insert: the live caller (`created_by`). Visibility
 * is shared across all members of the project — RLS gates membership.
 */

import { createClient } from "@/lib/supabase/server";
import { generateAiJsonResponse } from "@/lib/api/ai-dispatcher";
import { resolveAiConfig } from "@/lib/api/ai-config";
import type { Json } from "@/lib/supabase/types";
import { renderToolCatalog, runTool, type ToolResult } from "./tools";

export type ProjectChatbotScope = "external" | "internal";

const TABLE: Record<ProjectChatbotScope, string> = {
  external: "project_chatbot_message",
  internal: "project_internal_chatbot_message",
};

const MAX_TOOL_HOPS = 6;

// `resolveAiConfig` lives in `@/lib/api/ai-config` (shared with run.ts +
// sandbox-planner + the project task importer).

/**
 * The project chatbot uses its OWN prompt row (separate from the global
 * `Chatbot prompt` used by `runChatbotTurn`). Both rows live under
 * `prompt_group.name = 'Chat'`; the project-bot row is named
 * `'Project chatbot prompt'` and is admin/manager-editable from
 * `/prompts`. Falls back to the hardcoded `SYSTEM_HEADER` if the seed
 * row is missing so a deleted prompt never bricks the bot.
 *
 * Reads via the service-role client (Part 2 item 40): `prompt` RLS
 * gates SELECT to admin/manager, so a non-admin's session would
 * otherwise read null and the chatbot would silently fall back to the
 * hardcoded prompt. Service-role keeps everyone on the same DB-stored
 * prompt while still preventing client-side exposure.
 */
async function loadDbSystemPrompt(): Promise<string | null> {
  const { createServiceClient } = await import("@/lib/supabase/server");
  const sb = createServiceClient();
  const { data: group } = await sb
    .from("prompt_group")
    .select("id")
    .eq("name", "Chat")
    .maybeSingle();
  if (!group) return null;
  const { data: prompt } = await sb
    .from("prompt")
    .select("description")
    .eq("group", (group as { id: number }).id)
    .eq("name", "Project chatbot prompt")
    .maybeSingle();
  const text = (prompt as { description: string | null } | null)?.description ?? null;
  return text && text.trim().length > 0 ? text : null;
}

const SYSTEM_HEADER = `You are the Move37 assistant, scoped to a single project. You can
answer questions about THIS project, its tasks, and people on it, and you
can create tasks in this project's "Client Requests" or "QA Requests"
kanbans via the create_client_request_task / create_qa_request_task tools.`;

const SYSTEM_FOOTER = `

OUTPUT FORMAT — read carefully:
- If you need data, reply with ONLY a single JSON object:
    { "tool": "<tool name>", "args": { ... } }
  Do not wrap it in markdown. Do not add any prose.
- Otherwise (the final answer for the user), reply with ONLY a JSON object:
    { "reply": "<your message in plain text or markdown>" }
- Never mix the two shapes in one reply.
- Never invent data. If a tool errors, explain to the user briefly.
- Keep replies concise (under 200 words unless the user asks for detail).`;

function asJson(v: unknown): Json {
  return v as Json;
}

function buildSystemPrompt(
  projectId: string,
  userTypeLabel: string,
  dbHeader: string | null
): string {
  const header = dbHeader ?? SYSTEM_HEADER;
  return (
    header +
    `\n\nPROJECT SCOPE: project_id = "${projectId}". When you need to answer a
question that's ambiguous, assume it refers to THIS project. When creating
a task, always pass project_id = "${projectId}".\n\n` +
    "Available tools:\n\n" +
    renderToolCatalog() +
    `\n\nThe user asking you is a "${userTypeLabel}". Tailor your tone accordingly.\n` +
    SYSTEM_FOOTER
  );
}

interface MessageRow {
  id: string;
  project_id: string;
  created_by: string | null;
  author_type: "user" | "chatbot";
  message: string | null;
  attachments: unknown;
  tool_calls: unknown;
  created_at: string;
  updated_at: string;
}

function renderHistory(messages: MessageRow[]): string {
  return messages
    .map((m) => {
      const who = m.author_type === "user" ? "USER" : "ASSISTANT";
      return `${who}: ${m.message ?? ""}`;
    })
    .join("\n\n");
}

interface ToolEnvelope { tool: string; args?: Record<string, unknown> }
interface ReplyEnvelope { reply: string }

function parseEnvelope(raw: string): ToolEnvelope | ReplyEnvelope | { error: string } {
  let s = raw.trim();
  s = s.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start === -1 || end === -1) return { error: "no JSON in reply" };
  try {
    const obj = JSON.parse(s.slice(start, end + 1)) as Record<string, unknown>;
    if (typeof obj.reply === "string") return { reply: obj.reply };
    if (typeof obj.tool === "string") {
      return { tool: obj.tool, args: (obj.args as Record<string, unknown>) ?? {} };
    }
    return { error: "unexpected JSON shape" };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "parse failed" };
  }
}

interface RunResult { botMsg?: MessageRow; error?: string }

export async function runProjectChatbotTurn(
  scope: ProjectChatbotScope,
  projectId: string
): Promise<RunResult> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dyn = supabase as any;
  const table = TABLE[scope];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("type")
    .eq("id", user.id)
    .single();
  const userTypeLabel = (profile as { type?: string | null } | null)?.type ?? "user";

  const ai = await resolveAiConfig(supabase, user.id);
  if (!ai) {
    const fallback =
      "Sorry — no AI provider is configured. Set one in Settings → AI Configuration to enable the chatbot.";
    const { data: row } = await dyn
      .from(table)
      .insert({
        project_id: projectId,
        created_by: user.id,
        author_type: "chatbot",
        message: fallback,
      })
      .select("*")
      .single();
    return { botMsg: (row ?? undefined) as MessageRow | undefined, error: "AI provider not configured" };
  }

  // Load history (most recent 50 turns).
  const { data: histData } = await dyn
    .from(table)
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true })
    .limit(50);
  const history = (histData ?? []) as MessageRow[];

  const dbHeader = await loadDbSystemPrompt();
  const system = buildSystemPrompt(projectId, userTypeLabel, dbHeader);
  let prompt = `${system}\n\nConversation so far:\n\n${renderHistory(history)}\n\nReply now.`;

  const trace: Array<{ tool: string; args: unknown; result: ToolResult }> = [];

  for (let hop = 0; hop < MAX_TOOL_HOPS; hop++) {
    const res = await generateAiJsonResponse<unknown>({
      service: ai.service,
      apiKey: ai.apiKey,
      model: ai.model,
      prompt,
    });
    if (res.returned_an_error || res.data == null) {
      const msg = `I hit an error talking to the AI: ${res.error ?? "unknown"}`;
      const { data: row } = await dyn
        .from(table)
        .insert({
          project_id: projectId,
          created_by: user.id,
          author_type: "chatbot",
          message: msg,
          tool_calls: asJson(trace),
        } as never)
        .select("*")
        .single();
      return { botMsg: (row ?? undefined) as MessageRow | undefined, error: res.error ?? "AI error" };
    }
    const raw = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
    const env = parseEnvelope(raw);
    if ("error" in env) {
      const msg = typeof res.data === "string" ? res.data : raw;
      const { data: row } = await dyn
        .from(table)
        .insert({
          project_id: projectId,
          created_by: user.id,
          author_type: "chatbot",
          message: msg,
          tool_calls: asJson(trace),
        } as never)
        .select("*")
        .single();
      return { botMsg: (row ?? undefined) as MessageRow | undefined };
    }
    if ("reply" in env) {
      const { data: row } = await dyn
        .from(table)
        .insert({
          project_id: projectId,
          created_by: user.id,
          author_type: "chatbot",
          message: env.reply,
          tool_calls: trace.length > 0 ? asJson(trace) : null,
        } as never)
        .select("*")
        .single();
      return { botMsg: (row ?? undefined) as MessageRow | undefined };
    }
    // Tool call. Inject the project_id automatically if the model forgot it,
    // so create_*_request_task always lands on the right project.
    const args = { ...(env.args ?? {}) };
    if (
      (env.tool === "create_client_request_task" || env.tool === "create_qa_request_task") &&
      !args.project_id
    ) {
      args.project_id = projectId;
    }
    const result = await runTool(supabase, env.tool, args, userTypeLabel);
    trace.push({ tool: env.tool, args, result });
    prompt += `\n\nASSISTANT (tool call): ${JSON.stringify({
      tool: env.tool,
      args,
    })}\nTOOL RESULT: ${JSON.stringify(result)}\n\nNow reply with the final answer (or another tool call if you still need data).`;
  }

  const giveUp =
    "I tried looking that up but ran out of steps. Could you rephrase or narrow it down?";
  const { data: row } = await dyn
    .from(table)
    .insert({
      project_id: projectId,
      created_by: user.id,
      author_type: "chatbot",
      message: giveUp,
      tool_calls: asJson(trace),
    } as never)
    .select("*")
    .single();
  return { botMsg: (row ?? undefined) as MessageRow | undefined };
}

export type { MessageRow as ProjectChatbotMessageRow };
