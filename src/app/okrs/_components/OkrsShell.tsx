"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  GOAL_STATUS_LABELS,
  GOAL_STATUSES,
  GOAL_STATUS_PILL,
  KR_STATUS_LABELS,
  KR_STATUS_PILL,
  type InternalGoal,
  type InternalGoalStatus,
  type InternalKeyResult,
  type InternalKeyResultStatus,
  type InternalKeyResultTrack,
} from "@/types/okrs";
import {
  createKeyResult,
  deleteGoal,
  deleteKeyResult,
} from "../actions";
import GoalModal from "./GoalModal";
import KeyResultModal from "./KeyResultModal";
import { IconButton } from "@/components/ui";
import { EditIcon, DeleteIcon, ChevronRightIcon } from "@/components/ui/icons";

interface Props {
  goals: InternalGoal[];
  keyResults: InternalKeyResult[];
  tracks: InternalKeyResultTrack[];
}

// Filter chips surface the five shared statuses that apply to both
// goals and key results.
type AnyStatus = InternalGoalStatus | InternalKeyResultStatus;

const DEFAULT_STATUS_FILTERS: AnyStatus[] = ["not_started", "in_progress"];

const ALL_STATUS_FILTERS: AnyStatus[] = [
  "not_started",
  "in_progress",
  "done",
  "archived",
  "blocked",
];

function statusLabel(s: AnyStatus): string {
  if ((GOAL_STATUSES as string[]).includes(s)) {
    return GOAL_STATUS_LABELS[s as InternalGoalStatus];
  }
  return KR_STATUS_LABELS[s as InternalKeyResultStatus];
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default function OkrsShell({ goals, keyResults, tracks }: Props) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(goals.map((g) => g.id))
  );
  const [filters, setFilters] = useState<Set<AnyStatus>>(
    () => new Set(DEFAULT_STATUS_FILTERS)
  );
  const [creatingGoal, setCreatingGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<InternalGoal | null>(null);
  const [editingKR, setEditingKR] = useState<InternalKeyResult | null>(null);
  const [busy, startTransition] = useTransition();

  // Group KRs by goal for fast lookup.
  const krsByGoal = useMemo(() => {
    const map = new Map<string, InternalKeyResult[]>();
    for (const kr of keyResults) {
      const list = map.get(kr.internal_goal_id) ?? [];
      list.push(kr);
      map.set(kr.internal_goal_id, list);
    }
    return map;
  }, [keyResults]);

  // Derived start/end range per goal = min start_date / max end_date of
  // its child key results.
  function goalDateRange(goalId: string): { start: string | null; end: string | null } {
    const list = krsByGoal.get(goalId) ?? [];
    let start: string | null = null;
    let end: string | null = null;
    for (const kr of list) {
      if (kr.start_date && (!start || kr.start_date < start)) start = kr.start_date;
      if (kr.end_date && (!end || kr.end_date > end)) end = kr.end_date;
    }
    return { start, end };
  }

  // Visibility: when the filter set is non-empty, a goal is visible if
  // its own status matches OR any of its KRs' statuses match. KRs that
  // don't match the filter stay hidden under a matching parent.
  const visibleGoals = useMemo(() => {
    if (filters.size === 0) return goals;
    return goals.filter((g) => {
      if (filters.has(g.status)) return true;
      const list = krsByGoal.get(g.id) ?? [];
      return list.some((kr) => filters.has(kr.status));
    });
  }, [goals, filters, krsByGoal]);

  function visibleKrsFor(goalId: string): InternalKeyResult[] {
    const list = krsByGoal.get(goalId) ?? [];
    if (filters.size === 0) return list;
    // If the parent goal itself matches the filter, show ALL children.
    const parent = goals.find((g) => g.id === goalId);
    if (parent && filters.has(parent.status)) return list;
    // Otherwise only show matching KRs.
    return list.filter((kr) => filters.has(kr.status));
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleFilter(s: AnyStatus) {
    setFilters((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }

  async function handleAddKR(goalId: string) {
    startTransition(async () => {
      const res = await createKeyResult(goalId, "Untitled key result");
      if (res.error) {
        alert(res.error);
        return;
      }
      router.refresh();
    });
  }

  async function handleDeleteGoal(goalId: string) {
    if (!confirm("Delete this goal and all its key results?")) return;
    startTransition(async () => {
      const res = await deleteGoal(goalId);
      if (res.error) {
        alert(res.error);
        return;
      }
      router.refresh();
    });
  }

  async function handleDeleteKR(krId: string) {
    if (!confirm("Delete this key result?")) return;
    startTransition(async () => {
      const res = await deleteKeyResult(krId);
      if (res.error) {
        alert(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-heading-1 text-text-primary">OKRs</h1>
      </div>

      {/* ── Filter chips ─────────────────────────────────────────────── */}
      <div className="flex items-center flex-wrap gap-2 mb-4">
        <span className="text-xs text-text-muted mr-1">Filter:</span>
        {ALL_STATUS_FILTERS.map((s) => {
          const active = filters.has(s);
          return (
            <button
              key={s}
              onClick={() => toggleFilter(s)}
              className={[
                "text-xs px-2.5 py-1 rounded-full border transition-colors",
                active
                  ? "bg-accent border-accent text-white"
                  : "bg-muted border-border text-text-secondary hover:text-text-primary",
              ].join(" ")}
            >
              {statusLabel(s)}
            </button>
          );
        })}
        {filters.size > 0 && (
          <button
            onClick={() => setFilters(new Set())}
            className="text-xs text-text-muted hover:text-text-primary ml-2 underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* ── Table ────────────────────────────────────────────────────── */}
      <div className="border border-border rounded-lg overflow-hidden bg-surface">
        <div className="grid grid-cols-[24px_1fr_140px_110px_110px_80px] gap-2 px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-text-muted border-b border-border">
          <div></div>
          <div>Name</div>
          <div>Status</div>
          <div>Start Date</div>
          <div>End Date</div>
          <div className="text-right">Actions</div>
        </div>

        {visibleGoals.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-text-muted">
            No goals yet.
          </div>
        )}

        {visibleGoals.map((goal) => {
          const isOpen = expanded.has(goal.id);
          const range = goalDateRange(goal.id);
          const goalKrs = visibleKrsFor(goal.id);
          return (
            <div key={goal.id}>
              {/* Goal row */}
              <div className="grid grid-cols-[24px_1fr_140px_110px_110px_80px] gap-2 px-4 py-2 items-center bg-indigo-500/10 hover:bg-indigo-500/15 border-b border-border">
                <button
                  onClick={() => toggleExpand(goal.id)}
                  className="text-text-muted hover:text-text-primary flex items-center justify-center"
                  aria-label={isOpen ? "Collapse" : "Expand"}
                >
                  <ChevronRightIcon
                    className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-90" : ""}`}
                    strokeWidth={2}
                  />
                </button>
                <button
                  onClick={() => setEditingGoal(goal)}
                  className="text-left text-sm font-semibold text-text-primary hover:text-accent truncate"
                >
                  {goal.name}
                </button>
                <div>
                  <span
                    className={`inline-block text-[11px] px-2 py-0.5 rounded-full border ${
                      GOAL_STATUS_PILL[goal.status]
                    }`}
                  >
                    {GOAL_STATUS_LABELS[goal.status]}
                  </span>
                </div>
                <div className="text-xs text-text-secondary">
                  {formatDate(range.start)}
                </div>
                <div className="text-xs text-text-secondary">
                  {formatDate(range.end)}
                </div>
                <div className="flex items-center justify-end gap-0.5">
                  <IconButton
                    icon={<EditIcon strokeWidth={1.8} />}
                    aria-label="Edit goal"
                    size="sm"
                    onClick={() => setEditingGoal(goal)}
                  />
                  <IconButton
                    icon={<DeleteIcon strokeWidth={1.8} />}
                    aria-label="Delete goal"
                    size="sm"
                    tone="danger"
                    disabled={busy}
                    onClick={() => handleDeleteGoal(goal.id)}
                  />
                </div>
              </div>

              {/* Key-result rows */}
              {isOpen && (
                <>
                  {goalKrs.map((kr) => (
                    <div
                      key={kr.id}
                      className="grid grid-cols-[24px_1fr_140px_110px_110px_80px] gap-2 px-4 py-2 items-center border-b border-border hover:bg-muted/40"
                    >
                      <div className="h-full flex justify-center">
                        <div className="w-px bg-border"></div>
                      </div>
                      <button
                        onClick={() => setEditingKR(kr)}
                        className="text-left text-sm text-text-primary hover:text-accent truncate pl-4"
                      >
                        {kr.name}
                      </button>
                      <div>
                        <span
                          className={`inline-block text-[11px] px-2 py-0.5 rounded-full border ${
                            KR_STATUS_PILL[kr.status]
                          }`}
                        >
                          {KR_STATUS_LABELS[kr.status]}
                        </span>
                      </div>
                      <div className="text-xs text-text-secondary">
                        {formatDate(kr.start_date)}
                      </div>
                      <div className="text-xs text-text-secondary">
                        {formatDate(kr.end_date)}
                      </div>
                      <div className="flex items-center justify-end gap-0.5">
                        <IconButton
                          icon={<EditIcon strokeWidth={1.8} />}
                          aria-label="Edit key result"
                          size="sm"
                          onClick={() => setEditingKR(kr)}
                        />
                        <IconButton
                          icon={<DeleteIcon strokeWidth={1.8} />}
                          aria-label="Delete key result"
                          size="sm"
                          tone="danger"
                          disabled={busy}
                          onClick={() => handleDeleteKR(kr.id)}
                        />
                      </div>
                    </div>
                  ))}

                  {/* Add KR row */}
                  <div className="grid grid-cols-[24px_1fr_140px_110px_110px_80px] gap-2 px-4 py-1.5 items-center border-b border-border">
                    <div></div>
                    <button
                      onClick={() => handleAddKR(goal.id)}
                      disabled={busy}
                      className="text-left text-xs text-text-muted hover:text-accent pl-4 disabled:opacity-50"
                    >
                      + Add key result
                    </button>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                  </div>
                </>
              )}
            </div>
          );
        })}

        {/* Add goal row */}
        <div className="px-4 py-3 flex items-center">
          <button
            onClick={() => setCreatingGoal(true)}
            disabled={busy}
            className="text-xs text-text-muted hover:text-accent disabled:opacity-50"
          >
            + Add goal
          </button>
        </div>
      </div>

      {/* ── Modals ───────────────────────────────────────────────────── */}
      {creatingGoal && (
        <GoalModal
          initial={null}
          onClose={() => {
            setCreatingGoal(false);
            router.refresh();
          }}
        />
      )}
      {editingGoal && (
        <GoalModal
          initial={editingGoal}
          onClose={() => {
            setEditingGoal(null);
            router.refresh();
          }}
        />
      )}
      {editingKR && (
        <KeyResultModal
          initial={editingKR}
          goals={goals}
          tracks={tracks.filter(
            (t) => t.internal_key_result_id === editingKR.id
          )}
          onClose={() => {
            setEditingKR(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
