"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import DatePicker from "@/components/DatePicker";
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
  type InternalProjectStatus,
} from "@/types/internal-projects";
import {
  createInternalProject,
  setInternalProjectAssignees,
  updateInternalProject,
} from "../actions";
import { UserMultiSelect } from "@/components/ui";
import { CloseIcon, ChevronDownIcon, CheckIcon } from "@/components/ui/icons";

const RichTextEditor = dynamic(
  () =>
    import("@/components/editor/RichTextEditor").then(
      (m) => m.RichTextEditor
    ),
  { ssr: false }
);

interface Props {
  mode: "create" | "edit";
  project?: InternalProject;
  initialAssignees?: string[];
  profiles: UserProfile[];
  keyResults: InternalKeyResultRef[];
  onClose: () => void;
}

export default function InternalProjectModal({
  mode,
  project,
  initialAssignees = [],
  profiles,
  keyResults,
  onClose,
}: Props) {
  const router = useRouter();
  const [saving, startSave] = useTransition();

  const [name, setName] = useState(project?.name ?? "");
  const [status, setStatus] = useState<InternalProjectStatus>(
    project?.status ?? "not_started"
  );
  const [sector, setSector] = useState<CompanySector | "">(
    project?.sector ?? ""
  );
  const [assignees, setAssignees] = useState<string[]>(initialAssignees);
  const [estimatedTime, setEstimatedTime] = useState<string>(
    project?.estimated_time == null ? "" : String(project.estimated_time)
  );
  const [realTime, setRealTime] = useState<string>(
    project?.real_time == null ? "" : String(project.real_time)
  );
  const [startEst, setStartEst] = useState(project?.start_date_estimated ?? "");
  const [endEst, setEndEst] = useState(project?.end_date_estimated ?? "");
  const [startReal, setStartReal] = useState(project?.start_date_real ?? "");
  const [endReal, setEndReal] = useState(project?.end_date_real ?? "");
  const [krIds, setKrIds] = useState<string[]>(
    project?.internal_key_result_ids ?? []
  );
  const [description, setDescription] = useState(project?.description ?? "");

  function toNumber(v: string): number | null {
    if (v.trim() === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  function handleSubmit() {
    const trimmed = name.trim() || "Untitled project";
    startSave(async () => {
      if (mode === "create") {
        const res = await createInternalProject({
          name: trimmed,
          status,
          sector: (sector as CompanySector) || null,
          description,
          start_date_real: startReal || null,
          end_date_real: endReal || null,
          start_date_estimated: startEst || null,
          end_date_estimated: endEst || null,
          real_time: toNumber(realTime),
          estimated_time: toNumber(estimatedTime),
          assignees,
          internal_key_result_ids: krIds,
        });
        if (res.error) {
          alert(res.error);
          return;
        }
      } else if (project) {
        const upd = await updateInternalProject(project.id, {
          name: trimmed,
          status,
          sector: (sector as CompanySector) || null,
          description,
          start_date_real: startReal || null,
          end_date_real: endReal || null,
          start_date_estimated: startEst || null,
          end_date_estimated: endEst || null,
          real_time: toNumber(realTime),
          estimated_time: toNumber(estimatedTime),
          internal_key_result_ids: krIds,
        });
        if (upd.error) {
          alert(upd.error);
          return;
        }
        const ares = await setInternalProjectAssignees(project.id, assignees);
        if (ares.error) {
          alert(ares.error);
          return;
        }
      }
      onClose();
      router.refresh();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface border border-border rounded-lg w-full max-w-3xl flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h3 className="text-heading-3 text-text-primary">
            {mode === "create" ? "New Project" : "Edit Project"}
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
              placeholder="App Name"
              className="input-field w-full"
              autoFocus
            />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Status">
              <StatusDropdown value={status} onChange={setStatus} />
            </Field>
            <Field label="Sector">
              <select
                value={sector}
                onChange={(e) =>
                  setSector(e.target.value as CompanySector | "")
                }
                className="input-field w-full text-sm"
              >
                <option value="">—</option>
                {COMPANY_SECTORS.map((s) => (
                  <option key={s} value={s}>
                    {COMPANY_SECTOR_LABELS[s]}
                  </option>
                ))}
              </select>
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

            <div />

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
                value={realTime}
                onChange={(e) => setRealTime(e.target.value)}
                className="input-field w-full"
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

          <Field label="Key Results Impacted by This Project">
            <KeyResultMultiSelect
              keyResults={keyResults}
              selected={krIds}
              onChange={setKrIds}
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
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-text-secondary hover:text-text-primary px-3 py-1.5"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="bg-accent hover:bg-accent-hover text-white text-xs font-medium px-3 py-1.5 rounded-md disabled:opacity-50"
          >
            {saving ? "Saving…" : mode === "create" ? "Create" : "Save"}
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
  value: InternalProjectStatus;
  onChange: (s: InternalProjectStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative w-fit">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center text-[11px] px-2.5 py-1 rounded-full border ${INTERNAL_PROJECT_STATUS_PILL[value]}`}
      >
        {INTERNAL_PROJECT_STATUS_LABELS[value]}
        <ChevronDownIcon
          className="w-3 h-3 ml-1"
          strokeWidth={2}
        />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
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

function KeyResultMultiSelect({
  keyResults,
  selected,
  onChange,
}: {
  keyResults: InternalKeyResultRef[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  const selectedNames = keyResults
    .filter((kr) => selected.includes(kr.id))
    .map((kr) => kr.name);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="input-field w-full text-left text-sm flex items-center justify-between"
      >
        <span className="truncate">
          {selectedNames.length === 0
            ? "Select key results"
            : selectedNames.length <= 2
              ? selectedNames.join(", ")
              : `${selectedNames.length} key results selected`}
        </span>
        <ChevronDownIcon className="w-3 h-3 shrink-0 ml-2" strokeWidth={2} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-50 bg-surface border border-border rounded-md shadow-xl w-full max-h-60 overflow-y-auto">
            {keyResults.length === 0 && (
              <div className="px-3 py-2 text-xs text-text-muted">
                No key results
              </div>
            )}
            {keyResults.map((kr) => {
              const isSelected = selected.includes(kr.id);
              return (
                <button
                  key={kr.id}
                  type="button"
                  onClick={() => toggle(kr.id)}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-muted"
                >
                  <span
                    className={`w-4 h-4 rounded border ${
                      isSelected
                        ? "bg-accent border-accent"
                        : "border-border bg-transparent"
                    } flex items-center justify-center shrink-0`}
                  >
                    {isSelected && (
                      <CheckIcon className="w-3 h-3 text-white" strokeWidth={3} />
                    )}
                  </span>
                  <span className="text-xs text-text-primary truncate">
                    {kr.name}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
