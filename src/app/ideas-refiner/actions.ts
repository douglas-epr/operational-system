/**
 * Server Actions for the Ideas Refiner.
 * Handles CRUD for ideas and related entities, plus AI generation triggers.
 */
"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type {
  IdeaBlock,
  IdeaChatbotMessage,
  IdeaFull,
  IdeaReportAlignment,
  IdeaReportDebateTurn,
  ColorToken,
  TypographySystem,
  SpacingSystem,
  BorderRadiusSystem,
  ShadowToken,
} from "@/types/idea-refiner";
import { IDEA_BLOCK_LABELS } from "@/types/idea-refiner";
import { generateAiJsonResponse, generateAiTextResponse } from "@/lib/api/ai-dispatcher";
import { loadIdeaFull } from "./_lib/loadIdeaFull";
import type {
  StructureAlignOutput,
  ICPsOutput,
  ProductDefinitionOutput,
  StrategicFrameworksOutput,
  SingleIcpFrameworkOutput,
  BenchmarkingOutput,
  PrdOutput,
  DatabaseOutput,
  VisualStylesOutput,
  MilestonesAndTasksOutput,
  ReportOutput,
  ReportAreaOutput,
  ReportPenaltyOutput,
} from "@/lib/api/json-converters";

const PATH = "/ideas-refiner";

// ── Idea CRUD ────────────────────────────────────────────────────────────────

/** Create a new idea and return its id. */
export async function createIdea(data: {
  name: string;
  description: string;
  project_id?: string;
  version_name?: string;
  authorized_users?: string[];
}): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: row, error } = await (supabase as any)
    .from("idea")
    .insert({
      name: data.name,
      description: data.description,
      project_id: data.project_id || null,
      version_name: data.version_name || null,
      authorized_users: data.authorized_users ?? [],
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

/**
 * Duplicate an idea and all its related data as a new version.
 * The new idea gets the next auto-assigned version_name from the DB trigger.
 * ICP UUIDs are pre-generated so optimization_suggestion.icp_id can be remapped.
 */
export async function duplicateIdea(ideaId: string): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const full = await loadIdeaFull(supabase, ideaId);
  if (!full) return { error: "Idea not found" };

  // Create the new idea — omit version_name so the DB trigger assigns it.
  // current_block_ended may be "playbook" which the generated types don't yet
  // include (migration applied; types not regenerated). Cast client to any.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anySupabase = supabase as any;
  const { data: newIdeaRow, error: ideaErr } = await anySupabase
    .from("idea")
    .insert({
      name: full.idea.name,
      description: full.idea.description,
      success_metrics: full.idea.success_metrics,
      project_id: full.idea.project_id,
      created_by: user.id,
      current_block_ended: full.idea.current_block_ended,
      stage: "refining_idea",
    })
    .select("id")
    .single();

  if (ideaErr) return { error: ideaErr.message };
  const newId = newIdeaRow.id as string;

  // Pre-generate new UUIDs for ICPs so we can remap optimization_suggestion.icp_id.
  const icpIdMap: Record<string, string> = {};
  for (const icp of full.icps) {
    icpIdMap[icp.id] = crypto.randomUUID();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type AnyClient = any;
  const db = supabase as AnyClient;

  const tasks: Promise<{ error: { message: string } | null }>[] = [];

  if (full.structureAlign) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _i, idea_id: _ii, created_at: _ca, ...rest } = full.structureAlign;
    tasks.push(db.from("idea_structure_and_align").insert({ ...rest, idea_id: newId }));
  }

  // ICPs must be committed BEFORE optimization_suggestions are inserted because
  // idea_optimization_suggestion.icp_id is a FK to idea_icp.id. Running both in
  // the same Promise.all causes a race condition that violates the FK constraint.
  if (full.icps.length > 0) {
    const rows = full.icps.map(({ id, idea_id: _ii, created_at: _ca, ...rest }) => ({
      ...rest,
      id: icpIdMap[id],
      idea_id: newId,
    }));
    const { error: icpErr } = await db.from("idea_icp").insert(rows);
    if (icpErr) return { error: icpErr.message };
  }

  // Optimization suggestions reference ICP IDs — safe to insert now that ICPs exist.
  if (full.optimizationSuggestions.length > 0) {
    const rows = full.optimizationSuggestions.map(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ({ id: _i, idea_id: _ii, created_at: _ca, icp_id, ...rest }) => ({
        ...rest,
        idea_id: newId,
        icp_id: icp_id ? (icpIdMap[icp_id] ?? null) : null,
      })
    );
    tasks.push(db.from("idea_optimization_suggestion").insert(rows));
  }

  if (full.productDefinition) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _i, idea_id: _ii, created_at: _ca, created_by: _cb, ...rest } = full.productDefinition;
    tasks.push(db.from("idea_product_definition_and_flows").insert({ ...rest, idea_id: newId, created_by: user.id }));
  }

  if (full.benchmarking) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _i, idea_id: _ii, created_at: _ca, ...rest } = full.benchmarking;
    tasks.push(db.from("idea_benchmarking").insert({ ...rest, idea_id: newId }));
  }

  if (full.prd) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _i, idea_id: _ii, created_at: _ca, ...rest } = full.prd;
    tasks.push(db.from("idea_prd").insert({ ...rest, idea_id: newId }));
  }

  if (full.database) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _i, idea_id: _ii, created_at: _ca, ...rest } = full.database;
    tasks.push(db.from("idea_database").insert({ ...rest, idea_id: newId }));
  }

  if (full.styles) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _i, idea_id: _ii, created_at: _ca, ...rest } = full.styles;
    tasks.push(db.from("idea_styles").insert({ ...rest, idea_id: newId }));
  }

  if (full.milestonesAndTasks) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _i, idea_id: _ii, created_at: _ca, ...rest } = full.milestonesAndTasks;
    tasks.push(db.from("idea_milestones_and_tasks").insert({ ...rest, idea_id: newId }));
  }

  if (full.report) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _i, idea_id: _ii, created_at: _ca, ...rest } = full.report;
    tasks.push(db.from("idea_report").insert({ ...rest, idea_id: newId }));
  }

  const results = await Promise.all(tasks);
  for (const r of results) {
    if (r.error) return { error: r.error.message };
  }

  revalidatePath(PATH);
  return { id: newId };
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
 * Create a new project from an idea and link the idea to it via project_id.
 * The new project inherits the idea's authorized_users (so the same people
 * have access), unioned with the creator. The legacy `stage` column was
 * dropped (migration 20260617000000_drop_idea_stage), so we only set project_id.
 */
export async function buildProjectFromIdea(
  ideaId: string
): Promise<{ error?: string; projectId?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: idea, error: ideaErr } = await supabase
    .from("idea")
    .select("name, authorized_users")
    .eq("id", ideaId)
    .single();
  if (ideaErr || !idea) return { error: ideaErr?.message ?? "Idea not found" };

  // Carry the idea's members over to the new project so the same people have
  // access. Union the creator so whoever builds the project keeps access even
  // if they were not already in the idea's authorized_users list.
  const ideaUsers = Array.isArray((idea as { authorized_users?: string[] }).authorized_users)
    ? ((idea as { authorized_users?: string[] }).authorized_users as string[])
    : [];
  const projectAuthorizedUsers = Array.from(new Set([...ideaUsers, user.id]));

  const { data: project, error: projectErr } = await supabase
    .from("project")
    .insert({
      name: idea.name,
      status: "not_started",
      created_by: user.id,
      authorized_users: projectAuthorizedUsers,
      change_automatically_project_estimated_time: true,
      change_automatically_milestone_estimated_time: true,
      change_automatically_project_start_end_dates: true,
      change_automatically_milestone_start_end_dates: true,
    })
    .select("id")
    .single();
  if (projectErr) return { error: projectErr.message };

  const { error: linkErr } = await supabase
    .from("idea")
    .update({ project_id: project.id })
    .eq("id", ideaId);
  if (linkErr) return { error: linkErr.message };

  revalidatePath(PATH);
  revalidatePath("/projects");
  return { projectId: project.id };
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
  data: { summary?: string; business_model?: string; features?: string; go_to_market?: string }
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

// ── Risk & Validation ────────────────────────────────────────────────────────

/** Upsert risk_register, validation_test, and why_we_win on an existing idea_risk_and_validation row. */
export async function saveRiskAndValidation(
  ideaId: string,
  data: {
    risk_register?: unknown;
    validation_test?: unknown;
    why_we_win?: unknown;
    demand_evidence?: unknown;
  }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("idea_risk_and_validation" as never)
    .select("id")
    .eq("idea_id", ideaId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("idea_risk_and_validation" as never)
      .update(data as never)
      .eq("id", (existing as { id: string }).id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("idea_risk_and_validation" as never)
      .insert({ idea_id: ideaId, ...data } as never);
    if (error) return { error: error.message };
  }

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
    features_per_page?: string;
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

/** Save logo data (and optionally seed primary colors) for an idea. */
export async function saveIdeaLogo(
  ideaId: string,
  data: {
    logo_url: string | null;
    logo_svg: string | null;
    logo_type: "upload" | "ai_svg";
    logo_colors: { hex: string; label: string }[];
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
    neutral_color?: string;
  }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  return saveStyles(ideaId, data);
}

/** Generate 3-4 SVG logo concepts for an idea using AI.
 *  Returns raw logos — caller picks one and calls saveIdeaLogo. */
export async function generateIdeaLogos(
  ideaId: string
): Promise<{ logos?: { svg: string; name: string; rationale: string }[]; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const aiConfig = await resolveAiConfig(supabase, user.id);
  if (!aiConfig) return { error: "No AI service configured. Please set up your API key in Settings." };

  const [{ data: ideaData }, { data: prdData }] = await Promise.all([
    supabase.from("idea" as never).select("name, description").eq("id", ideaId).single(),
    supabase.from("idea_prd" as never).select("app_overview, priority_personas, essential_features").eq("idea_id", ideaId).maybeSingle(),
  ]);

  const idea = ideaData as { name: string; description: string | null } | null;
  const prd = prdData as { app_overview: string | null; priority_personas: string | null; essential_features: string | null } | null;
  if (!idea) return { error: "Idea not found" };

  const logoPrompt = `You are a senior brand designer and SVG illustrator. Generate 4 distinct logo concepts for the following product.

Product: ${idea.name}
Description: ${stripHtml(idea.description) || "Not defined"}
App Overview: ${stripHtml(prd?.app_overview) || "Not defined"}
Target Personas: ${stripHtml(prd?.priority_personas) || "Not defined"}
Core Features: ${stripHtml(prd?.essential_features) || "Not defined"}

## Requirements
- Each logo must be a COMPLETE, self-contained SVG with a viewBox (e.g. viewBox="0 0 200 200").
- NO <script> tags, NO on* event handlers, NO external URLs (href/src/xlink:href).
- Each concept must have a distinct visual direction (e.g. wordmark, icon-only, monogram, abstract mark).
- Use clean vector shapes, bold choices, and distinctive color palettes.
- Avoid generic clipart or generic SaaS styles.
- SVG must render correctly at 200×200px and 64×64px.
- Do NOT include any background rectangle filling the entire viewBox — logos should look good on both light and dark backgrounds.

Return a JSON object with exactly one key:
- "logos": array of exactly 4 objects, each with:
  - "svg": string — the complete SVG markup (self-contained, viewBox'd)
  - "name": string — short concept name (e.g. "Geometric Mark", "Bold Wordmark")
  - "rationale": string — one sentence explaining the visual direction and why it fits the brand

Return ONLY valid JSON, no markdown fences.`;

  const res = await generateAiJsonResponse<{ logos: { svg: string; name: string; rationale: string }[] }>({
    service: aiConfig.service,
    apiKey: aiConfig.apiKey,
    model: aiConfig.model,
    prompt: logoPrompt,
    maxTokens: 8192,
  });

  if (res.returned_an_error || !res.data?.logos) {
    return { error: res.error ?? "AI returned no logos" };
  }

  const sanitized = res.data.logos.map((logo) => ({
    ...logo,
    svg: sanitizeSvg(logo.svg),
  }));

  return { logos: sanitized };
}

function sanitizeSvg(svg: string): string {
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/xlink:href\s*=\s*["'](?!#)[^"']*["']/gi, "")
    .replace(/href\s*=\s*["'](?!#)[^"']*["']/gi, "");
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
  report_skeptic: "da000001-0000-4000-8000-000000000001",
  report_advocate: "da000002-0000-4000-8000-000000000001",
  report_reframer: "da000003-0000-4000-8000-000000000001",
  report_scorer: "da000004-0000-4000-8000-000000000001",
  idea_chatbot: "a1b2c3d4-0000-4000-8000-000000000001",
  idea_chatbot_devil_advocate: "da001000-0000-4000-8000-000000000001",
  brief: "bf000001-0000-4000-8000-000000000001",
  location_legislation: "bb000001-0000-4000-8000-000000000001",
  market_opportunity: "bb000002-0000-4000-8000-000000000001",
  risk_and_validation: "bb000003-0000-4000-8000-000000000001",
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

const FALLBACK_REFINING_ICP = `You are a world-class business intelligence analyst specialising in B2B Ideal Customer Profile (ICP) definition. Your task is to generate 3–5 TRULY DISTINCT ICPs for the given business idea.

CRITICAL RULES:
1. Each ICP must represent a FUNDAMENTALLY DIFFERENT buyer segment — different industry vertical, company size tier, decision-maker role, or problem context. If you cannot find 3 genuinely distinct segments, generate fewer — do NOT pad with overlapping ICPs.
2. ICP names must be SHORT and ROLE-BASED (max 5 words). Use job title / segment descriptors such as "Mid-Market SaaS CFO", "SMB Operations Lead", "Enterprise Compliance Officer". NEVER use fictional personal names (no "Sarah", "John", "David", etc.).
3. ICPs must differ meaningfully in at least 3 dimensions: (a) industry or company size, (b) decision-maker role or budget authority, (c) severity or nature of the pain. Two ICPs that differ only in company name or sector are NOT distinct — merge them into one.
4. Quality over quantity: 3 sharp, distinct ICPs are far better than 5 similar ones.

Idea: {{idea_name}} — {{idea_description}}
Core Problem: {{core_problem}}
Target Audience: {{target_audience}}

Return a JSON object with key "ICPs" containing an array of objects, each with:
- "name": Short role-based ICP label (max 5 words, no personal names, no "like Sarah")
- "description": 1–2 sentences on what makes this segment unique and why this problem is acute specifically for them
- "operational_environment": Day-in-the-life context and work environment (rich HTML allowed)
- "strategic_pain_points_and_acute_needs": Key pain points and urgent needs specific to this segment (rich HTML allowed)
- "how_problems_are_solved_currently": Rich HTML describing the exact tools, services, workarounds, manual processes, and compromises this ICP uses today
- "how_problems_could_be_solved": Rich HTML surveying ALL plausible ways these problems could be solved — existing tools, alternative workflows, emerging tech, DIY — and where our product fits. This is a solution-landscape survey, not a sales pitch.
- "our_solution_value": REQUIRED. Rich HTML describing the specific value our product delivers to THIS ICP — tied directly to their named pain points. Be concrete; cite the exact pain and the exact capability that resolves it. Do not leave this field empty or generic.

Return ONLY valid JSON.`;

const FALLBACK_PRODUCT_DEFINITION = `You are a product strategist. Given the following startup idea, define the product.

Idea: {{idea_name}} — {{idea_description}}
Core Problem: {{core_problem}}
Target Audience: {{target_audience}}
ICPs: {{icp_names}}

Return a JSON object with exactly these keys:
- "Product Overview": Rich HTML text describing the product vision and architecture.
- "Business Model": REQUIRED. Rich HTML text describing the single best-fit business model for this product given its nature, target audience, and competitive landscape. Name the model (e.g. SaaS subscription, marketplace, freemium+premium, usage-based, per-seat, transaction fee, white-label, enterprise license). Explain in 2–3 sentences WHY this model fits better than the alternatives for THIS idea. Be specific — reference the product's core value prop and ICP willingness-to-pay signals. Do not list multiple models here; pick the best one and defend the choice.
- "Feature List & Logic": Rich HTML text with features organized by categories.
- "Go-to-Market": REQUIRED. Rich HTML text describing the go-to-market strategy. Cover: (1) The Wedge — the single first user archetype and why they are acquired first (supply vs demand, early adopter profile); (2) Content or outreach strategy for acquiring that wedge user at zero or near-zero CAC; (3) Why supply or demand comes first and how the other side follows organically; (4) The first concrete use case that closes the first transaction; (5) Distribution channels in year one ranked by priority. Write in plain, direct prose — no fluff, no generic GTM boilerplate. Reference the specific ICP circumstances, communities, and pain triggers from the idea's context.
- "User Flows": Array of objects with "user_name" (string), "description" (string), "user_flow" (string with HTML flow description).

Return ONLY valid JSON.`;

const FALLBACK_STRATEGIC_FRAMEWORKS = `You are a strategic business consultant. Generate comprehensive strategic frameworks for the following ICP.

Idea: {{idea_name}} — {{idea_description}}
Core Problem: {{core_problem}}
Target Audience: {{target_audience}}

ICP to analyse:
Name: {{icp_name}}
Description: {{icp_description}}
Day in the Life: {{icp_day_in_life}}
Pain Points: {{icp_pain_points}}

Return a single flat JSON object (NOT wrapped in an array) with ALL of these fields:
- "name": ICP name (copy from above)
- "score_breakdown": object with these integer sub-scores (each 0–20):
    - "pain_severity": How acute and painful the problem is for this ICP.
    - "pain_frequency": How often this ICP encounters the pain (daily > weekly > monthly).
    - "willingness_to_pay": How strongly this ICP would pay to solve it (budget authority + urgency).
    - "market_reachability": How easy it is to reach this ICP (channels, density, identifiability).
    - "solution_fit": How well our product specifically solves their pain compared to alternatives.
- "score": integer = sum of score_breakdown values (0–100). Do NOT round.
- "score_rationale": REQUIRED. Rich HTML, 2–3 sentences, explaining the breakdown and why this ICP ranks where it does.
- "value_proposition_icp_pains": Rich HTML — ICP's specific pains that the product addresses.
- "value_proposition_value_map_solutions": REQUIRED Rich HTML — Value Map: specific solutions/features that relieve this ICP's pains. Do not leave empty.
- "value_proposition_icp_gains": Rich HTML — ICP's desired gains and positive outcomes they seek.
- "value_proposition_value_map_gain_creators": REQUIRED Rich HTML — Value Map: how the product creates gains and delivers the ICP's desired outcomes. Do not leave empty.
- "jtbd": Rich HTML — Jobs To Be Done synthesis for this ICP.
- "architect_title": ICP archetype title (e.g. "The Overwhelmed SMB Owner").
- "architect_subtitle": REQUIRED ICP archetype subtitle (brief tagline, 4–10 words).
- "picture": REQUIRED URL string for a representative avatar. Use the format: https://api.dicebear.com/7.x/personas/svg?seed=<URL_ENCODED_ARCHETYPE_TITLE>. Always return a non-null URL.
- "architect_tags": Array of 3-6 short descriptor tags.
- "architect_psychographics": Rich HTML — psychographic profile.
- "architect_firmographics": Rich HTML — firmographic profile.
- "pitch_need": Rich HTML — NABC pitch: Need.
- "pitch_approach": Rich HTML — NABC pitch: Approach.
- "pitch_benefit": Rich HTML — NABC pitch: Benefit.
- "pitch_competition": Rich HTML — NABC pitch: Competition.
- "optimization_suggestions": REQUIRED array of EXACTLY 3–5 objects. Each object has:
    - "name": short noun phrase (≤6 words).
    - "description": 1–2 sentence actionable rationale targeting this ICP's pains or gains.
  Never omit this field and never return an empty array.

Return ONLY valid JSON — a single flat object, not an array.`;

const FALLBACK_BENCHMARKING = `You are a competitive analysis expert and business model innovator. Given the following startup idea and its context, create a comprehensive benchmarking analysis.

Idea: {{idea_name}} — {{idea_description}}
Core Problem: {{core_problem}}
Target Audience: {{target_audience}}
Product Overview: {{product_overview}}

Return a JSON object with exactly these keys:
- "overview": Rich HTML text providing an overview of the competitive landscape and methodology used for benchmarking.
- "comparison": Rich HTML text containing a detailed comparison table of competing apps/platforms. Use an HTML table with columns: Name, Platform(s), Core Functionality, Similarities to the Idea, Pricing / Free Tier, Link / Notes. Include at least 5-8 competitors.
- "possible_business_models": REQUIRED. Rich HTML exploring business model options in THREE groups, each group introduced with a bold heading (use strong element):

  GROUP 1 — Established Models: List 4–6 proven business models that directly fit this product (e.g. SaaS subscription, marketplace, freemium+premium, usage-based, per-seat, transaction fee, white-label, enterprise license, data licensing, community + paid tiers, sponsored/ad-supported). For each: name the model, give a 1-sentence rationale specific to this idea and its target audience, and note the main risk.

  GROUP 2 — Hybrid / Mixed Models: Propose as many original combinations as are genuinely relevant — blend two or more established models in ways specifically suited to this product's unique nature (e.g. "freemium + marketplace" where free users generate data that powers a paid B2B analytics layer). Aim for at least 2; include more if the product's characteristics support additional strong hybrids. For each hybrid: name it creatively, explain the mechanism, and explain why the combination is stronger than either model alone for this idea.

  GROUP 3 — Invented Models: Design as many genuinely new business models as this product warrants — pricing, access, or value-exchange mechanisms that do not yet exist in the market. Aim for at least 1; include more if first-principles thinking surfaces additional novel mechanisms tailor-made for this type of product. For each invented model: name it, describe how it works mechanically (who pays, when, for what, how value is exchanged), and explain what problem with existing models it solves. Frame each as a first-principles thought experiment, not speculation about the future.

  Use a ul with one li per model across all three groups. Bold each model name in strong. Do not leave this field empty.

- "takeaways": Rich HTML text summarizing key takeaways, differentiators, and strategic positioning insights.

All values must be valid HTML strings.
Return ONLY valid JSON.`;

const FALLBACK_PRD = `You are an expert product manager writing a precise, build-ready Product Requirements Document (PRD) for an engineering team that will code this application. Use ALL the context below. Be concrete and technical; avoid marketing fluff and filler adjectives.

## PRIMARY SOURCE OF TRUTH — IDEA DESCRIPTION
idea_description is the founder's complete product vision. EVERY SECTION of this PRD must be grounded in it:
- Do NOT omit any feature, user type, workflow, integration, or use case explicitly mentioned in idea_description.
- If idea_description and other fields conflict on product intent, prefer idea_description.
- If a specific detail appears in idea_description but is absent from other structured fields, it still belongs in the relevant PRD section.

## FULL CONTEXT (all prior discovery steps)
Idea: {{idea_name}} — {{idea_description}}
Agreed Problem (from go/no-go debate): {{agreed_problem}}
Agreed Solution (from go/no-go debate): {{agreed_solution}}
Recommendation: {{recommendation}}
Core Problem: {{core_problem}}
Target Audience: {{target_audience}}
Product Overview: {{product_overview}}
Features: {{features}}
ICP names: {{icp_names}}
ICP details:
{{icp_details}}
Benchmarking:
{{benchmarking}}
Location & Legislation:
{{location_legislation}}
Market Opportunity:
{{market_opportunity}}
Risk & Validation:
{{risk_and_validation}}

## CRITICAL CONCEPT DISTINCTION
"Personas" (a.k.a. User Types) are a TECHNICAL concept: the functional roles that log into and operate the application — e.g. Admin, Manager, Client, Seller, Supplier, Operator, Guest. They are NOT the marketing ICPs / target-audience segments above. Derive personas from how the app actually works, not from buyer demographics.

## OUTPUT — return a JSON object with EXACTLY these keys (every value a valid rich HTML string):
- "app_overview": Full app overview and product vision, grounded in the agreed problem/solution.
- "objectives": Measurable product objectives.
- "priority_personas": The distinct TECHNICAL user types who access the app. Use short, role-based names (Admin, Client, Seller, Manager, etc.). For each: a one-line role description and their main actions/permissions inside the product. Do NOT restate marketing ICPs or audience segments.
- "essential_features": Essential features organized by category with sub-items.
- "user_flow": ONE clearly-labelled core flow PER persona listed in "priority_personas". Head each flow with the persona name (e.g. "<h3>Admin</h3>") and give the ordered steps that persona takes through the app. Every persona must have its own flow.
- "features_per_page": A page-by-page breakdown of the application. For EACH page/screen, describe: its purpose, which personas use it, the features it exposes (drawn from "essential_features"), and which step(s) of each persona's flow (from "user_flow") it serves. This section is the bridge from features+flows to implementation — it must let an engineer understand how each page works and what logic it needs. Organize as one labelled block per page.
- "non_functional_reqs": Non-functional requirements (platform, performance, security, scalability, compliance — reflect the Location & Legislation context where relevant).
- "out_of_scope": What is explicitly out of scope for v1, and why.
- "success_indicators": Measurable success indicators / KPIs.
- "phasing_notes": Phasing/roadmap notes for future development.

All values must be valid HTML strings.
Return ONLY valid JSON.`;

const FALLBACK_DATABASE = `You are a database architect. The PRD (Product Requirements Document) is your PRIMARY input — design the data model so it directly supports the documented features, pages, personas, and user flows. Do not invent entities the PRD does not imply, and do not model anything listed as out of scope.

Idea: {{idea_name}} — {{idea_description}}
Core Problem: {{core_problem}}
Product Overview: {{product_overview}}
Features: {{features}}

--- PRD (primary source) ---
App Overview: {{app_overview}}
Essential Features: {{essential_features}}
Features Per Page: {{features_per_page}}
User Flows: {{user_flow}}
Priority Personas: {{priority_personas}}
Non-Functional Requirements: {{non_functional_reqs}}
Out of Scope (do NOT model these): {{out_of_scope}}

How to use the PRD:
- Derive tables/entities from the PRD essential features and the per-page feature breakdown — every page/feature that persists data should map to one or more tables.
- Model role/permission/account tables from the priority personas (e.g. admin, client, member) and reflect their access needs.
- Let the user flows reveal relationships, state/status columns, and join tables (many-to-many).
- Reflect the non-functional requirements in indexing, constraints, soft-delete/audit columns, and security/RLS notes.
- Explicitly EXCLUDE anything in the out-of-scope list.

Return a JSON object with exactly these keys:
- "tables_schema": Rich HTML text defining all database tables. For each table, include field name, type, and description in HTML table format. Include primary keys, foreign keys, and constraints.
- "relationships": Rich HTML text describing all entity relationships (one-to-one, one-to-many, many-to-many), with clear descriptions of how tables connect.
- "notes": Rich HTML text with important architectural decisions, MVP simplifications, indexing/security considerations (from the non-functional requirements), and migration notes.

All values must be valid HTML strings.
Return ONLY valid JSON.`;

const FALLBACK_VISUAL_STYLES = `You are a brand identity designer and design systems expert. Create a comprehensive, logo-driven Design System.

## Key inputs
Idea: {{idea_name}} — {{idea_description}}
App Overview: {{app_overview}}
Essential Features: {{essential_features}}
Priority Personas (your target audience): {{priority_personas}}
Core Problem: {{core_problem}}

## Logo Colors (SOURCE OF TRUTH for all color decisions)
{{logo_colors}}

## Color derivation rules
- When Logo Colors are provided (not "Not defined"), you MUST derive primary_color, secondary_color, accent_color, and neutral_color directly from those logo colors. Do not invent an unrelated palette.
- Extend the logo colors into a harmonized, accessible palette: choose the most dominant/vibrant logo color as primary, a complementary or analogous tone as secondary, the brightest/most saturated as accent, and a desaturated/near-neutral as neutral.
- Ensure all text-on-background combinations meet WCAG AA contrast (≥4.5:1 for normal text).
- If Logo Colors = "Not defined", derive a coherent palette from the idea's domain, persona psychology, and emotional tone.

## Brand voice grounding
Ground the brand_voice, product_feeling, and logo_branding in the Priority Personas — their professional context, emotional triggers, and communication style. Use plain language that these people recognize, not generic SaaS copy.

Return a JSON object with EXACTLY these keys (no extra keys, no omissions):
- "logo_branding": Rich HTML describing the conceptual logo, app name styling, icon/symbol concepts, and overall brand style.
- "color_narrative": Rich HTML (NOT hex values) describing the Color Narrative — the story and meaning behind the chosen colors, emotional associations, usage philosophy, and how the palette reflects the brand personality. This must be a rich narrative text, NOT a list of color values (those are already covered by primary_color, secondary_color, accent_color, neutral_color, and color_tokens).
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

const FALLBACK_MILESTONES = `You are a senior project planner for software built with Claude Code — AI-assisted development on a TypeScript / Next.js / React / Supabase / Tailwind stack. The PRD is your PRIMARY input. Produce a MACRO milestone-and-task plan, not a granular hand-coding checklist.

CRITICAL — development speed reality: This app is built with Claude Code, an AI coding agent that writes pages, components, server actions, database migrations, and RLS policies far faster than hand-coding (roughly 3–5× faster) and MASSIVELY faster than no-code / visual builders like Bubble (roughly 8–10× faster). BUT a complete, production-grade, shippable product is NOT an afternoon prototype — across real Claude Code builds it takes one developer about 2–4 focused weeks. Your estimates must reflect the FULL lifecycle of each area: planning, generating the code, wiring it together, iterating on the output, code review, testing, fixing bugs, and polish — not just the first generation.

GRAND-TOTAL TARGET (most important rule): Calibrate the SUM of every milestone's "Total Estimated Time" to land in this band, scaled by overall complexity:
- Simple MVP (few pages, one persona, little integration): ≈ 80 hours (~2 weeks)
- Moderate app (several pages, multiple personas/roles, some integrations): ≈ 120 hours (~3 weeks)
- Complex app (many pages, rich flows, multiple external integrations, heavy NFRs): ≈ 160 hours (~4 weeks)
If your milestone totals sum to far below 80h, your per-area estimates are too optimistic — raise them. The total should almost never fall below 80h for a real product, nor exceed ~160h.

Idea: {{idea_name}} — {{idea_description}}

--- PRD (primary source) ---
App Overview: {{prd_overview}}
Essential Features: {{essential_features}}
Features Per Page: {{features_per_page}}
User Flows: {{user_flow}}
Priority Personas: {{priority_personas}}
Phasing Notes: {{phasing_notes}}
Non-Functional Requirements: {{non_functional_reqs}}
Out of Scope (do NOT plan work for these): {{out_of_scope}}

## How to structure milestones
- Create ONE milestone per app PAGE or cohesive feature area, taken primarily from the PRD "Features Per Page" breakdown. Respect the PRD phasing notes for ordering.
- ALWAYS begin with these foundation milestones, in order:
  1. Project Setup & Scaffolding — Next.js + Supabase + Tailwind + auth shell + CI/Vercel project.
  2. Database Schema & RLS — all tables, migrations, RLS policies, generated types.
  3. Authentication & Roles — sign-in/up and role gating for the priority personas.
  Then one milestone per page/area, then a final "Polish, NFRs & Deploy" milestone covering the non-functional requirements + production deploy.
- 3–6 MACRO tasks per milestone. A macro task = a page, a server-action set, a schema area, or an integration — never a micro-step like "add a button".

## Per-area time anchors (hours) — one developer pairing with Claude Code, full lifecycle
These already include generation + iteration + code review + testing + bug-fixing for that area:
- Project scaffold (Next.js + Supabase + Tailwind + CI/Vercel): 8–12h
- Full DB schema + migrations + RLS + generated types: 12–18h
- Authentication + onboarding + role gating: 8–14h
- Simple CRUD page (list + form + server action + types): 6–10h
- Moderate page (filters, relations, multiple states): 10–16h
- Complex page / multi-step flow / dashboard / external integration: 16–26h
- Production hardening, NFRs + deploy (Vercel + env + domains): 10–16h
Use these anchors so the milestone totals add up to the GRAND-TOTAL TARGET above. Prefer the higher end for production-grade quality.

## Standard buffer task (end of EVERY milestone)
At the end of every milestone, include EXACTLY ONE buffer task:
- General Tasks — 4–6h — bugs, client change requests, QA fixes, and minor improvements raised by developers, QA testers, and clients during this milestone.
Do NOT split this into separate Client Requests / QA Requests rows — it is a single consolidated "General Tasks" line per milestone.

Return a JSON object with exactly this key:
- "content": Rich HTML. For each milestone include: a heading ("Milestone N — <page/area name>"), a one-line Focus, a "Total Estimated Time" in hours, an HTML table with columns [Task Name, Estimated Time (h), Definition of Done] (macro tasks followed by the single "General Tasks" buffer), and a short "Exit criteria" line. After the last milestone, append a final line "Project Total: <sum of all milestone hours> hours (~<weeks> weeks)".

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

  // Playbook is a content assembly (no LLM call) — handle before AI-config resolution.
  if (step === "playbook") {
    return assemblePlaybookVersion(supabase, ideaId, user.id);
  }

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

    // Additional fetches used by several steps. Report is the pre-build
    // go/no-go gate (Step 10 in IDEA_BLOCKS_ORDERED), so it runs AFTER the
    // discovery steps — including location_legislation (5), benchmarking (6),
    // market_opportunity (7), and risk_and_validation (9) — and scores all of
    // their evidence. It must NOT read PRD/Database/Visual/Milestones, which run
    // after it. market_opportunity also fetches here to read benchmarking (its
    // immediate predecessor) and ground pricing/sizing in the competitive set.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let suggestionsRows: any[] | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let benchmarkingRow: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let locationRow: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let marketRow: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let riskRow: any = null;
    if (step === "report" || step === "prd" || step === "risk_and_validation" || step === "market_opportunity") {
      const [sugRes, benchRes, locRes, mktRes, riskRes] = await Promise.all([
        supabase.from("idea_optimization_suggestion").select("*").eq("idea_id", ideaId),
        supabase.from("idea_benchmarking" as never).select("*").eq("idea_id", ideaId).maybeSingle(),
        supabase.from("idea_location_legislation" as never).select("*").eq("idea_id", ideaId).maybeSingle(),
        supabase.from("idea_market_opportunity" as never).select("*").eq("idea_id", ideaId).maybeSingle(),
        supabase.from("idea_risk_and_validation" as never).select("*").eq("idea_id", ideaId).maybeSingle(),
      ]);
      suggestionsRows = sugRes.data;
      benchmarkingRow = benchRes.data;
      locationRow = locRes.data;
      marketRow = mktRes.data;
      riskRow = riskRes.data;
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
          supabase, idea, structureAlign, icps ?? [], productDef,
          benchmarkingRow, locationRow, marketRow, riskRow,
          ideaId, aiConfig, requestId
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
          locationRow,
          marketRow,
          riskRow,
          ideaId,
          aiConfig,
          requestId
        );
        break;
      case "location_legislation":
        result = await generateLocationLegislation(
          supabase, idea, structureAlign, ideaId, aiConfig, requestId
        );
        break;
      case "market_opportunity":
        result = await generateMarketOpportunity(
          supabase, idea, structureAlign, icps ?? [], productDef, benchmarkingRow, ideaId, aiConfig, requestId
        );
        break;
      case "risk_and_validation":
        result = await generateRiskAndValidation(
          supabase, idea, structureAlign, icps ?? [], suggestionsRows ?? [],
          productDef, benchmarkingRow, locationRow, marketRow,
          ideaId, aiConfig, requestId
        );
        break;
    }

    // Clear the updating flags — but only if we are still the active request.
    // If a newer run overwrote `current_ai_request_id`, it now owns the final
    // clear and we must not touch these fields. On a generation/write error we
    // clear the spinner state but do NOT advance `current_block_ended`, so the
    // step is not falsely recorded as completed with no content.
    if (await isRequestActive(supabase, ideaId, requestId)) {
      await supabase
        .from("idea")
        .update(
          result?.error
            ? { current_blocks_updating: null, current_ai_request_id: null }
            : {
                current_blocks_updating: null,
                current_block_ended: step as never,
                current_ai_request_id: null,
              }
        )
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

/**
 * Assembles a Build Guide playbook version from the stored content of the
 * PRD, Visual Styles, Database, and Milestones & Tasks steps.
 * No LLM call — pure assembly. Mirrors the idea state-machine used by LLM
 * steps so the "AI is working…" overlay shows correctly on the client.
 */
function buildVisualStylesHtml(s: {
  logo_branding: string | null; color_palette: string | null;
  product_feeling: string | null; brand_voice: string | null;
  iconography_style: string | null; motion_principles: string | null;
  primary_color: string | null; secondary_color: string | null;
  accent_color: string | null; neutral_color: string | null;
  color_tokens: ColorToken[] | null;
  typography: TypographySystem | null;
  spacing: SpacingSystem | null;
  border_radius: BorderRadiusSystem | null;
  shadows: ShadowToken[] | null;
}): string {
  const parts: string[] = [];

  if (s.logo_branding?.trim()) parts.push(`<h3>Logo &amp; Branding</h3>${s.logo_branding}`);
  if (s.brand_voice?.trim()) parts.push(`<h3>Brand Voice</h3>${s.brand_voice}`);

  // Color system
  const colorParts: string[] = [];
  const baseColors = [
    { label: "Primary", hex: s.primary_color },
    { label: "Secondary", hex: s.secondary_color },
    { label: "Accent", hex: s.accent_color },
    { label: "Neutral", hex: s.neutral_color },
  ].filter((c): c is { label: string; hex: string } => !!c.hex);

  if (baseColors.length) {
    const rows = baseColors.map(
      (c) => `<tr><td><span style="color:${c.hex}">██████</span></td><td>${c.label}</td><td><code>${c.hex}</code></td></tr>`
    ).join("");
    colorParts.push(`<table><thead><tr><th>Swatch</th><th>Role</th><th>Hex</th></tr></thead><tbody>${rows}</tbody></table>`);
  }

  if (s.color_tokens?.length) {
    const tokenRows = s.color_tokens.map((t) => {
      const shadeSwatches = t.shades?.map((sh) => `<span style="color:${sh.hex}" title="${sh.label}: ${sh.hex}">█</span>`).join(" ") ?? "";
      return `<tr><td><span style="color:${t.hex}">███</span></td><td><strong>${t.name}</strong></td><td><code>${t.hex}</code></td><td>${t.role}</td><td>${shadeSwatches}</td></tr>`;
    }).join("");
    colorParts.push(
      `<p><strong>Color Tokens</strong></p><table><thead><tr><th>Swatch</th><th>Name</th><th>Hex</th><th>Role</th><th>Shades</th></tr></thead><tbody>${tokenRows}</tbody></table>`
    );
  }

  if (s.color_palette?.trim()) colorParts.push(s.color_palette);
  if (colorParts.length) parts.push(`<h3>Color System</h3>${colorParts.join("\n")}`);

  // Typography
  if (s.typography) {
    const t = s.typography;
    const typoParts: string[] = [];
    const fontLine = [
      t.heading_font && `Heading: <strong>${t.heading_font}</strong>`,
      t.body_font && `Body: <strong>${t.body_font}</strong>`,
      t.mono_font && `Mono: <strong>${t.mono_font}</strong>`,
    ].filter(Boolean).join(" · ");
    if (fontLine) typoParts.push(`<p>${fontLine}</p>`);
    if (t.scale?.length) {
      const scaleRows = t.scale.map(
        (step) => `<tr><td>${step.name}</td><td>${step.size_px}px</td><td>${step.weight}</td><td>${step.line_height}</td></tr>`
      ).join("");
      typoParts.push(`<table><thead><tr><th>Scale</th><th>Size</th><th>Weight</th><th>Line Height</th></tr></thead><tbody>${scaleRows}</tbody></table>`);
    }
    if (typoParts.length) parts.push(`<h3>Typography</h3>${typoParts.join("\n")}`);
  }

  // Spacing & Border Radius
  const layoutParts: string[] = [];
  if (s.spacing?.scale?.length) {
    layoutParts.push(`<p><strong>Spacing Scale</strong> (base unit: ${s.spacing.unit_px}px): ${s.spacing.scale.join(", ")}</p>`);
  }
  if (s.border_radius) {
    const radiusRows = Object.entries(s.border_radius)
      .map(([k, v]) => `<tr><td>${k}</td><td><code>${v}</code></td></tr>`).join("");
    layoutParts.push(`<p><strong>Border Radius</strong></p><table><tbody>${radiusRows}</tbody></table>`);
  }
  if (layoutParts.length) parts.push(`<h3>Spacing &amp; Layout</h3>${layoutParts.join("\n")}`);

  // Shadows (Elevation)
  if (s.shadows?.length) {
    const shadowRows = s.shadows.map(
      (sh) => `<tr><td>${sh.name}</td><td><code>${sh.css_value}</code></td><td>${sh.usage}</td></tr>`
    ).join("");
    parts.push(`<h3>Elevation</h3><table><thead><tr><th>Name</th><th>CSS Value</th><th>Usage</th></tr></thead><tbody>${shadowRows}</tbody></table>`);
  }

  // Remaining narrative sections
  if (s.iconography_style?.trim()) parts.push(`<h3>Iconography Style</h3>${s.iconography_style}`);
  if (s.motion_principles?.trim()) parts.push(`<h3>Motion Principles</h3>${s.motion_principles}`);
  if (s.product_feeling?.trim()) parts.push(`<h3>Product Feeling</h3>${s.product_feeling}`);

  return parts.join("\n");
}

async function assemblePlaybookVersion(
  supabase: SupabaseClient,
  ideaId: string,
  userId: string
): Promise<{ error?: string }> {
  const requestId = crypto.randomUUID();

  await supabase
    .from("idea")
    .update({ current_blocks_updating: "playbook", current_ai_request_id: requestId })
    .eq("id", ideaId);

  try {
    const [{ data: prd }, { data: styles }, { data: db }, { data: milestones }] = await Promise.all([
      supabase
        .from("idea_prd" as never)
        .select("app_overview, objectives, priority_personas, essential_features, user_flow, non_functional_reqs, out_of_scope, success_indicators, phasing_notes")
        .eq("idea_id", ideaId)
        .maybeSingle(),
      supabase
        .from("idea_styles" as never)
        .select("*")
        .eq("idea_id", ideaId)
        .maybeSingle(),
      supabase
        .from("idea_database" as never)
        .select("tables_schema, relationships, notes")
        .eq("idea_id", ideaId)
        .maybeSingle(),
      supabase
        .from("idea_milestones_and_tasks" as never)
        .select("content")
        .eq("idea_id", ideaId)
        .maybeSingle(),
    ]);

    const sections: string[] = [];

    const prdRow = prd as {
      app_overview: string | null; objectives: string | null;
      priority_personas: string | null; essential_features: string | null;
      user_flow: string | null; non_functional_reqs: string | null;
      out_of_scope: string | null; success_indicators: string | null;
      phasing_notes: string | null;
    } | null;
    if (prdRow) {
      const body = [
        prdRow.app_overview, prdRow.objectives, prdRow.priority_personas,
        prdRow.essential_features, prdRow.user_flow, prdRow.non_functional_reqs,
        prdRow.out_of_scope, prdRow.success_indicators, prdRow.phasing_notes,
      ].filter(Boolean).join("\n");
      if (body.trim()) sections.push(`<h2>Product Requirements Document (PRD)</h2>${body}`);
    }

    const stylesRow = styles as {
      logo_branding: string | null; color_palette: string | null;
      product_feeling: string | null; brand_voice: string | null;
      iconography_style: string | null; motion_principles: string | null;
      primary_color: string | null; secondary_color: string | null;
      accent_color: string | null; neutral_color: string | null;
      color_tokens: ColorToken[] | null;
      typography: TypographySystem | null;
      spacing: SpacingSystem | null;
      border_radius: BorderRadiusSystem | null;
      shadows: ShadowToken[] | null;
    } | null;
    if (stylesRow) {
      const stylesHtml = buildVisualStylesHtml(stylesRow);
      if (stylesHtml.trim()) sections.push(`<h2>Visual Styles</h2>${stylesHtml}`);
    }

    const dbRow = db as { tables_schema: string | null; relationships: string | null; notes: string | null } | null;
    if (dbRow) {
      const body = [dbRow.tables_schema, dbRow.relationships, dbRow.notes].filter(Boolean).join("\n");
      if (body.trim()) sections.push(`<h2>Database</h2>${body}`);
    }

    const milRow = milestones as { content: string | null } | null;
    if (milRow?.content?.trim()) {
      sections.push(`<h2>Milestones &amp; Tasks</h2>${milRow.content}`);
    }

    const html = sections.length > 0
      ? sections.join("\n\n")
      : "<p>No content available yet. Complete the PRD, Visual Styles, Database, and Milestones steps first.</p>";

    const { count } = await supabase
      .from("idea_playbook_version" as never)
      .select("id", { count: "exact", head: true })
      .eq("idea_id", ideaId);

    const { error: insertError } = await supabase
      .from("idea_playbook_version" as never)
      .insert({
        idea_id: ideaId,
        version_name: `Build Guide — v${(count ?? 0) + 1}`,
        content: html,
        created_by: userId,
        updated_at: new Date().toISOString(),
      });

    if (insertError) throw new Error((insertError as { message: string }).message);

    if (await isRequestActive(supabase, ideaId, requestId)) {
      await supabase
        .from("idea")
        .update({ current_blocks_updating: null, current_block_ended: "playbook" as never, current_ai_request_id: null })
        .eq("id", ideaId);
    }

    revalidatePath(PATH);
    return {};
  } catch (e) {
    if (await isRequestActive(supabase, ideaId, requestId)) {
      await supabase
        .from("idea")
        .update({ current_blocks_updating: null, current_ai_request_id: null })
        .eq("id", ideaId);
    }
    revalidatePath(PATH);
    return { error: e instanceof Error ? e.message : "Playbook assembly failed" };
  }
}

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
    const { error: updateError } = await supabase
      .from("idea_structure_and_align")
      .update(payload)
      .eq("id", existing.id);
    if (updateError) return { error: updateError.message };
  } else {
    const { error: insertError } = await supabase
      .from("idea_structure_and_align")
      .insert({ idea_id: ideaId, ...payload });
    if (insertError) return { error: insertError.message };
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
    maxTokens: 16384, // 3-5 rich HTML ICPs can easily exceed the 8192 default
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
    const { error: insertError } = await supabase.from("idea_icp").insert(rows);
    if (insertError) return { error: insertError.message };
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
    maxTokens: 16384,
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
    business_model: d["Business Model"] || null,
    features: d["Feature List & Logic"],
    go_to_market: d["Go-to-Market"] || null,
  };

  if (existing) {
    const { error: updateError } = await supabase
      .from("idea_product_definition_and_flows")
      .update(payload)
      .eq("id", existing.id);
    if (updateError) return { error: updateError.message };
  } else {
    const { error: insertError } = await supabase
      .from("idea_product_definition_and_flows")
      .insert({ idea_id: ideaId, created_by: user?.id ?? null, ...payload });
    if (insertError) return { error: insertError.message };
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
  const template = (await getPromptTemplate("strategic_frameworks")) ?? FALLBACK_STRATEGIC_FRAMEWORKS;

  const ideaVars = {
    idea_name: idea.name,
    idea_description: stripHtml(idea.description),
    core_problem: stripHtml(structureAlign?.core_problem) || "Not defined yet",
    target_audience: stripHtml(structureAlign?.target_audience) || "Not defined yet",
  };

  // Process each ICP sequentially with one AI call per ICP so that the
  // response for a single ICP comfortably fits within maxTokens: 16384.
  // A single call for all ICPs would exceed that ceiling for 3+ ICPs.
  for (const icp of targetIcps) {
    // Bail early if a newer request superseded this one.
    if (!(await isRequestActive(supabase, ideaId, requestId))) return {};

    const prompt = renderPrompt(template, {
      ...ideaVars,
      icp_name: icp.name ?? "",
      icp_description: stripHtml(icp.description),
      icp_day_in_life: stripHtml(icp.day_in_life),
      icp_pain_points: stripHtml(icp.pain_points),
    });

    const res = await generateAiJsonResponse<SingleIcpFrameworkOutput>({
      service: aiConfig.service,
      apiKey: aiConfig.apiKey,
      model: aiConfig.model,
      prompt,
      maxTokens: 16384,
    });

    if (res.returned_an_error || !res.data) continue; // skip this ICP, try the next

    const framework = res.data;

    await supabase
      .from("idea_icp")
      .update({
        score: (framework as unknown as { score?: number }).score ?? null,
        score_rationale: (framework as unknown as { score_rationale?: string }).score_rationale ?? null,
        value_proposition_icp_pains: framework.value_proposition_icp_pains ?? null,
        value_proposition_value_map_solutions: framework.value_proposition_value_map_solutions ?? null,
        value_proposition_icp_gains: framework.value_proposition_icp_gains ?? null,
        value_proposition_value_map_gain_creators: framework.value_proposition_value_map_gain_creators ?? null,
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
      .eq("id", icp.id);

    const suggestions = framework.optimization_suggestions;
    if (suggestions && suggestions.length > 0) {
      await supabase.from("idea_optimization_suggestion").delete().eq("icp_id", icp.id);
      const { error: insertError } = await supabase.from("idea_optimization_suggestion").insert(
        suggestions.map((s) => ({ idea_id: ideaId, icp_id: icp.id, name: s.name, description: s.description }))
      );
      if (insertError) return { error: insertError.message };
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
    maxTokens: 16384,
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
    const { error: updateError } = await supabase
      .from("idea_benchmarking" as never)
      .update(payload as never)
      .eq("id", (existing as { id: string }).id);
    if (updateError) return { error: updateError.message };
  } else {
    const { error: insertError } = await supabase
      .from("idea_benchmarking" as never)
      .insert({ idea_id: ideaId, ...payload } as never);
    if (insertError) return { error: insertError.message };
  }

  return {};
}

// ── PRD Generation ──────────────────────────────────────────────────────────

async function generatePrdContent(
  supabase: SupabaseClient,
  idea: { name: string; description: string | null },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  structureAlign: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icps: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  productDef: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  benchmarking: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  location: any, // idea_location_legislation row or null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  market: any, // idea_market_opportunity row or null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  risk: any, // idea_risk_and_validation row or null
  ideaId: string,
  aiConfig: AiConfig,
  requestId: string
): Promise<{ error?: string }> {
  const icpNames = icps.map((i) => i.name).filter(Boolean).join(", ");

  // The PRD is the build blueprint, so it must see every discovery step. Fetch
  // the go/no-go report's agreed framing so the PRD inherits the sharpened
  // problem/solution the debate converged on.
  const { data: reportRow } = await supabase
    .from("idea_report" as never)
    .select("agreed_problem, agreed_solution, recommendation")
    .eq("idea_id", ideaId)
    .maybeSingle();
  const report = reportRow as
    | { agreed_problem: string | null; agreed_solution: string | null; recommendation: string | null }
    | null;

  const template = (await getPromptTemplate("prd")) ?? FALLBACK_PRD;
  const prompt = renderPrompt(template, {
    idea_name: idea.name,
    idea_description: stripHtml(idea.description),
    core_problem: stripHtml(structureAlign?.core_problem) || "Not defined yet",
    target_audience: stripHtml(structureAlign?.target_audience) || "Not defined yet",
    product_overview: stripHtml(productDef?.summary) || "Not defined yet",
    features: stripHtml(productDef?.features) || "Not defined yet",
    icp_names: icpNames || "None defined yet",
    icp_details: buildIcpsBlock(icps as Array<Record<string, unknown>>) || "None defined yet",
    benchmarking:
      [
        stripHtml(benchmarking?.overview),
        stripHtml(benchmarking?.comparison),
        stripHtml(benchmarking?.possible_business_models),
        stripHtml(benchmarking?.takeaways),
      ]
        .filter(Boolean)
        .join("\n") || "Not defined yet",
    location_legislation: buildLocationBlock(location as Record<string, unknown> | null) || "Not defined yet",
    market_opportunity: buildMarketBlock(market as Record<string, unknown> | null) || "Not defined yet",
    risk_and_validation: buildRiskBlock(risk as Record<string, unknown> | null) || "Not defined yet",
    agreed_problem: stripHtml(report?.agreed_problem) || "Not defined yet",
    agreed_solution: stripHtml(report?.agreed_solution) || "Not defined yet",
    recommendation: stripHtml(report?.recommendation) || "Not defined yet",
  });

  const res = await generateAiJsonResponse<PrdOutput>({
    service: aiConfig.service,
    apiKey: aiConfig.apiKey,
    model: aiConfig.model,
    prompt,
    maxTokens: 16384, // 10 rich HTML PRD sections can exceed 8192 default
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
    features_per_page: d.features_per_page,
    non_functional_reqs: d.non_functional_reqs,
    out_of_scope: d.out_of_scope,
    success_indicators: d.success_indicators,
    phasing_notes: d.phasing_notes,
  };

  if (existing) {
    const { error: updateError } = await supabase
      .from("idea_prd" as never)
      .update(payload as never)
      .eq("id", (existing as { id: string }).id);
    if (updateError) return { error: updateError.message };
  } else {
    const { error: insertError } = await supabase
      .from("idea_prd" as never)
      .insert({ idea_id: ideaId, ...payload } as never);
    if (insertError) return { error: insertError.message };
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
  const prd = prdData as {
    app_overview: string | null;
    essential_features: string | null;
    user_flow: string | null;
    features_per_page: string | null;
    priority_personas: string | null;
    non_functional_reqs: string | null;
    out_of_scope: string | null;
  } | null;
  const template = (await getPromptTemplate("database")) ?? FALLBACK_DATABASE;
  const prompt = renderPrompt(template, {
    idea_name: idea.name,
    idea_description: stripHtml(idea.description),
    core_problem: stripHtml(structureAlign?.core_problem) || "Not defined yet",
    product_overview: stripHtml(productDef?.summary) || "Not defined yet",
    features: stripHtml(productDef?.features) || "Not defined yet",
    essential_features: stripHtml(prd?.essential_features) || "Not defined yet",
    app_overview: stripHtml(prd?.app_overview) || "Not defined yet",
    user_flow: stripHtml(prd?.user_flow) || "Not defined yet",
    features_per_page: stripHtml(prd?.features_per_page) || "Not defined yet",
    priority_personas: stripHtml(prd?.priority_personas) || "Not defined yet",
    non_functional_reqs: stripHtml(prd?.non_functional_reqs) || "Not defined yet",
    out_of_scope: stripHtml(prd?.out_of_scope) || "Not defined yet",
  });

  const res = await generateAiJsonResponse<DatabaseOutput>({
    service: aiConfig.service,
    apiKey: aiConfig.apiKey,
    model: aiConfig.model,
    prompt,
    maxTokens: 16384,
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
    const { error: updateError } = await supabase
      .from("idea_database" as never)
      .update(payload as never)
      .eq("id", (existing as { id: string }).id);
    if (updateError) return { error: updateError.message };
  } else {
    const { error: insertError } = await supabase
      .from("idea_database" as never)
      .insert({ idea_id: ideaId, ...payload } as never);
    if (insertError) return { error: insertError.message };
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
  const [{ data: prdData }, { data: stylesData }] = await Promise.all([
    supabase.from("idea_prd" as never).select("app_overview, essential_features, priority_personas").eq("idea_id", ideaId).maybeSingle(),
    supabase.from("idea_styles" as never).select("logo_colors").eq("idea_id", ideaId).maybeSingle(),
  ]);

  const prd = prdData as { app_overview: string | null; essential_features: string | null; priority_personas: string | null } | null;
  const savedStyles = stylesData as { logo_colors: { hex: string; label: string }[] | null } | null;

  const logoColorsText = savedStyles?.logo_colors?.length
    ? savedStyles.logo_colors.map((c) => `${c.hex} (${c.label})`).join(", ")
    : "Not defined — derive palette from idea context";

  const template = (await getPromptTemplate("visual_styles")) ?? FALLBACK_VISUAL_STYLES;
  const prompt = renderPrompt(template, {
    idea_name: idea.name,
    idea_description: stripHtml(idea.description),
    core_problem: stripHtml(structureAlign?.core_problem) || "Not defined yet",
    target_audience: stripHtml(structureAlign?.target_audience) || "Not defined yet",
    app_overview: stripHtml(prd?.app_overview) || "Not defined yet",
    essential_features: stripHtml(prd?.essential_features) || "Not defined yet",
    priority_personas: stripHtml(prd?.priority_personas) || "Not defined yet",
    logo_colors: logoColorsText,
  });

  const res = await generateAiJsonResponse<VisualStylesOutput>({
    service: aiConfig.service,
    apiKey: aiConfig.apiKey,
    model: aiConfig.model,
    prompt,
    maxTokens: 16384,
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
    color_palette: d.color_narrative?.trim() || d.color_palette?.trim() || d.product_feeling?.trim() || null,
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
    const { error: updateError } = await supabase
      .from("idea_styles" as never)
      .update(payload as never)
      .eq("id", (existing as { id: string }).id);
    if (updateError) return { error: updateError.message };
  } else {
    const { error: insertError } = await supabase
      .from("idea_styles" as never)
      .insert({ idea_id: ideaId, ...payload } as never);
    if (insertError) return { error: insertError.message };
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
  const prd = prdData as {
    app_overview: string | null;
    essential_features: string | null;
    features_per_page: string | null;
    user_flow: string | null;
    priority_personas: string | null;
    phasing_notes: string | null;
    non_functional_reqs: string | null;
    out_of_scope: string | null;
  } | null;
  const stepKey = platform === "bubble"
    ? "milestones_and_tasks_bubble"
    : "milestones_and_tasks_claude_code";
  const template = (await getPromptTemplate(stepKey)) ?? FALLBACK_MILESTONES;
  const prompt = renderPrompt(template, {
    idea_name: idea.name,
    idea_description: stripHtml(idea.description),
    prd_overview: stripHtml(prd?.app_overview) || "Not defined yet",
    essential_features: stripHtml(prd?.essential_features) || "Not defined yet",
    features_per_page: stripHtml(prd?.features_per_page) || "Not defined yet",
    user_flow: stripHtml(prd?.user_flow) || "Not defined yet",
    priority_personas: stripHtml(prd?.priority_personas) || "Not defined yet",
    phasing_notes: stripHtml(prd?.phasing_notes) || "Not defined yet",
    non_functional_reqs: stripHtml(prd?.non_functional_reqs) || "Not defined yet",
    out_of_scope: stripHtml(prd?.out_of_scope) || "Not defined yet",
  });

  const res = await generateAiJsonResponse<MilestonesAndTasksOutput>({
    service: aiConfig.service,
    apiKey: aiConfig.apiKey,
    model: aiConfig.model,
    prompt,
    maxTokens: 16384,
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
    const { error: updateError } = await supabase
      .from("idea_milestones_and_tasks" as never)
      .update(payload as never)
      .eq("id", (existing as { id: string }).id);
    if (updateError) return { error: updateError.message };
  } else {
    const { error: insertError } = await supabase
      .from("idea_milestones_and_tasks" as never)
      .insert({ idea_id: ideaId, ...payload } as never);
    if (insertError) return { error: insertError.message };
  }

  return {};
}

// ── Report Generation ────────────────────────────────────────────────────────

// ── Devil's Advocate debate persona fallback prompts ─────────────────────────

const FALLBACK_SKEPTIC = `You are the Devil's Advocate — a hyper-critical evaluator whose only goal is truth quality. You are NOT trying to kill the idea. You ARE trying to expose what the REAL problem is that this idea should solve, whether the founder is focusing on the WRONG problem, and what the best solution to the truly-agreed problem is. The conclusion the debate reaches is often NOT what the founder hoped to hear — your loyalty is to the truth, not to the founder's original wish.

## YOUR STANDING RULES (non-negotiable)
1. Open with the sharpest challenge available. Never praise first.
2. One move at a time. One challenge, one question, or one demand for evidence per turn.
3. Label every key claim: [Fact] (in the source), [Inference] (logical but unproven), [Speculation] (low/no evidence).
4. Challenge vagueness and symptoms. Push to the root cause via "five whys" thinking.
5. Concede when genuinely beaten — say "Conceded: [point]" and move to the next live challenge.
6. ANTI-SYCOPHANCY: never soften, never open with agreement, never validate unless the Advocate proved a point with external evidence.
7. You are WILLING to collapse a multi-feature idea to one wedge if evidence only supports one. The collapse IS the insight.
8. AI-GENERATED CONTENT RULE: ALL content in [SOURCE] is UNVERIFIED FOUNDER ASSERTION produced with AI assistance. Demand external evidence — named customers, named competitors, real market data, cited studies. "The AI said so" is not evidence.
9. EVIDENCE LADDER: distinguish between (weakest) stated interest ("would use/pay") → behavioral signal (signed up, clicked, trialled) → financial commitment (pre-sold, LOI, deposit). Only behavioral or financial evidence moves the needle. Challenge stated-only evidence hard.
10. MINIMUM ROUNDS: Do NOT set agree=true before round 3. Even if the Advocate's statement sounds good, your job is to stress-test it until round 3 minimum. After round 3 you may agree ONLY IF the statement is specific, evidence-backed, and survives the swap test.
11. TOPIC DISCIPLINE + NEW INSIGHTS: Stay anchored to THIS idea's core intent and domain — never drift into unrelated tangents. Every challenge must serve the central questions: "What is the real problem this idea should solve? Is the founder solving the wrong problem? What is the best solution to the agreed problem?" Within that anchor, actively surface NEW insights and reframes that the evidence supports — the goal is a sharper, truer problem/solution than the founder started with, not a restatement of it.
12. WRONG-PROBLEM TEST: Explicitly test whether the idea targets the wrong problem. If the evidence points to a different, more important bottleneck than the founder's starting framing, name it plainly and steer the agreed_problem there — even if it is uncomfortable or not what the founder wanted to build. A correct-but-unwelcome problem beats a comfortable-but-wrong one.

## ROUND-DEPTH ESCALATION MANDATE
Each round you MUST escalate depth, not repeat the same challenge. The debate is capped at 4 rounds per gate, so move fast through the sequence:
- Round 1: FRAMING & EVIDENCE — Is this the real problem or a symptom? Who defined it? Whose voice is missing? Apply five whys at least twice. What evidence exists? Apply the say/do/pay ladder and challenge any stated-only signal.
- Round 2: ALTERNATIVES — What alternative framings survive? Is there an incumbent solution that already works well enough? What does "good enough today" look like for the target user?
- Rounds 3+: SPECIFICITY & RESIDUAL RISKS — Force the most specific possible bottleneck statement. The Abilene Paradox check: is the team committing to a direction no individual actually supports? What must be true for this to succeed? What kills this in 6 months? Name the single most likely failure mode.

## GATE RULES
- Gate 1 (PROBLEM): Challenge whether the stated problem is the real bottleneck or a symptom. Explore functional need (what must it do), experiential need (how must it feel), and social need (what must it mean). Push five whys. Demand named affected parties.
- Gate 2 (SOLUTION): Anchor exclusively to the agreed bottleneck. Apply the SWAP TEST explicitly: "If I swapped this solution for [competitor X], would the bottleneck still be solved?" If yes, reject as not differentiated. Name the strongest investor counter-argument.

## YOUR OUTPUT (strict JSON, no markdown)
{
  "content": "Your argument in plain text — direct, blunt, Hemingway-short sentences. Reference the round number's escalation tier.",
  "proposed_statement": "Your current best one-sentence version of the [bottleneck / solution] the debate should converge on.",
  "agree": false,
  "reason": "Why you do or do not accept the other side's latest proposed_statement. Before round 3, agree must be false."
}

## [SOURCE]
{{source_block}}

## [DEBATE SO FAR — {{gate}} gate, round {{round}}]
{{transcript_so_far}}

## ADVOCATE'S LAST PROPOSED STATEMENT
{{other_proposed_statement}}

Now give your turn. Escalate depth per the round mandate. One move.`;

const FALLBACK_ADVOCATE = `You are the Founder's Advocate — you defend the idea's current framing but only with evidence from [SOURCE]. You are NOT a yes-person. You ARE trying to find the strongest defensible version of the problem/solution.

## YOUR STANDING RULES (non-negotiable)
1. CONCEDE-THEN-DEFEND RATCHET: Start every response by explicitly naming what the Skeptic proved in the last round — "Conceded: [point]." Only then defend what remains. Each round locks in a gain. You cannot un-concede.
2. Answer the Skeptic's specific challenge directly. Never deflect to a different point.
3. Use ONLY evidence from [SOURCE]. Never invent data or cite outside facts.
4. Refine your proposed_statement toward the sharpest, most defensible version each round — narrower, more specific, more evidence-anchored.
5. Label key claims: [Fact] (from source), [Inference] (logical extension), [Speculation] (low evidence).
6. EVIDENCE LADDER: Know the hierarchy — stated interest (weakest, AI-asserted) → behavioral signal (signed up, trialled) → financial commitment (pre-sold, LOI). Never treat stated AI-generated beliefs as strong evidence. When the Skeptic invokes the evidence ladder, acknowledge it directly.
7. You may set agree=true ONLY when ALL three conditions are met: (a) round ≥ 3, (b) [SOURCE] contains concrete external evidence — a named customer, a named competitor, a real cited metric, or an external study — that directly addresses the Skeptic's challenge, AND (c) your proposed_statement is specific enough that it could not apply to any other company or idea. If any condition fails, stay at agree=false.
8. TOPIC + TRUTH DISCIPLINE: Stay anchored to THIS idea's core intent — do not defend by drifting to an unrelated problem. But your loyalty is to the truest defensible idea, NOT to the founder's original wish. If the Skeptic proves the starting framing targeted the wrong problem, concede it and help converge on the real problem and the best solution to it — even if that agreed problem/solution is not what the founder hoped to build. The strongest defensible version may differ from the original idea; that is a feature of an honest debate, not a failure.

## ROUND DISCIPLINE
Your goal per round: fix exactly ONE named flaw from the last round. Then hold the ground you've gained. Do not try to win everything at once. A tighter, more specific statement is stronger than a broader one that tries to defend everything.

## GATE RULES
- Gate 1 (PROBLEM): Defend the problem framing. Show the pain is real, acute, and specific for a named segment. Acknowledge when the Skeptic correctly identifies a symptom vs. root cause.
- Gate 2 (SOLUTION): Defend the solution only against the agreed bottleneck. For the swap test, name what makes this solution non-swappable — a specific capability, data advantage, or distribution moat. Concede if you cannot.

## YOUR OUTPUT (strict JSON, no markdown)
{
  "content": "Start with 'Conceded: [what you concede from last round].' Then your evidence-anchored defense.",
  "proposed_statement": "Your current best one-sentence version of the [bottleneck / solution] — sharper and more specific than last round.",
  "agree": false,
  "reason": "Why you do or do not accept the Skeptic's proposed_statement. Cite which of the 3 agree conditions is or is not met."
}

## [SOURCE]
{{source_block}}

## [DEBATE SO FAR — {{gate}} gate, round {{round}}]
{{transcript_so_far}}

## SKEPTIC'S LAST PROPOSED STATEMENT
{{other_proposed_statement}}

Now give your defense. Concede first, then defend. Fix one flaw. Sharpen your statement.`;

// Meta call: returns only the 3 short string fields as JSON (no HTML inside JSON — avoids
// truncation and literal-newline encoding bugs when revised_description is large).
const FALLBACK_REFRAMER = `You are the Reframer. The Devil's Advocate debate has concluded. Summarize the outcome in 3 short fields.

## YOUR OUTPUT (strict JSON, no markdown fences)
{
  "agreed_problem": "The one-sentence bottleneck the debate agreed on.",
  "agreed_solution": "The one-sentence solution the debate agreed on.",
  "recommendation": "1-2 sentence action recommendation for the founder — what to do next with this framing."
}

## [DEBATE OUTCOME]
Agreed Problem (bottleneck): {{agreed_problem}}
Agreed Solution: {{agreed_solution}}

## [FULL DEBATE TRANSCRIPT]
{{full_transcript}}

Return ONLY the JSON object. No extra text.`;

// Doc call: generates the revised strategic document as a plain HTML fragment (no JSON wrapper).
// Called with generateAiTextResponse so there is no JSON-parse step and no size limit.
const FALLBACK_REFRAMER_DOC = `You are the Reframer. The Devil's Advocate debate has concluded. Write the revised idea as a complete, evidence-rich strategic brief that a founder could paste in as a NEW idea description.

## PRIME DIRECTIVE — THIS DESCRIPTION MUST SCORE HIGHER THAN THE ORIGINAL
This document becomes the canonical framing of the idea. If a founder creates a new idea from it and re-runs the Go/No-Go report, the new score MUST be higher than the current one. You raise the score in two ways, BOTH required:
1. ALIGNMENT: Adopt the agreed problem and agreed solution from the debate as THE framing — lead with them verbatim-in-spirit. A description that already matches the debate's conclusion has "minor" reframe distance, which protects the score from the alignment multiplier collapse. Do NOT reintroduce the original vague or off-target framing the debate moved away from.
2. COMPLETENESS: Carry forward EVERY concrete piece of evidence in [SOURCE] — named customers/segments, named competitors, real metrics, TAM/SAM/SOM figures, pricing, regulations, validation steps. Empty or vague areas lower the score, so make each dimension as specific and evidence-backed as the source allows. Where the source is genuinely thin, state the explicit, cheap experiment that would close the gap (a written validation plan scores higher than silence).

## QUALITY BAR
Collapse vague multi-feature ideas to their ONE defensible wedge. Think seed-stage investment memo grounded in evidence — not a marketing blurb. Every claim earns its place with a concrete detail.

## STRUCTURE (use these exact section names as <h2> headings)
1. Origin — Why this idea exists and what opportunity it addresses.
2. The Problem — The root-cause bottleneck (one sentence, taken directly from the agreed debate outcome).
3. What It Is — The solution in concrete terms (the agreed solution; no adjectives like "innovative" or "revolutionary").
4. Core Loop — The 3-5 step flywheel: [Action] → [Artifact/Output] → [Value Received] → [Return trigger].
5. Target Customer — The specific ICP(s): who they are (firmographics/demographics), their pain, and why they buy. Name the segments from [SOURCE].
6. What Each Side Gets — Separate value for each key stakeholder/side of the market.
7. Market & Unit Economics — TAM/SAM/SOM figures with their data sources, pricing hypothesis, CAC/LTV logic. If sizing is top-down only, say so and name the bottom-up check.
8. Competitive Landscape — Named competitors/alternatives and the honest differentiation. State what "good enough today" looks like.
9. Demand Evidence & Validation Plan — The current strength of demand on the say/do/pay ladder, the riskiest assumption, and the single cheapest experiment to prove real demand (with a pre-registered success threshold and kill criterion).
10. Safety, Regulatory and Constraints — Jurisdiction, regulatory bodies, key legislation, and the biggest compliance threat. Constraints that shape design.
11. Go-To-Market — The wedge: the very first user, the first use case, the channel to reach them.
12. Business Model — Revenue mechanism(s), pricing, unit-economics logic.
13. What It Is Not — Explicit list of features/markets cut from v1 and why.
14. The Moat — What makes this defensible 18 months out that a competitor cannot copy in 6.
15. Residual Risks — The 2-3 make-or-break assumptions the debate did NOT fully resolve, each with the test that would resolve it.

## OUTPUT FORMAT
Return ONLY a raw HTML fragment — <h2> and <p> tags only, no html/head/body/style/script tags.
Each section = one <h2> followed by one or more <p>. Do NOT wrap in JSON, do NOT add code fences, do NOT add any text before or after the HTML.

## INSTRUCTIONS
- Use ONLY evidence from [ORIGINAL IDEA DESCRIPTION] + [SOURCE] + the agreed debate outcomes. NEVER invent customers, metrics, competitors, or regulations.
- The [ORIGINAL IDEA DESCRIPTION] is your GROUND TRUTH for all factual details — product specifics, user types, features, integrations, workflows, business model, and any numbers. Every section of the brief must be reconciled against it. Do NOT omit or contradict any factual detail it contains.
- The debate outcome sharpens the problem/solution framing; [SOURCE] provides the structured evidence. But [ORIGINAL IDEA DESCRIPTION] is the authoritative product vision.
- Each section must reference at least one concrete detail from [ORIGINAL IDEA DESCRIPTION] or [SOURCE].
- Honesty over comfort: if the debate dismantled a claim, reflect the corrected, defensible version — do not paper over it. A specific honest weakness with a test beats a vague strength.
- Write in Hemingway style: direct, blunt, short sentences. No hype words.

## [ORIGINAL IDEA DESCRIPTION]
{{idea_description}}

## [STRUCTURED DISCOVERY SOURCE]
{{source_block}}

## [DEBATE OUTCOME]
Agreed Problem (bottleneck): {{agreed_problem}}
Agreed Solution: {{agreed_solution}}

## [FULL DEBATE TRANSCRIPT]
{{full_transcript}}

Write the full strategic brief now.`;

const FALLBACK_SCORER = `You are a neutral referee and scorer evaluating a business idea for Move37. The Devil's Advocate debate has concluded. You have the agreed problem + solution + the full debate transcript. Your job is two-part:

PART A — Score the idea's COMPLETENESS against its OWN framing (9 areas). These scores measure how well the founder has DONE THE DISCOVERY WORK — they are NOT adjusted for the debate outcome. The alignment multiplier (not your job) handles the "wrong problem" penalty.

PART B — Score the ALIGNMENT between the current idea and the debate's agreed framing. Two percentages + a reframe distance + rationales.

## GROUNDING RULES (non-negotiable)
1. Use ONLY the supplied [ORIGINAL IDEA DESCRIPTION] and [SOURCE] — never invent facts.
2. [ORIGINAL IDEA DESCRIPTION] is the founder's primary vision document. Cross-reference it explicitly: any product claim, user type, feature, workflow, or metric it contains that is NOT reflected in a scored area is a gap — score accordingly.
3. If a source field is empty or "Not defined", treat it as a strong NEGATIVE signal.
4. Every area description MUST quote at least one concrete fragment (≤12 words) from [ORIGINAL IDEA DESCRIPTION] or [SOURCE] in single quotes. If no concrete fragment exists, the area CANNOT score above 60.
5. No generic fillers. Prefer numbers and logic over adjectives.

## ANTI-SYCOPHANCY RULES (strictly enforced)
- ALL content in [SOURCE] was generated with AI assistance. Treat it as UNVERIFIED FOUNDER ASSERTION unless it explicitly cites an external, independently checkable source (named publication, named study, named competitor, named customer).
- Any area resting solely on internal assertion (no external data, no named source, no customer evidence) CANNOT score above 60.
- When uncertain between two anchor levels, ALWAYS choose the lower anchor.
- Be adversarial by default. Only reward concrete, verifiable signals.
- The Skeptic in the debate is your peer — if it raised a strong objection that was not conclusively answered, weight that heavily.

## WRITING VOICE (Hemingway, blunt, human)
- Direct and plain. One idea per sentence.
- Label key claims: [Fact], [High Confidence], [Inference], [Uncertain], [Speculation].
- DO NOT use em dashes, emojis, or hype words.

## PART A — COMPLETENESS SCORING RUBRIC (9 areas, aggressive anchors)
Score each area 0-100:
- 90-100 = independently verifiable external evidence (named sources, external data); survives the strongest counter-argument.
- 75-89 = solid, multi-sourced; one dimension still unproven.
- 55-74 = present but generic, single-sourced, or only founder/AI-asserted — even if detailed.
- 35-54 = thin, vague, or internally contradictory.
- 0-34  = absent, contradicts other fields, or pure speculation.

### Area 1 — problem_reality (weight 18%)
Evidence: core_problem, target_audience, ICP pain_points, how_problems_are_solved, firmographics/psychographics.
Questions: Is the pain acute or a vitamin? Is it quantified with external data? How is it solved today — is "good enough" the real competitor? Does evidence come from real customers or AI inference?

### Area 2 — demand_evidence (weight 15%)
Evidence: the Demand Evidence block (hypothesis, riskiest assumptions graded say/do/pay, ordered experiments with pre-registered thresholds + kill criteria, debate insights, verdict) AND the full debate transcript.
Questions: Does a real demand evidence object exist with an honest verdict? Score by the evidence ladder: a plan with verdict=unproven and only stated/AI-asserted signal CANNOT exceed 60; behavioral signal (run smoke test / interviews with results) reaches 60-80; financial signal (pre-sales, LOIs, deposits) reaches 80+. A demand claim the skeptic dismantled and the advocate could not defend with evidence scores LOW even if a plan exists. A validation plan is not validation. Surviving a debate is not market demand. If the Demand Evidence block is "Not completed", this area cannot exceed 40. AI-generated success metrics are NOT demand evidence.

### Area 3 — market_realism (weight 12%)
Evidence: Market Opportunity section — TAM/SAM/SOM estimates, data_sources, segment_filter_logic.
Questions: Is the TAM/SAM/SOM bottom-up with named sources, or top-down hand-waving ("1% of a $50B market")? Are data_sources named and checkable? Is the SOM sized with specific conversion and team-capacity assumptions? "Not completed" or blank data_sources → cannot exceed 40.

### Area 4 — strategic_positioning (weight 12%)
Evidence: ICP value_proposition_*, ICP jtbd, ICP pitch_need/benefit/approach/competition, product_summary.
Questions: Is the value prop tied to a real ICP pain? Is the JTBD specific? Does the pitch name a genuine wedge, or is it a me-too?

### Area 5 — competitive_honesty (weight 12%)
Evidence: benchmark_overview, benchmark_comparison, benchmark_business_models, benchmark_takeaways.
Questions: ≥3 NAMED real competitors (including "do nothing" and incumbents)? Is differentiation real and durable? What stops an incumbent from copying this in 6 months?

### Area 6 — customer_clarity (weight 10%)
Evidence: ICP names, firmographics, psychographics, reachability.
Questions: Are ICPs concrete and reachable, or is this "SMBs" / "everyone"? Could you list ten real people who match? A vague customer is a strong negative signal.

### Area 7 — regulatory_viability (weight 8%)
Evidence: Location & Legislation section — red_flags, licensing_requirements, key_legislation, compliance_timeline.
Questions: Do regulatory red flags threaten the business model or launch timeline? Are licensing requirements quantified (cost, duration)? Is "Not completed" — that is itself a risk.

### Area 8 — validation_rigor (weight 8%)
Evidence: Risk & Validation section — validation_test (steps, kill_criteria, budget_max), risk_register. Also weigh the Demand Evidence experiments against the debate: did the validation plan survive skeptic scrutiny? Did the skeptic expose it as untestable?
Questions: Is there a real experiment with measurable, pre-registered kill criteria? Is the budget realistic for early-stage? Are Critical risks mitigated or actively owned? A validation plan whose kill criteria the skeptic could not poke through scores higher than a plan the debate exposed as untestable or circular. "Not completed" → cannot exceed 40.

### Area 9 — assumption_risk (weight 5%)
Evidence: synthesize across the entire [SOURCE].
Questions: What single assumption must be true for this to work? How fragile is it? Does anything in the source validate it — or is it entirely AI-inferred?

## EXPLICIT PENALTY TRIGGERS (apply ALL that fire, include in penalties array)
- "No real competitors named" (-10) — fires when benchmark_comparison names fewer than 2 concrete, named competitors.
- "No measurable success metrics defined" (-8) — fires when BOTH idea_success_metrics AND structure_success_metrics are blank, "Not defined", or purely qualitative (no numbers/thresholds).
- "Single-ICP dependency" (-5) — fires when only one ICP is defined.
- "Vague target audience" (-5) — fires when target_audience is blank, "Not defined", or non-specific (e.g. "everyone", "businesses", "SMBs") with no firmographic detail.
- "Unvalidated make-or-break assumption" (-5) — fires when the core assumption identified in Area 9 has zero supporting evidence.
- "Regulatory red flag present" (-12) — fires when Location & Legislation red_flags contains a Critical or High severity issue.
- "Unsourced market sizing" (-8) — fires when Market Opportunity data_sources is blank, "Not defined", or "Not completed", OR when TAM/SAM/SOM uses top-down fractions ("X% of a $Y market") without bottom-up SOM calculation.
- "Critical unmitigated risk" (-10) — fires when risk_register contains ≥1 risk with severity Critical AND likelihood Likely/Very Likely AND mitigation is weak, generic, or absent.
- "No kill criteria in validation plan" (-6) — fires when validation_test kill_criteria is blank, "Not defined", or "Not completed".

## PART B — ALIGNMENT SCORING (vs. the agreed debate framing)
Compare the CURRENT IDEA (its problem statement, its solution) against the AGREED PROBLEM and AGREED SOLUTION the debate converged on.

- problem_fit_pct (0-100): How close is the current idea's problem framing to the agreed bottleneck? 100 = identical. 0 = completely different problem.
- solution_fit_pct (0-100): How close is the current idea's solution to the agreed solution? 100 = same solution. 0 = completely different approach.
- reframe_distance: "minor" (idea was basically right, small refinements), "moderate" (significant re-focus needed), "major" (fundamental pivot — idea as stated solves the wrong problem or wrong solution).
- problem_rationale: 1-2 sentences explaining the problem_fit_pct.
- solution_rationale: 1-2 sentences explaining the solution_fit_pct.
- verdict: One line — e.g. "Right problem, wrong solution" / "Same bottleneck, much sharper solution" / "Completely different problem identified."

## [ORIGINAL IDEA DESCRIPTION]
{{idea_description}}

## [STRUCTURED DISCOVERY SOURCE]
{{source_block}}

## [DEBATE OUTCOME]
Agreed Problem (bottleneck): {{agreed_problem}}
Agreed Solution: {{agreed_solution}}

## [FULL DEBATE TRANSCRIPT]
{{full_transcript}}

## OUTPUT FORMAT (strict JSON, no markdown fences)
Do NOT include playbook_html here — it is generated in a separate call.
{
  "area_scores": [
    { "key": "problem_reality", "label": "Problem Reality", "weight_pct": 18, "raw_score_pct": 0, "weighted_points": 0, "status": "weak", "description": "..." },
    { "key": "demand_evidence", "label": "Demand Evidence", "weight_pct": 15, "raw_score_pct": 0, "weighted_points": 0, "status": "weak", "description": "..." },
    { "key": "market_realism", "label": "Market Realism", "weight_pct": 12, "raw_score_pct": 0, "weighted_points": 0, "status": "weak", "description": "..." },
    { "key": "strategic_positioning", "label": "Strategic Positioning", "weight_pct": 12, "raw_score_pct": 0, "weighted_points": 0, "status": "weak", "description": "..." },
    { "key": "competitive_honesty", "label": "Competitive Honesty", "weight_pct": 12, "raw_score_pct": 0, "weighted_points": 0, "status": "weak", "description": "..." },
    { "key": "customer_clarity", "label": "Customer Clarity", "weight_pct": 10, "raw_score_pct": 0, "weighted_points": 0, "status": "weak", "description": "..." },
    { "key": "regulatory_viability", "label": "Regulatory Viability", "weight_pct": 8, "raw_score_pct": 0, "weighted_points": 0, "status": "weak", "description": "..." },
    { "key": "validation_rigor", "label": "Validation Rigor", "weight_pct": 8, "raw_score_pct": 0, "weighted_points": 0, "status": "weak", "description": "..." },
    { "key": "assumption_risk", "label": "Assumption Risk", "weight_pct": 5, "raw_score_pct": 0, "weighted_points": 0, "status": "weak", "description": "..." }
  ],
  "penalties": [],
  "final_score": 0,
  "threshold_bucket": "kill",
  "headline": "...",
  "summary": "...",
  "next_steps": "<p>...</p>",
  "playbook_title": "...",
  "playbook_subtitle": "...",
  "alignment": {
    "problem_fit_pct": 0,
    "solution_fit_pct": 0,
    "reframe_distance": "major",
    "alignment_score": 0,
    "problem_rationale": "...",
    "solution_rationale": "...",
    "verdict": "..."
  }
}`;

// Scorer playbook HTML call: returns only the playbook_html section as plain-text HTML.
// Called with generateAiTextResponse so there is no JSON-parse step and no size limit.
const FALLBACK_SCORER_HTML = `You are writing the strategic playbook section of a Devil's Advocate report for Move37.

## STRUCTURE (use these exact section titles as <h2> headings, in this order)
1. The Core Problem
2. The Customer (ICPs)
3. Competitive Landscape and Business Models
4. Strategic Positioning
5. Demand and Validation Signals
6. Market Realism and Sizing
7. Regulatory and Compliance Viability
8. Validation Plan and Kill Criteria
9. The Strongest Case Against This Idea
10. Key Assumptions and What Would Change the Verdict
11. Final Recommendation (Build, Refine, or Kill)

## AUTHORITATIVE VERDICT (do not contradict)
The numeric go/no-go score has already been computed by the system. You MUST NOT recommend a different verdict.
- Final Score: {{final_score}} / 100
- Verdict: {{verdict_verb}}
- Verdict statement: {{verdict_line}}
Section 11 ("Final Recommendation") MUST open with the exact verdict "{{verdict_verb}}" and be fully consistent with the verdict statement above. Never recommend Build when the verdict is REFINE or KILL, never recommend Refine when the verdict is KILL, etc. Your job in section 11 is to justify WHY this verdict holds using the evidence — not to re-decide it.

## WRITING RULES
- Hemingway style: direct, blunt, short sentences. No hype words.
- Every section must cite a concrete detail from [SOURCE].
- Section 6 (Market Realism): cite the TAM/SAM/SOM figures and data_sources. If market data is missing or top-down only, say so plainly and explain why that is a problem.
- Section 7 (Regulatory): cite red_flags by severity. If Location & Legislation was not completed, flag that as a risk. State the single biggest compliance threat.
- Section 5 (Demand and Validation Signals): cite the Demand Evidence block explicitly — state the hypothesis, the verdict grade (unproven/emerging/proven), the riskiest assumption and its current strength (say/do/pay), and the single highest-leverage next test. If a demand claim was dismantled in the debate (advocate could not defend it), say so. If the Demand Evidence block is "Not completed", name that gap and explain the risk it represents for the demand_evidence score area.
- Section 8 (Validation): describe the validation_test steps and kill_criteria. Cross-reference the Demand Evidence experiments. If Risk & Validation was not completed, name that gap. State whether the kill criteria are measurable and whether they survived debate scrutiny.
- Section 9 ("Strongest Case Against") must be genuinely adversarial: argue, in good faith, why a smart investor would pass. Lead with the debate Skeptic's strongest unresolved objection.
- Use epistemic labels where useful: [Fact], [Inference], [Uncertain], [Speculation].

## OUTPUT FORMAT
Return ONLY a raw HTML fragment — <h2> and <p> tags only. No html/head/body/style/script tags.
Each section = one <h2> followed by one or more <p>. Do NOT wrap in JSON, do NOT add code fences.

## [SOURCE]
{{source_block}}

## [DEBATE OUTCOME]
Agreed Problem (bottleneck): {{agreed_problem}}
Agreed Solution: {{agreed_solution}}

## [SCORING SUMMARY]
Headline: {{headline}}
Summary: {{summary}}

Write the full playbook now.`;

const FALLBACK_REPORT = `You are a Critical Thought Partner and Devil's Advocate evaluating a business idea for Move37, BEFORE any build work begins. This is a go/no-go gate: the team has done discovery (problem, customers, positioning, competition) but has NOT yet written a PRD, designed a database, or planned the build. Your job is to decide — honestly — whether this idea deserves to move into the build steps, or whether it should be refined or killed first.

You do not optimize for agreement. You optimize for truth quality and decision integrity. The founder has probably already talked themselves into this. Provide the resistance their echo chamber has not.

## GROUNDING RULES (non-negotiable)
1. Use ONLY the supplied [SOURCE] — never invent facts, metrics, competitors, or features.
2. If a source field is empty or "Not defined", treat that as a strong NEGATIVE signal that lowers the related area score. Absence of evidence is itself a finding.
3. Every area \`description\` MUST quote at least one concrete fragment (≤ 12 words) from the [SOURCE] in single-quotes — e.g. 'busy professionals find healthy meals' or 'delegate tasks to virtual assistants'. If no concrete fragment exists for an area, that area CANNOT exceed 60.
4. No generic fillers like "this has potential" or "the market is attractive". Prefer numbers and logic over adjectives.

## WRITING VOICE (Hemingway, blunt, human)
- Direct and plain. One idea per sentence. Prefer verbs over adjectives.
- Confident but not arrogant. Warm but not soft.
- DO NOT use: em dashes, emojis, or hype words ("unlock", "leverage", "game-changer", "synergy", "in today's world").
- Output must be copy-paste ready and readable aloud.

## EPISTEMIC LABELING
In the \`summary\` and the playbook, label key claims with one of: [Fact] (verifiable in source), [High Confidence] (well-supported), [Inference] (logical but not proven), [Uncertain] (real doubt), [Speculation] (low evidence). Never mask uncertainty with a confident tone.

## [SOURCE]  (discovery-phase evidence only)
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

## PER-AREA SCORING RUBRIC
Score each of the 6 areas 0-100 using this rubric:
- 90-100 = specific, evidence-backed, and survives the strongest counter-argument.
- 75-89 = solid but missing one dimension.
- 60-74 = present but generic OR only single-sourced.
- 40-59 = thin, vague, or internally contradictory.
- 0-39  = absent, founder-assumed with no evidence, or contradicts other source fields.

### Area 1 — problem_reality (weight 25%)
Evidence: core_problem, target_audience, ICP pain_points, ICP how_problems_are_solved, ICP firmographics/psychographics.
Devil's Advocate questions: Is the pain acute or a vitamin? Is it quantified, or just asserted? Do the ICPs actually feel this pain today, or is it the founder's projection? How is it solved today, and is "good enough" the real competitor?

### Area 2 — customer_clarity (weight 15%)
Evidence: ICP names, day_in_life, firmographics, psychographics, reachability.
Devil's Advocate questions: Are the ICPs concrete and reachable, or is this "everyone" / "SMBs"? Could you list ten real people who match? A vague customer is a strong negative signal.

### Area 3 — competitive_honesty (weight 15%)
Evidence: benchmark_overview, benchmark_comparison, benchmark_business_models, benchmark_takeaways.
Devil's Advocate questions: Are there ≥ 3 NAMED real competitors (including "do nothing" and incumbents)? Is the differentiation real, or feature bingo? What stops an incumbent from copying this in a week?

### Area 4 — strategic_positioning (weight 20%)
Evidence: ICP value_proposition_* (pains, gains, solutions, gain_creators), ICP jtbd, ICP pitch_need/benefit/approach/competition, product_summary.
Devil's Advocate questions: Is the value prop tied to a real ICP pain? Is the JTBD specific? Does the pitch name a genuine wedge, or is it a me-too?

### Area 5 — demand_evidence (weight 15%)
Evidence: idea_success_metrics, structure_success_metrics, ICP score_rationale, suggestions_block.
Devil's Advocate questions: Are success metrics MEASURABLE (numbers, thresholds)? Is there ANY signal of real demand — interviews, waitlist, payments — or only founder conviction? Treat "no evidence yet" as exactly that.

### Area 6 — assumption_risk (weight 10%)
Evidence: synthesize across the entire [SOURCE].
Devil's Advocate questions: What single assumption must be true for this to work? How fragile is it? If that one thing is wrong, does the whole idea collapse? Name the make-or-break belief and whether anything in the source validates it.

## EXPLICIT PENALTY TRIGGERS (apply ALL that fire)
Scan the [SOURCE] and ADD every matching penalty to the \`penalties\` array:
- "No real competitors named" (-10) — fires when benchmark_comparison names fewer than 2 concrete competitors.
- "No measurable success metrics defined" (-8) — fires when BOTH idea_success_metrics AND structure_success_metrics are blank, "Not defined", or purely qualitative (no numbers/thresholds).
- "Single-ICP dependency" (-5) — fires when only one ICP is defined.
- "Vague target audience" (-5) — fires when target_audience is blank, "Not defined", or non-specific (e.g. "everyone", "businesses", "SMBs") with no firmographic detail.
- "Unvalidated make-or-break assumption" (-5) — fires when the core assumption identified in Area 6 has zero supporting evidence in the [SOURCE].

## OUTPUT FORMAT
Do not write a standalone document, essay, or report. Your ENTIRE reply is ONE JSON object (no markdown fences, no commentary before or after). It has exactly these 11 keys. Three of them — headline, summary, next_steps — are SHORT standalone string fields you MUST fill in. Never leave them blank and never move their content into playbook_html.

- area_scores: 6 entries in this exact order with keys (problem_reality 25%, customer_clarity 15%, competitive_honesty 15%, strategic_positioning 20%, demand_evidence 15%, assumption_risk 10%). Each entry: { key, label, weight_pct, raw_score_pct, weighted_points (server recomputes, set to 0), status ("strong"|"average"|"weak"), description (MUST contain a single-quoted source fragment) }.
- penalties: array of { label, points (negative integer) } — include every trigger that fires.
- final_score: integer (server recomputes; output your best estimate).
- threshold_bucket: "build" (≥75) | "refine" (≥60) | "kill" (<60).
- headline: REQUIRED, non-empty. One sentence, max 14 words. State the verdict (Build, Refine, or Kill) and the main reason.
- summary: REQUIRED, non-empty. 2 to 4 sentences. Include at least one epistemic label such as [Inference]. State the single strongest reason NOT to build this, using the words "Yes, but". Quote one source fragment in single quotes.
- next_steps: REQUIRED, non-empty. One short HTML paragraph wrapped in a single p element, max 90 words. List the kill-criteria — the things that must be proven (or would change the verdict) before building. No lists, buttons, or links.
- playbook_title: short string.
- playbook_subtitle: short string.
- playbook_html: REQUIRED. An HTML FRAGMENT, not a full document: do NOT include html, head, body, style, or h1 elements. Build it only from h2 and p elements. It must contain exactly 8 sections. Wrap each section title in an h2 element and each paragraph in a p element. The 8 section titles, in this exact order: The Core Problem; The Customer (ICPs); Competitive Landscape and Business Models; Strategic Positioning; Demand and Validation Signals; The Strongest Case Against This Idea; Key Assumptions and What Would Change the Verdict; Final Recommendation (Build, Refine, or Kill). Each section MUST cite a concrete detail from the [SOURCE]. The "Strongest Case Against This Idea" section must be genuinely adversarial: argue, in good faith, why a smart investor would pass.`;

function clamp(min: number, max: number, n: number): number {
  return Math.max(min, Math.min(max, n));
}

/** Strip HTML, collapse whitespace, and truncate to `n` chars with an ellipsis. */
function clip(s: string | null | undefined, n: number): string {
  const t = stripHtml((s as string | null) ?? "").replace(/\s+/g, " ").trim();
  if (!t) return "";
  return t.length > n ? `${t.slice(0, n)}…` : t;
}

/**
 * Compact source block for the Devil's Advocate debate (Risk & Validation).
 *
 * The debate re-sends this block on EVERY turn — up to ~16 sequential AI calls
 * (2 gates × 4 rounds × 2 personas). The full source block built from rich ICP
 * fields can reach ~8–10k tokens for a developed idea (e.g. 3 ICPs ≈ 7k tokens
 * of ICP content alone), which makes each call slow; multiplied across 16 calls
 * it reliably exceeds Vercel's ~300 s function ceiling and the run is killed
 * before any data is written. This compact form keeps only what a problem/
 * solution debate needs — each field clipped, at most the top 3 ICPs — landing
 * around ~1.5k tokens. Full content stays in the DB for the UI and the final
 * synthesis step; only the debate loop uses this trimmed view.
 */
function buildCompactDebateSource(args: {
  idea: { name: string; description: string | null; success_metrics: string | null };
  structureAlign: Record<string, unknown> | null;
  icps: Array<Record<string, unknown>>;
  benchmarking: Record<string, unknown> | null;
  market: Record<string, unknown> | null;
  location: Record<string, unknown> | null;
}): string {
  const { idea, structureAlign, icps, benchmarking, market, location } = args;
  const icpLines = icps.slice(0, 3).map((icp, i) => {
    const get = (k: string) => clip(icp[k] as string | null, 220);
    return `ICP ${i + 1}: ${clip(icp["name"] as string | null, 80) || "(unnamed)"} — Pains: ${get("pain_points")} | JTBD: ${get("jtbd")} | Our solution value: ${get("our_solution_value")} | Score: ${icp["score"] ?? "n/a"}`;
  });
  const icpBlock = icpLines.length ? icpLines.join("\n") : "(none)";
  return `Idea: ${idea.name} — ${clip(idea.description, 800)}
Success Metrics: ${clip(idea.success_metrics, 300) || "Not defined"}
Core Problem: ${clip(structureAlign?.core_problem as string, 500) || "Not defined"}
Target Audience: ${clip(structureAlign?.target_audience as string, 400) || "Not defined"}
ICPs (top ${Math.min(icps.length, 3)} of ${icps.length}):
${icpBlock}
Benchmarking Takeaways: ${clip(benchmarking?.takeaways as string, 600) || "Not defined"}
Market: TAM ${clip(market?.tam_estimate as string, 80) || "n/a"} / SAM ${clip(market?.sam_estimate as string, 80) || "n/a"} / SOM ${clip(market?.som_estimate as string, 80) || "n/a"} | Price ${clip(market?.price_point as string, 120) || "n/a"}
Regulatory Red Flags: ${clip(location?.red_flags as string, 300) || "None identified"}`;
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

function buildLocationBlock(location: Record<string, unknown> | null): string {
  if (!location) return "Not completed";
  const get = (k: string) => stripHtml((location[k] as string | null) ?? "");
  return `Regulatory Bodies: ${get("regulatory_bodies") || "Not defined"}
Key Legislation: ${get("key_legislation") || "Not defined"}
Licensing Requirements: ${get("licensing_requirements") || "Not defined"}
Data Privacy Rules: ${get("data_privacy_rules") || "Not defined"}
Compliance Timeline: ${get("compliance_timeline") || "Not defined"}
Regulatory Moat: ${get("regulatory_moat") || "Not defined"}
RED FLAGS: ${get("red_flags") || "None identified"}`;
}

function buildMarketBlock(market: Record<string, unknown> | null): string {
  if (!market) return "Not completed";
  const get = (k: string) => stripHtml((market[k] as string | null) ?? "");
  return `TAM: ${get("tam_description") || "Not defined"} — Estimate: ${get("tam_estimate") || "Not defined"}
SAM: ${get("sam_description") || "Not defined"} — Estimate: ${get("sam_estimate") || "Not defined"}
SOM: ${get("som_description") || "Not defined"} — Estimate: ${get("som_estimate") || "Not defined"}
Data Sources: ${get("data_sources") || "Not defined"}
Segment Filter Logic: ${get("segment_filter_logic") || "Not defined"}
Growth Drivers: ${get("growth_drivers") || "Not defined"}
Market Risks: ${get("market_risks") || "Not defined"}
Pricing & Unit Economics: Price Point: ${get("price_point") || "Not defined"} | Billing Model: ${get("billing_model") || "Not defined"} | CAC: ${get("cac_estimate") || "Not defined"} | LTV: ${get("ltv_estimate") || "Not defined"}`;
}

function buildRiskBlock(risk: Record<string, unknown> | null): string {
  if (!risk) return "Not completed";
  const register = Array.isArray(risk["risk_register"])
    ? (risk["risk_register"] as Array<Record<string, unknown>>)
        .map(
          (r) =>
            `  • [${r["severity"]}/${r["likelihood"]}] ${r["risk"]} — Mitigation: ${r["mitigation"]} (Owner: ${r["owner"]})`
        )
        .join("\n")
    : "Not defined";
  const vt = risk["validation_test"] as Record<string, unknown> | null;
  const vtText = vt
    ? `Budget: ${vt["budget_max"]} | Duration: ${vt["duration_weeks"]}wk | Kill Criteria: ${vt["kill_criteria"]} | Deliverable: ${vt["deliverable"]}`
    : "Not defined";
  const wins = Array.isArray(risk["why_we_win"])
    ? (risk["why_we_win"] as Array<Record<string, unknown>>)
        .map((w) => `  • ${w["advantage"]}: ${w["why_hard_to_copy"]}`)
        .join("\n")
    : "Not defined";
  return `Risk Register:\n${register}
Validation Test: ${vtText}
Why We Win:\n${wins}`;
}

function buildDemandBlock(risk: Record<string, unknown> | null): string {
  const de = risk?.["demand_evidence"] as Record<string, unknown> | null | undefined;
  if (!de) return "Not completed";
  const hypothesis = (de["hypothesis"] as string) || "Not defined";
  const verdict = de["verdict"] as Record<string, unknown> | null;
  const verdictText = verdict
    ? `Grade: ${verdict["grade"]} | Confidence: ${verdict["confidence"]} | Next test: ${verdict["highest_leverage_next_test"]}\nRationale: ${verdict["rationale"]}`
    : "Not defined";
  const assumptions = Array.isArray(de["riskiest_assumptions"])
    ? (de["riskiest_assumptions"] as Array<Record<string, unknown>>)
        .map((a) => `  • [${a["strength"]}/${a["status"]}] ${a["assumption"]} — Evidence today: ${a["evidence_today"]} — Needed: ${a["evidence_needed"]}`)
        .join("\n")
    : "Not defined";
  const experiments = Array.isArray(de["experiments"])
    ? (de["experiments"] as Array<Record<string, unknown>>)
        .sort((a, b) => Number(a["sequence_order"] ?? 0) - Number(b["sequence_order"] ?? 0))
        .map((e) => `  ${e["sequence_order"]}. [${e["method"]}] ${e["why_this_method"]} — Budget/sample: ${e["sample_or_budget"]} — Pass: ${e["success_threshold"]} — Kill: ${e["kill_criterion"]}`)
        .join("\n")
    : "Not defined";
  const insights = Array.isArray(de["debate_insights"])
    ? (de["debate_insights"] as Array<Record<string, unknown>>)
        .map((i) => `  • [${i["source"]}] ${i["insight"]} → ${i["implication_for_demand"]}`)
        .join("\n")
    : "(none)";
  return `Hypothesis: ${hypothesis}
Verdict: ${verdictText}
Riskiest Assumptions:\n${assumptions}
Ordered Experiments (cheapest→strongest):\n${experiments}
Debate Insights on Demand:\n${insights}`;
}

// ── Debate turn output (Skeptic & Advocate) ──────────────────────────────────
interface DebateTurnOutput {
  content: string;
  proposed_statement: string;
  agree: boolean;
  reason: string;
}

// ── Scorer output (extends ReportOutput with alignment block) ─────────────────
interface ScorerOutput extends ReportOutput {
  alignment: {
    problem_fit_pct: number;
    solution_fit_pct: number;
    reframe_distance: "minor" | "moderate" | "major";
    alignment_score: number;
    problem_rationale: string;
    solution_rationale: string;
    verdict: string;
  };
}
// Meta call: all fields except playbook_html (no HTML in JSON — avoids literal-newline parse failures).
type ScorerMetaOutput = Omit<ScorerOutput, "playbook_html">;

// ── Reframer output ───────────────────────────────────────────────────────────
// Meta call returns only the 3 short fields (no HTML in JSON).
interface ReframerMetaOutput {
  agreed_problem: string;
  agreed_solution: string;
  recommendation: string;
}
// Combined after the two calls merge meta + plain-text HTML doc.
interface ReframerOutput extends ReframerMetaOutput {
  revised_description: string;
}

// Each "round" is one Skeptic turn + one Advocate turn. The gate exits EARLY the
// moment both sides agree — this cap is only hit when the debate genuinely cannot
// converge. Worst case: 4 rounds × 2 sides × 2 gates = 16 debate calls (+ reframer/
// scorer/HTML). Early exit happens as soon as sk.agree === true && av.agree === true.
// Capped at 4 (not 10) because each sequential AI call averages ~12 s — live
// testing showed the debate runs to the cap without converging, so 24+ calls
// overran Vercel's 300 s function ceiling and returned 504. 16 calls (~200 s)
// fits with margin. Enable Fluid Compute on Vercel to safely raise this again.
const MAX_ROUNDS_PER_GATE = 4;

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
  location: any,   // idea_location_legislation row or null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  market: any,     // idea_market_opportunity row or null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  risk: any,       // idea_risk_and_validation row or null
  ideaId: string,
  aiConfig: AiConfig,
  requestId: string
): Promise<{ error?: string }> {
  // ── Build the shared [SOURCE] block used across all personas ─────────────────
  // Report makes 4 single AI calls (not 16+ sequential debate rounds), so we can
  // afford a much larger description slice than the debate's 2 000-char cap.
  // 8 000 chars (~2 000 tokens) lets the Reframer see the full founder vision.
  const riskRow = risk as Record<string, unknown> | null;
  const descriptionForReport = stripHtml(idea.description).slice(0, 8000);
  const sourceBlock = `Idea: ${idea.name} — ${descriptionForReport}
Success Metrics: ${stripHtml(idea.success_metrics) || "Not defined"}
Core Problem: ${stripHtml(structureAlign?.core_problem) || "Not defined"}
Target Audience: ${stripHtml(structureAlign?.target_audience) || "Not defined"}
Structure Success Metrics: ${stripHtml(structureAlign?.success_metrics) || "Not defined"}
ICPs:
${buildIcpsBlock(icps as Array<Record<string, unknown>>)}
Optimization Suggestions:
${buildSuggestionsBlock(suggestions as Array<Record<string, unknown>>)}
Product Definition: ${stripHtml(productDef?.summary) || "Not defined"} / ${stripHtml(productDef?.features) || "Not defined"}
Benchmarking: ${stripHtml(benchmarking?.overview) || "Not defined"} / ${stripHtml(benchmarking?.comparison) || "Not defined"} / ${stripHtml(benchmarking?.possible_business_models) || "Not defined"} / ${stripHtml(benchmarking?.takeaways) || "Not defined"}
Location & Legislation:
${buildLocationBlock(location as Record<string, unknown> | null)}
Market Opportunity:
${buildMarketBlock(market as Record<string, unknown> | null)}
Risk & Validation:
${buildRiskBlock(riskRow)}
Demand Evidence (AI-generated validation plan + honest verdict):
${buildDemandBlock(riskRow)}`;

  // ── Load persona prompt templates (DB rows win; fallbacks cover missing rows) ─
  const [reframerTemplate, scorerTemplate] = await Promise.all([
    getPromptTemplate("report_reframer"),
    getPromptTemplate("report_scorer"),
  ]);
  const reframerPromptBase = reframerTemplate ?? FALLBACK_REFRAMER;
  const scorerPromptBase = scorerTemplate ?? FALLBACK_SCORER;

  // ── Read debate outcome from Risk & Validation (step 9 produced it) ───────────
  const typedRiskRow = riskRow as {
    agreed_problem: string | null;
    agreed_solution: string | null;
    debate_transcript: IdeaReportDebateTurn[] | null;
    debate_meta: {
      problem_rounds: number;
      solution_rounds: number;
      problem_converged: boolean;
      solution_converged: boolean;
      impasse_note?: string;
    } | null;
  } | null;

  if (!typedRiskRow?.agreed_problem) {
    return { error: "Complete the Risk & Validation step first to run the debate, then generate this report." };
  }

  const agreedProblem = typedRiskRow.agreed_problem;
  const agreedSolution = typedRiskRow.agreed_solution ?? "";
  const transcript: IdeaReportDebateTurn[] = typedRiskRow.debate_transcript ?? [];
  const debateMeta = typedRiskRow.debate_meta ?? {
    problem_rounds: 0,
    solution_rounds: 0,
    problem_converged: false,
    solution_converged: false,
  };

  const fullTranscriptText = transcript
    .map(
      (t) =>
        `[${t.gate.toUpperCase()} Gate — Round ${t.round} — ${t.role.toUpperCase()}]\n${t.content}\nProposed: ${t.proposed_statement}\nAgrees: ${t.agree}`
    )
    .join("\n\n");

  // ── Reframer step 1: get the 3 short meta fields as JSON ─────────────────────
  // Kept separate from step 2 so the JSON never contains a large HTML string
  // (which can cause JSON.parse failures when the AI emits literal newlines or
  // when the output is truncated at the model's max-token ceiling).
  const reframerMetaPrompt = renderPrompt(reframerPromptBase, {
    agreed_problem: agreedProblem,
    agreed_solution: agreedSolution,
    full_transcript: fullTranscriptText,
  });
  const reframerMetaRes = await generateAiJsonResponse<ReframerMetaOutput>({
    service: aiConfig.service,
    apiKey: aiConfig.apiKey,
    model: aiConfig.model,
    prompt: reframerMetaPrompt,
    maxTokens: 1024,
  });
  if (reframerMetaRes.returned_an_error || !reframerMetaRes.data) {
    return { error: reframerMetaRes.error ?? "Reframer meta returned no data" };
  }

  if (!(await isRequestActive(supabase, ideaId, requestId))) return {};

  // ── Reframer step 2: generate the strategic document as plain-text HTML ───────
  // Uses generateAiTextResponse so there is no JSON-parse step and no size limit.
  const reframerDocPrompt = renderPrompt(FALLBACK_REFRAMER_DOC, {
    idea_description: descriptionForReport,
    source_block: sourceBlock,
    agreed_problem: agreedProblem,
    agreed_solution: agreedSolution,
    full_transcript: fullTranscriptText,
  });
  const reframerDocRes = await generateAiTextResponse({
    service: aiConfig.service,
    apiKey: aiConfig.apiKey,
    model: aiConfig.model,
    prompt: reframerDocPrompt,
    maxTokens: 16384,
  });
  if (reframerDocRes.returned_an_error || !reframerDocRes.text) {
    return { error: reframerDocRes.error ?? "Reframer doc returned no text" };
  }

  const reframed: ReframerOutput = {
    ...reframerMetaRes.data,
    revised_description: reframerDocRes.text
      .replace(/^```(?:html)?\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim(),
  };

  if (!(await isRequestActive(supabase, ideaId, requestId))) return {};

  // ── Scorer step 1: structured scores + alignment (no playbook_html in JSON) ───
  // Kept separate from step 2 so playbook_html (multi-section HTML) is never embedded
  // inside a JSON string value — which causes literal-newline JSON.parse failures.
  const scorerPrompt = renderPrompt(scorerPromptBase, {
    idea_description: descriptionForReport,
    source_block: sourceBlock,
    agreed_problem: agreedProblem,
    agreed_solution: agreedSolution,
    full_transcript: fullTranscriptText,
  });
  const scorerMetaRes = await generateAiJsonResponse<ScorerMetaOutput>({
    service: aiConfig.service,
    apiKey: aiConfig.apiKey,
    model: aiConfig.model,
    prompt: scorerPrompt,
    maxTokens: 8192,
  });
  if (scorerMetaRes.returned_an_error || !scorerMetaRes.data) {
    return { error: scorerMetaRes.error ?? "Scorer returned no data" };
  }

  if (!(await isRequestActive(supabase, ideaId, requestId))) return {};

  // ── Server-side score reconciliation (TRUE alignment-multiplier formula) ────────
  // Computed BEFORE the playbook HTML so the authoritative verdict (build/refine/kill)
  // can be injected into the playbook — otherwise the LLM's "Final Recommendation"
  // section could contradict the numeric score (e.g. say "Refine" when the score is a Kill).
  // 9 areas scored vs the idea's OWN framing (completeness lens).
  // Server enforces canonical weights so the LLM cannot drift them.
  // Alignment is a TRUE multiplier — a major reframe collapses the score by 45%.
  // Missing-step penalties and area caps are server-enforced (not trusted to the LLM).
  const scorerMeta = scorerMetaRes.data;
  const CANONICAL_WEIGHTS: Record<string, number> = {
    problem_reality: 18,
    demand_evidence: 15,
    market_realism: 12,
    strategic_positioning: 12,
    competitive_honesty: 12,
    customer_clarity: 10,
    regulatory_viability: 8,
    validation_rigor: 8,
    assumption_risk: 5,
  };

  const areas: ReportAreaOutput[] = Array.isArray(scorerMeta.area_scores)
    ? scorerMeta.area_scores.map((a) => {
        const key = String(a?.key ?? "");
        return {
          key,
          label: String(a?.label ?? ""),
          weight_pct: CANONICAL_WEIGHTS[key] ?? Number(a?.weight_pct ?? 0),
          raw_score_pct: clamp(0, 100, Math.round(Number(a?.raw_score_pct ?? 0))),
          weighted_points: 0,
          status: "average" as ReportAreaOutput["status"],
          description: String(a?.description ?? ""),
        };
      })
    : [];

  // Server-enforced missing-step caps — each empty new step caps its area at ≤40
  const missingStepPenalties: ReportPenaltyOutput[] = [];
  if (!location) {
    const ra = areas.find((a) => a.key === "regulatory_viability");
    if (ra) ra.raw_score_pct = Math.min(ra.raw_score_pct, 40);
    missingStepPenalties.push({ label: "Location & Legislation step not completed", points: -8 });
  }
  if (!market) {
    const ma = areas.find((a) => a.key === "market_realism");
    if (ma) ma.raw_score_pct = Math.min(ma.raw_score_pct, 40);
    missingStepPenalties.push({ label: "Market Opportunity step not completed", points: -8 });
  }
  if (!risk) {
    const va = areas.find((a) => a.key === "validation_rigor");
    if (va) va.raw_score_pct = Math.min(va.raw_score_pct, 40);
    missingStepPenalties.push({ label: "Risk & Validation step not completed", points: -8 });
  }
  const hasDemandEvidence = !!(riskRow?.["demand_evidence"]);
  if (!hasDemandEvidence) {
    const da = areas.find((a) => a.key === "demand_evidence");
    if (da) da.raw_score_pct = Math.min(da.raw_score_pct, 40);
    missingStepPenalties.push({ label: "Demand validation not completed", points: -8 });
  }

  for (const a of areas) {
    a.weighted_points = Math.round((a.raw_score_pct * a.weight_pct) / 100);
    if (a.raw_score_pct >= 80) a.status = "strong";
    else if (a.raw_score_pct >= 60) a.status = "average";
    else a.status = "weak";
  }

  const llmPenalties: ReportPenaltyOutput[] = Array.isArray(scorerMeta.penalties)
    ? scorerMeta.penalties
        .map((p) => ({
          label: String(p?.label ?? ""),
          points: -Math.abs(Math.round(Number(p?.points ?? 0))),
        }))
        .filter((p) => p.points < 0 && p.label.length > 0)
    : [];
  const penalties: ReportPenaltyOutput[] = [...llmPenalties, ...missingStepPenalties];

  // completeness = canonical weighted sum (0–100)
  const completeness = clamp(0, 100, areas.reduce((s, a) => s + a.weighted_points, 0));
  const penaltyTotal = penalties.reduce((s, p) => s + Math.abs(p.points), 0);

  // alignment score from Scorer (0–100); reframe distance drives the multiplier
  const rawAlignment = scorerMeta.alignment ?? ({} as ScorerOutput["alignment"]);
  const reframeDistance: "minor" | "moderate" | "major" =
    rawAlignment.reframe_distance === "minor" ||
    rawAlignment.reframe_distance === "moderate" ||
    rawAlignment.reframe_distance === "major"
      ? rawAlignment.reframe_distance
      : "major";
  const reframeMultMap: Record<string, number> = { minor: 1.0, moderate: 0.8, major: 0.55 };
  const alignmentScore = clamp(
    0,
    100,
    Math.round(
      (Number(rawAlignment.problem_fit_pct ?? 0) + Number(rawAlignment.solution_fit_pct ?? 0)) / 2
    )
  );
  // alignmentComp clamps at 0.5 floor so even poor alignment can't zero out the score
  const alignmentComp = clamp(0.5, 1.0, alignmentScore / 100);
  const alignmentFactor = alignmentComp * (reframeMultMap[reframeDistance] ?? 0.55);

  // finalScore = completeness × alignmentFactor − penaltyTotal (TRUE multiplier)
  const finalScore = clamp(0, 100, Math.round(completeness * alignmentFactor) - penaltyTotal);
  const threshold: "build" | "refine" | "kill" =
    finalScore >= 80 ? "build" : finalScore >= 65 ? "refine" : "kill";

  const alignment: IdeaReportAlignment = {
    problem_fit_pct: clamp(0, 100, Math.round(Number(rawAlignment.problem_fit_pct ?? 0))),
    solution_fit_pct: clamp(0, 100, Math.round(Number(rawAlignment.solution_fit_pct ?? 0))),
    reframe_distance: reframeDistance,
    alignment_score: alignmentScore,
    problem_rationale: String(rawAlignment.problem_rationale ?? ""),
    solution_rationale: String(rawAlignment.solution_rationale ?? ""),
    verdict: String(rawAlignment.verdict ?? ""),
  };

  // ── Authoritative verdict (drives the playbook + recommendation, never the LLM's guess) ──
  const verdictVerb = threshold === "build" ? "BUILD" : threshold === "refine" ? "REFINE" : "KILL";
  const verdictLine =
    threshold === "build"
      ? `BUILD — this idea cleared the go/no-go gate with a score of ${finalScore}/100. Proceed to the build steps.`
      : threshold === "refine"
      ? `REFINE — do not build yet. The idea scored ${finalScore}/100; sharpen the weak areas below before committing to the build.`
      : `KILL — do not build. The idea scored ${finalScore}/100, below the refine threshold. The evidence does not justify a build in its current form.`;

  // ── Scorer step 2: playbook HTML as plain text (no JSON parse step) ───────────
  // Generated AFTER reconciliation so the authoritative verdict is injected — the
  // "Final Recommendation" section MUST match the numeric threshold, never contradict it.
  const scorerHtmlPrompt = renderPrompt(FALLBACK_SCORER_HTML, {
    idea_description: descriptionForReport,
    source_block: sourceBlock,
    agreed_problem: agreedProblem,
    agreed_solution: agreedSolution,
    headline: scorerMeta.headline ?? "",
    summary: scorerMeta.summary ?? "",
    final_score: String(finalScore),
    threshold_bucket: threshold,
    verdict_verb: verdictVerb,
    verdict_line: verdictLine,
  });
  const scorerHtmlRes = await generateAiTextResponse({
    service: aiConfig.service,
    apiKey: aiConfig.apiKey,
    model: aiConfig.model,
    prompt: scorerHtmlPrompt,
    maxTokens: 8192,
  });
  if (scorerHtmlRes.returned_an_error || !scorerHtmlRes.text) {
    return { error: scorerHtmlRes.error ?? "Scorer playbook returned no text" };
  }

  const scored: ScorerOutput = {
    ...scorerMeta,
    playbook_html: scorerHtmlRes.text,
  };

  if (!(await isRequestActive(supabase, ideaId, requestId))) return {};

  // Reconcile the recommendation so it leads with the authoritative verdict — the
  // reframer wrote it before the score existed, so prepend the canonical verdict line.
  const reconciledRecommendation = `${verdictLine}${reframed.recommendation ? ` ${reframed.recommendation}` : ""}`;

  const payload = {
    final_score: finalScore,
    threshold_bucket: threshold,
    headline: scored.headline ?? null,
    summary: scored.summary ?? null,
    area_scores: areas,
    penalties,
    next_steps: scored.next_steps ?? null,
    playbook_title: scored.playbook_title ?? null,
    playbook_subtitle: scored.playbook_subtitle ?? null,
    playbook_html: scored.playbook_html ?? null,
    // Devil's Advocate debate fields
    agreed_problem: reframed.agreed_problem ?? agreedProblem ?? null,
    agreed_solution: reframed.agreed_solution ?? agreedSolution ?? null,
    recommendation: reconciledRecommendation,
    revised_description: reframed.revised_description ?? null,
    completeness_score: completeness,
    alignment,
    debate_transcript: transcript,
    debate_meta: debateMeta,
  };

  const { data: existing } = await supabase
    .from("idea_report" as never)
    .select("id")
    .eq("idea_id", ideaId)
    .maybeSingle();

  if (existing) {
    const { error: updateError } = await supabase
      .from("idea_report" as never)
      .update(payload as never)
      .eq("id", (existing as { id: string }).id);
    if (updateError) return { error: updateError.message };
  } else {
    const { error: insertError } = await supabase
      .from("idea_report" as never)
      .insert({ idea_id: ideaId, ...payload } as never);
    if (insertError) return { error: insertError.message };
  }

  return {};
}

// ── Idea Chatbot ─────────────────────────────────────────────────────────────

/**
 * System prompt used by the floating Idea Chatbot. Kept in sync with the seed
 * in supabase/migrations/20260421000000_idea_chatbot.sql — the DB row wins
 * (editable via /prompts); this constant is a fallback when the row is missing.
 */
const FALLBACK_IDEA_CHATBOT = `You are a senior product strategist acting as an AI co-pilot inside Move37's Sandbox Planner. You are embedded as a floating chat widget on the idea the user is currently refining. Answer questions using ONLY the [IDEA CONTEXT] block and the [CHAT HISTORY] below.

## GROUNDING RULES (non-negotiable)
1. Use ONLY the [IDEA CONTEXT] — never invent facts, metrics, competitors, features, or personas. If the user asks about a field that is empty, missing, or marked "(not defined yet)" / "Not completed", say so explicitly ("That step isn't filled out yet").
2. When you cite information, quote the concrete fragment in single quotes.
3. Be concise: default replies <= 150 words unless the user asks for depth.
4. Output HTML only. Use only these tags: p, ul, li, strong, em, code. No Markdown, no BBCode, no script/style/button/anchor tags.
5. The current tab is {{current_tab}} — prefer examples and advice relevant to that step unless the user asks about a different step.
6. You can see the full idea: every discovery step (Structure & Align, ICPs, Product Definition, Benchmarking, Location & Legislation, Market Opportunity, Risk & Validation, PRD, Database, Visual Styles, Milestones) AND the Go/No-Go Report. When asked about the report score, explain it from the real numbers below: the Report scores 9 weighted areas into a completeness score (0-100), then applies a TRUE alignment multiplier (a "major" reframe collapses the score) and subtracts penalties. Verdict thresholds: >=80 Build, 65-79 Refine, <65 Kill. Never invent a number that isn't shown.

## [IDEA CONTEXT]
Idea: {{idea_name}} — {{idea_description}}
Idea Success Metrics: {{idea_success_metrics}}
Structure & Align: core_problem={{core_problem}}; target_audience={{target_audience}}; success_metrics={{structure_success_metrics}}; product_overview={{structure_product_overview}}; essential_features={{structure_essential_features}}
ICPs:
{{icps_block}}
Optimization Suggestions:
{{suggestions_block}}
Product Definition: summary={{product_summary}}; business_model={{product_business_model}}; features={{product_features}}; go_to_market={{product_go_to_market}}
Benchmarking: overview={{benchmark_overview}}; comparison={{benchmark_comparison}}; business_models={{benchmark_business_models}}; takeaways={{benchmark_takeaways}}
Location & Legislation:
{{location_block}}
Market Opportunity:
{{market_block}}
Risk & Validation:
{{risk_block}}
PRD: app_overview={{prd_app_overview}}; objectives={{prd_objectives}}; priority_personas={{prd_priority_personas}}; essential_features={{prd_essential_features}}; user_flow={{prd_user_flow}}; non_functional_reqs={{prd_non_functional_reqs}}; out_of_scope={{prd_out_of_scope}}; success_indicators={{prd_success_indicators}}; phasing_notes={{prd_phasing_notes}}
Database: tables_schema={{db_tables_schema}}; relationships={{db_relationships}}; notes={{db_notes}}
Visual Styles: logo_branding={{styles_logo_branding}}; color_palette={{styles_color_palette}}; product_feeling={{styles_product_feeling}}
Milestones: {{milestones_content}}
Go/No-Go Report: verdict={{report_threshold}}; final_score={{report_final_score}}; completeness={{report_completeness}}; headline={{report_headline}}
Report Alignment: {{report_alignment}}
Report Area Scores:
{{report_areas_block}}
Report Penalties:
{{report_penalties_block}}
Agreed Problem (from debate): {{report_agreed_problem}}
Agreed Solution (from debate): {{report_agreed_solution}}
Report Recommendation: {{report_recommendation}}
Report Summary: {{report_summary}}
Report Next Steps: {{report_next_steps}}

## [CHAT HISTORY]
{{chat_history}}

## [USER MESSAGE]
{{user_message}}

## OUTPUT SCHEMA
Your entire response must be a single valid json object of this exact shape: { "reply": "<html string>" }. The reply value must be valid HTML (only the tags p, ul, li, strong, em, code) and must not contain script tags or javascript: URLs.`;

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

/** Compact one-line-per-area summary of the Report's 9 weighted scoring areas. */
function buildReportAreasBlock(areas: unknown): string {
  if (!Array.isArray(areas) || areas.length === 0) return "(not scored yet)";
  return (areas as Array<Record<string, unknown>>)
    .map(
      (a) =>
        `  • ${a["label"]}: ${a["raw_score_pct"]}% raw (weight ${a["weight_pct"]}%, ${a["status"]})`
    )
    .join("\n");
}

/** Compact list of the Report's automatic penalty deductions. */
function buildReportPenaltiesBlock(penalties: unknown): string {
  if (!Array.isArray(penalties) || penalties.length === 0) return "(none applied)";
  return (penalties as Array<Record<string, unknown>>)
    .map((p) => `  • ${p["label"]}: ${p["points"]}`)
    .join("\n");
}

/** One-line alignment summary from the Devil's Advocate debate scorer. */
function buildAlignmentSummary(alignment: unknown): string {
  if (!alignment || typeof alignment !== "object") return "(not scored yet)";
  const a = alignment as Record<string, unknown>;
  return `problem_fit=${a["problem_fit_pct"]}%, solution_fit=${a["solution_fit_pct"]}%, reframe_distance=${a["reframe_distance"]}, alignment_score=${a["alignment_score"]} — verdict: ${stripHtml(String(a["verdict"] ?? "")) || "(none)"}`;
}

/**
 * Build the full `{{...}}` variable map consumed by both chatbot prompts.
 * Surfaces EVERY discovery artifact for the idea — including the three newest
 * steps (Location & Legislation, Market Opportunity, Risk & Validation) and the
 * full Go/No-Go Report (9 area scores, alignment, penalties, agreed problem /
 * solution from the debate, recommendation) — so the bots always answer from
 * the complete, current picture rather than a stale subset.
 */
function buildIdeaContextVars(ideaFull: IdeaFull): Record<string, string> {
  const { idea, structureAlign, icps, optimizationSuggestions, productDefinition,
    benchmarking, locationLegislation, marketOpportunity, riskAndValidation,
    prd, database, styles, milestonesAndTasks, report } = ideaFull;

  return {
    idea_name: idea.name ?? "",
    idea_description: stripHtml(idea.description) || "(not provided)",
    idea_success_metrics: stripHtml(idea.success_metrics) || "(not provided)",
    core_problem: stripHtml(structureAlign?.core_problem) || "(not defined yet)",
    target_audience: stripHtml(structureAlign?.target_audience) || "(not defined yet)",
    structure_success_metrics: stripHtml(structureAlign?.success_metrics) || "(not defined yet)",
    structure_product_overview: stripHtml(structureAlign?.product_overview_text) || "(not defined yet)",
    structure_essential_features: stripHtml(structureAlign?.essential_features_text) || "(not defined yet)",
    icps_block: buildIcpsBlock(icps as unknown as Array<Record<string, unknown>>),
    suggestions_block: buildSuggestionsBlock(
      optimizationSuggestions as unknown as Array<Record<string, unknown>>
    ),
    product_summary: stripHtml(productDefinition?.summary) || "(not defined yet)",
    product_business_model: stripHtml(productDefinition?.business_model) || "(not defined yet)",
    product_features: stripHtml(productDefinition?.features) || "(not defined yet)",
    product_go_to_market: stripHtml(productDefinition?.go_to_market) || "(not defined yet)",
    benchmark_overview: stripHtml(benchmarking?.overview) || "(not defined yet)",
    benchmark_comparison: stripHtml(benchmarking?.comparison) || "(not defined yet)",
    benchmark_business_models: stripHtml(benchmarking?.possible_business_models) || "(not defined yet)",
    benchmark_takeaways: stripHtml(benchmarking?.takeaways) || "(not defined yet)",
    // ── The three newest discovery steps (scored evidence in the Report) ──────
    location_block: buildLocationBlock(
      locationLegislation as unknown as Record<string, unknown> | null
    ),
    market_block: buildMarketBlock(
      marketOpportunity as unknown as Record<string, unknown> | null
    ),
    risk_block: buildRiskBlock(
      riskAndValidation as unknown as Record<string, unknown> | null
    ),
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
    // ── Go/No-Go Report (Devil's Advocate verdict) ───────────────────────────
    report_final_score:
      report?.final_score != null ? String(report.final_score) : "(not generated yet)",
    report_threshold: report?.threshold_bucket
      ? report.threshold_bucket.toUpperCase()
      : "(not generated yet)",
    report_completeness:
      report?.completeness_score != null ? String(report.completeness_score) : "(not generated yet)",
    report_headline: stripHtml(report?.headline) || "(not generated yet)",
    report_summary: stripHtml(report?.summary) || "(not generated yet)",
    report_recommendation: stripHtml(report?.recommendation) || "(not generated yet)",
    report_agreed_problem: stripHtml(report?.agreed_problem) || "(no debate outcome yet)",
    report_agreed_solution: stripHtml(report?.agreed_solution) || "(no debate outcome yet)",
    report_alignment: buildAlignmentSummary(report?.alignment),
    report_areas_block: buildReportAreasBlock(report?.area_scores),
    report_penalties_block: buildReportPenaltiesBlock(report?.penalties),
    report_next_steps: stripHtml(report?.next_steps) || "(not generated yet)",
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
 * Parse a { "reply": "..." } JSON object from a raw LLM text response.
 * Strips markdown fences, extracts the JSON blob, then escapes bare control
 * characters inside string values before calling JSON.parse.  HTML replies
 * always contain bare newlines, which break JSON.parse without this step.
 */
function parseJsonReply(text: string): { reply?: string } | null {
  let s = text.trim();
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start !== -1 && end > start) s = s.slice(start, end + 1);
  // State-machine: escape bare control chars inside JSON string values.
  let inString = false;
  let wasEscaped = false;
  let out = "";
  for (const ch of s) {
    if (wasEscaped) { out += ch; wasEscaped = false; }
    else if (ch === "\\") { out += ch; wasEscaped = true; }
    else if (ch === '"') { out += ch; inString = !inString; }
    else if (inString && ch === "\n") { out += "\\n"; }
    else if (inString && ch === "\r") { out += "\\r"; }
    else if (inString && ch === "\t") { out += "\\t"; }
    else { out += ch; }
  }
  try { return JSON.parse(out.trim()) as { reply?: string }; }
  catch { return null; }
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
  // Use the FALLBACK directly: DB rows go through stripHtml which destroys
  // the "<html string>" placeholder in the OUTPUT SCHEMA, breaking JSON output.
  const template = FALLBACK_IDEA_CHATBOT;
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

  // 6. Call the LLM. Use text format to avoid OpenAI's json_object "must contain
  //    the word json" constraint — the model is instructed in the prompt to return
  //    a JSON object, and sanitizeJsonText extracts it from the text response.
  const rawRes = await generateAiTextResponse({
    service: aiConfig.service,
    apiKey: aiConfig.apiKey,
    model: aiConfig.model,
    prompt,
  });
  if (rawRes.returned_an_error || !rawRes.text) {
    return { userMsg, error: rawRes.error ?? "AI returned no data" };
  }
  const replyData = parseJsonReply(rawRes.text);
  if (!replyData) return { userMsg, error: "AI returned invalid JSON" };

  const replyHtml = sanitizeChatbotHtml(String(replyData.reply ?? "").trim());
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

// ── Devil's Advocate Chatbot ──────────────────────────────────────────────────

const FALLBACK_DEVIL_ADVOCATE_CHATBOT = `You are a Devil's Advocate co-pilot embedded in Move37's Sandbox Planner — a muse, not an oracle. A muse provokes, challenges, and expands thinking; it does not validate. Agreement must be EARNED TWICE: once for the problem, once for the solution. Your goal is better decisions, not faster ones.

## STANDING RULES (apply at EVERY turn, both gates — non-negotiable)
1. ANTI-SYCOPHANCY: Never open with praise ("Great idea!", "That makes sense!"). Open with the sharpest relevant question or the single strongest counter-argument. If you genuinely agree, state the best case AGAINST first — then explain why it fails.
2. ONE QUESTION AT A TIME: Ask a single focused question, wait for the answer, reflect it back, then move on. Dialogue, not a questionnaire.
3. CONFIDENCE LABELS: Tag every substantive claim [Fact], [Inference], or [Speculation]. No fake certainty.
4. BRAIN FIRST: Before offering your own analysis on anything significant, ask for the user's current take and what they are uncertain about. Their expertise is the multiplier; your job is to fill gaps and attack weak points — not rewrite what they already know.
5. PUSH BACK ON VAGUENESS: If an answer is vague, generic, or sounds like a symptom, name it and ask again. Reflect back what was said and ask if it captures the real bottleneck or just the surface.
6. CONCEDE WHEN BEATEN: Devil's advocacy is NOT contrarianism. When the user's answer genuinely defeats a challenge, say so explicitly and move forward. Manufactured objections destroy trust and waste rounds.
7. EVIDENCE STANDARD (this is the gate that matters): the discovery content in [IDEA CONTEXT] was produced with AI assistance — treat it as UNVERIFIED FOUNDER ASSERTION, not external evidence. "The AI wrote it" is not proof. Demand external signal: named real customers, named real competitors, cited market data, a run experiment with results. A claim resting only on internal/AI assertion has not cleared a gate.
8. OUTPUT HTML ONLY. Use only these tags: p, ul, li, strong, em, code. No Markdown, no script/style/button/anchor tags.
9. GROUNDING: Use ONLY the [IDEA CONTEXT] block. Never invent facts, metrics, competitors, features, or personas that are not present there.

## THE TWO GATES
Always announce which gate you are in. Never skip a gate. Never run them out of order.

**[GATE 1 — THE RIGHT PROBLEM]**  Treat the stated problem as a HYPOTHESIS, not a fact — the person who defined a problem is rarely the person living it.
- Name it: have the user state the problem as they currently see it; write it back verbatim.
- Challenge the frame, one question at a time: Who defined this, and whose perspective is missing? What is the FUNCTIONAL need (what a solution must DO), the EXPERIENTIAL need (how it must FEEL), and the SOCIAL need (what it must MEAN to the people involved)?
- Symptom vs. bottleneck: apply "five whys" pressure — is this the root cause or the visible symptom? (A budget crisis is rarely a budget crisis.)
- Restate: co-write ONE new problem statement beginning "How do we…" — one sentence, no jargon, root cause not symptom.
- Gate question: "Is this the problem you were handed, or the real one underneath it? Do we agree this is the bottleneck?"
- Exit ONLY when a one-sentence bottleneck statement names a root cause AND you genuinely agree (not a rubber-stamp). When passed, declare: "Problem Gate passed. Agreed bottleneck: [statement]." Everything in Gate 2 is judged against this sentence ONLY.

**[GATE 2 — THE RIGHT SOLUTION]**  Solutions are judged against the agreed bottleneck. Nothing else. Do not solve the symptom; do not drift to adjacent problems.
- User's take first (brain first): ask for their best instinct before you generate anything. If they have none, generate options constrained to the bottleneck with one constraint that forces originality over textbook answers.
- Swap test: could this exact answer apply to any other company or situation? If yes, it is generic — reject it and redirect with a SPECIFIC reason, never "make it better".
- Strongest counter-argument: for the leading candidate, present the single best case against it — the assumption most likely wrong, the failure mode, the perspective not in the room. The user must answer it on its merits.
- Iterate with the ratchet: fix ONE named flaw per round. Each round locks in a gain.
- Gate question: "Does this solve the bottleneck we agreed on — not the symptom? Has the strongest objection been answered? Could anyone else have shipped this same answer?"
- Exit ONLY when the solution addresses the agreed bottleneck, passes the swap test, and the strongest counter-argument has been answered. When passed, declare: "Solution Gate passed." Then summarize: the bottleneck, the solution, why it survived challenge, residual risks [Speculation] if any, and the highest-leverage next actions with a time horizon.

## CALIBRATION
- Stakes scale rigor: a major decision deserves multiple rounds per gate; something light compresses to its single sharpest question — but never to zero.
- Don't loop forever: if a gate has not closed after ~5–10 rounds, NAME THE IMPASSE — state precisely where the disagreement lies and what evidence would resolve it. A stalemate stated clearly beats false agreement.
- Tone: direct, short sentences, no hedging filler. Challenge the idea, never the person.

## USING THE GO/NO-GO REPORT (when present)
This idea may already have a Devil's Advocate Go/No-Go Report (see [IDEA CONTEXT]). When it exists, USE it: the "Agreed Problem / Agreed Solution" are the debate's prior conclusions — start from them rather than re-litigating settled ground, but reopen any that rest only on assertion. The report's weakest scored areas (especially Market Realism, Regulatory Viability, Validation Rigor) and its penalties point to exactly where the thinking is thinnest — aim your challenges there first.

## [IDEA CONTEXT]
Idea: {{idea_name}} — {{idea_description}}
Idea Success Metrics: {{idea_success_metrics}}
Structure & Align: core_problem={{core_problem}}; target_audience={{target_audience}}; success_metrics={{structure_success_metrics}}; product_overview={{structure_product_overview}}; essential_features={{structure_essential_features}}
ICPs:
{{icps_block}}
Optimization Suggestions:
{{suggestions_block}}
Product Definition: summary={{product_summary}}; business_model={{product_business_model}}; features={{product_features}}; go_to_market={{product_go_to_market}}
Benchmarking: overview={{benchmark_overview}}; comparison={{benchmark_comparison}}; business_models={{benchmark_business_models}}; takeaways={{benchmark_takeaways}}
Location & Legislation:
{{location_block}}
Market Opportunity:
{{market_block}}
Risk & Validation:
{{risk_block}}
PRD: app_overview={{prd_app_overview}}; objectives={{prd_objectives}}; essential_features={{prd_essential_features}}
Go/No-Go Report: verdict={{report_threshold}}; final_score={{report_final_score}}; completeness={{report_completeness}}; headline={{report_headline}}
Report Alignment: {{report_alignment}}
Report Area Scores:
{{report_areas_block}}
Report Penalties:
{{report_penalties_block}}
Agreed Problem (from prior debate): {{report_agreed_problem}}
Agreed Solution (from prior debate): {{report_agreed_solution}}
Report Recommendation: {{report_recommendation}}
Current tab: {{current_tab}}

## [CHAT HISTORY]
{{chat_history}}

## [USER MESSAGE]
{{user_message}}

## OUTPUT SCHEMA
Your entire response must be a single valid json object of this exact shape: { "reply": "<html string>" }. The reply value must be valid HTML (only the tags p, ul, li, strong, em, code) and must not contain script tags or javascript: URLs.`;

/** Load all devil's advocate chatbot messages for an idea, oldest first. */
export async function loadDevilAdvocateChatHistory(
  ideaId: string,
): Promise<{ messages?: IdeaChatbotMessage[]; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("idea_chatbot_devil_advocate" as never)
    .select("id, idea_id, created_by, type, message, created_at, updated_at")
    .eq("idea_id", ideaId)
    .order("created_at", { ascending: true });
  if (error) return { error: error.message };
  return { messages: (data ?? []) as unknown as IdeaChatbotMessage[] };
}

/**
 * Append a user message to the devil's advocate chat, call the LLM with the
 * devil's advocate prompt, persist the reply, and return both rows.
 */
export async function sendDevilAdvocateChatMessage(
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
    .from("idea_chatbot_devil_advocate" as never)
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

  // 3. Load recent chat history (excludes the message just inserted so it
  //    doesn't appear twice — the prompt surfaces it as USER MESSAGE).
  const { data: historyData } = await supabase
    .from("idea_chatbot_devil_advocate" as never)
    .select("id, idea_id, created_by, type, message, created_at, updated_at")
    .eq("idea_id", ideaId)
    .order("created_at", { ascending: true })
    .limit(100);
  const history = (historyData ?? []) as unknown as IdeaChatbotMessage[];
  const historyExcludingCurrent = history.filter((m) => m.id !== userMsg.id);

  // 4. Resolve template + vars. Same reason as sendChatMessage: DB row goes
  // through stripHtml which destroys the OUTPUT SCHEMA placeholder.
  const template = FALLBACK_DEVIL_ADVOCATE_CHATBOT;
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

  // 6. Call the LLM. Use text format (same reason as sendChatMessage — avoids
  //    OpenAI json_object "must contain json" constraint at the API level).
  const rawRes = await generateAiTextResponse({
    service: aiConfig.service,
    apiKey: aiConfig.apiKey,
    model: aiConfig.model,
    prompt,
  });
  if (rawRes.returned_an_error || !rawRes.text) {
    return { userMsg, error: rawRes.error ?? "AI returned no data" };
  }
  const replyData = parseJsonReply(rawRes.text);
  if (!replyData) return { userMsg, error: "AI returned invalid JSON" };

  const replyHtml = sanitizeChatbotHtml(String(replyData.reply ?? "").trim());
  if (!replyHtml) {
    return { userMsg, error: "AI returned an empty reply" };
  }

  // 7. Persist the chatbot reply.
  const { data: botRow, error: botErr } = await supabase
    .from("idea_chatbot_devil_advocate" as never)
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


// ── Build Brief Generation ────────────────────────────────────────────────────

interface BriefOutput {
  brief_title: string;
  brief_subtitle: string;
  brief_html: string;
}

/** Generate an investor-grade Build Brief from all prior step data. */
export async function generateIdeaBrief(ideaId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const aiConfig = await resolveAiConfig(supabase, user.id);
  if (!aiConfig) return { error: "No AI service configured. Please set up your API key in Settings." };

  const [
    { data: ideaRow },
    { data: saRow },
    { data: icpRows },
    { data: sugRows },
    { data: pdRow },
    { data: benchRow },
    { data: reportRow },
  ] = await Promise.all([
    supabase.from("idea" as never).select("name, description, success_metrics").eq("id", ideaId).maybeSingle(),
    supabase.from("idea_structure_and_align" as never).select("core_problem, target_audience, success_metrics").eq("idea_id", ideaId).maybeSingle(),
    supabase.from("idea_icp" as never).select("*").eq("idea_id", ideaId),
    supabase.from("idea_optimization_suggestion" as never).select("name, description").eq("idea_id", ideaId),
    supabase.from("idea_product_definition_and_flows" as never).select("summary, business_model, features, go_to_market").eq("idea_id", ideaId).maybeSingle(),
    supabase.from("idea_benchmarking" as never).select("overview, comparison, possible_business_models, takeaways").eq("idea_id", ideaId).maybeSingle(),
    supabase.from("idea_report" as never).select("id, final_score, threshold_bucket, headline, summary, agreed_problem, agreed_solution, recommendation, alignment").eq("idea_id", ideaId).maybeSingle(),
  ]);

  const idea = ideaRow as { name: string; description: string | null; success_metrics: string | null } | null;
  if (!idea) return { error: "Idea not found" };

  const sa = saRow as { core_problem: string | null; target_audience: string | null; success_metrics: string | null } | null;
  const icps = (icpRows ?? []) as Array<Record<string, unknown>>;
  const suggestions = (sugRows ?? []) as Array<Record<string, unknown>>;
  const pd = pdRow as { summary: string | null; business_model: string | null; features: string | null; go_to_market: string | null } | null;
  const bench = benchRow as { overview: string | null; comparison: string | null; possible_business_models: string | null; takeaways: string | null } | null;
  const report = reportRow as {
    id: string;
    final_score: number | null;
    threshold_bucket: string | null;
    headline: string | null;
    summary: string | null;
    agreed_problem: string | null;
    agreed_solution: string | null;
    recommendation: string | null;
    alignment: { alignment_score: number } | null;
  } | null;

  if (!report) return { error: "Generate the Go/No-Go Report first before creating a Build Brief." };

  const strategicBlock = icps.length
    ? icps.map((icp, i) => {
        const g = (k: string) => stripHtml((icp[k] as string | null) ?? "");
        return `ICP ${i + 1}: ${g("name") || "(unnamed)"}
  Score: ${icp["score"] ?? "n/a"}
  Value Map - Solutions: ${g("value_proposition_value_map_solutions")}
  Value Map - Gain Creators: ${g("value_proposition_value_map_gain_creators")}
  NABC - Need: ${g("pitch_need")}
  NABC - Approach: ${g("pitch_approach")}
  NABC - Benefit: ${g("pitch_benefit")}
  NABC - Competition: ${g("pitch_competition")}`;
      }).join("\n\n")
    : "(none)";

  const template = (await getPromptTemplate("brief")) ?? FALLBACK_BUILD_BRIEF;
  const prompt = renderPrompt(template, {
    idea_name: idea.name,
    idea_description: stripHtml(idea.description) || "No description provided.",
    success_metrics: stripHtml(idea.success_metrics) || "Not defined",
    core_problem: stripHtml(sa?.core_problem) || "Not defined",
    target_audience: stripHtml(sa?.target_audience) || "Not defined",
    structure_metrics: stripHtml(sa?.success_metrics) || "Not defined",
    icps_block: buildIcpsBlock(icps),
    suggestions_block: buildSuggestionsBlock(suggestions),
    product_overview: stripHtml(pd?.summary) || "Not defined",
    business_model: stripHtml(pd?.business_model) || "Not defined",
    features: stripHtml(pd?.features) || "Not defined",
    go_to_market: stripHtml(pd?.go_to_market) || "Not defined",
    benchmarking_overview: stripHtml(bench?.overview) || "Not defined",
    benchmarking_comparison: stripHtml(bench?.comparison) || "Not defined",
    benchmarking_models: stripHtml(bench?.possible_business_models) || "Not defined",
    benchmarking_takeaways: stripHtml(bench?.takeaways) || "Not defined",
    strategic_block: strategicBlock,
    final_score: String(report.final_score ?? "n/a"),
    threshold_bucket: report.threshold_bucket ?? "n/a",
    report_headline: report.headline ?? "Not defined",
    report_summary: stripHtml(report.summary) || "Not defined",
    agreed_problem: report.agreed_problem ?? "Not defined",
    agreed_solution: report.agreed_solution ?? "Not defined",
    recommendation: report.recommendation ?? "Not defined",
    alignment_score: String(report.alignment?.alignment_score ?? "n/a"),
  });

  const res = await generateAiJsonResponse<BriefOutput>({
    service: aiConfig.service,
    apiKey: aiConfig.apiKey,
    model: aiConfig.model,
    prompt,
    maxTokens: 16384,
  });

  if (res.returned_an_error || !res.data) {
    return { error: res.error ?? "AI returned no data" };
  }

  const d = res.data;

  await supabase
    .from("idea_report" as never)
    .update({
      brief_title: d.brief_title,
      brief_subtitle: d.brief_subtitle,
      brief_html: d.brief_html,
      brief_generated_at: new Date().toISOString(),
    } as never)
    .eq("id", report.id);

  revalidatePath(PATH);
  return {};
}

/** Compile a Build Brief directly from existing step data — no AI call required. */
export async function assembleIdeaBrief(ideaId: string): Promise<{ briefHtml?: string; briefTitle?: string; briefSubtitle?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const [
    { data: ideaRow },
    { data: saRow },
    { data: icpRows },
    { data: pdRow },
    { data: locRow },
    { data: moRow },
    { data: rvRow },
    { data: reportRow },
  ] = await Promise.all([
    supabase.from("idea" as never).select("name, description").eq("id", ideaId).maybeSingle(),
    supabase.from("idea_structure_and_align" as never).select("core_problem, target_audience, success_metrics").eq("idea_id", ideaId).maybeSingle(),
    supabase.from("idea_icp" as never).select("name, firmographics, day_in_life, pain_points").eq("idea_id", ideaId),
    supabase.from("idea_product_definition_and_flows" as never).select("summary, business_model, features, go_to_market").eq("idea_id", ideaId).maybeSingle(),
    supabase.from("idea_location_legislation" as never).select("regulatory_bodies, key_legislation, licensing_requirements, data_privacy_rules, compliance_timeline, regulatory_moat, red_flags").eq("idea_id", ideaId).maybeSingle(),
    supabase.from("idea_market_opportunity" as never).select("tam_estimate, sam_estimate, som_estimate, price_point, billing_model, cac_estimate, ltv_estimate").eq("idea_id", ideaId).maybeSingle(),
    supabase.from("idea_risk_and_validation" as never).select("risk_register, validation_test, why_we_win").eq("idea_id", ideaId).maybeSingle(),
    supabase.from("idea_report" as never).select("id, final_score, threshold_bucket, headline, summary, agreed_problem, agreed_solution, recommendation").eq("idea_id", ideaId).maybeSingle(),
  ]);

  const idea = ideaRow as { name: string; description: string | null } | null;
  if (!idea) return { error: "Idea not found." };

  const sa = saRow as { core_problem: string | null; target_audience: string | null; success_metrics: string | null } | null;
  const icps = (icpRows ?? []) as Array<{ name: string | null; firmographics: string | null; day_in_life: string | null; pain_points: string | null }>;
  const pd = pdRow as { summary: string | null; business_model: string | null; features: string | null; go_to_market: string | null } | null;
  const loc = locRow as { regulatory_bodies: string | null; key_legislation: string | null; licensing_requirements: string | null; data_privacy_rules: string | null; compliance_timeline: string | null; regulatory_moat: string | null; red_flags: string | null } | null;
  const mo = moRow as { tam_estimate: string | null; sam_estimate: string | null; som_estimate: string | null; price_point: string | null; billing_model: string | null; cac_estimate: string | null; ltv_estimate: string | null } | null;
  const rv = rvRow as { risk_register: unknown; validation_test: unknown; why_we_win: unknown } | null;
  const rpt = reportRow as { id: string; final_score: number | null; threshold_bucket: string | null; headline: string | null; summary: string | null; agreed_problem: string | null; agreed_solution: string | null; recommendation: string | null } | null;

  if (!rpt) return { error: "Generate the Go/No-Go Report first before assembling a Build Brief." };

  // ── HTML helpers ──────────────────────────────────────────────────────────
  const td = (label: string, val: string | null | undefined) =>
    `<tr><td style="font-weight:600;padding:8px 12px;width:180px;vertical-align:top;white-space:nowrap;border-bottom:1px solid #e5e7eb;">${label}</td><td style="padding:8px 12px;vertical-align:top;border-bottom:1px solid #e5e7eb;">${stripHtml(val ?? "").trim() || "—"}</td></tr>`;
  const tbl = (rows: string) =>
    `<table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:12px;">${rows}</table>`;
  const sec = (title: string, body: string) =>
    `<h2 style="font-size:18px;font-weight:700;margin:32px 0 12px;border-bottom:1px solid #e5e7eb;padding-bottom:8px;">${title}</h2>${body}`;
  const rich = (html: string | null | undefined, fallback = "Not yet specified.") =>
    (html ?? "").trim() ? `<div style="font-size:14px;">${html}</div>` : `<p style="color:#9ca3af;font-style:italic;font-size:14px;">${fallback}</p>`;
  const txt = (t: string | null | undefined, fallback = "Not yet specified.") =>
    `<p style="font-size:14px;margin:0 0 8px;">${stripHtml(t ?? "").trim() || fallback}</p>`;

  // Section 1: One-Liner & Thesis
  const s1 = sec("1. One-Liner &amp; Thesis",
    tbl(
      td("Product", idea.name) +
      td("Core Problem", rpt.agreed_problem) +
      td("Our Solution", rpt.agreed_solution) +
      td("Recommendation", rpt.recommendation) +
      (sa?.target_audience ? td("Target Audience", sa.target_audience) : "")
    )
  );

  // Section 2: What We Build
  const s2 = sec("2. What We Build",
    (pd?.summary ? `<p style="font-weight:600;margin:0 0 6px;">Product Overview</p>${rich(pd.summary)}` : txt(null, "Product Definition not yet completed.")) +
    (pd?.features ? `<p style="font-weight:600;margin:12px 0 6px;">Key Features</p>${rich(pd.features)}` : "")
  );

  // Section 3: Customer & List/Reach
  const icpHtml = icps.length
    ? icps.map((icp, i) =>
        `<div style="margin-bottom:16px;padding:12px;border:1px solid #e5e7eb;border-radius:6px;">` +
        `<p style="font-weight:700;margin:0 0 8px;font-size:14px;">ICP ${i + 1}: ${stripHtml(icp.name ?? "") || "(unnamed)"}</p>` +
        (icp.firmographics ? `<p style="margin:0 0 4px;font-size:13px;font-weight:600;">Firmographics</p>${rich(icp.firmographics)}` : "") +
        (icp.pain_points ? `<p style="margin:8px 0 4px;font-size:13px;font-weight:600;">Pain Points</p>${rich(icp.pain_points)}` : "") +
        `</div>`
      ).join("")
    : txt(null, "ICP profiles not yet completed.");
  const s3 = sec("3. Customer &amp; List/Reach", icpHtml);

  // Section 4: Offer & Pricing + Unit Economics
  const moSizingTable = mo
    ? tbl(td("TAM", mo.tam_estimate) + td("SAM", mo.sam_estimate) + td("SOM", mo.som_estimate))
    : txt(null, "Market Opportunity not yet completed.");
  const moPricingTable = mo && (mo.price_point || mo.billing_model || mo.cac_estimate || mo.ltv_estimate)
    ? tbl(
        td("Price Point", mo.price_point) +
        td("Billing Model", mo.billing_model) +
        td("CAC Estimate", mo.cac_estimate) +
        td("LTV Estimate", mo.ltv_estimate)
      )
    : txt(null, "Pricing & unit economics not yet specified.");
  const s4 = sec("4. Offer &amp; Pricing + Unit Economics",
    `<p style="font-weight:600;margin:0 0 6px;">Business Model</p>` +
    rich(pd?.business_model, "Business model not yet defined.") +
    `<p style="font-weight:600;margin:12px 0 6px;">Pricing &amp; Unit Economics</p>` + moPricingTable +
    `<p style="font-weight:600;margin:12px 0 6px;">Market Sizing</p>` + moSizingTable
  );

  // Section 5: Go-to-Market
  const s5 = sec("5. Go-to-Market", rich(pd?.go_to_market, "GTM strategy not yet defined."));

  // Section 6: Regulatory/Legal/Compliance
  const regHtml = loc
    ? tbl(
        td("Regulatory Bodies", loc.regulatory_bodies) +
        td("Key Legislation", loc.key_legislation) +
        td("Licensing", loc.licensing_requirements) +
        td("Data Privacy", loc.data_privacy_rules) +
        td("Timeline", loc.compliance_timeline) +
        td("Regulatory Moat", loc.regulatory_moat) +
        td("Red Flags", loc.red_flags)
      )
    : txt(null, "Location &amp; Legislation analysis not yet completed.");
  const s6 = sec("6. Regulatory/Legal/Compliance", regHtml);

  // Section 7: The Validation Test
  let vtHtml = txt(null, "Risk &amp; Validation analysis not yet completed.");
  if (rv?.validation_test) {
    const vt = rv.validation_test as Record<string, unknown>;
    const steps = (vt.steps as Array<Record<string, string>> | undefined) ?? [];
    const stepsTable = steps.length
      ? `<table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:12px;">` +
        `<thead><tr style="border-bottom:1px solid #e5e7eb;">` +
        `<th style="text-align:left;padding:8px 12px;">Week</th>` +
        `<th style="text-align:left;padding:8px 12px;">Action</th>` +
        `<th style="text-align:left;padding:8px 12px;">Success Metric</th>` +
        `<th style="text-align:left;padding:8px 12px;">Kill Criterion</th></tr></thead><tbody>` +
        steps.map(step =>
          `<tr style="border-bottom:1px solid #f3f4f6;">` +
          `<td style="padding:8px 12px;vertical-align:top;">${step.week_range ?? ""}</td>` +
          `<td style="padding:8px 12px;vertical-align:top;">${step.action ?? ""}</td>` +
          `<td style="padding:8px 12px;vertical-align:top;">${step.success_metric ?? ""}</td>` +
          `<td style="padding:8px 12px;vertical-align:top;">${step.kill_criterion ?? ""}</td></tr>`
        ).join("") + `</tbody></table>`
      : "";
    vtHtml = tbl(
      td("Budget Max", String(vt.budget_max ?? "")) +
      td("Duration", vt.duration_weeks != null ? `${vt.duration_weeks} weeks` : null)
    ) + stepsTable +
    (vt.kill_criteria ? `<p style="font-size:14px;"><strong>Kill Criteria:</strong> ${String(vt.kill_criteria)}</p>` : "") +
    (vt.deliverable ? `<p style="font-size:14px;"><strong>Deliverable:</strong> ${String(vt.deliverable)}</p>` : "");
  }
  const s7 = sec("7. The Validation Test", vtHtml);

  // Section 8: Tools & Stack
  const s8 = sec("8. Tools &amp; Stack", txt(null, "Technical stack will be defined in the PRD step."));

  // Section 9: Risks & What Kills It
  let riskHtml = txt(null, "Risk &amp; Validation analysis not yet completed.");
  if (rv?.risk_register) {
    const risks = rv.risk_register as Array<Record<string, string>>;
    if (Array.isArray(risks) && risks.length) {
      riskHtml = `<table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:12px;">` +
        `<thead><tr style="border-bottom:1px solid #e5e7eb;">` +
        `<th style="text-align:left;padding:8px 12px;">Risk</th>` +
        `<th style="text-align:left;padding:8px 12px;">Severity</th>` +
        `<th style="text-align:left;padding:8px 12px;">Likelihood</th>` +
        `<th style="text-align:left;padding:8px 12px;">Mitigation</th></tr></thead><tbody>` +
        risks.map(r =>
          `<tr style="border-bottom:1px solid #f3f4f6;">` +
          `<td style="padding:8px 12px;vertical-align:top;font-weight:500;">${r.risk ?? ""}</td>` +
          `<td style="padding:8px 12px;vertical-align:top;">${r.severity ?? ""}</td>` +
          `<td style="padding:8px 12px;vertical-align:top;">${r.likelihood ?? ""}</td>` +
          `<td style="padding:8px 12px;vertical-align:top;">${r.mitigation ?? ""}</td></tr>`
        ).join("") + `</tbody></table>`;
    }
  }
  if (rv?.why_we_win) {
    const wins = rv.why_we_win as Array<Record<string, string>>;
    if (Array.isArray(wins) && wins.length) {
      riskHtml += `<p style="font-weight:600;font-size:14px;margin:12px 0 8px;">Why We Win</p>` +
        wins.map(w => `<p style="font-size:14px;margin:0 0 6px;"><strong>${w.advantage ?? ""}:</strong> ${w.why_hard_to_copy ?? ""}</p>`).join("");
    }
  }
  const s9 = sec("9. Risks &amp; What Kills It", riskHtml);

  // Section 10: Verdict
  const score = rpt.final_score ?? 0;
  const verdictColor = score >= 75 ? "#16a34a" : score >= 60 ? "#d97706" : "#dc2626";
  const bucketLabel = (rpt.threshold_bucket ?? "pending").toUpperCase();
  const s10 = sec("10. Verdict",
    `<p style="font-size:28px;font-weight:700;color:${verdictColor};margin:0 0 8px;">${rpt.final_score ?? "—"}/100 — ${bucketLabel}</p>` +
    (rpt.headline ? `<p style="font-weight:600;font-size:16px;margin:0 0 12px;">${rpt.headline}</p>` : "") +
    rich(rpt.summary, "Report summary not yet available.")
  );

  const briefHtml = [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10].join("\n");
  const briefTitle = `${idea.name} — Build Brief`;
  const briefSubtitle = stripHtml(rpt.recommendation ?? rpt.agreed_solution ?? "").trim().slice(0, 120) || "Assembled from Sandbox Planner discovery steps.";

  await supabase
    .from("idea_report" as never)
    .update({
      brief_title: briefTitle,
      brief_subtitle: briefSubtitle,
      brief_html: briefHtml,
      brief_generated_at: new Date().toISOString(),
    } as never)
    .eq("id", rpt.id);

  revalidatePath(PATH);
  return { briefHtml, briefTitle, briefSubtitle };
}

const FALLBACK_BUILD_BRIEF = `You are a Move37 build strategist writing an investor-grade Build Brief. Use ONLY the source data supplied. Label inferences: [Fact], [Inference], [Uncertain], [Speculation]. Empty fields are gaps -- state them explicitly.

SOURCE DATA:
Idea: {{idea_name}}
Description: {{idea_description}}
Success Metrics: {{success_metrics}}
Core Problem: {{core_problem}}
Target Audience: {{target_audience}}

ICPs:
{{icps_block}}

Optimization Suggestions:
{{suggestions_block}}

Product: {{product_overview}} | Business Model: {{business_model}} | Features: {{features}} | GTM: {{go_to_market}}
Benchmarking: {{benchmarking_overview}} | {{benchmarking_comparison}} | {{benchmarking_models}} | {{benchmarking_takeaways}}
Strategic Frameworks: {{strategic_block}}
Report: Score {{final_score}} | {{threshold_bucket}} | {{report_headline}} | Problem: {{agreed_problem}} | Solution: {{agreed_solution}} | Rec: {{recommendation}}

Return a JSON object with exactly these keys:
- "brief_title": Short punchy project title (4-8 words)
- "brief_subtitle": One-sentence core value proposition
- "brief_html": Full HTML body (no html/body wrapper) with 10 h2 sections: 1. One-Liner & Thesis, 2. What We Build, 3. Customer & List/Reach, 4. Offer & Pricing + Unit Economics, 5. Go-to-Market, 6. Regulatory/Legal/Compliance, 7. The Validation Test, 8. Tools & Stack, 9. Risks & What Kills It, 10. Verdict. Use tables where appropriate. No markdown.

Return ONLY valid JSON.`;

// ── Location & Legislation ───────────────────────────────────────────────────

/** Upsert location & legislation block for an idea. */
export async function saveLocationLegislation(
  ideaId: string,
  data: {
    regulatory_bodies?: string;
    key_legislation?: string;
    licensing_requirements?: string;
    data_privacy_rules?: string;
    compliance_timeline?: string;
    regulatory_moat?: string;
    red_flags?: string;
  }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("idea_location_legislation" as never)
    .select("id")
    .eq("idea_id", ideaId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("idea_location_legislation" as never)
      .update(data as never)
      .eq("id", (existing as { id: string }).id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("idea_location_legislation" as never)
      .insert({ idea_id: ideaId, ...data } as never);
    if (error) return { error: error.message };
  }

  revalidatePath(PATH);
  return {};
}

// ── Market Opportunity ───────────────────────────────────────────────────────

/** Upsert market opportunity block for an idea. */
export async function saveMarketOpportunity(
  ideaId: string,
  data: {
    tam_description?: string;
    tam_estimate?: string;
    sam_description?: string;
    sam_estimate?: string;
    som_description?: string;
    som_estimate?: string;
    data_sources?: string;
    segment_filter_logic?: string;
    growth_drivers?: string;
    market_risks?: string;
    price_point?: string;
    billing_model?: string;
    cac_estimate?: string;
    ltv_estimate?: string;
  }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("idea_market_opportunity" as never)
    .select("id")
    .eq("idea_id", ideaId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("idea_market_opportunity" as never)
      .update(data as never)
      .eq("id", (existing as { id: string }).id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("idea_market_opportunity" as never)
      .insert({ idea_id: ideaId, ...data } as never);
    if (error) return { error: error.message };
  }

  revalidatePath(PATH);
  return {};
}

// ── Fallback Prompts ─────────────────────────────────────────────────────────

const FALLBACK_LOCATION_LEGISLATION = `You are a regulatory research expert. Analyse the regulatory landscape for the following startup idea.

Idea: {{idea_name}}
Description: {{idea_description}}
Core Problem: {{core_problem}}
Target Audience: {{target_audience}}
Location: {{location}}
Jurisdiction: {{jurisdiction}}

If location is "Not specified", state that analysis requires a target location and explain what is needed.

Return a JSON object with exactly these keys (all values must be valid HTML strings):
- "regulatory_bodies": Key regulatory bodies/agencies that govern this type of business.
- "key_legislation": Primary laws, acts, or directives that apply.
- "licensing_requirements": Licenses, permits, certifications required to operate legally.
- "data_privacy_rules": Applicable data protection laws and obligations.
- "compliance_timeline": Sequenced compliance roadmap (HTML table: Stage | Action | Timeframe | Owner).
- "regulatory_moat": Regulatory advantages or moats the compliance creates.
- "red_flags": Critical compliance risks requiring specialist legal advice. Label severity.

Return ONLY valid JSON.`;

const FALLBACK_MARKET_OPPORTUNITY = `You are a market sizing expert. Produce a TAM/SAM/SOM analysis and unit-economics estimate for the following startup idea.

Idea: {{idea_name}}
Description: {{idea_description}}
Core Problem: {{core_problem}}
Target Audience: {{target_audience}}
Location: {{location}}
Jurisdiction: {{jurisdiction}}
ICP Firmographics: {{icps_block}}
Product Overview: {{product_overview}}
Business Model: {{business_model}}

COMPETITIVE BENCHMARKING (from the previous step — use this as primary evidence for pricing and sizing):
Overview: {{benchmarking_overview}}
Comparison of Similar Apps: {{benchmarking_comparison}}
Possible Business Models: {{benchmarking_models}}
Key Takeaways: {{benchmarking_takeaways}}

Label all estimates: [Fact], [Inference], or [Uncertain]. Do not fabricate figures. When the benchmarking data names competitors and their pricing, anchor your price_point, billing_model, cac_estimate, and ltv_estimate to those real comparables and explicitly reference them.

Return a JSON object with exactly these keys (all values must be valid HTML strings):
- "tam_description": Total Addressable Market definition.
- "tam_estimate": TAM estimate with named source/methodology.
- "sam_description": Serviceable Addressable Market definition.
- "sam_estimate": SAM estimate with source and rationale.
- "som_description": Serviceable Obtainable Market definition.
- "som_estimate": SOM estimate with specific assumptions.
- "data_sources": Bulleted list of all sources referenced.
- "segment_filter_logic": TAM to SAM to SOM filter logic (HTML table: Layer | Filter | Reduction Factor | Size).
- "growth_drivers": 3-5 macro forces expanding this market.
- "market_risks": 3-5 macro forces that could suppress this market.
- "price_point": Proposed price point(s) — e.g. "£29/mo starter, £99/mo pro". Anchor to competitor pricing from the benchmarking comparison where available. Label [Fact], [Inference], or [Uncertain].
- "billing_model": How the product is monetised — e.g. "SaaS subscription", "transaction fee", "freemium + upsell". Reference the benchmarking "Possible Business Models" where relevant. Include any revenue share or commission model if applicable.
- "cac_estimate": Customer Acquisition Cost estimate with methodology — e.g. "£120 blended CAC assuming paid social + content (£80 per channel)". Label assumptions.
- "ltv_estimate": Customer Lifetime Value estimate — e.g. "£1,080 at 30-month avg retention on £36/mo ARPU". Show the LTV:CAC ratio.

Return ONLY valid JSON.`;

const FALLBACK_RISK_AND_VALIDATION = `You are a risk management, startup validation, and demand-validation expert. The Devil's Advocate debate has just been run on this idea and produced an agreed problem and solution framing. Use these outputs to produce a risk register, validation experiment, competitive advantage analysis, AND a demand evidence assessment.

Agreed Problem (from Devil's Advocate debate): {{agreed_problem}}
Agreed Solution (from Devil's Advocate debate): {{agreed_solution}}
Location: {{location}}
Jurisdiction: {{jurisdiction}}
Product Overview: {{product_overview}}
Benchmarking Takeaways: {{benchmarking_takeaways}}

IMPORTANT: The agreed problem and solution above come from a rigorous Devil's Advocate debate. Ground ALL of your output in these agreed framings, not in the original idea description. The debate_insights field should reflect what the debate revealed about demand (skeptic challenges, advocate defences, agreed conclusions).

Return a JSON object with exactly these keys:

"risk_register": Array of at least 6 risk objects, each with: { "risk": string, "severity": "Critical"|"High"|"Medium"|"Low", "likelihood": "Very Likely"|"Likely"|"Possible"|"Unlikely", "mitigation": string, "owner": string }

"validation_test": Object with: { "budget_max": string, "duration_weeks": number, "steps": [{ "week_range": string, "action": string, "success_metric": string, "kill_criterion": string }], "kill_criteria": string, "deliverable": string }

"why_we_win": Array of competitive advantage objects, each with: { "advantage": string, "why_hard_to_copy": string }

"demand_evidence": Object using the demand-validation playbook below. HONESTY IS MANDATORY.

## Demand Validation Playbook (name these methods in your output)
- The Mom Test: evidence from past behaviour and life, never compliments or hypotheticals
- Riskiest-assumption-first: validate the belief that kills the idea if false
- Evidence strength ladder: say < do < pay (stated interest weakest; behavioral stronger; money down strongest)
- Smoke / fake-door test: landing page + CTA to measure real click-through intent
- Pre-sales / Letters of Intent / deposits: strongest pre-build demand proof
- Concierge & Wizard-of-Oz MVP: manual delivery to test demand before building
- Sean Ellis PMF survey: "how disappointed if you could no longer use this?" target >= 40% very disappointed
- Van Westendorp / willingness-to-pay: price-sensitivity, not a guessed number
- Pre-registered decision contract: success thresholds AND kill criteria written BEFORE the test

## Honesty Rules (MANDATORY)
1. A plan to validate is NOT validation. With no run experiment, verdict.grade MUST be "unproven" and confidence "low".
2. A debate is adversarial scrutiny, NOT market demand. Surviving the skeptic raises reasoning confidence, never proves demand.
3. Only behavioral/financial signal can push verdict.grade to "emerging" or "proven".
4. State the honest grade even if the debate was favorable.

## demand_evidence object structure:
{
  "hypothesis": "Falsifiable demand statement: <segment> will <behaviour/pay $X> to solve <problem>.",
  "riskiest_assumptions": [{ "assumption": string, "evidence_today": string, "evidence_needed": string, "strength": "stated"|"behavioral"|"financial", "status": "unproven"|"emerging"|"proven" }],
  "experiments": [{ "method": string, "why_this_method": string, "sample_or_budget": string, "success_threshold": string, "kill_criterion": string, "sequence_order": number }],
  "signals_to_watch": [{ "signal": string, "type": "stated"|"behavioral"|"financial", "is_anti_signal": boolean }],
  "debate_insights": [{ "insight": string, "source": "skeptic challenge"|"advocate could-not-defend"|"reframer flag"|"agreed conclusion", "implication_for_demand": string }],
  "verdict": { "grade": "unproven"|"emerging"|"proven", "confidence": "low"|"medium"|"high", "rationale": string, "highest_leverage_next_test": string }
}

Return ONLY valid JSON.`;

// ── Location & Legislation Generation ────────────────────────────────────────

interface LocationLegislationOutput {
  regulatory_bodies: string;
  key_legislation: string;
  licensing_requirements: string;
  data_privacy_rules: string;
  compliance_timeline: string;
  regulatory_moat: string;
  red_flags: string;
}

async function generateLocationLegislation(
  supabase: SupabaseClient,
  idea: { name: string; description: string | null; location?: string | null; jurisdiction?: string | null },
  structureAlign: { core_problem: string | null; target_audience: string | null } | null,
  ideaId: string,
  aiConfig: AiConfig,
  requestId: string
): Promise<{ error?: string }> {
  const template = (await getPromptTemplate("location_legislation")) ?? FALLBACK_LOCATION_LEGISLATION;
  const prompt = renderPrompt(template, {
    idea_name: idea.name,
    idea_description: stripHtml(idea.description),
    core_problem: stripHtml(structureAlign?.core_problem) || "Not defined yet",
    target_audience: stripHtml(structureAlign?.target_audience) || "Not defined yet",
    location: idea.location || "Not specified",
    jurisdiction: idea.jurisdiction || "Not specified",
  });

  const res = await generateAiJsonResponse<LocationLegislationOutput>({
    service: aiConfig.service,
    apiKey: aiConfig.apiKey,
    model: aiConfig.model,
    prompt,
    maxTokens: 8192,
  });

  if (res.returned_an_error || !res.data) {
    return { error: res.error ?? "AI returned no data" };
  }

  if (!(await isRequestActive(supabase, ideaId, requestId))) return {};

  const d = res.data;
  const { data: existing } = await supabase
    .from("idea_location_legislation" as never)
    .select("id")
    .eq("idea_id", ideaId)
    .maybeSingle();

  const payload = {
    regulatory_bodies: d.regulatory_bodies ?? null,
    key_legislation: d.key_legislation ?? null,
    licensing_requirements: d.licensing_requirements ?? null,
    data_privacy_rules: d.data_privacy_rules ?? null,
    compliance_timeline: d.compliance_timeline ?? null,
    regulatory_moat: d.regulatory_moat ?? null,
    red_flags: d.red_flags ?? null,
  };

  if (existing) {
    const { error: updateError } = await supabase
      .from("idea_location_legislation" as never)
      .update(payload as never)
      .eq("id", (existing as { id: string }).id);
    if (updateError) return { error: updateError.message };
  } else {
    const { error: insertError } = await supabase
      .from("idea_location_legislation" as never)
      .insert({ idea_id: ideaId, ...payload } as never);
    if (insertError) return { error: insertError.message };
  }

  return {};
}

// ── Market Opportunity Generation ─────────────────────────────────────────────

interface MarketOpportunityOutput {
  tam_description: string;
  tam_estimate: string;
  sam_description: string;
  sam_estimate: string;
  som_description: string;
  som_estimate: string;
  data_sources: string;
  segment_filter_logic: string;
  growth_drivers: string;
  market_risks: string;
  price_point: string;
  billing_model: string;
  cac_estimate: string;
  ltv_estimate: string;
}

async function generateMarketOpportunity(
  supabase: SupabaseClient,
  idea: { name: string; description: string | null; location?: string | null; jurisdiction?: string | null },
  structureAlign: { core_problem: string | null; target_audience: string | null } | null,
  icps: Array<Record<string, unknown>>,
  productDef: { summary: string | null; business_model: string | null } | null,
  benchmarking: {
    overview: string | null;
    comparison: string | null;
    possible_business_models: string | null;
    takeaways: string | null;
  } | null,
  ideaId: string,
  aiConfig: AiConfig,
  requestId: string
): Promise<{ error?: string }> {
  const template = (await getPromptTemplate("market_opportunity")) ?? FALLBACK_MARKET_OPPORTUNITY;
  const prompt = renderPrompt(template, {
    idea_name: idea.name,
    idea_description: stripHtml(idea.description),
    core_problem: stripHtml(structureAlign?.core_problem) || "Not defined yet",
    target_audience: stripHtml(structureAlign?.target_audience) || "Not defined yet",
    location: idea.location || "Not specified",
    jurisdiction: idea.jurisdiction || "Not specified",
    icps_block: buildIcpsBlock(icps),
    product_overview: stripHtml(productDef?.summary) || "Not defined yet",
    business_model: stripHtml(productDef?.business_model) || "Not defined yet",
    benchmarking_overview: stripHtml(benchmarking?.overview) || "Not defined yet",
    benchmarking_comparison: stripHtml(benchmarking?.comparison) || "Not defined yet",
    benchmarking_models: stripHtml(benchmarking?.possible_business_models) || "Not defined yet",
    benchmarking_takeaways: stripHtml(benchmarking?.takeaways) || "Not defined yet",
  });

  const res = await generateAiJsonResponse<MarketOpportunityOutput>({
    service: aiConfig.service,
    apiKey: aiConfig.apiKey,
    model: aiConfig.model,
    prompt,
    maxTokens: 8192,
  });

  if (res.returned_an_error || !res.data) {
    return { error: res.error ?? "AI returned no data" };
  }

  if (!(await isRequestActive(supabase, ideaId, requestId))) return {};

  const d = res.data;
  const { data: existing } = await supabase
    .from("idea_market_opportunity" as never)
    .select("id")
    .eq("idea_id", ideaId)
    .maybeSingle();

  const payload = {
    tam_description: d.tam_description ?? null,
    tam_estimate: d.tam_estimate ?? null,
    sam_description: d.sam_description ?? null,
    sam_estimate: d.sam_estimate ?? null,
    som_description: d.som_description ?? null,
    som_estimate: d.som_estimate ?? null,
    data_sources: d.data_sources ?? null,
    segment_filter_logic: d.segment_filter_logic ?? null,
    growth_drivers: d.growth_drivers ?? null,
    market_risks: d.market_risks ?? null,
    price_point: d.price_point ?? null,
    billing_model: d.billing_model ?? null,
    cac_estimate: d.cac_estimate ?? null,
    ltv_estimate: d.ltv_estimate ?? null,
  };

  if (existing) {
    const { error: updateError } = await supabase
      .from("idea_market_opportunity" as never)
      .update(payload as never)
      .eq("id", (existing as { id: string }).id);
    if (updateError) return { error: updateError.message };
  } else {
    const { error: insertError } = await supabase
      .from("idea_market_opportunity" as never)
      .insert({ idea_id: ideaId, ...payload } as never);
    if (insertError) return { error: insertError.message };
  }

  return {};
}

// ── Risk & Validation Generation ──────────────────────────────────────────────

interface RiskAndValidationOutput {
  risk_register: Array<{
    risk: string;
    severity: string;
    likelihood: string;
    mitigation: string;
    owner: string;
  }>;
  validation_test: {
    budget_max: string;
    duration_weeks: number;
    steps: Array<{ week_range: string; action: string; success_metric: string; kill_criterion: string }>;
    kill_criteria: string;
    deliverable: string;
  };
  why_we_win: Array<{ advantage: string; why_hard_to_copy: string }>;
  demand_evidence: {
    hypothesis: string;
    riskiest_assumptions: Array<{
      assumption: string;
      evidence_today: string;
      evidence_needed: string;
      strength: string;
      status: string;
    }>;
    experiments: Array<{
      method: string;
      why_this_method: string;
      sample_or_budget: string;
      success_threshold: string;
      kill_criterion: string;
      sequence_order: number;
    }>;
    signals_to_watch: Array<{
      signal: string;
      type: string;
      is_anti_signal: boolean;
    }>;
    debate_insights: Array<{
      insight: string;
      source: string;
      implication_for_demand: string;
    }>;
    verdict: {
      grade: string;
      confidence: string;
      rationale: string;
      highest_leverage_next_test: string;
    };
  } | null;
}

async function generateRiskAndValidation(
  supabase: SupabaseClient,
  idea: { name: string; description: string | null; success_metrics: string | null; location?: string | null; jurisdiction?: string | null },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  structureAlign: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icps: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  suggestions: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  productDef: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  benchmarkingRow: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  locationRow: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  marketRow: any,
  ideaId: string,
  aiConfig: AiConfig,
  requestId: string
): Promise<{ error?: string }> {
  // ── Phase 1: Build the COMPACT [SOURCE] block for the debate ─────────────────
  // The debate re-sends this on every one of ~16 sequential calls, so it must
  // stay small (~1.5k tokens). The full rich ICP/product/benchmarking content
  // would balloon each prompt to ~8–10k tokens and time the function out on
  // Vercel. buildCompactDebateSource clips each field and caps ICPs to 3.
  // `suggestions` is intentionally omitted from the debate source — it doesn't
  // inform a problem/solution debate and only adds weight. (productDef is still
  // used below for the final synthesis prompt's product_overview field.)
  void suggestions;
  const sourceBlock = buildCompactDebateSource({
    idea,
    structureAlign: structureAlign as Record<string, unknown> | null,
    icps: icps as Array<Record<string, unknown>>,
    benchmarking: benchmarkingRow as Record<string, unknown> | null,
    market: marketRow as Record<string, unknown> | null,
    location: locationRow as Record<string, unknown> | null,
  });

  // ── Phase 2: Run 2-gate Devil's Advocate debate ───────────────────────────────
  const [skepticTemplate, advocateTemplate] = await Promise.all([
    getPromptTemplate("report_skeptic"),
    getPromptTemplate("report_advocate"),
  ]);
  const skepticPromptBase = skepticTemplate ?? FALLBACK_SKEPTIC;
  const advocatePromptBase = advocateTemplate ?? FALLBACK_ADVOCATE;

  const transcript: IdeaReportDebateTurn[] = [];

  function transcriptText(gate: "problem" | "solution"): string {
    const lines = transcript
      .filter((t) => t.gate === gate)
      .map(
        (t) =>
          `[Round ${t.round} — ${t.role.toUpperCase()}]\n${t.content}\nProposed: ${t.proposed_statement}\nAgrees: ${t.agree}`
      );
    return lines.length ? lines.join("\n\n") : "(none yet)";
  }

  async function runGate(
    gate: "problem" | "solution"
  ): Promise<{ converged: boolean; agreed_statement: string; rounds: number; error?: string }> {
    let skepticStatement = "";
    let advocateStatement = "";
    let converged = false;

    for (let round = 1; round <= MAX_ROUNDS_PER_GATE; round++) {
      const soFar = transcriptText(gate);

      const skepticPrompt = renderPrompt(skepticPromptBase, {
        source_block: sourceBlock,
        gate,
        round: String(round),
        transcript_so_far: soFar,
        other_proposed_statement: advocateStatement || "(none yet — first round)",
      });
      const skepticRes = await generateAiJsonResponse<DebateTurnOutput>({
        service: aiConfig.service,
        apiKey: aiConfig.apiKey,
        model: aiConfig.model,
        prompt: skepticPrompt,
        maxTokens: 2048,
      });
      if (skepticRes.returned_an_error || !skepticRes.data) {
        return { converged: false, agreed_statement: advocateStatement || skepticStatement, rounds: round, error: skepticRes.error };
      }
      const sk = skepticRes.data;
      skepticStatement = sk.proposed_statement || skepticStatement;
      transcript.push({
        gate,
        round,
        role: "skeptic",
        content: sk.content || "",
        proposed_statement: skepticStatement,
        agree: sk.agree,
      });

      const advocatePrompt = renderPrompt(advocatePromptBase, {
        source_block: sourceBlock,
        gate,
        round: String(round),
        transcript_so_far: transcriptText(gate),
        other_proposed_statement: skepticStatement,
      });
      const advocateRes = await generateAiJsonResponse<DebateTurnOutput>({
        service: aiConfig.service,
        apiKey: aiConfig.apiKey,
        model: aiConfig.model,
        prompt: advocatePrompt,
        maxTokens: 2048,
      });
      if (advocateRes.returned_an_error || !advocateRes.data) {
        return { converged: false, agreed_statement: skepticStatement, rounds: round, error: advocateRes.error };
      }
      const av = advocateRes.data;
      advocateStatement = av.proposed_statement || advocateStatement;
      transcript.push({
        gate,
        round,
        role: "advocate",
        content: av.content || "",
        proposed_statement: advocateStatement,
        agree: av.agree,
      });

      if (sk.agree === true && av.agree === true) {
        converged = true;
        return { converged, agreed_statement: advocateStatement || skepticStatement, rounds: round };
      }
    }

    return { converged: false, agreed_statement: advocateStatement || skepticStatement, rounds: MAX_ROUNDS_PER_GATE };
  }

  const gate1 = await runGate("problem");
  // Propagate hard AI errors (e.g. invalid key, rate limit) immediately so the
  // outer triggerAiGeneration catch path clears current_blocks_updating.
  if (gate1.error) return { error: gate1.error };
  const agreedProblem = gate1.agreed_statement;

  if (!(await isRequestActive(supabase, ideaId, requestId))) return {};

  const gate2 = await runGate("solution");
  if (gate2.error) return { error: gate2.error };
  const agreedSolution = gate2.agreed_statement;

  if (!(await isRequestActive(supabase, ideaId, requestId))) return {};

  const debateMeta = {
    problem_rounds: gate1.rounds,
    solution_rounds: gate2.rounds,
    problem_converged: gate1.converged,
    solution_converged: gate2.converged,
    impasse_note:
      !gate1.converged || !gate2.converged
        ? `Debate hit the round cap without full convergence. ${!gate1.converged ? `Problem gate: ${gate1.rounds} rounds, no agreement. ` : ""}${!gate2.converged ? `Solution gate: ${gate2.rounds} rounds, no agreement.` : ""}`
        : undefined,
  };

  // ── Phase 4: Generate risk/validation content using debate outcome ────────────
  // Build a compact debate-context string the demand-evidence prompt can mine:
  // skeptic challenges, advocate defences, and the agreed conclusion per gate.
  const debateContext = transcript.length
    ? transcript
        .map(
          (t) =>
            `[${t.gate.toUpperCase()} · Round ${t.round} · ${t.role === "skeptic" ? "Skeptic challenge" : "Advocate defence"}] ${t.content}`
        )
        .join("\n") +
      `\n\nAgreed Problem: ${agreedProblem || "Not converged"}\nAgreed Solution: ${agreedSolution || "Not converged"}`
    : "No debate was run.";

  const template = (await getPromptTemplate("risk_and_validation")) ?? FALLBACK_RISK_AND_VALIDATION;
  const prompt = renderPrompt(template, {
    agreed_problem: agreedProblem,
    agreed_solution: agreedSolution,
    // Report-step outputs are produced AFTER this step, so they are not yet known.
    recommendation: "Not yet scored — the Report step runs after Risk & Validation.",
    final_score: "n/a",
    threshold_bucket: "n/a",
    location: idea.location || "Not specified",
    jurisdiction: idea.jurisdiction || "Not specified",
    product_overview: stripHtml(productDef?.summary) || "Not defined yet",
    benchmarking_takeaways: stripHtml(benchmarkingRow?.takeaways) || "Not defined yet",
    debate_context: debateContext,
  });

  const res = await generateAiJsonResponse<RiskAndValidationOutput>({
    service: aiConfig.service,
    apiKey: aiConfig.apiKey,
    model: aiConfig.model,
    prompt,
    maxTokens: 8192,
  });

  if (res.returned_an_error || !res.data) {
    return { error: res.error ?? "AI returned no data" };
  }

  if (!(await isRequestActive(supabase, ideaId, requestId))) return {};

  const d = res.data;
  const { data: existing } = await supabase
    .from("idea_risk_and_validation" as never)
    .select("id")
    .eq("idea_id", ideaId)
    .maybeSingle();

  const payload = {
    risk_register:     d.risk_register ?? null,
    validation_test:   d.validation_test ?? null,
    why_we_win:        d.why_we_win ?? null,
    demand_evidence:   d.demand_evidence ?? null,
    debate_transcript: transcript,
    debate_meta:       debateMeta,
    agreed_problem:    agreedProblem,
    agreed_solution:   agreedSolution,
  };

  // Surface DB write errors instead of silently swallowing them — a missing
  // column or constraint must not look like a successful (but empty) generation.
  if (existing) {
    const { error: updErr } = await supabase
      .from("idea_risk_and_validation" as never)
      .update(payload as never)
      .eq("id", (existing as { id: string }).id);
    if (updErr) return { error: updErr.message };
  } else {
    const { error: insErr } = await supabase
      .from("idea_risk_and_validation" as never)
      .insert({ idea_id: ideaId, ...payload } as never);
    if (insErr) return { error: insErr.message };
  }

  return {};
}
