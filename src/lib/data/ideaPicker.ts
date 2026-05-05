/**
 * Shared "idea picker" data loader.
 *
 * Two callers need the same shape:
 *   - `BuildFromIdeaModal` (docs/playbook) — pick an idea to build a
 *     playbook version from.
 *   - `ImportTasksFromIdeaModal` (projects/developer) — pick an idea to
 *     import its milestones-and-tasks block from.
 *
 * Both want:
 *   1. Ideas already linked to the current project (so the user can pick
 *      "the obvious one" first).
 *   2. If there are none, fall back to ideas with no project assigned
 *      (`idea.project_id IS NULL`) — so a manager can attach an
 *      unassigned Sandbox idea to this project on the way through.
 *
 * Each row carries two readiness flags (`has_prd`, `has_milestones`) so
 * the modal can render a small badge telling the picker which ideas are
 * actually buildable / importable. We compute them with `head:true` count
 * queries to avoid pulling the body text just to check existence.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface IdeaPickerRow {
  id: string;
  name: string;
  score: number | null;
  project_id: string | null;
  /** True if `idea_prd` has a row for this idea (Feature 1 readiness). */
  has_prd: boolean;
  /** True if `idea_milestones_and_tasks` has a row (Feature 2 readiness). */
  has_milestones: boolean;
}

export interface IdeaPickerResult {
  /** Ideas where `idea.project_id = projectId`. Always returned. */
  linked: IdeaPickerRow[];
  /**
   * Ideas with `idea.project_id IS NULL`. Only populated when `linked` is
   * empty — matches the user's UX: "show unassigned only when there's no
   * project-linked option to default to".
   */
  unassigned: IdeaPickerRow[];
}

interface RawIdeaRow {
  id: string;
  name: string;
  score: number | null;
  project_id: string | null;
}

async function attachReadinessFlags(
  supabase: SupabaseClient,
  rows: RawIdeaRow[]
): Promise<IdeaPickerRow[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);

  // One round-trip per child table — `.in('idea_id', ids)` returns the set
  // of idea_ids that have a row, which we then turn into a Set membership
  // check on each parent row. Cheap because both child tables are 1:1.
  const [prdRes, mTasksRes] = await Promise.all([
    supabase.from("idea_prd").select("idea_id").in("idea_id", ids),
    supabase.from("idea_milestones_and_tasks").select("idea_id").in("idea_id", ids),
  ]);

  const hasPrd = new Set<string>(
    ((prdRes.data ?? []) as Array<{ idea_id: string }>).map((r) => r.idea_id)
  );
  const hasMilestones = new Set<string>(
    ((mTasksRes.data ?? []) as Array<{ idea_id: string }>).map((r) => r.idea_id)
  );

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    score: r.score,
    project_id: r.project_id,
    has_prd: hasPrd.has(r.id),
    has_milestones: hasMilestones.has(r.id),
  }));
}

export async function listIdeasForProjectPicker(
  supabase: SupabaseClient,
  projectId: string
): Promise<IdeaPickerResult> {
  // Linked bucket — RLS already gates non-elevated callers; admins/managers
  // see every idea via the existing `is_admin_or_manager()` policy.
  const { data: linkedRaw } = await supabase
    .from("idea")
    .select("id, name, score, project_id")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  const linked = await attachReadinessFlags(supabase, (linkedRaw ?? []) as RawIdeaRow[]);

  // Only run the unassigned query when the user actually needs it — saves
  // a round-trip 90% of the time.
  if (linked.length > 0) {
    return { linked, unassigned: [] };
  }
  const { data: unassignedRaw } = await supabase
    .from("idea")
    .select("id, name, score, project_id")
    .is("project_id", null)
    .order("created_at", { ascending: false });
  const unassigned = await attachReadinessFlags(
    supabase,
    (unassignedRaw ?? []) as RawIdeaRow[]
  );
  return { linked, unassigned };
}
