"use client";

/**
 * ImportTasksFromIdeaModal — opens from the Developer Tasks tab. Two-step
 * flow:
 *
 *   Step 1 — PICK. Search box + idea list. Linked-to-this-project ideas
 *            first; falls back to ideas with no project. Each row shows
 *            a "milestones ready" / "no milestones yet" badge so the
 *            user can't pick an idea that has no content to import.
 *
 *   Step 2 — CONFIRM. A summary popup explains exactly what's about to
 *            happen ("We'll AI-parse the milestones and tasks for
 *            <name> and *append* them under your existing developer
 *            tasks. Existing milestones are not modified.") with
 *            explicit Cancel / Import buttons.
 *
 * Confirm calls `importTasksFromIdea(projectId, ideaId)` and shows a tiny
 * inline progress note while the round-trip runs (~5–15s).
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Modal from "./Modal";
import {
  importTasksFromIdea,
  listIdeasForDeveloperTasksPicker,
} from "../../actions";
import type { IdeaPickerResult, IdeaPickerRow } from "@/lib/data/ideaPicker";

interface Props {
  open: boolean;
  projectId: string;
  onClose: () => void;
}

type Step = "pick" | "confirm";

export default function ImportTasksFromIdeaModal({ open, projectId, onClose }: Props) {
  const router = useRouter();
  const [data, setData] = useState<IdeaPickerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState<IdeaPickerRow | null>(null);
  const [step, setStep] = useState<Step>("pick");
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) {
      setData(null);
      setPicked(null);
      setStep("pick");
      setSearch("");
      return;
    }
    let cancelled = false;
    setLoading(true);
    void listIdeasForDeveloperTasksPicker(projectId).then((res) => {
      if (cancelled) return;
      if (res.error) {
        toast.error(res.error);
        setData({ linked: [], unassigned: [] });
      } else {
        setData(res.data ?? { linked: [], unassigned: [] });
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open, projectId]);

  const showUnassigned = (data?.linked.length ?? 0) === 0;
  const visibleRows = useMemo(() => {
    if (!data) return [];
    const rows = showUnassigned ? data.unassigned : data.linked;
    const q = search.trim().toLowerCase();
    return q ? rows.filter((r) => r.name.toLowerCase().includes(q)) : rows;
  }, [data, showUnassigned, search]);

  async function handleImport() {
    if (!picked) return;
    setImporting(true);
    const res = await importTasksFromIdea(projectId, picked.id);
    setImporting(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    const c = res.created ?? { milestones: 0, tasks: 0 };
    toast.success(`Imported ${c.milestones} milestone${c.milestones === 1 ? "" : "s"} and ${c.tasks} task${c.tasks === 1 ? "" : "s"}.`);
    onClose();
    router.refresh();
  }

  return (
    <Modal open={open} onClose={onClose} title="Import tasks from idea" width="max-w-2xl">
      {step === "pick" && (
        <div className="px-6 pb-6 flex flex-col gap-4">
          <p className="text-sm text-text-secondary">
            {showUnassigned
              ? "No idea is linked to this project yet. Pick an unassigned idea to import its milestones and tasks."
              : "Pick the idea whose milestones & tasks you want to import as developer tasks."}
          </p>

          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ideas…"
            className="input-field text-sm"
          />

          <div className="border border-border rounded-md overflow-hidden">
            <div className="px-3 py-2 text-[10px] font-semibold uppercase text-text-muted bg-base/40 border-b border-border">
              {showUnassigned ? "Available (unassigned)" : "Linked to this project"}
            </div>
            <ul className="max-h-[44vh] overflow-y-auto">
              {loading && (
                <li className="px-4 py-6 text-center text-xs text-text-muted">Loading ideas…</li>
              )}
              {!loading && visibleRows.length === 0 && (
                <li className="px-4 py-6 text-center text-xs text-text-muted">
                  {search.trim() ? "No matches." : "No ideas yet."}
                </li>
              )}
              {visibleRows.map((row) => {
                const checked = picked?.id === row.id;
                const ready = row.has_milestones;
                return (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() => ready && setPicked(row)}
                      disabled={!ready}
                      title={ready ? undefined : "This idea has no Milestones & Tasks block yet."}
                      className={[
                        "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                        checked ? "bg-accent/15" : ready ? "hover:bg-muted" : "opacity-50 cursor-not-allowed",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "w-4 h-4 rounded-full border shrink-0 flex items-center justify-center",
                          checked ? "border-accent bg-accent text-white" : "border-border",
                        ].join(" ")}
                      >
                        {checked && (
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-text-primary truncate">{row.name}</div>
                        <div className="text-[11px] text-text-muted flex items-center gap-2">
                          <span className={ready ? "text-emerald-400" : "text-amber-400"}>
                            {ready ? "Milestones ready" : "No milestones yet"}
                          </span>
                          {typeof row.score === "number" && <span>· Score {row.score.toFixed(1)}</span>}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="text-sm px-3 py-1.5 rounded text-text-muted hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setStep("confirm")}
              disabled={!picked}
              className="text-sm px-4 py-1.5 rounded-md bg-accent hover:bg-accent-hover text-white disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === "confirm" && picked && (
        <div className="px-6 pb-6 flex flex-col gap-4">
          <div className="rounded-md border border-border bg-base/40 p-4 text-sm text-text-secondary">
            <p className="font-medium text-text-primary mb-2">
              About to import <span className="text-accent">{picked.name}</span>
            </p>
            <p>
              We&apos;ll send the idea&apos;s milestones-and-tasks block to your configured AI
              and parse it into structured rows. The new milestones and tasks will be
              <span className="text-text-primary font-medium"> appended</span> below
              any developer-task milestones already on this project.
            </p>
            <p className="mt-2 text-xs text-text-muted">
              Existing milestones and tasks are not modified. If something goes wrong
              you can delete the imported milestones individually afterwards.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setStep("pick")}
              disabled={importing}
              className="text-sm px-3 py-1.5 rounded text-text-muted hover:text-text-primary disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={importing}
              className="text-sm px-4 py-1.5 rounded-md bg-accent hover:bg-accent-hover text-white disabled:opacity-50"
            >
              {importing ? "Parsing & importing…" : "Import"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
