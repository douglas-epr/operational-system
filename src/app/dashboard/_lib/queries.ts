/**
 * Server-side data loaders for the /dashboard page.
 *
 * Four "groups" power the four sub-views the user navigates between:
 *
 *   - finance           → revenue (project_invoice.service_price for the
 *                         current month) + profit (project.profit summed
 *                         for projects that invoiced this month) +
 *                         derived costs (revenue - profit). Bubble's
 *                         original dashboard finance tile referenced
 *                         project.price / project.profit / referrer_commission
 *                         (paginas.md "Página dashboard" workflows).
 *   - key_results       → status counters from internal_key_result.status,
 *                         plus achieved/not-achieved split.
 *   - projects          → status counters from project.status (the seven
 *                         os_project_status enum values).
 *   - internal_projects → status counters from internal_project.status
 *                         (the six os_internal_project_status values).
 *
 * Admin/manager bypass RLS for all four queries (see policies in
 * 20260304000000 + 20260426000002 + 20260423100000); regular users would
 * be heavily clamped, which is why /dashboard/page.tsx redirects them
 * away.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  PROJECT_STATUSES,
  INTERNAL_PROJECT_STATUSES,
  KEY_RESULT_STATUSES,
  type ProjectStatus,
  type InternalProjectStatus,
  type KeyResultStatus,
} from "./constants";

export interface FinanceMetrics {
  /** Revenue: sum of project_invoice.service_price for the current month. */
  revenue: number;
  /** Profit: sum of project.profit across projects invoiced this month. */
  profit: number;
  /** Costs: revenue - profit (derived; we don't have a cost ledger). */
  costs: number;
  /** Last month's revenue + profit, for delta arrows. */
  prev_revenue: number;
  prev_profit: number;
  /** Human-readable label of the current month, e.g. "April". */
  month_label: string;
  /** Number of invoices counted this month. */
  invoice_count: number;
}

export interface KeyResultsMetrics {
  total: number;
  achieved: number;
  not_achieved: number;
  by_status: Record<KeyResultStatus, number>;
}

export interface ProjectsMetrics {
  total: number;
  by_status: Record<ProjectStatus, number>;
}

export interface InternalProjectsMetrics {
  total: number;
  by_status: Record<InternalProjectStatus, number>;
}

/** One row per month for the 6-month revenue trend chart. */
export interface RevenuePoint {
  /** ISO 'YYYY-MM' for sorting / line keys. */
  key: string;
  /** Short month label, e.g. 'Apr'. */
  label: string;
  revenue: number;
  profit: number;
  invoices: number;
}

/** One row per active project for the hours-comparison bar chart. */
export interface ProjectHoursRow {
  id: string;
  name: string;
  status: ProjectStatus;
  estimated_hours: number;
  real_hours: number;
  /** ratio (real / estimated) — > 1 means over budget. */
  burn: number;
}

/** Top-N most-recently active key results, surfaced on the overview. */
export interface KeyResultHighlight {
  id: string;
  name: string;
  achieved: boolean;
  status: KeyResultStatus;
  current_value: number | null;
}

export interface DashboardMetrics {
  finance: FinanceMetrics;
  /** 6-month rolling revenue + profit trend (oldest first). */
  revenue_trend: RevenuePoint[];
  keyResults: KeyResultsMetrics;
  /** Top-N KRs to show as a compact list on the overview. */
  kr_highlights: KeyResultHighlight[];
  projects: ProjectsMetrics;
  /** Active projects with their estimated vs real hours, top 8 by burn. */
  active_hours: ProjectHoursRow[];
  internalProjects: InternalProjectsMetrics;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function monthBounds(date: Date): { start: string; end: string; label: string } {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth(); // 0-indexed
  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 1));
  const label = start.toLocaleString("en-US", { month: "long", timeZone: "UTC" });
  return {
    start: start.toISOString(),
    end: end.toISOString(),
    label,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

// ── Loaders ──────────────────────────────────────────────────────────────────

export async function loadFinanceMetrics(
  supabase: AnyClient,
  now: Date = new Date()
): Promise<FinanceMetrics> {
  const cur = monthBounds(now);
  const prevDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const prev = monthBounds(prevDate);

  // Pull just the rows we need (project_id + service_price + created_at)
  // for the current and previous month, then compute totals client-side
  // so we can also count distinct project ids per month for the profit join.
  const { data: curInvoices } = await supabase
    .from("project_invoice")
    .select("project_id, service_price")
    .gte("created_at", cur.start)
    .lt("created_at", cur.end);
  const { data: prevInvoices } = await supabase
    .from("project_invoice")
    .select("project_id, service_price")
    .gte("created_at", prev.start)
    .lt("created_at", prev.end);

  const curRows = (curInvoices ?? []) as Array<{ project_id: string | null; service_price: number | null }>;
  const prevRows = (prevInvoices ?? []) as Array<{ project_id: string | null; service_price: number | null }>;

  const sum = (rs: Array<{ service_price: number | null }>) =>
    rs.reduce((a, r) => a + Number(r.service_price ?? 0), 0);
  const revenue = sum(curRows);
  const prev_revenue = sum(prevRows);

  // Profit: sum project.profit across the distinct projects that have an
  // invoice this month. project.profit is a single per-project number
  // (manually curated), so this is a coarse signal — better than nothing.
  async function profitForProjects(rows: typeof curRows): Promise<number> {
    const ids = Array.from(
      new Set(rows.map((r) => r.project_id).filter((x): x is string => Boolean(x)))
    );
    if (ids.length === 0) return 0;
    const { data } = await supabase
      .from("project")
      .select("profit")
      .in("id", ids);
    return ((data ?? []) as Array<{ profit: number | null }>).reduce(
      (a, r) => a + Number(r.profit ?? 0),
      0
    );
  }
  const profit = await profitForProjects(curRows);
  const prev_profit = await profitForProjects(prevRows);

  return {
    revenue,
    profit,
    costs: Math.max(0, revenue - profit),
    prev_revenue,
    prev_profit,
    month_label: cur.label,
    invoice_count: curRows.length,
  };
}

export async function loadKeyResultsMetrics(
  supabase: AnyClient
): Promise<KeyResultsMetrics> {
  const { data } = await supabase
    .from("internal_key_result")
    .select("status, achieved");
  const rows = (data ?? []) as Array<{
    status: KeyResultStatus | null;
    achieved: boolean | null;
  }>;
  const by_status = Object.fromEntries(
    KEY_RESULT_STATUSES.map((s) => [s, 0])
  ) as Record<KeyResultStatus, number>;
  let achieved = 0;
  let not_achieved = 0;
  for (const r of rows) {
    if (r.status && by_status[r.status as KeyResultStatus] !== undefined) {
      by_status[r.status as KeyResultStatus]++;
    }
    if (r.achieved) achieved++;
    else not_achieved++;
  }
  return { total: rows.length, achieved, not_achieved, by_status };
}

export async function loadProjectsMetrics(
  supabase: AnyClient
): Promise<ProjectsMetrics> {
  const { data } = await supabase.from("project").select("status");
  const rows = (data ?? []) as Array<{ status: ProjectStatus | null }>;
  const by_status = Object.fromEntries(
    PROJECT_STATUSES.map((s) => [s, 0])
  ) as Record<ProjectStatus, number>;
  for (const r of rows) {
    if (r.status && by_status[r.status as ProjectStatus] !== undefined) {
      by_status[r.status as ProjectStatus]++;
    }
  }
  return { total: rows.length, by_status };
}

export async function loadInternalProjectsMetrics(
  supabase: AnyClient
): Promise<InternalProjectsMetrics> {
  const { data } = await supabase.from("internal_project").select("status");
  const rows = (data ?? []) as Array<{ status: InternalProjectStatus | null }>;
  const by_status = Object.fromEntries(
    INTERNAL_PROJECT_STATUSES.map((s) => [s, 0])
  ) as Record<InternalProjectStatus, number>;
  for (const r of rows) {
    if (r.status && by_status[r.status as InternalProjectStatus] !== undefined) {
      by_status[r.status as InternalProjectStatus]++;
    }
  }
  return { total: rows.length, by_status };
}

/**
 * Six-month rolling revenue + profit trend. We pull the entire window in
 * one query, bucket client-side. The window starts at the *first day of
 * the month 5 months ago* so the most-recent month is always the right-
 * most bar.
 */
export async function loadRevenueTrend(
  supabase: AnyClient,
  now: Date = new Date()
): Promise<RevenuePoint[]> {
  const monthsBack = 5; // → 6 buckets including the current month
  const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsBack, 1));
  const endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  const { data: invoices } = await supabase
    .from("project_invoice")
    .select("project_id, service_price, created_at")
    .gte("created_at", startDate.toISOString())
    .lt("created_at", endDate.toISOString());
  const rows = (invoices ?? []) as Array<{
    project_id: string | null;
    service_price: number | null;
    created_at: string;
  }>;

  // Group invoices by month-key; count distinct project ids per month so
  // we can join project.profit afterwards.
  const buckets = new Map<string, { revenue: number; invoices: number; project_ids: Set<string> }>();
  for (let i = 0; i <= monthsBack; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsBack + i, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, { revenue: 0, invoices: 0, project_ids: new Set() });
  }
  for (const r of rows) {
    const d = new Date(r.created_at);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const b = buckets.get(key);
    if (!b) continue;
    b.revenue += Number(r.service_price ?? 0);
    b.invoices += 1;
    if (r.project_id) b.project_ids.add(r.project_id);
  }

  const allProjectIds = Array.from(
    new Set(Array.from(buckets.values()).flatMap((b) => Array.from(b.project_ids)))
  );
  let profitMap = new Map<string, number>();
  if (allProjectIds.length > 0) {
    const { data: projects } = await supabase
      .from("project")
      .select("id, profit")
      .in("id", allProjectIds);
    profitMap = new Map(
      ((projects ?? []) as Array<{ id: string; profit: number | null }>).map((p) => [
        p.id,
        Number(p.profit ?? 0),
      ])
    );
  }

  const points: RevenuePoint[] = [];
  for (const [key, b] of buckets) {
    const [yr, mo] = key.split("-").map(Number);
    const labelDate = new Date(Date.UTC(yr, mo - 1, 1));
    const label = labelDate.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
    const profit = Array.from(b.project_ids).reduce(
      (a, id) => a + (profitMap.get(id) ?? 0),
      0
    );
    points.push({
      key,
      label,
      revenue: b.revenue,
      profit,
      invoices: b.invoices,
    });
  }
  return points;
}

export async function loadActiveHours(
  supabase: AnyClient,
  topN = 8
): Promise<ProjectHoursRow[]> {
  // Active projects only — the user wants to spot over/under-budget work
  // among the things actually happening right now.
  const { data } = await supabase
    .from("project")
    .select("id, name, status, estimated_time, real_time")
    .eq("status", "in_progress");
  const rows = (data ?? []) as Array<{
    id: string;
    name: string | null;
    status: ProjectStatus | null;
    estimated_time: number | null;
    real_time: number | null;
  }>;
  return rows
    .map((r) => {
      const est = Number(r.estimated_time ?? 0);
      const real = Number(r.real_time ?? 0);
      return {
        id: r.id,
        name: r.name ?? "Untitled",
        status: (r.status ?? "in_progress") as ProjectStatus,
        estimated_hours: est,
        real_hours: real,
        burn: est > 0 ? real / est : real > 0 ? 99 : 0,
      };
    })
    .sort((a, b) => b.burn - a.burn) // worst burn first
    .slice(0, topN);
}

export async function loadKrHighlights(
  supabase: AnyClient,
  topN = 5
): Promise<KeyResultHighlight[]> {
  const { data } = await supabase
    .from("internal_key_result")
    .select("id, name, achieved, status, current_key_result_value, updated_at")
    .order("updated_at", { ascending: false })
    .limit(topN);
  return ((data ?? []) as Array<{
    id: string;
    name: string;
    achieved: boolean | null;
    status: KeyResultStatus | null;
    current_key_result_value: number | null;
  }>).map((r) => ({
    id: r.id,
    name: r.name,
    achieved: Boolean(r.achieved),
    status: (r.status ?? "not_started") as KeyResultStatus,
    current_value: r.current_key_result_value,
  }));
}

export async function loadAllDashboardMetrics(
  supabase: SupabaseClient | AnyClient
): Promise<DashboardMetrics> {
  // Run every group query in parallel — all read-only.
  const [
    finance,
    revenue_trend,
    keyResults,
    kr_highlights,
    projects,
    active_hours,
    internalProjects,
  ] = await Promise.all([
    loadFinanceMetrics(supabase),
    loadRevenueTrend(supabase),
    loadKeyResultsMetrics(supabase),
    loadKrHighlights(supabase),
    loadProjectsMetrics(supabase),
    loadActiveHours(supabase),
    loadInternalProjectsMetrics(supabase),
  ]);
  return {
    finance,
    revenue_trend,
    keyResults,
    kr_highlights,
    projects,
    active_hours,
    internalProjects,
  };
}
