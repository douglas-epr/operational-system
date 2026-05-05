"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  RichTextEditor,
  type RichTextEditorHandle,
} from "@/components/editor/RichTextEditor";
import {
  GOAL_STATUSES,
  GOAL_STATUS_LABELS,
  GOAL_STATUS_PILL,
  type InternalGoal,
  type InternalGoalStatus,
} from "@/types/okrs";
import { createGoal, updateGoal } from "../actions";
import { CloseIcon, ChevronDownIcon } from "@/components/ui/icons";

interface Props {
  initial: InternalGoal | null;
  onClose: () => void;
}

export default function GoalModal({ initial, onClose }: Props) {
  const router = useRouter();
  const [name, setName] = useState<string>(initial?.name ?? "");
  const [status, setStatus] = useState<InternalGoalStatus>(
    initial?.status ?? "not_started"
  );
  const editorRef = useRef<RichTextEditorHandle>(null);
  const [saving, startSave] = useTransition();

  function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      alert("Name is required");
      return;
    }
    const description = editorRef.current?.getHTML() ?? "";

    startSave(async () => {
      if (initial) {
        const res = await updateGoal(initial.id, {
          name: trimmedName,
          status,
          description,
        });
        if (res.error) {
          alert(res.error);
          return;
        }
      } else {
        const res = await createGoal(trimmedName);
        if (res.error) {
          alert(res.error);
          return;
        }
        // Follow-up update to persist status + description.
        if (res.goalId) {
          const up = await updateGoal(res.goalId, { status, description });
          if (up.error) {
            alert(up.error);
            return;
          }
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
            {initial ? "Edit goal" : "New goal"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-text-muted hover:text-text-primary"
          >
            <CloseIcon className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          {/* Name + status row */}
          <div className="flex items-start gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="text-[11px] font-medium uppercase tracking-wider text-text-muted block mb-1">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Become a Gold Agency"
                className="input-field w-full"
                autoFocus
              />
            </div>
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-text-muted block mb-1">
                Status
              </label>
              <StatusDropdown value={status} onChange={setStatus} />
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
              Description
            </label>
            <div className="border border-border rounded-md overflow-hidden bg-muted/30 min-h-[260px]">
              <RichTextEditor
                ref={editorRef}
                initialHtml={initial?.description ?? ""}
                hideFooter
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border shrink-0">
          <button
            onClick={onClose}
            className="text-xs text-text-secondary hover:text-text-primary px-3 py-1.5"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-accent hover:bg-accent-hover text-white text-xs font-medium px-3 py-1.5 rounded-md disabled:opacity-50"
          >
            {saving ? "Saving…" : initial ? "Save" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusDropdown({
  value,
  onChange,
}: {
  value: InternalGoalStatus;
  onChange: (s: InternalGoalStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center text-[11px] px-2.5 py-1 rounded-full border ${GOAL_STATUS_PILL[value]}`}
      >
        {GOAL_STATUS_LABELS[value]}
        <ChevronDownIcon className="w-3 h-3 ml-1" strokeWidth={2} />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 z-50 bg-surface border border-border rounded-md shadow-xl py-1 min-w-[160px]">
            {GOAL_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => {
                  onChange(s);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-muted"
              >
                <span
                  className={`inline-block text-[10px] px-2 py-0.5 rounded-full border ${GOAL_STATUS_PILL[s]}`}
                >
                  {GOAL_STATUS_LABELS[s]}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
