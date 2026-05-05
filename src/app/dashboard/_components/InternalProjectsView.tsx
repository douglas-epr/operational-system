"use client";

/**
 * InternalProjectsView — `/dashboard?view=internal-projects`
 *
 * Renders every internal_project as a status-colored card. Clicking a
 * card opens the existing `InternalProjectModal` from the
 * /internal-projects page in "edit" mode (no rebuild). Assignees are
 * fetched from the `internal_project_assignees` join table at the page
 * level and grouped here per project.
 */

import Link from "next/link";
import { useMemo, useState } from "react";
import InternalProjectModal from "@/app/internal-projects/_components/InternalProjectModal";
import type {
  InternalKeyResultRef,
  InternalProject,
  InternalProjectAssignee,
} from "@/types/internal-projects";
import type { UserProfile } from "@/types/projects";
import {
  INTERNAL_PROJECT_STATUSES,
  INTERNAL_PROJECT_STATUS_LABELS,
  INTERNAL_PROJECT_STATUS_CLASSES,
  type InternalProjectStatus,
} from "../_lib/constants";

interface Props {
  projects: InternalProject[];
  profiles: UserProfile[];
  keyResults: InternalKeyResultRef[];
  assignees: InternalProjectAssignee[];
}

type StatusFilter = "all" | InternalProjectStatus;

export default function InternalProjectsView({
  projects,
  profiles,
  keyResults,
  assignees,
}: Props) {
  // The reference screenshot defaulted to "In Progress"; we mirror it.
  const [filter, setFilter] = useState<StatusFilter>("in_progress");
  const [open, setOpen] = useState<InternalProject | null>(null);

  const visible = useMemo(
    () =>
      filter === "all"
        ? projects
        : projects.filter((p) => p.status === filter),
    [projects, filter]
  );

  // Group assignees by project for O(1) lookup when opening the modal.
  const assigneesByProject = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const a of assignees) {
      const arr = map.get(a.internal_project_id) ?? [];
      arr.push(a.user_id);
      map.set(a.internal_project_id, arr);
    }
    return map;
  }, [assignees]);

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
        <div>
          <Link href="/dashboard" className="text-sm text-text-muted hover:text-text-primary">
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-text-primary mt-1">Internal Projects</h1>
          <p className="text-sm text-text-muted">
            {visible.length} of {projects.length} shown
          </p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as StatusFilter)}
          className="input-field text-sm h-9"
        >
          <option value="all">All statuses</option>
          {INTERNAL_PROJECT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {INTERNAL_PROJECT_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visible.map((p) => (
          <IpCard
            key={p.id}
            project={p}
            assigneeProfiles={(assigneesByProject.get(p.id) ?? [])
              .map((id) => profiles.find((pr) => pr.id === id))
              .filter((x): x is UserProfile => Boolean(x))}
            onOpen={() => setOpen(p)}
          />
        ))}
        {visible.length === 0 && (
          <div className="col-span-full p-10 text-center text-sm text-text-muted">
            No internal projects match this filter.
          </div>
        )}
      </div>

      {open && (
        <InternalProjectModal
          mode="edit"
          project={open}
          initialAssignees={assigneesByProject.get(open.id) ?? []}
          profiles={profiles}
          keyResults={keyResults}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}

function IpCard({
  project,
  assigneeProfiles,
  onOpen,
}: {
  project: InternalProject;
  assigneeProfiles: UserProfile[];
  onOpen: () => void;
}) {
  const status = (project.status ?? "not_started") as InternalProjectStatus;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="text-left rounded-lg border border-border bg-elevated p-4 hover:border-accent transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-text-primary truncate">
          {project.name ?? "Untitled internal project"}
        </h3>
        <span
          className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-medium ${INTERNAL_PROJECT_STATUS_CLASSES[status]}`}
        >
          {INTERNAL_PROJECT_STATUS_LABELS[status]}
        </span>
      </div>
      <div className="text-[11px] text-text-muted space-y-0.5 mb-3">
        {project.sector && <div>Sector: {project.sector}</div>}
        <div>
          {Number(project.estimated_time ?? 0)}h est · {Number(project.real_time ?? 0)}h real
        </div>
      </div>
      {assigneeProfiles.length > 0 && (
        <div className="flex -space-x-1.5">
          {assigneeProfiles.slice(0, 5).map((p) => {
            const initials = `${p.first_name?.[0] ?? ""}${p.last_name?.[0] ?? ""}`.toUpperCase() || "U";
            return (
              <div
                key={p.id}
                title={`${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "User"}
                className="w-6 h-6 rounded-full bg-muted border-2 border-elevated overflow-hidden flex items-center justify-center text-[9px] font-semibold text-text-muted"
              >
                {p.picture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.picture} alt="" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
            );
          })}
          {assigneeProfiles.length > 5 && (
            <div className="w-6 h-6 rounded-full bg-muted border-2 border-elevated flex items-center justify-center text-[9px] text-text-muted">
              +{assigneeProfiles.length - 5}
            </div>
          )}
        </div>
      )}
    </button>
  );
}
