"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import DatePicker from "@/components/DatePicker";
import type { UserProfile } from "@/types/projects";
import {
  INTERNAL_TASK_STATUSES,
  INTERNAL_TASK_STATUS_LABELS,
  INTERNAL_TASK_STATUS_PILL,
  type InternalKeyResultRef,
  type InternalProject,
  type InternalTask,
  type InternalTaskStatus,
  type InternalTaskTimeTrack,
} from "@/types/internal-projects";
import {
  createInternalTask,
  createInternalTaskTimeTrack,
  deleteInternalTaskTimeTrack,
  updateInternalTask,
  updateInternalTaskTimeTrack,
} from "../actions";
import { UserMultiSelect } from "@/components/ui";
import InternalTaskChat from "./InternalTaskChat";
import { CloseIcon, ChevronDownIcon, DeleteIcon, AddIcon } from "@/components/ui/icons";

const RichTextEditor = dynamic(
  () =>
    import("@/components/editor/RichTextEditor").then(
      (m) => m.RichTextEditor
    ),
  { ssr: false }
);

interface CreateContext {
  status: InternalTaskStatus;
  order: number;
}

interface Props {
  task: InternalTask | null;
  project: InternalProject;
  profiles: UserProfile[];
  keyResults: InternalKeyResultRef[];
  timeTracks: InternalTaskTimeTrack[];
  currentUserId: string;
  createCtx?: CreateContext;
  onClose: () => void;
}

interface LocalTimeEntry {
  id?: string;
  date: string;
  startMin: number | null;
  endMin: number | null;
  spentH: number | null;
  ownerId: string;
  isNew: boolean;
}

const today = new Date().toISOString().slice(0, 10);

function minutesToHHMM(min: number | null): string {
  if (min == null) return "";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function hhmmToMinutes(v: string): number | null {
  if (!v) return null;
  const [h, m] = v.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function computeSpent(
  startMin: number | null,
  endMin: number | null
): number | null {
  if (startMin == null || endMin == null) return null;
  const diff = endMin - startMin;
  if (diff <= 0) return 0;
  return Math.round((diff / 60) * 100) / 100;
}

export default function InternalTaskModal({
  task,
  project,
  profiles,
  keyResults: _keyResults,
  timeTracks: initialTracks,
  currentUserId,
  createCtx,
  onClose,
}: Props) {
  const router = useRouter();
  const isEdit = !!task;
  const [isPending, startSave] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(task?.name ?? "");
  const [status, setStatus] = useState<InternalTaskStatus>(
    task?.status ?? createCtx?.status ?? "not_started"
  );
  const [assignees, setAssignees] = useState<string[]>(task?.assignees ?? []);
  const [estimatedTime, setEstimatedTime] = useState<string>(
    task?.estimated_time == null ? "" : String(task.estimated_time)
  );
  const [startEst, setStartEst] = useState(task?.estimated_start_date ?? "");
  const [endEst, setEndEst] = useState(task?.estimated_end_date ?? "");
  const [startReal, setStartReal] = useState(task?.real_start_date ?? "");
  const [endReal, setEndReal] = useState(task?.real_end_date ?? "");
  const [description, setDescription] = useState(task?.description ?? "");

  const [entries, setEntries] = useState<LocalTimeEntry[]>(
    initialTracks.map((t) => ({
      id: t.id,
      date: t.start_date ?? today,
      startMin: t.start_time_min,
      endMin: t.end_time_min,
      spentH: t.time_spent_h,
      // owner_id → assignee_id (B8 item 30). Preserve the
      // local field name `ownerId` to minimize churn in the modal's
      // form-state shape; only the DB-bound write below switches.
      ownerId: t.assignee_id ?? currentUserId,
      isNew: false,
    }))
  );
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  const realTimeTotal = useMemo(
    () =>
      Math.round(
        entries.reduce((sum, e) => sum + (e.spentH ?? 0), 0) * 100
      ) / 100,
    [entries]
  );



  function toNumber(v: string): number | null {
    if (v.trim() === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  function addEntry() {
    setEntries((prev) => [
      ...prev,
      {
        date: today,
        startMin: null,
        endMin: null,
        spentH: null,
        ownerId: currentUserId,
        isNew: true,
      },
    ]);
  }

  function updateEntry(idx: number, patch: Partial<LocalTimeEntry>) {
    setEntries((prev) =>
      prev.map((e, i) => {
        if (i !== idx) return e;
        const next = { ...e, ...patch };
        if (
          ("startMin" in patch || "endMin" in patch) &&
          !("spentH" in patch)
        ) {
          next.spentH = computeSpent(next.startMin, next.endMin);
        }
        return next;
      })
    );
  }

  function removeEntry(idx: number) {
    const entry = entries[idx];
    if (entry.id) setDeletedIds((prev) => [...prev, entry.id!]);
    setEntries((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSave() {
    setError(null);
    const trimmed = name.trim() || "New task";

    startSave(async () => {
      let taskId = task?.id;
      const realTime = realTimeTotal === 0 ? null : realTimeTotal;

      if (isEdit && task) {
        const res = await updateInternalTask(task.id, {
          name: trimmed,
          status,
          assignees,
          estimated_time: toNumber(estimatedTime),
          real_time: realTime,
          estimated_start_date: startEst || null,
          estimated_end_date: endEst || null,
          real_start_date: startReal || null,
          real_end_date: endReal || null,
          description: description === "" ? null : description,
        });
        if (res.error) {
          setError(res.error);
          return;
        }
      } else {
        const res = await createInternalTask(
          project.id,
          status,
          trimmed,
          createCtx?.order
        );
        if (res.error || !res.taskId) {
          setError(res.error ?? "Failed to create task");
          return;
        }
        taskId = res.taskId;

        const patchRes = await updateInternalTask(taskId, {
          assignees,
          estimated_time: toNumber(estimatedTime),
          real_time: realTime,
          estimated_start_date: startEst || null,
          estimated_end_date: endEst || null,
          real_start_date: startReal || null,
          real_end_date: endReal || null,
          description: description === "" ? null : description,
        });
        if (patchRes.error) {
          setError(patchRes.error);
          return;
        }
      }

      for (const id of deletedIds) {
        await deleteInternalTaskTimeTrack(id);
      }

      for (const entry of entries) {
        if (entry.isNew || !entry.id) {
          await createInternalTaskTimeTrack(taskId!, project.id, {
            // owner_id was renamed to assignee_id in B8.
            assignee_id: entry.ownerId,
            start_date: entry.date,
            start_time_min: entry.startMin,
            end_time_min: entry.endMin,
            time_spent_h: entry.spentH,
          });
        } else {
          await updateInternalTaskTimeTrack(entry.id, {
            assignee_id: entry.ownerId,
            start_date: entry.date,
            start_time_min: entry.startMin,
            end_time_min: entry.endMin,
            time_spent_h: entry.spentH,
          });
        }
      }

      router.refresh();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface border border-border rounded-lg w-full max-w-3xl flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h3 className="text-heading-3 text-text-primary">
            {isEdit ? "Edit task" : "New task"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-text-muted hover:text-text-primary"
          >
            <CloseIcon className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          <Field label="Name">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Task name here"
              className="input-field w-full"
              autoFocus
            />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Status">
              <StatusDropdown value={status} onChange={setStatus} />
            </Field>
            <Field label="Assignees">
              <UserMultiSelect
                value={assignees}
                onChange={setAssignees}
                options={profiles.map((p) => ({
                  id: p.id,
                  name: [p.first_name, p.last_name].filter(Boolean).join(" ") || "Unknown",
                  role: p.type ?? null,
                  picture: p.picture ?? null,
                }))}
                placeholder="Add assignees"
              />
            </Field>

            <Field label="Estimated Time (h)">
              <input
                type="number"
                step="0.25"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                className="input-field w-full"
              />
            </Field>
            <Field label="Real Time (h)">
              <input
                type="number"
                step="0.25"
                value={realTimeTotal === 0 ? "" : String(realTimeTotal)}
                readOnly
                title="Auto-computed from time tracks"
                className="input-field w-full opacity-70 cursor-not-allowed"
              />
            </Field>

            <Field label="Start Date (Estimated)">
              <DatePicker value={startEst} onChange={setStartEst} />
            </Field>
            <Field label="End Date (Estimated)">
              <DatePicker value={endEst} onChange={setEndEst} />
            </Field>
            <Field label="Start Date (Real)">
              <DatePicker value={startReal} onChange={setStartReal} />
            </Field>
            <Field label="End Date (Real)">
              <DatePicker value={endReal} onChange={setEndReal} />
            </Field>
          </div>

          <Field label="Time Tracker">
            <TimeTrackerTable
              entries={entries}
              profiles={profiles}
              onAdd={addEntry}
              onUpdate={updateEntry}
              onDelete={removeEntry}
            />
          </Field>

          <Field label="Description">
            <div className="border border-border rounded-md overflow-hidden">
              <RichTextEditor
                initialHtml={description}
                onChange={setDescription}
                hideFooter
              />
            </div>
          </Field>

          <Field label="Chat">
            {!isEdit || !task ? (
              <div className="flex flex-col items-center justify-center py-6 text-text-muted rounded-md border border-border bg-muted/30">
                <p className="text-xs">
                  Save the task first to start chatting.
                </p>
              </div>
            ) : (
              <InternalTaskChat
                taskId={task.id}
                projectId={project.id}
                currentUserId={currentUserId}
              />
            )}
          </Field>

          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-muted text-text-secondary text-xs font-medium hover:bg-border transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="px-5 py-1.5 rounded-md bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save"}
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
  value: InternalTaskStatus;
  onChange: (s: InternalTaskStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative w-fit">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center text-[11px] px-2.5 py-1 rounded-full border ${INTERNAL_TASK_STATUS_PILL[value]}`}
      >
        {INTERNAL_TASK_STATUS_LABELS[value]}
        <ChevronDownIcon className="w-3 h-3 ml-1" strokeWidth={2} />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full mt-1 z-50 bg-surface border border-border rounded-md shadow-xl py-1 min-w-[160px]">
            {INTERNAL_TASK_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  onChange(s);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-muted"
              >
                <span
                  className={`inline-block text-[10px] px-2 py-0.5 rounded-full border ${INTERNAL_TASK_STATUS_PILL[s]}`}
                >
                  {INTERNAL_TASK_STATUS_LABELS[s]}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const TT_GRID =
  "grid grid-cols-[1.4fr_1fr_1fr_0.8fr_1.6fr_36px] gap-2 items-center";

function TimeTrackerTable({
  entries,
  profiles,
  onAdd,
  onUpdate,
  onDelete,
}: {
  entries: LocalTimeEntry[];
  profiles: UserProfile[];
  onAdd: () => void;
  onUpdate: (idx: number, patch: Partial<LocalTimeEntry>) => void;
  onDelete: (idx: number) => void;
}) {
  return (
    <div className="border border-border rounded-md overflow-hidden">
      <div
        className={`${TT_GRID} px-3 py-2 bg-muted/40 text-[10px] font-semibold uppercase tracking-wider text-text-muted`}
      >
        <div>Date</div>
        <div>Start</div>
        <div>End</div>
        <div>Spent (h)</div>
        <div>Owner</div>
        <div></div>
      </div>
      {entries.length === 0 && (
        <div className="px-3 py-4 text-xs text-text-muted text-center">
          No entries yet.
        </div>
      )}
      {entries.map((entry, idx) => {
        return (
          <div
            key={entry.id ?? `new-${idx}`}
            className={`${TT_GRID} px-3 py-1.5 border-t border-border`}
          >
            <input
              type="date"
              value={entry.date}
              onChange={(e) =>
                onUpdate(idx, { date: e.target.value || today })
              }
              className="input-field text-xs"
            />
            <input
              type="time"
              value={minutesToHHMM(entry.startMin)}
              onChange={(e) =>
                onUpdate(idx, { startMin: hhmmToMinutes(e.target.value) })
              }
              className="input-field text-xs"
            />
            <input
              type="time"
              value={minutesToHHMM(entry.endMin)}
              onChange={(e) =>
                onUpdate(idx, { endMin: hhmmToMinutes(e.target.value) })
              }
              className="input-field text-xs"
            />
            <input
              type="number"
              step="0.25"
              value={entry.spentH ?? ""}
              onChange={(e) => {
                const v = e.target.value.trim();
                const num = v === "" ? null : Number(v);
                if (num !== null && !Number.isFinite(num)) return;
                onUpdate(idx, { spentH: num });
              }}
              className="input-field text-xs text-center"
            />
            <select
              value={entry.ownerId}
              onChange={(e) => onUpdate(idx, { ownerId: e.target.value })}
              className="input-field text-xs"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {[p.first_name, p.last_name].filter(Boolean).join(" ") ||
                    "User"}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => onDelete(idx)}
              className="p-1 text-text-muted hover:text-rose-400 rounded justify-self-center"
              title="Delete entry"
            >
              <DeleteIcon className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          </div>
        );
      })}
      <button
        type="button"
        onClick={onAdd}
        className="w-full px-3 py-2 text-xs text-text-muted hover:text-accent hover:bg-muted/40 border-t border-border inline-flex items-center justify-center gap-1.5"
      >
        <AddIcon className="w-3.5 h-3.5" strokeWidth={2} />
        Add row
      </button>
    </div>
  );
}
