"use server";

/**
 * Sourcing actions (Phase 2) — Apify Google Maps + B2B leads + Social Discovery.
 * Start an async Apify run, then sync (poll + import) manually or via cron.
 * Auth: admin / manager.
 */

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { resolveAiConfig } from "@/lib/api/ai-config";
import { generateAiJsonResponse } from "@/lib/api/ai-dispatcher";
import {
  startActorRun,
  buildGoogleMapsInput,
  buildLeadsInput,
  buildLocationKeywords,
  registerRunWebhook,
  GOOGLE_MAPS_ACTOR,
  LEADS_ACTOR,
  startLinkedInBioSearch,
  startInstagramBioSearch,
  startFacebookBioSearch,
  startYouTubeBioSearch,
  startTwitterBioSearch,
  startTikTokBioSearch,
  startLinkedInContentSearch,
  startInstagramContentSearch,
  startFacebookContentSearch,
  startYouTubeContentSearch,
  startTwitterContentSearch,
  startTikTokContentSearch,
  startLinkedInEnrichment,
  startWebsiteEmailExtraction,
  type GoogleMapsParams,
  type LeadsParams,
  type SocialPlatform,
  type DiscoveryMode,
  type SocialActorRun,
} from "@/lib/api/apify";

/** Build the Apify→app webhook URL for a given DB source-run ID. */
function apifyWebhookUrl(dbRunId: string): string | null {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
  const secret = process.env.CRON_SECRET;
  if (!appUrl || !secret) return null;
  return `${appUrl}/api/mkt/apify-webhook?sourceRunId=${dbRunId}&token=${secret}`;
}
import { importSourceRun } from "@/lib/marketing/sourcing";
import type { MktSourceRun, MktProspect } from "@/types/marketing";

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

export async function listSourceRuns(ideaId: string): Promise<MktSourceRun[]> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return [];
  const { data } = await ctx.supabase
    .from("mkt_source_run" as never)
    .select("*")
    .eq("idea_id", ideaId)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []) as unknown as MktSourceRun[];
}

/** Kick off a Google Maps sourcing run (async). Records a mkt_source_run row. */
export async function startGoogleMapsSourcing(
  ideaId: string,
  params: GoogleMapsParams
): Promise<{ error?: string; id?: string }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error };

  const terms = params.searchTerms.map((t) => t.trim()).filter(Boolean);
  if (terms.length === 0) return { error: "Enter at least one search term." };
  if (!params.location.trim()) return { error: "Enter a location." };

  const input = buildGoogleMapsInput({ ...params, searchTerms: terms });

  let run;
  try {
    run = await startActorRun(GOOGLE_MAPS_ACTOR, input);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to start Apify run." };
  }

  const { data, error } = await ctx.supabase
    .from("mkt_source_run" as never)
    .insert({
      idea_id: ideaId,
      channel: "google_maps",
      query: input,
      status: "running",
      result_count: 0,
      apify_dataset_ref: run.id,
      created_by: ctx.user.id,
    } as never)
    .select("id")
    .single();

  if (error) return { error: error.message };
  const dbRunId = (data as unknown as { id: string }).id;
  const webhookUrl = apifyWebhookUrl(dbRunId);
  if (webhookUrl) registerRunWebhook(run.id, webhookUrl).catch(() => {});
  revalidatePath(`/marketing/${ideaId}/sourcing`);
  return { id: dbRunId };
}

/**
 * Kick off a B2B people-search run (async) via the Apollo-alternative leads actor.
 */
export async function startLeadsSourcing(
  ideaId: string,
  params: LeadsParams
): Promise<{ error?: string; id?: string }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error };

  const jobTitles = params.jobTitles.map((t) => t.trim()).filter(Boolean);
  const keywords = params.keywords.map((k) => k.trim()).filter(Boolean);
  const locations = params.locations.map((l) => l.trim()).filter(Boolean);
  if (jobTitles.length === 0 && keywords.length === 0) {
    return { error: "Enter at least a job title or a company keyword." };
  }

  const input = buildLeadsInput({ ...params, jobTitles, keywords, locations });

  let run;
  try {
    run = await startActorRun(LEADS_ACTOR, input);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to start Apify run.";
    if (msg.includes("full-permission-actor-not-approved") || msg.includes("approvePermissions")) {
      return {
        error:
          "One-time setup needed: approve this Apify actor's permissions, then retry. " +
          "Open https://console.apify.com/actors/IoSHqwTR9YGhzccez?approvePermissions=true and click Approve.",
      };
    }
    return { error: msg };
  }

  const { data, error } = await ctx.supabase
    .from("mkt_source_run" as never)
    .insert({
      idea_id: ideaId,
      channel: "linkedin",
      query: input,
      status: "running",
      result_count: 0,
      apify_dataset_ref: run.id,
      created_by: ctx.user.id,
    } as never)
    .select("id")
    .single();

  if (error) return { error: error.message };
  const dbRunId = (data as unknown as { id: string }).id;
  const webhookUrl = apifyWebhookUrl(dbRunId);
  if (webhookUrl) registerRunWebhook(run.id, webhookUrl).catch(() => {});
  revalidatePath(`/marketing/${ideaId}/sourcing`);
  return { id: dbRunId };
}

/** Manually poll + import a run (also done automatically by the cron). */
export async function syncSourcingRun(
  ideaId: string,
  sourceRunId: string
): Promise<{ error?: string; status?: string; inserted?: number }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error };
  const r = await importSourceRun(sourceRunId);
  revalidatePath(`/marketing/${ideaId}/sourcing`);
  return { status: r.status, inserted: r.inserted };
}

// ── Social Discovery Pipeline ─────────────────────────────────────────────────

export interface SocialDiscoveryParams {
  keywords: string[];
  location: string;
  platforms: SocialPlatform[];
  discoveryMode: DiscoveryMode;
  maxPerPlatform: number;
}

/**
 * Fire Stage 0 (reference source seeds) + Stage 1 (keyword discovery) actors
 * in parallel, then write the full pipeline state to mkt_source_run.query.
 */
export async function startSocialDiscovery(
  ideaId: string,
  params: SocialDiscoveryParams
): Promise<{ error?: string; id?: string }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error };

  const keywords = params.keywords.map((k) => k.trim()).filter(Boolean);
  const location = params.location.trim();

  // Load reference sources via service client to bypass RLS.
  const sb = createServiceClient();
  const { data: validationRow } = await sb
    .from("mkt_validation" as never)
    .select("reference_sources")
    .eq("idea_id", ideaId)
    .maybeSingle();
  const refSources = ((validationRow as { reference_sources?: Record<string, string[]> } | null)
    ?.reference_sources) ?? {};

  if (keywords.length === 0 && Object.keys(refSources).length === 0) {
    return { error: "Enter keywords or add Reference Sources on the Positioning page." };
  }

  // ── Stage 0: fire enrichment actors on reference source URLs ─────────────
  const stage0: Record<string, SocialActorRun> = {};

  async function tryRun(key: string, fn: () => Promise<SocialActorRun>) {
    try { stage0[key] = await fn(); } catch { /* skip — non-fatal */ }
  }

  const websiteUrls = refSources["websites"] ?? [];
  if (websiteUrls.length) await tryRun("websites", () => startWebsiteEmailExtraction(websiteUrls.slice(0, 100)));

  const liUrls = [...(refSources["linkedin_users"] ?? []), ...(refSources["linkedin_posts"] ?? [])];
  if (liUrls.length) await tryRun("linkedin", () => startLinkedInEnrichment(liUrls.slice(0, 100)));

  const ytUrls = [...(refSources["youtube_channels"] ?? []), ...(refSources["youtube_videos"] ?? [])];
  if (ytUrls.length) await tryRun("youtube", () => startYouTubeBioSearch(ytUrls, location, ytUrls.length));

  const fbUrls = [...(refSources["facebook_users"] ?? []), ...(refSources["facebook_posts"] ?? [])];
  if (fbUrls.length) await tryRun("facebook", () => startFacebookBioSearch(fbUrls, location, fbUrls.length));

  const twUrls = [...(refSources["twitter_users"] ?? []), ...(refSources["twitter_posts"] ?? [])];
  if (twUrls.length) await tryRun("twitter", () => startTwitterBioSearch(twUrls, params.maxPerPlatform));

  const ttUrls = [...(refSources["tiktok_users"] ?? []), ...(refSources["tiktok_posts"] ?? [])];
  if (ttUrls.length) await tryRun("tiktok", () => startTikTokBioSearch(ttUrls, params.maxPerPlatform));

  const igUrls = [...(refSources["instagram_users"] ?? []), ...(refSources["instagram_posts"] ?? [])];
  if (igUrls.length) await tryRun("instagram", () => startInstagramBioSearch(igUrls, params.maxPerPlatform));

  // ── Stage 1: keyword discovery per selected platform ─────────────────────
  const stage1a: Partial<Record<SocialPlatform, SocialActorRun>> = {};
  const stage1b: Partial<Record<SocialPlatform, SocialActorRun>> = {};
  const actorErrors: string[] = [];

  if (keywords.length > 0) {
    const runBio = params.discoveryMode !== "content";
    const runContent = params.discoveryMode !== "bio";
    const injected = buildLocationKeywords(keywords, location);
    const max = params.maxPerPlatform;

    for (const platform of params.platforms) {
      try {
        if (runBio) {
          if (platform === "linkedin")   stage1a.linkedin  = await startLinkedInBioSearch(injected, location, max);
          if (platform === "instagram")  stage1a.instagram = await startInstagramBioSearch(injected, max);
          if (platform === "facebook")   stage1a.facebook  = await startFacebookBioSearch(injected, location, max);
          if (platform === "youtube")    stage1a.youtube   = await startYouTubeBioSearch(injected, location, max);
          if (platform === "twitter")    stage1a.twitter   = await startTwitterBioSearch(injected, max);
          if (platform === "tiktok")     stage1a.tiktok    = await startTikTokBioSearch(injected, max);
        }
        if (runContent) {
          if (platform === "linkedin")   stage1b.linkedin  = await startLinkedInContentSearch(injected, max);
          if (platform === "instagram")  stage1b.instagram = await startInstagramContentSearch(injected, max);
          if (platform === "facebook")   stage1b.facebook  = await startFacebookContentSearch(injected, max);
          if (platform === "youtube")    stage1b.youtube   = await startYouTubeContentSearch(injected, max);
          if (platform === "twitter")    stage1b.twitter   = await startTwitterContentSearch(injected, max);
          if (platform === "tiktok")     stage1b.tiktok    = await startTikTokContentSearch(injected, max);
        }
      } catch (e) {
        actorErrors.push(`${platform}: ${e instanceof Error ? e.message : "failed"}`);
      }
    }
  }

  const totalStarted = Object.keys(stage0).length + Object.keys(stage1a).length + Object.keys(stage1b).length;
  if (totalStarted === 0) {
    const detail = actorErrors.length
      ? actorErrors[0]
      : "No actors could be started. Check your Apify plan and actor permissions.";
    return { error: `Social discovery failed: ${detail}` };
  }

  const query = {
    type: "social_discovery",
    stage: "0_and_1",
    params: {
      keywords,
      location,
      platforms: params.platforms,
      discovery_mode: params.discoveryMode,
      max_per_platform: params.maxPerPlatform,
      has_reference_sources: Object.keys(stage0).length > 0,
    },
    stage0,
    stage1a,
    stage1b,
    collected: {
      linkedin_urls: [] as string[],
      website_urls: [] as string[],
      resolved_profiles: [] as unknown[],
    },
  };

  const { data, error } = await ctx.supabase
    .from("mkt_source_run" as never)
    .insert({
      idea_id: ideaId,
      channel: "social_discovery",
      query,
      status: "running",
      result_count: 0,
      apify_dataset_ref: null,
      created_by: ctx.user.id,
    } as never)
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath(`/marketing/${ideaId}/sourcing`);
  return { id: (data as unknown as { id: string }).id };
}

// ── AI form fill ──────────────────────────────────────────────────────────────

export type SourcingFillType = "google_maps" | "people" | "social_discovery";

interface GoogleMapsFill   { searchTerms: string[]; location: string }
interface PeopleFill       { jobTitles: string[]; companyKeywords: string[]; location: string; seniority: string }
interface SocialFill       { platforms: SocialPlatform[]; discoveryMode: DiscoveryMode; keywords: string[]; location: string }

export type SourcingAiFillResult = GoogleMapsFill | PeopleFill | SocialFill;

/**
 * Use AI to suggest form values for a sourcing form, drawing on all available
 * idea context: idea, ICP, playbook, positioning, Brand DNA, reference sources.
 */
export async function aiFillSourcingForm(
  ideaId: string,
  formType: SourcingFillType
): Promise<{ error?: string; data?: SourcingAiFillResult }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error };

  const cfg = await resolveAiConfig(ctx.supabase, ctx.user.id);
  if (!cfg) return { error: "No AI service configured (Settings → AI)." };

  const sb = createServiceClient();

  // Load idea directly (we have ideaId, not projectId)
  const { data: ideaRow } = await ctx.supabase
    .from("idea")
    .select("id, name, description, project:project_id(name)")
    .eq("id", ideaId)
    .maybeSingle();
  type IdeaRow = {
    id: string;
    name: string | null;
    description: string | null;
    project: { name: string | null } | null;
  } | null;
  const idea = ideaRow as unknown as IdeaRow;
  const projectName = idea?.project?.name ?? idea?.name ?? "";

  let icpDescription = "", icpGains = "", icpPains = "", brandVoice = "", playbook = "";

  if (idea?.id) {
    const { data: icpData } = await ctx.supabase
      .from("idea_icp")
      .select("description, value_proposition_icp_gains, value_proposition_icp_pains")
      .eq("idea_id", idea.id).maybeSingle();
    const icp = icpData as { description: string | null; value_proposition_icp_gains: string | null; value_proposition_icp_pains: string | null } | null;
    icpDescription = icp?.description ?? "";
    icpGains       = icp?.value_proposition_icp_gains ?? "";
    icpPains       = icp?.value_proposition_icp_pains ?? "";

    const { data: stylesData } = await ctx.supabase
      .from("idea_styles").select("brand_voice").eq("idea_id", idea.id).maybeSingle();
    brandVoice = (stylesData as { brand_voice: string | null } | null)?.brand_voice ?? "";

    const { data: structureData } = await ctx.supabase
      .from("idea_structure_align" as never).select("playbook_title, playbook_subtitle")
      .eq("idea_id" as never, idea.id).maybeSingle();
    const s = structureData as { playbook_title: string | null; playbook_subtitle: string | null } | null;
    if (s?.playbook_title) playbook = `${s.playbook_title}. ${s.playbook_subtitle ?? ""}`.trim();
  }

  const { data: validationRow } = await sb
    .from("mkt_validation" as never).select("positioning, icp_definition, reference_sources")
    .eq("idea_id", ideaId).maybeSingle();
  type VRow = { positioning: string | null; icp_definition: Record<string, string> | null; reference_sources: Record<string, string[]> | null } | null;
  const val = validationRow as VRow;

  const refSourcesSummary = val?.reference_sources
    ? Object.entries(val.reference_sources).map(([k, v]) => `${k}: ${(v as string[]).slice(0, 3).join(", ")}`).join("; ")
    : "";

  const context = [
    `Strategic positioning (PRIMARY signal — base search terms on this): ${val?.positioning || "(not specified)"}`,
    `Brand DNA: ${val?.icp_definition ? JSON.stringify(val.icp_definition) : "(not specified)"}`,
    `Project: ${projectName}`,
    `Idea: ${idea?.name ?? projectName} — ${idea?.description ?? "(not specified)"}`,
    `Target ICP: ${icpDescription || "(not specified)"}`,
    `ICP gains: ${icpGains || "(not specified)"}`,
    `ICP pains: ${icpPains || "(not specified)"}`,
    `Brand voice: ${brandVoice || "(not specified)"}`,
    `Playbook: ${playbook || "(not specified)"}`,
    `Reference sources: ${refSourcesSummary || "(none)"}`,
  ].join("\n");

  let typeInstruction = "";
  if (formType === "google_maps") {
    typeInstruction = `Fill a Google Maps sourcing form to find local businesses that are prospects.
Return ONLY valid JSON (no markdown):
{
  "searchTerms": ["3-5 Google Maps search terms for finding target businesses"],
  "location": "Primary city/region target market"
}`;
  } else if (formType === "people") {
    typeInstruction = `Fill a B2B people search form to find decision-maker contacts.
Return ONLY valid JSON (no markdown):
{
  "jobTitles": ["3-5 job titles of people who would buy this product"],
  "companyKeywords": ["2-4 keywords describing target company types"],
  "location": "Country or region (e.g. 'United Kingdom')",
  "seniority": "one of: founder | owner | c_suite | director | vp | head | manager | (empty string for any)"
}`;
  } else {
    typeInstruction = `Fill a social discovery form to find creators/influencers in this niche.
Return ONLY valid JSON (no markdown):
{
  "platforms": ["most relevant subset of: linkedin, instagram, facebook, youtube, twitter, tiktok"],
  "discoveryMode": "bio | content | both",
  "keywords": ["3-5 keywords for finding relevant creators"],
  "location": "City/region/country or empty string"
}`;
  }

  const prompt = `You are a marketing expert helping fill a sourcing form. Use the project context below to suggest the most relevant inputs.\n\n${context}\n\n${typeInstruction}`;

  const res = await generateAiJsonResponse<SourcingAiFillResult>({
    service: cfg.service,
    apiKey: cfg.apiKey,
    model: cfg.model,
    prompt,
  });

  if (res.returned_an_error || !res.data) return { error: res.error ?? "AI generation failed." };
  return { data: res.data };
}

// ── Run prospects ─────────────────────────────────────────────────────────────

/** Fetch all prospects linked to a specific source run. */
export async function getProspectsForRun(
  ideaId: string,
  runId: string
): Promise<{ error?: string; data?: MktProspect[] }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error };

  const { data, error } = await ctx.supabase
    .from("mkt_prospect" as never)
    .select("*")
    .eq("idea_id", ideaId)
    .eq("source_run_id" as never, runId)
    .order("created_at", { ascending: true });

  if (error) return { error: error.message };
  return { data: (data ?? []) as unknown as MktProspect[] };
}

/** Delete a single prospect (from the sourcing run card popup). */
export async function deleteProspectFromRun(
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
  revalidatePath(`/marketing/${ideaId}/sourcing`);
  revalidatePath(`/marketing/${ideaId}/outreach`);
  return {};
}
