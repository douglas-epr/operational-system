/**
 * Server Actions for Sandbox Planner.
 * Handles CRUD for ideas and related entities, plus AI generation triggers.
 * Source: docs/reference_docs/paginas.md — sandbox-planner workflows
 */
"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type {
  IdeaBlock,
  IdeaChatbotMessage,
  IdeaFull,
} from "@/types/sandbox-planner";
import { IDEA_BLOCK_LABELS } from "@/types/sandbox-planner";
import { generateAiJsonResponse } from "@/lib/api/ai-dispatcher";
import { loadIdeaFull } from "./_lib/loadIdeaFull";
import type {
  StructureAlignOutput,
  ICPsOutput,
  ProductDefinitionOutput,
  StrategicFrameworksOutput,
  BenchmarkingOutput,
  PrdOutput,
  DatabaseOutput,
  VisualStylesOutput,
  MilestonesAndTasksOutput,
  ReportOutput,
  ReportAreaOutput,
  ReportPenaltyOutput,
} from "@/lib/api/json-converters";

const PATH = "/sandbox-planner";

// ── Idea CRUD ────────────────────────────────────────────────────────────────

/** Create a new idea and return its id. */
export async function createIdea(data: {
  name: string;
  description: string;
  project_id?: string;
}): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: row, error } = await supabase
    .from("idea")
    .insert({
      name: data.name,
      description: data.description,
      project_id: data.project_id || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath(PATH);
  return { id: row.id };
}

/** Update an existing idea. */
export async function updateIdea(
  id: string,
  data: Record<string, unknown>
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { error } = await supabase.from("idea").update(data).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return {};
}

/** Delete an idea and all cascaded children (handled by DB FK ON DELETE CASCADE). */
export async function deleteIdea(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { error } = await supabase.from("idea").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return {};
}

/**
 * Clear a stuck `current_blocks_updating` flag on an idea.
 * Called when the AI loading overlay times out (155 s) and the server-side
 * generation has not cleared the flag itself (e.g. server crash).
 */
export async function clearAiWorking(ideaId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { error } = await supabase
    .from("idea")
    .update({ current_blocks_updating: null, current_ai_request_id: null })
    .eq("id", ideaId);
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return {};
}

/**
 * Return true when `requestId` is still the active AI request for this idea.
 * Helpers call this right before each DB write so that a stale (slow) AI
 * response cannot overwrite a fresh response produced after the user switched
 * models or re-triggered generation.
 */
async function isRequestActive(
  supabase: SupabaseClient,
  ideaId: string,
  requestId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("idea")
    .select("current_ai_request_id")
    .eq("id", ideaId)
    .maybeSingle();
  return (data as { current_ai_request_id: string | null } | null)?.current_ai_request_id === requestId;
}

// ── Structure & Align ────────────────────────────────────────────────────────

/** Upsert structure & align block for an idea. */
export async function saveStructureAlign(
  ideaId: string,
  data: { core_problem: string; target_audience: string; success_metrics: string }
): Promise<{ error?: string }> {
  const supabase = await createClient();

  // Check if a row already exists
  const { data: existing } = await supabase
    .from("idea_structure_and_align")
    .select("id")
    .eq("idea_id", ideaId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("idea_structure_and_align")
      .update({
        core_problem: data.core_problem,
        target_audience: data.target_audience,
        success_metrics: data.success_metrics,
      })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("idea_structure_and_align")
      .insert({
        idea_id: ideaId,
        core_problem: data.core_problem,
        target_audience: data.target_audience,
        success_metrics: data.success_metrics,
      });
    if (error) return { error: error.message };
  }

  revalidatePath(PATH);
  return {};
}

// ── ICP CRUD ─────────────────────────────────────────────────────────────────

/** Save ICP profile fields (day_in_life, pain_points, etc.). */
export async function saveIcpProfile(
  icpId: string,
  data: Record<string, unknown>
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("idea_icp").update(data).eq("id", icpId);
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return {};
}

/** Create a new ICP for an idea. */
export async function createIcp(
  ideaId: string,
  data: { name: string; description?: string }
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("idea_icp")
    .insert({ idea_id: ideaId, name: data.name, description: data.description || null })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return { id: row.id };
}

/** Delete an ICP. */
export async function deleteIcp(icpId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("idea_icp").delete().eq("id", icpId);
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return {};
}

// ── Product Definition ───────────────────────────────────────────────────────

/** Upsert product definition block. */
export async function saveProductDefinition(
  ideaId: string,
  data: { summary?: string; features?: string }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: existing } = await supabase
    .from("idea_product_definition_and_flows")
    .select("id")
    .eq("idea_id", ideaId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("idea_product_definition_and_flows")
      .update(data)
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("idea_product_definition_and_flows")
      .insert({
        idea_id: ideaId,
        created_by: user?.id ?? null,
        ...data,
      });
    if (error) return { error: error.message };
  }

  revalidatePath(PATH);
  return {};
}

// ── Strategic Frameworks / Optimization Suggestions ──────────────────────────

/** Save strategic framework fields on an ICP. */
export async function saveStrategicFramework(
  icpId: string,
  data: Record<string, unknown>
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("idea_icp").update(data).eq("id", icpId);
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return {};
}

/** Create an optimization suggestion. */
export async function createOptimizationSuggestion(
  ideaId: string,
  icpId: string,
  data: { name: string; description?: string }
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("idea_optimization_suggestion")
    .insert({
      idea_id: ideaId,
      icp_id: icpId,
      name: data.name,
      description: data.description || null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return { id: row.id };
}

/** Update an optimization suggestion. */
export async function saveOptimizationSuggestion(
  id: string,
  data: { name?: string; description?: string }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("idea_optimization_suggestion")
    .update(data)
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return {};
}

/** Delete an optimization suggestion. */
export async function deleteOptimizationSuggestion(
  id: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("idea_optimization_suggestion")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return {};
}

// ── Benchmarking ────────────────────────────────────────────────────────────

/** Upsert benchmarking block for an idea. */
export async function saveBenchmarking(
  ideaId: string,
  data: { overview?: string; comparison?: string; possible_business_models?: string; takeaways?: string }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("idea_benchmarking" as never)
    .select("id")
    .eq("idea_id", ideaId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("idea_benchmarking" as never)
      .update(data as never)
      .eq("id", (existing as { id: string }).id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("idea_benchmarking" as never)
      .insert({ idea_id: ideaId, ...data } as never);
    if (error) return { error: error.message };
  }

  revalidatePath(PATH);
  return {};
}

// ── PRD ─────────────────────────────────────────────────────────────────────

/** Upsert PRD block for an idea. */
export async function savePrd(
  ideaId: string,
  data: {
    app_overview?: string;
    objectives?: string;
    priority_personas?: string;
    essential_features?: string;
    user_flow?: string;
    non_functional_reqs?: string;
    out_of_scope?: string;
    success_indicators?: string;
    phasing_notes?: string;
  }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("idea_prd" as never)
    .select("id")
    .eq("idea_id", ideaId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("idea_prd" as never)
      .update(data as never)
      .eq("id", (existing as { id: string }).id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("idea_prd" as never)
      .insert({ idea_id: ideaId, ...data } as never);
    if (error) return { error: error.message };
  }

  revalidatePath(PATH);
  return {};
}

// ── Database ────────────────────────────────────────────────────────────────

/** Upsert database design block for an idea. */
export async function saveDatabase(
  ideaId: string,
  data: { tables_schema?: string; relationships?: string; notes?: string }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("idea_database" as never)
    .select("id")
    .eq("idea_id", ideaId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("idea_database" as never)
      .update(data as never)
      .eq("id", (existing as { id: string }).id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("idea_database" as never)
      .insert({ idea_id: ideaId, ...data } as never);
    if (error) return { error: error.message };
  }

  revalidatePath(PATH);
  return {};
}

// ── Visual Styles ───────────────────────────────────────────────────────────

/** Upsert visual styles block for an idea. */
export async function saveStyles(
  ideaId: string,
  data: {
    logo_branding?: string;
    color_palette?: string;
    product_feeling?: string;
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
    neutral_color?: string;
    color_tokens?: unknown;
    typography?: unknown;
    spacing?: unknown;
    border_radius?: unknown;
    shadows?: unknown;
    brand_voice?: string;
    iconography_style?: string;
    motion_principles?: string;
  }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("idea_styles" as never)
    .select("id")
    .eq("idea_id", ideaId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("idea_styles" as never)
      .update(data as never)
      .eq("id", (existing as { id: string }).id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("idea_styles" as never)
      .insert({ idea_id: ideaId, ...data } as never);
    if (error) return { error: error.message };
  }

  revalidatePath(PATH);
  return {};
}

// ── Milestones & Tasks ──────────────────────────────────────────────────────

/** Upsert milestones & tasks block for an idea. */
export async function saveMilestonesAndTasks(
  ideaId: string,
  data: { content?: string }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("idea_milestones_and_tasks" as never)
    .select("id")
    .eq("idea_id", ideaId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("idea_milestones_and_tasks" as never)
      .update(data as never)
      .eq("id", (existing as { id: string }).id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("idea_milestones_and_tasks" as never)
      .insert({ idea_id: ideaId, ...data } as never);
    if (error) return { error: error.message };
  }

  revalidatePath(PATH);
  return {};
}

// ── Report (step 11) ─────────────────────────────────────────────────────────

/** Upsert partial edits to the Report step (headline / summary / playbook text). */
export async function saveReport(
  ideaId: string,
  data: {
    headline?: string;
    summary?: string;
    next_steps?: string;
    playbook_title?: string;
    playbook_subtitle?: string;
    playbook_html?: string;
  }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("idea_report" as never)
    .select("id")
    .eq("idea_id", ideaId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("idea_report" as never)
      .update(data as never)
      .eq("id", (existing as { id: string }).id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("idea_report" as never)
      .insert({ idea_id: ideaId, ...data } as never);
    if (error) return { error: error.message };
  }

  revalidatePath(PATH);
  return {};
}

// ── Prompt DB Helpers ─────────────────────────────────────────────────────────

// Maps sandbox-planner step names to their stable prompt UUIDs in the DB.
const PROMPT_ID_BY_STEP: Record<string, string> = {
  structure_align: "7d5289fc-37df-4c90-8aab-34ff53e97c54",
  refining_icp: "f361a898-5858-4d24-b605-5e9b2554ac9d",
  product_definition_flows: "965408c8-9910-4caf-81b9-376e44410691",
  strategic_frameworks: "48f29e59-825a-4a3a-bfbd-7ae586839757",
  benchmarking: "b9cab3fd-c4cc-4bed-b9f3-575872452ded",
  prd: "5041e57c-a50c-4468-b154-bf240528b617",
  database: "91e698ec-7893-4ae8-b4aa-11f4b858cb30",
  visual_styles: "26989cc8-37f7-4df3-a994-57930a6d20ea",
  milestones_and_tasks: "9bfb8337-25ca-4259-a6e9-da15cb3bea55",
  milestones_and_tasks_bubble:      "9bfb8337-25ca-4259-a6e9-da15cb3bea55",
  milestones_and_tasks_claude_code: "c1d2e3f4-0001-4000-8000-000000000001",
  report: "e1f6cb88-9a7e-4f5b-bb6c-1c0a8d2f3401",
  idea_chatbot: "a1b2c3d4-0000-4000-8000-000000000001",
};

/** Strip HTML tags from a string so AI prompt templates and idea descriptions
 *  authored in the rich text editor are sent to the LLM as plain text. */
function stripHtml(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .replace(/<br\s*\/?>(?=\s|$)/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|blockquote|tr)>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Fetch prompt template from DB by step name. Uses service client to bypass RLS. */
async function getPromptTemplate(step: string): Promise<string | null> {
  const id = PROMPT_ID_BY_STEP[step];
  if (!id) return null;
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("prompt" as never)
    .select("description")
    .eq("id", id)
    .maybeSingle();
  const raw = (data as { description: string | null } | null)?.description ?? null;
  return raw ? stripHtml(raw) : null;
}

/** Replace {{variable}} placeholders in a template string. */
function renderPrompt(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

const FALLBACK_STRUCTURE_ALIGN = `You are a business analyst. Given the following startup idea, extract and return a JSON object with exactly these keys:
- "The Core Problem": A detailed description of the core problem this idea solves.
- "Target Audience": A detailed description of the primary target audience.
- "Primary Success Metrics": Specific, quantifiable success metrics.

Idea Name: {{idea_name}}
Idea Description: {{idea_description}}

Return ONLY valid JSON.`;

const FALLBACK_REFINING_ICP = `You are an expert in Ideal Customer Profile analysis. Given the following business idea and its structure, generate 3-5 distinct ICPs.

Idea: {{idea_name}} — {{idea_description}}
Core Problem: {{core_problem}}
Target Audience: {{target_audience}}

Return a JSON object with key "ICPs" containing an array of objects, each with:
- "name": ICP persona name
- "description": Brief description of this persona
- "operational_environment": Day in the life context and environment (rich HTML allowed)
- "strategic_pain_points_and_acute_needs": Key pain points and urgent needs (rich HTML allowed)
- "how_problems_are_solved_currently": Rich HTML describing how this ICP solves those problems today — tools, services, workarounds, manual processes, and compromises.
- "how_problems_could_be_solved": Rich HTML enumerating ALL plausible ways these problems could be solved — existing tools/services, alternative workflows, emerging technologies, DIY approaches, and finally where our product could fit in. This is a broad solution-landscape survey, not a pitch for our product.
- "our_solution_value": REQUIRED. Rich HTML describing specifically what value our product's solution brings to this ICP — tied directly to their acute pain points and daily friction, not generic benefits. Be concrete and specific; cite specific pains from above and name the exact capability that resolves each one. **Do not leave this field empty or return a generic statement.**

Return ONLY valid JSON.`;

const FALLBACK_PRODUCT_DEFINITION = `You are a product strategist. Given the following startup idea, define the product.

Idea: {{idea_name}} — {{idea_description}}
Core Problem: {{core_problem}}
Target Audience: {{target_audience}}
ICPs: {{icp_names}}

Return a JSON object with:
- "Product Overview": Rich HTML text describing the product vision and architecture
- "Feature List & Logic": Rich HTML text with features organized by categories
- "User Flows": Array of objects with "user_name" (string), "description" (string), "user_flow" (string with HTML flow description)

Return ONLY valid JSON.`;

const FALLBACK_STRATEGIC_FRAMEWORKS = `You are a strategic business consultant. Generate comprehensive strategic frameworks for each ICP.

Idea: {{idea_name}} — {{idea_description}}
Core Problem: {{core_problem}}
Target Audience: {{target_audience}}

ICPs:
{{icp_descriptions}}

Return a JSON object with key "ICPs" containing an array of objects — one per ICP — each with ALL of these fields:
- "id": The ICP identifier (use their name as id)
- "name": ICP name
- "score_breakdown": object with these integer sub-scores (each 0–20):
    - "pain_severity": How acute and painful the problem is for this ICP.
    - "pain_frequency": How often this ICP encounters the pain (daily > weekly > monthly).
    - "willingness_to_pay": How strongly this ICP would pay to solve it (budget authority + urgency).
    - "market_reachability": How easy it is to reach this ICP (channels, density, identifiability).
    - "solution_fit": How well our product specifically solves their pain compared to alternatives.
- "score": integer = sum of score_breakdown values (0–100). Do NOT round. Sub-scores MUST differ across ICPs — never give identical breakdowns for two ICPs.
- "score_rationale": REQUIRED. Rich HTML, 2–3 sentences, explaining the breakdown and why this ICP ranks where it does.
- "value_proposition_icp_pains": Rich HTML — ICP's specific pains that the product addresses
- "value_proposition_value_map_solutions": REQUIRED Rich HTML — Value Map: specific solutions/features that relieve this ICP's pains. Do not leave empty.
- "value_proposition_icp_gains": Rich HTML — ICP's desired gains and positive outcomes they seek
- "value_proposition_value_map_gain_creators": REQUIRED Rich HTML — Value Map: how the product creates gains and delivers the ICP's desired outcomes. Do not leave empty.
- "jtbd": Rich HTML — Jobs To Be Done synthesis for this ICP
- "architect_title": ICP archetype title (e.g. "The Overwhelmed SMB Owner")
- "architect_subtitle": REQUIRED ICP archetype subtitle (brief tagline, 4–10 words)
- "picture": REQUIRED URL string for a representative avatar. Use the format: https://api.dicebear.com/7.x/personas/svg?seed=<URL_ENCODED_ARCHETYPE_TITLE> (for example https://api.dicebear.com/7.x/personas/svg?seed=The%20Overwhelmed%20SMB%20Owner). Always return a non-null URL.
- "architect_tags": Array of 3-6 short descriptor tags
- "architect_psychographics": Rich HTML — psychographic profile
- "architect_firmographics": Rich HTML — firmographic profile
- "pitch_need": Rich HTML — NABC pitch: Need
- "pitch_approach": Rich HTML — NABC pitch: Approach
- "pitch_benefit": Rich HTML — NABC pitch: Benefit
- "pitch_competition": Rich HTML — NABC pitch: Competition
- "optimization_suggestions": REQUIRED array of EXACTLY 3–5 objects. Each object has:
    - "name": short noun phrase (≤6 words), e.g. "Automated Brand DNA Onboarding".
    - "description": 1–2 sentence actionable rationale.
  This field is REQUIRED — never omit it and never return an empty array. Each suggestion must target this specific ICP's pains or gains above.

Return ONLY valid JSON.`;

const FALLBACK_BENCHMARKING = `You are a competitive analysis expert. Given the following startup idea and its context, create a comprehensive benchmarking analysis.

Idea: {{idea_name}} — {{idea_description}}
Core Problem: {{core_problem}}
Target Audience: {{target_audience}}
Product Overview: {{product_overview}}

Return a JSON object with exactly these keys:
- "overview": Rich HTML text providing an overview of the competitive landscape and methodology used for benchmarking.
- "comparison": Rich HTML text containing a detailed comparison table of competing apps/platforms. Use an HTML table with columns: Name, Platform(s), Core Functionality, Similarities to the Idea, Pricing / Free Tier, Link / Notes. Include at least 5-8 competitors.
- "possible_business_models": REQUIRED. Rich HTML describing **exactly 4–6** viable business models (SaaS subscription, marketplace, freemium, white-label, usage-based, per-seat, transaction fee, enterprise license, etc.) with a short rationale per model explaining its fit given the product's nature and target audience. Use a <ul> with one <li> per model, model name bolded in <strong>. **Do not leave this field empty.**
- "takeaways": Rich HTML text summarizing key takeaways, differentiators, and strategic positioning insights.

All values must be valid HTML strings.
Return ONLY valid JSON.`;

const FALLBACK_PRD = `You are a senior product manager. Given the following startup idea and its complete context, write a comprehensive Product Requirements Document (PRD).

Idea: {{idea_name}} — {{idea_description}}
Core Problem: {{core_problem}}
Target Audience: {{target_audience}}
Product Overview: {{product_overview}}
Features: {{features}}
ICPs: {{icp_names}}

Return a JSON object with exactly these keys:
- "app_overview": Rich HTML text with the full app overview and vision.
- "objectives": Rich HTML text listing measurable objectives.
- "priority_personas": Rich HTML text describing priority personas (primary, secondary, end user).
- "essential_features": Rich HTML text with essential features organized by category with sub-items.
- "user_flow": Rich HTML text describing the primary user flows for each persona.
- "non_functional_reqs": Rich HTML text listing non-functional requirements (platform, security, scalability, etc.).
- "out_of_scope": Rich HTML text listing what is explicitly out of scope for v1.
- "success_indicators": Rich HTML text with measurable success indicators.
- "phasing_notes": Rich HTML text with phasing/roadmap notes for future development.

All values must be valid HTML strings.
Return ONLY valid JSON.`;

const FALLBACK_DATABASE = `You are a database architect. Given the following startup idea, its PRD, and product definition, design a complete data model.

Idea: {{idea_name}} — {{idea_description}}
Core Problem: {{core_problem}}
Product Overview: {{product_overview}}
Features: {{features}}
PRD Essential Features: {{essential_features}}

Return a JSON object with exactly these keys:
- "tables_schema": Rich HTML text defining all database tables. For each table, include field name, type, and description in HTML table format. Include primary keys, foreign keys, and constraints.
- "relationships": Rich HTML text describing all entity relationships (one-to-one, one-to-many, many-to-many), with clear descriptions of how tables connect.
- "notes": Rich HTML text with important architectural decisions, MVP simplifications, and migration notes.

All values must be valid HTML strings.
Return ONLY valid JSON.`;

const FALLBACK_VISUAL_STYLES = `You are a brand identity designer and design systems expert. Given the following startup idea and product context, create a comprehensive visual style guide and design system.

Idea: {{idea_name}} — {{idea_description}}
Core Problem: {{core_problem}}
Target Audience: {{target_audience}}

Return a JSON object with EXACTLY these keys (no extra keys, no omissions):
- "logo_branding": Rich HTML describing the conceptual logo, app name styling, icon/symbol concepts, and overall brand style.
- "product_feeling": Rich HTML describing the product feeling for different contexts (admin UI, user-facing, mobile) and how the visual identity creates the intended emotional response.
- "primary_color": Hex string (e.g. "#3B82F6") — main brand color.
- "secondary_color": Hex string — secondary brand color.
- "accent_color": Hex string — accent/highlight color.
- "neutral_color": Hex string — neutral/background base color.
- "color_tokens": Array of color token objects. Each object: { "name": string, "hex": string, "role": string, "shades": [{ "hex": string, "label": string }] }. Include 4-6 tokens.
- "typography": Object with keys: "heading_font" (string), "body_font" (string), "mono_font" (string, optional), "scale" (array of { "name": string, "size_px": number, "weight": number, "line_height": number }).
- "spacing": Object with keys: "unit_px" (number, e.g. 4) and "scale" (array of numbers, e.g. [4,8,12,16,24,32,48,64,80,96]).
- "border_radius": Object with keys: "sm", "md", "lg", "xl", "full" — values as CSS strings (e.g. "4px", "8px", "9999px").
- "shadows": Array of shadow objects. Each: { "name": string, "css_value": string (valid CSS box-shadow), "usage": string }. Include 3-4 shadows.
- "brand_voice": Rich HTML describing the brand personality, tone of voice, and communication style.
- "iconography_style": Rich HTML describing the icon library choice, style guidelines, and usage rules.
- "motion_principles": Rich HTML describing animation philosophy, transition speeds, and easing curves.

All HTML values must be valid HTML strings. All color values must be valid hex strings.
Return ONLY valid JSON with no markdown fences.`;

const FALLBACK_MILESTONES = `You are a project planning expert. Given the following startup idea, its PRD, and database design, create a comprehensive project milestone and task breakdown.

Idea: {{idea_name}} — {{idea_description}}
PRD Overview: {{prd_overview}}
PRD Features: {{essential_features}}

Return a JSON object with exactly this key:
- "content": Rich HTML text containing the complete project milestones and tasks breakdown. Structure as:
  - Multiple milestones (Milestone 1, 2, 3, etc.), each with a Focus description and Total Estimated Time in hours.
  - For each milestone, include an HTML table with columns: Task Name, Estimated Time (h), Definition of Done.
  - Include QA and client request buffer tasks in each milestone.
  - End with exit criteria for each milestone.

The value must be a valid HTML string.
Return ONLY valid JSON.`;

// ── AI Generation ────────────────────────────────────────────────────────────

// `resolveAiConfig` was extracted to `src/lib/api/ai-config.ts` so the
// chatbot, sandbox-planner, and the new project task importer can share
// one source of truth. The local `SupabaseClient` / `AiConfig` aliases
// remain because helper signatures throughout this file annotate
// `supabase: SupabaseClient` and `ai: AiConfig` — duplicating the alias
// here is cheaper than rewriting every internal helper signature.
import { resolveAiConfig, type AiConfig as SharedAiConfig } from "@/lib/api/ai-config";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;
type AiConfig = SharedAiConfig;

/** Trigger AI generation for a specific step. Long-running — updates idea state before/after. */
export async function triggerAiGeneration(
  ideaId: string,
  step: IdeaBlock,
  icpId?: string,
  platform?: "bubble" | "claude_code"
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Resolve AI configuration
  const aiConfig = await resolveAiConfig(supabase, user.id);
  if (!aiConfig) {
    return { error: "No AI service configured. Please set up your API key in Settings." };
  }

  // Unique id for this AI run. Any later `.update()` is guarded on this id
  // still being the active request — if the user switched models or retriggered,
  // the newer run overwrites `current_ai_request_id` and this run's writes skip.
  const requestId = crypto.randomUUID();

  // Mark idea as updating with our requestId
  await supabase
    .from("idea")
    .update({ current_blocks_updating: step, current_ai_request_id: requestId })
    .eq("id", ideaId);

  try {
    // Fetch idea data
    const { data: idea } = await supabase
      .from("idea")
      .select("*")
      .eq("id", ideaId)
      .single();
    if (!idea) return { error: "Idea not found" };

    // Fetch structure & align data if needed
    const { data: structureAlign } = await supabase
      .from("idea_structure_and_align")
      .select("*")
      .eq("idea_id", ideaId)
      .maybeSingle();

    // Fetch existing ICPs if needed
    const { data: icps } = await supabase
      .from("idea_icp")
      .select("*")
      .eq("idea_id", ideaId);

    // Fetch product definition and PRD for later steps
    const { data: productDef } = await supabase
      .from("idea_product_definition_and_flows")
      .select("*")
      .eq("idea_id", ideaId)
      .maybeSingle();

    const { data: prdData } = await supabase
      .from("idea_prd" as never)
      .select("*")
      .eq("idea_id", ideaId)
      .maybeSingle();

    // Additional fetches used by the Report step (cheap enough to do up-front).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let suggestionsRows: any[] | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let benchmarkingRow: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let databaseRow: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let stylesRow: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let milestonesRow: any = null;
    if (step === "report") {
      const [sugRes, benchRes, dbRes, styleRes, mileRes] = await Promise.all([
        supabase.from("idea_optimization_suggestion").select("*").eq("idea_id", ideaId),
        supabase.from("idea_benchmarking" as never).select("*").eq("idea_id", ideaId).maybeSingle(),
        supabase.from("idea_database" as never).select("*").eq("idea_id", ideaId).maybeSingle(),
        supabase.from("idea_styles" as never).select("*").eq("idea_id", ideaId).maybeSingle(),
        supabase.from("idea_milestones_and_tasks" as never).select("*").eq("idea_id", ideaId).maybeSingle(),
      ]);
      suggestionsRows = sugRes.data;
      benchmarkingRow = benchRes.data;
      databaseRow = dbRes.data;
      stylesRow = styleRes.data;
      milestonesRow = mileRes.data;
    }

    let result: { error?: string } = {};

    switch (step) {
      case "structure_align":
        result = await generateStructureAlign(supabase, idea, ideaId, aiConfig, requestId);
        break;
      case "refining_icp":
        result = await generateRefiningIcp(supabase, idea, structureAlign, ideaId, aiConfig, requestId);
        break;
      case "product_definition_flows":
        result = await generateProductDefinition(
          supabase, idea, structureAlign, icps ?? [], ideaId, aiConfig, requestId
        );
        break;
      case "strategic_frameworks":
        result = await generateStrategicFrameworks(
          supabase, idea, structureAlign, icps ?? [], ideaId, icpId, aiConfig, requestId
        );
        break;
      case "benchmarking":
        result = await generateBenchmarking(
          supabase, idea, structureAlign, productDef, ideaId, aiConfig, requestId
        );
        break;
      case "prd":
        result = await generatePrdContent(
          supabase, idea, structureAlign, icps ?? [], productDef, ideaId, aiConfig, requestId
        );
        break;
      case "database":
        result = await generateDatabaseContent(
          supabase, idea, structureAlign, productDef, prdData, ideaId, aiConfig, requestId
        );
        break;
      case "visual_styles":
        result = await generateVisualStylesContent(
          supabase, idea, structureAlign, ideaId, aiConfig, requestId
        );
        break;
      case "milestones_and_tasks":
        result = await generateMilestonesContent(
          supabase, idea, prdData, ideaId, aiConfig, requestId, platform
        );
        break;
      case "report":
        result = await generateReport(
          supabase,
          idea,
          structureAlign,
          icps ?? [],
          suggestionsRows ?? [],
          productDef,
          benchmarkingRow,
          prdData,
          databaseRow,
          stylesRow,
          milestonesRow,
          ideaId,
          aiConfig,
          requestId
        );
        break;
    }

    // Mark step as completed — but only if we are still the active request.
    // If a newer run overwrote `current_ai_request_id`, it now owns the final
    // clear and we must not touch these fields.
    if (await isRequestActive(supabase, ideaId, requestId)) {
      await supabase
        .from("idea")
        .update({
          current_blocks_updating: null,
          current_block_ended: step as never,
          current_ai_request_id: null,
        })
        .eq("id", ideaId);
    }

    revalidatePath(PATH);
    return result;
  } catch (e) {
    // Clear updating state on error — same guard: don't clobber a newer run.
    if (await isRequestActive(supabase, ideaId, requestId)) {
      await supabase
        .from("idea")
        .update({ current_blocks_updating: null, current_ai_request_id: null })
        .eq("id", ideaId);
    }
    revalidatePath(PATH);
    return { error: e instanceof Error ? e.message : "AI generation failed" };
  }
}

// ── AI Generation Helpers (private) ──────────────────────────────────────────

async function generateStructureAlign(
  supabase: SupabaseClient,
  idea: { name: string; description: string | null },
  ideaId: string,
  aiConfig: AiConfig,
  requestId: string
): Promise<{ error?: string }> {
  const template = (await getPromptTemplate("structure_align")) ?? FALLBACK_STRUCTURE_ALIGN;
  const prompt = renderPrompt(template, {
    idea_name: idea.name,
    idea_description: stripHtml(idea.description) || "No description provided.",
  });

  const res = await generateAiJsonResponse<StructureAlignOutput>({
    service: aiConfig.service,
    apiKey: aiConfig.apiKey,
    model: aiConfig.model,
    prompt,
  });

  if (res.returned_an_error || !res.data) {
    return { error: res.error ?? "AI returned no data" };
  }

  // Guard: skip the write if a newer AI request has taken over.
  if (!(await isRequestActive(supabase, ideaId, requestId))) return {};

  const d = res.data;
  const { data: existing } = await supabase
    .from("idea_structure_and_align")
    .select("id")
    .eq("idea_id", ideaId)
    .maybeSingle();

  const payload = {
    core_problem: d["The Core Problem"],
    target_audience: d["Target Audience"],
    success_metrics: d["Primary Success Metrics"],
  };

  if (existing) {
    await supabase
      .from("idea_structure_and_align")
      .update(payload)
      .eq("id", existing.id);
  } else {
    await supabase
      .from("idea_structure_and_align")
      .insert({ idea_id: ideaId, ...payload });
  }

  return {};
}

async function generateRefiningIcp(
  supabase: SupabaseClient,
  idea: { name: string; description: string | null },
  structureAlign: { core_problem: string | null; target_audience: string | null } | null,
  ideaId: string,
  aiConfig: AiConfig,
  requestId: string
): Promise<{ error?: string }> {
  const template = (await getPromptTemplate("refining_icp")) ?? FALLBACK_REFINING_ICP;
  const prompt = renderPrompt(template, {
    idea_name: idea.name,
    idea_description: stripHtml(idea.description),
    core_problem: stripHtml(structureAlign?.core_problem) || "Not defined yet",
    target_audience: stripHtml(structureAlign?.target_audience) || "Not defined yet",
  });

  const res = await generateAiJsonResponse<ICPsOutput>({
    service: aiConfig.service,
    apiKey: aiConfig.apiKey,
    model: aiConfig.model,
    prompt,
  });

  if (res.returned_an_error || !res.data) {
    return { error: res.error ?? "AI returned no data" };
  }

  // Guard: skip the write if a newer AI request has taken over.
  if (!(await isRequestActive(supabase, ideaId, requestId))) return {};

  // Delete existing ICPs for this idea, then insert new ones
  await supabase.from("idea_icp").delete().eq("idea_id", ideaId);

  const rows = res.data.ICPs.map((icp) => ({
    idea_id: ideaId,
    name: icp.name,
    description: icp.description ?? null,
    day_in_life: icp.operational_environment,
    pain_points: icp.strategic_pain_points_and_acute_needs,
    how_problems_are_solved: icp.how_problems_are_solved_currently ?? null,
    how_problems_could_be_solved: icp.how_problems_could_be_solved ?? null,
    our_solution_value: (icp as unknown as { our_solution_value?: string }).our_solution_value ?? null,
  }));

  if (rows.length > 0) {
    await supabase.from("idea_icp").insert(rows);
  }

  return {};
}

async function generateProductDefinition(
  supabase: SupabaseClient,
  idea: { name: string; description: string | null },
  structureAlign: { core_problem: string | null; target_audience: string | null } | null,
  icps: { name: string | null; description: string | null }[],
  ideaId: string,
  aiConfig: AiConfig,
  requestId: string
): Promise<{ error?: string }> {
  const icpNames = icps.map((i) => i.name).filter(Boolean).join(", ");
  const template = (await getPromptTemplate("product_definition_flows")) ?? FALLBACK_PRODUCT_DEFINITION;
  const prompt = renderPrompt(template, {
    idea_name: idea.name,
    idea_description: stripHtml(idea.description),
    core_problem: stripHtml(structureAlign?.core_problem) || "Not defined yet",
    target_audience: stripHtml(structureAlign?.target_audience) || "Not defined yet",
    icp_names: icpNames || "None defined yet",
  });

  const res = await generateAiJsonResponse<ProductDefinitionOutput>({
    service: aiConfig.service,
    apiKey: aiConfig.apiKey,
    model: aiConfig.model,
    prompt,
  });

  if (res.returned_an_error || !res.data) {
    return { error: res.error ?? "AI returned no data" };
  }

  // Guard: skip the write if a newer AI request has taken over.
  if (!(await isRequestActive(supabase, ideaId, requestId))) return {};

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const d = res.data;

  // Upsert product definition
  const { data: existing } = await supabase
    .from("idea_product_definition_and_flows")
    .select("id")
    .eq("idea_id", ideaId)
    .maybeSingle();

  const payload = {
    summary: d["Product Overview"],
    features: d["Feature List & Logic"],
  };

  if (existing) {
    await supabase
      .from("idea_product_definition_and_flows")
      .update(payload)
      .eq("id", existing.id);
  } else {
    await supabase
      .from("idea_product_definition_and_flows")
      .insert({ idea_id: ideaId, created_by: user?.id ?? null, ...payload });
  }

  return {};
}

async function generateStrategicFrameworks(
  supabase: SupabaseClient,
  idea: { name: string; description: string | null },
  structureAlign: { core_problem: string | null; target_audience: string | null } | null,
  icps: { id: string; name: string | null; description: string | null; day_in_life: string | null; pain_points: string | null }[],
  ideaId: string,
  icpId: string | undefined,
  aiConfig: AiConfig,
  requestId: string
): Promise<{ error?: string }> {
  const targetIcps = icpId ? icps.filter((i) => i.id === icpId) : icps;
  const icpDescriptions = targetIcps
    .map((i) => `- ${i.name}: ${stripHtml(i.description)} (Day in life: ${stripHtml(i.day_in_life)}, Pain points: ${stripHtml(i.pain_points)})`)
    .join("\n");

  const template = (await getPromptTemplate("strategic_frameworks")) ?? FALLBACK_STRATEGIC_FRAMEWORKS;
  const prompt = renderPrompt(template, {
    idea_name: idea.name,
    idea_description: stripHtml(idea.description),
    core_problem: stripHtml(structureAlign?.core_problem) || "Not defined yet",
    target_audience: stripHtml(structureAlign?.target_audience) || "Not defined yet",
    icp_descriptions: icpDescriptions,
  });

  const res = await generateAiJsonResponse<StrategicFrameworksOutput>({
    service: aiConfig.service,
    apiKey: aiConfig.apiKey,
    model: aiConfig.model,
    prompt,
  });

  if (res.returned_an_error || !res.data) {
    return { error: res.error ?? "AI returned no data" };
  }

  // Guard: skip the write if a newer AI request has taken over.
  if (!(await isRequestActive(supabase, ideaId, requestId))) return {};

  // Update each ICP with framework data
  for (const framework of res.data.ICPs) {
    // Find matching ICP by name
    const matchingIcp = targetIcps.find(
      (i) => i.name?.toLowerCase() === framework.name?.toLowerCase()
    );
    if (!matchingIcp) continue;

    await supabase
      .from("idea_icp")
      .update({
        score: (framework as unknown as { score?: number }).score ?? null,
        score_rationale: (framework as unknown as { score_rationale?: string }).score_rationale ?? null,
        value_proposition_icp_pains: framework.value_proposition_icp_pains ?? null,
        value_proposition_value_map_solutions: (framework as unknown as { value_proposition_value_map_solutions?: string }).value_proposition_value_map_solutions ?? null,
        value_proposition_icp_gains: framework.value_proposition_icp_gains ?? null,
        value_proposition_value_map_gain_creators: (framework as unknown as { value_proposition_value_map_gain_creators?: string }).value_proposition_value_map_gain_creators ?? null,
        jtbd: framework.jtbd ?? null,
        title: framework.architect_title ?? null,
        subtitle: framework.architect_subtitle ?? null,
        picture: (framework as unknown as { picture?: string }).picture ?? null,
        tags: framework.architect_tags ?? [],
        psychographics: framework.architect_psychographics ?? null,
        firmographics: framework.architect_firmographics ?? null,
        pitch_need: framework.pitch_need ?? null,
        pitch_approach: framework.pitch_approach ?? null,
        pitch_benefit: framework.pitch_benefit ?? null,
        pitch_competition: framework.pitch_competition ?? null,
      })
      .eq("id", matchingIcp.id);

    // Handle optimization suggestions if present
    const suggestions = (framework as unknown as { optimization_suggestions?: { name: string; description: string }[] })
      .optimization_suggestions;
    if (suggestions && suggestions.length > 0) {
      // Delete existing suggestions for this ICP
      await supabase
        .from("idea_optimization_suggestion")
        .delete()
        .eq("icp_id", matchingIcp.id);

      const suggestionRows = suggestions.map((s) => ({
        idea_id: ideaId,
        icp_id: matchingIcp.id,
        name: s.name,
        description: s.description,
      }));
      await supabase.from("idea_optimization_suggestion").insert(suggestionRows);
    }
  }

  return {};
}

// ── Benchmarking Generation ─────────────────────────────────────────────────

async function generateBenchmarking(
  supabase: SupabaseClient,
  idea: { name: string; description: string | null },
  structureAlign: { core_problem: string | null; target_audience: string | null } | null,
  productDef: { summary: string | null } | null,
  ideaId: string,
  aiConfig: AiConfig,
  requestId: string
): Promise<{ error?: string }> {
  const template = (await getPromptTemplate("benchmarking")) ?? FALLBACK_BENCHMARKING;
  const prompt = renderPrompt(template, {
    idea_name: idea.name,
    idea_description: stripHtml(idea.description),
    core_problem: stripHtml(structureAlign?.core_problem) || "Not defined yet",
    target_audience: stripHtml(structureAlign?.target_audience) || "Not defined yet",
    product_overview: stripHtml(productDef?.summary) || "Not defined yet",
  });

  const res = await generateAiJsonResponse<BenchmarkingOutput>({
    service: aiConfig.service,
    apiKey: aiConfig.apiKey,
    model: aiConfig.model,
    prompt,
  });

  if (res.returned_an_error || !res.data) {
    return { error: res.error ?? "AI returned no data" };
  }

  // Guard: skip the write if a newer AI request has taken over.
  if (!(await isRequestActive(supabase, ideaId, requestId))) return {};

  const d = res.data;
  const { data: existing } = await supabase
    .from("idea_benchmarking" as never)
    .select("id")
    .eq("idea_id", ideaId)
    .maybeSingle();

  const payload = {
    overview: d.overview,
    comparison: d.comparison,
    possible_business_models: d.possible_business_models || null,
    takeaways: d.takeaways,
  };

  if (existing) {
    await supabase
      .from("idea_benchmarking" as never)
      .update(payload as never)
      .eq("id", (existing as { id: string }).id);
  } else {
    await supabase
      .from("idea_benchmarking" as never)
      .insert({ idea_id: ideaId, ...payload } as never);
  }

  return {};
}

// ── PRD Generation ──────────────────────────────────────────────────────────

async function generatePrdContent(
  supabase: SupabaseClient,
  idea: { name: string; description: string | null },
  structureAlign: { core_problem: string | null; target_audience: string | null } | null,
  icps: { name: string | null }[],
  productDef: { summary: string | null; features: string | null } | null,
  ideaId: string,
  aiConfig: AiConfig,
  requestId: string
): Promise<{ error?: string }> {
  const icpNames = icps.map((i) => i.name).filter(Boolean).join(", ");
  const template = (await getPromptTemplate("prd")) ?? FALLBACK_PRD;
  const prompt = renderPrompt(template, {
    idea_name: idea.name,
    idea_description: stripHtml(idea.description),
    core_problem: stripHtml(structureAlign?.core_problem) || "Not defined yet",
    target_audience: stripHtml(structureAlign?.target_audience) || "Not defined yet",
    product_overview: stripHtml(productDef?.summary) || "Not defined yet",
    features: stripHtml(productDef?.features) || "Not defined yet",
    icp_names: icpNames || "None defined yet",
  });

  const res = await generateAiJsonResponse<PrdOutput>({
    service: aiConfig.service,
    apiKey: aiConfig.apiKey,
    model: aiConfig.model,
    prompt,
  });

  if (res.returned_an_error || !res.data) {
    return { error: res.error ?? "AI returned no data" };
  }

  // Guard: skip the write if a newer AI request has taken over.
  if (!(await isRequestActive(supabase, ideaId, requestId))) return {};

  const d = res.data;
  const { data: existing } = await supabase
    .from("idea_prd" as never)
    .select("id")
    .eq("idea_id", ideaId)
    .maybeSingle();

  const payload = {
    app_overview: d.app_overview,
    objectives: d.objectives,
    priority_personas: d.priority_personas,
    essential_features: d.essential_features,
    user_flow: d.user_flow,
    non_functional_reqs: d.non_functional_reqs,
    out_of_scope: d.out_of_scope,
    success_indicators: d.success_indicators,
    phasing_notes: d.phasing_notes,
  };

  if (existing) {
    await supabase
      .from("idea_prd" as never)
      .update(payload as never)
      .eq("id", (existing as { id: string }).id);
  } else {
    await supabase
      .from("idea_prd" as never)
      .insert({ idea_id: ideaId, ...payload } as never);
  }

  return {};
}

// ── Database Generation ─────────────────────────────────────────────────────

async function generateDatabaseContent(
  supabase: SupabaseClient,
  idea: { name: string; description: string | null },
  structureAlign: { core_problem: string | null } | null,
  productDef: { summary: string | null; features: string | null } | null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prdData: any,
  ideaId: string,
  aiConfig: AiConfig,
  requestId: string
): Promise<{ error?: string }> {
  const prd = prdData as { essential_features: string | null } | null;
  const template = (await getPromptTemplate("database")) ?? FALLBACK_DATABASE;
  const prompt = renderPrompt(template, {
    idea_name: idea.name,
    idea_description: stripHtml(idea.description),
    core_problem: stripHtml(structureAlign?.core_problem) || "Not defined yet",
    product_overview: stripHtml(productDef?.summary) || "Not defined yet",
    features: stripHtml(productDef?.features) || "Not defined yet",
    essential_features: stripHtml(prd?.essential_features) || "Not defined yet",
  });

  const res = await generateAiJsonResponse<DatabaseOutput>({
    service: aiConfig.service,
    apiKey: aiConfig.apiKey,
    model: aiConfig.model,
    prompt,
  });

  if (res.returned_an_error || !res.data) {
    return { error: res.error ?? "AI returned no data" };
  }

  // Guard: skip the write if a newer AI request has taken over.
  if (!(await isRequestActive(supabase, ideaId, requestId))) return {};

  const d = res.data;
  const { data: existing } = await supabase
    .from("idea_database" as never)
    .select("id")
    .eq("idea_id", ideaId)
    .maybeSingle();

  const payload = {
    tables_schema: d.tables_schema,
    relationships: d.relationships,
    notes: d.notes,
  };

  if (existing) {
    await supabase
      .from("idea_database" as never)
      .update(payload as never)
      .eq("id", (existing as { id: string }).id);
  } else {
    await supabase
      .from("idea_database" as never)
      .insert({ idea_id: ideaId, ...payload } as never);
  }

  return {};
}

// ── Visual Styles Generation ────────────────────────────────────────────────

async function generateVisualStylesContent(
  supabase: SupabaseClient,
  idea: { name: string; description: string | null },
  structureAlign: { core_problem: string | null; target_audience: string | null } | null,
  ideaId: string,
  aiConfig: AiConfig,
  requestId: string
): Promise<{ error?: string }> {
  const template = (await getPromptTemplate("visual_styles")) ?? FALLBACK_VISUAL_STYLES;
  const prompt = renderPrompt(template, {
    idea_name: idea.name,
    idea_description: stripHtml(idea.description),
    core_problem: stripHtml(structureAlign?.core_problem) || "Not defined yet",
    target_audience: stripHtml(structureAlign?.target_audience) || "Not defined yet",
  });

  const res = await generateAiJsonResponse<VisualStylesOutput>({
    service: aiConfig.service,
    apiKey: aiConfig.apiKey,
    model: aiConfig.model,
    prompt,
  });

  if (res.returned_an_error || !res.data) {
    return { error: res.error ?? "AI returned no data" };
  }

  // Guard: skip the write if a newer AI request has taken over.
  if (!(await isRequestActive(supabase, ideaId, requestId))) return {};

  const d = res.data;
  const { data: existing } = await supabase
    .from("idea_styles" as never)
    .select("id")
    .eq("idea_id", ideaId)
    .maybeSingle();

  const payload = {
    logo_branding: d.logo_branding,
    product_feeling: d.product_feeling,
    primary_color: d.primary_color,
    secondary_color: d.secondary_color,
    accent_color: d.accent_color,
    neutral_color: d.neutral_color,
    color_tokens: d.color_tokens,
    typography: d.typography,
    spacing: d.spacing,
    border_radius: d.border_radius,
    shadows: d.shadows,
    brand_voice: d.brand_voice,
    iconography_style: d.iconography_style,
    motion_principles: d.motion_principles,
  };

  if (existing) {
    await supabase
      .from("idea_styles" as never)
      .update(payload as never)
      .eq("id", (existing as { id: string }).id);
  } else {
    await supabase
      .from("idea_styles" as never)
      .insert({ idea_id: ideaId, ...payload } as never);
  }

  return {};
}

// ── Milestones & Tasks Generation ───────────────────────────────────────────

async function generateMilestonesContent(
  supabase: SupabaseClient,
  idea: { name: string; description: string | null },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prdData: any,
  ideaId: string,
  aiConfig: AiConfig,
  requestId: string,
  platform?: "bubble" | "claude_code"
): Promise<{ error?: string }> {
  const prd = prdData as { app_overview: string | null; essential_features: string | null } | null;
  const stepKey = platform === "claude_code"
    ? "milestones_and_tasks_claude_code"
    : "milestones_and_tasks_bubble";
  const template = (await getPromptTemplate(stepKey)) ?? FALLBACK_MILESTONES;
  const prompt = renderPrompt(template, {
    idea_name: idea.name,
    idea_description: stripHtml(idea.description),
    prd_overview: stripHtml(prd?.app_overview) || "Not defined yet",
    essential_features: stripHtml(prd?.essential_features) || "Not defined yet",
  });

  const res = await generateAiJsonResponse<MilestonesAndTasksOutput>({
    service: aiConfig.service,
    apiKey: aiConfig.apiKey,
    model: aiConfig.model,
    prompt,
  });

  if (res.returned_an_error || !res.data) {
    return { error: res.error ?? "AI returned no data" };
  }

  // Guard: skip the write if a newer AI request has taken over.
  if (!(await isRequestActive(supabase, ideaId, requestId))) return {};

  const d = res.data;
  const { data: existing } = await supabase
    .from("idea_milestones_and_tasks" as never)
    .select("id")
    .eq("idea_id", ideaId)
    .maybeSingle();

  const payload = {
    content: d.content,
  };

  if (existing) {
    await supabase
      .from("idea_milestones_and_tasks" as never)
      .update(payload as never)
      .eq("id", (existing as { id: string }).id);
  } else {
    await supabase
      .from("idea_milestones_and_tasks" as never)
      .insert({ idea_id: ideaId, ...payload } as never);
  }

  return {};
}

// ── Report Generation ────────────────────────────────────────────────────────

const FALLBACK_REPORT = `You are a senior venture analyst grading a startup idea for Blur Studio's Sandbox Program. Produce a rigorous Readiness Report and Playbook.

## GROUNDING RULES (non-negotiable)
1. Use ONLY the supplied [SOURCE] — never invent facts, metrics, competitors, or features.
2. If a source field is empty or "Not defined", treat that as a strong NEGATIVE signal that lowers the related area score.
3. Every area \`description\` MUST quote at least one concrete fragment (≤ 12 words) from the [SOURCE] in single-quotes — e.g. 'multi-tenant architecture' or 'Meta Graph API dependency'. If no concrete fragment exists for an area, that area CANNOT exceed 60.
4. No generic fillers like "this has potential" or "the market is attractive" — every sentence must be tied to specific source text.

## [SOURCE]
Idea: {{idea_name}} — {{idea_description}}
Success Metrics: {{idea_success_metrics}}
Core Problem: {{core_problem}}
Target Audience: {{target_audience}}
Structure Success Metrics: {{structure_success_metrics}}
ICPs:
{{icps_block}}
Optimization Suggestions:
{{suggestions_block}}
Product Definition: {{product_summary}} / {{product_features}}
Benchmarking: {{benchmark_overview}} / {{benchmark_comparison}} / {{benchmark_business_models}} / {{benchmark_takeaways}}
PRD: {{prd_app_overview}} / {{prd_objectives}} / {{prd_priority_personas}} / {{prd_essential_features}} / {{prd_user_flow}} / {{prd_non_functional_reqs}} / {{prd_out_of_scope}} / {{prd_success_indicators}} / {{prd_phasing_notes}}
Database: {{db_tables_schema}} / {{db_relationships}} / {{db_notes}}
Visual Styles: {{styles_logo_branding}} / {{styles_color_palette}} / {{styles_product_feeling}}
Milestones: {{milestones_content}}

## PER-AREA SCORING RUBRIC
Score each of the 6 areas 0-100 using this rubric:
- 90-100 = comprehensive + specific + cross-validated across MULTIPLE source fields.
- 75-89 = solid but missing one dimension (e.g. ICPs deep but no benchmarking ties).
- 60-74 = present but generic OR only single-sourced.
- 40-59 = thin, vague, or internally contradictory.
- 0-39  = absent or contradicts other source fields.

### Area 1 — customer_problem_reality (weight 25%)
Evidence fields: core_problem, target_audience, ICP pain_points, ICP firmographics/psychographics, ICP how_problems_are_solved, structure_success_metrics.
Key questions: Is the pain quantified? Are ICPs concrete (not "SMBs")? Is "how solved today" specific?

### Area 2 — competitive_alternative (weight 15%)
Evidence fields: benchmark_overview, benchmark_comparison, benchmark_business_models, benchmark_takeaways.
Key questions: Are there ≥ 3 NAMED competitors? Does the comparison show real differentiation or just feature bingo?

### Area 3 — strategic_positioning (weight 20%)
Evidence fields: ICP value_proposition_* (pains, gains, solutions, gain_creators), ICP jtbd, ICP pitch_need/benefit/approach/competition, product_summary.
Key questions: Is the value prop tied to ICP pains? Is JTBD specific? Does the pitch name a real competitive wedge?

### Area 4 — market_validation (weight 10%)
Evidence fields: idea_success_metrics, structure_success_metrics, prd_success_indicators, ICP score_rationale, suggestions_block.
Key questions: Are success metrics MEASURABLE (numbers, thresholds)? Is there any signal of prior validation or learning?

### Area 5 — business_execution_viability (weight 15%)
Evidence fields: product_features, prd_app_overview, prd_essential_features, prd_non_functional_reqs, db_tables_schema, db_relationships, milestones_content.
Key questions: Is the tech stack feasible? Are there credible milestones? Any risky dependencies (alpha/beta APIs, unclear schema)?

### Area 6 — mvp_scope_risk_realism (weight 15%)
Evidence fields: prd_out_of_scope, prd_phasing_notes, prd_user_flow, prd_priority_personas.
Key questions: Has the team drawn a clear MVP line (explicit out_of_scope)? Is phasing realistic? Is the first persona narrow?

## EXPLICIT PENALTY TRIGGERS (apply ALL that fire)
Scan the [SOURCE] and ADD every matching penalty to the \`penalties\` array:
- "No real competitors listed in landscape analysis" (-10) — fires when benchmark_comparison names fewer than 2 concrete competitors.
- "High technical dependency on third-party alpha APIs" (-5) — fires when prd_non_functional_reqs or prd_essential_features mention "alpha", "beta", "experimental", "preview", or "unreleased" APIs.
- "No measurable success metrics defined" (-8) — fires when BOTH idea_success_metrics AND structure_success_metrics are blank, "Not defined", or purely qualitative (no numbers/thresholds).
- "Single-ICP dependency" (-5) — fires when only one ICP is defined.
- "No MVP scope cut declared" (-5) — fires when prd_out_of_scope is blank or "Not defined".

## OUTPUT SCHEMA
Return ONLY valid JSON with these 11 keys:
- area_scores: 6 entries in this exact order with keys (customer_problem_reality 25%, competitive_alternative 15%, strategic_positioning 20%, market_validation 10%, business_execution_viability 15%, mvp_scope_risk_realism 15%). Each entry: { key, label, weight_pct, raw_score_pct, weighted_points (server recomputes, set to 0), status ("strong"|"average"|"weak"), description (MUST contain a single-quoted source fragment) }.
- penalties: array of { label, points (negative integer) } — include every trigger that fires.
- final_score: integer (server recomputes; output your best estimate).
- threshold_bucket: "ready" (≥75) | "refine" (≥60) | "risk" (<60).
- headline: single sentence, ≤ 14 words, grounded in source.
- summary: 2–3 sentences explaining the overall verdict with at least one quoted source fragment.
- next_steps: a single HTML \`<p>\` paragraph, ≤ 80 words. DO NOT include any \`<button>\`, \`<a>\`, \`<ul>\`, \`<ol>\`, or \`<li>\` — plain prose only.
- playbook_title: string.
- playbook_subtitle: string.
- playbook_html: HTML with 11 \`<h2>\` sections in this order — The Core Problem, The Happy Path, ICPs & Strategic Frameworks, Product Overview & Essential Features, Strategic Positioning, Competitive Landscape & Possible Business Models, PRD Highlights, Database Snapshot, Visual Identity, Project Milestones, Final Recommendation. Each \`<h2>\` section MUST reference at least one concrete detail from the [SOURCE] — no generic fillers.`;

function clamp(min: number, max: number, n: number): number {
  return Math.max(min, Math.min(max, n));
}

function buildIcpsBlock(icps: Array<Record<string, unknown>>): string {
  if (!icps.length) return "(none)";
  return icps
    .map((icp, idx) => {
      const get = (k: string) => stripHtml((icp[k] as string | null) ?? "");
      return `ICP ${idx + 1}: ${get("name") || "(unnamed)"}
  Subtitle: ${get("subtitle")}
  Title: ${get("title")}
  Firmographics: ${get("firmographics")}
  Psychographics: ${get("psychographics")}
  Pain Points: ${get("pain_points")}
  JTBD: ${get("jtbd")}
  Value Proposition — ICP Pains: ${get("value_proposition_icp_pains")}
  Value Proposition — ICP Gains: ${get("value_proposition_icp_gains")}
  Value Proposition — Value Map Solutions: ${get("value_proposition_value_map_solutions")}
  Value Proposition — Value Map Gain Creators: ${get("value_proposition_value_map_gain_creators")}
  Pitch Need/Benefit/Approach/Competition: ${get("pitch_need")} / ${get("pitch_benefit")} / ${get("pitch_approach")} / ${get("pitch_competition")}
  How solved today: ${get("how_problems_are_solved")}
  How it could be solved: ${get("how_problems_could_be_solved")}
  Our Solution Value: ${get("our_solution_value")}
  Score: ${icp["score"] ?? "n/a"} — Rationale: ${get("score_rationale")}`;
    })
    .join("\n\n");
}

function buildSuggestionsBlock(
  suggestions: Array<Record<string, unknown>>
): string {
  if (!suggestions.length) return "(none)";
  return suggestions
    .map(
      (s, i) =>
        `${i + 1}. ${stripHtml((s["name"] as string | null) ?? "")}: ${stripHtml((s["description"] as string | null) ?? "")}`
    )
    .join("\n");
}

async function generateReport(
  supabase: SupabaseClient,
  idea: { name: string; description: string | null; success_metrics: string | null },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  structureAlign: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icps: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  suggestions: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  productDef: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  benchmarking: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prdData: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  databaseRow: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stylesRow: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  milestonesRow: any,
  ideaId: string,
  aiConfig: AiConfig,
  requestId: string
): Promise<{ error?: string }> {
  const template = (await getPromptTemplate("report")) ?? FALLBACK_REPORT;
  const prompt = renderPrompt(template, {
    idea_name: idea.name,
    idea_description: stripHtml(idea.description),
    idea_success_metrics: stripHtml(idea.success_metrics),
    core_problem: stripHtml(structureAlign?.core_problem) || "Not defined",
    target_audience: stripHtml(structureAlign?.target_audience) || "Not defined",
    structure_success_metrics: stripHtml(structureAlign?.success_metrics) || "Not defined",
    icps_block: buildIcpsBlock(icps as Array<Record<string, unknown>>),
    suggestions_block: buildSuggestionsBlock(suggestions as Array<Record<string, unknown>>),
    product_summary: stripHtml(productDef?.summary) || "Not defined",
    product_features: stripHtml(productDef?.features) || "Not defined",
    benchmark_overview: stripHtml(benchmarking?.overview) || "Not defined",
    benchmark_comparison: stripHtml(benchmarking?.comparison) || "Not defined",
    benchmark_business_models: stripHtml(benchmarking?.possible_business_models) || "Not defined",
    benchmark_takeaways: stripHtml(benchmarking?.takeaways) || "Not defined",
    prd_app_overview: stripHtml(prdData?.app_overview) || "Not defined",
    prd_objectives: stripHtml(prdData?.objectives) || "Not defined",
    prd_priority_personas: stripHtml(prdData?.priority_personas) || "Not defined",
    prd_essential_features: stripHtml(prdData?.essential_features) || "Not defined",
    prd_user_flow: stripHtml(prdData?.user_flow) || "Not defined",
    prd_non_functional_reqs: stripHtml(prdData?.non_functional_reqs) || "Not defined",
    prd_out_of_scope: stripHtml(prdData?.out_of_scope) || "Not defined",
    prd_success_indicators: stripHtml(prdData?.success_indicators) || "Not defined",
    prd_phasing_notes: stripHtml(prdData?.phasing_notes) || "Not defined",
    db_tables_schema: stripHtml(databaseRow?.tables_schema) || "Not defined",
    db_relationships: stripHtml(databaseRow?.relationships) || "Not defined",
    db_notes: stripHtml(databaseRow?.notes) || "Not defined",
    styles_logo_branding: stripHtml(stylesRow?.logo_branding) || "Not defined",
    styles_color_palette: stripHtml(stylesRow?.color_palette) || "Not defined",
    styles_product_feeling: stripHtml(stylesRow?.product_feeling) || "Not defined",
    milestones_content: stripHtml(milestonesRow?.content) || "Not defined",
    month_year: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  });

  const res = await generateAiJsonResponse<ReportOutput>({
    service: aiConfig.service,
    apiKey: aiConfig.apiKey,
    model: aiConfig.model,
    prompt,
  });

  if (res.returned_an_error || !res.data) {
    return { error: res.error ?? "AI returned no data" };
  }

  if (!(await isRequestActive(supabase, ideaId, requestId))) return {};

  const d = res.data;

  // ── Server-side score reconciliation ───────────────────────────────────────
  // Defensively normalise / clamp AI output, then recompute final_score so
  // downstream UI can trust the numbers.
  const areas: ReportAreaOutput[] = Array.isArray(d.area_scores)
    ? d.area_scores.map((a) => ({
        key: String(a?.key ?? ""),
        label: String(a?.label ?? ""),
        weight_pct: Number(a?.weight_pct ?? 0),
        raw_score_pct: clamp(0, 100, Math.round(Number(a?.raw_score_pct ?? 0))),
        weighted_points: 0, // recomputed below
        status: (a?.status === "strong" || a?.status === "weak" ? a.status : "average") as ReportAreaOutput["status"],
        description: String(a?.description ?? ""),
      }))
    : [];
  for (const a of areas) {
    a.weighted_points = Math.round((a.raw_score_pct * a.weight_pct) / 100);
    if (a.raw_score_pct >= 80) a.status = "strong";
    else if (a.raw_score_pct >= 60) a.status = "average";
    else a.status = "weak";
  }
  const penalties: ReportPenaltyOutput[] = Array.isArray(d.penalties)
    ? d.penalties.map((p) => ({
        label: String(p?.label ?? ""),
        points: -Math.abs(Math.round(Number(p?.points ?? 0))),
      }))
    : [];
  const areaTotal = areas.reduce((s, a) => s + a.weighted_points, 0);
  const penaltyTotal = penalties.reduce((s, p) => s + Math.abs(p.points), 0);
  const finalScore = clamp(0, 100, areaTotal - penaltyTotal);
  const threshold: "ready" | "refine" | "risk" =
    finalScore >= 75 ? "ready" : finalScore >= 60 ? "refine" : "risk";

  const payload = {
    final_score: finalScore,
    threshold_bucket: threshold,
    headline: d.headline ?? null,
    summary: d.summary ?? null,
    area_scores: areas,
    penalties,
    next_steps: d.next_steps ?? null,
    playbook_title: d.playbook_title ?? null,
    playbook_subtitle: d.playbook_subtitle ?? null,
    playbook_html: d.playbook_html ?? null,
  };

  const { data: existing } = await supabase
    .from("idea_report" as never)
    .select("id")
    .eq("idea_id", ideaId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("idea_report" as never)
      .update(payload as never)
      .eq("id", (existing as { id: string }).id);
  } else {
    await supabase
      .from("idea_report" as never)
      .insert({ idea_id: ideaId, ...payload } as never);
  }

  return {};
}

// ── Idea Chatbot ─────────────────────────────────────────────────────────────

/**
 * System prompt used by the floating Idea Chatbot. Kept in sync with the seed
 * in supabase/migrations/20260421000000_idea_chatbot.sql — the DB row wins
 * (editable via /prompts); this constant is a fallback when the row is missing.
 */
const FALLBACK_IDEA_CHATBOT = `You are a senior product strategist acting as an AI co-pilot inside Blur Studio's Sandbox Planner. You are embedded as a floating chat widget on the idea the user is currently refining. Answer questions using ONLY the [IDEA CONTEXT] block and the [CHAT HISTORY] below.

## GROUNDING RULES (non-negotiable)
1. Use ONLY the [IDEA CONTEXT] — never invent facts, metrics, competitors, features, or personas. If the user asks about a field that is empty or missing, say so explicitly ("That field is not defined yet — the user hasn't filled it out").
2. When you cite information, quote the concrete fragment in single quotes.
3. Be concise: default replies <= 150 words unless the user asks for depth.
4. Output HTML only. Allowed tags: <p>, <ul>, <li>, <strong>, <em>, <code>. No BBCode, no Markdown, no <script>, no <button>, no <a>.
5. The current tab is {{current_tab}} — prefer examples and advice relevant to that step unless the user asks about a different step.

## [IDEA CONTEXT]
Idea: {{idea_name}} — {{idea_description}}
Success Metrics: {{idea_success_metrics}}
Structure & Align: core_problem={{core_problem}}; target_audience={{target_audience}}; success_metrics={{structure_success_metrics}}
ICPs:
{{icps_block}}
Optimization Suggestions:
{{suggestions_block}}
Product Definition: summary={{product_summary}}; features={{product_features}}
Benchmarking: overview={{benchmark_overview}}; comparison={{benchmark_comparison}}; business_models={{benchmark_business_models}}; takeaways={{benchmark_takeaways}}
PRD: app_overview={{prd_app_overview}}; objectives={{prd_objectives}}; priority_personas={{prd_priority_personas}}; essential_features={{prd_essential_features}}; user_flow={{prd_user_flow}}; non_functional_reqs={{prd_non_functional_reqs}}; out_of_scope={{prd_out_of_scope}}; success_indicators={{prd_success_indicators}}; phasing_notes={{prd_phasing_notes}}
Database: tables_schema={{db_tables_schema}}; relationships={{db_relationships}}; notes={{db_notes}}
Visual Styles: logo_branding={{styles_logo_branding}}; color_palette={{styles_color_palette}}; product_feeling={{styles_product_feeling}}
Milestones: {{milestones_content}}
Report: final_score={{report_final_score}}; headline={{report_headline}}; summary={{report_summary}}

## [CHAT HISTORY]
{{chat_history}}

## [USER MESSAGE]
{{user_message}}

## OUTPUT SCHEMA
Return ONLY valid JSON: { "reply": "<html string>" }. The HTML string must not contain the characters \`<script\` or \`javascript:\`.`;

/**
 * Sanitize chatbot HTML reply: strip any <script> tags or javascript: URLs
 * the model might have slipped through. We allow all other tags; the
 * consumer renders into a sandboxed .prose block via
 * dangerouslySetInnerHTML.
 */
function sanitizeChatbotHtml(raw: string): string {
  return raw
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "")
    .replace(/<script\b[^>]*>/gi, "")
    .replace(/javascript\s*:/gi, "blocked:");
}

/** Build the full `{{...}}` variable map consumed by the chatbot prompt. */
function buildIdeaContextVars(ideaFull: IdeaFull): Record<string, string> {
  const { idea, structureAlign, icps, optimizationSuggestions, productDefinition,
    benchmarking, prd, database, styles, milestonesAndTasks, report } = ideaFull;

  return {
    idea_name: idea.name ?? "",
    idea_description: stripHtml(idea.description) || "(not provided)",
    idea_success_metrics: stripHtml(idea.success_metrics) || "(not provided)",
    core_problem: stripHtml(structureAlign?.core_problem) || "(not defined yet)",
    target_audience: stripHtml(structureAlign?.target_audience) || "(not defined yet)",
    structure_success_metrics: stripHtml(structureAlign?.success_metrics) || "(not defined yet)",
    icps_block: buildIcpsBlock(icps as unknown as Array<Record<string, unknown>>),
    suggestions_block: buildSuggestionsBlock(
      optimizationSuggestions as unknown as Array<Record<string, unknown>>
    ),
    product_summary: stripHtml(productDefinition?.summary) || "(not defined yet)",
    product_features: stripHtml(productDefinition?.features) || "(not defined yet)",
    benchmark_overview: stripHtml(benchmarking?.overview) || "(not defined yet)",
    benchmark_comparison: stripHtml(benchmarking?.comparison) || "(not defined yet)",
    benchmark_business_models: stripHtml(benchmarking?.possible_business_models) || "(not defined yet)",
    benchmark_takeaways: stripHtml(benchmarking?.takeaways) || "(not defined yet)",
    prd_app_overview: stripHtml(prd?.app_overview) || "(not defined yet)",
    prd_objectives: stripHtml(prd?.objectives) || "(not defined yet)",
    prd_priority_personas: stripHtml(prd?.priority_personas) || "(not defined yet)",
    prd_essential_features: stripHtml(prd?.essential_features) || "(not defined yet)",
    prd_user_flow: stripHtml(prd?.user_flow) || "(not defined yet)",
    prd_non_functional_reqs: stripHtml(prd?.non_functional_reqs) || "(not defined yet)",
    prd_out_of_scope: stripHtml(prd?.out_of_scope) || "(not defined yet)",
    prd_success_indicators: stripHtml(prd?.success_indicators) || "(not defined yet)",
    prd_phasing_notes: stripHtml(prd?.phasing_notes) || "(not defined yet)",
    db_tables_schema: stripHtml(database?.tables_schema) || "(not defined yet)",
    db_relationships: stripHtml(database?.relationships) || "(not defined yet)",
    db_notes: stripHtml(database?.notes) || "(not defined yet)",
    styles_logo_branding: stripHtml(styles?.logo_branding) || "(not defined yet)",
    styles_color_palette: stripHtml(styles?.color_palette) || "(not defined yet)",
    styles_product_feeling: stripHtml(styles?.product_feeling) || "(not defined yet)",
    milestones_content: stripHtml(milestonesAndTasks?.content) || "(not defined yet)",
    report_final_score:
      report?.final_score != null ? String(report.final_score) : "(not generated yet)",
    report_headline: stripHtml(report?.headline) || "(not generated yet)",
    report_summary: stripHtml(report?.summary) || "(not generated yet)",
  };
}

const CHAT_HISTORY_WINDOW = 20;

function renderChatHistory(messages: IdeaChatbotMessage[]): string {
  if (!messages.length) return "(no prior messages)";
  return messages
    .slice(-CHAT_HISTORY_WINDOW)
    .map((m) => {
      const label = m.type === "user" ? "User" : "Chatbot";
      return `${label}: ${stripHtml(m.message)}`;
    })
    .join("\n");
}

/** Load all chatbot messages for an idea, oldest first. */
export async function loadChatHistory(
  ideaId: string,
): Promise<{ messages?: IdeaChatbotMessage[]; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("idea_chatbot" as never)
    .select("id, idea_id, created_by, type, message, created_at, updated_at")
    .eq("idea_id", ideaId)
    .order("created_at", { ascending: true });
  if (error) return { error: error.message };
  return { messages: (data ?? []) as unknown as IdeaChatbotMessage[] };
}

/**
 * Append a user message, ask the LLM for a reply using the full idea context,
 * persist the chatbot reply, and return both rows so the client can render
 * immediately without waiting for a realtime round-trip.
 */
export async function sendChatMessage(
  ideaId: string,
  userMessage: string,
  currentTab: IdeaBlock,
): Promise<{ userMsg?: IdeaChatbotMessage; botMsg?: IdeaChatbotMessage; error?: string }> {
  const trimmed = userMessage.trim();
  if (!trimmed) return { error: "Message is empty" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // 1. Persist the user message.
  const { data: userRow, error: userErr } = await supabase
    .from("idea_chatbot" as never)
    .insert({
      idea_id: ideaId,
      created_by: user.id,
      type: "user",
      message: trimmed,
    } as never)
    .select("id, idea_id, created_by, type, message, created_at, updated_at")
    .single();
  if (userErr || !userRow) return { error: userErr?.message ?? "Failed to save message" };
  const userMsg = userRow as unknown as IdeaChatbotMessage;

  // 2. Rebuild the canonical idea bundle for the LLM.
  const ideaFull = await loadIdeaFull(supabase, ideaId);
  if (!ideaFull) return { userMsg, error: "Idea not found or access denied" };

  // 3. Load recent chat history (includes the message we just inserted so the
  //    LLM sees it even if it wasn't rendered yet).
  const { data: historyData } = await supabase
    .from("idea_chatbot" as never)
    .select("id, idea_id, created_by, type, message, created_at, updated_at")
    .eq("idea_id", ideaId)
    .order("created_at", { ascending: true })
    .limit(100);
  const history = (historyData ?? []) as unknown as IdeaChatbotMessage[];
  // The latest row is the user message we just inserted — exclude it from the
  // rendered history because the prompt already surfaces it as USER MESSAGE.
  const historyExcludingCurrent = history.filter((m) => m.id !== userMsg.id);

  // 4. Resolve template + vars.
  const template = (await getPromptTemplate("idea_chatbot")) ?? FALLBACK_IDEA_CHATBOT;
  const currentTabLabel = IDEA_BLOCK_LABELS[currentTab] ?? currentTab;
  const prompt = renderPrompt(template, {
    ...buildIdeaContextVars(ideaFull),
    current_tab: currentTabLabel,
    chat_history: renderChatHistory(historyExcludingCurrent),
    user_message: trimmed,
  });

  // 5. Resolve AI config.
  const aiConfig = await resolveAiConfig(supabase, user.id);
  if (!aiConfig) {
    return {
      userMsg,
      error: "No AI provider configured. Set one in Settings → AI Configuration.",
    };
  }

  // 6. Call the LLM.
  const res = await generateAiJsonResponse<{ reply: string }>({
    service: aiConfig.service,
    apiKey: aiConfig.apiKey,
    model: aiConfig.model,
    prompt,
  });
  if (res.returned_an_error || !res.data) {
    return { userMsg, error: res.error ?? "AI returned no data" };
  }

  const replyHtml = sanitizeChatbotHtml(String(res.data.reply ?? "").trim());
  if (!replyHtml) {
    return { userMsg, error: "AI returned an empty reply" };
  }

  // 7. Persist the chatbot reply.
  const { data: botRow, error: botErr } = await supabase
    .from("idea_chatbot" as never)
    .insert({
      idea_id: ideaId,
      created_by: null,
      type: "chatbot",
      message: replyHtml,
    } as never)
    .select("id, idea_id, created_by, type, message, created_at, updated_at")
    .single();
  if (botErr || !botRow) return { userMsg, error: botErr?.message ?? "Failed to save reply" };

  return {
    userMsg,
    botMsg: botRow as unknown as IdeaChatbotMessage,
  };
}

