"use client";

import { useState, useEffect, useTransition } from "react";
import Modal from "./Modal";
import DatePicker from "@/components/DatePicker";
import type { Task, QATimeTrack } from "@/types/projects";
import { TIME_OPTIONS, minToTimeStr, timeStrToMin } from "@/types/projects";
import { upsertQATimeEntry, deleteQATimeEntry } from "../../actions";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface QATimeTrackerModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  /** level_1 tasks (milestones) to group entries under */
  milestones: Task[];
}

interface LocalQAEntry {
  id?: string;
  taskId: string;
  date: string;
  startMin: number;
  endMin: number;
  isNew: boolean;
}

function computeSpent(startMin: number, endMin: number): number {
  const diff = endMin - startMin;
  return diff > 0 ? Math.round((diff / 60) * 100) / 100 : 0;
}

const today = new Date().toISOString().split("T")[0];

export default function QATimeTrackerModal({
  open,
  onClose,
  projectId,
  milestones,
}: QATimeTrackerModalProps) {
  const router = useRouter();
  const [entries, setEntries] = useState<LocalQAEntry[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState<Set<string>>(new Set(milestones.map((m) => m.id)));

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const supabase = createClient();
    supabase
      .from("project_qa_time_track")
      // qa_time_track.owner_user_id → assignee_id (B8 item 42).
      .select("id, assignee_id, task_id, project_id, start_date, start_time_min, end_time_min, time_spent_h, paid, profiles(id, first_name, last_name, picture)")
      .eq("project_id", projectId)
      .then(({ data }) => {
        const loaded = (data ?? []) as unknown as QATimeTrack[];
        setEntries(
          loaded.map((e) => ({
            id: e.id,
            taskId: e.task_id ?? "",
            date: e.start_date ?? today,
            startMin: e.start_time_min ?? 540,
            endMin: e.end_time_min ?? 1020,
            isNew: false,
          }))
        );
        setLoading(false);
      });
  }, [open, projectId]);

  const addEntry = (milestoneId: string) => {
    setEntries((prev) => [
      ...prev,
      { taskId: milestoneId, date: today, startMin: 540, endMin: 1020, isNew: true },
    ]);
  };

  const removeEntry = (idx: number) => {
    const entry = entries[idx];
    if (entry.id) setDeletedIds((prev) => [...prev, entry.id!]);
    setEntries((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateEntry = (idx: number, patch: Partial<LocalQAEntry>) => {
    setEntries((prev) => prev.map((e, i) => (i === idx ? { ...e, ...patch } : e)));
  };

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const milestoneEntries = (milestoneId: string) =>
    entries.filter((e) => e.taskId === milestoneId);

  const milestoneTotal = (milestoneId: string) =>
    milestoneEntries(milestoneId).reduce((s, e) => s + computeSpent(e.startMin, e.endMin), 0);

  const totalAll = entries.reduce((s, e) => s + computeSpent(e.startMin, e.endMin), 0);

  const handleSave = () => {
    startTransition(async () => {
      for (const id of deletedIds) {
        await deleteQATimeEntry(id, projectId);
      }
      for (const entry of entries) {
        await upsertQATimeEntry({
          id: entry.id,
          task_id: entry.taskId,
          project_id: projectId,
          start_date: entry.date,
          start_time_min: entry.startMin,
          end_time_min: entry.endMin,
          time_spent_h: computeSpent(entry.startMin, entry.endMin),
        });
      }
      router.refresh();
      onClose();
    });
  };

  return (
    <Modal open={open} onClose={onClose} width="max-w-2xl">
      <div className="px-6 pt-6 pb-2">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 pr-10">
          <h2 className="text-xl font-bold text-text-primary">QA Time Tracker</h2>
          <span className="text-lg font-bold text-text-primary">{totalAll.toFixed(0)} h</span>
        </div>

        {loading && <p className="text-sm text-text-muted py-6 text-center">Loading…</p>}

        {!loading && milestones.map((milestone, mIdx) => {
          const mEntries = milestoneEntries(milestone.id);
          const mTotal = milestoneTotal(milestone.id);
          const isExpanded = expanded.has(milestone.id);
          // Find global indices for this milestone's entries
          const globalIndices = entries.reduce<number[]>((acc, e, i) => {
            if (e.taskId === milestone.id) acc.push(i);
            return acc;
          }, []);

          return (
            <div key={milestone.id} className="mb-4 rounded-lg border border-border overflow-hidden">
              {/* Milestone header */}
              <div className="flex items-center justify-between px-4 py-3 bg-accent text-white">
                <span className="text-sm font-semibold">
                  Milestone {mIdx + 1}: {milestone.name}
                </span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/20 rounded-md">
                    <input
                      type="text"
                      readOnly
                      value={`${mTotal.toFixed(1)} h`}
                      className="w-12 bg-transparent text-white text-xs font-semibold text-center outline-none"
                    />
                  </div>
                  <button onClick={() => toggleExpanded(milestone.id)} className="text-white/80 hover:text-white transition-colors">
                    <svg
                      className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-0" : "-rotate-90"}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="bg-surface">
                  {/* Column header */}
                  {mEntries.length > 0 && (
                    <div className="grid grid-cols-[130px_100px_100px_80px_40px_24px_32px] gap-2 px-3 py-1.5 bg-muted text-xs font-semibold text-text-secondary">
                      <span>Date</span>
                      <span>Start Time</span>
                      <span>End Time</span>
                      <span>Spent (h)</span>
                      <span>Owner</span>
                      <span />
                      <span />
                    </div>
                  )}

                  {globalIndices.map((globalIdx) => {
                    const entry = entries[globalIdx];
                    return (
                      <div
                        key={globalIdx}
                        className="grid grid-cols-[130px_100px_100px_80px_40px_24px_32px] gap-2 px-3 py-2 border-t border-border/30 items-center"
                      >
                        <DatePicker
                          value={entry.date}
                          onChange={(v) => updateEntry(globalIdx, { date: v })}
                          size="compact"
                        />
                        <select
                          value={minToTimeStr(entry.startMin)}
                          onChange={(e) => updateEntry(globalIdx, { startMin: timeStrToMin(e.target.value) })}
                          className="text-xs bg-muted border border-border rounded px-2 py-1 text-text-primary focus:outline-none focus:border-accent"
                        >
                          {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <select
                          value={minToTimeStr(entry.endMin)}
                          onChange={(e) => updateEntry(globalIdx, { endMin: timeStrToMin(e.target.value) })}
                          className="text-xs bg-muted border border-border rounded px-2 py-1 text-text-primary focus:outline-none focus:border-accent"
                        >
                          {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <span className="text-xs text-text-secondary px-1">
                          {computeSpent(entry.startMin, entry.endMin).toFixed(2)}
                        </span>
                        {/* Owner avatar placeholder */}
                        <div className="w-6 h-6 rounded-full bg-accent text-white text-[9px] font-semibold flex items-center justify-center">
                          Me
                        </div>
                        {/* Clear / X */}
                        <button className="text-red-400 hover:text-red-300 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        <button onClick={() => removeEntry(globalIdx)} className="p-1 text-text-muted hover:text-red-400 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}

                  {/* Add row */}
                  <div className="border-t border-border/30">
                    <button
                      onClick={() => addEntry(milestone.id)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs text-text-muted hover:text-text-secondary transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end px-6 py-4 border-t border-border shrink-0 gap-3">
        <button onClick={onClose} className="px-5 py-2 rounded-md bg-muted text-text-secondary text-sm font-medium hover:bg-border transition-colors">
          Close
        </button>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="px-6 py-2 rounded-md bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </Modal>
  );
}
