"use server";

/**
 * Paid-traffic tracker actions (signal-accuracy report, Part I-1).
 *
 * v1 is deliberately manual: campaigns get a locked-UTM ad URL that staff paste
 * into Meta/Google/LinkedIn Ads Manager, and spend is entered by hand. What IS
 * automatic is attribution — ViewBeacon stores UTM on mkt_event and the capture
 * route stores it on mkt_signal, so sessions/captures/cost-per-capture join on
 * utm_campaign with zero ads-API integration.
 *
 * Auth: admin / manager.
 */

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { resolveAiConfig } from "@/lib/api/ai-config";
import { generateAiJsonResponse } from "@/lib/api/ai-dispatcher";
import { slugify } from "@/lib/marketing/slug";
import type { MktAdCampaign, MktAdPlatform, MktAdStatus } from "@/types/marketing";

const STAFF = ["admin", "manager"] as const;
const AD_CREATIVE_PROMPT_NAME = "1. Ad Creative";

async function getAdminClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." as const };
  const { data: profile } = await supabase.from("profiles").select("type").eq("id", user.id).single();
  if (!STAFF.includes((profile?.type ?? "") as (typeof STAFF)[number])) {
    return { error: "Forbidden." as const };
  }
  return { supabase, user };
}

/** Per-campaign attribution metrics, joined on utm_campaign. */
export interface AdCampaignMetrics {
  sessions: number;
  captures: number;
  verifiedCaptures: number;
  icpCaptures: number;
}

export interface AdCampaignWithMetrics extends MktAdCampaign {
  metrics: AdCampaignMetrics;
}

/** List campaigns with their attributed sessions/captures. */
export async function listAdCampaigns(
  ideaId: string
): Promise<{ campaigns: AdCampaignWithMetrics[]; landingSlug: string | null }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { campaigns: [], landingSlug: null };

  const [{ data: rows }, { data: landingRow }] = await Promise.all([
    ctx.supabase
      .from("mkt_ad_campaign" as never)
      .select("*")
      .eq("idea_id", ideaId)
      .order("created_at", { ascending: false }),
    ctx.supabase
      .from("mkt_landing" as never)
      .select("slug")
      .eq("idea_id", ideaId)
      .limit(1)
      .maybeSingle(),
  ]);

  const campaigns = (rows ?? []) as unknown as MktAdCampaign[];
  const landingSlug = (landingRow as { slug: string } | null)?.slug ?? null;

  const withMetrics = await Promise.all(
    campaigns.map(async (c) => {
      const [{ data: viewRows }, { data: signalRows }] = await Promise.all([
        ctx.supabase
          .from("mkt_event" as never)
          .select("session_id")
          .eq("idea_id", ideaId)
          .eq("type", "view")
          .filter("utm->>utm_campaign", "eq", c.utm_campaign),
        ctx.supabase
          .from("mkt_signal" as never)
          .select("verified_at, icp_fit")
          .eq("idea_id", ideaId)
          .filter("utm->>utm_campaign", "eq", c.utm_campaign),
      ]);
      const sessions = new Set(
        ((viewRows ?? []) as { session_id: string | null }[])
          .map((r) => r.session_id)
          .filter(Boolean)
      ).size;
      const sigs = (signalRows ?? []) as { verified_at: string | null; icp_fit: boolean | null }[];
      return {
        ...c,
        metrics: {
          sessions,
          captures: sigs.length,
          verifiedCaptures: sigs.filter((s) => s.verified_at).length,
          icpCaptures: sigs.filter((s) => s.icp_fit === true).length,
        },
      };
    })
  );

  return { campaigns: withMetrics, landingSlug };
}

export interface SaveAdCampaignInput {
  id?: string;
  platform: MktAdPlatform;
  name: string;
  status?: MktAdStatus;
  budget_cents?: number;
  spend_cents?: number;
  targeting_notes?: string | null;
}

/** Create or update a campaign. utm_campaign is locked at creation. */
export async function saveAdCampaign(
  ideaId: string,
  input: SaveAdCampaignInput
): Promise<{ error?: string; id?: string }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error };
  if (!input.name?.trim()) return { error: "Campaign name is required." };

  if (input.id) {
    const patch: Record<string, unknown> = {
      platform: input.platform,
      name: input.name.trim(),
      targeting_notes: input.targeting_notes?.trim() || null,
    };
    if (input.status !== undefined) patch.status = input.status;
    if (input.budget_cents !== undefined) patch.budget_cents = Math.max(0, input.budget_cents);
    if (input.spend_cents !== undefined) patch.spend_cents = Math.max(0, input.spend_cents);
    if (input.status === "live") patch.started_at = new Date().toISOString();
    if (input.status === "ended") patch.ended_at = new Date().toISOString();

    const { error } = await ctx.supabase
      .from("mkt_ad_campaign" as never)
      .update(patch as never)
      .eq("id", input.id)
      .eq("idea_id", ideaId);
    if (error) return { error: error.message };
    revalidatePath(`/marketing/${ideaId}/traffic`);
    return { id: input.id };
  }

  // Locked UTM slug: platform + name + random suffix (unique, never edited).
  const utmCampaign = `${input.platform}-${slugify(input.name).slice(0, 32)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;

  const { data, error } = await ctx.supabase
    .from("mkt_ad_campaign" as never)
    .insert({
      idea_id: ideaId,
      platform: input.platform,
      name: input.name.trim(),
      status: "draft",
      budget_cents: Math.max(0, input.budget_cents ?? 0),
      targeting_notes: input.targeting_notes?.trim() || null,
      utm_campaign: utmCampaign,
      created_by: ctx.user.id,
    } as never)
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath(`/marketing/${ideaId}/traffic`);
  return { id: (data as unknown as { id: string }).id };
}

/** Delete a campaign (its attributed events/signals stay — they're evidence). */
export async function deleteAdCampaign(
  ideaId: string,
  campaignId: string
): Promise<{ error?: string }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error };
  const { error } = await ctx.supabase
    .from("mkt_ad_campaign" as never)
    .delete()
    .eq("id", campaignId)
    .eq("idea_id", ideaId);
  if (error) return { error: error.message };
  revalidatePath(`/marketing/${ideaId}/traffic`);
  return {};
}

interface AdCreativeOutput {
  variants: {
    angle: string;
    primary_text: string;
    headline: string;
    description: string;
    visual_direction: string;
  }[];
  targeting_tips: string;
}

/**
 * Generate 3 ad-copy variants for a campaign from positioning + brand DNA,
 * stored on the campaign row (ad_creative JSONB) for copy-paste into Ads Manager.
 */
export async function generateAdCreative(
  ideaId: string,
  campaignId: string
): Promise<{ error?: string; creative?: AdCreativeOutput }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error };

  const cfg = await resolveAiConfig(ctx.supabase, ctx.user.id);
  if (!cfg) return { error: "No AI service configured (Settings → AI)." };

  const sb = createServiceClient();
  const { data: promptRow } = await sb
    .from("prompt")
    .select("description")
    .eq("name", AD_CREATIVE_PROMPT_NAME)
    .maybeSingle();
  const template = (promptRow as { description: string } | null)?.description;
  if (!template) return { error: `Prompt "${AD_CREATIVE_PROMPT_NAME}" not found in database.` };

  const [{ data: campaignRow }, { data: v }, { data: ideaRow }] = await Promise.all([
    ctx.supabase
      .from("mkt_ad_campaign" as never)
      .select("platform, targeting_notes")
      .eq("id", campaignId)
      .eq("idea_id", ideaId)
      .maybeSingle(),
    ctx.supabase
      .from("mkt_validation" as never)
      .select("positioning, icp_definition")
      .eq("idea_id", ideaId)
      .maybeSingle(),
    ctx.supabase.from("idea").select("name").eq("id", ideaId).maybeSingle(),
  ]);

  const campaign = campaignRow as { platform: string; targeting_notes: string | null } | null;
  if (!campaign) return { error: "Campaign not found." };
  const validation = v as { positioning: string | null; icp_definition: Record<string, string> | null } | null;
  const dna = validation?.icp_definition ?? {};

  let promptText = template;
  const vars: Record<string, string> = {
    idea_name: (ideaRow as { name: string | null } | null)?.name ?? "",
    platform: campaign.platform,
    positioning: validation?.positioning ?? "",
    description: dna.description ?? "",
    target_audience: dna.target_audience ?? "",
    communication_style: dna.communication_style ?? "",
    targeting_notes: campaign.targeting_notes ?? "",
  };
  for (const [key, value] of Object.entries(vars)) {
    promptText = promptText.replaceAll(`{{${key}}}`, value || "(not specified)");
  }

  const res = await generateAiJsonResponse<AdCreativeOutput>({
    service: cfg.service,
    apiKey: cfg.apiKey,
    model: cfg.model,
    prompt: promptText,
  });
  if (res.returned_an_error || !res.data) {
    return { error: res.error ?? "AI generation failed." };
  }

  await ctx.supabase
    .from("mkt_ad_campaign" as never)
    .update({ ad_creative: res.data } as never)
    .eq("id", campaignId)
    .eq("idea_id", ideaId);

  revalidatePath(`/marketing/${ideaId}/traffic`);
  return { creative: res.data };
}
