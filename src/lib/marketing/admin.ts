/**
 * Admin-side data access for the Marketing Validation Engine.
 * Used by the gated /marketing/[ideaId]/* server components.
 * Relies on RLS (admin/manager) via the standard server client.
 */

import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  ContractMetric,
  DecisionContract,
  MktValidation,
  MktFunnelMetrics,
} from "@/types/marketing";

export interface IdeaContext {
  ideaId: string;
  ideaName: string | null;
  projectId: string | null;
  projectName: string | null;
  validation: MktValidation | null;
}

/** Load an idea's name + its project name + validation config. Returns null if idea missing. */
export async function getIdeaContext(
  ideaId: string
): Promise<IdeaContext | null> {
  const supabase = await createClient();

  // Independent queries — run them in parallel (one round-trip instead of two).
  const [{ data: idea }, { data: validation }] = await Promise.all([
    supabase
      .from("idea")
      .select("id, name, project_id, project:project_id(id, name)")
      .eq("id", ideaId)
      .maybeSingle(),
    supabase
      .from("mkt_validation" as never)
      .select("*")
      .eq("idea_id", ideaId)
      .maybeSingle(),
  ]);

  if (!idea) return null;

  type IdeaRow = {
    id: string;
    name: string | null;
    project_id: string | null;
    project: { id: string; name: string | null } | null;
  };
  const row = idea as unknown as IdeaRow;

  return {
    ideaId,
    ideaName: row.name,
    projectId: row.project_id,
    projectName: row.project?.name ?? null,
    validation: (validation as unknown as MktValidation) ?? null,
  };
}

/** Roll up the honest funnel metrics for an idea. */
export async function getFunnelMetrics(
  ideaId: string
): Promise<MktFunnelMetrics> {
  const supabase = await createClient();

  async function countEvent(type: string): Promise<number> {
    const { count } = await supabase
      .from("mkt_event" as never)
      .select("id", { count: "exact", head: true })
      .eq("idea_id", ideaId)
      .eq("type", type);
    return count ?? 0;
  }
  async function countSignal(type: string): Promise<number> {
    const { count } = await supabase
      .from("mkt_signal" as never)
      .select("id", { count: "exact", head: true })
      .eq("idea_id", ideaId)
      .eq("type", type);
    return count ?? 0;
  }
  async function countOutreach(field: "sent_at" | "opened_at" | "replied_at"): Promise<number> {
    const { count } = await supabase
      .from("mkt_outreach" as never)
      .select("id", { count: "exact", head: true })
      .eq("idea_id", ideaId)
      .not(field, "is", null);
    return count ?? 0;
  }
  async function countProspects(): Promise<number> {
    const { count } = await supabase
      .from("mkt_prospect" as never)
      .select("id", { count: "exact", head: true })
      .eq("idea_id", ideaId);
    return count ?? 0;
  }

  async function preorderAmount(): Promise<number> {
    const { data } = await supabase
      .from("mkt_signal" as never)
      .select("amount_cents")
      .eq("idea_id", ideaId)
      .eq("type", "preorder");
    return ((data as unknown as { amount_cents: number | null }[]) ?? []).reduce(
      (sum, r) => sum + (r.amount_cents ?? 0),
      0
    );
  }

  const [
    views,
    clicks,
    quiz,
    waitlist,
    preorders,
    preorder_amount_cents,
    prospects,
    sent,
    opened,
    replied,
  ] = await Promise.all([
    countEvent("view"),
    countEvent("click"),
    countSignal("quiz"),
    countSignal("waitlist"),
    countSignal("preorder"),
    preorderAmount(),
    countProspects(),
    countOutreach("sent_at"),
    countOutreach("opened_at"),
    countOutreach("replied_at"),
  ]);

  return {
    views,
    clicks,
    quiz,
    waitlist,
    preorders,
    preorder_amount_cents,
    prospects,
    sent,
    opened,
    replied,
  };
}

/** Extra flags for the dashboard getting-started checklist + content metrics. */
export async function getOnboardingExtras(ideaId: string): Promise<{
  landingPublished: boolean;
  contentCount: number;
  contentScheduled: number;
  contentPosted: number;
  contentDraft: number;
}> {
  const supabase = await createClient();
  const [
    { count: landings },
    { count: contentAll },
    { count: contentScheduled },
    { count: contentPosted },
    { count: contentDraft },
  ] = await Promise.all([
    supabase
      .from("mkt_landing" as never)
      .select("id", { count: "exact", head: true })
      .eq("idea_id", ideaId)
      .eq("published", true),
    supabase
      .from("mkt_content" as never)
      .select("id", { count: "exact", head: true })
      .eq("idea_id", ideaId),
    supabase
      .from("mkt_content" as never)
      .select("id", { count: "exact", head: true })
      .eq("idea_id", ideaId)
      .eq("status", "scheduled"),
    supabase
      .from("mkt_content" as never)
      .select("id", { count: "exact", head: true })
      .eq("idea_id", ideaId)
      .eq("status", "posted"),
    supabase
      .from("mkt_content" as never)
      .select("id", { count: "exact", head: true })
      .eq("idea_id", ideaId)
      .eq("status", "draft"),
  ]);
  return {
    landingPublished: (landings ?? 0) > 0,
    contentCount: contentAll ?? 0,
    contentScheduled: contentScheduled ?? 0,
    contentPosted: contentPosted ?? 0,
    contentDraft: contentDraft ?? 0,
  };
}

// ── Decision Contract progress ────────────────────────────────────────────────

/** A contract metric with its computed live value and n-gated verdict. */
export interface ContractMetricProgress extends ContractMetric {
  /** Live value, or null when the metric isn't auto-computable. */
  current: number | null;
  /** Sample size backing the value (sessions for rates, denominators otherwise). */
  sample: number;
  /** true/false once the minimum sample is reached; null = insufficient data. */
  met: boolean | null;
}

/** Metric keys whose value is a percentage (n-gated on their denominator). */
const RATE_METRICS = new Set([
  "visitor_to_capture_rate",
  "icp_capture_share",
  "outreach_reply_rate",
  "pricing_click_rate",
]);

/**
 * Compute live progress against the pre-registered Decision Contract.
 * Rates below their min_sample render as "insufficient data" (met: null) —
 * never as a confident-looking percentage built on noise.
 */
export async function getContractProgress(
  ideaId: string,
  contract: DecisionContract,
  m: MktFunnelMetrics
): Promise<ContractMetricProgress[]> {
  const metricsWanted = contract.success_metrics ?? [];
  if (metricsWanted.length === 0) return [];

  const supabase = await createClient();

  // Unique sessions (the honest denominator for visitor rates).
  const { data: viewRows } = await supabase
    .from("mkt_event" as never)
    .select("session_id")
    .eq("idea_id", ideaId)
    .eq("type", "view");
  const sessions = new Set(
    ((viewRows ?? []) as { session_id: string | null }[])
      .map((r) => r.session_id)
      .filter(Boolean)
  ).size;

  async function countEvent(type: string): Promise<number> {
    const { count } = await supabase
      .from("mkt_event" as never)
      .select("id", { count: "exact", head: true })
      .eq("idea_id", ideaId)
      .eq("type", type);
    return count ?? 0;
  }

  const needs = new Set(metricsWanted.map((x) => x.metric));
  const [verified, icpFit, meetings, strongInterviews, pricingClicks] = await Promise.all([
    needs.has("verified_captures")
      ? supabase
          .from("mkt_signal" as never)
          .select("id", { count: "exact", head: true })
          .eq("idea_id", ideaId)
          .not("verified_at", "is", null)
          .then((r) => r.count ?? 0)
      : Promise.resolve(0),
    needs.has("icp_capture_share")
      ? supabase
          .from("mkt_signal" as never)
          .select("id", { count: "exact", head: true })
          .eq("idea_id", ideaId)
          .eq("icp_fit", true)
          .then((r) => r.count ?? 0)
      : Promise.resolve(0),
    needs.has("meetings_booked") ? countEvent("meeting_booked") : Promise.resolve(0),
    needs.has("interviews_strong_evidence")
      ? supabase
          .from("mkt_interview" as never)
          .select("id", { count: "exact", head: true })
          .eq("idea_id", ideaId)
          .eq("analysis->>evidence_grade", "strong")
          .then((r) => r.count ?? 0)
      : Promise.resolve(0),
    needs.has("pricing_click_rate") ? countEvent("pricing_click") : Promise.resolve(0),
  ]);

  const captures = m.quiz + m.waitlist + m.preorders;

  return metricsWanted.map((cm) => {
    let current: number | null = null;
    let sample = sessions;

    switch (cm.metric) {
      case "visitor_to_capture_rate":
        current = sessions > 0 ? (captures / sessions) * 100 : 0;
        sample = sessions;
        break;
      case "verified_captures":
        current = verified;
        break;
      case "icp_capture_share":
        current = captures > 0 ? (icpFit / captures) * 100 : 0;
        sample = captures;
        break;
      case "outreach_reply_rate":
        current = m.sent > 0 ? (m.replied / m.sent) * 100 : 0;
        sample = m.sent;
        break;
      case "meetings_booked":
        current = meetings;
        break;
      case "interviews_strong_evidence":
        current = strongInterviews;
        break;
      case "pricing_click_rate":
        current = sessions > 0 ? (pricingClicks / sessions) * 100 : 0;
        sample = sessions;
        break;
      case "preorders":
        current = m.preorders;
        break;
      default:
        current = null; // manual / unknown metric
    }

    const isRate = RATE_METRICS.has(cm.metric);
    let met: boolean | null = null;
    if (current !== null) {
      if (isRate && sample < (cm.min_sample ?? 0)) {
        met = null; // insufficient data — refuse to judge
      } else {
        met = current >= cm.threshold;
      }
    }

    return { ...cm, current, sample, met };
  });
}

/**
 * Funnel metrics for many ideas at once (portfolio view).
 */
export async function getPortfolioMetricsMap(
  ideaIds: string[]
): Promise<Record<string, MktFunnelMetrics>> {
  const entries = await Promise.all(
    ideaIds.map(async (id) => [id, await getFunnelMetrics(id)] as const)
  );
  return Object.fromEntries(entries);
}
