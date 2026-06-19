"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  RichTextEditor,
  type RichTextEditorHandle,
} from "@/components/editor/RichTextEditor";
import DatePicker from "@/components/DatePicker";
import type { Project } from "@/types/projects";
import type { ProjectDailyFeedback } from "@/types/docs";
import { createDailyFeedback, updateDailyFeedback } from "../../actions";

interface Props {
  project: Project;
  feedback: ProjectDailyFeedback | null;
  onClose: () => void;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function DailyFeedbackFormModal({
  project,
  feedback,
  onClose,
}: Props) {
  const router = useRouter();
  const isEdit = feedback !== null;
  const [saving, startSave] = useTransition();

  const [startDate, setStartDate] = useState<string>(feedback?.start_date ?? feedback?.date ?? todayIso());
  const [endDate, setEndDate] = useState<string>(feedback?.end_date ?? feedback?.date ?? todayIso());
  const [totalTime, setTotalTime] = useState<string>(feedback?.total_time != null ? String(feedback.total_time) : "");

  const todayRef = useRef<RichTextEditorHandle>(null);
  const tomorrowRef = useRef<RichTextEditorHandle>(null);
  const blockersRef = useRef<RichTextEditorHandle>(null);
  const linksRef = useRef<RichTextEditorHandle>(null);

  function handleSave() {
    if (!startDate || !endDate) {
      alert("Please pick a start and end date.");
      return;
    }
    if (startDate > endDate) {
      alert("Start date must be on or before end date.");
      return;
    }
    const parsedTotal = totalTime.trim() === "" ? null : Number(totalTime);
    if (parsedTotal !== null && (Number.isNaN(parsedTotal) || parsedTotal < 0)) {
      alert("Total time must be a non-negative number.");
      return;
    }
    const payload = {
      start_date:      startDate,
      end_date:        endDate,
      total_time:      parsedTotal,
      current_work:    todayRef.current?.getHTML() ?? null,
      next_work:       tomorrowRef.current?.getHTML() ?? null,
      blockers:        blockersRef.current?.getHTML() ?? null,
      video_and_links: linksRef.current?.getHTML() ?? null,
    };
    startSave(async () => {
      const res = isEdit
        ? await updateDailyFeedback(feedback!.id, payload)
        : await createDailyFeedback({ projectId: project.id, ...payload });
      if (res.error) {
        alert(res.error);
        return;
      }
      onClose();
      router.refresh();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface border border-border rounded-lg w-full max-w-4xl flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h3 className="text-heading-3 text-text-primary">
            {isEdit ? "Edit work feedback" : "New work feedback"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-text-muted hover:text-text-primary"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium uppercase tracking-wider text-text-muted">Start date</label>
              <DatePicker value={startDate} onChange={setStartDate} size="compact" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium uppercase tracking-wider text-text-muted">End date</label>
              <DatePicker value={endDate} onChange={setEndDate} size="compact" minDate={startDate} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium uppercase tracking-wider text-text-muted">Total time worked (h)</label>
              <input
                type="number"
                min={0}
                step="0.25"
                value={totalTime}
                onChange={(e) => setTotalTime(e.target.value)}
                placeholder="0"
                className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldBlock
              label="What I worked on this period"
              editorRef={todayRef}
              initialHtml={feedback?.current_work ?? ""}
            />
            <FieldBlock
              label="What I will work on next"
              editorRef={tomorrowRef}
              initialHtml={feedback?.next_work ?? ""}
            />
            <FieldBlock
              label="Blockers"
              editorRef={blockersRef}
              initialHtml={feedback?.blockers ?? ""}
            />
            <FieldBlock
              label="Video & Links"
              editorRef={linksRef}
              initialHtml={feedback?.video_and_links ?? ""}
            />
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
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldBlock({
  label,
  editorRef,
  initialHtml,
}: {
  label: string;
  editorRef: React.RefObject<RichTextEditorHandle | null>;
  initialHtml: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
        {label}
      </label>
      <div className="border border-border rounded-md overflow-hidden bg-muted/30">
        <RichTextEditor
          ref={editorRef}
          initialHtml={initialHtml}
          hideFooter
          autoHeight
        />
      </div>
    </div>
  );
}
