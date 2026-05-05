// Mirrors the Supabase tables internal_project, internal_task,
// internal_project_assignees pivot and internal_task_time_track.
// Task assignees live on internal_task.assignees (uuid[]).

export type InternalProjectStatus =
  | "not_started"
  | "in_progress"
  | "ready_for_qa"
  | "done"
  | "blocked"
  | "archived";

export type InternalTaskStatus =
  | "not_started"
  | "in_progress"
  | "done"
  | "blocked";

export type CompanySector = "organizational" | "operational" | "marketing";

export interface InternalProject {
  id: string;
  name: string;
  order: number | null;
  start_date_real: string | null;
  end_date_real: string | null;
  start_date_estimated: string | null;
  end_date_estimated: string | null;
  description: string | null;
  real_time: number | null;
  estimated_time: number | null;
  status: InternalProjectStatus;
  sector: CompanySector | null;
  internal_key_result_ids: string[];
  created_at: string;
}

export interface InternalKeyResultRef {
  id: string;
  name: string;
  internal_goal_id: string | null;
}

export interface InternalProjectAssignee {
  internal_project_id: string;
  user_id: string;
}

export interface InternalTask {
  id: string;
  internal_project_id: string | null;
  internal_goal_id: string | null;
  internal_key_result_id: string | null;
  name: string;
  order: number | null;
  real_start_date: string | null;
  real_end_date: string | null;
  estimated_start_date: string | null;
  estimated_end_date: string | null;
  description: string | null;
  real_time: number | null;
  estimated_time: number | null;
  status: InternalTaskStatus;
  assignees: string[];
  created_at: string;
}

export interface InternalTaskTimeTrack {
  id: string;
  /** Renamed from owner_id (Part 2 item 30). NOT NULL in DB. */
  assignee_id: string;
  internal_task_id: string | null;
  internal_project_id: string | null;
  start_date: string | null;
  start_time_min: number | null;
  end_time_min: number | null;
  time_spent_h: number | null;
  created_at: string;
  updated_at?: string | null;
  created_by?: string | null;
}

export interface InternalTaskCommentAttachment {
  path: string;
  url: string;
  name: string;
  size: number;
  type: string;
}

export interface InternalTaskComment {
  id: string;
  internal_task_id: string;
  internal_project_id: string | null;
  /** Renamed from owner_id (Part 2 item 29). */
  created_by: string;
  message: string | null;
  attachments: InternalTaskCommentAttachment[];
  /** Renamed from edited_at (Part 2 item 29). */
  updated_at: string | null;
  created_at: string;
  profiles?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    picture: string | null;
  } | null;
}

export const INTERNAL_PROJECT_STATUSES: InternalProjectStatus[] = [
  "not_started",
  "in_progress",
  "ready_for_qa",
  "done",
  "blocked",
  "archived",
];

export const INTERNAL_TASK_STATUSES: InternalTaskStatus[] = [
  "not_started",
  "in_progress",
  "done",
  "blocked",
];

export const COMPANY_SECTORS: CompanySector[] = [
  "organizational",
  "operational",
  "marketing",
];

export const INTERNAL_PROJECT_STATUS_LABELS: Record<
  InternalProjectStatus,
  string
> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  ready_for_qa: "Ready for QA",
  done: "Done",
  blocked: "Blocked",
  archived: "Archived",
};

export const INTERNAL_TASK_STATUS_LABELS: Record<InternalTaskStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  done: "Done",
  blocked: "Blocked",
};

export const COMPANY_SECTOR_LABELS: Record<CompanySector, string> = {
  organizational: "Organizational",
  operational: "Operational",
  marketing: "Marketing",
};

// Tailwind-class snippets for status pills — matches OKRs/Projects styling.
export const INTERNAL_PROJECT_STATUS_PILL: Record<
  InternalProjectStatus,
  string
> = {
  not_started: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  in_progress: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  ready_for_qa: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  done: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  blocked: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  archived: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

export const INTERNAL_TASK_STATUS_PILL: Record<InternalTaskStatus, string> = {
  not_started: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  in_progress: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  done: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  blocked: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

// Kanban column background tints — match the second screenshot.
export const INTERNAL_TASK_STATUS_COLUMN_BG: Record<
  InternalTaskStatus,
  string
> = {
  not_started: "bg-slate-500/10",
  in_progress: "bg-amber-500/10",
  done: "bg-emerald-500/10",
  blocked: "bg-rose-500/10",
};
