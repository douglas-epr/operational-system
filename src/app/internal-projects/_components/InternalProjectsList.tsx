"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { UserProfile } from "@/types/projects";
import {
  COMPANY_SECTORS,
  COMPANY_SECTOR_LABELS,
  INTERNAL_PROJECT_STATUSES,
  INTERNAL_PROJECT_STATUS_LABELS,
  INTERNAL_PROJECT_STATUS_PILL,
  type CompanySector,
  type InternalKeyResultRef,
  type InternalProject,
  type InternalProjectAssignee,
  type InternalProjectStatus,
} from "@/types/internal-projects";
import {
  deleteInternalProject,
  setInternalProjectAssignees,
  updateInternalProject,
} from "../actions";
import AssigneePicker from "./AssigneePicker";
import InternalProjectModal from "./InternalProjectModal";
import { SearchIcon, AddIcon, EditIcon, DeleteIcon, ChevronDownIcon } from "@/components/ui/icons";

interface Props {
  projects: InternalProject[];
  profiles: UserProfile[];
  assignees: InternalProjectAssignee[];
  keyResults: InternalKeyResultRef[];
}

export default function InternalProjectsList({
  projects,
  profiles,
  assignees,
  keyResults,
}: Props) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<InternalProjectStatus | "">("");
  const [sectorFilter, setSectorFilter] = useState<CompanySector | "">("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const profileById = useMemo(() => {
    const m = new Map<string, UserProfile>();
    for (const p of profiles) m.set(p.id, p);
    return m;
  }, [profiles]);

  const assigneesByProject = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const a of assignees) {
      const arr = m.get(a.internal_project_id) ?? [];
      arr.push(a.user_id);
      m.set(a.internal_project_id, arr);
    }
    return m;
  }, [assignees]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (statusFilter && p.status !== statusFilter) return false;
      if (sectorFilter && p.sector !== sectorFilter) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [projects, search, statusFilter, sectorFilter]);

  const editingProject =
    editingId !== null ? projects.find((p) => p.id === editingId) ?? null : null;
  const deletingProject =
    confirmDeleteId !== null
      ? projects.find((p) => p.id === confirmDeleteId) ?? null
      : null;

  function handleStatus(id: string, status: InternalProjectStatus) {
    startTransition(async () => {
      const res = await updateInternalProject(id, { status });
      if (res.error) {
        alert(res.error);
        return;
      }
      router.refresh();
    });
  }

  function handleSector(id: string, sector: CompanySector | null) {
    startTransition(async () => {
      const res = await updateInternalProject(id, { sector });
      if (res.error) {
        alert(res.error);
        return;
      }
      router.refresh();
    });
  }

  function handleRealTime(id: string, value: string) {
    const trimmed = value.trim();
    const num = trimmed === "" ? null : Number(trimmed);
    if (num !== null && !Number.isFinite(num)) return;
    startTransition(async () => {
      const res = await updateInternalProject(id, { real_time: num });
      if (res.error) {
        alert(res.error);
        return;
      }
      router.refresh();
    });
  }

  function handleAssignees(projectId: string, userIds: string[]) {
    startTransition(async () => {
      const res = await setInternalProjectAssignees(projectId, userIds);
      if (res.error) {
        alert(res.error);
        return;
      }
      router.refresh();
    });
  }

  function handleConfirmDelete() {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    startTransition(async () => {
      const res = await deleteInternalProject(id);
      if (res.error) {
        alert(res.error);
        return;
      }
      setConfirmDeleteId(null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col flex-1 overflow-y-auto px-6 py-4">
      {/* Toolbar — single horizontal row */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <SearchIcon className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" strokeWidth={2} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects…"
              className="pl-8 pr-3 py-1.5 text-sm bg-muted border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent w-52"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as InternalProjectStatus | "")
            }
            className="px-3 py-1.5 text-sm bg-muted border border-border rounded-md text-text-secondary focus:outline-none focus:border-accent"
          >
            <option value="">All Statuses</option>
            {INTERNAL_PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {INTERNAL_PROJECT_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <select
            value={sectorFilter}
            onChange={(e) =>
              setSectorFilter(e.target.value as CompanySector | "")
            }
            className="px-3 py-1.5 text-sm bg-muted border border-border rounded-md text-text-secondary focus:outline-none focus:border-accent"
          >
            <option value="">All Sectors</option>
            {COMPANY_SECTORS.map((s) => (
              <option key={s} value={s}>
                {COMPANY_SECTOR_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          disabled={busy}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          <AddIcon className="w-4 h-4" strokeWidth={2} />
          New Project
        </button>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[2fr_120px_140px_150px_150px_120px_120px_72px] gap-3 px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-text-muted">
        <div>Name</div>
        <div>Status</div>
        <div>Sector</div>
        <div>Start Date</div>
        <div>End Date</div>
        <div>Real Time (h)</div>
        <div>Assignees</div>
        <div></div>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-2">
        {filtered.length === 0 && (
          <div className="border border-border rounded-md py-10 text-center text-sm text-text-muted">
            No projects match your filters.
          </div>
        )}

        {filtered.map((p) => {
          const userIds = assigneesByProject.get(p.id) ?? [];
          const assignedProfiles = userIds
            .map((uid) => profileById.get(uid))
            .filter((u): u is UserProfile => Boolean(u));

          return (
            <div
              key={p.id}
              className="group grid grid-cols-[2fr_120px_140px_150px_150px_120px_120px_72px] gap-3 items-center px-4 py-3 border border-border rounded-md bg-surface hover:border-accent/40 transition-colors"
            >
              <Link
                href={`/internal-projects?project=${p.id}`}
                className="text-sm text-text-primary hover:text-accent truncate min-w-0"
                title={p.name}
              >
                {p.name}
              </Link>

              <StatusPillDropdown
                value={p.status}
                onChange={(s) => handleStatus(p.id, s)}
              />

              <select
                value={p.sector ?? ""}
                onChange={(e) =>
                  handleSector(
                    p.id,
                    (e.target.value as CompanySector) || null
                  )
                }
                className="input-field text-xs"
              >
                <option value="">—</option>
                {COMPANY_SECTORS.map((s) => (
                  <option key={s} value={s}>
                    {COMPANY_SECTOR_LABELS[s]}
                  </option>
                ))}
              </select>

              <DatePair real={p.start_date_real} est={p.start_date_estimated} />
              <DatePair real={p.end_date_real} est={p.end_date_estimated} />

              <input
                type="number"
                step="0.25"
                defaultValue={p.real_time ?? ""}
                onBlur={(e) => {
                  const cur = p.real_time === null ? "" : String(p.real_time);
                  if (e.target.value !== cur) {
                    handleRealTime(p.id, e.target.value);
                  }
                }}
                className="input-field text-xs text-center"
                placeholder="0"
              />

              <AssigneePicker
                profiles={profiles}
                selected={userIds}
                onChange={(ids) => handleAssignees(p.id, ids)}
                assignedProfiles={assignedProfiles}
              />

              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => setEditingId(p.id)}
                  className="p-1.5 text-text-muted hover:text-text-primary rounded"
                  title="Edit project"
                >
                  <EditIcon className="w-4 h-4" strokeWidth={1.8} />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(p.id)}
                  disabled={busy}
                  className="p-1.5 text-text-muted hover:text-rose-400 rounded disabled:opacity-50"
                  title="Delete project"
                >
                  <DeleteIcon className="w-4 h-4" strokeWidth={1.8} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {createOpen && (
        <InternalProjectModal
          mode="create"
          profiles={profiles}
          keyResults={keyResults}
          onClose={() => setCreateOpen(false)}
        />
      )}

      {editingProject && (
        <InternalProjectModal
          mode="edit"
          project={editingProject}
          initialAssignees={assigneesByProject.get(editingProject.id) ?? []}
          profiles={profiles}
          keyResults={keyResults}
          onClose={() => setEditingId(null)}
        />
      )}

      {deletingProject && (
        <ConfirmDeleteModal
          name={deletingProject.name}
          busy={busy}
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}

function ConfirmDeleteModal({
  name,
  busy,
  onCancel,
  onConfirm,
}: {
  name: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface border border-border rounded-lg w-full max-w-md p-5">
        <h3 className="text-heading-3 text-text-primary mb-2">Delete project</h3>
        <p className="text-sm text-text-secondary mb-5">
          Are you sure you want to delete{" "}
          <span className="text-text-primary font-medium">{name}</span>? This
          will also delete its tasks and time tracks. This action cannot be
          undone.
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
            disabled={busy}
            className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-medium px-3 py-1.5 rounded-md disabled:opacity-50"
          >
            {busy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatDate(v: string | null): string {
  if (!v) return "Null";
  const [y, m, d] = v.split("-");
  return `${d}/${m}/${y}`;
}

function DatePair({
  real,
  est,
}: {
  real: string | null;
  est: string | null;
}) {
  return (
    <div className="text-xs text-text-secondary leading-tight">
      <div>{formatDate(est)}</div>
      <div className="text-text-muted">({formatDate(real)})</div>
    </div>
  );
}

function StatusPillDropdown({
  value,
  onChange,
}: {
  value: InternalProjectStatus;
  onChange: (s: InternalProjectStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center text-[11px] px-2.5 py-1 rounded-full border ${INTERNAL_PROJECT_STATUS_PILL[value]}`}
      >
        {INTERNAL_PROJECT_STATUS_LABELS[value]}
        <ChevronDownIcon className="w-3 h-3 ml-1" strokeWidth={2} />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full mt-1 z-50 bg-surface border border-border rounded-md shadow-xl py-1 min-w-[160px]">
            {INTERNAL_PROJECT_STATUSES.map((s) => (
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
                  className={`inline-block text-[10px] px-2 py-0.5 rounded-full border ${INTERNAL_PROJECT_STATUS_PILL[s]}`}
                >
                  {INTERNAL_PROJECT_STATUS_LABELS[s]}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
