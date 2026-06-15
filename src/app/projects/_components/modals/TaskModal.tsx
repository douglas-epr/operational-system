"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import DatePicker from "@/components/DatePicker";
import type {
  Task,
  TaskStatus,
  TaskType,
  TaskLevel,
  TaskPriority,
  TaskCategory,
  TimeTrack,
  UserProfile,
} from "@/types/projects";
import { TIME_OPTIONS, minToTimeStr, timeStrToMin, PRIORITY_LABELS, CATEGORY_LABELS } from "@/types/projects";
import {
  createTask,
  updateTask,
  upsertTimeEntry,
  deleteTimeEntry,
  getTaskTimeEntries,
  createTaskComment,
  type TaskInput,
} from "../../actions";
import RichTextEditor from "@/app/ideas-refiner/_components/RichTextEditor";
import UserPicker from "@/components/UserPicker";
import TaskChat from "./TaskChat";

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  /** null = create mode */
  task?: Task | null;
  projectId: string;
  parentTaskId?: string | null;
  type: TaskType;
  level: TaskLevel;
  profiles: UserProfile[];
  /** User IDs allowed to be assigned to this task (project.authorized_users).
   *  If omitted, all profiles are available. */
  authorizedUserIds?: string[];
  /** Existing time track entries for this task */
  timeEntries?: TimeTrack[];
  currentUserId: string;
  /** Available milestones for client_requests task creation */
  milestones?: Task[];
  /** Pre-set status when creating from a Kanban column */
  defaultStatus?: TaskStatus;
  /** Pre-set order when creating from a Kanban column */
  defaultOrder?: number;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "not_started",  label: "Not Started" },
  { value: "in_progress",  label: "In Progress" },
  { value: "ready_for_qa", label: "Ready for QA" },
  { value: "done",         label: "Done" },
  { value: "blocked",      label: "Blocked" },
];

interface LocalTimeEntry {
  id?: string;
  date: string;
  startMin: number;
  endMin: number;
  isNew: boolean;
}

function computeSpent(startMin: number, endMin: number): number {
  const diff = endMin - startMin;
  return diff > 0 ? Math.round((diff / 60) * 100) / 100 : 0;
}

const today = new Date().toISOString().split("T")[0];

export default function TaskModal({
  open,
  onClose,
  task,
  projectId,
  parentTaskId,
  type,
  level,
  profiles,
  authorizedUserIds,
  timeEntries = [],
  currentUserId,
  milestones = [],
  defaultStatus,
  defaultOrder,
}: TaskModalProps) {
  const router = useRouter();
  const isEdit = !!task;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Task fields
  const [name, setName] = useState(task?.name ?? "");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? defaultStatus ?? "not_started");
  const [estimatedTime, setEstimatedTime] = useState(task?.estimated_time?.toString() ?? "");
  const [startEst, setStartEst] = useState(task?.start_date_estimated ?? "");
  const [endEst, setEndEst] = useState(task?.end_date_estimated ?? "");
  const [startReal, setStartReal] = useState(task?.start_date_real ?? "");
  const [endReal, setEndReal] = useState(task?.end_date_real ?? "");
  const [description, setDescription] = useState("");
  const [assigneeIds, setAssigneeIds] = useState<string[]>(
    task?.task_assignees?.map((a) => a.user_id) ?? []
  );
  const [priorityLevel, setPriorityLevel] = useState<TaskPriority | "">(
    task?.priority_level ?? (type === "client_requests" ? "medium" : "critical")
  );
  const [category, setCategory] = useState<TaskCategory | "">(
    task?.category ?? (type === "client_requests" ? "bug" : "main_task")
  );

  // Milestone picker for client/qa requests
  const showMilestonePicker = !isEdit && type === "client_requests" && milestones.length > 0;
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>(
    parentTaskId ?? milestones[0]?.id ?? ""
  );

  // Draft chat messages (create mode only — flushed after task is saved)
  const [draftMessages, setDraftMessages] = useState<string[]>([]);
  const [draftInput, setDraftInput] = useState("");

  // Local time entries state
  const [entries, setEntries] = useState<LocalTimeEntry[]>(
    timeEntries.map((e) => ({
      id: e.id,
      date: e.start_date ?? today,
      startMin: e.start_time_min ?? 540,
      endMin: e.end_time_min ?? 1020,
      isNew: false,
    }))
  );
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  // Fetch saved time entries when editing an existing task
  useEffect(() => {
    if (!open || !isEdit || !task) return;
    getTaskTimeEntries(task.id).then((rows) => {
      setEntries(
        rows.map((e) => ({
          id: e.id,
          date: e.start_date ?? today,
          startMin: e.start_time_min ?? 540,
          endMin: e.end_time_min ?? 1020,
          isNew: false,
        }))
      );
      setDeletedIds([]);
    });
  }, [open, isEdit, task]);

  const addEntry = () => {
    setEntries((prev) => [
      ...prev,
      { date: today, startMin: 540, endMin: 1020, isNew: true },
    ]);
  };

  const removeEntry = (idx: number) => {
    const entry = entries[idx];
    if (entry.id) setDeletedIds((prev) => [...prev, entry.id!]);
    setEntries((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateEntry = (idx: number, patch: Partial<LocalTimeEntry>) => {
    setEntries((prev) => prev.map((e, i) => (i === idx ? { ...e, ...patch } : e)));
  };

  const realTimeTotal = entries.reduce((sum, e) => sum + computeSpent(e.startMin, e.endMin), 0);

  const handleSave = () => {
    setError(null);
    if (!name.trim()) { setError("Name is required."); return; }

    startTransition(async () => {
      const taskPayload: TaskInput = {
        name: name.trim(),
        project_id: projectId,
        parent_task_id: showMilestonePicker ? (selectedMilestoneId || null) : (parentTaskId ?? null),
        type,
        level,
        status,
        estimated_time: estimatedTime ? parseFloat(estimatedTime) : null,
        start_date_estimated: startEst || null,
        end_date_estimated: endEst || null,
        start_date_real: startReal || null,
        end_date_real: endReal || null,
        order: task?.order ?? defaultOrder ?? null,
        assignee_ids: assigneeIds,
        priority_level: (priorityLevel || null) as TaskPriority | null,
        category: (category || null) as TaskCategory | null,
      };

      let taskId = task?.id;
      if (isEdit) {
        const res = await updateTask(task!.id, taskPayload);
        if (res.error) { setError(res.error); return; }
      } else {
        const res = await createTask(taskPayload);
        if (res.error) { setError(res.error); return; }
        taskId = res.id;
      }

      for (const id of deletedIds) {
        await deleteTimeEntry(id, projectId);
      }

      for (const entry of entries) {
        await upsertTimeEntry({
          id: entry.id,
          task_id: taskId!,
          project_id: projectId,
          start_date: entry.date,
          start_time_min: entry.startMin,
          end_time_min: entry.endMin,
          time_spent_h: computeSpent(entry.startMin, entry.endMin),
        });
      }

      // Flush buffered chat messages from create mode
      if (!isEdit && taskId) {
        for (const msg of draftMessages) {
          await createTaskComment(taskId, projectId, msg, []);
        }
      }

      router.refresh();
      onClose();
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Task" width="max-w-2xl">
      <div className="flex-1 overflow-y-auto min-h-0 px-6 pb-2 space-y-5">
        {/* Name */}
        <div>
          <label className="text-xs font-medium text-text-secondary mb-1 block">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            placeholder="Task name"
          />
        </div>

        {/* Milestone picker for client/qa requests */}
        {showMilestonePicker && (
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">Milestone (optional)</label>
            <select
              value={selectedMilestoneId}
              onChange={(e) => setSelectedMilestoneId(e.target.value)}
              className="input-field"
            >
              <option value="">No milestone</option>
              {milestones.map((m) => (
                <option key={m.id} value={m.id}>{m.name ?? "Untitled Milestone"}</option>
              ))}
            </select>
          </div>
        )}

        {/* Status + Assignees */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} className="input-field">
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">Assignees</label>
            <UserPicker
              profiles={authorizedUserIds ? profiles.filter((p) => authorizedUserIds.includes(p.id)) : profiles}
              selectedIds={assigneeIds}
              onChange={setAssigneeIds}
            />
          </div>
        </div>

        {/* Priority Level + Category */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">Priority Level</label>
            <select value={priorityLevel} onChange={(e) => setPriorityLevel(e.target.value as TaskPriority)} className="input-field">
              <option value="">— None —</option>
              {(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map((p) => (
                <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as TaskCategory)} className="input-field">
              <option value="">— None —</option>
              {(Object.keys(CATEGORY_LABELS) as TaskCategory[]).map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Est. time + Real time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">Estimated Time (h)</label>
            <input type="number" min="0" step="0.5" value={estimatedTime} onChange={(e) => setEstimatedTime(e.target.value)} className="input-field" placeholder="0" />
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">Real Time (h)</label>
            <input type="text" readOnly value={realTimeTotal.toFixed(2)} className="input-field bg-base cursor-default text-text-muted" />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">Start Date (Estimated)</label>
            <DatePicker value={startEst} onChange={setStartEst} maxDate={endEst || null} />
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">End Date (Estimated)</label>
            <DatePicker value={endEst} onChange={setEndEst} minDate={startEst || null} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">Start Date (Real)</label>
            <DatePicker value={startReal} onChange={setStartReal} readOnly />
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">End Date (Real)</label>
            <DatePicker value={endReal} onChange={setEndReal} readOnly />
          </div>
        </div>

        {/* Time Tracker */}
        <div>
          <p className="text-xs font-medium text-text-secondary mb-2">Time Tracker</p>
          <div className="rounded-md border border-border overflow-hidden">
            <div className="grid grid-cols-[1fr_110px_110px_90px_40px_32px] gap-2 px-3 py-2 bg-muted text-xs font-semibold text-text-secondary">
              <span>Date</span>
              <span>Start Time</span>
              <span>End Time</span>
              <span>Time Spent (h)</span>
              <span>Owner</span>
              <span />
            </div>

            {entries.map((entry, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_110px_110px_90px_40px_32px] gap-2 px-3 py-2 border-t border-border items-center">
                <DatePicker
                  value={entry.date}
                  onChange={(v) => updateEntry(idx, { date: v })}
                  size="compact"
                />
                <select
                  value={minToTimeStr(entry.startMin)}
                  onChange={(e) => updateEntry(idx, { startMin: timeStrToMin(e.target.value) })}
                  className="text-xs bg-muted border border-border rounded px-2 py-1 text-text-primary focus:outline-none focus:border-accent"
                >
                  {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <select
                  value={minToTimeStr(entry.endMin)}
                  onChange={(e) => updateEntry(idx, { endMin: timeStrToMin(e.target.value) })}
                  className="text-xs bg-muted border border-border rounded px-2 py-1 text-text-primary focus:outline-none focus:border-accent"
                >
                  {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <span className="text-xs text-text-secondary px-1">
                  {computeSpent(entry.startMin, entry.endMin).toFixed(2)}
                </span>
                <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white text-[10px] font-semibold">
                  Me
                </div>
                <button onClick={() => removeEntry(idx)} className="p-1 text-text-muted hover:text-red-400 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}

            <div className="border-t border-border">
              <button
                onClick={addEntry}
                className="flex items-center gap-1.5 px-3 py-2 text-xs text-text-muted hover:text-text-secondary transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-medium text-text-secondary mb-1 block">Description</label>
          <RichTextEditor
            content={description}
            onChange={setDescription}
            placeholder="Task description…"
            minHeight="min-h-24"
          />
        </div>

        {/* Chat */}
        <div>
          <p className="text-xs font-medium text-text-secondary mb-2">Chat</p>
          {isEdit && task ? (
            <TaskChat
              taskId={task.id}
              projectId={projectId}
              currentUserId={currentUserId}
            />
          ) : (
            <div className="rounded-md border border-border overflow-hidden flex flex-col">
              <div className="flex flex-col gap-2 p-3 max-h-[200px] overflow-y-auto bg-muted/20 min-h-[60px]">
                {draftMessages.length === 0 ? (
                  <p className="text-xs text-text-muted text-center py-2">No messages yet — messages will be saved with the task.</p>
                ) : (
                  draftMessages.map((msg, i) => (
                    <div key={i} className="flex justify-end">
                      <span className="rounded-2xl rounded-br-sm bg-accent text-white text-xs px-3 py-2 whitespace-pre-wrap break-words max-w-[85%]">{msg}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="flex items-center gap-2 px-3 py-2 border-t border-border bg-muted/30">
                <input
                  type="text"
                  value={draftInput}
                  onChange={(e) => setDraftInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && draftInput.trim()) {
                      e.preventDefault();
                      setDraftMessages((prev) => [...prev, draftInput.trim()]);
                      setDraftInput("");
                    }
                  }}
                  placeholder="Type here..."
                  className="flex-1 bg-transparent text-xs text-text-primary placeholder:text-text-muted outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!draftInput.trim()) return;
                    setDraftMessages((prev) => [...prev, draftInput.trim()]);
                    setDraftInput("");
                  }}
                  disabled={!draftInput.trim()}
                  className="p-1.5 rounded-md bg-accent hover:bg-accent-hover text-white transition-colors disabled:opacity-40"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
        <button onClick={onClose} className="px-5 py-2 rounded-md bg-muted text-text-secondary text-sm font-medium hover:bg-border transition-colors">
          Close
        </button>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="px-6 py-2 rounded-md bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </Modal>
  );
}
