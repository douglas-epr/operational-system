"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserWithRole } from "@/lib/auth/current-user";
import { pick } from "@/lib/pick";
import type {
  ProjectStatus,
  TaskStatus,
  TaskType,
  TaskLevel,
  TaskPriority,
  TaskCategory,
} from "@/types/projects";

// ── Project CRUD ──────────────────────────────────────────────────────────────

export interface ProjectInput {
  name: string;
  status: ProjectStatus;
  estimated_time: number | null;
  real_time: number | null;
  start_date_estimated: string | null;
  end_date_estimated: string | null;
  start_date_real: string | null;
  end_date_real: string | null;
  description: string | null;
  authorized_users: string[];
  change_automatically_project_estimated_time: boolean;
  change_automatically_milestone_estimated_time: boolean;
  change_automatically_project_start_end_dates: boolean;
  change_automatically_milestone_start_end_dates: boolean;
}

export async function createProject(data: ProjectInput): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  // Always set the creator and ensure they are a member — otherwise project
  // visibility RLS locks the creating manager out of their own project.
  const authorized_users = Array.from(new Set([...(data.authorized_users ?? []), user.id]));
  const { data: row, error } = await supabase
    .from("project")
    .insert({ ...data, authorized_users, created_by: user.id })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/projects");
  return { id: row.id };
}

export async function updateProject(
  id: string,
  data: Partial<ProjectInput>
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { error } = await supabase.from("project").update(data).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/projects");
  return {};
}

export async function deleteProject(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { error } = await supabase.from("project").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/projects");
  return {};
}

// ── Task CRUD ─────────────────────────────────────────────────────────────────

export interface TaskInput {
  name: string;
  project_id: string;
  parent_task_id: string | null;
  type: TaskType;
  level: TaskLevel;
  status: TaskStatus;
  estimated_time: number | null;
  start_date_estimated: string | null;
  end_date_estimated: string | null;
  start_date_real: string | null;
  end_date_real: string | null;
  order: number | null;
  assignee_ids: string[];
  priority_level?: TaskPriority | null;
  category?: TaskCategory | null;
  description?: string | null;
}

export async function createTask(data: TaskInput): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { assignee_ids, priority_level, category, ...taskData } = data;

  // assignees is now a UUID[] column on task — write the array directly,
  // no separate join-table insert. (Part 2 item 10 + 31.)
  // created_by is required so that client/QA delete-own RLS works.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: row, error } = await (supabase as any)
    .from("project_task")
    .insert({ ...taskData, assignees: assignee_ids, created_by: user.id, priority_level: priority_level ?? null, category: category ?? null })
    .select("id")
    .single();
  if (error) return { error: error.message };

  // Recalculate aggregates after creating a task
  if (data.project_id) {
    await recalculateAggregates(data.project_id);
  }

  revalidatePath("/projects");
  return { id: row.id };
}

// Columns `updateTask` may write on `project_task`. Deliberately excludes
// `project_id` (re-parenting a task to another project is not a supported
// edit — every legitimate caller already sends the task's current
// `project_id` unchanged) alongside `id`/`created_by`. `assignees`,
// `priority_level`, and `category` are merged in separately below.
const TASK_UPDATE_WRITABLE_COLUMNS = [
  "name",
  "parent_task_id",
  "type",
  "level",
  "status",
  "estimated_time",
  "start_date_estimated",
  "end_date_estimated",
  "start_date_real",
  "end_date_real",
  "order",
  "description",
] as const;

export async function updateTask(
  id: string,
  data: Partial<TaskInput>
): Promise<{ error?: string }> {
  const current = await getCurrentUserWithRole();
  if (!current) return { error: "Not authenticated" };
  const { supabase } = current;
  const { assignee_ids, priority_level, category, ...taskData } = data;

  // Merge the assignees write into the same UPDATE — one round-trip.
  const updatePayload: Record<string, unknown> = pick(taskData, TASK_UPDATE_WRITABLE_COLUMNS);
  if (assignee_ids !== undefined) updatePayload.assignees = assignee_ids;
  if (priority_level !== undefined) updatePayload.priority_level = priority_level;
  if (category !== undefined) updatePayload.category = category;
  if (Object.keys(updatePayload).length > 0) {
    const { error } = await supabase.from("project_task").update(updatePayload).eq("id", id);
    if (error) return { error: error.message };
  }

  // Recalculate aggregates if estimated_time or dates changed
  if (taskData.estimated_time !== undefined || taskData.start_date_estimated !== undefined || taskData.end_date_estimated !== undefined) {
    // Fetch project_id for this task
    const { data: taskRow } = await supabase.from("project_task").select("project_id").eq("id", id).single();
    if (taskRow?.project_id) {
      await recalculateAggregates(taskRow.project_id);
    }
  }

  revalidatePath("/projects");
  return {};
}

export async function deleteTask(id: string): Promise<{ error?: string }> {
  const current = await getCurrentUserWithRole();
  if (!current) return { error: "Not authenticated" };
  const { supabase } = current;

  // 1. Fetch task to get project_id
  const { data: task } = await supabase.from("project_task").select("id, project_id").eq("id", id).single();
  if (!task) return { error: "Task not found" };

  // 2. Collect all descendant IDs - fetch all project tasks at once for speed
  const { data: allProjectTasks } = await supabase
    .from("project_task")
    .select("id, parent_task_id")
    .eq("project_id", task.project_id!);

  const byParent = new Map<string, string[]>();
  for (const t of allProjectTasks ?? []) {
    if (t.parent_task_id) {
      const arr = byParent.get(t.parent_task_id) ?? [];
      arr.push(t.id);
      byParent.set(t.parent_task_id, arr);
    }
  }

  const allIds: string[] = [];
  const queue = [id];
  while (queue.length > 0) {
    const parentId = queue.shift()!;
    allIds.push(parentId);
    for (const childId of byParent.get(parentId) ?? []) queue.push(childId);
  }

  // 3. Delete related data in parallel, then tasks. `task_assignees` was
  //    dropped in Part 2 item 34 — assignees now live as a UUID[] on the
  //    task row itself, deleted automatically with the task.
  await Promise.all([
    supabase.from("project_task_comment").delete().in("task_id", allIds),
    supabase.from("project_task_time_track").delete().in("task_id", allIds),
  ]);

  // Nullify parent references then batch delete
  await supabase.from("project_task").update({ parent_task_id: null }).in("id", allIds);
  await supabase.from("project_task").delete().in("id", allIds);

  // 4. Recalculate aggregates in parallel
  if (task.project_id) {
    await Promise.all([
      recalculateAggregates(task.project_id),
      recalculateRealTime(task.project_id),
    ]);
  }

  revalidatePath("/projects");
  return {};
}

// ── Aggregation Utilities ────────────────────────────────────────────────────

/**
 * Bottom-up rollup of estimated_time and estimated dates through the task
 * hierarchy, plus project-level aggregates for client_requests and qa_requests
 * (replacing the previous per-milestone rollup tables). Estimated-time writes
 * on `project` are gated by `change_automatically_project_estimated_time`.
 * `qa_tester_estimated_time` is user-entered and never overwritten here.
 */
export async function recalculateAggregates(projectId: string): Promise<void> {
  const current = await getCurrentUserWithRole();
  if (!current) return;
  const { supabase } = current;

  // Fetch project flags + the user-entered aggregate estimates
  const { data: project } = await supabase
    .from("project")
    .select("id, change_automatically_project_estimated_time, change_automatically_milestone_estimated_time, change_automatically_project_start_end_dates, change_automatically_milestone_start_end_dates, general_requests_estimated_time")
    .eq("id", projectId)
    .single();
  if (!project) return;
  const p = project as {
    change_automatically_project_estimated_time: boolean;
    change_automatically_milestone_estimated_time: boolean;
    change_automatically_project_start_end_dates: boolean;
    change_automatically_milestone_start_end_dates: boolean;
    general_requests_estimated_time: number | null;
  };
  const generalRequestsEst = p.general_requests_estimated_time ?? 0;

  // Fetch all tasks for the project
  const { data: tasks } = await supabase
    .from("project_task")
    .select("id, parent_task_id, level, type, estimated_time, start_date_estimated, end_date_estimated")
    .eq("project_id", projectId);
  if (!tasks) return;

  // Build parent→children map
  const byParent = new Map<string, typeof tasks>();
  const taskMap = new Map<string, (typeof tasks)[0]>();
  for (const t of tasks) {
    taskMap.set(t.id, t);
    if (t.parent_task_id) {
      const arr = byParent.get(t.parent_task_id) ?? [];
      arr.push(t);
      byParent.set(t.parent_task_id, arr);
    }
  }

  // Bottom-up rollup: process leaf tasks first, then parents
  const order: string[] = [];
  const visited = new Set<string>();
  function visit(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    const children = byParent.get(id) ?? [];
    for (const c of children) visit(c.id);
    order.push(id);
  }
  for (const t of tasks) visit(t.id);

  // First pass: rollup developer_tasks tree (non-milestone parents sum their children)
  const updates: { id: string; estimated_time?: number | null; start_date_estimated?: string | null; end_date_estimated?: string | null }[] = [];

  for (const id of order) {
    const t = taskMap.get(id)!;
    const children = byParent.get(id) ?? [];
    if (children.length === 0) continue; // leaf — skip

    const isMilestone = t.level === "level_1";

    // Skip milestones in this first pass — handle them below
    if (isMilestone) continue;

    // Non-milestone parents: always sum children
    const update: (typeof updates)[0] = { id };
    let changed = false;

    const estSum = children.reduce((s, c) => s + (c.estimated_time ?? 0), 0);
    const newEst = estSum || null;
    if (t.estimated_time !== newEst) {
      update.estimated_time = newEst;
      t.estimated_time = newEst;
      changed = true;
    }

    const starts = children.map((c) => c.start_date_estimated).filter(Boolean) as string[];
    const ends = children.map((c) => c.end_date_estimated).filter(Boolean) as string[];
    const minStart = starts.length > 0 ? starts.sort()[0] : null;
    const maxEnd = ends.length > 0 ? ends.sort().reverse()[0] : null;
    if (t.start_date_estimated !== minStart) {
      update.start_date_estimated = minStart;
      t.start_date_estimated = minStart;
      changed = true;
    }
    if (t.end_date_estimated !== maxEnd) {
      update.end_date_estimated = maxEnd;
      t.end_date_estimated = maxEnd;
      changed = true;
    }

    if (changed) updates.push(update);
  }

  // Batch task updates for non-milestone parents
  await Promise.all(updates.map(({ id: taskId, ...data }) =>
    Object.keys(data).length > 0 ? supabase.from("project_task").update(data).eq("id", taskId) : Promise.resolve()
  ));

  // Milestone-level rollup: estimated_time = sum(developer_tasks direct children)
  const milestones = tasks.filter((t) => t.level === "level_1" && !t.parent_task_id);

  for (const m of milestones) {
    const childTasks = byParent.get(m.id) ?? [];

    if (p.change_automatically_milestone_estimated_time) {
      const devTasksEst = childTasks
        .filter((c) => c.type === "developer_tasks")
        .reduce((s, c) => s + (taskMap.get(c.id)!.estimated_time ?? 0), 0);
      const newMilestoneEst = devTasksEst || null;
      if (m.estimated_time !== newMilestoneEst) {
        await supabase.from("project_task").update({ estimated_time: newMilestoneEst }).eq("id", m.id);
        taskMap.get(m.id)!.estimated_time = newMilestoneEst;
      }
    }

    if (p.change_automatically_milestone_start_end_dates) {
      const devChildren = childTasks.filter((c) => c.type === "developer_tasks");
      const starts = devChildren.map((c) => c.start_date_estimated).filter(Boolean) as string[];
      const ends = devChildren.map((c) => c.end_date_estimated).filter(Boolean) as string[];
      const minStart = starts.length > 0 ? starts.sort()[0] : null;
      const maxEnd = ends.length > 0 ? ends.sort().reverse()[0] : null;
      const milestoneData: Record<string, unknown> = {};
      if (m.start_date_estimated !== minStart) milestoneData.start_date_estimated = minStart;
      if (m.end_date_estimated !== maxEnd) milestoneData.end_date_estimated = maxEnd;
      if (Object.keys(milestoneData).length > 0) {
        await supabase.from("project_task").update(milestoneData).eq("id", m.id);
        if (milestoneData.start_date_estimated !== undefined) taskMap.get(m.id)!.start_date_estimated = milestoneData.start_date_estimated as string | null;
        if (milestoneData.end_date_estimated !== undefined) taskMap.get(m.id)!.end_date_estimated = milestoneData.end_date_estimated as string | null;
      }
    }
  }

  // Project-level aggregates.
  // general_requests_estimated_time is user-entered on the project row — never overwritten from task sums.
  const projectUpdate: Record<string, unknown> = {};

  if (p.change_automatically_project_estimated_time) {
    const milestonesSum = milestones.reduce((s, m) => s + (taskMap.get(m.id)!.estimated_time ?? 0), 0);
    const total = milestonesSum + generalRequestsEst;
    projectUpdate.estimated_time = total || null;
  }
  if (p.change_automatically_project_start_end_dates) {
    const starts = milestones.map((m) => taskMap.get(m.id)!.start_date_estimated).filter(Boolean) as string[];
    const ends = milestones.map((m) => taskMap.get(m.id)!.end_date_estimated).filter(Boolean) as string[];
    projectUpdate.start_date_estimated = starts.length > 0 ? starts.sort()[0] : null;
    projectUpdate.end_date_estimated = ends.length > 0 ? ends.sort().reverse()[0] : null;
  }
  if (Object.keys(projectUpdate).length > 0) {
    await supabase.from("project").update(projectUpdate).eq("id", projectId);
  }
}

/**
 * Recalculates real_time + real dates on every task, milestone.real_time,
 * project.real_time, and the three project-level real-time aggregates
 * (`client_developer_real_time`, `qa_developer_real_time`,
 * `qa_tester_real_time`). Real-time updates always reflect the current
 * time_track / qa_time_track state — no gating flag.
 */
export async function recalculateRealTime(projectId: string): Promise<void> {
  const current = await getCurrentUserWithRole();
  if (!current) return;
  const { supabase } = current;

  const { data: tasks } = await supabase
    .from("project_task")
    .select("id, parent_task_id, level, type")
    .eq("project_id", projectId);
  if (!tasks) return;

  const { data: timeEntries } = await supabase
    .from("project_task_time_track")
    .select("task_id, time_spent_h, start_date")
    .eq("project_id", projectId);
  const ttEntries = timeEntries ?? [];
  const taskById = new Map(tasks.map((t) => [t.id, t]));

  // Per-task aggregation from time_track (own entries only)
  const taskTimeMap = new Map<string, { total: number; minDate: string | null; maxDate: string | null }>();
  for (const e of ttEntries) {
    if (!e.task_id) continue;
    const cur = taskTimeMap.get(e.task_id) ?? { total: 0, minDate: null, maxDate: null };
    cur.total += e.time_spent_h ?? 0;
    if (e.start_date) {
      if (!cur.minDate || e.start_date < cur.minDate) cur.minDate = e.start_date;
      if (!cur.maxDate || e.start_date > cur.maxDate) cur.maxDate = e.start_date;
    }
    taskTimeMap.set(e.task_id, cur);
  }

  // Subtree min/max start_date: task's own entries, plus descendants' entries.
  // Build parent→children map and process bottom-up.
  const byParent = new Map<string, typeof tasks>();
  for (const t of tasks) {
    if (t.parent_task_id) {
      const arr = byParent.get(t.parent_task_id) ?? [];
      arr.push(t);
      byParent.set(t.parent_task_id, arr);
    }
  }
  const postOrder: string[] = [];
  const seen = new Set<string>();
  const walk = (id: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    for (const c of byParent.get(id) ?? []) walk(c.id);
    postOrder.push(id);
  };
  for (const t of tasks) walk(t.id);

  const subtreeDates = new Map<string, { minDate: string | null; maxDate: string | null }>();
  const minStr = (a: string | null, b: string | null) =>
    !a ? b : !b ? a : a < b ? a : b;
  const maxStr = (a: string | null, b: string | null) =>
    !a ? b : !b ? a : a > b ? a : b;
  for (const id of postOrder) {
    const own = taskTimeMap.get(id);
    let minD: string | null = own?.minDate ?? null;
    let maxD: string | null = own?.maxDate ?? null;
    for (const c of byParent.get(id) ?? []) {
      const sub = subtreeDates.get(c.id);
      minD = minStr(minD, sub?.minDate ?? null);
      maxD = maxStr(maxD, sub?.maxDate ?? null);
    }
    subtreeDates.set(id, { minDate: minD, maxDate: maxD });
  }

  await Promise.all(tasks.map((t) => {
    const agg = taskTimeMap.get(t.id);
    const sub = subtreeDates.get(t.id);
    return supabase.from("project_task").update({
      real_time: agg ? agg.total : 0,
      start_date_real: sub?.minDate ?? null,
      end_date_real: sub?.maxDate ?? null,
    }).eq("id", t.id);
  }));

  // Milestone-level real_time: sum of level_2 task real_time + qa_time_track under milestone
  const milestones = tasks.filter((t) => t.level === "level_1" && !t.parent_task_id);

  const milestoneTaskIds = new Map<string, Set<string>>();
  for (const m of milestones) milestoneTaskIds.set(m.id, new Set());
  for (const t of tasks) {
    if (!t.parent_task_id) continue;
    let current = t;
    while (current.parent_task_id && taskById.has(current.parent_task_id)) {
      const parent = taskById.get(current.parent_task_id)!;
      if (parent.level === "level_1") {
        milestoneTaskIds.get(parent.id)?.add(t.id);
        break;
      }
      current = parent;
    }
  }

  for (const m of milestones) {
    const descIds = milestoneTaskIds.get(m.id) ?? new Set();
    const level2RealTime = [...descIds]
      .filter((tid) => taskById.get(tid)?.level === "level_2")
      .reduce((s, tid) => s + (taskTimeMap.get(tid)?.total ?? 0), 0);
    await supabase.from("project_task").update({ real_time: level2RealTime || 0 }).eq("id", m.id);
  }

  // Project-level real-time aggregates
  const clientDeveloperReal = ttEntries
    .filter((e) => e.task_id && taskById.get(e.task_id)?.type === "client_requests")
    .reduce((s, e) => s + (e.time_spent_h ?? 0), 0);

  // Project-level start/end real dates: min/max over all time_track entries.
  let projectMin: string | null = null;
  let projectMax: string | null = null;
  for (const e of ttEntries) {
    if (!e.start_date) continue;
    if (!projectMin || e.start_date < projectMin) projectMin = e.start_date;
    if (!projectMax || e.start_date > projectMax) projectMax = e.start_date;
  }

  const projectUpdate: Record<string, unknown> = {
    general_requests_real_time: clientDeveloperReal || null,
    start_date_real: projectMin,
    end_date_real: projectMax,
  };

  const { data: updatedMilestones } = await supabase
    .from("project_task")
    .select("id, real_time")
    .eq("project_id", projectId)
    .eq("level", "level_1")
    .is("parent_task_id", null);
  projectUpdate.real_time = (updatedMilestones ?? []).reduce((s, m) => s + (m.real_time ?? 0), 0);

  await supabase.from("project").update(projectUpdate).eq("id", projectId);
}

// ── Project-level aggregate estimated time (user-entered) ────────────────────

type ProjectAggregateEstField =
  | "general_requests_estimated_time"
  | "estimated_time";

export async function updateProjectAggregateEstimate(
  projectId: string,
  field: ProjectAggregateEstField,
  value: number | null
): Promise<{ error?: string }> {
  const current = await getCurrentUserWithRole();
  if (!current) return { error: "Not authenticated" };
  const { supabase } = current;
  const { error } = await supabase
    .from("project")
    .update({ [field]: value })
    .eq("id", projectId);
  if (error) return { error: error.message };
  // Editing an aggregate Est may update project.estimated_time via the flag.
  // Skip recalculation when the user directly sets project.estimated_time.
  if (field !== "estimated_time") {
    await recalculateAggregates(projectId);
  }
  revalidatePath("/projects");
  return {};
}

// ── Developer Time Track ──────────────────────────────────────────────────────

export interface TimeEntryInput {
  id?: string;
  task_id: string;
  project_id: string;
  start_date: string;
  start_time_min: number;
  end_time_min: number;
  time_spent_h: number;
}

export async function upsertTimeEntry(entry: TimeEntryInput): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const payload = {
    // time_track.owner_id was renamed to assignee_id in B8 (item 33).
    assignee_id: user.id,
    task_id: entry.task_id,
    project_id: entry.project_id,
    start_date: entry.start_date,
    start_time_min: entry.start_time_min,
    end_time_min: entry.end_time_min,
    time_spent_h: entry.time_spent_h,
  };

  if (entry.id) {
    const { error } = await supabase.from("project_task_time_track").update(payload).eq("id", entry.id);
    if (error) return { error: error.message };
    await recalculateRealTime(entry.project_id);
    revalidatePath("/projects");
    return { id: entry.id };
  }

  const { data: row, error } = await supabase
    .from("project_task_time_track")
    .insert(payload)
    .select("id")
    .single();
  if (error) return { error: error.message };
  await recalculateRealTime(entry.project_id);
  revalidatePath("/projects");
  return { id: row.id };
}

export async function deleteTimeEntry(id: string, projectId: string): Promise<{ error?: string }> {
  const current = await getCurrentUserWithRole();
  if (!current) return { error: "Not authenticated" };
  const { supabase } = current;
  const { error } = await supabase.from("project_task_time_track").delete().eq("id", id);
  if (error) return { error: error.message };
  await recalculateRealTime(projectId);
  revalidatePath("/projects");
  return {};
}

export async function getTaskComments(taskId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_task_comment")
    // owner_id → created_by, edited_at → updated_at (B8 item 32).
    .select("id, task_id, project_id, created_by, message, attachments, updated_at, created_at, profiles(id, first_name, last_name, picture)")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });
  return (data ?? []) as unknown as import("@/types/projects").TaskComment[];
}

export async function createTaskComment(
  taskId: string,
  projectId: string,
  message: string,
  attachments: import("@/types/projects").TaskCommentAttachment[] = []
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { data: row, error } = await supabase
    .from("project_task_comment")
    .insert({
      task_id: taskId,
      project_id: projectId,
      // owner_id → created_by (B8 item 32)
      created_by: user.id,
      message,
      attachments: attachments as unknown as import("@/lib/supabase/types").Json,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  return { id: row.id };
}

export async function updateTaskComment(
  id: string,
  message: string,
  attachments: import("@/types/projects").TaskCommentAttachment[]
): Promise<{ error?: string }> {
  const current = await getCurrentUserWithRole();
  if (!current) return { error: "Not authenticated" };
  const { supabase } = current;
  const { error } = await supabase
    .from("project_task_comment")
    .update({
      message,
      attachments: attachments as unknown as import("@/lib/supabase/types").Json,
      // edited_at → updated_at (B8). The trigger keeps it fresh too.
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: error.message };
  return {};
}

export async function markTaskCommentsViewed(taskId: string): Promise<{ error?: string }> {
  const current = await getCurrentUserWithRole();
  if (!current) return { error: "Not authenticated" };
  const { supabase } = current;
  const { error } = await supabase.rpc("mark_task_comments_viewed", { p_task_id: taskId });
  if (error) return { error: error.message };
  revalidatePath("/projects");
  return {};
}

export async function deleteTaskComment(id: string): Promise<{ error?: string }> {
  const current = await getCurrentUserWithRole();
  if (!current) return { error: "Not authenticated" };
  const { supabase } = current;
  const { data: existing } = await supabase
    .from("project_task_comment")
    .select("attachments")
    .eq("id", id)
    .single();
  const attachments = (existing?.attachments ?? []) as unknown as import("@/types/projects").TaskCommentAttachment[];
  const paths = Array.isArray(attachments) ? attachments.map((a) => a.path).filter(Boolean) : [];
  if (paths.length > 0) {
    await supabase.storage.from("task-comment-attachments").remove(paths);
  }
  const { error } = await supabase
    .from("project_task_comment")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  return {};
}

export async function getTaskTimeEntries(taskId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_task_time_track")
    // time_track.owner_id was renamed to assignee_id in B8 (item 33).
    .select("id, assignee_id, task_id, project_id, start_date, start_time_min, end_time_min, time_spent_h, profiles(id, first_name, last_name, picture)")
    .eq("task_id", taskId)
    .order("start_date", { ascending: true });
  return (data ?? []) as unknown as import("@/types/projects").TimeTrack[];
}

// ── Import tasks from an idea ─────────────────────────────────────────────────
//
// The Sandbox Planner stores per-idea milestone + task plans as one HTML
// document in `idea_milestones_and_tasks.content`. Managers want to bulk-
// create those rows under a project's Developer Tasks kanban without
// having to type every task. This action does a one-shot import:
//
//   1. Auth-gate to admin/manager.
//   2. Show the same idea-picker as the playbook button (linked first,
//      unassigned fallback) — list comes via the shared
//      `listIdeasForProjectPicker` helper.
//   3. AI-parse the picked idea's `content` HTML into a structured
//      { milestones: [{ name, tasks: [...] }] } shape.
//   4. INSERT one `task` row per milestone (level_1) + one per task
//      (level_2, parent_task_id = milestone). Append after any existing
//      developer-tasks milestones (compute MAX("order") first).
//   5. Recalculate project aggregates and revalidate `/projects`.

import {
  listIdeasForProjectPicker as listIdeasForProjectPickerImpl,
  type IdeaPickerResult,
} from "@/lib/data/ideaPicker";
import { resolveAiConfig } from "@/lib/api/ai-config";
import { generateAiJsonResponse } from "@/lib/api/ai-dispatcher";
import { createServiceClient } from "@/lib/supabase/server";

interface ParsedTask {
  name: string;
  estimated_time_minutes: number | null;
  description: string | null;
  task_type?: string;
}
interface ParsedMilestone {
  name: string;
  estimated_time_minutes: number | null;
  tasks: ParsedTask[];
}
interface ParsedImport {
  milestones: ParsedMilestone[];
}

export async function listIdeasForDeveloperTasksPicker(
  projectId: string
): Promise<{ data?: IdeaPickerResult; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { data: profile } = await supabase
    .from("profiles")
    .select("type")
    .eq("id", user.id)
    .single();
  const role = (profile as { type?: string | null } | null)?.type ?? null;
  if (role !== "admin" && role !== "manager") {
    return { error: "Only admins and managers can import tasks." };
  }
  const data = await listIdeasForProjectPickerImpl(supabase, projectId);
  return { data };
}

const IMPORT_TASKS_PROMPT_ID = "c1d2e3f4-0002-4000-8000-000000000001";

async function getImportTasksPrompt(): Promise<string> {
  try {
    const sb = createServiceClient();
    const { data } = await sb
      .from("prompt")
      .select("description")
      .eq("id", IMPORT_TASKS_PROMPT_ID)
      .maybeSingle();
    const desc = (data as { description: string | null } | null)?.description;
    if (desc?.trim()) return desc;
  } catch {
    // fall through to hardcoded fallback
  }
  return IMPORT_PROMPT_HEADER;
}

const IMPORT_PROMPT_HEADER = `You are an HTML-to-JSON parser for project plans.

The user will paste an HTML document that contains a list of project
MILESTONES and the TASKS under each milestone. Some documents are
hierarchical headings + lists; others are tables; treat both shapes the
same.

Return EXACTLY one JSON object with this shape:

{
  "milestones": [
    {
      "name": <string>,
      "estimated_time_minutes": <number|null>,
      "tasks": [
        {
          "name": <string>,
          "estimated_time_minutes": <number|null>,
          "description": <string|null>
        }
      ]
    }
  ]
}

Rules:
- Preserve the document's milestone and task order.
- If a number is given in hours, convert it to minutes (e.g. "2h" → 120).
- Use null when a number is not given. Do not guess.
- "description" is optional context the user wrote about a task; trim
  whitespace and HTML tags. Null if nothing.
- Output JSON only — no prose, no markdown fences.

The HTML follows after this line:
`;

export async function importTasksFromIdea(
  projectId: string,
  ideaId: string
): Promise<{
  error?: string;
  created?: { milestones: number; tasks: number };
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("type")
    .eq("id", user.id)
    .single();
  const role = (profile as { type?: string | null } | null)?.type ?? null;
  if (role !== "admin" && role !== "manager") {
    return { error: "Only admins and managers can import tasks." };
  }

  // 1. Pull the idea's milestones-and-tasks block.
  const { data: mtRow, error: mtErr } = await supabase
    .from("idea_milestones_and_tasks")
    .select("content")
    .eq("idea_id", ideaId)
    .maybeSingle();
  if (mtErr) return { error: mtErr.message };
  const content = (mtRow as { content: string | null } | null)?.content ?? "";
  if (!content.trim()) {
    return {
      error: "This idea doesn't have a Milestones & Tasks block yet. Generate one in Sandbox Planner first.",
    };
  }

  // 2. Resolve the caller's AI config (user_ai_settings → OPENAI_API_KEY).
  const ai = await resolveAiConfig(supabase, user.id);
  if (!ai) {
    return {
      error: "No AI provider configured. Set one in Settings → AI Configuration first.",
    };
  }

  // 3. Parse via the LLM in JSON mode.
  const importPrompt = await getImportTasksPrompt();
  const parseRes = await generateAiJsonResponse<ParsedImport>({
    service: ai.service,
    apiKey: ai.apiKey,
    model: ai.model,
    prompt: importPrompt + content,
  });
  if (parseRes.returned_an_error || !parseRes.data) {
    return { error: `AI parse failed: ${parseRes.error ?? "unknown"}` };
  }
  const parsed = parseRes.data;
  const milestones = Array.isArray(parsed.milestones) ? parsed.milestones : [];
  if (milestones.length === 0) {
    return { error: "AI parse returned no milestones — try regenerating the Sandbox Planner block." };
  }

  // 4. Compute the next "order" so imports append below existing milestones.
  const { data: existingMs } = await supabase
    .from("project_task")
    .select("\"order\"")
    .eq("project_id", projectId)
    .eq("type", "developer_tasks")
    .eq("level", "level_1")
    .is("parent_task_id", null);
  const currentMax = ((existingMs ?? []) as Array<{ order: number | null }>)
    .reduce((acc, r) => Math.max(acc, r.order ?? 0), 0);
  let nextMilestoneOrder = currentMax + 1;

  // 5. Insert milestones + child tasks. We do milestones one-by-one so we
  //    can capture each new id and use it as the parent_task_id for that
  //    milestone's children.  This is N+M round-trips, but N is small
  //    (typical idea: 3–8 milestones with 4–10 tasks each) and the
  //    implementation stays simple.

  // Accumulate client_requests task times (in minutes) for project aggregate update.
  let clientDevMins = 0;

  // All imported tasks belong to the milestone view → always developer_tasks.
  // Special task names are identified only for project aggregate accumulation.
  function resolveTaskDbType(_taskType?: string, _taskName?: string): string {
    return "developer_tasks";
  }

  // Strip a leading "Milestone N:" / "Milestone N -" prefix the AI may have
  // copied verbatim from the idea HTML — the table already prepends one.
  const stripMilestonePrefix = (s: string) =>
    s.replace(/^\s*milestone\s*\d+\s*[:\-–—]\s*/i, "").trim();

  let createdTasks = 0;
  for (const m of milestones) {
    const rawMilestoneName = String(m.name ?? "").trim();
    const milestoneName = stripMilestonePrefix(rawMilestoneName) || "Untitled milestone";
    // AI returns minutes per prompt; estimated_time column stores hours.
    const milestoneEst = typeof m.estimated_time_minutes === "number"
      ? m.estimated_time_minutes / 60
      : null;

    const { data: mRow, error: mErr } = await supabase
      .from("project_task")
      .insert({
        project_id: projectId,
        parent_task_id: null,
        name: milestoneName,
        type: "developer_tasks",
        level: "level_1",
        status: "not_started",
        estimated_time: milestoneEst,
        order: nextMilestoneOrder++,
      } as never)
      .select("id")
      .single();
    if (mErr || !mRow) {
      return {
        error: `Failed creating milestone "${milestoneName}": ${mErr?.message ?? "unknown"}`,
      };
    }
    const milestoneId = (mRow as { id: string }).id;

    const tasks = Array.isArray(m.tasks) ? m.tasks : [];
    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      const taskName = String(t.name ?? "").trim() || "Untitled task";
      // AI returns minutes per prompt; estimated_time column stores hours.
      const taskEst = typeof t.estimated_time_minutes === "number"
        ? t.estimated_time_minutes / 60
        : null;
      const taskDesc = typeof t.description === "string" && t.description.trim()
        ? t.description.trim()
        : null;
      const dbType = resolveTaskDbType(t.task_type, taskName);

      // Accumulate RAW minutes from AI (before /60) for project aggregate fields.
      const rawMins = typeof t.estimated_time_minutes === "number" ? t.estimated_time_minutes : 0;
      const tt = (t.task_type ?? "").toLowerCase();
      if (tt === "client_requests") {
        clientDevMins += rawMins;
      }

      const { error: tErr } = await supabase
        .from("project_task")
        .insert({
          project_id: projectId,
          parent_task_id: milestoneId,
          name: taskName,
          type: dbType,
          level: "level_2",
          status: "not_started",
          estimated_time: taskEst,
          description: taskDesc,
          order: i + 1,
        } as never);
      if (tErr) {
        return {
          error: `Failed creating task "${taskName}" under "${milestoneName}": ${tErr.message}`,
        };
      }
      createdTasks++;
    }
  }

  // 6. Write project-level aggregate field for General Requests tasks (stored in hours).
  const projectAggUpdate: Record<string, number> = {};
  if (clientDevMins > 0) projectAggUpdate.general_requests_estimated_time = clientDevMins / 60;
  if (Object.keys(projectAggUpdate).length > 0) {
    await supabase.from("project").update(projectAggUpdate).eq("id", projectId);
  }

  // 7. Recompute project roll-ups and refresh the page.
  await recalculateAggregates(projectId);
  revalidatePath("/projects");

  return { created: { milestones: milestones.length, tasks: createdTasks } };
}
