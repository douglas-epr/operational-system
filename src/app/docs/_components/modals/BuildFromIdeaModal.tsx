"use client";

/**
 * BuildFromIdeaModal — opened from the Playbook tab's empty state and
 * from the editor toolbar. Replaces the old "click → instant build"
 * button so the user can pick which idea drives the new playbook
 * version.
 *
 * UX (matches the user's spec):
 *   - On open, fetch ideas linked to the current project.
 *   - If there are linked ideas → show them under "Linked to this project"
 *     and don't render the unassigned bucket.
 *   - If there are zero linked ideas → show ideas with no project under
 *     "Available (unassigned) — picking one will link it to this project".
 *   - Picking an idea + Confirm builds the playbook (auto-links the idea
 *     when picking from the unassigned bucket).
 *
 * Uses the shared `Modal` wrapper for Escape / overlay-click handling and
 * the same visual style used elsewhere (e.g. AgreementFormModal).
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Modal from "@/app/projects/_components/modals/Modal";
import {
  buildPlaybookFromIdea,
  listIdeasForPlaybookPicker,
} from "../../actions";
import type { IdeaPickerResult, IdeaPickerRow } from "@/lib/data/ideaPicker";

interface Props {
  open: boolean;
  projectId: string;
  onClose: () => void;
  onBuilt?: () => void;
}

export default function BuildFromIdeaModal({ open, projectId, onClose, onBuilt }: Props) {
  const router = useRouter();
  const [data, setData] = useState<IdeaPickerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState<IdeaPickerRow | null>(null);
  const [building, setBuilding] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) {
      setData(null);
      setPicked(null);
      setSearch("");
      return;
    }
    let cancelled = false;
    setLoading(true);
    void listIdeasForPlaybookPicker(projectId).then((res) => {
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

  async function handleConfirm() {
    if (!picked) return;
    setBuilding(true);
    const res = await buildPlaybookFromIdea(projectId, picked.id);
    setBuilding(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(showUnassigned ? "Idea linked + playbook built" : "Playbook built");
    onBuilt?.();
    onClose();
    router.refresh();
  }

  return (
    <Modal open={open} onClose={onClose} title="Build playbook from idea" width="max-w-2xl">
      <div className="px-6 pb-6 flex flex-col gap-4">
        <p className="text-sm text-text-secondary">
          {showUnassigned
            ? "No idea is linked to this project yet. Pick an unassigned idea — it'll be linked to this project automatically."
            : "Pick which idea this playbook version should be built from."}
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
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => setPicked(row)}
                    className={[
                      "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                      checked ? "bg-accent/15" : "hover:bg-muted",
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
                        {typeof row.score === "number" && (
                          <span>Score {row.score.toFixed(1)}</span>
                        )}
                        <span
                          className={
                            row.has_prd
                              ? "text-emerald-400"
                              : "text-amber-400"
                          }
                        >
                          {row.has_prd ? "PRD ready" : "PRD missing"}
                        </span>
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
            onClick={handleConfirm}
            disabled={!picked || building}
            className="text-sm px-4 py-1.5 rounded-md bg-accent hover:bg-accent-hover text-white disabled:opacity-50"
          >
            {building
              ? "Building…"
              : picked && showUnassigned
                ? "Link & Build"
                : "Build"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
