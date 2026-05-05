/**
 * Status enum literals + display config for the dashboard sub-views.
 *
 * The order in each const array controls the visual order in the
 * overview tiles and the sub-view filter dropdowns.
 */

// ── Project ──────────────────────────────────────────────────────────────────

export const PROJECT_STATUSES = [
  "prospecting",
  "not_started",
  "in_progress",
  "done",
  "blocked",
  "archived",
  "lost_deal",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  prospecting: "Prospecting",
  not_started: "Not Started",
  in_progress: "In Progress",
  done: "Done",
  blocked: "Blocked",
  archived: "Archived",
  lost_deal: "Lost Deal",
};

/** Tailwind classes for the status pill in cards. */
export const PROJECT_STATUS_CLASSES: Record<ProjectStatus, string> = {
  prospecting: "bg-amber-500/15 text-amber-300",
  not_started: "bg-zinc-500/15 text-zinc-300",
  in_progress: "bg-blue-500/15 text-blue-300",
  done: "bg-emerald-500/15 text-emerald-300",
  blocked: "bg-red-500/15 text-red-300",
  archived: "bg-zinc-700/30 text-zinc-400",
  lost_deal: "bg-rose-500/15 text-rose-300",
};

// ── Internal Project ─────────────────────────────────────────────────────────

export const INTERNAL_PROJECT_STATUSES = [
  "not_started",
  "in_progress",
  "ready_for_qa",
  "done",
  "blocked",
  "archived",
] as const;
export type InternalProjectStatus = (typeof INTERNAL_PROJECT_STATUSES)[number];

export const INTERNAL_PROJECT_STATUS_LABELS: Record<InternalProjectStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  ready_for_qa: "Ready for QA",
  done: "Done",
  blocked: "Blocked",
  archived: "Archived",
};

export const INTERNAL_PROJECT_STATUS_CLASSES: Record<InternalProjectStatus, string> = {
  not_started: "bg-zinc-500/15 text-zinc-300",
  in_progress: "bg-blue-500/15 text-blue-300",
  ready_for_qa: "bg-purple-500/15 text-purple-300",
  done: "bg-emerald-500/15 text-emerald-300",
  blocked: "bg-red-500/15 text-red-300",
  archived: "bg-zinc-700/30 text-zinc-400",
};

// ── Key Result ───────────────────────────────────────────────────────────────

export const KEY_RESULT_STATUSES = [
  "not_started",
  "in_progress",
  "ready_for_qa",
  "done",
  "blocked",
  "archived",
] as const;
export type KeyResultStatus = (typeof KEY_RESULT_STATUSES)[number];

export const KEY_RESULT_STATUS_LABELS: Record<KeyResultStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  ready_for_qa: "Ready for QA",
  done: "Done",
  blocked: "Blocked",
  archived: "Archived",
};

export const KEY_RESULT_STATUS_CLASSES: Record<KeyResultStatus, string> = INTERNAL_PROJECT_STATUS_CLASSES;
