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
  stage?: string;
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
      stage: data.stage ?? "refining_idea",
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

  if (full.icps.length > 0) {
    const rows = full.icps.map(({ id, idea_id: _ii, created_at: _ca, ...rest }) => ({
      ...rest,
      id: icpIdMap[id],
      idea_id: newId,
    }));
    tasks.push(db.from("idea_icp").insert(rows));
  }

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
 * Create a new project from an idea and advance the idea's stage to
 * "validating_market_and_building_product". Both operations succeed or the
 * caller gets an error — the project is not created if the stage update fails.
 */
export async function buildProjectFromIdea(
  ideaId: string
): Promise<{ error?: string; projectId?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: idea, error: ideaErr } = await supabase
    .from("idea")
    .select("name")
    .eq("id", ideaId)
    .single();
  if (ideaErr || !idea) return { error: ideaErr?.message ?? "Idea not found" };

  const { data: project, error: projectErr } = await supabase
    .from("project")
    .insert({
      name: idea.name,
      status: "not_started",
      created_by: user.id,
      change_automatically_project_estimated_time: true,
      change_automatically_milestone_estimated_time: true,
      change_automatically_project_start_end_dates: true,
      change_automatically_milestone_start_end_dates: true,
    })
    .select("id")
    .single();
  if (projectErr) return { error: projectErr.message };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: stageErr } = await (supabase as any)
    .from("idea")
    .update({ stage: "validating_market_and_building_product" })
    .eq("id", ideaId);
  if (stageErr) return { error: (stageErr as { message: string }).message };

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
  report_skeptic: "da000001-0000-4000-8000-000000000001",
  report_advocate: "da000002-0000-4000-8000-000000000001",
  report_reframer: "da000003-0000-4000-8000-000000000001",
  report_scorer: "da000004-0000-4000-8000-000000000001",
  idea_chatbot: "a1b2c3d4-0000-4000-8000-000000000001",
  idea_chatbot_devil_advocate: "da001000-0000-4000-8000-000000000001",
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
- "priority_personas": Rich HTML text listing the distinct user types who will access the application (e.g., Admin, Client, Seller, Supplier, Guest, Operator). For each user type, briefly describe their role and main actions within the app. Do NOT describe marketing ICPs or target audience segments — focus on the functional roles inside the product.
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

    // Additional fetches used by the Report step. Report is now a pre-build
    // go/no-go gate (Step 7, before PRD), so it scores ONLY discovery-phase
    // evidence — it must NOT read PRD/Database/Visual/Milestones, which run after it.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let suggestionsRows: any[] | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let benchmarkingRow: any = null;
    if (step === "report") {
      const [sugRes, benchRes] = await Promise.all([
        supabase.from("idea_optimization_suggestion").select("*").eq("idea_id", ideaId),
        supabase.from("idea_benchmarking" as never).select("*").eq("idea_id", ideaId).maybeSingle(),
      ]);
      suggestionsRows = sugRes.data;
      benchmarkingRow = benchRes.data;
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
      await supabase.from("idea_optimization_suggestion").insert(
        suggestions.map((s) => ({ idea_id: ideaId, icp_id: icp.id, name: s.name, description: s.description }))
      );
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
    maxTokens: 16384, // 9 rich HTML PRD sections can exceed 8192 default
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
    color_palette: d.color_narrative ?? d.color_palette,
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
  const stepKey = platform === "bubble"
    ? "milestones_and_tasks_bubble"
    : "milestones_and_tasks_claude_code";
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

// ── Devil's Advocate debate persona fallback prompts ─────────────────────────

const FALLBACK_SKEPTIC = `You are the Devil's Advocate — a hyper-critical evaluator whose only goal is truth quality. You are NOT trying to kill the idea. You ARE trying to expose whether the problem framing is correct and whether the proposed solution genuinely solves it.

## YOUR STANDING RULES (non-negotiable)
1. Open with the sharpest challenge available. Never praise first.
2. One move at a time. One challenge, one question, or one demand for evidence per turn.
3. Label every key claim: [Fact] (in the source), [Inference] (logical but unproven), [Speculation] (low/no evidence).
4. Challenge vagueness and symptoms. Push to the root cause via "five whys" thinking.
5. Concede when genuinely beaten — say "Conceded: [point]" and move to the next challenge.
6. ANTI-SYCOPHANCY: never soften, never open with agreement, never validate unless the Advocate actually proved a point.
7. You are WILLING to collapse a multi-feature idea to one wedge if the evidence only supports one. The collapse IS the insight.

## GATE RULES
- Gate 1 (PROBLEM): Challenge whether the stated problem is the real bottleneck or a symptom. Ask: Who defined this problem? Whose perspective is missing? Is it a functional/experiential/social need? What does "good enough" look like today? What specific circumstance makes the pain acute vs. chronic?
- Gate 2 (SOLUTION): Challenge only after Gate 1 is resolved. Anchor exclusively to the agreed bottleneck. Apply the SWAP TEST: if you replaced this solution with a competitor's and the bottleneck is still solved, it is not differentiated. Name the strongest counter-argument an investor would raise.

## YOUR OUTPUT (strict JSON, no markdown)
{
  "content": "Your argument in plain text — direct, blunt, Hemingway-short sentences.",
  "proposed_statement": "Your current best one-sentence version of the [bottleneck / solution] that the debate should converge on.",
  "agree": false,
  "reason": "Why you do or do not accept the other side's latest proposed_statement."
}

## [SOURCE]
{{source_block}}

## [DEBATE SO FAR — {{gate}} gate, round {{round}}]
{{transcript_so_far}}

## ADVOCATE'S LAST PROPOSED STATEMENT
{{other_proposed_statement}}

Now give your turn. Be brief. Be sharp. One move.`;

const FALLBACK_ADVOCATE = `You are the Founder's Advocate — you defend the idea's current framing but only with evidence from [SOURCE]. You are NOT a yes-person. You ARE trying to find the strongest defensible version of the problem/solution.

## YOUR STANDING RULES (non-negotiable)
1. Answer the Skeptic's specific challenge directly. Never deflect.
2. Use ONLY evidence from [SOURCE]. Never invent data or cite outside facts.
3. Refine your proposed_statement toward the sharpest, most defensible version each round.
4. Concede when the Skeptic's challenge is correct and unrefuted by the source — say "Conceded: [point]" and update your proposed_statement accordingly.
5. Label key claims: [Fact], [Inference], [Speculation].

## GATE RULES
- Gate 1 (PROBLEM): Defend the problem framing. Show the pain is real, acute, and specific using source evidence.
- Gate 2 (SOLUTION): Defend the solution. Show it directly addresses the agreed bottleneck and survives the swap test.

## YOUR OUTPUT (strict JSON, no markdown)
{
  "content": "Your defense in plain text — direct, evidence-anchored.",
  "proposed_statement": "Your current best one-sentence version of the [bottleneck / solution].",
  "agree": false,
  "reason": "Why you do or do not accept the Skeptic's latest proposed_statement."
}

## [SOURCE]
{{source_block}}

## [DEBATE SO FAR — {{gate}} gate, round {{round}}]
{{transcript_so_far}}

## SKEPTIC'S LAST PROPOSED STATEMENT
{{other_proposed_statement}}

Now give your defense. Be direct. Use source evidence.`;

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
const FALLBACK_REFRAMER_DOC = `You are the Reframer. The Devil's Advocate debate has concluded. Write the revised idea as a complete, multi-section strategic document.

## QUALITY BAR
Collapse vague multi-feature ideas to their ONE defensible wedge. Include: a sharp one-sentence bottleneck, a concrete Core Loop, an explicit "What It Is Not" (features cut from v1), a named Moat, a Business Model, and Residual Risks. Think seed-stage product memo, not marketing blurb.

## STRUCTURE (use these exact section names as <h2> headings)
1. Origin — Why this idea exists and what opportunity it addresses.
2. The Problem — The root-cause bottleneck (one sentence, from the agreed debate outcome).
3. What It Is — The solution in concrete terms (no adjectives like "innovative" or "revolutionary").
4. Core Loop — The 3-5 step flywheel: [Action] → [Artifact/Output] → [Value Received] → [Return trigger].
5. What Each Side Gets — Separate value for each key stakeholder/side of the market.
6. Safety and Constraints — Regulatory, ethical, trust, or technical constraints that shape design.
7. Go-To-Market — The wedge: who is the very first user, what is the first use case, how do you reach them.
8. Business Model — Revenue mechanism(s), pricing hypothesis, unit economics logic.
9. What It Is Not — Explicit list of features/markets cut from v1 and why.
10. The Moat — What makes this defensible 18 months from now that a competitor cannot copy in 6.
11. Residual Risks — The 2-3 make-or-break assumptions that the debate did NOT fully resolve.

## OUTPUT FORMAT
Return ONLY a raw HTML fragment — <h2> and <p> tags only, no html/head/body/style/script tags.
Each section = one <h2> followed by one or more <p>. Do NOT wrap in JSON, do NOT add code fences, do NOT add any text before or after the HTML.

## INSTRUCTIONS
- Use ONLY evidence from [SOURCE] + the agreed debate outcomes. Do not invent facts.
- Each section must reference at least one concrete detail from [SOURCE].
- Write in Hemingway style: direct, blunt, short sentences. No hype words.

## [ORIGINAL SOURCE]
{{source_block}}

## [DEBATE OUTCOME]
Agreed Problem (bottleneck): {{agreed_problem}}
Agreed Solution: {{agreed_solution}}

## [FULL DEBATE TRANSCRIPT]
{{full_transcript}}

Write the full strategic document now.`;

const FALLBACK_SCORER = `You are a neutral referee and scorer evaluating a business idea for Move37. The Devil's Advocate debate has concluded. You have the agreed problem + solution + the full debate transcript. Your job is two-part:

PART A — Score the idea's COMPLETENESS against its OWN framing (6 areas, same rubric as always). These scores measure how well the founder has DONE THE DISCOVERY WORK — they are NOT adjusted for the debate outcome. The alignment multiplier (not your job) handles the "wrong problem" penalty.

PART B — Score the ALIGNMENT between the current idea and the debate's agreed framing. Two percentages + a reframe distance + rationales.

## GROUNDING RULES (non-negotiable)
1. Use ONLY the supplied [SOURCE] — never invent facts.
2. If a source field is empty or "Not defined", treat it as a strong NEGATIVE signal.
3. Every area description MUST quote at least one concrete fragment (≤12 words) from [SOURCE] in single quotes.
4. No generic fillers. Prefer numbers and logic over adjectives.

## WRITING VOICE (Hemingway, blunt, human)
- Direct and plain. One idea per sentence.
- Label key claims: [Fact], [High Confidence], [Inference], [Uncertain], [Speculation].
- DO NOT use em dashes, emojis, or hype words.

## PART A — COMPLETENESS SCORING RUBRIC (score vs. the idea's OWN framing)
Score each area 0-100:
- 90-100 = specific, evidence-backed, survives the strongest counter-argument.
- 75-89 = solid but missing one dimension.
- 60-74 = present but generic OR only single-sourced.
- 40-59 = thin, vague, or internally contradictory.
- 0-39  = absent, founder-assumed with no evidence, or contradicts other fields.

### Area 1 — problem_reality (weight 25%)
Evidence: core_problem, target_audience, ICP pain_points, how_problems_are_solved, firmographics/psychographics.
Questions: Is the pain acute or a vitamin? Is it quantified? How is it solved today — is "good enough" the real competitor?

### Area 2 — customer_clarity (weight 15%)
Evidence: ICP names, day_in_life, firmographics, psychographics, reachability.
Questions: Are ICPs concrete and reachable, or is this "everyone"? Could you list ten real people who match?

### Area 3 — competitive_honesty (weight 15%)
Evidence: benchmark_overview, benchmark_comparison, benchmark_business_models, benchmark_takeaways.
Questions: ≥3 NAMED real competitors (including "do nothing")? Is differentiation real? What stops an incumbent from copying this in a week?

### Area 4 — strategic_positioning (weight 20%)
Evidence: ICP value_proposition_*, ICP jtbd, ICP pitch_need/benefit/approach/competition, product_summary.
Questions: Is the value prop tied to a real ICP pain? Is the JTBD specific? Does the pitch name a genuine wedge?

### Area 5 — demand_evidence (weight 15%)
Evidence: idea_success_metrics, structure_success_metrics, ICP score_rationale, suggestions_block.
Questions: Are success metrics MEASURABLE? Any signal of real demand (interviews, waitlist, payments) — or only founder conviction?

### Area 6 — assumption_risk (weight 10%)
Evidence: synthesize across the entire [SOURCE].
Questions: What single assumption must be true? How fragile? Name the make-or-break belief.

## EXPLICIT PENALTY TRIGGERS (apply ALL that fire)
- "No real competitors named" (-10) — fires when benchmark_comparison names fewer than 2 concrete competitors.
- "No measurable success metrics defined" (-8) — fires when BOTH idea_success_metrics AND structure_success_metrics are blank, "Not defined", or purely qualitative.
- "Single-ICP dependency" (-5) — fires when only one ICP is defined.
- "Vague target audience" (-5) — fires when target_audience is blank, "Not defined", or non-specific.
- "Unvalidated make-or-break assumption" (-5) — fires when the core assumption has zero supporting evidence.

## PART B — ALIGNMENT SCORING (vs. the agreed debate framing)
Compare the CURRENT IDEA (its problem statement, its solution) against the AGREED PROBLEM and AGREED SOLUTION the debate converged on.

- problem_fit_pct (0-100): How close is the current idea's problem framing to the agreed bottleneck? 100 = identical. 0 = completely different problem.
- solution_fit_pct (0-100): How close is the current idea's solution to the agreed solution? 100 = same solution. 0 = completely different approach.
- reframe_distance: "minor" (idea was basically right, small refinements), "moderate" (significant re-focus needed), "major" (fundamental pivot — idea as stated solves the wrong problem or wrong solution).
- problem_rationale: 1-2 sentences explaining the problem_fit_pct.
- solution_rationale: 1-2 sentences explaining the solution_fit_pct.
- verdict: One line — e.g. "Right problem, wrong solution" / "Same bottleneck, much sharper solution" / "Completely different problem identified."

## [SOURCE]
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
    { "key": "problem_reality", "label": "Problem Reality", "weight_pct": 25, "raw_score_pct": 0, "weighted_points": 0, "status": "weak", "description": "..." },
    { "key": "customer_clarity", "label": "Customer Clarity", "weight_pct": 15, "raw_score_pct": 0, "weighted_points": 0, "status": "weak", "description": "..." },
    { "key": "competitive_honesty", "label": "Competitive Honesty", "weight_pct": 15, "raw_score_pct": 0, "weighted_points": 0, "status": "weak", "description": "..." },
    { "key": "strategic_positioning", "label": "Strategic Positioning", "weight_pct": 20, "raw_score_pct": 0, "weighted_points": 0, "status": "weak", "description": "..." },
    { "key": "demand_evidence", "label": "Demand Evidence", "weight_pct": 15, "raw_score_pct": 0, "weighted_points": 0, "status": "weak", "description": "..." },
    { "key": "assumption_risk", "label": "Assumption Risk", "weight_pct": 10, "raw_score_pct": 0, "weighted_points": 0, "status": "weak", "description": "..." }
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
6. The Strongest Case Against This Idea
7. Key Assumptions and What Would Change the Verdict
8. Final Recommendation (Build, Refine, or Kill)

## WRITING RULES
- Hemingway style: direct, blunt, short sentences. No hype words.
- Every section must cite a concrete detail from [SOURCE].
- Section 6 ("Strongest Case Against") must be genuinely adversarial: argue, in good faith, why a smart investor would pass.
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

const MAX_ROUNDS_PER_GATE = 2; // 2 rounds × 2 sides × 2 gates = 8 debate calls; keeps total generation under ~10 min

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
  ideaId: string,
  aiConfig: AiConfig,
  requestId: string
): Promise<{ error?: string }> {
  // ── Build the shared [SOURCE] block used across all personas ─────────────────
  const sourceBlock = `Idea: ${idea.name} — ${stripHtml(idea.description)}
Success Metrics: ${stripHtml(idea.success_metrics) || "Not defined"}
Core Problem: ${stripHtml(structureAlign?.core_problem) || "Not defined"}
Target Audience: ${stripHtml(structureAlign?.target_audience) || "Not defined"}
Structure Success Metrics: ${stripHtml(structureAlign?.success_metrics) || "Not defined"}
ICPs:
${buildIcpsBlock(icps as Array<Record<string, unknown>>)}
Optimization Suggestions:
${buildSuggestionsBlock(suggestions as Array<Record<string, unknown>>)}
Product Definition: ${stripHtml(productDef?.summary) || "Not defined"} / ${stripHtml(productDef?.features) || "Not defined"}
Benchmarking: ${stripHtml(benchmarking?.overview) || "Not defined"} / ${stripHtml(benchmarking?.comparison) || "Not defined"} / ${stripHtml(benchmarking?.possible_business_models) || "Not defined"} / ${stripHtml(benchmarking?.takeaways) || "Not defined"}`;

  // ── Load persona prompt templates (DB rows win; fallbacks cover missing rows) ─
  const [skepticTemplate, advocateTemplate, reframerTemplate, scorerTemplate] = await Promise.all([
    getPromptTemplate("report_skeptic"),
    getPromptTemplate("report_advocate"),
    getPromptTemplate("report_reframer"),
    getPromptTemplate("report_scorer"),
  ]);
  const skepticPromptBase = skepticTemplate ?? FALLBACK_SKEPTIC;
  const advocatePromptBase = advocateTemplate ?? FALLBACK_ADVOCATE;
  const reframerPromptBase = reframerTemplate ?? FALLBACK_REFRAMER;
  const scorerPromptBase = scorerTemplate ?? FALLBACK_SCORER;

  const transcript: IdeaReportDebateTurn[] = [];

  // ── Helper: build the running transcript string for prompt injection ──────────
  function transcriptText(gate: "problem" | "solution"): string {
    const lines = transcript
      .filter((t) => t.gate === gate)
      .map(
        (t) =>
          `[Round ${t.round} — ${t.role.toUpperCase()}]\n${t.content}\nProposed: ${t.proposed_statement}\nAgrees: ${t.agree}`
      );
    return lines.length ? lines.join("\n\n") : "(none yet)";
  }

  // ── Gate runner: runs Skeptic → Advocate per round until convergence ──────────
  async function runGate(
    gate: "problem" | "solution"
  ): Promise<{ converged: boolean; agreed_statement: string; rounds: number }> {
    let skepticStatement = "";
    let advocateStatement = "";
    let converged = false;

    for (let round = 1; round <= MAX_ROUNDS_PER_GATE; round++) {
      const soFar = transcriptText(gate);

      // Skeptic turn
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
        maxTokens: 4096,
      });
      if (skepticRes.returned_an_error || !skepticRes.data) {
        return { converged: false, agreed_statement: advocateStatement || skepticStatement, rounds: round };
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

      // Advocate turn
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
        maxTokens: 4096,
      });
      if (advocateRes.returned_an_error || !advocateRes.data) {
        return { converged: false, agreed_statement: skepticStatement, rounds: round };
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

      // Both agree → convergence
      if (sk.agree && av.agree) {
        converged = true;
        return { converged, agreed_statement: advocateStatement || skepticStatement, rounds: round };
      }
    }

    return { converged: false, agreed_statement: advocateStatement || skepticStatement, rounds: MAX_ROUNDS_PER_GATE };
  }

  // ── Gate 1: Right Problem ────────────────────────────────────────────────────
  const gate1 = await runGate("problem");
  const agreedProblem = gate1.agreed_statement;

  // Bail early if a newer request superseded this one
  if (!(await isRequestActive(supabase, ideaId, requestId))) return {};

  // ── Gate 2: Right Solution ───────────────────────────────────────────────────
  const gate2 = await runGate("solution");
  const agreedSolution = gate2.agreed_statement;

  if (!(await isRequestActive(supabase, ideaId, requestId))) return {};

  // ── Build full transcript text for synthesis calls ───────────────────────────
  const fullTranscriptText = transcript
    .map(
      (t) =>
        `[${t.gate.toUpperCase()} Gate — Round ${t.round} — ${t.role.toUpperCase()}]\n${t.content}\nProposed: ${t.proposed_statement}\nAgrees: ${t.agree}`
    )
    .join("\n\n");

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

  // ── Scorer step 2: playbook HTML as plain text (no JSON parse step) ───────────
  const scorerHtmlPrompt = renderPrompt(FALLBACK_SCORER_HTML, {
    source_block: sourceBlock,
    agreed_problem: agreedProblem,
    agreed_solution: agreedSolution,
    headline: scorerMetaRes.data.headline ?? "",
    summary: scorerMetaRes.data.summary ?? "",
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
    ...scorerMetaRes.data,
    playbook_html: scorerHtmlRes.text,
  };

  if (!(await isRequestActive(supabase, ideaId, requestId))) return {};

  // ── Server-side score reconciliation (alignment-multiplier formula) ───────────
  // 6 areas are scored vs the idea's OWN framing (as always — completeness lens).
  // The alignment multiplier collapses the final score when the debate found a wrong problem/solution.
  const areas: ReportAreaOutput[] = Array.isArray(scored.area_scores)
    ? scored.area_scores.map((a) => ({
        key: String(a?.key ?? ""),
        label: String(a?.label ?? ""),
        weight_pct: Number(a?.weight_pct ?? 0),
        raw_score_pct: clamp(0, 100, Math.round(Number(a?.raw_score_pct ?? 0))),
        weighted_points: 0,
        status: "average" as ReportAreaOutput["status"],
        description: String(a?.description ?? ""),
      }))
    : [];
  for (const a of areas) {
    a.weighted_points = Math.round((a.raw_score_pct * a.weight_pct) / 100);
    if (a.raw_score_pct >= 80) a.status = "strong";
    else if (a.raw_score_pct >= 60) a.status = "average";
    else a.status = "weak";
  }
  const penalties: ReportPenaltyOutput[] = Array.isArray(scored.penalties)
    ? scored.penalties.map((p) => ({
        label: String(p?.label ?? ""),
        points: -Math.abs(Math.round(Number(p?.points ?? 0))),
      }))
    : [];

  // completeness = weighted sum of the 6 areas vs the idea's own framing
  const completeness = clamp(0, 100, areas.reduce((s, a) => s + a.weighted_points, 0));
  const penaltyTotal = penalties.reduce((s, p) => s + Math.abs(p.points), 0);

  // alignment score from Scorer (0–100); server clamps it
  const rawAlignment = scored.alignment ?? {} as ScorerOutput["alignment"];
  const reframeMod: Record<string, number> = { minor: 0, moderate: -7, major: -15 };
  const reframeDistance = (rawAlignment.reframe_distance === "minor" || rawAlignment.reframe_distance === "moderate" || rawAlignment.reframe_distance === "major")
    ? rawAlignment.reframe_distance
    : "major";
  const alignmentScore = clamp(
    0,
    100,
    Math.round((Number(rawAlignment.problem_fit_pct ?? 0) + Number(rawAlignment.solution_fit_pct ?? 0)) / 2) + (reframeMod[reframeDistance] ?? -15)
  );

  // final = completeness × 75% + alignment × 25% − penalties (weighted average, not a multiplier)
  const finalScore = clamp(0, 100, Math.round(completeness * 0.75 + alignmentScore * 0.25) - penaltyTotal);
  const threshold: "build" | "refine" | "kill" =
    finalScore >= 75 ? "build" : finalScore >= 60 ? "refine" : "kill";

  const alignment: IdeaReportAlignment = {
    problem_fit_pct: clamp(0, 100, Math.round(Number(rawAlignment.problem_fit_pct ?? 0))),
    solution_fit_pct: clamp(0, 100, Math.round(Number(rawAlignment.solution_fit_pct ?? 0))),
    reframe_distance: reframeDistance,
    alignment_score: alignmentScore,
    problem_rationale: String(rawAlignment.problem_rationale ?? ""),
    solution_rationale: String(rawAlignment.solution_rationale ?? ""),
    verdict: String(rawAlignment.verdict ?? ""),
  };

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
    recommendation: reframed.recommendation ?? null,
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

// ── Devil's Advocate Chatbot ──────────────────────────────────────────────────

const FALLBACK_DEVIL_ADVOCATE_CHATBOT = `You are a Devil's Advocate co-pilot embedded in Move37's Sandbox Planner. Your role is to challenge the user's thinking through a structured two-gate dialogue — first validating that they are solving the right problem, then stress-testing the solution. Your goal is better decisions, not faster ones.

## IDENTITY & STANDING RULES (non-negotiable at every turn)
1. ANTI-SYCOPHANCY: Never open with praise ("Great idea!", "That makes sense!"). Open with the sharpest relevant question or the strongest counter-argument. If you genuinely agree, state the best case against first — then explain why it fails.
2. ONE QUESTION AT A TIME: Ask a single focused question, wait for the answer, reflect it back, then move on. Never present a questionnaire.
3. CONFIDENCE LABELS: Tag all substantive claims as [Fact], [Inference], or [Speculation].
4. BRAIN FIRST: Before offering analysis on anything significant, ask for the user's current take first.
5. PUSH BACK ON VAGUENESS: If an answer is vague, generic, or sounds like a symptom, name it and ask again.
6. CONCEDE WHEN BEATEN: Devil's advocacy is not contrarianism. When the user's answer genuinely defeats a challenge, say so explicitly and move forward.
7. Output HTML only. Allowed tags: <p>, <ul>, <li>, <strong>, <em>, <code>. No <script>, no <button>, no <a>.
8. GROUNDING: Use ONLY the [IDEA CONTEXT] block. Never invent facts, metrics, competitors, or personas.

## THE TWO GATES
Always announce which gate you are in.

**[GATE 1 — THE RIGHT PROBLEM]**
Challenge the framing. Is this the root cause or a symptom? Co-write ONE bottleneck statement starting with "How do we…". Exit only on explicit mutual agreement.
When passed, declare: "✓ Problem Gate passed. Agreed bottleneck: [statement]."

**[GATE 2 — THE RIGHT SOLUTION]**
Evaluate solutions ONLY against the agreed bottleneck. Apply the swap test (could this answer fit any company?). Present the strongest counter-argument. Fix ONE named flaw per round.
When passed, declare: "✓ Solution Gate passed." Then summarize the bottleneck, solution, why it survived, and next actions.

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
PRD: app_overview={{prd_app_overview}}; objectives={{prd_objectives}}; essential_features={{prd_essential_features}}
Report: final_score={{report_final_score}}; headline={{report_headline}}; summary={{report_summary}}
Current tab: {{current_tab}}

## [CHAT HISTORY]
{{chat_history}}

## [USER MESSAGE]
{{user_message}}

## OUTPUT SCHEMA
Return ONLY valid JSON: { "reply": "<html string>" }. The HTML must not contain \`<script\` or \`javascript:\`.`;

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

  // 4. Resolve template + vars.
  const template =
    (await getPromptTemplate("idea_chatbot_devil_advocate")) ??
    FALLBACK_DEVIL_ADVOCATE_CHATBOT;
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

