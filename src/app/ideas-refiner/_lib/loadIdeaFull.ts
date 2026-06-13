/**
 * loadIdeaFull
 * ------------------------------------------------------------------
 * Shared server-only helper that loads the canonical `IdeaFull` bundle
 * for a given idea id. Used by:
 *   - `page.tsx` for the initial server render.
 *   - `sendChatMessage` in `actions.ts` to rebuild the context the
 *     chatbot sees on every message, guaranteeing both code paths read
 *     the exact same shape (no drift).
 *
 * Returns `null` if the idea does not exist or the caller lacks RLS
 * read access to the parent `idea` row.
 */
import type {
  Idea,
  IdeaFull,
  IdeaIcp,
  IdeaBlockProductDefinition,
  IdeaBlockStructureAlign,
  IdeaOptimizationSuggestion,
  IdeaBenchmarking,
  IdeaPrd,
  IdeaDatabase,
  IdeaStyles,
  IdeaMilestonesAndTasks,
  IdeaReport,
} from "@/types/idea-refiner";

// Matches the existing pattern in actions.ts: the generated Database type
// doesn't yet include the newer sandbox-planner tables, so we type the
// client loosely and rely on runtime casts per-query.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

export async function loadIdeaFull(
  supabase: AnySupabase,
  ideaId: string,
): Promise<IdeaFull | null> {
  // Fetch the parent idea first — if we can't see it (RLS) we return null.
  const { data: ideaRow } = await supabase
    .from("idea")
    .select(
      "id, project_id, created_by, name, score, description, success_metrics, current_block_ended, current_blocks_updating, created_at, project:project_id(id, name), creator:created_by(first_name, last_name)",
    )
    .eq("id", ideaId)
    .maybeSingle();

  if (!ideaRow) return null;

  const ideaRaw = ideaRow as unknown as Idea & {
    creator?: { first_name: string | null; last_name: string | null } | null;
  };
  const idea: Idea = {
    ...ideaRaw,
    creator_name:
      [ideaRaw.creator?.first_name, ideaRaw.creator?.last_name]
        .filter(Boolean)
        .join(" ") || null,
  };

  const [
    { data: structureAlignData },
    { data: icpsData },
    { data: productDefData },
    { data: suggestionsData },
    { data: benchmarkingData },
    { data: prdData },
    { data: databaseData },
    { data: stylesData },
    { data: milestonesData },
    { data: reportData },
  ] = await Promise.all([
    supabase
      .from("idea_structure_and_align")
      .select(
        "id, idea_id, success_metrics_text, product_overview_text, essential_features_text, success_metrics, target_audience, core_problem, created_at",
      )
      .eq("idea_id", ideaId)
      .maybeSingle(),
    supabase
      .from("idea_icp")
      .select(
        "id, idea_id, name, title, subtitle, description, day_in_life, score, score_rationale, picture, tags, jtbd, pitch_need, pain_points, firmographics, pitch_benefit, pitch_approach, psychographics, pitch_competition, value_proposition_icp_pains, value_proposition_value_map_solutions, value_proposition_icp_gains, value_proposition_value_map_gain_creators, how_problems_are_solved, how_problems_could_be_solved, our_solution_value, created_at",
      )
      .eq("idea_id", ideaId)
      .order("created_at", { ascending: true }),
    supabase
      .from("idea_product_definition_and_flows")
      .select("id, idea_id, created_by, summary, business_model, features, go_to_market, created_at")
      .eq("idea_id", ideaId)
      .maybeSingle(),
    supabase
      .from("idea_optimization_suggestion")
      .select("id, idea_id, icp_id, name, description, created_at")
      .eq("idea_id", ideaId)
      .order("created_at", { ascending: true }),
    supabase
      .from("idea_benchmarking" as never)
      .select("*")
      .eq("idea_id", ideaId)
      .maybeSingle(),
    supabase
      .from("idea_prd" as never)
      .select("*")
      .eq("idea_id", ideaId)
      .maybeSingle(),
    supabase
      .from("idea_database" as never)
      .select("*")
      .eq("idea_id", ideaId)
      .maybeSingle(),
    supabase
      .from("idea_styles" as never)
      .select("*")
      .eq("idea_id", ideaId)
      .maybeSingle(),
    supabase
      .from("idea_milestones_and_tasks" as never)
      .select("*")
      .eq("idea_id", ideaId)
      .maybeSingle(),
    supabase
      .from("idea_report" as never)
      .select("*")
      .eq("idea_id", ideaId)
      .maybeSingle(),
  ]);

  return {
    idea,
    structureAlign: (structureAlignData as unknown as IdeaBlockStructureAlign) ?? null,
    icps: (icpsData ?? []) as unknown as IdeaIcp[],
    productDefinition: (productDefData as unknown as IdeaBlockProductDefinition) ?? null,
    optimizationSuggestions: (suggestionsData ?? []) as unknown as IdeaOptimizationSuggestion[],
    benchmarking: (benchmarkingData as unknown as IdeaBenchmarking) ?? null,
    prd: (prdData as unknown as IdeaPrd) ?? null,
    database: (databaseData as unknown as IdeaDatabase) ?? null,
    styles: (stylesData as unknown as IdeaStyles) ?? null,
    milestonesAndTasks: (milestonesData as unknown as IdeaMilestonesAndTasks) ?? null,
    report: (reportData as unknown as IdeaReport) ?? null,
  };
}
