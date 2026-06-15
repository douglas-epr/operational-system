"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Task, UserType, UserProfile } from "@/types/projects";
import { PRIORITY_LABELS, PRIORITY_RANK, PRIORITY_COLOR, CATEGORY_LABELS } from "@/types/projects";
import TaskModal from "../modals/TaskModal";
import ConfirmDeleteModal from "../modals/ConfirmDeleteModal";
import { deleteTask, updateTask } from "../../actions";

interface TasksKanbanProps {
  tasks: Task[];
  userType: UserType | null;
  projectId: string;
  type: "client_requests";
  profiles?: UserProfile[];
  currentUserId: string;
  milestones?: Task[];
  authorizedUserIds?: string[];
  unreadByTaskId?: Record<string, number>;
}

const COLUMNS: { key: Task["status"]; label: string }[] = [
  { key: "not_started",  label: "Not Started" },
  { key: "in_progress",  label: "In Progress" },
  { key: "ready_for_qa", label: "Ready for QA" },
  { key: "done",         label: "Done" },
  { key: "blocked",      label: "Blocked" },
];

const COLUMN_ACCENT: Record<Task["status"], string> = {
  not_started:  "border-t-[#52525b]",
  in_progress:  "border-t-[#3b82f6]",
  ready_for_qa: "border-t-[#a855f7]",
  done:         "border-t-[#22c55e]",
  blocked:      "border-t-[#ef4444]",
};

/**
 * Drop target variants:
 *  - before {taskId} → insert immediately above that card
 *  - end    {status} → insert at the bottom of the column
 */
type DropTarget =
  | { type: "before"; taskId: string; status: Task["status"] }
  | { type: "end";    status: Task["status"] };

interface CreateContext {
  status: Task["status"];
  order: number;
}

export default function TasksKanban({
  tasks, userType, projectId, type, profiles = [], currentUserId, milestones = [], authorizedUserIds, unreadByTaskId = {},
}: TasksKanbanProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const canEdit =
    userType === "admin" || userType === "manager" || userType === "developer" || userType === "qa" ||
    (userType === "client" && type === "client_requests");

  const [taskModal, setTaskModal] = useState<{ open: boolean; taskId: string | null; createCtx?: CreateContext }>({
    open: false, taskId: null,
  });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; taskId: string | null }>({ open: false, taskId: null });
  const [modalKey, setModalKey] = useState(0);

  const [localTasks, setLocalTasks] = useState<Task[]>(() => tasks.filter((t) => t.type === type));
  useEffect(() => { setLocalTasks(tasks.filter((t) => t.type === type)); }, [tasks, type]);

  // Drag state
  const draggingIdRef = useRef<string | null>(null);
  const dropTargetRef = useRef<DropTarget | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  function setDropTargetBoth(target: DropTarget | null) {
    dropTargetRef.current = target;
    setDropTarget(target);
  }

  // Sorted columns map
  const byStatus = new Map<Task["status"], Task[]>();
  COLUMNS.forEach(({ key }) => byStatus.set(key, []));
  localTasks.forEach((t) => {
    const col = byStatus.get(t.status) ?? [];
    col.push(t);
    byStatus.set(t.status, col);
  });
  COLUMNS.forEach(({ key }) => {
    byStatus.get(key)!.sort((a, b) => {
      const prA = a.priority_level ? (PRIORITY_RANK[a.priority_level] ?? 99) : 99;
      const prB = b.priority_level ? (PRIORITY_RANK[b.priority_level] ?? 99) : 99;
      if (prA !== prB) return prA - prB;
      return (a.order ?? 0) - (b.order ?? 0);
    });
  });

  const modalTask = taskModal.taskId ? (localTasks.find((t) => t.id === taskModal.taskId) ?? null) : null;
  const deleteTask_ = deleteModal.taskId ? (localTasks.find((t) => t.id === deleteModal.taskId) ?? null) : null;

  function openCreate(status: Task["status"]) {
    const col = byStatus.get(status) ?? [];
    const lastOrder = col.length > 0 ? (col[col.length - 1].order ?? 0) : -1;
    setModalKey((k) => k + 1);
    setTaskModal({ open: true, taskId: null, createCtx: { status, order: lastOrder + 1 } });
  }

  function openEdit(taskId: string) {
    setModalKey((k) => k + 1);
    setTaskModal({ open: true, taskId });
  }

  /**
   * Compute new `order` value for the dragged card given a drop target.
   * We exclude the dragged card from the column so positions are stable.
   */
  function computeNewOrder(target: DropTarget): number {
    const dragId = draggingIdRef.current;
    const col = (byStatus.get(target.status) ?? []).filter((t) => t.id !== dragId);

    if (target.type === "end") {
      // Place after the last card
      if (col.length === 0) return 0;
      return (col[col.length - 1].order ?? 0) + 1;
    }

    // "before" a specific card
    const idx = col.findIndex((t) => t.id === target.taskId);
    if (idx === -1) {
      // Card not found (shouldn't happen) — append at end
      if (col.length === 0) return 0;
      return (col[col.length - 1].order ?? 0) + 1;
    }
    if (idx === 0) {
      // First position → first_card.order - 1
      return (col[0].order ?? 0) - 1;
    }
    // Between two cards → average
    return ((col[idx - 1].order ?? 0) + (col[idx].order ?? 0)) / 2;
  }

  function handleDrop() {
    const target = dropTargetRef.current;
    const taskId = draggingIdRef.current;
    if (!taskId || !target) return;
    const task = localTasks.find((t) => t.id === taskId);
    if (!task) return;

    const newStatus = target.status;
    const newOrder  = computeNewOrder(target);

    draggingIdRef.current = null;
    dropTargetRef.current = null;
    setDraggingId(null);
    setDropTarget(null);

    // Optimistic update
    setLocalTasks((prev) =>
      prev.map((t) => t.id === taskId ? { ...t, status: newStatus, order: newOrder } : t)
    );

    startTransition(async () => {
      await updateTask(taskId, { status: newStatus, order: newOrder });
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

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex gap-3 overflow-x-auto pb-2">
        {COLUMNS.map(({ key, label }) => {
          const col = byStatus.get(key) ?? [];
          const isEndTarget = dropTarget?.type === "end" && dropTarget.status === key;

          return (
            <div
              key={key}
              className={`flex flex-col min-w-[220px] max-w-[220px] rounded-lg border border-border border-t-2 ${COLUMN_ACCENT[key]} bg-surface`}
              // Column-level dragover: only fires when not over a card (cards stop propagation)
              onDragOver={(e) => {
                e.preventDefault();
                setDropTargetBoth({ type: "end", status: key });
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
              {/* Column header */}
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{label}</span>
                <span className="text-xs text-text-muted bg-muted rounded-full px-1.5 py-0.5 leading-none">{col.length}</span>
              </div>

              {/* Cards */}
              <div className="flex flex-col px-2 py-2 min-h-[120px] gap-0">
                {col.length === 0 ? (
                  <p className="text-xs text-text-muted text-center py-4">No tasks</p>
                ) : (
                  col.map((task) => {
                    const isBeforeThis = dropTarget?.type === "before" && dropTarget.taskId === task.id;
                    const canDelete = userType === "admin" || userType === "manager" || task.created_by === currentUserId;
                    return (
                      <KanbanCard
                        key={task.id}
                        task={task}
                        canEdit={canEdit}
                        canDelete={canDelete}
                        isDragging={draggingId === task.id}
                        showInsertBefore={isBeforeThis}
                        unreadCount={unreadByTaskId[task.id] ?? 0}
                        onEdit={() => openEdit(task.id)}
                        onDelete={() => setDeleteModal({ open: true, taskId: task.id })}
                        onDragStart={(e) => onDragStart(e, task.id)}
                        onDragEnd={onDragEnd}
                        onDragOver={(e, half) => {
                          e.preventDefault();
                          e.stopPropagation(); // prevent column handler from firing
                          if (half === "top") {
                            setDropTargetBoth({ type: "before", taskId: task.id, status: key });
                          } else {
                            // Bottom half → check if there's a next card
                            const idx = col.findIndex((t) => t.id === task.id);
                            const nextCard = col[idx + 1];
                            if (nextCard) {
                              setDropTargetBoth({ type: "before", taskId: nextCard.id, status: key });
                            } else {
                              setDropTargetBoth({ type: "end", status: key });
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

                {/* End-of-column drop indicator */}
                {isEndTarget && col.length > 0 && (
                  <div className="h-0.5 bg-accent rounded-full mx-1 mt-1" />
                )}
              </div>

              {/* Add task */}
              {canEdit && (
                <button
                  onClick={() => openCreate(key)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs text-text-muted hover:text-text-secondary transition-colors border-t border-border mt-auto"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add task
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <TaskModal
        key={modalKey}
        open={taskModal.open}
        onClose={() => setTaskModal({ open: false, taskId: null })}
        task={modalTask}
        projectId={projectId}
        parentTaskId={null}
        type={type}
        level="level_2"
        profiles={profiles}
        currentUserId={currentUserId}
        milestones={milestones}
        defaultStatus={taskModal.createCtx?.status}
        defaultOrder={taskModal.createCtx?.order}
        authorizedUserIds={authorizedUserIds}
      />
      <ConfirmDeleteModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, taskId: null })}
        kind="task"
        itemName={deleteTask_?.name ?? ""}
        onConfirm={() => deleteTask(deleteModal.taskId!)}
      />
    </div>
  );
}

function KanbanCard({
  task, canEdit, canDelete, isDragging, showInsertBefore, unreadCount, onEdit, onDelete,
  onDragStart, onDragEnd, onDragOver, onDrop,
}: {
  task: Task;
  canEdit: boolean;
  canDelete: boolean;
  isDragging: boolean;
  showInsertBefore: boolean;
  unreadCount: number;
  onEdit: () => void;
  onDelete: () => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>, half: "top" | "bottom") => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
}) {
  return (
    <div className="flex flex-col">
      {/* Insert-before indicator */}
      {showInsertBefore && (
        <div className="h-0.5 bg-accent rounded-full mx-1 mb-1" />
      )}

      <div
        draggable={canEdit}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const half = e.clientY < rect.top + rect.height / 2 ? "top" : "bottom";
          onDragOver(e, half);
        }}
        onDrop={onDrop}
        className={`bg-elevated rounded-md border border-border p-3 group transition-colors select-none mb-2 ${
          canEdit ? "cursor-grab active:cursor-grabbing" : ""
        } ${isDragging ? "opacity-40 scale-95" : "hover:border-accent/40"}`}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-text-primary leading-snug flex-1 min-w-0 flex items-center gap-1.5">
            <span className="min-w-0 truncate">{task.name ?? "Untitled"}</span>
            {unreadCount > 0 && (
              <span
                className="shrink-0 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none px-1"
                title={`${unreadCount} unread message${unreadCount === 1 ? "" : "s"}`}
              >
                {unreadCount}
              </span>
            )}
          </p>
          {canEdit && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="p-1 text-text-muted hover:text-text-primary transition-colors rounded"
                title="Edit"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              {canDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="p-1 text-text-muted hover:text-red-400 transition-colors rounded"
                  title="Delete"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border/50">
          <Assignees assignees={task.task_assignees} />
          {task.estimated_time != null && (
            <span className="text-[10px] text-text-muted">{task.estimated_time.toFixed(0)}h est.</span>
          )}
        </div>
        {(task.priority_level || task.category) && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {task.priority_level && (
              <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${PRIORITY_COLOR[task.priority_level]}`}>
                {PRIORITY_LABELS[task.priority_level]}
              </span>
            )}
            {task.category && (
              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-text-muted">
                {CATEGORY_LABELS[task.category]}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Assignees({ assignees }: { assignees: Task["task_assignees"] }) {
  if (!assignees.length) return <span />;
  return (
    <div className="flex items-center -space-x-1">
      {assignees.slice(0, 3).map((a) => {
        const p = a.profiles;
        const name = [p?.first_name, p?.last_name].filter(Boolean).join(" ") || "?";
        const initial = name[0]?.toUpperCase() ?? "?";
        return (
          <div
            key={a.user_id}
            className="w-5 h-5 rounded-full bg-accent text-white text-[9px] font-semibold flex items-center justify-center border-2 border-elevated overflow-hidden"
            title={name}
          >
            {p?.picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.picture} alt={name} className="w-full h-full object-cover" />
            ) : initial}
          </div>
        );
      })}
      {assignees.length > 3 && (
        <div className="w-5 h-5 rounded-full bg-muted text-text-muted text-[9px] flex items-center justify-center border-2 border-elevated">
          +{assignees.length - 3}
        </div>
      )}
    </div>
  );
}
