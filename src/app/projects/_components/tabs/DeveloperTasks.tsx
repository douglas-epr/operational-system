"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Task, TaskStatus, UserType, UserProfile, Project } from "@/types/projects";
import DatePicker from "@/components/DatePicker";
import TaskModal from "../modals/TaskModal";
import TaskTimeTrackerModal from "../modals/TaskTimeTrackerModal";
import ConfirmDeleteModal from "../modals/ConfirmDeleteModal";
import ImportTasksFromIdeaModal from "../modals/ImportTasksFromIdeaModal";
import { deleteTask, updateTask, updateProjectAggregateEstimate } from "../../actions";

interface DeveloperTasksProps {
  tasks: Task[];
  userType: UserType | null;
  project: Project;
  profiles?: UserProfile[];
  currentUserId: string;
  /** Map of task_id → unread comment count (caller-aggregated). */
  unreadByTaskId?: Record<string, number>;
}

const CHILD_LEVELS: Task["level"][] = ["level_2", "level_3", "level_4"];

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "ready_for_qa", label: "Ready for QA" },
  { value: "done", label: "Done" },
  { value: "blocked", label: "Blocked" },
];

const STATUS_COLORS: Record<TaskStatus, string> = {
  not_started: "bg-[#27272a] text-[#a1a1aa]",
  in_progress: "bg-[#1d3f7a] text-[#93c5fd]",
  ready_for_qa: "bg-[#4c1d95] text-[#d8b4fe]",
  done: "bg-[#14532d] text-[#86efac]",
  blocked: "bg-[#7f1d1d] text-[#fca5a5]",
};

export default function DeveloperTasks({
  tasks, userType, project, profiles = [], currentUserId, unreadByTaskId = {},
}: DeveloperTasksProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const projectId = project.id;
  const devTasks = tasks.filter((t) => t.type === "developer_tasks");
  const milestones = devTasks.filter((t) => t.level === "level_1" && !t.parent_task_id);

  // Developer tasks only for tree display
  const byParent = new Map<string, Task[]>();
  devTasks.filter((t) => t.parent_task_id).forEach((t) => {
    const arr = byParent.get(t.parent_task_id!) ?? [];
    arr.push(t);
    byParent.set(t.parent_task_id!, arr);
  });

  const canEdit = userType === "admin" || userType === "manager" || userType === "developer";
  const canEditTotals = userType === "admin" || userType === "manager";

  // Aggregate unread comments for a task plus every descendant. Used so a
  // collapsed milestone still surfaces unread comments inside its tree.
  function unreadAggregate(taskId: string): number {
    const own = unreadByTaskId[taskId] ?? 0;
    const kids = byParent.get(taskId) ?? [];
    return kids.reduce((s, k) => s + unreadAggregate(k.id), own);
  }

  const authorizedProfiles = profiles.filter((p) => project.authorized_users.includes(p.id));

  const [modalKey, setModalKey] = useState(0);
  const [taskModal, setTaskModal] = useState<{
    open: boolean;
    task: Task | null;
    parentTaskId: string | null;
    level: Task["level"];
  }>({ open: false, task: null, parentTaskId: null, level: "level_1" });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null });
  const [timeTrackerModal, setTimeTrackerModal] = useState<{
    open: boolean; taskId: string; taskName: string;
  }>({ open: false, taskId: "", taskName: "" });
  const [importIdeaOpen, setImportIdeaOpen] = useState(false);

  const openCreate = (parentTaskId: string | null, level: Task["level"]) => {
    setModalKey((k) => k + 1);
    setTaskModal({ open: true, task: null, parentTaskId, level });
  };
  const openEdit = (task: Task) => {
    setModalKey((k) => k + 1);
    setTaskModal({ open: true, task, parentTaskId: task.parent_task_id, level: task.level });
  };
  const openTimeTracker = (task: Task) => {
    setTimeTrackerModal({ open: true, taskId: task.id, taskName: task.name ?? "Task" });
  };

  const inlineUpdate = (taskId: string, data: Partial<import("../../actions").TaskInput>) => {
    startTransition(async () => {
      await updateTask(taskId, data);
      router.refresh();
    });
  };

  const onUpdateAggregateEst = (
    field: "client_developer_estimated_time" | "qa_developer_estimated_time" | "qa_tester_estimated_time" | "estimated_time",
    value: number | null,
  ) => {
    startTransition(async () => {
      await updateProjectAggregateEstimate(projectId, field, value);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col">
      {/* Table header */}
      <div className="grid grid-cols-[1fr_120px_100px_100px_80px_80px_120px_64px] gap-2 px-4 py-2 text-xs font-semibold text-text-secondary uppercase tracking-widest border-b border-border">
        <span>Name</span>
        <span>Status</span>
        <span>Start Date</span>
        <span>End Date</span>
        <span>Est. (h)</span>
        <span>Real (h)</span>
        <span>Assignees</span>
        <span />
      </div>

      {milestones.length === 0 && <EmptyState message="No developer tasks yet." />}

      {milestones.map((milestone, idx) => (
        <MilestoneRow
          key={milestone.id}
          milestone={milestone}
          idx={idx + 1}
          byParent={byParent}
          canEdit={canEdit}
          onEdit={openEdit}
          onDelete={(t) => setDeleteModal({ open: true, task: t })}
          onAddChild={openCreate}
          onOpenTimeTracker={openTimeTracker}
          onInlineUpdate={inlineUpdate}
          profiles={authorizedProfiles}
          unreadByTaskId={unreadByTaskId}
          unreadAggregate={unreadAggregate}
        />
      ))}

      {canEdit && (
        <div className="flex items-center gap-1 border-t border-border">
          <button
            onClick={() => openCreate(null, "level_1")}
            className="flex items-center gap-2 px-4 py-3 text-sm text-text-muted hover:text-text-secondary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add milestone
          </button>
          {canEditTotals && (
            // admin/manager only — the importer hits an LLM and writes
            // milestones + tasks server-side, so we keep it gated to
            // the same role used for project-total edits.
            <button
              onClick={() => setImportIdeaOpen(true)}
              className="flex items-center gap-2 px-4 py-3 text-sm text-text-muted hover:text-text-secondary transition-colors"
              title="Import milestones and tasks from a Sandbox idea"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Import tasks from idea
            </button>
          )}
        </div>
      )}

      {/* Project-level totals (replaces the per-milestone totals block) */}
      <div className="mt-6 border-t border-border">
        <div className="px-4 py-2 text-xs font-semibold text-text-secondary uppercase tracking-widest bg-muted/30 border-b border-border">
          Project Totals
        </div>
        <ProjectTotalRow
          label="Client Requests (Developer)"
          estimatedTime={project.client_developer_estimated_time}
          realTime={project.client_developer_real_time}
          estEditable={canEditTotals}
          onEstChange={(v) => onUpdateAggregateEst("client_developer_estimated_time", v)}
        />
        <ProjectTotalRow
          label="QA Requests (Developer)"
          estimatedTime={project.qa_developer_estimated_time}
          realTime={project.qa_developer_real_time}
          estEditable={canEditTotals}
          onEstChange={(v) => onUpdateAggregateEst("qa_developer_estimated_time", v)}
        />
        <ProjectTotalRow
          label="QA Requests (QA Tester)"
          estimatedTime={project.qa_tester_estimated_time}
          realTime={project.qa_tester_real_time}
          estEditable={canEditTotals}
          onEstChange={(v) => onUpdateAggregateEst("qa_tester_estimated_time", v)}
        />
        <ProjectTotalRow
          label="Project"
          estimatedTime={project.estimated_time}
          realTime={project.real_time}
          estEditable={canEditTotals}
          onEstChange={(v) => onUpdateAggregateEst("estimated_time", v)}
        />
      </div>

      <TaskModal
        key={modalKey}
        open={taskModal.open}
        onClose={() => setTaskModal((s) => ({ ...s, open: false }))}
        task={taskModal.task}
        projectId={projectId}
        parentTaskId={taskModal.parentTaskId}
        type="developer_tasks"
        level={taskModal.level ?? "level_1"}
        profiles={profiles}
        authorizedUserIds={project.authorized_users}
        currentUserId={currentUserId}
      />
      <TaskTimeTrackerModal
        open={timeTrackerModal.open}
        onClose={() => setTimeTrackerModal((s) => ({ ...s, open: false }))}
        taskId={timeTrackerModal.taskId}
        projectId={projectId}
        taskName={timeTrackerModal.taskName}
      />
      <ConfirmDeleteModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, task: null })}
        kind="task"
        itemName={deleteModal.task?.name ?? ""}
        onConfirm={() => deleteTask(deleteModal.task!.id)}
      />
      <ImportTasksFromIdeaModal
        open={importIdeaOpen}
        projectId={projectId}
        onClose={() => setImportIdeaOpen(false)}
      />
    </div>
  );
}

// ── Milestone row ─────────────────────────────────────────────────────────────

function MilestoneRow({
  milestone, idx, byParent, canEdit, onEdit, onDelete, onAddChild,
  onOpenTimeTracker, onInlineUpdate, profiles, unreadByTaskId, unreadAggregate,
}: {
  milestone: Task;
  idx: number;
  byParent: Map<string, Task[]>;
  canEdit: boolean;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  onAddChild: (parentId: string, level: Task["level"]) => void;
  onOpenTimeTracker: (t: Task) => void;
  onInlineUpdate: (taskId: string, data: Record<string, unknown>) => void;
  profiles: UserProfile[];
  unreadByTaskId: Record<string, number>;
  unreadAggregate: (taskId: string) => number;
}) {
  const [expanded, setExpanded] = useState(false);
  const children = (byParent.get(milestone.id) ?? []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  // When the milestone is collapsed, surface every unread comment underneath
  // it so the user knows there's something new in the subtree. When expanded,
  // children render their own badges, so the milestone shows just its own.
  const unreadHere = expanded
    ? (unreadByTaskId[milestone.id] ?? 0)
    : unreadAggregate(milestone.id);

  return (
    <>
      <div className="grid grid-cols-[1fr_120px_100px_100px_80px_80px_120px_64px] gap-2 px-4 py-3 bg-accent/10 border-b border-border items-center group">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-4 h-4 shrink-0 text-text-muted hover:text-text-primary transition-transform"
            style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
          >
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 4.707a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L11.586 10 7.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-text-primary truncate">
            Milestone {idx}: {milestone.name}
          </span>
          {unreadHere > 0 && (
            <span
              title={`${unreadHere} unread comment${unreadHere === 1 ? "" : "s"}`}
              className="shrink-0 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-danger text-white text-[10px] font-semibold leading-none px-1.5 tabular-nums"
            >
              {unreadHere}
            </span>
          )}
        </div>
        {canEdit ? (
          <InlineStatusSelect value={milestone.status} onChange={(v) => onInlineUpdate(milestone.id, { status: v })} />
        ) : (
          <StatusBadge status={milestone.status} />
        )}
        {canEdit ? (
          <InlineDateInput value={milestone.start_date_estimated} onChange={(v) => onInlineUpdate(milestone.id, { start_date_estimated: v })} maxDate={milestone.end_date_estimated} />
        ) : (
          <DateCell value={milestone.start_date_estimated} />
        )}
        {canEdit ? (
          <InlineDateInput value={milestone.end_date_estimated} onChange={(v) => onInlineUpdate(milestone.id, { end_date_estimated: v })} minDate={milestone.start_date_estimated} />
        ) : (
          <DateCell value={milestone.end_date_estimated} />
        )}
        {canEdit ? (
          <InlineNumberInput value={milestone.estimated_time} onChange={(v) => onInlineUpdate(milestone.id, { estimated_time: v })} />
        ) : (
          <NumCell value={milestone.estimated_time} />
        )}
        <RealTimeCell value={milestone.real_time} onClick={() => onOpenTimeTracker(milestone)} />
        {canEdit ? (
          <InlineAssignees
            assignees={milestone.task_assignees}
            profiles={profiles}
            onChange={(ids) => onInlineUpdate(milestone.id, { assignee_ids: ids })}
          />
        ) : (
          <Assignees assignees={milestone.task_assignees} />
        )}
        <RowActions canEdit={canEdit} onEdit={() => onEdit(milestone)} onDelete={() => onDelete(milestone)} />
      </div>

      {expanded && (
        <>
          {children.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              depth={1}
              byParent={byParent}
              canEdit={canEdit}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onOpenTimeTracker={onOpenTimeTracker}
              onInlineUpdate={onInlineUpdate}
              profiles={profiles}
              unreadByTaskId={unreadByTaskId}
              unreadAggregate={unreadAggregate}
            />
          ))}
          {canEdit && (
            <button
              onClick={() => onAddChild(milestone.id, "level_2")}
              className="flex items-center gap-2 py-2 text-xs text-text-muted hover:text-text-secondary transition-colors border-b border-border/50"
              style={{ paddingLeft: `${16 + 24}px` }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add task
            </button>
          )}
        </>
      )}
    </>
  );
}

// ── Task row (recursive) ───────────────────────────────────────────────────────

function TaskRow({
  task, depth, byParent, canEdit, onEdit, onDelete, onAddChild, onOpenTimeTracker, onInlineUpdate, profiles, unreadByTaskId, unreadAggregate,
}: {
  task: Task;
  depth: number;
  byParent: Map<string, Task[]>;
  canEdit: boolean;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  onAddChild: (parentId: string, level: Task["level"]) => void;
  onOpenTimeTracker: (t: Task) => void;
  onInlineUpdate: (taskId: string, data: Record<string, unknown>) => void;
  profiles: UserProfile[];
  unreadByTaskId: Record<string, number>;
  unreadAggregate: (taskId: string) => number;
}) {
  const [expanded, setExpanded] = useState(false);
  const children = (byParent.get(task.id) ?? []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const hasChildren = children.length > 0;
  const childLevel = CHILD_LEVELS[depth] as Task["level"] | undefined;
  // Same collapsed-vs-expanded display rule as MilestoneRow.
  const unreadHere = expanded
    ? (unreadByTaskId[task.id] ?? 0)
    : unreadAggregate(task.id);

  return (
    <>
      <div
        className="grid grid-cols-[1fr_120px_100px_100px_80px_80px_120px_64px] gap-2 px-4 py-2.5 border-b border-border/50 items-center hover:bg-muted/30 transition-colors group"
        style={{ paddingLeft: `${16 + depth * 24}px` }}
      >
        <div className="flex items-center gap-2">
          {hasChildren || childLevel ? (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="w-4 h-4 shrink-0 text-text-muted hover:text-text-primary transition-transform"
              style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
            >
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 4.707a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L11.586 10 7.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          ) : (
            <span className="w-4 h-4 shrink-0" />
          )}
          <span className="text-sm text-text-primary truncate">{task.name}</span>
          {unreadHere > 0 && (
            <span
              title={`${unreadHere} unread comment${unreadHere === 1 ? "" : "s"}`}
              className="shrink-0 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-danger text-white text-[10px] font-semibold leading-none px-1.5 tabular-nums"
            >
              {unreadHere}
            </span>
          )}
        </div>
        {canEdit ? (
          <InlineStatusSelect value={task.status} onChange={(v) => onInlineUpdate(task.id, { status: v })} />
        ) : (
          <StatusBadge status={task.status} />
        )}
        {canEdit ? (
          <InlineDateInput value={task.start_date_estimated} onChange={(v) => onInlineUpdate(task.id, { start_date_estimated: v })} maxDate={task.end_date_estimated} />
        ) : (
          <DateCell value={task.start_date_estimated} />
        )}
        {canEdit ? (
          <InlineDateInput value={task.end_date_estimated} onChange={(v) => onInlineUpdate(task.id, { end_date_estimated: v })} minDate={task.start_date_estimated} />
        ) : (
          <DateCell value={task.end_date_estimated} />
        )}
        {canEdit ? (
          <InlineNumberInput value={task.estimated_time} onChange={(v) => onInlineUpdate(task.id, { estimated_time: v })} />
        ) : (
          <NumCell value={task.estimated_time} />
        )}
        <RealTimeCell value={task.real_time} onClick={() => onOpenTimeTracker(task)} />
        {canEdit ? (
          <InlineAssignees
            assignees={task.task_assignees}
            profiles={profiles}
            onChange={(ids) => onInlineUpdate(task.id, { assignee_ids: ids })}
          />
        ) : (
          <Assignees assignees={task.task_assignees} />
        )}
        <RowActions canEdit={canEdit} onEdit={() => onEdit(task)} onDelete={() => onDelete(task)} />
      </div>

      {expanded && (
        <>
          {children.map((child) => (
            <TaskRow
              key={child.id}
              task={child}
              depth={depth + 1}
              byParent={byParent}
              canEdit={canEdit}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onOpenTimeTracker={onOpenTimeTracker}
              onInlineUpdate={onInlineUpdate}
              profiles={profiles}
              unreadByTaskId={unreadByTaskId}
              unreadAggregate={unreadAggregate}
            />
          ))}
          {canEdit && childLevel && (
            <button
              onClick={() => onAddChild(task.id, childLevel)}
              className="flex items-center gap-2 py-2 text-xs text-text-muted hover:text-text-secondary transition-colors border-b border-border/50"
              style={{ paddingLeft: `${16 + (depth + 1) * 24}px` }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add sub-task
            </button>
          )}
        </>
      )}
    </>
  );
}

// ── Project-level total row (shown once at bottom of developer tab) ─────────

function ProjectTotalRow({
  label, estimatedTime, realTime, estEditable, onEstChange,
}: {
  label: string;
  estimatedTime: number | null;
  realTime: number | null;
  estEditable: boolean;
  onEstChange?: (value: number | null) => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_120px_100px_100px_80px_80px_120px_64px] gap-2 px-4 py-2 border-b border-border/50 items-center bg-muted/20">
      <div className="flex items-center gap-2">
        <span className="w-4 h-4 shrink-0" />
        <span className="text-xs text-text-secondary italic">{label}</span>
      </div>
      <span />
      <span />
      <span />
      {estEditable && onEstChange ? (
        <InlineNumberInput value={estimatedTime} onChange={onEstChange} />
      ) : (
        <NumCell value={estimatedTime} />
      )}
      <NumCell value={realTime} />
      <span />
      <span />
    </div>
  );
}

// ── Inline edit cells ────────────────────────────────────────────────────────

function InlineStatusSelect({ value, onChange }: { value: TaskStatus; onChange: (v: TaskStatus) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as TaskStatus)}
      className={`status-badge text-[10px] cursor-pointer border-0 outline-none ${STATUS_COLORS[value]}`}
    >
      {STATUS_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function InlineDateInput({
  value, onChange, minDate = null, maxDate = null,
}: {
  value: string | null | undefined;
  onChange: (v: string | null) => void;
  minDate?: string | null;
  maxDate?: string | null;
}) {
  return (
    <DatePicker
      value={value ?? ""}
      onChange={(v) => onChange(v || null)}
      size="compact"
      className="bg-transparent border-0 text-text-secondary"
      minDate={minDate}
      maxDate={maxDate}
    />
  );
}

function InlineNumberInput({ value, onChange }: { value: number | null | undefined; onChange: (v: number | null) => void }) {
  const [local, setLocal] = useState(value != null ? String(value) : "");
  // Sync from props when they change
  useEffect(() => { setLocal(value != null ? String(value) : ""); }, [value]);

  return (
    <input
      type="number"
      step="0.01"
      min="0"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        const num = parseFloat(local);
        onChange(isNaN(num) ? null : num);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.currentTarget.blur();
        }
      }}
      className="text-xs text-text-secondary bg-transparent border border-border/50 rounded px-1 py-0.5 outline-none w-full focus:border-accent"
    />
  );
}

function InlineAssignees({
  assignees, profiles, onChange,
}: {
  assignees: Task["task_assignees"];
  profiles: UserProfile[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const currentIds = new Set(assignees.map((a) => a.user_id));

  const toggle = (id: string) => {
    const next = new Set(currentIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    onChange(Array.from(next));
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} className="flex items-center">
        {assignees.length > 0 ? (
          <Assignees assignees={assignees} />
        ) : (
          <span className="text-xs text-text-muted hover:text-accent transition-colors">+</span>
        )}
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 bg-elevated border border-border rounded-lg shadow-lg p-2 max-h-48 overflow-auto w-48">
          {profiles.map((p) => {
            const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || "?";
            const selected = currentIds.has(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs transition-colors ${selected ? "bg-accent/20 text-text-primary" : "text-text-secondary hover:bg-muted"}`}
              >
                <div className="w-5 h-5 rounded-full bg-accent text-white text-[9px] font-semibold flex items-center justify-center shrink-0 overflow-hidden">
                  {p.picture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.picture} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    name[0]?.toUpperCase() ?? "?"
                  )}
                </div>
                <span className="truncate">{name}</span>
                {selected && <span className="ml-auto text-accent">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Read-only cells ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TaskStatus }) {
  const label: Record<TaskStatus, string> = {
    not_started: "Not Started",
    in_progress: "In Progress",
    ready_for_qa: "Ready for QA",
    done: "Done",
    blocked: "Blocked",
  };
  return <span className={`status-badge text-[10px] ${STATUS_COLORS[status]}`}>{label[status]}</span>;
}

function DateCell({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="text-xs text-text-muted">—</span>;
  return (
    <span className="text-xs text-text-secondary">
      {new Date(value).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" })}
    </span>
  );
}

function NumCell({ value }: { value: number | null | undefined }) {
  return <span className="text-xs text-text-secondary">{value != null ? value.toFixed(2) : "0.00"}</span>;
}

function RealTimeCell({ value, onClick }: { value: number | null | undefined; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-xs text-text-secondary hover:text-accent transition-colors text-left"
      title="View time tracker"
    >
      {value != null ? value.toFixed(2) : "0.00"}
    </button>
  );
}

function Assignees({ assignees }: { assignees: Task["task_assignees"] }) {
  if (!assignees.length) return <span className="text-xs text-text-muted">—</span>;
  return (
    <div className="flex items-center -space-x-1.5">
      {assignees.slice(0, 4).map((a) => {
        const p = a.profiles;
        const name = [p?.first_name, p?.last_name].filter(Boolean).join(" ") || "?";
        const initial = name[0]?.toUpperCase() ?? "?";
        return (
          <div
            key={a.user_id}
            className="w-6 h-6 rounded-full bg-accent text-white text-[10px] font-semibold flex items-center justify-center border-2 border-elevated overflow-hidden"
            title={name}
          >
            {p?.picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.picture} alt={name} className="w-full h-full object-cover" />
            ) : initial}
          </div>
        );
      })}
      {assignees.length > 4 && (
        <div className="w-6 h-6 rounded-full bg-muted text-text-muted text-[10px] flex items-center justify-center border-2 border-elevated">
          +{assignees.length - 4}
        </div>
      )}
    </div>
  );
}

function RowActions({ canEdit, onEdit, onDelete }: { canEdit: boolean; onEdit: () => void; onDelete: () => void }) {
  if (!canEdit) return null;
  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button onClick={onEdit} className="p-1 text-text-muted hover:text-text-primary transition-colors" title="Edit">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
      <button onClick={onDelete} className="p-1 text-text-muted hover:text-red-400 transition-colors" title="Delete">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-text-muted">
      <svg className="w-10 h-10 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <p className="text-sm">{message}</p>
    </div>
  );
}
