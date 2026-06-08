"use server";

/**
 * Content studio actions (Phase 4) — calendar-first social scheduling via Buffer.
 * Replaces Postiz. Auth: admin / manager.
 *
 * Buffer's public API provides:
 *   - Channel listing (id, name, service, avatar)
 *   - Post creation with shareNow | customScheduled modes
 *   - Post status (draft, scheduled, sent, error) + externalLink (live URL)
 *
 * Engagement analytics (likes, comments) are NOT available via Buffer's API.
 * We surface the externalLink so users can view metrics directly on each platform.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveAiConfig, resolveImageKeys } from "@/lib/api/ai-config";
import { generateAiJsonResponse } from "@/lib/api/ai-dispatcher";
import { generateGeminiImage } from "@/lib/api/gemini";
import { generateOpenAIImage } from "@/lib/api/openai";
import {
  listChannels,
  createPost,
  deletePost as bufferDeletePost,
  getBufferProfiles,
  getPostedAnalytics,
  type BufferRestProfile,
  type BufferPostStats,
} from "@/lib/api/buffer";
import { scrapeReferenceSource, apifyConfigured } from "@/lib/api/apify";
import type { BufferChannel } from "@/lib/api/buffer-labels";
import type { MktContent, ReferenceSources, ReferenceSourceKey } from "@/types/marketing";
import { REFERENCE_SOURCE_GROUPS } from "@/types/marketing";

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

function rp(projectId: string) {
  revalidatePath(`/marketing/${projectId}/content`);
  revalidatePath(`/marketing/${projectId}`);
}

/** Connected Buffer channels (global to the workspace). */
export async function getChannels(): Promise<{ channels: BufferChannel[]; error?: string }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { channels: [], error: ctx.error };
  try {
    const channels = await listChannels();
    return { channels };
  } catch (e) {
    return {
      channels: [],
      error: e instanceof Error ? e.message : "Failed to load Buffer channels.",
    };
  }
}

export async function listContent(projectId: string): Promise<MktContent[]> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return [];
  const { data } = await ctx.supabase
    .from("mkt_content" as never)
    .select("*")
    .eq("project_id", projectId)
    .order("scheduled_at", { ascending: true, nullsFirst: false });
  return (data ?? []) as unknown as MktContent[];
}

export interface ContentInput {
  id?: string;
  channels: string[]; // Buffer channel ids
  body: string;
  scheduled_at: string | null;
  status: "draft" | "scheduled";
  ai_generated?: boolean;
  media_url?: string | null;
  media_urls?: string[];
}

/** Upload an image file to Supabase Storage and return its public URL. */
export async function uploadMedia(
  projectId: string,
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error };

  const file = formData.get("file") as File | null;
  if (!file) return { error: "No file provided." };
  if (!file.type.startsWith("image/")) return { error: "Only image files are supported." };
  if (file.size > 10 * 1024 * 1024) return { error: "Image must be under 10 MB." };

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${projectId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();

  const { error } = await ctx.supabase.storage
    .from("mkt-media")
    .upload(path, arrayBuffer, { contentType: file.type, upsert: false });

  if (error) return { error: error.message };

  const { data } = ctx.supabase.storage.from("mkt-media").getPublicUrl(path);
  return { url: data.publicUrl };
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export interface ContentAnalytics {
  profiles: BufferRestProfile[];
  postsByProfile: Record<string, BufferPostStats[]>;
  summaryByStatus: Record<string, number>;
}

/** Fetch Buffer post analytics (REST v1) + local DB status summary. */
export async function fetchAnalytics(
  projectId: string
): Promise<ContentAnalytics> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { profiles: [], postsByProfile: {}, summaryByStatus: {} };

  const [profiles, { data: rows }] = await Promise.all([
    getBufferProfiles(),
    ctx.supabase
      .from("mkt_content" as never)
      .select("status")
      .eq("project_id", projectId),
  ]);

  // Status summary from local DB
  const summaryByStatus: Record<string, number> = {};
  for (const row of ((rows ?? []) as { status: string }[])) {
    summaryByStatus[row.status] = (summaryByStatus[row.status] ?? 0) + 1;
  }

  // Fetch sent post analytics per profile
  const postsByProfile: Record<string, BufferPostStats[]> = {};
  await Promise.all(
    profiles.map(async (p) => {
      const posts = await getPostedAnalytics(p.id, 10);
      if (posts.length > 0) postsByProfile[p.id] = posts;
    })
  );

  return { profiles, postsByProfile, summaryByStatus };
}

/** Save (insert or update) a content record without publishing. */
export async function saveContent(
  projectId: string,
  input: ContentInput
): Promise<{ error?: string; id?: string }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error };

  if (input.status === "scheduled") {
    if (!input.scheduled_at) return { error: "Pick a date/time to schedule." };
    if (input.channels.length === 0) return { error: "Select at least one channel." };
  }
  if (!input.body.trim()) return { error: "Write some content first." };

  const row = {
    project_id: projectId,
    channels: input.channels,
    body: input.body,
    status: input.status,
    scheduled_at: input.scheduled_at,
    ai_generated: input.ai_generated ?? false,
    media_url: input.media_url ?? null,
    media_urls: input.media_urls ?? [],
  };

  let res;
  if (input.id) {
    res = await ctx.supabase
      .from("mkt_content" as never)
      .update(row as never)
      .eq("id", input.id)
      .eq("project_id", projectId)
      .select("id")
      .single();
  } else {
    res = await ctx.supabase
      .from("mkt_content" as never)
      .insert({ ...row, created_by: ctx.user.id } as never)
      .select("id")
      .single();
  }
  if (res.error) return { error: res.error.message };
  rp(projectId);
  return { id: (res.data as unknown as { id: string }).id };
}

/** Drag-and-drop reschedule. */
export async function rescheduleContent(
  projectId: string,
  contentId: string,
  scheduledAt: string
): Promise<{ error?: string }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error };
  const { error } = await ctx.supabase
    .from("mkt_content" as never)
    .update({ scheduled_at: scheduledAt, status: "scheduled" } as never)
    .eq("id", contentId)
    .eq("project_id", projectId);
  if (error) return { error: error.message };
  rp(projectId);
  return {};
}

export async function deleteContent(
  projectId: string,
  contentId: string
): Promise<{ error?: string }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error };

  // Best-effort delete from Buffer if we stored a buffer post id
  const { data: row } = await ctx.supabase
    .from("mkt_content" as never)
    .select("external_post_ids")
    .eq("id", contentId)
    .maybeSingle();
  const ids = (row as { external_post_ids?: Record<string, unknown> } | null)
    ?.external_post_ids ?? {};
  const bufferId = (ids as Record<string, unknown>).buffer_id as string | undefined;
  if (bufferId) {
    await bufferDeletePost(bufferId).catch(() => {}); // ignore errors
  }

  const { error } = await ctx.supabase
    .from("mkt_content" as never)
    .delete()
    .eq("id", contentId)
    .eq("project_id", projectId);
  if (error) return { error: error.message };
  rp(projectId);
  return {};
}

// ── Platform rules embedded from OpenSquad best practices ────────────────────

const PLATFORM_RULES: Record<string, string> = {
  linkedin: `LinkedIn Platform Rules:
- Max 3000 characters. First ~210 characters (2 lines) show before "see more" fold. HOOK MUST fit here.
- NO external links in the post body — 3x reach penalty. Use "Link in comments" only.
- 3-5 hashtags on the LAST line, separated from the body text. Never inline.
- Short paragraphs: 1-2 sentences max with blank lines between them.
- Comments carry more weight than likes — end with a genuine question that invites discussion.
- First person is mandatory. "I learned" beats "One should learn."
- Best posting times: 7-9 AM or 12-1 PM on Tuesday/Wednesday/Thursday.`,

  googlebusiness: `Google Business Profile Rules:
- Keep posts under 300 words. Concise, professional tone.
- No hashtags needed. Direct CTA for local/business action (visit, call, book, learn more).
- Focus on business updates, offers, events, or "what's new" content.
- Include a specific call-to-action button type: none | book | order | shop | learn_more | signup | call
- Write from the business perspective, not personal. Professional and friendly tone.
- No links needed — the business profile already has contact info.`,

  twitter: `X (Twitter) Rules:
- Hard 280 character limit. Every word must earn its place.
- One sharp idea per tweet. No padding.
- 1-2 hashtags max. Often 0 is better.
- Hook is the entire post for short-form — it must be irresistible on its own.`,

  instagram: `Instagram Rules:
- First ~125 characters show before "...more" fold. Hook must land here.
- 5-10 hashtags at the bottom, separated by a line break.
- Conversational, visual storytelling tone.
- Emojis used sparingly for emphasis, not decoration.`,

  facebook: `Facebook Rules:
- Conversational and community-focused tone.
- Questions perform well — they invite comments.
- 1-3 hashtags max or none.
- Longer posts can work if they tell a compelling story.`,
};

function getPlatformRules(services: string[]): string {
  const rules = services
    .map((s) => PLATFORM_RULES[s.toLowerCase()])
    .filter(Boolean)
    .join("\n\n");
  return rules || "General social media: punchy, specific, first person, genuine CTA.";
}

// ════════════════════════════════════════════════════════════════════════════
// OpenSquad 5-agent pipeline:
//   Researcher → Copywriter → Image Designer → Reviewer → Publisher
// Grounded in the Positioning statement + Brand DNA + cached reference research.
// ════════════════════════════════════════════════════════════════════════════

function fillTemplate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value || "(not specified)");
  }
  return result;
}

interface ResearcherBrief {
  themes: string[];
  winning_hook_patterns: string[];
  recommended_angle: string;
  key_message: string;
  tone_cues: string[];
  visual_cues: string[];
  audience_insight: string;
  rationale: string;
}
interface CopywriterSquadOutput {
  hooks: string[];
  selected_hook_index: number;
  selection_reason: string;
  post_content: string;
  hashtags: string[];
  char_count: number;
}
interface ImageDesignerOutput {
  image_prompt: string;
  aspect_ratio: string;
  alt_text: string;
  style_notes: string;
}
interface ReviewerSquadOutput {
  scores: Record<string, number>;
  overall_score: number;
  verdict: "APPROVE" | "REJECT";
  required_changes: string[];
  revised_post: string | null;
}
interface PublisherOutput {
  final_post: string;
  recommended_channels: string[];
  recommended_time: string;
  summary: string;
}

// ── Research cache (Apify scrape → digest, cached per source list) ─────────────

const RESEARCH_TABLE = "mkt_research_cache";

/** All reference-source keys (kept in sync with REFERENCE_SOURCE_GROUPS). */
function allReferenceKeys(): ReferenceSourceKey[] {
  return REFERENCE_SOURCE_GROUPS.flatMap((g) => g.lists.map((l) => l.key));
}

/**
 * Re-scrape every non-empty reference source list via Apify and upsert the
 * resulting digests into mkt_research_cache. Slow (runs rarely). Returns a
 * per-source status summary.
 */
export async function refreshResearchCache(
  projectId: string
): Promise<{ error?: string; results?: { source: string; ok: boolean; items: number; error?: string }[] }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error };
  if (!apifyConfigured()) return { error: "Apify is not configured (set APIFY_TOKEN)." };

  const { data: v } = await ctx.supabase
    .from("mkt_validation" as never)
    .select("reference_sources")
    .eq("project_id", projectId)
    .maybeSingle();
  const refs = ((v as { reference_sources: ReferenceSources } | null)?.reference_sources ?? {}) as ReferenceSources;

  const results: { source: string; ok: boolean; items: number; error?: string }[] = [];

  for (const key of allReferenceKeys()) {
    const urls = (refs[key] ?? []).filter(Boolean);
    if (urls.length === 0) continue;

    const r = await scrapeReferenceSource(key, urls);
    results.push({ source: key, ok: r.ok, items: r.digest ? r.digest.split("\n").length : 0, error: r.error });

    if (r.ok && r.digest) {
      await ctx.supabase
        .from(RESEARCH_TABLE as never)
        .upsert(
          {
            project_id: projectId,
            source_key: key,
            digest: r.digest,
            raw: r.raw ?? {},
            scraped_at: new Date().toISOString(),
          } as never,
          { onConflict: "project_id,source_key" }
        );
    }
  }

  rp(projectId);
  return { results };
}

/**
 * Build the {{research_digest}} string the Researcher reads. Prefers cached
 * scrape digests; falls back to listing the raw saved URLs so the pipeline
 * still works before any scrape has run.
 */
type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function getResearchDigest(
  supabase: SupabaseClient,
  projectId: string,
  refs: ReferenceSources
): Promise<string> {
  const { data: rows } = await supabase
    .from(RESEARCH_TABLE as never)
    .select("source_key, digest")
    .eq("project_id", projectId);
  const cached = (rows ?? []) as { source_key: string; digest: string }[];

  const sections: string[] = [];
  const cachedKeys = new Set(cached.map((r) => r.source_key));

  for (const row of cached) {
    if (row.digest?.trim()) sections.push(`### ${row.source_key.replace(/_/g, " ")}\n${row.digest}`);
  }
  // Surface any saved URLs not yet scraped, so the LLM still sees references.
  for (const key of allReferenceKeys()) {
    if (cachedKeys.has(key)) continue;
    const urls = (refs[key] ?? []).filter(Boolean);
    if (urls.length) sections.push(`### ${key.replace(/_/g, " ")} (not yet scraped)\n` + urls.map((u) => `- ${u}`).join("\n"));
  }

  return sections.join("\n\n").slice(0, 6000); // keep prompt size sane
}

// ── Image generation (Gemini → OpenAI fallback) → upload to mkt-media ─────────

async function generatePostImage(
  supabase: SupabaseClient,
  projectId: string,
  imagePrompt: string,
  keys: { gemini: string | null; openai: string | null }
): Promise<{ url?: string; error?: string }> {
  let bytes: Buffer | null = null;
  let mime = "image/png";
  const errors: string[] = [];

  // 1. Gemini first
  if (keys.gemini) {
    const g = await generateGeminiImage(imagePrompt, keys.gemini);
    if (!g.returned_an_error && g.image) { bytes = g.image.bytes; mime = g.image.mimeType; }
    else if (g.error) errors.push(`Gemini: ${g.error}`);
  }
  // 2. OpenAI fallback
  if (!bytes && keys.openai) {
    const o = await generateOpenAIImage(imagePrompt, keys.openai);
    if (!o.returned_an_error && o.image) { bytes = o.image.bytes; mime = o.image.mimeType; }
    else if (o.error) errors.push(`OpenAI: ${o.error}`);
  }

  if (!bytes) return { error: errors.join(" | ") || "No image provider configured." };

  const ext = mime.includes("jpeg") ? "jpg" : "png";
  const path = `${projectId}/ai-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from("mkt-media")
    .upload(path, bytes, { contentType: mime, upsert: false });
  if (error) return { error: `Upload failed: ${error.message}` };

  const { data } = supabase.storage.from("mkt-media").getPublicUrl(path);
  return { url: data.publicUrl };
}

/**
 * OpenSquad 5-agent pipeline. Consumes cached reference research (fast — no
 * live scraping here). Returns the final post text + any generated image URL.
 */
export async function generateContentDraft(
  projectId: string,
  topic: string,
  channelServices: string[]
): Promise<{ error?: string; text?: string; imageUrls?: string[]; agentLog?: string }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error };

  const cfg = await resolveAiConfig(ctx.supabase, ctx.user.id);
  if (!cfg) return { error: "No AI service configured (Settings → AI)." };
  const call = (prompt: string) =>
    generateAiJsonResponse({ service: cfg.service, apiKey: cfg.apiKey, model: cfg.model, prompt });

  // 1. Load project context (positioning + brand DNA + reference sources)
  const { data: v } = await ctx.supabase
    .from("mkt_validation" as never)
    .select("positioning, icp_definition, reference_sources")
    .eq("project_id", projectId)
    .maybeSingle();
  const validation = v as {
    positioning: string | null;
    icp_definition: Record<string, unknown> | null;
    reference_sources: ReferenceSources | null;
  } | null;
  const positioning = validation?.positioning ?? "";
  const dna = (validation?.icp_definition ?? {}) as Record<string, string>;
  const refs = (validation?.reference_sources ?? {}) as ReferenceSources;

  // 2. Load the 5 OpenSquad prompts
  const { data: promptRows } = await ctx.supabase
    .from("prompt")
    .select("name, description")
    .in("name", [
      "1. Social Post Strategist",
      "2. Social Post Copywriter",
      "3. Social Post Image Designer",
      "4. Social Post Reviewer",
      "5. Social Post Publisher",
    ]);
  const P: Record<string, string> = {};
  for (const row of ((promptRows ?? []) as { name: string; description: string }[])) P[row.name] = row.description;
  for (const name of ["1. Social Post Strategist", "2. Social Post Copywriter", "3. Social Post Image Designer", "4. Social Post Reviewer", "5. Social Post Publisher"]) {
    if (!P[name]) return { error: `Prompt "${name}" not found in database.` };
  }

  const platform = channelServices.join(", ") || "social media";
  const platformRules = getPlatformRules(channelServices);
  const researchDigest = await getResearchDigest(ctx.supabase, projectId, refs);

  const baseVars: Record<string, string> = {
    platform,
    platform_rules: platformRules,
    topic: topic || "introduce the product and invite interest",
    positioning,
    description: dna.description ?? "",
    target_audience: dna.target_audience ?? "",
    communication_style: dna.communication_style ?? "",
    content_audience_loves: dna.content_audience_loves ?? "",
    research_digest: researchDigest || "(no reference research available)",
  };

  // ── Agent 1: Strategist ───────────────────────────────────────────────────
  const r1 = await call(fillTemplate(P["1. Social Post Strategist"], baseVars));
  if (r1.returned_an_error || !r1.data) return { error: `Researcher failed: ${r1.error ?? "unknown"}` };
  const brief = r1.data as ResearcherBrief;
  const briefJson = JSON.stringify(brief, null, 2);

  // ── Agent 2: Copywriter ───────────────────────────────────────────────────
  const r2 = await call(fillTemplate(P["2. Social Post Copywriter"], { ...baseVars, research_brief_json: briefJson }));
  if (r2.returned_an_error || !r2.data) return { error: `Copywriter failed: ${r2.error ?? "unknown"}` };
  const copy = r2.data as CopywriterSquadOutput;
  const draftPost = (copy.post_content ?? "").trim();
  if (!draftPost) return { error: "Copywriter returned an empty post." };

  // ── Agent 3: Image Designer (best-effort) ────────────────────────────────
  let imageUrl: string | undefined;
  let imageBrief = "(no image)";
  let imageError: string | undefined;
  const r3 = await call(fillTemplate(P["3. Social Post Image Designer"], {
    ...baseVars,
    post_content: draftPost,
    research_brief_json: briefJson,
  }));
  if (!r3.returned_an_error && r3.data) {
    const design = r3.data as ImageDesignerOutput;
    imageBrief = design.image_prompt ?? "";
    if (imageBrief) {
      const keys = await resolveImageKeys(ctx.supabase, ctx.user.id);
      const img = await generatePostImage(ctx.supabase, projectId, imageBrief, keys);
      if (img.url) imageUrl = img.url;
      else imageError = img.error;
    }
  } else {
    imageError = r3.error;
  }

  // ── Agent 4: Reviewer ─────────────────────────────────────────────────────
  let reviewedPost = draftPost;
  let reviewVerdict = "SKIPPED";
  let reviewScore = 0;
  const r4 = await call(fillTemplate(P["4. Social Post Reviewer"], {
    platform,
    positioning,
    communication_style: dna.communication_style ?? "",
    post_content: draftPost,
    image_brief: imageBrief,
  }));
  if (!r4.returned_an_error && r4.data) {
    const review = r4.data as ReviewerSquadOutput;
    reviewVerdict = review.verdict;
    reviewScore = review.overall_score ?? 0;
    if (review.verdict === "REJECT" && review.revised_post?.trim()) {
      reviewedPost = review.revised_post.trim();
    }
  }

  // ── Agent 5: Publisher (finalize for review — no auto-publish) ────────────
  let finalPost = reviewedPost;
  const r5 = await call(fillTemplate(P["5. Social Post Publisher"], {
    platform,
    review_json: JSON.stringify({ verdict: reviewVerdict, overall_score: reviewScore }),
    post_content: reviewedPost,
  }));
  if (!r5.returned_an_error && r5.data) {
    const pub = r5.data as PublisherOutput;
    if (pub.final_post?.trim()) finalPost = pub.final_post.trim();
  }

  const imgStatus = imageUrl ? " ✓" : imageError ? ` (skipped: ${imageError.slice(0, 400)})` : " (skipped)";
  const agentLog = `Researcher → Copywriter → Image Designer${imgStatus} → Reviewer (${reviewVerdict}${reviewScore ? ` ${reviewScore}/10` : ""}) → Publisher`;

  return { text: finalPost, imageUrls: imageUrl ? [imageUrl] : [], agentLog };
}

/**
 * Publish a post immediately via Buffer, then mark as posted in the DB.
 * channelIds must be valid Buffer channel IDs.
 */
export async function publishNow(
  projectId: string,
  contentId: string,
  channelIds: string[]
): Promise<{ error?: string }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error };

  const { data: row } = await ctx.supabase
    .from("mkt_content" as never)
    .select("*")
    .eq("id", contentId)
    .eq("project_id", projectId)
    .maybeSingle();
  const content = row as unknown as MktContent | null;
  if (!content) return { error: "Content not found." };
  if (!content.body?.trim()) return { error: "Nothing to publish." };

  const ids = channelIds.length ? channelIds : (content.channels ?? []);
  if (ids.length === 0) return { error: "No channels selected." };

  const results: Record<string, string> = {};
  const externalLinks: Record<string, string> = {};
  const errors: string[] = [];

  for (const channelId of ids) {
    const imageUrls = (content.media_urls ?? []).filter(Boolean);
    const r = await createPost({
      channelId,
      text: content.body,
      mode: "now",
      imageUrls,
    });
    if (r.returned_an_error) {
      errors.push(`Channel ${channelId}: ${r.error}`);
    } else if (r.post) {
      results[channelId] = r.post.id;
      if (r.post.externalLink) externalLinks[channelId] = r.post.externalLink;
    }
  }

  if (errors.length > 0 && Object.keys(results).length === 0) {
    return { error: errors.join("; ") };
  }

  await ctx.supabase
    .from("mkt_content" as never)
    .update({
      status: "posted",
      posted_at: new Date().toISOString(),
      scheduled_at: new Date().toISOString(), // update to actual send time
      external_post_ids: { buffer_ids: results, external_links: externalLinks },
    } as never)
    .eq("id", contentId);

  rp(projectId);
  return {};
}

/**
 * Schedule a post via Buffer (creates in Buffer queue with customScheduled mode),
 * then marks our DB row as scheduled.
 */
export async function scheduleWithBuffer(
  projectId: string,
  contentId: string,
  channelIds: string[],
  dueAt: string
): Promise<{ error?: string }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error };

  const { data: row } = await ctx.supabase
    .from("mkt_content" as never)
    .select("*")
    .eq("id", contentId)
    .eq("project_id", projectId)
    .maybeSingle();
  const content = row as unknown as MktContent | null;
  if (!content) return { error: "Content not found." };
  if (!content.body?.trim()) return { error: "Nothing to publish." };

  const ids = channelIds.length ? channelIds : (content.channels ?? []);
  if (ids.length === 0) return { error: "No channels selected." };

  const results: Record<string, string> = {};
  const errors: string[] = [];

  for (const channelId of ids) {
    const imageUrls = (content.media_urls ?? []).filter(Boolean);
    const r = await createPost({
      channelId,
      text: content.body,
      mode: "schedule",
      dueAt,
      imageUrls,
    });
    if (r.returned_an_error) {
      errors.push(`Channel ${channelId}: ${r.error}`);
    } else if (r.post) {
      results[channelId] = r.post.id;
    }
  }

  if (errors.length > 0 && Object.keys(results).length === 0) {
    return { error: errors.join("; ") };
  }

  await ctx.supabase
    .from("mkt_content" as never)
    .update({
      status: "scheduled",
      scheduled_at: dueAt,
      external_post_ids: { buffer_ids: results },
    } as never)
    .eq("id", contentId);

  rp(projectId);
  return {};
}
