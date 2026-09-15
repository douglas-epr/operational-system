import { redirect } from "next/navigation";
import { requirePageAccess } from "@/lib/auth/page-gate";
import PageShell from "@/components/layout/PageShell";
import PageHeader from "@/components/layout/PageHeader";
import type { UserProfile } from "@/types/projects";
import type {
  InternalKeyResultRef,
  InternalProject,
  InternalProjectAssignee,
  InternalTask,
  InternalTaskTimeTrack,
} from "@/types/internal-projects";
import InternalProjectsList from "./_components/InternalProjectsList";
import InternalProjectKanban from "./_components/InternalProjectKanban";

interface PageProps {
  searchParams: Promise<{ project?: string }>;
}

// Row caps below are generous upper bounds for this internal-tool page, not
// pagination — staff/project counts are expected to stay well under these.
const PROFILES_LIMIT = 500;
const KEY_RESULTS_LIMIT = 1000;
const PROJECTS_LIMIT = 500;
const ASSIGNEES_LIMIT = 2000;
const TASKS_LIMIT = 2000;
const TIME_TRACKS_LIMIT = 5000;

const PROJECT_COLUMNS =
  "id, name, order, start_date_real, end_date_real, start_date_estimated, end_date_estimated, description, real_time, estimated_time, status, sector, internal_key_result_ids, created_at";
const TASK_COLUMNS =
  "id, internal_project_id, internal_goal_id, internal_key_result_id, name, order, real_start_date, real_end_date, estimated_start_date, estimated_end_date, description, real_time, estimated_time, status, assignees, created_at";
const TIME_TRACK_COLUMNS =
  "id, assignee_id, internal_task_id, internal_project_id, start_date, start_time_min, end_time_min, time_spent_h, created_at, updated_at, created_by";

export default async function InternalProjectsPage({ searchParams }: PageProps) {
  // Gate: admin/manager/operational. Other roles get role-specific redirects.
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

  // Profiles for assignee pickers.
  const { data: profilesData } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, picture, type")
    .limit(PROFILES_LIMIT);
  const profiles = (profilesData ?? []) as unknown as UserProfile[];

  // Internal key results for the project modal multi-select.
  const { data: keyResultsData } = await supabase
    .from("internal_key_result")
    .select("id, name, internal_goal_id")
    .order("name", { ascending: true })
    .limit(KEY_RESULTS_LIMIT);
  const keyResults = (keyResultsData ?? []) as InternalKeyResultRef[];

  const params = await searchParams;
  const projectId = params.project;

  // ── Detail (kanban) view ─────────────────────────────────────────────────
  if (projectId) {
    const [
      { data: projectData },
      { data: tasksData },
      { data: projAssignees },
      { data: timeTracksData },
    ] = await Promise.all([
      supabase
        .from("internal_project")
        .select(PROJECT_COLUMNS)
        .eq("id", projectId)
        .single(),
      supabase
        .from("internal_project_task")
        .select(TASK_COLUMNS)
        .eq("internal_project_id", projectId)
        .order("order", { ascending: true })
        .limit(TASKS_LIMIT),
      supabase
        .from("internal_project_assignees")
        .select("internal_project_id, user_id")
        .eq("internal_project_id", projectId)
        .limit(ASSIGNEES_LIMIT),
      supabase
        .from("internal_project_task_time_track")
        .select(TIME_TRACK_COLUMNS)
        .eq("internal_project_id", projectId)
        .limit(TIME_TRACKS_LIMIT),
    ]);

    if (!projectData) redirect("/internal-projects");

    const project = projectData as unknown as InternalProject;
    const tasks = (tasksData ?? []) as unknown as InternalTask[];
    const timeTracks = (timeTracksData ?? []) as unknown as InternalTaskTimeTrack[];

    return (
      <PageShell profile={profile} fullBleed flush>
        <InternalProjectKanban
            project={project}
            tasks={tasks}
            profiles={profiles}
            projectAssignees={
              (projAssignees ?? []) as InternalProjectAssignee[]
            }
            timeTracks={timeTracks}
            keyResults={keyResults}
            currentUserId={userId}
          />
      </PageShell>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────
  const [{ data: projectsData }, { data: assigneesData }] = await Promise.all([
    supabase
      .from("internal_project")
      .select(PROJECT_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(PROJECTS_LIMIT),
    supabase
      .from("internal_project_assignees")
      .select("internal_project_id, user_id")
      .limit(ASSIGNEES_LIMIT),
  ]);

  const projects = (projectsData ?? []) as unknown as InternalProject[];
  const assignees = (assigneesData ?? []) as InternalProjectAssignee[];

  return (
    <PageShell profile={profile} flush>
      <div className="px-6 pt-6 pb-4 border-b border-border shrink-0">
        <PageHeader
          title="Internal Projects"
          subtitle={`${projects.length} project${projects.length !== 1 ? "s" : ""}`}
          compact
        />
      </div>
      <InternalProjectsList
        projects={projects}
        profiles={profiles}
        assignees={assignees}
        keyResults={keyResults}
      />
    </PageShell>
  );
}
