"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserWithRole } from "@/lib/auth/current-user";
import type {
  InternalProject,
  InternalProjectStatus,
  InternalTask,
  InternalTaskStatus,
  InternalTaskTimeTrack,
  InternalTaskComment,
  InternalTaskCommentAttachment,
  CompanySector,
} from "@/types/internal-projects";
import type { Json } from "@/lib/supabase/types";

const INTERNAL_TYPES = ["admin", "manager", "operational"] as const;

async function requireInternalStaff() {
  // Request-scoped, React-cache()-wrapped lookup — see current-user.ts.
  // De-dupes the getUser()+profiles round-trip with any other gate called
  // in this same request.
  const current = await getCurrentUserWithRole();
  if (!current) return { error: "Not authenticated" as const };
  const { supabase, userId, role } = current;
  if (!role || !(INTERNAL_TYPES as readonly string[]).includes(role)) {
    return { error: "Forbidden" as const };
  }
  return { supabase, userId };
}

// ── Internal Projects ─────────────────────────────────────────────────────────

export type CreateInternalProjectInput = {
  name: string;
  status?: InternalProjectStatus;
  sector?: CompanySector | null;
  description?: string | null;
  start_date_real?: string | null;
  end_date_real?: string | null;
  start_date_estimated?: string | null;
  end_date_estimated?: string | null;
  real_time?: number | null;
  estimated_time?: number | null;
  assignees?: string[];
  internal_key_result_ids?: string[];
};

export async function createInternalProject(
  input: CreateInternalProjectInput
): Promise<{ projectId?: string; error?: string }> {
  const gate = await requireInternalStaff();
  if ("error" in gate) return { error: gate.error };
  const { supabase, userId } = gate;

  const { data: last } = await supabase
    .from("internal_project")
    .select("order")
    .order("order", { ascending: false })
    .limit(1);
  const maxOrder = last?.[0]?.order ?? 0;

  const { data, error } = await supabase
    .from("internal_project")
    .insert({
      name: input.name.trim() || "Untitled project",
      order: maxOrder + 1,
      status: input.status ?? "not_started",
      sector: input.sector ?? null,
      description: input.description ?? null,
      start_date_real: input.start_date_real ?? null,
      end_date_real: input.end_date_real ?? null,
      start_date_estimated: input.start_date_estimated ?? null,
      end_date_estimated: input.end_date_estimated ?? null,
      real_time: input.real_time ?? null,
      estimated_time: input.estimated_time ?? null,
      internal_key_result_ids: input.internal_key_result_ids ?? [],
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const projectId = data.id;
  const userIds = (input.assignees && input.assignees.length > 0)
    ? Array.from(new Set([userId, ...input.assignees]))
    : [userId];

  await supabase
    .from("internal_project_assignees")
    .insert(
      userIds.map((user_id) => ({
        internal_project_id: projectId,
        user_id,
      }))
    );

  revalidatePath("/internal-projects");
  return { projectId };
}

export async function updateInternalProject(
  id: string,
  patch: Partial<
    Pick<
      InternalProject,
      | "name"
      | "status"
      | "sector"
      | "description"
      | "start_date_real"
      | "end_date_real"
      | "start_date_estimated"
      | "end_date_estimated"
      | "real_time"
      | "estimated_time"
      | "order"
      | "internal_key_result_ids"
    >
  >
): Promise<{ error?: string }> {
  const gate = await requireInternalStaff();
  if ("error" in gate) return { error: gate.error };
  const { supabase } = gate;

  const { error } = await supabase
    .from("internal_project")
    .update(patch)
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/internal-projects");
  revalidatePath(`/internal-projects?project=${id}`);
  return {};
}

export async function deleteInternalProject(
  id: string
): Promise<{ error?: string }> {
  const gate = await requireInternalStaff();
  if ("error" in gate) return { error: gate.error };
  const { supabase } = gate;

  const { error } = await supabase
    .from("internal_project")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/internal-projects");
  return {};
}

// ── Project assignees ─────────────────────────────────────────────────────────

export async function setInternalProjectAssignees(
  projectId: string,
  userIds: string[]
): Promise<{ error?: string }> {
  const gate = await requireInternalStaff();
  if ("error" in gate) return { error: gate.error };
  const { supabase } = gate;

  const { error: delErr } = await supabase
    .from("internal_project_assignees")
    .delete()
    .eq("internal_project_id", projectId);
  if (delErr) return { error: delErr.message };

  if (userIds.length > 0) {
    const rows = userIds.map((user_id) => ({
      internal_project_id: projectId,
      user_id,
    }));
    const { error } = await supabase
      .from("internal_project_assignees")
      .insert(rows);
    if (error) return { error: error.message };
  }

  revalidatePath("/internal-projects");
  revalidatePath(`/internal-projects?project=${projectId}`);
  return {};
}

// ── Internal Tasks ────────────────────────────────────────────────────────────

export async function createInternalTask(
  projectId: string,
  status: InternalTaskStatus,
  name?: string,
  order?: number
): Promise<{ taskId?: string; error?: string }> {
  const gate = await requireInternalStaff();
  if ("error" in gate) return { error: gate.error };
  const { supabase } = gate;

  let nextOrder = order;
  if (nextOrder === undefined) {
    const { data: last } = await supabase
      .from("internal_project_task")
      .select("order")
      .eq("internal_project_id", projectId)
      .order("order", { ascending: false })
      .limit(1);
    const maxOrder = last?.[0]?.order ?? 0;
    nextOrder = maxOrder + 1;
  }

  const { data, error } = await supabase
    .from("internal_project_task")
    .insert({
      internal_project_id: projectId,
      name: (name ?? "").trim() || "New task",
      order: nextOrder,
      status,
      assignees: [],
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath(`/internal-projects?project=${projectId}`);
  return { taskId: data.id };
}

export async function updateInternalTask(
  id: string,
  patch: Partial<
    Pick<
      InternalTask,
      | "name"
      | "status"
      | "description"
      | "real_start_date"
      | "real_end_date"
      | "estimated_start_date"
      | "estimated_end_date"
      | "real_time"
      | "estimated_time"
      | "order"
      | "assignees"
    >
  >
): Promise<{ error?: string }> {
  const gate = await requireInternalStaff();
  if ("error" in gate) return { error: gate.error };
  const { supabase } = gate;

  const { error } = await supabase
    .from("internal_project_task")
    .update(patch)
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/internal-projects");
  return {};
}

export async function deleteInternalTask(
  id: string
): Promise<{ error?: string }> {
  const gate = await requireInternalStaff();
  if ("error" in gate) return { error: gate.error };
  const { supabase } = gate;

  const { error } = await supabase
    .from("internal_project_task")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/internal-projects");
  return {};
}

// Helper used by the list view's "Sector" inline dropdown.
export async function updateInternalProjectSector(
  id: string,
  sector: CompanySector | null
): Promise<{ error?: string }> {
  return updateInternalProject(id, { sector });
}

// ── Time tracks ───────────────────────────────────────────────────────────────

// owner_id was renamed to assignee_id in B8 (item 30). Patch shape mirrors
// the new column name so callers (modal forms) can specify a different
// assignee when the editor is admin/manager.
export type TimeTrackPatch = Partial<
  Pick<
    InternalTaskTimeTrack,
    "start_date" | "start_time_min" | "end_time_min" | "time_spent_h" | "assignee_id"
  >
>;

export async function createInternalTaskTimeTrack(
  taskId: string,
  projectId: string | null,
  patch: TimeTrackPatch = {}
): Promise<{ trackId?: string; error?: string }> {
  const gate = await requireInternalStaff();
  if ("error" in gate) return { error: gate.error };
  const { supabase, userId } = gate;

  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("internal_project_task_time_track")
    .insert({
      internal_task_id: taskId,
      internal_project_id: projectId,
      assignee_id: patch.assignee_id ?? userId,
      start_date: patch.start_date ?? today,
      start_time_min: patch.start_time_min ?? null,
      end_time_min: patch.end_time_min ?? null,
      time_spent_h: patch.time_spent_h ?? null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/internal-projects");
  return { trackId: data.id };
}

export async function updateInternalTaskTimeTrack(
  id: string,
  patch: TimeTrackPatch
): Promise<{ error?: string }> {
  const gate = await requireInternalStaff();
  if ("error" in gate) return { error: gate.error };
  const { supabase } = gate;

  const { error } = await supabase
    .from("internal_project_task_time_track")
    .update(patch)
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/internal-projects");
  return {};
}

export async function deleteInternalTaskTimeTrack(
  id: string
): Promise<{ error?: string }> {
  const gate = await requireInternalStaff();
  if ("error" in gate) return { error: gate.error };
  const { supabase } = gate;

  const { error } = await supabase
    .from("internal_project_task_time_track")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/internal-projects");
  return {};
}

// ── Internal Task Comments (Chat) ─────────────────────────────────────────────

export async function getInternalTaskComments(
  internalTaskId: string
): Promise<InternalTaskComment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("internal_project_task_comment")
    // internal_task_comment.owner_id → created_by, edited_at → updated_at
    // (B8 item 29).
    .select(
      "id, internal_task_id, internal_project_id, created_by, message, attachments, updated_at, created_at, profiles(id, first_name, last_name, picture)"
    )
    .eq("internal_task_id", internalTaskId)
    .order("created_at", { ascending: true });
  return (data ?? []) as unknown as InternalTaskComment[];
}

export async function createInternalTaskComment(
  internalTaskId: string,
  internalProjectId: string,
  message: string,
  attachments: InternalTaskCommentAttachment[] = []
): Promise<{ error?: string; id?: string }> {
  const gate = await requireInternalStaff();
  if ("error" in gate) return { error: gate.error };
  const { supabase, userId } = gate;

  const { data: row, error } = await supabase
    .from("internal_project_task_comment")
    .insert({
      internal_task_id: internalTaskId,
      internal_project_id: internalProjectId,
      created_by: userId,
      message,
      attachments: attachments as unknown as Json,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath(`/internal-projects?project=${internalProjectId}`);
  return { id: row.id };
}

export async function updateInternalTaskComment(
  id: string,
  message: string,
  attachments: InternalTaskCommentAttachment[]
): Promise<{ error?: string }> {
  const gate = await requireInternalStaff();
  if ("error" in gate) return { error: gate.error };
  const { supabase } = gate;

  const { error } = await supabase
    .from("internal_project_task_comment")
    .update({
      message,
      attachments: attachments as unknown as Json,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/internal-projects");
  return {};
}

export async function deleteInternalTaskComment(
  id: string
): Promise<{ error?: string }> {
  const gate = await requireInternalStaff();
  if ("error" in gate) return { error: gate.error };
  const { supabase } = gate;

  const { data: existing } = await supabase
    .from("internal_project_task_comment")
    .select("attachments")
    .eq("id", id)
    .single();
  const attachments = (existing?.attachments ??
    []) as unknown as InternalTaskCommentAttachment[];
  const paths = Array.isArray(attachments)
    ? attachments.map((a) => a.path).filter(Boolean)
    : [];
  if (paths.length > 0) {
    await supabase.storage
      .from("internal-task-comment-attachments")
      .remove(paths);
  }
  const { error } = await supabase
    .from("internal_project_task_comment")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/internal-projects");
  return {};
}

export async function markInternalTaskCommentsViewed(
  internalTaskId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_internal_task_comments_viewed", {
    p_internal_task_id: internalTaskId,
  });
  if (error) return { error: error.message };
  revalidatePath("/internal-projects");
  return {};
}
