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
    .select("id, first_name, last_name, picture, type");
  const profiles = (profilesData ?? []) as unknown as UserProfile[];

  // Internal key results for the project modal multi-select.
  const { data: keyResultsData } = await supabase
    .from("internal_key_result")
    .select("id, name, internal_goal_id")
    .order("name", { ascending: true });
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
        .select("*")
        .eq("id", projectId)
        .single(),
      supabase
        .from("internal_project_task")
        .select("*")
        .eq("internal_project_id", projectId)
        .order("order", { ascending: true }),
      supabase
        .from("internal_project_assignees")
        .select("internal_project_id, user_id")
        .eq("internal_project_id", projectId),
      supabase
        .from("internal_project_task_time_track")
        .select("*")
        .eq("internal_project_id", projectId),
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
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("internal_project_assignees")
      .select("internal_project_id, user_id"),
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
