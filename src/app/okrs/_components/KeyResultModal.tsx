"use client";

import { useRef, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  RichTextEditor,
  type RichTextEditorHandle,
} from "@/components/editor/RichTextEditor";
import DatePicker from "@/components/DatePicker";
import {
  KR_STATUSES,
  KR_STATUS_LABELS,
  KR_STATUS_PILL,
  type InternalGoal,
  type InternalKeyResult,
  type InternalKeyResultStatus,
  type InternalKeyResultTrack,
} from "@/types/okrs";
import { updateKeyResult } from "../actions";
// Recharts is heavy and only needed once this modal opens — load it lazily
// so it stays out of the initial OKRs page bundle.
const KeyResultsTracker = dynamic(() => import("./KeyResultsTracker"), {
  ssr: false,
  loading: () => <div className="h-[260px] animate-pulse rounded bg-muted" />,
});
import { CloseIcon, ChevronDownIcon } from "@/components/ui/icons";

interface Props {
  initial: InternalKeyResult;
  goals: InternalGoal[];
  tracks: InternalKeyResultTrack[];
  onClose: () => void;
}

export default function KeyResultModal({
  initial,
  goals,
  tracks,
  onClose,
}: Props) {
  const router = useRouter();
  const [name, setName] = useState<string>(initial.name);
  const [goalId, setGoalId] = useState<string>(initial.internal_goal_id);
  const [status, setStatus] = useState<InternalKeyResultStatus>(initial.status);
  const [startDate, setStartDate] = useState<string>(initial.start_date ?? "");
  const [endDate, setEndDate] = useState<string>(initial.end_date ?? "");
  const [currentValue, setCurrentValue] = useState<string>(
    initial.current_key_result_value === null ||
      initial.current_key_result_value === undefined
      ? ""
      : String(initial.current_key_result_value)
  );
  const editorRef = useRef<RichTextEditorHandle>(null);
  const [saving, startSave] = useTransition();

  // KR-level achieved is derived: latest track (by date) value >= current KR target.
  // Both numbers must be present — null on either side collapses to false.
  const parsedCurrentValue: number | null = (() => {
    if (currentValue === "") return null;
    const n = Number(currentValue);
    return Number.isFinite(n) ? n : null;
  })();
  const latestTrackValue: number | null = (() => {
    if (tracks.length === 0) return null;
    // Sort newest-first: by date, then by created_at as tiebreaker so
    // multiple entries on the same day still resolve to a single "latest".
    const latest = [...tracks].sort((a, b) => {
      const d = b.date.localeCompare(a.date);
      if (d !== 0) return d;
      return (b.created_at ?? "").localeCompare(a.created_at ?? "");
    })[0];
    return latest?.value ?? null;
  })();
  const achieved =
    latestTrackValue !== null &&
    parsedCurrentValue !== null &&
    latestTrackValue >= parsedCurrentValue;

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      alert("Name is required");
      return;
    }
    const description = editorRef.current?.getHTML() ?? "";

    startSave(async () => {
      const res = await updateKeyResult(initial.id, {
        name: trimmed,
        internal_goal_id: goalId,
        status,
        start_date: startDate || null,
        end_date: endDate || null,
        current_key_result_value: parsedCurrentValue,
        achieved,
        description,
      });
      if (res.error) {
        alert(res.error);
        return;
      }
      onClose();
      router.refresh();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface border border-border rounded-lg w-full max-w-4xl flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h3 className="text-heading-3 text-text-primary">Edit key result</h3>
          <button
            onClick={onClose}
            className="p-1 text-text-muted hover:text-text-primary"
          >
            <CloseIcon className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Name">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field w-full"
                autoFocus
              />
            </Field>
            <Field label="Goal">
              <select
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
                className="input-field w-full"
              >
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Start Date (Estimated)">
              <DatePicker value={startDate} onChange={setStartDate} />
            </Field>
            <Field label="End Date (Estimated)">
              <DatePicker value={endDate} onChange={setEndDate} />
            </Field>
            <Field label="Status">
              <StatusDropdown value={status} onChange={setStatus} />
            </Field>
            <Field label="Current Target Key Result Value">
              <input
                type="number"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                className="input-field w-full"
              />
            </Field>
            <Field label="Achieved">
              <span
                className={`inline-flex items-center text-[11px] px-2.5 py-1 rounded-full border w-fit ${
                  achieved
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : "bg-muted text-text-secondary border-border"
                }`}
                title="Derived from latest tracker entry vs target"
              >
                {achieved ? "Yes" : "No"}
              </span>
            </Field>
          </div>

          {/* Tracker */}
          <KeyResultsTracker
            krId={initial.id}
            goalId={goalId}
            tracks={tracks}
            krCurrentValue={parsedCurrentValue}
          />

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
              Description
            </label>
            <div className="border border-border rounded-md overflow-hidden bg-muted/30 min-h-[220px]">
              <RichTextEditor
                ref={editorRef}
                initialHtml={initial.description ?? ""}
                hideFooter
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border shrink-0">
          <button
            onClick={onClose}
            className="text-xs text-text-secondary hover:text-text-primary px-3 py-1.5"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-accent hover:bg-accent-hover text-white text-xs font-medium px-3 py-1.5 rounded-md disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

function StatusDropdown({
  value,
  onChange,
}: {
  value: InternalKeyResultStatus;
  onChange: (s: InternalKeyResultStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative w-fit">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center text-[11px] px-2.5 py-1 rounded-full border ${KR_STATUS_PILL[value]}`}
      >
        {KR_STATUS_LABELS[value]}
        <ChevronDownIcon className="w-3 h-3 ml-1" strokeWidth={2} />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full mt-1 z-50 bg-surface border border-border rounded-md shadow-xl py-1 min-w-[160px]">
            {KR_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => {
                  onChange(s);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-muted"
              >
                <span
                  className={`inline-block text-[10px] px-2 py-0.5 rounded-full border ${KR_STATUS_PILL[s]}`}
                >
                  {KR_STATUS_LABELS[s]}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
