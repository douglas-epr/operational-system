"use server";

/**
 * Server actions for a project's landing page (Phase 1).
 * One landing per project for the MVP (the schema allows more via unique slug).
 * Auth: admin / manager.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/marketing/slug";
import { resolveAiConfig } from "@/lib/api/ai-config";
import { generateAiJsonResponse, generateAiTextResponse } from "@/lib/api/ai-dispatcher";
import type { MktLanding } from "@/types/marketing";

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

/** Fetch the project's landing (or null). */
export async function getLanding(projectId: string): Promise<MktLanding | null> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return null;

  const { data } = await ctx.supabase
    .from("mkt_landing" as never)
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (data as unknown as MktLanding) ?? null;
}

export interface SaveLandingInput {
  id?: string;
  slug: string;
  code_html: string;
  published: boolean;
}

/** Create or update the project's landing page. */
export async function saveLanding(
  projectId: string,
  input: SaveLandingInput
): Promise<{ error?: string; id?: string; slug?: string }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error };

  const slug = slugify(input.slug);
  if (!slug) return { error: "A URL slug is required." };
  if (!/^[a-z0-9-]+$/.test(slug)) return { error: "Slug may use only letters, numbers, and hyphens." };

  if (input.published && !input.code_html.trim()) {
    return { error: "Add the page code before publishing." };
  }

  // Title is auto-derived from the project name (the browser-tab title for the
  // iframe host page); the code itself owns all on-page content.
  const { data: project } = await ctx.supabase
    .from("project")
    .select("name")
    .eq("id", projectId)
    .maybeSingle();

  const row = {
    project_id: projectId,
    slug,
    title: (project as { name: string | null } | null)?.name ?? null,
    code_html: input.code_html || null,
    // Waitlist stays enabled so /api/m/[slug]/capture keeps recording signals
    // from the form inside the generated code.
    capture_stages: ["waitlist"],
    published: input.published,
  };

  let result;
  if (input.id) {
    result = await ctx.supabase
      .from("mkt_landing" as never)
      .update(row as never)
      .eq("id", input.id)
      .eq("project_id", projectId)
      .select("id, slug")
      .single();
  } else {
    result = await ctx.supabase
      .from("mkt_landing" as never)
      .insert({ ...row, created_by: ctx.user.id } as never)
      .select("id, slug")
      .single();
  }

  const { data, error } = result;
  if (error) {
    if (error.code === "23505") {
      return { error: `The slug "${slug}" is already in use. Choose another.` };
    }
    return { error: error.message };
  }

  revalidatePath(`/marketing/${projectId}/landing`);
  revalidatePath(`/marketing/${projectId}`);
  revalidatePath(`/m/${slug}`);
  const saved = data as unknown as { id: string; slug: string };
  return { id: saved.id, slug: saved.slug };
}

// ── Template variable substitution (same helper as content/actions.ts) ─────────

function fillTemplate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value || "(not specified)");
  }
  return result;
}

// ── Agent output shapes ────────────────────────────────────────────────────────

interface LPResearcherOutput {
  target_audience_insight: string;
  key_pain_points: string[];
  value_props: string[];
  hero_angles: string[];
  proof_points: Record<string, string>;
  brand_mood: string;
  recommended_sections: string[];
  visual_direction: string;
  rationale: string;
}

interface LPCopywriterOutput {
  page_title: string;
  hero: { headline: string; subheadline: string; cta_label: string; trust_line?: string };
  problem_section: { eyebrow: string; heading: string; pain_cards: { title: string; body: string }[] };
  features_section: { eyebrow: string; heading: string; subheading: string; items: { title: string; body: string }[] };
  how_it_works: { eyebrow: string; heading: string; steps: { title: string; body: string }[] };
  testimonials: { eyebrow: string; heading: string; subheading: string; quotes: { quote: string; name: string; role: string; initials: string }[] };
  comparison: { eyebrow: string; heading: string; col_ours: string; col_comp1: string; col_comp2: string; rows: { feature: string; ours: boolean; comp1: boolean | string; comp2: boolean | string }[] };
  faq: { eyebrow: string; heading: string; items: { q: string; a: string }[] };
  cta_section: { eyebrow: string; heading: string; body: string; cta_label: string; note: string };
}

// Designer now returns raw text (not JSON) — no interface needed.
interface LPReviewerOutput {
  headline_score: number;
  cta_score: number;
  overall_score: number;
  verdict: "APPROVE" | "REJECT";
  required_fixes: string[];
  summary: string;
  // revised_html removed — REJECT triggers a second text call to re-run the Designer.
}

/**
 * 4-agent landing page generation pipeline.
 * 1. Researcher → creative brief
 * 2. Copywriter → all page text
 * 3. Designer  → complete self-contained HTML document
 * 4. Reviewer  → quality check & optional full-document revision
 *
 * Returns { code_html, agentLog } for the client to review + save. The Designer
 * emits a full <!doctype html> document whose capture form posts to
 * window.__MKT_CAPTURE_URL__ (injected by the public /m/[slug] iframe host).
 */
export async function generateLandingPage(
  projectId: string
): Promise<{
  error?: string;
  code_html?: string;
  agentLog?: string;
}> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error };

  const cfg = await resolveAiConfig(ctx.supabase, ctx.user.id);
  if (!cfg) return { error: "No AI service configured (Settings → AI)." };

  const call = <T>(prompt: string) =>
    generateAiJsonResponse<T>({ service: cfg.service, apiKey: cfg.apiKey, model: cfg.model, prompt });
  const callText = (prompt: string) =>
    generateAiTextResponse({ service: cfg.service, apiKey: cfg.apiKey, model: cfg.model, prompt });

  // ── 1. Load project context ────────────────────────────────────────────────
  const [
    { data: v },
    { data: ideaRows },
  ] = await Promise.all([
    ctx.supabase.from("mkt_validation" as never).select("positioning, icp_definition").eq("project_id", projectId).maybeSingle(),
    ctx.supabase.from("idea" as never).select("id, name, description").eq("project_id" as never, projectId).order("created_at" as never, { ascending: false }).limit(1),
  ]);

  const validation = v as { positioning: string | null; icp_definition: Record<string, unknown> | null } | null;
  const idea = ((ideaRows ?? []) as { id: string; name: string | null; description: string | null }[])[0] ?? null;
  const positioning = validation?.positioning ?? "";
  const dna = (validation?.icp_definition ?? {}) as Record<string, string>;
  const ideaId = idea?.id ?? null;

  // ── 2. Load extra idea context in parallel ─────────────────────────────────
  const [{ data: structureData }, { data: icpData }, { data: stylesData }] = await Promise.all([
    ideaId
      ? ctx.supabase.from("idea_structure_and_align" as never).select("core_problem, essential_features_text, target_audience").eq("idea_id" as never, ideaId).maybeSingle()
      : Promise.resolve({ data: null }),
    ideaId
      ? ctx.supabase.from("idea_icp" as never).select("description, pain_points").eq("idea_id" as never, ideaId).limit(1).maybeSingle()
      : Promise.resolve({ data: null }),
    ideaId
      ? ctx.supabase.from("idea_styles" as never).select("primary_color, secondary_color, accent_color, typography, color_tokens, spacing, border_radius, shadows, brand_voice, iconography_style, motion_principles").eq("idea_id" as never, ideaId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  type S = { core_problem?: string | null; essential_features_text?: string | null; target_audience?: string | null };
  type I = { description?: string | null; pain_points?: string | null };
  type St = {
    primary_color?: string | null;
    secondary_color?: string | null;
    accent_color?: string | null;
    typography?: Record<string, unknown> | null;
    color_tokens?: Record<string, unknown> | null;
    spacing?: Record<string, unknown> | null;
    border_radius?: Record<string, unknown> | null;
    shadows?: Record<string, unknown> | null;
    brand_voice?: string | null;
    iconography_style?: string | null;
    motion_principles?: string | null;
  };

  const structure = (structureData as S | null) ?? {};
  const icp = (icpData as I | null) ?? {};
  const styles = (stylesData as St | null) ?? {};
  const typography = (styles.typography ?? {}) as Record<string, string>;

  // ── 3. Load the 4 LP prompts ───────────────────────────────────────────────
  const LP_PROMPTS = ["1. LP Researcher", "2. LP Copywriter", "3. LP Designer", "4. LP Reviewer"];
  const { data: promptRows } = await ctx.supabase
    .from("prompt")
    .select("name, description")
    .in("name", LP_PROMPTS);

  const P: Record<string, string> = {};
  for (const row of ((promptRows ?? []) as { name: string; description: string }[])) P[row.name] = row.description;
  for (const name of LP_PROMPTS) {
    if (!P[name]) return { error: `Prompt "${name}" not found in database.` };
  }

  const designSystemJson = JSON.stringify({
    colors: {
      primary: styles.primary_color ?? "#6D9773",
      secondary: styles.secondary_color ?? "#F4EBD0",
      accent: styles.accent_color ?? "#D4A59A",
      tokens: styles.color_tokens ?? {},
    },
    typography: {
      heading_font: typography.heading_font ?? "Poppins",
      body_font: typography.body_font ?? "Lato",
      ...typography,
    },
    spacing: styles.spacing ?? {},
    border_radius: styles.border_radius ?? {},
    shadows: styles.shadows ?? {},
    brand_voice: styles.brand_voice ?? "",
    iconography_style: styles.iconography_style ?? "",
    motion_principles: styles.motion_principles ?? "",
  }, null, 2);

  const baseVars: Record<string, string> = {
    positioning,
    description: dna.description ?? "",
    target_audience: dna.target_audience ?? structure.target_audience ?? "",
    communication_style: dna.communication_style ?? "",
    content_audience_loves: dna.content_audience_loves ?? "",
    idea_name: idea?.name ?? "",
    idea_description: idea?.description ?? "",
    core_problem: structure.core_problem ?? "",
    essential_features: structure.essential_features_text ?? "",
    pain_points: icp.pain_points ?? "",
    icp_description: icp.description ?? "",
    // Flat color/font vars kept for backwards-compat with prompts that use them
    primary_color: styles.primary_color ?? "#6D9773",
    secondary_color: styles.secondary_color ?? "#F4EBD0",
    accent_color: styles.accent_color ?? "#D4A59A",
    heading_font: typography.heading_font ?? "Poppins",
    body_font: typography.body_font ?? "Lato",
    // Full design system as structured JSON
    design_system_json: designSystemJson,
  };

  // ── Agent 1: Researcher ────────────────────────────────────────────────────
  const r1 = await call<LPResearcherOutput>(fillTemplate(P["1. LP Researcher"], baseVars));
  if (r1.returned_an_error || !r1.data) return { error: `Researcher failed: ${r1.error ?? "unknown"}` };
  const briefJson = JSON.stringify(r1.data, null, 2);

  // ── Agent 2: Copywriter ───────────────────────────────────────────────────
  const r2 = await call<LPCopywriterOutput>(fillTemplate(P["2. LP Copywriter"], { ...baseVars, research_brief_json: briefJson }));
  if (r2.returned_an_error || !r2.data) return { error: `Copywriter failed: ${r2.error ?? "unknown"}` };
  const copyJson = JSON.stringify(r2.data, null, 2);

  // ── Agent 3: Designer → raw HTML document via text response (not JSON) ───────
  // HTML documents are too large and character-rich to survive JSON serialization.
  const r3 = await callText(fillTemplate(P["3. LP Designer"], { ...baseVars, copy_json: copyJson }));
  if (r3.returned_an_error || !r3.text?.trim()) {
    return { error: `Designer failed: ${r3.error ?? "no HTML returned"}` };
  }
  const html = r3.text.trim();

  // ── Agent 4: Reviewer → JSON metadata only; REJECT triggers a Designer re-run ──
  let reviewedHtml = html;
  let reviewVerdict = "SKIPPED";
  let reviewScore = 0;
  const r4 = await call<LPReviewerOutput>(fillTemplate(P["4. LP Reviewer"], {
    copy_json: copyJson,
    html,
    positioning,
    communication_style: dna.communication_style ?? "",
  }));
  if (!r4.returned_an_error && r4.data) {
    reviewVerdict = r4.data.verdict;
    reviewScore = r4.data.overall_score ?? 0;
    if (r4.data.verdict === "REJECT" && r4.data.required_fixes?.length) {
      // Re-run Designer as a text call with required fixes appended to the prompt.
      const fixList = r4.data.required_fixes.map((f) => `- ${f}`).join("\n");
      const revisePrompt =
        fillTemplate(P["3. LP Designer"], { ...baseVars, copy_json: copyJson }) +
        `\n\n## REQUIRED FIXES (conversion reviewer)\n${fixList}`;
      const r4b = await callText(revisePrompt);
      if (!r4b.returned_an_error && r4b.text?.trim()) {
        reviewedHtml = r4b.text.trim();
      }
    }
  }

  const agentLog = `Researcher → Copywriter → Designer ✓ → Reviewer (${reviewVerdict}${reviewScore ? ` ${reviewScore}/10` : ""})`;

  return {
    code_html: reviewedHtml,
    agentLog,
  };
}

/** Toggle published state. */
export async function setLandingPublished(
  projectId: string,
  landingId: string,
  published: boolean
): Promise<{ error?: string }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error };

  const { error } = await ctx.supabase
    .from("mkt_landing" as never)
    .update({ published } as never)
    .eq("id", landingId)
    .eq("project_id", projectId);

  if (error) return { error: error.message };
  revalidatePath(`/marketing/${projectId}/landing`);
  return {};
}
