import { requirePageAccess } from "@/lib/auth/page-gate";
import PageShell from "@/components/layout/PageShell";
import OkrsShell from "./_components/OkrsShell";
import type {
  InternalGoal,
  InternalKeyResult,
  InternalKeyResultTrack,
} from "@/types/okrs";

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
    .select("*")
    .order("order", { ascending: true });

  const { data: krs } = await supabase
    .from("internal_key_result")
    .select("*")
    .order("order", { ascending: true });

  const { data: tracks } = await supabase
    .from("internal_key_result_track")
    .select("*")
    .order("date", { ascending: true });

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
