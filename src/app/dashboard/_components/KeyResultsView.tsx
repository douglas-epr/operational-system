"use client";

/**
 * KeyResultsView — `/dashboard?view=key-results`
 *
 * Renders every internal_key_result as a card. Clicking a card opens the
 * existing `KeyResultModal` from the OKRs page (no rebuild). The modal
 * needs the goals + tracks bundle, which the page-level fetcher passes
 * through.
 *
 * Top bar: status filter dropdown + "Achieved only" toggle.
 */

import Link from "next/link";
import { useMemo, useState } from "react";
import KeyResultModal from "@/app/okrs/_components/KeyResultModal";
import type {
  InternalKeyResult,
  InternalGoal,
  InternalKeyResultTrack,
} from "@/types/okrs";
import {
  KEY_RESULT_STATUSES,
  KEY_RESULT_STATUS_LABELS,
  KEY_RESULT_STATUS_CLASSES,
  type KeyResultStatus,
} from "../_lib/constants";

interface Props {
  keyResults: InternalKeyResult[];
  goals: InternalGoal[];
  tracks: InternalKeyResultTrack[];
}

type StatusFilter = "all" | KeyResultStatus;

export default function KeyResultsView({ keyResults, goals, tracks }: Props) {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [achievedOnly, setAchievedOnly] = useState(false);
  const [open, setOpen] = useState<InternalKeyResult | null>(null);

  const visible = useMemo(() => {
    return keyResults.filter((kr) => {
      if (filter !== "all" && kr.status !== filter) return false;
      if (achievedOnly && !kr.achieved) return false;
      return true;
    });
  }, [keyResults, filter, achievedOnly]);

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
        <div>
          <Link href="/dashboard" className="text-sm text-text-muted hover:text-text-primary">
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-text-primary mt-1">Key Results</h1>
          <p className="text-sm text-text-muted">
            {visible.length} of {keyResults.length} shown
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={achievedOnly}
              onChange={(e) => setAchievedOnly(e.target.checked)}
              className="rounded"
            />
            Achieved only
          </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as StatusFilter)}
            className="input-field text-sm h-9"
          >
            <option value="all">All statuses</option>
            {KEY_RESULT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {KEY_RESULT_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visible.map((kr) => (
          <KrCard
            key={kr.id}
            kr={kr}
            trackCount={
              tracks.filter((t) => t.internal_key_result_id === kr.id).length
            }
            onOpen={() => setOpen(kr)}
          />
        ))}
        {visible.length === 0 && (
          <div className="col-span-full p-10 text-center text-sm text-text-muted">
            No key results match the current filters.
          </div>
        )}
      </div>

      {open && (
        <KeyResultModal
          initial={open}
          goals={goals}
          tracks={tracks.filter((t) => t.internal_key_result_id === open.id)}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}

function KrCard({
  kr,
  trackCount,
  onOpen,
}: {
  kr: InternalKeyResult;
  trackCount: number;
  onOpen: () => void;
}) {
  const status = (kr.status ?? "not_started") as KeyResultStatus;
  // KRs in this schema track progress through `internal_key_result_track`
  // rows rather than a single current/target pair on the parent. Each
  // tracker locks its own target at creation; the parent KR is "achieved"
  // when at least one tracker landed at-or-above its target. So we show
  // the per-KR target value + how many tracker entries exist + the
  // achieved boolean.
  const target = Number(kr.current_key_result_value ?? 0);
  const cardCls = kr.achieved
    ? "border-emerald-500/30 bg-emerald-500/5"
    : "border-border bg-elevated";

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`text-left rounded-lg border ${cardCls} p-4 hover:border-accent transition-colors`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-text-primary leading-snug line-clamp-3">
          {kr.name}
        </h3>
        <span
          className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-medium ${KEY_RESULT_STATUS_CLASSES[status]}`}
        >
          {KEY_RESULT_STATUS_LABELS[status]}
        </span>
      </div>
      {kr.description && (
        <p className="text-xs text-text-muted line-clamp-2 mb-3">{kr.description}</p>
      )}
      <div className="flex items-center gap-3 text-[11px] text-text-muted">
        <span>Target: <span className="text-text-primary tabular-nums">{target || "—"}</span></span>
        <span>·</span>
        <span>
          {trackCount} track{trackCount === 1 ? "" : "s"}
        </span>
        <span className="ml-auto">
          {kr.achieved ? (
            <span className="text-emerald-400">✓ Achieved</span>
          ) : (
            <span className="text-rose-400">Not achieved</span>
          )}
        </span>
      </div>
    </button>
  );
}
