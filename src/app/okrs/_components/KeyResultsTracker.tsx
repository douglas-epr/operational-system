"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import DatePicker from "@/components/DatePicker";
import type { InternalKeyResultTrack } from "@/types/okrs";
import {
  createTrackEntry,
  deleteTrackEntry,
  updateTrackEntry,
} from "../actions";
import { DeleteIcon, CheckIcon } from "@/components/ui/icons";

interface Props {
  krId: string;
  goalId: string;
  tracks: InternalKeyResultTrack[];
  /** Live KR target — `internal_key_result.current_key_result_value`. New
   * tracker rows lock their `current_target_key_result_value` to this at
   * creation time, and each row's `achieved` is derived from
   * `value >= current_target_key_result_value`. */
  krCurrentValue: number | null;
}

type View = "list" | "chart";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function toNumberOrNull(v: string): number | null {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Track entry's achieved flag = value >= target. Null on either side
 * collapses to false (can't claim achieved without both numbers). */
function deriveAchieved(
  value: number | null,
  target: number | null
): boolean {
  if (value === null || target === null) return false;
  return value >= target;
}

export default function KeyResultsTracker({
  krId,
  goalId,
  tracks,
  krCurrentValue,
}: Props) {
  const router = useRouter();
  const [view, setView] = useState<View>("list");
  const [busy, startTransition] = useTransition();

  const sorted = [...tracks].sort((a, b) => a.date.localeCompare(b.date));

  async function addRow() {
    startTransition(async () => {
      // Spec: target locks to KR.current_key_result_value at creation.
      // Initial value is null → achieved=false.
      const res = await createTrackEntry(goalId, krId, {
        date: todayIso(),
        value: null,
        current_target_key_result_value: krCurrentValue,
        achieved: deriveAchieved(null, krCurrentValue),
      });
      if (res.error) {
        alert(res.error);
        return;
      }
      router.refresh();
    });
  }

  async function saveField(
    id: string,
    patch: Partial<
      Pick<
        InternalKeyResultTrack,
        "date" | "value" | "current_target_key_result_value" | "achieved"
      >
    >
  ) {
    startTransition(async () => {
      const res = await updateTrackEntry(id, patch);
      if (res.error) {
        alert(res.error);
        return;
      }
      router.refresh();
    });
  }

  async function removeRow(id: string) {
    startTransition(async () => {
      const res = await deleteTrackEntry(id);
      if (res.error) {
        alert(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
          Key Results Tracker
        </label>
        {/* View toggle */}
        <div className="inline-flex rounded-md border border-border overflow-hidden text-[11px]">
          <button
            onClick={() => setView("list")}
            className={`px-2.5 py-1 ${
              view === "list"
                ? "bg-accent text-white"
                : "bg-muted text-text-secondary hover:text-text-primary"
            }`}
          >
            List
          </button>
          <button
            onClick={() => setView("chart")}
            className={`px-2.5 py-1 ${
              view === "chart"
                ? "bg-accent text-white"
                : "bg-muted text-text-secondary hover:text-text-primary"
            }`}
          >
            Chart
          </button>
        </div>
      </div>

      {view === "list" ? (
        <div className="border border-border rounded-md overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_1fr_80px_40px] gap-2 px-3 py-1.5 bg-muted/40 text-[11px] font-medium uppercase tracking-wider text-text-muted">
            <div>Date</div>
            <div>Value</div>
            <div>Target Value</div>
            <div>Achieved?</div>
            <div></div>
          </div>
          {sorted.length === 0 && (
            <div className="px-3 py-4 text-center text-xs text-text-muted">
              No tracker entries yet.
            </div>
          )}
          {sorted.map((t) => (
            <TrackRow
              key={t.id}
              entry={t}
              busy={busy}
              onChange={(patch) => saveField(t.id, patch)}
              onDelete={() => removeRow(t.id)}
            />
          ))}
          <div className="px-3 py-2 border-t border-border">
            <button
              onClick={addRow}
              disabled={busy}
              className="text-[11px] text-text-muted hover:text-accent disabled:opacity-50"
            >
              + Add entry
            </button>
          </div>
        </div>
      ) : (
        <div className="border border-border rounded-md p-3 bg-muted/10 h-[260px]">
          {sorted.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-text-muted">
              Add at least one tracker entry to see the chart.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={sorted.map((t) => ({
                  date: t.date,
                  Value: t.value ?? null,
                  Target: t.current_target_key_result_value ?? null,
                }))}
                margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" stroke="var(--color-text-muted)" fontSize={10} />
                <YAxis stroke="var(--color-text-muted)" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    fontSize: 11,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line
                  type="monotone"
                  dataKey="Value"
                  name="Current Value"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="Target"
                  name="Target Value"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  );
}

function TrackRow({
  entry,
  busy,
  onChange,
  onDelete,
}: {
  entry: InternalKeyResultTrack;
  busy: boolean;
  onChange: (
    patch: Partial<
      Pick<
        InternalKeyResultTrack,
        "date" | "value" | "current_target_key_result_value" | "achieved"
      >
    >
  ) => void;
  onDelete: () => void;
}) {
  const [value, setValue] = useState<string>(
    entry.value === null || entry.value === undefined
      ? ""
      : String(entry.value)
  );

  const target = entry.current_target_key_result_value;
  const numericValue = toNumberOrNull(value);
  const achieved = deriveAchieved(numericValue, target);

  function handleValueBlur() {
    const newVal = toNumberOrNull(value);
    if (newVal === entry.value) return;
    onChange({
      value: newVal,
      // Achieved is derived — keep it consistent with the new value.
      achieved: deriveAchieved(newVal, target),
    });
  }

  return (
    <div className="grid grid-cols-[1fr_1fr_1fr_80px_40px] gap-2 px-3 py-1.5 items-center border-t border-border">
      <DatePicker
        value={entry.date}
        onChange={(v) => onChange({ date: v || entry.date })}
        size="compact"
      />
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleValueBlur}
        className="text-xs bg-muted border border-border rounded px-2 py-1 text-text-primary focus:outline-none focus:border-accent w-full"
      />
      {/* Target Value: derived from the parent KR at creation time;
          read-only in the row. */}
      <div className="text-xs text-text-secondary px-2 py-1">
        {target === null || target === undefined ? "—" : String(target)}
      </div>
      {/* Achieved?: derived from value >= target; read-only. */}
      <div className="flex items-center">
        <span
          className={`inline-block h-3.5 w-3.5 rounded-sm border ${
            achieved
              ? "bg-emerald-500/30 border-emerald-500"
              : "bg-muted border-border"
          }`}
          title={achieved ? "Achieved" : "Not yet achieved"}
        >
          {achieved && (
            <CheckIcon className="w-full h-full text-emerald-300" strokeWidth={3} />
          )}
        </span>
      </div>
      <button
        onClick={onDelete}
        disabled={busy}
        className="text-text-muted hover:text-rose-400 p-1"
        title="Delete entry"
      >
        <DeleteIcon className="w-3.5 h-3.5" strokeWidth={2} />
      </button>
    </div>
  );
}
