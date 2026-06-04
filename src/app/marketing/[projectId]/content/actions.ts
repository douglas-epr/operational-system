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
import { resolveAiConfig } from "@/lib/api/ai-config";
import { generateAiJsonResponse } from "@/lib/api/ai-dispatcher";
import {
  listChannels,
  createPost,
  deletePost as bufferDeletePost,
  getBufferProfiles,
  getPostedAnalytics,
  type BufferRestProfile,
  type BufferPostStats,
} from "@/lib/api/buffer";
import type { BufferChannel } from "@/lib/api/buffer-labels";
import type { MktContent } from "@/types/marketing";

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

// ── OpenSquad multi-agent pipeline ────────────────────────────────────────────

interface StrategyOutput {
  awareness_level: string;
  market_sophistication: string;
  big_idea: { enemy: string; new_mechanism: string; unique_promise: string };
  psychological_driver: string;
  framework: string;
  platform_angle: string;
  hook_direction: string;
}

interface CopywriterOutput {
  hooks: { text: string; driver: string; structure: string; rationale: string }[];
  selected_hook_index: number;
  selection_reason: string;
  post_content: string;
  framework_used: string;
  char_count: number;
}

interface ReviewerOutput {
  scores: Record<string, { score: number; reason: string }>;
  overall_score: number;
  verdict: "APPROVE" | "REJECT";
  required_changes: string[];
  revised_post: string | null;
}

function fillTemplate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value || "(not specified)");
  }
  return result;
}

/**
 * OpenSquad 3-agent pipeline for social post generation.
 * Agent 1 (Strategist) → Agent 2 (Copywriter) → Agent 3 (Reviewer)
 * Returns { text, agentLog } where text is the final approved post.
 */
export async function generateContentDraft(
  projectId: string,
  topic: string,
  channelServices: string[]
): Promise<{ error?: string; text?: string; agentLog?: string }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error };

  const cfg = await resolveAiConfig(ctx.supabase, ctx.user.id);
  if (!cfg) return { error: "No AI service configured (Settings → AI)." };

  // 1. Load project context (positioning + brand DNA)
  const { data: v } = await ctx.supabase
    .from("mkt_validation" as never)
    .select("positioning, icp_definition")
    .eq("project_id", projectId)
    .maybeSingle();

  const validation = v as { positioning: string | null; icp_definition: Record<string, unknown> | null } | null;
  const positioning = validation?.positioning ?? "";
  const dna = (validation?.icp_definition ?? {}) as Record<string, string>;

  // 2. Load prompts from DB
  const { data: promptRows } = await ctx.supabase
    .from("prompt")
    .select("name, description")
    .in("name", ["Social Post Strategist", "Social Post Copywriter", "Social Post Reviewer"]);

  const promptMap: Record<string, string> = {};
  for (const row of ((promptRows ?? []) as { name: string; description: string }[])) {
    promptMap[row.name] = row.description;
  }

  const strategistTemplate = promptMap["Social Post Strategist"];
  const copywriterTemplate = promptMap["Social Post Copywriter"];
  const reviewerTemplate = promptMap["Social Post Reviewer"];

  if (!strategistTemplate || !copywriterTemplate || !reviewerTemplate) {
    return { error: "OpenSquad prompts not found in database." };
  }

  const platform = channelServices[0] ?? "linkedin";
  const platformRules = getPlatformRules(channelServices);

  const baseVars = {
    platform: channelServices.join(", ") || "social media",
    topic: topic || "introduce the product and invite interest",
    positioning,
    description: dna.description ?? "",
    target_audience: dna.target_audience ?? "",
    communication_style: dna.communication_style ?? "",
    content_audience_loves: dna.content_audience_loves ?? "",
    platform_rules: platformRules,
  };

  // ── Agent 1: Strategist ──────────────────────────────────────────────────
  const strategistPrompt = fillTemplate(strategistTemplate, baseVars);
  const s1 = await generateAiJsonResponse<StrategyOutput>({
    service: cfg.service, apiKey: cfg.apiKey, model: cfg.model,
    prompt: strategistPrompt,
  });
  if (s1.returned_an_error || !s1.data) {
    return { error: `Strategist agent failed: ${s1.error ?? "unknown error"}` };
  }
  const strategy = s1.data;

  // ── Agent 2: Copywriter ──────────────────────────────────────────────────
  const copywriterPrompt = fillTemplate(copywriterTemplate, {
    ...baseVars,
    strategy_json: JSON.stringify(strategy, null, 2),
  });
  const s2 = await generateAiJsonResponse<CopywriterOutput>({
    service: cfg.service, apiKey: cfg.apiKey, model: cfg.model,
    prompt: copywriterPrompt,
  });
  if (s2.returned_an_error || !s2.data) {
    return { error: `Copywriter agent failed: ${s2.error ?? "unknown error"}` };
  }
  const copy = s2.data;
  const draftPost = copy.post_content?.trim() ?? "";
  if (!draftPost) return { error: "Copywriter agent returned empty post." };

  // ── Agent 3: Reviewer ────────────────────────────────────────────────────
  const reviewerPrompt = fillTemplate(reviewerTemplate, {
    platform: baseVars.platform,
    positioning,
    communication_style: dna.communication_style ?? "",
    post_content: draftPost,
  });
  const s3 = await generateAiJsonResponse<ReviewerOutput>({
    service: cfg.service, apiKey: cfg.apiKey, model: cfg.model,
    prompt: reviewerPrompt,
  });
  if (s3.returned_an_error || !s3.data) {
    // Reviewer failed — return copywriter draft as fallback
    return { text: draftPost };
  }
  const review = s3.data;

  // Use reviewer's revised_post if it was rejected, otherwise use the original
  const finalPost = (review.verdict === "REJECT" && review.revised_post)
    ? review.revised_post.trim()
    : draftPost;

  const agentLog = `Strategy: ${strategy.framework} / ${strategy.psychological_driver} | Review: ${review.verdict} (${review.overall_score}/10)`;

  return { text: finalPost, agentLog };
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
    const r = await createPost({
      channelId,
      text: content.body,
      mode: "now",
      imageUrl: content.media_url ?? undefined,
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
    const r = await createPost({
      channelId,
      text: content.body,
      mode: "schedule",
      dueAt,
      imageUrl: content.media_url ?? undefined,
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
