/**
 * Server-side data loaders for the /dashboard page.
 *
 * Four metric groups power the overview:
 *
 *   - ideas           → Ideas Refiner activity (funnel progress, playbooks)
 *   - marketing       → mkt_* pipeline counts (contacts, outreach, signals)
 *   - key_results     → status counters from internal_key_result
 *   - projects        → status counters from project
 *   - internal_projects → status counters from internal_project
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

// ── Ideas Refiner ─────────────────────────────────────────────────────────────

export interface IdeasMetrics {
  total: number;
  /** Ideas that have at least one playbook version assembled. */
  with_playbooks: number;
  /** Ideas created in the current calendar month. */
  created_this_month: number;
  /** Distribution of ideas by the last completed block (funnel depth). */
  by_block: Record<string, number>;
}

/** One data point per month for the ideas-created trend (last 6 months). */
export interface IdeasTrendPoint {
  key: string;
  label: string;
  count: number;
}

// ── Marketing ─────────────────────────────────────────────────────────────────

export interface MarketingMetrics {
  total_prospects: number;
  total_outreach_sent: number;
  total_replies: number;
  total_signals: number;
  active_validations: number;
}

// ── Projects / OKRs (unchanged) ──────────────────────────────────────────────

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

/** One row per active project for the hours-comparison bar chart. */
export interface ProjectHoursRow {
  id: string;
  name: string;
  status: ProjectStatus;
  estimated_hours: number;
  real_hours: number;
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
  ideas: IdeasMetrics;
  ideas_trend: IdeasTrendPoint[];
  marketing: MarketingMetrics;
  keyResults: KeyResultsMetrics;
  kr_highlights: KeyResultHighlight[];
  projects: ProjectsMetrics;
  active_hours: ProjectHoursRow[];
  internalProjects: InternalProjectsMetrics;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

function monthBounds(date: Date): { start: string; end: string } {
  const year  = date.getUTCFullYear();
  const month = date.getUTCMonth();
  return {
    start: new Date(Date.UTC(year, month, 1)).toISOString(),
    end:   new Date(Date.UTC(year, month + 1, 1)).toISOString(),
  };
}

// ── Loaders ──────────────────────────────────────────────────────────────────

export async function loadIdeasMetrics(
  supabase: AnyClient,
  now: Date = new Date()
): Promise<IdeasMetrics> {
  const cur = monthBounds(now);

  const [ideasRes, playbooksRes, thisMonthRes] = await Promise.all([
    supabase.from("idea").select("current_block_ended"),
    supabase.from("idea_playbook_version").select("idea_id"),
    supabase
      .from("idea")
      .select("id", { count: "exact", head: true })
      .gte("created_at", cur.start)
      .lt("created_at", cur.end),
  ]);

  const ideas = (ideasRes.data ?? []) as Array<{ current_block_ended: string | null }>;

  const by_block: Record<string, number> = {};
  for (const r of ideas) {
    const key = r.current_block_ended ?? "not_started";
    by_block[key] = (by_block[key] ?? 0) + 1;
  }

  // Unique ideas that have at least one playbook version.
  const playbookIdeaIds = new Set<string>();
  for (const r of (playbooksRes.data ?? []) as Array<{ idea_id: string }>) {
    playbookIdeaIds.add(r.idea_id);
  }

  return {
    total: ideas.length,
    with_playbooks: playbookIdeaIds.size,
    created_this_month: (thisMonthRes.count as number | null) ?? 0,
    by_block,
  };
}

export async function loadIdeasTrend(
  supabase: AnyClient,
  now: Date = new Date()
): Promise<IdeasTrendPoint[]> {
  const monthsBack = 5;
  const startDate  = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsBack, 1));
  const endDate    = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  const { data } = await supabase
    .from("idea")
    .select("created_at")
    .gte("created_at", startDate.toISOString())
    .lt("created_at", endDate.toISOString());

  const rows = (data ?? []) as Array<{ created_at: string }>;

  const buckets = new Map<string, number>();
  for (let i = 0; i <= monthsBack; i++) {
    const d   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsBack + i, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, 0);
  }
  for (const r of rows) {
    const d   = new Date(r.created_at);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const cur = buckets.get(key);
    if (cur !== undefined) buckets.set(key, cur + 1);
  }

  const points: IdeasTrendPoint[] = [];
  for (const [key, count] of buckets) {
    const [yr, mo] = key.split("-").map(Number);
    const labelDate = new Date(Date.UTC(yr, mo - 1, 1));
    points.push({
      key,
      label: labelDate.toLocaleString("en-US", { month: "short", timeZone: "UTC" }),
      count,
    });
  }
  return points;
}

export async function loadMarketingMetrics(
  supabase: AnyClient
): Promise<MarketingMetrics> {
  const [prospectsRes, outreachRes, repliesRes, signalsRes, validationsRes] = await Promise.all([
    supabase.from("mkt_prospect").select("id", { count: "exact", head: true }),
    supabase.from("mkt_outreach").select("id", { count: "exact", head: true }).eq("status", "sent"),
    supabase.from("mkt_outreach").select("id", { count: "exact", head: true }).eq("status", "replied"),
    supabase.from("mkt_signal").select("id", { count: "exact", head: true }),
    supabase.from("mkt_validation").select("id", { count: "exact", head: true }).eq("status", "validating"),
  ]);
  const c = (r: { count: number | null }) => r.count ?? 0;
  return {
    total_prospects:    c(prospectsRes),
    total_outreach_sent: c(outreachRes),
    total_replies:      c(repliesRes),
    total_signals:      c(signalsRes),
    active_validations: c(validationsRes),
  };
}

export async function loadKeyResultsMetrics(
  supabase: AnyClient
): Promise<KeyResultsMetrics> {
  const { data } = await supabase.from("internal_key_result").select("status, achieved");
  const rows = (data ?? []) as Array<{ status: KeyResultStatus | null; achieved: boolean | null }>;
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

export async function loadProjectsMetrics(supabase: AnyClient): Promise<ProjectsMetrics> {
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

export async function loadInternalProjectsMetrics(supabase: AnyClient): Promise<InternalProjectsMetrics> {
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

export async function loadActiveHours(
  supabase: AnyClient,
  topN = 8
): Promise<ProjectHoursRow[]> {
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
      const est  = Number(r.estimated_time ?? 0);
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
    .sort((a, b) => b.burn - a.burn)
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
  const [
    ideas,
    ideas_trend,
    marketing,
    keyResults,
    kr_highlights,
    projects,
    active_hours,
    internalProjects,
  ] = await Promise.all([
    loadIdeasMetrics(supabase),
    loadIdeasTrend(supabase),
    loadMarketingMetrics(supabase),
    loadKeyResultsMetrics(supabase),
    loadKrHighlights(supabase),
    loadProjectsMetrics(supabase),
    loadActiveHours(supabase),
    loadInternalProjectsMetrics(supabase),
  ]);
  return {
    ideas,
    ideas_trend,
    marketing,
    keyResults,
    kr_highlights,
    projects,
    active_hours,
    internalProjects,
  };
}
