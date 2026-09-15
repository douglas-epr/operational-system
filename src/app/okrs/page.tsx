import { requirePageAccess } from "@/lib/auth/page-gate";
import PageShell from "@/components/layout/PageShell";
import OkrsShell from "./_components/OkrsShell";
import type {
  InternalGoal,
  InternalKeyResult,
  InternalKeyResultTrack,
} from "@/types/okrs";

// Row caps below are generous upper bounds for this internal-tool page, not
// pagination — the OKR tree is expected to stay well under these counts.
const GOALS_LIMIT = 500;
const KEY_RESULTS_LIMIT = 2000;
const TRACKS_LIMIT = 5000;

const GOAL_COLUMNS =
  "id, name, order, description, status, created_by, created_at, updated_at";
const KEY_RESULT_COLUMNS =
  "id, internal_goal_id, name, order, start_date, end_date, status, current_key_result_value, achieved, description, created_by, created_at, updated_at";
const TRACK_COLUMNS =
  "id, internal_goal_id, internal_key_result_id, date, value, current_target_key_result_value, achieved, created_by, created_at";

export default async function OkrsPage() {
  // Gate: admin/manager/operational. The shared helper handles
  // role-specific redirects for everyone else (developer/client/qa →
  // /projects, referrer → /recommended-projects, lead → /sandbox-planner).
  const { supabase, userId } = await requirePageAccess([
    "admin",
    "manager",
    "operational",
  ]);

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, picture, type")
    .eq("id", userId)
    .single();

  const { data: goals } = await supabase
    .from("internal_goal")
    .select(GOAL_COLUMNS)
    .order("order", { ascending: true })
    .limit(GOALS_LIMIT);

  const { data: krs } = await supabase
    .from("internal_key_result")
    .select(KEY_RESULT_COLUMNS)
    .order("order", { ascending: true })
    .limit(KEY_RESULTS_LIMIT);

  const { data: tracks } = await supabase
    .from("internal_key_result_track")
    .select(TRACK_COLUMNS)
    .order("date", { ascending: true })
    .limit(TRACKS_LIMIT);

  return (
    <PageShell profile={profile} flush>
      <OkrsShell
        goals={(goals ?? []) as InternalGoal[]}
        keyResults={(krs ?? []) as InternalKeyResult[]}
        tracks={(tracks ?? []) as InternalKeyResultTrack[]}
      />
    </PageShell>
  );
}
