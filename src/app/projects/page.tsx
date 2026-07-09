import { redirect } from "next/navigation";
import { requirePageAccess } from "@/lib/auth/page-gate";
import type { Project, Task, UserType, TabKey, UserProfile } from "@/types/projects";
import PageShell from "@/components/layout/PageShell";
import PageHeader from "@/components/layout/PageHeader";
import ProjectsList from "./_components/ProjectsList";
import ProjectDetail from "./_components/ProjectDetail";

type TaskProgress = { totalEst: number; doneOrQaEst: number; doneEst: number };

interface PageProps {
  searchParams: Promise<{ project?: string; tab?: string }>;
}

export default async function ProjectsPage({ searchParams }: PageProps) {
  // Gate: admin/manager/operational/developer/qa/client. referrer + lead are
  // bounced via the shared helper.
  const { supabase, userId, role } = await requirePageAccess([
    "admin",
    "manager",
    "operational",
    "developer",
    "qa",
    "client",
  ]);

  // Fetch user profile (needed by Sidebar at the bottom).
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, picture, type")
    .eq("id", userId)
    .single();

  const userType = role as UserType;

  // Fetch all profiles for user pickers in modals
  const { data: profilesData } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, picture, type");
  const profiles = (profilesData ?? []) as unknown as UserProfile[];

  const params = await searchParams;
  const projectId = params.project;
  const tabParam = params.tab as TabKey | undefined;

  // ── Project detail view ────────────────────────────────────────────────────
  if (projectId) {
    const [{ data: projectData }, { data: tasksData }, { data: unreadData }] = await Promise.all([
      supabase
        .from("project")
        .select("id, name, picture, status, description, start_date_real, end_date_real, start_date_estimated, end_date_estimated, estimated_time, real_time, authorized_users, change_automatically_project_estimated_time, change_automatically_milestone_estimated_time, change_automatically_project_start_end_dates, change_automatically_milestone_start_end_dates, created_at, general_requests_estimated_time, general_requests_real_time")
        .eq("id", projectId)
        .single(),
      supabase
        .from("project_task")
        .select("id, project_id, parent_task_id, name, order, start_date_estimated, end_date_estimated, start_date_real, end_date_real, real_time, estimated_time, type, level, status, priority_level, category, description, assignees, created_by")
        .eq("project_id", projectId),
      supabase
        .from("project_task_comment")
        .select("task_id, viewed_by")
        .eq("project_id", projectId)
        // task_comment.owner_id → created_by (B8 item 32).
        .neq("created_by", userId),
    ]);

    if (!projectData) {
      redirect("/projects");
    }

    const project = projectData as unknown as Project;
    // Hydrate the `assignees` UUID array into the legacy `task_assignees:
    // [{ user_id, profiles }]` shape the UI consumers expect (Part 2
    // item 10/34). Done client-side via a single profiles fetch instead
    // of a per-task embed.
    const rawTasks = (tasksData ?? []) as unknown as Array<Record<string, unknown> & { assignees?: string[] }>;
    const allAssigneeIds = Array.from(
      new Set(rawTasks.flatMap((t) => (t.assignees ?? []) as string[]))
    );
    const assigneeProfilesById = new Map<string, { id: string; first_name: string | null; last_name: string | null; picture: string | null }>();
    if (allAssigneeIds.length > 0) {
      const { data: assigneeProfiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, picture")
        .in("id", allAssigneeIds);
      for (const p of (assigneeProfiles ?? []) as Array<{ id: string; first_name: string | null; last_name: string | null; picture: string | null }>) {
        assigneeProfilesById.set(p.id, p);
      }
    }
    const tasks = rawTasks.map((t) => ({
      ...t,
      task_assignees: ((t.assignees ?? []) as string[]).map((uid) => ({
        user_id: uid,
        profiles: assigneeProfilesById.get(uid) ?? null,
      })),
    })) as unknown as Task[];

    const unreadByTaskId: Record<string, number> = {};
    for (const row of (unreadData ?? []) as { task_id: string; viewed_by: string[] | null }[]) {
      if ((row.viewed_by ?? []).includes(userId)) continue;
      unreadByTaskId[row.task_id] = (unreadByTaskId[row.task_id] ?? 0) + 1;
    }

    const validTabs: TabKey[] = ["developer", "client_requests"];
    const initialTab: TabKey = validTabs.includes(tabParam as TabKey) ? (tabParam as TabKey) : "developer";

    return (
      <PageShell profile={profile} fullBleed flush>
        <ProjectDetail
          project={project}
          tasks={tasks}
          userType={userType}
          initialTab={initialTab}
          profiles={profiles}
          currentUserId={userId}
          unreadByTaskId={unreadByTaskId}
        />
      </PageShell>
    );
  }

  // ── Projects list view ─────────────────────────────────────────────────────
  const [{ data: projectsData }, { data: taskAggData }] = await Promise.all([
    supabase
      .from("project")
      .select("id, name, picture, status, description, start_date_real, end_date_real, start_date_estimated, end_date_estimated, estimated_time, real_time, authorized_users, change_automatically_project_estimated_time, change_automatically_milestone_estimated_time, change_automatically_project_start_end_dates, change_automatically_milestone_start_end_dates, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("project_task")
      .select("project_id, status, estimated_time")
      .not("project_id", "is", null),
  ]);

  const projects = (projectsData ?? []) as unknown as Project[];

  const taskProgressMap: Record<string, TaskProgress> = {};
  for (const t of (taskAggData ?? []) as { project_id: string; status: string; estimated_time: number | null }[]) {
    if (!t.project_id) continue;
    if (!taskProgressMap[t.project_id]) {
      taskProgressMap[t.project_id] = { totalEst: 0, doneOrQaEst: 0, doneEst: 0 };
    }
    const est = t.estimated_time ?? 0;
    taskProgressMap[t.project_id].totalEst += est;
    if (t.status === "done" || t.status === "ready_for_qa") {
      taskProgressMap[t.project_id].doneOrQaEst += est;
    }
    if (t.status === "done") {
      taskProgressMap[t.project_id].doneEst += est;
    }
  }

  return (
    <PageShell profile={profile} flush>
      <div className="px-6 pt-6 pb-4 border-b border-border shrink-0">
        <PageHeader
          title="Projects"
          subtitle={`${projects.length} project${projects.length !== 1 ? "s" : ""}`}
          compact
        />
      </div>
      <ProjectsList projects={projects} userType={userType} profiles={profiles} taskProgressMap={taskProgressMap} />
    </PageShell>
  );
}
