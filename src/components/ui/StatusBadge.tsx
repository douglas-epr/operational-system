/**
 * StatusBadge — maps `os_task_status` / `os_project_status` enum values
 * to the canonical pill style.
 *
 * One source of truth for "Done" / "Blocked" / etc. coloring.
 */

import { clsx } from "clsx";

export type StatusKind =
  | "not_started"
  | "in_progress"
  | "ready_for_qa"
  | "done"
  | "blocked"
  | "archived"
  | "prospecting"
  | "lost_deal";

const STATUS_LABEL: Record<StatusKind, string> = {
  not_started:  "Not started",
  in_progress:  "In progress",
  ready_for_qa: "Ready for QA",
  done:         "Done",
  blocked:      "Blocked",
  archived:     "Archived",
  prospecting:  "Prospecting",
  lost_deal:    "Lost deal",
};

const STATUS_CLASS: Record<StatusKind, string> = {
  not_started:  "status-not-started",
  in_progress:  "status-in-progress",
  ready_for_qa: "status-ready-qa",
  done:         "status-done",
  blocked:      "status-blocked",
  archived:     "status-archived",
  prospecting:  "status-prospecting",
  lost_deal:    "status-lost-deal",
};

interface StatusBadgeProps {
  status: StatusKind;
  /** Override the default label. */
  label?: string;
  className?: string;
}

export default function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <span className={clsx("status-badge", STATUS_CLASS[status], className)}>
      {label ?? STATUS_LABEL[status]}
    </span>
  );
}

export { STATUS_LABEL, STATUS_CLASS };
