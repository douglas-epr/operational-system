import { requirePageAccess } from "@/lib/auth/page-gate";
import PageShell from "@/components/layout/PageShell";
import type { UserProfile } from "@/types/projects";
import DashboardOverview from "./_components/DashboardOverview";
import KeyResultsView from "./_components/KeyResultsView";
import ProjectsView from "./_components/ProjectsView";
import InternalProjectsView from "./_components/InternalProjectsView";
import { loadAllDashboardMetrics } from "./_lib/queries";

/**
 * /dashboard — admin/manager-only landing.
 *
 * Four mutually exclusive views via the `?view=` query param:
 *   - (root)                  → DashboardOverview (mission-control layout
 *                               with KPI strip + recharts)
 *   - ?view=key-results       → KeyResultsView (KR card grid + KR modal)
 *   - ?view=projects          → ProjectsView (project card grid + ProjectModal)
 *   - ?view=internal-projects → InternalProjectsView (IP card grid + IPModal)
 *
 * Non-admin/manager users that hit /dashboard are bounced to
 * /sandbox-planner — the sidebar entry is also gated to admin/manager so
 * regular users never see the link.
 *
 * `view` slug values use hyphens (matches the user's URL spec) — internally
 * the metric module uses underscores for the `os_tab` enum from Bubble.
 */

type SearchParams = Promise<{ view?: string }>;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // Gate: admin/manager only. The shared helper handles the unauthed
  // redirect AND every other role's role-specific landing page (per
  // src/lib/auth/page-gate.ts: developer/client/qa → /projects,
  // operational → /internal-projects, referrer → /projects,
  // lead → /sandbox-planner).
  const { supabase, userId } = await requirePageAccess(["admin", "manager"]);

  // Pull a full profile so we can pass it to the Sidebar (it shows the
  // user's name + avatar at the bottom).
  const { data: profileData } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, picture, type")
    .eq("id", userId)
    .single();
  const profile = (profileData ?? null) as UserProfile | null;

  const params = await searchParams;
  const view = (params.view ?? "").toLowerCase();

  // Build the inner content based on the view param.
  let content: React.ReactNode;

  if (view === "key-results") {
    // KeyResultModal expects the full goals + tracks bundle so the user
    // can edit the KR in place without a second round-trip.
    const [krsRes, goalsRes, tracksRes] = await Promise.all([
      supabase
        .from("internal_key_result")
        .select(
          "id, internal_goal_id, name, \"order\", description, current_key_result_value, achieved, status, start_date, end_date, created_at, created_by, updated_at"
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("internal_goal")
        .select("id, name, description, status, created_by, created_at, updated_at"),
      supabase
        .from("internal_key_result_track")
        .select(
          "id, internal_goal_id, internal_key_result_id, date, value, current_target_key_result_value, achieved, created_at"
        ),
    ]);
    content = (
      <KeyResultsView
        keyResults={(krsRes.data ?? []) as never}
        goals={(goalsRes.data ?? []) as never}
        tracks={(tracksRes.data ?? []) as never}
      />
    );
  } else if (view === "projects") {
    const [projectsRes, profilesRes] = await Promise.all([
      supabase
        .from("project")
        .select(
          "id, name, picture, status, estimated_time, real_time, start_date_estimated, end_date_estimated, start_date_real, end_date_real, authorized_users, created_at"
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("id, first_name, last_name, picture, type, authorized_projects")
        .order("first_name"),
    ]);
    content = (
      <ProjectsView
        projects={(projectsRes.data ?? []) as never}
        profiles={(profilesRes.data ?? []) as never}
      />
    );
  } else if (view === "internal-projects") {
    const [ipRes, profilesRes, krsRes] = await Promise.all([
      supabase
        .from("internal_project")
        .select(
          "id, name, status, sector, description, estimated_time, real_time, start_date_estimated, end_date_estimated, start_date_real, end_date_real, internal_key_result_ids, created_at"
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("id, first_name, last_name, picture, type, authorized_projects")
        .order("first_name"),
      supabase
        .from("internal_key_result")
        .select("id, name"),
    ]);
    // The `internal_project_assignees` join table referenced by the
    // existing /internal-projects page does not exist in the live
    // schema; pass an empty assignees array so the modal still works.
    content = (
      <InternalProjectsView
        projects={(ipRes.data ?? []) as never}
        profiles={(profilesRes.data ?? []) as never}
        keyResults={(krsRes.data ?? []) as never}
        assignees={[]}
      />
    );
  } else {
    const metrics = await loadAllDashboardMetrics(supabase);
    content = (
      <DashboardOverview metrics={metrics} viewerName={profile?.first_name ?? null} />
    );
  }

  // Wrap in PageShell (flush=true because every sub-view owns its own padding).
  return (
    <PageShell profile={profile} flush>
      {content}
    </PageShell>
  );
}
