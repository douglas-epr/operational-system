/**
 * Admin-side data access for the Marketing Validation Engine.
 * Used by the gated /marketing/[projectId]/* server components.
 * Relies on RLS (admin/manager) via the standard server client.
 */

import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { MktValidation, MktFunnelMetrics } from "@/types/marketing";

export interface ProjectContext {
  projectId: string;
  projectName: string | null;
  validation: MktValidation | null;
}

/** Load a project's name + validation config. Returns null if project missing. */
export async function getProjectContext(
  projectId: string
): Promise<ProjectContext | null> {
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("project")
    .select("id, name")
    .eq("id", projectId)
    .maybeSingle();

  if (!project) return null;

  const { data: validation } = await supabase
    .from("mkt_validation" as never)
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();

  return {
    projectId,
    projectName: (project as { name: string | null }).name,
    validation: (validation as unknown as MktValidation) ?? null,
  };
}

/** Roll up the honest funnel metrics for a project. */
export async function getFunnelMetrics(
  projectId: string
): Promise<MktFunnelMetrics> {
  const supabase = await createClient();

  async function countEvent(type: string): Promise<number> {
    const { count } = await supabase
      .from("mkt_event" as never)
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("type", type);
    return count ?? 0;
  }
  async function countSignal(type: string): Promise<number> {
    const { count } = await supabase
      .from("mkt_signal" as never)
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("type", type);
    return count ?? 0;
  }
  async function countOutreach(field: "sent_at" | "opened_at" | "replied_at"): Promise<number> {
    const { count } = await supabase
      .from("mkt_outreach" as never)
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .not(field, "is", null);
    return count ?? 0;
  }
  async function countProspects(): Promise<number> {
    const { count } = await supabase
      .from("mkt_prospect" as never)
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId);
    return count ?? 0;
  }

  // Pre-order amount sum (small set; fetch and reduce).
  async function preorderAmount(): Promise<number> {
    const { data } = await supabase
      .from("mkt_signal" as never)
      .select("amount_cents")
      .eq("project_id", projectId)
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
export async function getOnboardingExtras(projectId: string): Promise<{
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
      .eq("project_id", projectId)
      .eq("published", true),
    supabase
      .from("mkt_content" as never)
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId),
    supabase
      .from("mkt_content" as never)
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("status", "scheduled"),
    supabase
      .from("mkt_content" as never)
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("status", "posted"),
    supabase
      .from("mkt_content" as never)
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
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

/**
 * Funnel metrics for many projects at once (portfolio view). Uses accurate
 * count queries per project (reuses getFunnelMetrics) — fine for the small
 * number of validating projects; revisit with an RPC if it grows large.
 */
export async function getPortfolioMetricsMap(
  projectIds: string[]
): Promise<Record<string, MktFunnelMetrics>> {
  const entries = await Promise.all(
    projectIds.map(async (id) => [id, await getFunnelMetrics(id)] as const)
  );
  return Object.fromEntries(entries);
}
