"use client";

/**
 * ProjectsView — `/dashboard?view=projects`
 *
 * Renders every project as a status-colored card. Clicking a card opens
 * the existing `ProjectModal` from /projects (no rebuild). The modal
 * needs the full `profiles` list for the assignee/owner picker.
 *
 * The user's screenshot defaulted to "In Progress"; we mirror that — the
 * status filter starts at "in_progress" but is changeable.
 */

import Link from "next/link";
import { useMemo, useState } from "react";
import ProjectModal from "@/app/projects/_components/modals/ProjectModal";
import type { Project, UserProfile } from "@/types/projects";
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_CLASSES,
  type ProjectStatus,
} from "../_lib/constants";

interface Props {
  projects: Project[];
  profiles: UserProfile[];
}

type StatusFilter = "all" | ProjectStatus;

export default function ProjectsView({ projects, profiles }: Props) {
  // Default to "In Progress" so the page lands on the most useful view —
  // mirrors the user's existing dashboard screenshot.
  const [filter, setFilter] = useState<StatusFilter>("in_progress");
  const [open, setOpen] = useState<Project | null>(null);

  const visible = useMemo(
    () =>
      filter === "all"
        ? projects
        : projects.filter((p) => p.status === filter),
    [projects, filter]
  );

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
        <div>
          <Link href="/dashboard" className="text-sm text-text-muted hover:text-text-primary">
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-text-primary mt-1">Projects</h1>
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
          {PROJECT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {PROJECT_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visible.map((p) => (
          <ProjectCard key={p.id} project={p} onOpen={() => setOpen(p)} />
        ))}
        {visible.length === 0 && (
          <div className="col-span-full p-10 text-center text-sm text-text-muted">
            No projects match this filter.
          </div>
        )}
      </div>

      <ProjectModal
        open={Boolean(open)}
        onClose={() => setOpen(null)}
        project={open}
        profiles={profiles}
      />
    </div>
  );
}

function ProjectCard({ project, onOpen }: { project: Project; onOpen: () => void }) {
  const status = (project.status ?? "not_started") as ProjectStatus;
  const estD = project.start_date_estimated || project.end_date_estimated
    ? `${project.start_date_estimated ?? "—"} → ${project.end_date_estimated ?? "—"}`
    : null;
  const realD = project.start_date_real || project.end_date_real
    ? `${project.start_date_real ?? "—"} → ${project.end_date_real ?? "—"}`
    : null;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="text-left rounded-lg border border-border bg-elevated p-4 hover:border-accent transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-md bg-muted overflow-hidden shrink-0 flex items-center justify-center text-[10px] font-semibold text-text-muted">
          {project.picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={project.picture} alt="" className="w-full h-full object-cover" />
          ) : (
            (project.name ?? "P").slice(0, 2).toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-text-primary truncate">
              {project.name ?? "Untitled project"}
            </h3>
            <span
              className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-medium ${PROJECT_STATUS_CLASSES[status]}`}
            >
              {PROJECT_STATUS_LABELS[status]}
            </span>
          </div>
          <div className="text-[11px] text-text-muted mt-2 space-y-0.5">
            {estD && <div>Est: {estD}</div>}
            {realD && <div>Real: {realD}</div>}
            <div>
              {Number(project.estimated_time ?? 0)}h est · {Number(project.real_time ?? 0)}h real
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
