"use client";

/**
 * Stages Checking — editorial timeline view of the project's stage milestones.
 *
 * Design notes (VibeUX): adopts the shared design tokens (`text-text-*`,
 * `bg-surface`, `border-border`, semantic status classes) instead of the
 * old hand-rolled hex pills. Each stage is a row anchored to a vertical
 * timeline rail; status is communicated by an icon + label, not by
 * flooding the row with saturated colour.
 */

import type { Task, ProjectStage } from "@/types/projects";
import { STAGE_LABELS, STAGE_ORDER } from "@/types/projects";
import { CheckIcon, ClockIcon, MinusIcon, AlertTriangleIcon } from "@/components/ui/icons";

type StageStatus = "done" | "in_progress" | "not_started" | "ready_for_qa" | "blocked";

interface StagesCheckingProps {
  tasks: Task[];
  projectStage: ProjectStage | null;
}

export default function StagesChecking({ tasks, projectStage }: StagesCheckingProps) {
  // Build a map from stage name → task (matched by task.name to stage label or stage key)
  const taskByStage = new Map<ProjectStage, Task>();
  tasks
    .filter((t) => t.type === "stages_checking")
    .forEach((t) => {
      const stageKey = STAGE_ORDER.find(
        (s) => STAGE_LABELS[s].toLowerCase() === t.name?.toLowerCase()
      );
      if (stageKey) taskByStage.set(stageKey, t);
    });

  const currentStageIndex = projectStage ? STAGE_ORDER.indexOf(projectStage) : -1;
  const total = STAGE_ORDER.length;
  const completed = STAGE_ORDER.filter((stage, idx) => {
    const task = taskByStage.get(stage);
    const status = (task?.status ?? inferStatus(idx, currentStageIndex)) as StageStatus;
    return status === "done";
  }).length;
  const progressPct = Math.round((completed / total) * 100);

  return (
    <div className="px-6 py-6 max-w-4xl mx-auto">
      {/* ── Header summary ─────────────────────────────────────── */}
      <div className="flex items-end justify-between mb-6 pb-4 border-b border-border">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
            Project Lifecycle
          </div>
          <h2 className="font-display text-2xl font-semibold text-text-primary leading-tight mt-1">
            Stages Checking
          </h2>
        </div>
        <div className="text-right">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
            Progress
          </div>
          <div className="font-display text-2xl font-semibold text-text-primary tabular-nums leading-tight mt-1">
            {completed}<span className="text-text-muted text-base font-normal">/{total}</span>
          </div>
        </div>
      </div>

      {/* ── Slim progress rail ─────────────────────────────────── */}
      <div className="mb-8">
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="mt-1.5 text-[11px] text-text-muted tabular-nums">
          {progressPct}% complete
        </div>
      </div>

      {/* ── Timeline ───────────────────────────────────────────── */}
      <ol className="relative">
        {/* Vertical rail */}
        <span
          aria-hidden
          className="absolute left-[15px] top-2 bottom-2 w-px bg-border"
        />

        {STAGE_ORDER.map((stage, idx) => {
          const task = taskByStage.get(stage);
          const status = (task?.status ?? inferStatus(idx, currentStageIndex)) as StageStatus;
          return (
            <StageRow
              key={stage}
              index={idx + 1}
              label={STAGE_LABELS[stage]}
              status={status}
            />
          );
        })}
      </ol>
    </div>
  );
}

function inferStatus(idx: number, currentIdx: number): StageStatus {
  if (currentIdx === -1) return "not_started";
  if (idx < currentIdx) return "done";
  if (idx === currentIdx) return "in_progress";
  return "not_started";
}

function StageRow({
  index,
  label,
  status,
}: {
  index: number;
  label: string;
  status: StageStatus;
}) {
  const isDone = status === "done";
  const isActive = status === "in_progress";
  const isBlocked = status === "blocked";
  const isReadyQa = status === "ready_for_qa";

  const statusPillClass = {
    done: "status-badge status-done",
    in_progress: "status-badge status-in-progress",
    ready_for_qa: "status-badge status-ready-qa",
    not_started: "status-badge status-not-started",
    blocked: "status-badge status-blocked",
  }[status];

  const statusLabel = {
    done: "Completed",
    in_progress: "In progress",
    ready_for_qa: "Ready for QA",
    not_started: "Not started",
    blocked: "Blocked",
  }[status];

  return (
    <li className="relative pl-12 pr-2 py-3 group">
      {/* Timeline dot */}
      <span
        aria-hidden
        className={[
          "absolute left-2 top-1/2 -translate-y-1/2 w-[18px] h-[18px] rounded-full flex items-center justify-center transition-colors",
          isDone
            ? "bg-success text-white"
            : isActive
            ? "bg-accent text-white ring-4 ring-accent/15"
            : isBlocked
            ? "bg-danger text-white"
            : isReadyQa
            ? "bg-[var(--status-ready-qa-text)] text-white"
            : "bg-muted border border-border text-text-muted",
        ].join(" ")}
      >
        {isDone && <CheckIcon className="w-3 h-3" strokeWidth={3} />}
        {isActive && <ClockIcon className="w-2.5 h-2.5" strokeWidth={3} />}
        {isBlocked && <AlertTriangleIcon className="w-2.5 h-2.5" strokeWidth={3} />}
        {!isDone && !isActive && !isBlocked && !isReadyQa && (
          <MinusIcon className="w-2.5 h-2.5" strokeWidth={3} />
        )}
      </span>

      {/* Row content — single hover card */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg border border-transparent group-hover:border-border group-hover:bg-elevated/50 transition-colors">
        <div className="flex items-baseline gap-3 min-w-0">
          <span className="text-[10px] font-mono text-text-muted tabular-nums leading-none">
            {String(index).padStart(2, "0")}
          </span>
          <span
            className={[
              "text-sm leading-tight truncate",
              isDone
                ? "text-text-secondary line-through decoration-1 decoration-text-muted/40"
                : isActive
                ? "text-text-primary font-medium"
                : "text-text-primary",
            ].join(" ")}
          >
            {label}
          </span>
        </div>
        <span className={`${statusPillClass} shrink-0`}>{statusLabel}</span>
      </div>
    </li>
  );
}
