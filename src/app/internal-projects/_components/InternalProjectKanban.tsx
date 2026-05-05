"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { UserProfile } from "@/types/projects";
import {
  INTERNAL_TASK_STATUSES,
  INTERNAL_TASK_STATUS_LABELS,
  type InternalKeyResultRef,
  type InternalProject,
  type InternalProjectAssignee,
  type InternalTask,
  type InternalTaskStatus,
  type InternalTaskTimeTrack,
} from "@/types/internal-projects";
import {
  deleteInternalTask,
  updateInternalTask,
} from "../actions";
import InternalTaskModal from "./InternalTaskModal";
import { ChevronRightIcon, AddIcon, EditIcon, DeleteIcon } from "@/components/ui/icons";

type CreateContext = { status: InternalTaskStatus; order: number };
type TaskModalState = {
  open: boolean;
  taskId: string | null;
  createCtx?: CreateContext;
};

interface Props {
  project: InternalProject;
  tasks: InternalTask[];
  profiles: UserProfile[];
  projectAssignees: InternalProjectAssignee[];
  timeTracks: InternalTaskTimeTrack[];
  keyResults: InternalKeyResultRef[];
  currentUserId: string;
}

const COLUMN_ACCENT: Record<InternalTaskStatus, string> = {
  not_started: "border-t-[#52525b]",
  in_progress: "border-t-[#3b82f6]",
  done: "border-t-[#22c55e]",
  blocked: "border-t-[#ef4444]",
};

type DropTarget =
  | { type: "before"; taskId: string; status: InternalTaskStatus }
  | { type: "end"; status: InternalTaskStatus };

export default function InternalProjectKanban({
  project,
  tasks,
  profiles,
  projectAssignees: _projectAssignees,
  timeTracks,
  keyResults,
  currentUserId,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [taskModal, setTaskModal] = useState<TaskModalState>({
    open: false,
    taskId: null,
  });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [localTasks, setLocalTasks] = useState<InternalTask[]>(tasks);
  useEffect(() => setLocalTasks(tasks), [tasks]);

  const draggingIdRef = useRef<string | null>(null);
  const dropTargetRef = useRef<DropTarget | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  function setDropTargetBoth(t: DropTarget | null) {
    dropTargetRef.current = t;
    setDropTarget(t);
  }

  const byStatus = useMemo(() => {
    const m = new Map<InternalTaskStatus, InternalTask[]>();
    INTERNAL_TASK_STATUSES.forEach((s) => m.set(s, []));
    for (const t of localTasks) {
      m.get(t.status)!.push(t);
    }
    INTERNAL_TASK_STATUSES.forEach((s) => {
      m.get(s)!.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    });
    return m;
  }, [localTasks]);

  const editingTask = taskModal.taskId
    ? localTasks.find((t) => t.id === taskModal.taskId) ?? null
    : null;

  function openCreate(status: InternalTaskStatus) {
    const col = byStatus.get(status) ?? [];
    const lastOrder = col.length > 0 ? (col[col.length - 1].order ?? 0) : -1;
    setTaskModal({
      open: true,
      taskId: null,
      createCtx: { status, order: lastOrder + 1 },
    });
  }

  function openEdit(taskId: string) {
    setTaskModal({ open: true, taskId });
  }

  function closeTaskModal() {
    setTaskModal({ open: false, taskId: null });
  }

  const deletingTask = confirmDeleteId
    ? localTasks.find((t) => t.id === confirmDeleteId) ?? null
    : null;

  function computeNewOrder(target: DropTarget): number {
    const dragId = draggingIdRef.current;
    const col = (byStatus.get(target.status) ?? []).filter(
      (t) => t.id !== dragId
    );
    if (target.type === "end") {
      if (col.length === 0) return 0;
      return (col[col.length - 1].order ?? 0) + 1;
    }
    const idx = col.findIndex((t) => t.id === target.taskId);
    if (idx === -1) {
      if (col.length === 0) return 0;
      return (col[col.length - 1].order ?? 0) + 1;
    }
    if (idx === 0) return (col[0].order ?? 0) - 1;
    return ((col[idx - 1].order ?? 0) + (col[idx].order ?? 0)) / 2;
  }

  function handleDrop() {
    const target = dropTargetRef.current;
    const taskId = draggingIdRef.current;
    if (!taskId || !target) return;
    const t = localTasks.find((x) => x.id === taskId);
    if (!t) return;

    const newStatus = target.status;
    const newOrder = computeNewOrder(target);

    draggingIdRef.current = null;
    dropTargetRef.current = null;
    setDraggingId(null);
    setDropTarget(null);

    setLocalTasks((prev) =>
      prev.map((x) =>
        x.id === taskId ? { ...x, status: newStatus, order: newOrder } : x
      )
    );

    startTransition(async () => {
      await updateInternalTask(taskId, { status: newStatus, order: newOrder });
      router.refresh();
    });
  }

  function onDragStart(e: React.DragEvent, taskId: string) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("taskId", taskId);
    draggingIdRef.current = taskId;
    setTimeout(() => setDraggingId(taskId), 0);
  }

  function onDragEnd() {
    draggingIdRef.current = null;
    dropTargetRef.current = null;
    setDraggingId(null);
    setDropTarget(null);
  }

  function handleConfirmDelete() {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    startTransition(async () => {
      const res = await deleteInternalTask(id);
      if (res.error) {
        alert(res.error);
        return;
      }
      setConfirmDeleteId(null);
      router.refresh();
    });
  }

  return (
    <>
      {/* Header / breadcrumb */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2 text-sm">
          <Link
            href="/internal-projects"
            className="text-text-muted hover:text-text-primary"
          >
            Projects
          </Link>
          <ChevronRightIcon className="w-3 h-3 text-text-muted" strokeWidth={2} />
          <span className="text-text-primary font-medium">{project.name}</span>
        </div>
      </div>

      {/* Kanban */}
      <div className="flex-1 overflow-auto p-4">
        <div className="flex gap-3">
          {INTERNAL_TASK_STATUSES.map((status) => {
            const col = byStatus.get(status) ?? [];
            const isEndTarget =
              dropTarget?.type === "end" && dropTarget.status === status;

            return (
              <div
                key={status}
                className={`flex flex-col min-w-[240px] max-w-[240px] rounded-lg border border-border border-t-2 ${COLUMN_ACCENT[status]} bg-surface`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDropTargetBoth({ type: "end", status });
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setDropTargetBoth(null);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop();
                }}
              >
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    {INTERNAL_TASK_STATUS_LABELS[status]}
                  </span>
                  <span className="text-xs text-text-muted bg-muted rounded-full px-1.5 py-0.5 leading-none">
                    {col.length}
                  </span>
                </div>

                <div className="flex flex-col px-2 py-2 min-h-[120px]">
                  {col.length === 0 ? (
                    <p className="text-xs text-text-muted text-center py-4">
                      No tasks
                    </p>
                  ) : (
                    col.map((task) => {
                      const isBefore =
                        dropTarget?.type === "before" &&
                        dropTarget.taskId === task.id;
                      return (
                        <KanbanCard
                          key={task.id}
                          task={task}
                          profiles={profiles}
                          isDragging={draggingId === task.id}
                          showInsertBefore={isBefore}
                          onEdit={() => openEdit(task.id)}
                          onDelete={() => setConfirmDeleteId(task.id)}
                          onDragStart={(e) => onDragStart(e, task.id)}
                          onDragEnd={onDragEnd}
                          onDragOver={(e, half) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (half === "top") {
                              setDropTargetBoth({
                                type: "before",
                                taskId: task.id,
                                status,
                              });
                            } else {
                              const idx = col.findIndex((t) => t.id === task.id);
                              const next = col[idx + 1];
                              if (next) {
                                setDropTargetBoth({
                                  type: "before",
                                  taskId: next.id,
                                  status,
                                });
                              } else {
                                setDropTargetBoth({ type: "end", status });
                              }
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDrop();
                          }}
                        />
                      );
                    })
                  )}

                  {isEndTarget && col.length > 0 && (
                    <div className="h-0.5 bg-accent rounded-full mx-1 mt-1" />
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => openCreate(status)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs text-text-muted hover:text-text-secondary transition-colors border-t border-border mt-auto"
                >
                  <AddIcon className="w-3.5 h-3.5" strokeWidth={2} />
                  Add task
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {taskModal.open && (
        <InternalTaskModal
          task={editingTask}
          project={project}
          profiles={profiles}
          keyResults={keyResults}
          timeTracks={
            editingTask
              ? timeTracks.filter(
                  (tt) => tt.internal_task_id === editingTask.id
                )
              : []
          }
          currentUserId={currentUserId}
          createCtx={taskModal.createCtx}
          onClose={closeTaskModal}
        />
      )}

      {deletingTask && (
        <ConfirmDeleteTaskModal
          name={deletingTask.name}
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </>
  );
}

function KanbanCard({
  task,
  profiles,
  isDragging,
  showInsertBefore,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  task: InternalTask;
  profiles: UserProfile[];
  isDragging: boolean;
  showInsertBefore: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onDragOver: (
    e: React.DragEvent<HTMLDivElement>,
    half: "top" | "bottom"
  ) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
}) {
  const assignedProfiles = task.assignees
    .map((id) => profiles.find((p) => p.id === id))
    .filter((p): p is UserProfile => Boolean(p));

  return (
    <div className="flex flex-col">
      {showInsertBefore && (
        <div className="h-0.5 bg-accent rounded-full mx-1 mb-1" />
      )}

      <div
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const half =
            e.clientY < rect.top + rect.height / 2 ? "top" : "bottom";
          onDragOver(e, half);
        }}
        onDrop={onDrop}
        className={`bg-elevated rounded-md border border-border p-3 group transition-colors select-none mb-2 cursor-grab active:cursor-grabbing ${
          isDragging ? "opacity-40 scale-95" : "hover:border-accent/40"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-text-primary leading-snug flex-1 min-w-0 truncate">
            {task.name || "Untitled"}
          </p>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1 text-text-muted hover:text-text-primary transition-colors rounded"
              title="Edit"
            >
              <EditIcon className="w-3 h-3" strokeWidth={2} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 text-text-muted hover:text-red-400 transition-colors rounded"
              title="Delete"
            >
              <DeleteIcon className="w-3 h-3" strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border/50">
          <Avatars assignedProfiles={assignedProfiles} />
          {task.estimated_time != null && (
            <span className="text-[10px] text-text-muted">
              {Number(task.estimated_time).toFixed(0)}h est.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function Avatars({ assignedProfiles }: { assignedProfiles: UserProfile[] }) {
  if (assignedProfiles.length === 0) return <span />;
  return (
    <div className="flex items-center -space-x-1">
      {assignedProfiles.slice(0, 3).map((p) => {
        const name =
          [p.first_name, p.last_name].filter(Boolean).join(" ") || "?";
        const initial = name[0]?.toUpperCase() ?? "?";
        return (
          <div
            key={p.id}
            className="w-5 h-5 rounded-full bg-accent text-white text-[9px] font-semibold flex items-center justify-center border-2 border-elevated overflow-hidden"
            title={name}
          >
            {p.picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.picture}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              initial
            )}
          </div>
        );
      })}
      {assignedProfiles.length > 3 && (
        <div className="w-5 h-5 rounded-full bg-muted text-text-muted text-[9px] flex items-center justify-center border-2 border-elevated">
          +{assignedProfiles.length - 3}
        </div>
      )}
    </div>
  );
}

function ConfirmDeleteTaskModal({
  name,
  onCancel,
  onConfirm,
}: {
  name: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface border border-border rounded-lg w-full max-w-md p-5">
        <h3 className="text-heading-3 text-text-primary mb-2">Delete task</h3>
        <p className="text-sm text-text-secondary mb-5">
          Delete <span className="text-text-primary font-medium">{name}</span>?
          This will also delete its time tracks.
        </p>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-text-secondary hover:text-text-primary px-3 py-1.5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-medium px-3 py-1.5 rounded-md"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
