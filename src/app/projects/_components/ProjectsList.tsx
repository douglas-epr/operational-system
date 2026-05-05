"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Project, UserType, UserProfile, ProjectStatus, ProjectProgram, ProjectStage } from "@/types/projects";
import { getScheduleProgressBadge, PROGRAM_LABELS, STAGE_LABELS, STAGE_ORDER } from "@/types/projects";
import ProjectModal from "./modals/ProjectModal";
import ConfirmDeleteModal from "./modals/ConfirmDeleteModal";
import { deleteProject, updateProject } from "../actions";
import { Button, IconButton, Input, Select, EmptyState } from "@/components/ui";
import { SearchIcon, AddIcon, EditIcon, DeleteIcon } from "@/components/ui/icons";

type TaskProgress = { totalEst: number; doneOrQaEst: number; doneEst: number };

interface ProjectsListProps {
  projects: Project[];
  userType: UserType | null;
  profiles: UserProfile[];
  taskProgressMap: Record<string, TaskProgress>;
}

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "prospecting",  label: "Prospecting" },
  { value: "not_started",  label: "Not Started" },
  { value: "in_progress",  label: "In Progress" },
  { value: "done",         label: "Done" },
  { value: "blocked",      label: "Blocked" },
  { value: "archived",     label: "Archived" },
  { value: "lost_deal",    label: "Lost Deal" },
];

const STATUS_LABELS: Record<ProjectStatus, string> = {
  prospecting:  "Prospecting",
  not_started:  "Not Started",
  in_progress:  "In Progress",
  done:         "Done",
  blocked:      "Blocked",
  archived:     "Archived",
  lost_deal:    "Lost Deal",
};

const STATUS_COLORS: Record<ProjectStatus, string> = {
  prospecting:  "bg-[#1c3557] text-[#93c5fd]",
  not_started:  "bg-[#27272a] text-[#a1a1aa]",
  in_progress:  "bg-[#1d3f7a] text-[#93c5fd]",
  done:         "bg-[#14532d] text-[#86efac]",
  blocked:      "bg-[#7f1d1d] text-[#fca5a5]",
  archived:     "bg-[#374151] text-[#9ca3af]",
  lost_deal:    "bg-[#3b0764] text-[#d8b4fe]",
};

const PROGRESS_COLORS: Record<"green" | "yellow" | "red", string> = {
  green:  "bg-[#14532d] text-[#86efac]",
  yellow: "bg-[#422006] text-[#fde68a]",
  red:    "bg-[#7f1d1d] text-[#fca5a5]",
};

function getInitials(first: string | null, last: string | null): string {
  return ((first?.[0] ?? "") + (last?.[0] ?? "")).toUpperCase() || "?";
}

export default function ProjectsList({ projects, userType, profiles, taskProgressMap }: ProjectsListProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [programFilter, setProgramFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");

  // Modal state
  const [projectModal, setProjectModal] = useState<{ open: boolean; project: Project | null }>({ open: false, project: null });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; project: Project | null }>({ open: false, project: null });

  // Inline status popup
  const [statusPopup, setStatusPopup] = useState<{ projectId: string } | null>(null);
  const statusPopupRef = useRef<HTMLDivElement>(null);

  // Inline authorized users popup
  const [usersPopup, setUsersPopup] = useState<{
    projectId: string;
    users: string[];
    top: number;
    right: number;
  } | null>(null);
  const usersPopupRef = useRef<HTMLDivElement>(null);

  const canEdit = userType === "admin" || userType === "manager";

  // Close popups on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (statusPopup && statusPopupRef.current && !statusPopupRef.current.contains(e.target as Node)) {
        setStatusPopup(null);
      }
      if (usersPopup && usersPopupRef.current && !usersPopupRef.current.contains(e.target as Node)) {
        // Save users when closing
        const project = projects.find((p) => p.id === usersPopup.projectId);
        if (project) {
          const changed = JSON.stringify(usersPopup.users.sort()) !== JSON.stringify([...project.authorized_users].sort());
          if (changed) {
            startTransition(async () => {
              await updateProject(usersPopup.projectId, { authorized_users: usersPopup.users });
              router.refresh();
            });
          }
        }
        setUsersPopup(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [statusPopup, usersPopup, projects, router, startTransition]);

  const filtered = projects.filter((p) => {
    if (search && !(p.name ?? "").toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (programFilter !== "all" && p.program !== programFilter) return false;
    if (stageFilter !== "all" && p.stage !== stageFilter) return false;
    return true;
  });

  function handleStatusChange(projectId: string, status: ProjectStatus) {
    setStatusPopup(null);
    startTransition(async () => {
      await updateProject(projectId, { status });
      router.refresh();
    });
  }

  function handleToggleUser(projectId: string, userId: string) {
    setUsersPopup((prev) => {
      if (!prev || prev.projectId !== projectId) return prev;
      const has = prev.users.includes(userId);
      return { ...prev, users: has ? prev.users.filter((u) => u !== userId) : [...prev.users, userId] };
    });
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            type="text"
            placeholder="Search projects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leadingIcon={<SearchIcon strokeWidth={1.8} />}
            className="w-52"
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: "all", label: "All Statuses" },
              ...STATUS_OPTIONS,
            ]}
          />
          <Select
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            options={[
              { value: "all", label: "All Programs" },
              ...Object.entries(PROGRAM_LABELS).map(([k, v]) => ({ value: k, label: v })),
            ]}
          />
          <Select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            options={[
              { value: "all", label: "All Stages" },
              ...STAGE_ORDER.map((s) => ({ value: s, label: STAGE_LABELS[s] })),
            ]}
          />
        </div>

        {canEdit && (
          <Button
            variant="primary"
            leadingIcon={<AddIcon strokeWidth={2} />}
            onClick={() => setProjectModal({ open: true, project: null })}
          >
            New Project
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="grid grid-cols-[40px_1fr_150px_110px_110px_90px_90px_140px_120px_64px] gap-2 px-4 py-2 bg-elevated text-xs font-semibold text-text-secondary uppercase tracking-widest border-b border-border">
          <span>#</span>
          <span>Name</span>
          <span>Status</span>
          <span>Start Date</span>
          <span>End Date</span>
          <span>Est. (h)</span>
          <span>Real (h)</span>
          <span>Progress</span>
          <span>Users</span>
          {canEdit && <span />}
        </div>

        {filtered.length === 0 && (
          <EmptyState title="No projects found." size="sm" />
        )}

        {filtered.map((project, idx) => {
          const tp = taskProgressMap[project.id] ?? null;
          const progress = getScheduleProgressBadge(project, tp);
          const authUsers = project.authorized_users ?? [];

          return (
            <div
              key={project.id}
              className="grid grid-cols-[40px_1fr_150px_110px_110px_90px_90px_140px_120px_64px] gap-2 px-4 py-3 border-b border-border/50 items-center hover:bg-muted/30 transition-colors group"
            >
              <span className="text-xs text-text-muted">{idx + 1}</span>

              {/* Name + description */}
              <div className="flex items-center gap-2.5 min-w-0">
                {project.picture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={project.picture} alt={project.name ?? ""} className="w-7 h-7 rounded-md object-cover shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-md bg-accent/20 text-accent text-xs font-bold flex items-center justify-center shrink-0">
                    {(project.name ?? "?")[0]?.toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <Link
                    href={`/projects?project=${project.id}`}
                    className="text-sm font-medium text-text-primary hover:text-accent transition-colors truncate block"
                  >
                    {project.name ?? "Untitled"}
                  </Link>
                  {project.description && (
                    <p className="text-[11px] text-text-muted truncate leading-tight mt-0.5">
                      {project.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Inline status */}
              <div className="relative">
                <button
                  onClick={() => canEdit ? setStatusPopup(statusPopup?.projectId === project.id ? null : { projectId: project.id }) : undefined}
                  className={`status-badge text-[10px] ${STATUS_COLORS[project.status]} ${canEdit ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
                >
                  {STATUS_LABELS[project.status]}
                  {canEdit && <span className="ml-1 opacity-60">▾</span>}
                </button>

                {canEdit && statusPopup?.projectId === project.id && (
                  <div
                    ref={statusPopupRef}
                    className="absolute left-0 top-full mt-1 z-50 bg-elevated border border-border rounded-md shadow-lg py-1 min-w-[140px]"
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        onClick={() => handleStatusChange(project.id, o.value)}
                        className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors ${project.status === o.value ? "text-accent font-semibold" : "text-text-secondary"}`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <DateCell value={project.start_date_real} />
              <DateCell value={project.end_date_real} />
              <NumCell value={project.estimated_time} />
              <NumCell value={project.real_time} />

              <span className={`status-badge text-[10px] ${PROGRESS_COLORS[progress.color]}`}>
                {progress.label}
              </span>

              {/* Inline authorized users */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    if (!canEdit) return;
                    if (usersPopup?.projectId === project.id) {
                      // Save and close
                      const changed = JSON.stringify(usersPopup.users.sort()) !== JSON.stringify([...authUsers].sort());
                      if (changed) {
                        startTransition(async () => {
                          await updateProject(project.id, { authorized_users: usersPopup.users });
                          router.refresh();
                        });
                      }
                      setUsersPopup(null);
                    } else {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const popupHeight = 260;
                      const spaceBelow = window.innerHeight - rect.bottom;
                      const top = spaceBelow < popupHeight
                        ? Math.max(8, rect.top - popupHeight - 4)
                        : rect.bottom + 4;
                      const right = window.innerWidth - rect.right;
                      setUsersPopup({ projectId: project.id, users: [...authUsers], top, right });
                    }
                  }}
                  className={`flex items-center gap-0.5 ${canEdit ? "cursor-pointer" : "cursor-default"}`}
                >
                  {authUsers.length === 0 ? (
                    <span className="text-xs text-text-muted">—</span>
                  ) : (
                    authUsers.slice(0, 4).map((uid) => {
                      const p = profiles.find((pr) => pr.id === uid);
                      const initials = p ? getInitials(p.first_name, p.last_name) : "?";
                      return (
                        <span
                          key={uid}
                          className="w-6 h-6 rounded-full bg-accent/30 text-accent text-[10px] font-semibold flex items-center justify-center -ml-1 first:ml-0 border border-base overflow-hidden"
                          title={p ? [p.first_name, p.last_name].filter(Boolean).join(" ") : uid}
                        >
                          {p?.picture ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.picture} alt={initials} className="w-full h-full object-cover" />
                          ) : (
                            initials
                          )}
                        </span>
                      );
                    })
                  )}
                  {authUsers.length > 4 && (
                    <span className="text-[10px] text-text-muted ml-1">+{authUsers.length - 4}</span>
                  )}
                </button>

                {canEdit && usersPopup?.projectId === project.id && (
                  <div
                    ref={usersPopupRef}
                    className="fixed z-50 bg-elevated border border-border rounded-md shadow-lg py-2 min-w-[200px] max-h-60 overflow-y-auto"
                    style={{ top: usersPopup.top, right: usersPopup.right }}
                  >
                    <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider px-3 pb-1.5">
                      Authorized Users
                    </p>
                    {profiles.map((p) => {
                      const isSelected = usersPopup.users.includes(p.id);
                      const initials = getInitials(p.first_name, p.last_name);
                      const fullName = [p.first_name, p.last_name].filter(Boolean).join(" ") || "Unknown";
                      return (
                        <button
                          key={p.id}
                          onClick={() => handleToggleUser(project.id, p.id)}
                          className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-muted transition-colors"
                        >
                          <div className={`w-6 h-6 rounded-full text-[10px] font-semibold flex items-center justify-center shrink-0 border-2 overflow-hidden ${isSelected ? "border-accent" : "border-transparent opacity-60"}`} style={{ background: isSelected ? "#3b82f6" : "#374151" }}>
                            {p.picture ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.picture} alt={initials} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white">{initials}</span>
                            )}
                          </div>
                          <span className={`text-xs truncate ${isSelected ? "text-text-primary font-medium" : "text-text-secondary"}`}>{fullName}</span>
                          {isSelected && (
                            <svg className="w-3.5 h-3.5 text-accent ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {canEdit && (
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <IconButton
                    icon={<EditIcon strokeWidth={1.8} />}
                    aria-label="Edit project"
                    size="sm"
                    onClick={() => setProjectModal({ open: true, project })}
                  />
                  <IconButton
                    icon={<DeleteIcon strokeWidth={1.8} />}
                    aria-label="Delete project"
                    size="sm"
                    tone="danger"
                    onClick={() => setDeleteModal({ open: true, project })}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <ProjectModal
        open={projectModal.open}
        onClose={() => setProjectModal({ open: false, project: null })}
        project={projectModal.project}
        profiles={profiles}
        taskProgress={projectModal.project ? (taskProgressMap[projectModal.project.id] ?? null) : null}
        userType={userType}
      />
      <ConfirmDeleteModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, project: null })}
        kind="project"
        itemName={deleteModal.project?.name ?? ""}
        onConfirm={() => deleteProject(deleteModal.project!.id)}
      />
    </div>
  );
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
