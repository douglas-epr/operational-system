"use client";

import { useState, useEffect, useTransition } from "react";
import Modal from "./Modal";
import type { TimeTrack } from "@/types/projects";
import { minToTimeStr } from "@/types/projects";
import { deleteTimeEntry } from "../../actions";
import { createClient } from "@/lib/supabase/client";

interface WorkingHoursModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

interface GroupedDay {
  dateLabel: string;
  totalH: number;
  entries: TimeTrack[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "2-digit", day: "2-digit", year: "numeric" });
}

export default function WorkingHoursModal({
  open,
  onClose,
  projectId,
  projectName,
}: WorkingHoursModalProps) {
  const [entries, setEntries] = useState<TimeTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const supabase = createClient();
    supabase
      .from("project_task_time_track")
      // time_track.owner_id → assignee_id (B8 item 33).
      .select("id, assignee_id, task_id, project_id, start_date, start_time_min, end_time_min, time_spent_h, profiles(id, first_name, last_name, picture)")
      .eq("project_id", projectId)
      .order("start_date", { ascending: false })
      .then(({ data }) => {
        setEntries((data ?? []) as unknown as TimeTrack[]);
        setLoading(false);
      });
  }, [open, projectId]);

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteTimeEntry(id, projectId);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    });
  };

  // Group by date
  const grouped: GroupedDay[] = [];
  const seen = new Map<string, number>();
  for (const entry of entries) {
    const key = entry.start_date ?? "";
    if (!seen.has(key)) {
      seen.set(key, grouped.length);
      grouped.push({ dateLabel: key ? formatDate(key) : "—", totalH: 0, entries: [] });
    }
    const idx = seen.get(key)!;
    grouped[idx].entries.push(entry);
    grouped[idx].totalH += entry.time_spent_h ?? 0;
  }

  const totalAll = entries.reduce((s, e) => s + (e.time_spent_h ?? 0), 0);

  return (
    <Modal open={open} onClose={onClose} title="Working Hours" width="max-w-2xl">
      {/* Project info bar */}
      <div className="px-6 py-3 border-b border-border bg-muted/30 flex items-center justify-between text-sm">
        <span className="font-medium text-text-primary">{projectName}</span>
        <span className="text-text-secondary font-semibold">{totalAll.toFixed(1)} h total</span>
      </div>

      <div className="px-6 pb-4">
        {loading && (
          <div className="flex justify-center py-10">
            <span className="text-sm text-text-muted">Loading…</span>
          </div>
        )}

        {!loading && grouped.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-text-muted">
            <svg className="w-10 h-10 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">No working hours logged.</p>
          </div>
        )}

        {grouped.map((group) => (
          <div key={group.dateLabel} className="mt-4">
            {/* Day header */}
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm font-semibold text-text-primary">{group.dateLabel}</span>
              <span className="text-xs text-text-muted">{group.totalH.toFixed(1)} h</span>
            </div>

            {/* Column header */}
            <div className="grid grid-cols-[100px_100px_80px_40px_1fr_32px] gap-2 px-2 py-1.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">
              <span>Start Time</span>
              <span>End Time</span>
              <span>Spent (h)</span>
              <span>Owner</span>
              <span>Task</span>
              <span />
            </div>

            {group.entries.map((entry) => {
              const p = entry.profiles;
              const fullName = p ? [p.first_name, p.last_name].filter(Boolean).join(" ") || "?" : "?";
              const initial = fullName[0]?.toUpperCase() ?? "?";
              return (
                <div
                  key={entry.id}
                  className="grid grid-cols-[100px_100px_80px_40px_1fr_32px] gap-2 px-2 py-2 border-b border-border/30 items-center hover:bg-muted/20"
                >
                  <span className="text-xs text-text-secondary">
                    {entry.start_time_min != null ? minToTimeStr(entry.start_time_min) : "—"}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {entry.end_time_min != null ? minToTimeStr(entry.end_time_min) : "—"}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {(entry.time_spent_h ?? 0).toFixed(2)}
                  </span>
                  <div
                    className="w-7 h-7 rounded-full bg-accent text-white text-[10px] font-semibold flex items-center justify-center overflow-hidden"
                    title={fullName}
                  >
                    {p?.picture ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.picture} alt={fullName} className="w-full h-full object-cover" />
                    ) : (
                      initial
                    )}
                  </div>
                  <span className="text-xs text-text-muted truncate">
                    {entry.task_id ?? "—"}
                  </span>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="p-1 text-text-muted hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex justify-end px-6 py-4 border-t border-border shrink-0">
        <button onClick={onClose} className="px-5 py-2 rounded-md bg-muted text-text-secondary text-sm font-medium hover:bg-border transition-colors">
          Close
        </button>
      </div>
    </Modal>
  );
}
