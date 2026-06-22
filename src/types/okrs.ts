// Types mirror Supabase tables internal_goal, internal_key_result,
// internal_key_result_track. Status enums map to PostgreSQL enums
// os_internal_goals_status and os_internal_key_result_status.

export type InternalGoalStatus =
  | "prospecting"
  | "not_started"
  | "in_progress"
  | "done"
  | "archived"
  | "blocked";

export type InternalKeyResultStatus =
  | "not_started"
  | "in_progress"
  | "ready_for_qa"
  | "done"
  | "blocked"
  | "archived";

export interface InternalGoal {
  id: string;
  name: string;
  order: number;
  description: string;
  status: InternalGoalStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface InternalKeyResult {
  id: string;
  internal_goal_id: string;
  name: string;
  order: number;
  start_date: string | null;
  end_date: string | null;
  status: InternalKeyResultStatus;
  current_key_result_value: number | null;
  achieved: boolean;
  description: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface InternalKeyResultTrack {
  id: string;
  internal_goal_id: string;
  internal_key_result_id: string;
  date: string;
  value: number | null;
  current_target_key_result_value: number | null;
  achieved: boolean;
  created_by: string | null;
  created_at: string;
}

export const GOAL_STATUSES: InternalGoalStatus[] = [
  "prospecting",
  "not_started",
  "in_progress",
  "done",
  "archived",
  "blocked",
];

export const KR_STATUSES: InternalKeyResultStatus[] = [
  "not_started",
  "in_progress",
  "ready_for_qa",
  "done",
  "blocked",
  "archived",
];

export const GOAL_STATUS_LABELS: Record<InternalGoalStatus, string> = {
  prospecting: "Prospecting",
  not_started: "Not Started",
  in_progress: "In Progress",
  done: "Done",
  archived: "Archived",
  blocked: "Blocked",
};

export const KR_STATUS_LABELS: Record<InternalKeyResultStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  ready_for_qa: "Ready for QA",
  done: "Done",
  blocked: "Blocked",
  archived: "Archived",
};

// Tailwind class snippets for status pills — consistent across the UI.
export const GOAL_STATUS_PILL: Record<InternalGoalStatus, string> = {
  prospecting: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  not_started: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  in_progress: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  done: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  archived: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  blocked: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

export const KR_STATUS_PILL: Record<InternalKeyResultStatus, string> = {
  not_started: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  in_progress: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  ready_for_qa: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  done: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  blocked: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  archived: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};
