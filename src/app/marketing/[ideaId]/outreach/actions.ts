"use server";

/**
 * Server actions for an idea's outreach engine (Phase 3).
 *  - prospects: manual add + CSV import + list (Apify auto-sourcing = Phase 2)
 *  - campaigns + sequence steps
 *  - enrollment: queue step 1 of a campaign for selected prospects
 *  - mark replied (manual; email replies don't flow through Brevo webhooks)
 * Auth: admin / manager.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { processDueOutreach } from "@/lib/marketing/outreach";
import type {
  MktCampaign,
  MktChannel,
  MktProspect,
  MktSequenceStep,
  MktOutreach,
} from "@/types/marketing";

const STAFF = ["admin", "manager"] as const;

async function getAdminClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." as const };
  const { data: profile } = await supabase
    .from("profiles")
    .select("type")
    .eq("id", user.id)
    .single();
  if (!STAFF.includes((profile?.type ?? "") as (typeof STAFF)[number])) {
    return { error: "Forbidden." as const };
  }
  return { supabase, user };
}

function rp(ideaId: string) {
  revalidatePath(`/marketing/${ideaId}/outreach`);
}

// ── Prospects ───────────────────────────────────────────────────────────────

export async function listProspects(ideaId: string): Promise<MktProspect[]> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return [];
  const { data } = await ctx.supabase
    .from("mkt_prospect" as never)
    .select("*")
    .eq("idea_id", ideaId)
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as MktProspect[];
}

export interface ProspectInput {
  name?: string | null;
  email: string;
  company?: string | null;
  title?: string | null;
  linkedin_url?: string | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function addProspect(
  ideaId: string,
  input: ProspectInput
): Promise<{ error?: string; id?: string }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error };

  const email = input.email?.trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) return { error: "A valid email is required." };

  const { data, error } = await ctx.supabase
    .from("mkt_prospect" as never)
    .insert({
      idea_id: ideaId,
      name: input.name?.trim() || null,
      email,
      company: input.company?.trim() || null,
      title: input.title?.trim() || null,
      linkedin_url: input.linkedin_url?.trim() || null,
      source: "manual",
      created_by: ctx.user.id,
    } as never)
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "That email is already a prospect." };
    return { error: error.message };
  }
  rp(ideaId);
  return { id: (data as unknown as { id: string }).id };
}

/** Bulk import from parsed CSV rows. Returns counts. Dupes are skipped quietly. */
export async function importProspects(
  ideaId: string,
  rows: ProspectInput[]
): Promise<{ error?: string; inserted: number; skipped: number }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error, inserted: 0, skipped: 0 };

  let inserted = 0;
  let skipped = 0;
  for (const r of rows) {
    const email = r.email?.trim().toLowerCase();
    if (!email || !EMAIL_RE.test(email)) {
      skipped++;
      continue;
    }
    const { error } = await ctx.supabase.from("mkt_prospect" as never).insert({
      idea_id: ideaId,
      name: r.name?.trim() || null,
      email,
      company: r.company?.trim() || null,
      title: r.title?.trim() || null,
      linkedin_url: r.linkedin_url?.trim() || null,
      source: "csv",
      created_by: ctx.user.id,
    } as never);
    if (error) skipped++;
    else inserted++;
  }
  rp(ideaId);
  return { inserted, skipped };
}

export async function deleteProspect(
  ideaId: string,
  prospectId: string
): Promise<{ error?: string }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error };
  const { error } = await ctx.supabase
    .from("mkt_prospect" as never)
    .delete()
    .eq("id", prospectId)
    .eq("idea_id", ideaId);
  if (error) return { error: error.message };
  rp(ideaId);
  return {};
}

// ── Campaigns ───────────────────────────────────────────────────────────────

export async function listCampaigns(ideaId: string): Promise<MktCampaign[]> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return [];
  const { data } = await ctx.supabase
    .from("mkt_campaign" as never)
    .select("*")
    .eq("idea_id", ideaId)
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as MktCampaign[];
}

export async function createCampaign(
  ideaId: string,
  name: string,
  channel: MktChannel = "email"
): Promise<{ error?: string; id?: string }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error };
  if (!name.trim()) return { error: "Campaign name is required." };

  const { data, error } = await ctx.supabase
    .from("mkt_campaign" as never)
    .insert({
      idea_id: ideaId,
      name: name.trim(),
      channel,
      status: "draft",
      created_by: ctx.user.id,
    } as never)
    .select("id")
    .single();
  if (error) return { error: error.message };
  rp(ideaId);
  return { id: (data as unknown as { id: string }).id };
}

export async function setCampaignStatus(
  ideaId: string,
  campaignId: string,
  status: string
): Promise<{ error?: string }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error };
  const { error } = await ctx.supabase
    .from("mkt_campaign" as never)
    .update({ status } as never)
    .eq("id", campaignId)
    .eq("idea_id", ideaId);
  if (error) return { error: error.message };
  rp(ideaId);
  revalidatePath(`/marketing/${ideaId}/outreach/${campaignId}`);
  return {};
}

// ── Sequence steps ────────────────────────────────────────────────────────────

export async function listSteps(
  ideaId: string,
  campaignId: string
): Promise<MktSequenceStep[]> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return [];
  const { data } = await ctx.supabase
    .from("mkt_sequence_step" as never)
    .select("*")
    .eq("campaign_id", campaignId)
    .order("step_order", { ascending: true });
  return (data ?? []) as unknown as MktSequenceStep[];
}

export interface StepInput {
  step_order: number;
  delay_days: number;
  subject_tpl: string;
  body_tpl: string;
  ai_personalise: boolean;
}

export async function saveStep(
  ideaId: string,
  campaignId: string,
  input: StepInput & { id?: string }
): Promise<{ error?: string; id?: string }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error };

  const row = {
    idea_id: ideaId,
    campaign_id: campaignId,
    step_order: input.step_order,
    delay_days: Math.max(0, input.delay_days | 0),
    subject_tpl: input.subject_tpl,
    body_tpl: input.body_tpl,
    ai_personalise: input.ai_personalise,
  };

  let res;
  if (input.id) {
    res = await ctx.supabase
      .from("mkt_sequence_step" as never)
      .update(row as never)
      .eq("id", input.id)
      .select("id")
      .single();
  } else {
    res = await ctx.supabase
      .from("mkt_sequence_step" as never)
      .insert(row as never)
      .select("id")
      .single();
  }
  if (res.error) return { error: res.error.message };
  revalidatePath(`/marketing/${ideaId}/outreach/${campaignId}`);
  return { id: (res.data as unknown as { id: string }).id };
}

export async function deleteStep(
  ideaId: string,
  campaignId: string,
  stepId: string
): Promise<{ error?: string }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error };
  const { error } = await ctx.supabase
    .from("mkt_sequence_step" as never)
    .delete()
    .eq("id", stepId)
    .eq("idea_id", ideaId);
  if (error) return { error: error.message };
  revalidatePath(`/marketing/${ideaId}/outreach/${campaignId}`);
  return {};
}

// ── Enrollment + status ─────────────────────────────────────────────────────

export async function listOutreach(
  ideaId: string,
  campaignId: string
): Promise<MktOutreach[]> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return [];
  const { data } = await ctx.supabase
    .from("mkt_outreach" as never)
    .select("*")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as MktOutreach[];
}

/**
 * Enroll prospects into a campaign: queue the first sequence step for each
 * prospect not already enrolled. scheduled_at = now + step1.delay_days.
 */
export async function enrollProspects(
  ideaId: string,
  campaignId: string,
  prospectIds: string[]
): Promise<{ error?: string; enrolled: number }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error, enrolled: 0 };
  if (prospectIds.length === 0) return { error: "Select at least one prospect.", enrolled: 0 };

  const { data: stepData } = await ctx.supabase
    .from("mkt_sequence_step" as never)
    .select("step_order, delay_days")
    .eq("campaign_id", campaignId)
    .order("step_order", { ascending: true })
    .limit(1)
    .maybeSingle();
  const firstStep = stepData as unknown as { step_order: number; delay_days: number } | null;
  if (!firstStep) return { error: "Add at least one sequence step first.", enrolled: 0 };

  const { data: existing } = await ctx.supabase
    .from("mkt_outreach" as never)
    .select("prospect_id")
    .eq("campaign_id", campaignId);
  const already = new Set(
    ((existing ?? []) as unknown as { prospect_id: string }[]).map((r) => r.prospect_id)
  );

  const when = new Date(
    Date.now() + (firstStep.delay_days ?? 0) * 86_400_000
  ).toISOString();

  const toInsert = prospectIds
    .filter((id) => !already.has(id))
    .map((prospect_id) => ({
      idea_id: ideaId,
      prospect_id,
      campaign_id: campaignId,
      step_order: firstStep.step_order,
      status: "queued",
      scheduled_at: when,
    }));

  if (toInsert.length === 0) return { enrolled: 0 };

  const { error } = await ctx.supabase
    .from("mkt_outreach" as never)
    .insert(toInsert as never);
  if (error) return { error: error.message, enrolled: 0 };

  revalidatePath(`/marketing/${ideaId}/outreach/${campaignId}`);
  return { enrolled: toInsert.length };
}

/**
 * Admin "process now" — run the outreach worker immediately instead of waiting
 * for the Vercel Cron tick.
 */
export async function runOutreachNow(
  ideaId: string,
  campaignId?: string
): Promise<{ error?: string; processed?: number; sent?: number; failed?: number }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error };
  const r = await processDueOutreach(50);
  rp(ideaId);
  if (campaignId) revalidatePath(`/marketing/${ideaId}/outreach/${campaignId}`);
  return { processed: r.processed, sent: r.sent, failed: r.failed };
}

/** Manually mark an outreach row as replied. */
export async function markReplied(
  ideaId: string,
  outreachId: string,
  replied: boolean
): Promise<{ error?: string }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error };
  const { error } = await ctx.supabase
    .from("mkt_outreach" as never)
    .update({
      status: replied ? "replied" : "sent",
      replied_at: replied ? new Date().toISOString() : null,
    } as never)
    .eq("id", outreachId)
    .eq("idea_id", ideaId);
  if (error) return { error: error.message };
  revalidatePath(`/marketing/${ideaId}/outreach`);
  return {};
}
