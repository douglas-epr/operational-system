"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import DatePicker from "@/components/DatePicker";
import type { Project, ProjectStatus, UserProfile, UserType } from "@/types/projects";
import {
  createProject,
  updateProject,
  type ProjectInput,
} from "../../actions";
import RichTextEditor from "@/app/ideas-refiner/_components/RichTextEditor.lazy";
import { UserMultiSelect } from "@/components/ui";

type TaskProgress = { totalEst: number; doneOrQaEst: number; doneEst: number };

interface ProjectModalProps {
  open: boolean;
  onClose: () => void;
  project?: Project | null;
  profiles: UserProfile[];
  taskProgress?: TaskProgress | null;
  /** Caller's role. Non-admin/manager users see a read-only view: every
   *  input disabled, Save hidden, financial fields (price + commission +
   *  recommender pickers) hidden entirely. */
  userType?: UserType | null;
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

function ProgressBar({ label, pct }: { label: string; pct: number }) {
  const clamped = Math.min(100, Math.max(0, Math.round(pct)));
  return (
    <div className="space-y-1">
      <span className="text-xs text-text-secondary">{label}</span>
      <div className="h-5 bg-muted rounded overflow-hidden relative">
        <div className="h-full bg-accent transition-all rounded" style={{ width: `${clamped}%` }} />
        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-white mix-blend-normal">
          {clamped}%
        </span>
      </div>
    </div>
  );
}

export default function ProjectModal({ open, onClose, project, profiles, taskProgress, userType }: ProjectModalProps) {
  const router = useRouter();
  const isEdit = !!project;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const canEdit = userType === "admin" || userType === "manager";

  // Form state — all reset when modal opens or project changes
  const [name, setName] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("not_started");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [realTimeVal, setRealTimeVal] = useState("");
  const [startEst, setStartEst] = useState("");
  const [endEst, setEndEst] = useState("");
  const [startReal, setStartReal] = useState("");
  const [endReal, setEndReal] = useState("");
  const [description, setDescription] = useState("");
  const [authorizedUsers, setAuthorizedUsers] = useState<string[]>([]);
  const [autoProjectEst, setAutoProjectEst] = useState(false);
  const [autoMilestoneEst, setAutoMilestoneEst] = useState(false);
  const [autoProjectDates, setAutoProjectDates] = useState(false);
  const [autoMilestoneDates, setAutoMilestoneDates] = useState(false);

  // Reset all state when modal opens/closes or project changes
  useEffect(() => {
    if (!open) return;
    setName(project?.name ?? "");
    setStatus(project?.status ?? "not_started");
    setEstimatedTime(project?.estimated_time?.toString() ?? "");
    setRealTimeVal(project?.real_time?.toString() ?? "");
    setStartEst(project?.start_date_estimated ?? "");
    setEndEst(project?.end_date_estimated ?? "");
    setStartReal(project?.start_date_real ?? "");
    setEndReal(project?.end_date_real ?? "");
    setDescription(project?.description ?? "");
    setAuthorizedUsers(project?.authorized_users ?? []);
    setAutoProjectEst(project?.change_automatically_project_estimated_time ?? false);
    setAutoMilestoneEst(project?.change_automatically_milestone_estimated_time ?? false);
    setAutoProjectDates(project?.change_automatically_project_start_end_dates ?? false);
    setAutoMilestoneDates(project?.change_automatically_milestone_start_end_dates ?? false);
    setError(null);
  }, [open, project?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = () => {
    setError(null);
    if (!name.trim()) { setError("Name is required."); return; }

    const payload: ProjectInput = {
      name: name.trim(),
      status,
      estimated_time: estimatedTime ? parseFloat(estimatedTime) : null,
      real_time: realTimeVal ? parseFloat(realTimeVal) : null,
      start_date_estimated: startEst || null,
      end_date_estimated: endEst || null,
      start_date_real: startReal || null,
      end_date_real: endReal || null,
      description: description || null,
      authorized_users: authorizedUsers,
      change_automatically_project_estimated_time: autoProjectEst,
      change_automatically_milestone_estimated_time: autoMilestoneEst,
      change_automatically_project_start_end_dates: autoProjectDates,
      change_automatically_milestone_start_end_dates: autoMilestoneDates,
    };

    startTransition(async () => {
      const result = isEdit
        ? await updateProject(project!.id, payload)
        : await createProject(payload);

      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
        onClose();
      }
    });
  };

  // Progress bar calculations
  const totalEst    = taskProgress?.totalEst ?? 0;
  const doneOrQaEst = taskProgress?.doneOrQaEst ?? 0;
  const doneOnlyEst = taskProgress?.doneEst ?? 0;
  const realTime    = project?.real_time ?? 0;
  const projEstTime = parseFloat(estimatedTime) || project?.estimated_time || 0;

  const schedPct = (() => {
    if (!startEst || !endEst) return 0;
    const start = new Date(startEst).getTime();
    const end   = new Date(endEst).getTime();
    const span  = end - start;
    if (span <= 0) return 0;
    return Math.min(100, Math.max(0, ((Date.now() - start) / span) * 100));
  })();

  return (
    <>
      <Modal open={open} onClose={onClose} title={isEdit ? "Project" : "New Project"} width="max-w-2xl">
        <div className="px-6 pb-2 space-y-5 overflow-y-auto max-h-[75vh]">

          {/* Photo */}
          <div className="flex justify-center pt-2">
            <div className="w-20 h-20 rounded-full bg-muted border border-border flex items-center justify-center text-text-muted text-xs overflow-hidden">
              {project?.picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={project.picture} alt="" className="w-full h-full object-cover" />
              ) : (
                "Photo"
              )}
            </div>
          </div>

          {/* Name */}
          <Field label="Name" required>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canEdit}
              className="input-field disabled:opacity-60 disabled:cursor-not-allowed"
              placeholder="Project name"
            />
          </Field>

          {/* Status + Authorized Users */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Status" required>
              <select value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)} disabled={!canEdit} className="input-field disabled:opacity-60 disabled:cursor-not-allowed">
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Authorized Users">
              <UserMultiSelect
                value={authorizedUsers}
                onChange={setAuthorizedUsers}
                options={profiles.map((p) => ({
                  id: p.id,
                  name: [p.first_name, p.last_name].filter(Boolean).join(" ") || "Unknown",
                  role: p.type ?? null,
                  picture: p.picture ?? null,
                }))}
                placeholder="Add people"
                disabled={!canEdit}
              />
            </Field>
          </div>

          {/* Estimated Time + Real Time */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Estimated Time (h)">
              <input type="number" min="0" step="0.5" value={estimatedTime} onChange={(e) => setEstimatedTime(e.target.value)} disabled={!canEdit} className="input-field disabled:opacity-60 disabled:cursor-not-allowed" placeholder="0" />
            </Field>
            <Field label="Real Time (h)">
              <input type="number" min="0" step="0.01" value={realTimeVal} onChange={(e) => setRealTimeVal(e.target.value)} disabled={!canEdit} className="input-field disabled:opacity-60 disabled:cursor-not-allowed" placeholder="0.00" />
            </Field>
          </div>

          {/* Dates estimated */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Date (Estimated)">
              <DatePicker value={startEst} onChange={setStartEst} maxDate={endEst || null} readOnly={!canEdit} />
            </Field>
            <Field label="End Date (Estimated)">
              <DatePicker value={endEst} onChange={setEndEst} minDate={startEst || null} readOnly={!canEdit} />
            </Field>
          </div>

          {/* Dates real */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Date (Real)">
              <DatePicker value={startReal} onChange={setStartReal} readOnly />
            </Field>
            <Field label="End Date (Real)">
              <DatePicker value={endReal} onChange={setEndReal} readOnly />
            </Field>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Toggle label="Change Automatically the Milestones' Estimated Time" value={autoMilestoneEst} onChange={setAutoMilestoneEst} disabled={!canEdit} />
            <Toggle label="Change Automatically the Milestones' Start Date and End Date" value={autoMilestoneDates} onChange={setAutoMilestoneDates} disabled={!canEdit} />
            <Toggle label="Change Automatically This Project's Estimated Time" value={autoProjectEst} onChange={setAutoProjectEst} disabled={!canEdit} />
            <Toggle label="Change Automatically This Project's Start Date and End Date" value={autoProjectDates} onChange={setAutoProjectDates} disabled={!canEdit} />
          </div>

          {/* Progress (edit mode only) — after toggles, before description */}
          {isEdit && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-text-secondary">Progress</h4>
              <ProgressBar label="By current date / estimated end date" pct={schedPct} />
              <ProgressBar label="By tasks ready for QA & done / all tasks" pct={totalEst > 0 ? (doneOrQaEst / totalEst) * 100 : 0} />
              <ProgressBar label="By tasks done / all tasks" pct={totalEst > 0 ? (doneOnlyEst / totalEst) * 100 : 0} />
              <ProgressBar label="By real time / estimated time" pct={projEstTime > 0 ? (realTime / projEstTime) * 100 : 0} />
            </div>
          )}

          {/* Description */}
          <Field label="Description">
            <RichTextEditor
              content={description}
              onChange={setDescription}
              placeholder="Project description…"
              minHeight="min-h-32"
              editable={canEdit}
            />
          </Field>

          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        {/* Footer — Save is hidden for non-admin/manager (read-only view). */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
          <button onClick={onClose} className="px-5 py-2 rounded-md bg-muted text-text-secondary text-sm font-medium hover:bg-border transition-colors">
            Close
          </button>
          {canEdit && (
            <button
              onClick={handleSave}
              disabled={isPending}
              className="px-6 py-2 rounded-md bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isPending ? "Saving…" : "Save"}
            </button>
          )}
        </div>
      </Modal>

    </>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-text-secondary">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function Toggle({ label, value, onChange, disabled }: { label: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${disabled ? "opacity-60" : ""}`}>
      <button
        type="button"
        onClick={() => !disabled && onChange(!value)}
        disabled={disabled}
        className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${value ? "bg-accent" : "bg-muted border border-border"} ${disabled ? "cursor-not-allowed" : ""}`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? "translate-x-4" : "translate-x-0"}`}
        />
      </button>
      <span className="text-xs text-text-secondary leading-tight">{label}</span>
    </div>
  );
}
