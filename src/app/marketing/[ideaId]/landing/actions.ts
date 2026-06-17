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
import { searchLandingImages } from "@/lib/marketing/image-search";
import type { MktLanding, QuizQuestion } from "@/types/marketing";

const STAFF = ["admin", "manager"] as const;

// Font names the LLM defaults to that should be replaced with premium alternatives.
// Heading fonts (display/editorial) → replaced with headingFont.
const BANNED_HEADING_FONTS = ["Inter", "Roboto", "Poppins", "Nunito", "Raleway", "Montserrat"];
// Body fonts (readable at small sizes) → replaced with bodyFont.
// Open Sans, Lato etc. appear in both heading and body rules from the LLM.
const BANNED_BODY_FONTS = ["Open Sans", "Lato", "Source Sans Pro", "Noto Sans", "Helvetica Neue", "Helvetica", "Arial", "system-ui"];

/**
 * Post-process LLM-generated HTML to enforce premium fonts deterministically.
 *
 * LLMs frequently default to Inter/Open Sans regardless of prompt instructions.
 * This function patches the output in two passes:
 *  1. Replace the Google Fonts <link> with the correct premium pair URL.
 *  2. Replace font-family CSS declarations for known generic fonts.
 */
function applyPremiumFonts(html: string, headingFont: string, bodyFont: string): string {
  const headingSlug = headingFont.replace(/ /g, "+");
  const bodySlug = bodyFont.replace(/ /g, "+");
  const premiumLink = `<link href="https://fonts.googleapis.com/css2?family=${headingSlug}:ital,wght@0,300;0,400;0,600;1,300;1,400&family=${bodySlug}:wght@400;500;600&display=swap" rel="stylesheet">`;

  // 1. Replace any existing Google Fonts link(s) with the premium one.
  let result = html.replace(/<link[^>]+fonts\.googleapis\.com\/css2[^>]*>/gi, premiumLink);
  if (!result.includes("fonts.googleapis.com")) {
    result = result.replace("</head>", `${premiumLink}\n</head>`);
  }

  // Helper: replace a quoted or unquoted font name in a font-family value.
  const replaceFontName = (src: string, name: string, replacement: string): string => {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Matches: 'Inter', "Inter", or plain Inter (before comma or ;)
    return src.replace(new RegExp(`['"]${escaped}['"]|(?<![\\w-])${escaped}(?=[\\s,;])`, "g"), `'${replacement}'`);
  };

  // 2. Swap banned heading fonts → headingFont.
  for (const banned of BANNED_HEADING_FONTS) {
    result = replaceFontName(result, banned, headingFont);
  }

  // 3. Swap banned body fonts → bodyFont.
  for (const banned of BANNED_BODY_FONTS) {
    result = replaceFontName(result, banned, bodyFont);
  }

  return result;
}

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

/** Fetch the idea's landing (or null). */
export async function getLanding(ideaId: string): Promise<MktLanding | null> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return null;

  const { data } = await ctx.supabase
    .from("mkt_landing" as never)
    .select("*")
    .eq("idea_id", ideaId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (data as unknown as MktLanding) ?? null;
}

export interface SaveLandingInput {
  id?: string;
  slug: string;
  code_html: string;
  /** Structured qualification quiz; the capture API validates answers against it. */
  quiz_schema?: QuizQuestion[];
  /** Tally (or similar) form URL embedded after a successful capture. */
  survey_url?: string | null;
  published: boolean;
}

/** Create or update the idea's landing page. */
export async function saveLanding(
  ideaId: string,
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

  // Title is auto-derived from the idea name (the browser-tab title for the
  // iframe host page); the code itself owns all on-page content.
  const { data: ideaRow } = await ctx.supabase
    .from("idea")
    .select("name")
    .eq("id", ideaId)
    .maybeSingle();

  // Keep only well-formed quiz questions (key + question + ≥2 options).
  const quizSchema = (input.quiz_schema ?? []).filter(
    (q) => q.key?.trim() && q.question?.trim() && (q.options?.length ?? 0) >= 2
  );

  const row = {
    idea_id: ideaId,
    slug,
    title: (ideaRow as { name: string | null } | null)?.name ?? null,
    code_html: input.code_html || null,
    quiz_schema: quizSchema,
    survey_url: input.survey_url?.trim() || null,
    // Waitlist stays enabled so /api/m/[slug]/capture keeps recording signals
    // from the form inside the generated code; quiz is enabled once a
    // structured schema exists (answers then validate against it).
    capture_stages: quizSchema.length > 0 ? ["waitlist", "quiz"] : ["waitlist"],
    published: input.published,
  };

  let result;
  if (input.id) {
    result = await ctx.supabase
      .from("mkt_landing" as never)
      .update(row as never)
      .eq("id", input.id)
      .eq("idea_id", ideaId)
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

  revalidatePath(`/marketing/${ideaId}/landing`);
  revalidatePath(`/marketing/${ideaId}`);
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
  ideaId: string
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

  // ── 1. Load idea context ────────────────────────────────────────────────────
  const [
    { data: v },
    { data: ideaRow },
    { data: landingRow },
  ] = await Promise.all([
    ctx.supabase.from("mkt_validation" as never).select("positioning, icp_definition").eq("idea_id", ideaId).maybeSingle(),
    ctx.supabase.from("idea" as never).select("id, name, description").eq("id" as never, ideaId).maybeSingle(),
    ctx.supabase.from("mkt_landing" as never).select("quiz_schema").eq("idea_id", ideaId).limit(1).maybeSingle(),
  ]);
  const quizSchema = ((landingRow as { quiz_schema: QuizQuestion[] } | null)?.quiz_schema ?? []) as QuizQuestion[];

  const validation = v as { positioning: string | null; icp_definition: Record<string, unknown> | null } | null;
  const idea = (ideaRow as unknown as { id: string; name: string | null; description: string | null } | null) ?? null;
  const positioning = validation?.positioning ?? "";
  const dna = (validation?.icp_definition ?? {}) as Record<string, string>;

  // ── 2. Load extra idea context in parallel ─────────────────────────────────
  const [{ data: structureData }, { data: icpData }, { data: stylesData }] = await Promise.all([
    ctx.supabase.from("idea_structure_and_align" as never).select("core_problem, essential_features_text, target_audience").eq("idea_id" as never, ideaId).maybeSingle(),
    ctx.supabase.from("idea_icp" as never).select("description, pain_points").eq("idea_id" as never, ideaId).limit(1).maybeSingle(),
    ctx.supabase.from("idea_styles" as never).select("primary_color, secondary_color, accent_color, typography, color_tokens, spacing, border_radius, shadows, brand_voice, iconography_style, motion_principles").eq("idea_id" as never, ideaId).maybeSingle(),
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

  // Map generic/web-safe fonts to premium editorial alternatives so the Designer
  // always receives a distinctive pairing regardless of what the brand DB stores.
  const PREMIUM_FONT_MAP: Record<string, string> = {
    "Poppins": "Cormorant Garamond",
    "Inter": "Cormorant Garamond",
    "Roboto": "Playfair Display",
    "Open Sans": "Libre Baskerville",
    "Lato": "DM Sans",
    "Helvetica": "Mulish",
    "Helvetica Neue": "Mulish",
    "Arial": "Mulish",
    "system-ui": "Cormorant Garamond",
    "sans-serif": "DM Sans",
    "Nunito": "DM Sans",
    "Raleway": "Cormorant Garamond",
    "Montserrat": "Cormorant Garamond",
    "Noto Sans": "DM Sans",
    "Source Sans Pro": "DM Sans",
  };
  // The DB may store a full CSS font stack ("'Inter', sans-serif") — extract just
  // the first font name (stripped of quotes) before doing the map lookup.
  const extractFirstFontName = (stack: string | null | undefined): string => {
    const raw = (stack ?? "").trim();
    const first = raw.split(",")[0].replace(/['"]/g, "").trim();
    return first || "Poppins";
  };
  const rawHeadingName = extractFirstFontName(typography.heading_font);
  const rawBodyName = extractFirstFontName(typography.body_font);
  const premiumHeadingFont = PREMIUM_FONT_MAP[rawHeadingName] ?? rawHeadingName;
  const premiumBodyFont = PREMIUM_FONT_MAP[rawBodyName] ?? rawBodyName;

  const designSystemJson = JSON.stringify({
    colors: {
      primary: styles.primary_color ?? "#6D9773",
      secondary: styles.secondary_color ?? "#F4EBD0",
      accent: styles.accent_color ?? "#D4A59A",
      tokens: styles.color_tokens ?? {},
    },
    typography: {
      ...typography,
      // Premium overrides applied AFTER spread so they win over DB defaults.
      heading_font: premiumHeadingFont,
      body_font: premiumBodyFont,
    },
    spacing: styles.spacing ?? {},
    border_radius: styles.border_radius ?? {},
    shadows: styles.shadows ?? {},
    brand_voice: styles.brand_voice ?? "",
    iconography_style: styles.iconography_style ?? "",
    motion_principles: styles.motion_principles ?? "",
  }, null, 2);

  const imageQuery = [idea?.name, dna.target_audience].filter(Boolean).join(" ") || "lifestyle professional";
  const landingImages = await searchLandingImages(imageQuery);

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
    heading_font: premiumHeadingFont,
    body_font: premiumBodyFont,
    // Full design system as structured JSON
    design_system_json: designSystemJson,
    // Structured qualification quiz — when present, the Designer must render
    // this exact schema (capture validates answers against it server-side).
    quiz_schema_json: quizSchema.length > 0 ? JSON.stringify(quizSchema, null, 2) : "",
    // Real photographs fetched from Pexels (PEXELS_API_KEY) or generic fallbacks.
    // The Designer uses these as actual <img> elements rather than CSS gradients.
    images_json: JSON.stringify(landingImages, null, 2),
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
  // Strip markdown code fences if the LLM wraps HTML despite instructions (```html ... ```)
  let html = r3.text.trim();
  if (html.startsWith("```")) {
    html = html.replace(/^```(?:html)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  }
  // Deterministically enforce premium fonts regardless of what the LLM chose.
  html = applyPremiumFonts(html, premiumHeadingFont, premiumBodyFont);

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
        let revisedText = r4b.text.trim();
        if (revisedText.startsWith("```")) {
          revisedText = revisedText.replace(/^```(?:html)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
        }
        reviewedHtml = applyPremiumFonts(revisedText, premiumHeadingFont, premiumBodyFont);
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
  ideaId: string,
  landingId: string,
  published: boolean
): Promise<{ error?: string }> {
  const ctx = await getAdminClient();
  if ("error" in ctx) return { error: ctx.error };

  const { error } = await ctx.supabase
    .from("mkt_landing" as never)
    .update({ published } as never)
    .eq("id", landingId)
    .eq("idea_id", ideaId);

  if (error) return { error: error.message };
  revalidatePath(`/marketing/${ideaId}/landing`);
  return {};
}
