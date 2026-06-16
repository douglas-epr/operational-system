"use client";

/**
 * UserPickerModal — two-pane picker for opening / creating a private
 * conversation.
 *
 * Layout:
 *   ┌────────────────────────────────────────────┐
 *   │  [search]                                  │
 *   │  ┌─────────────┐   ┌─────────────────────┐ │
 *   │  │ Available   │   │ Selected            │ │
 *   │  │ - Alice  +  │   │ - Bob       remove  │ │
 *   │  │ - Carol  +  │   │ - Carol     remove  │ │
 *   │  └─────────────┘   └─────────────────────┘ │
 *   │  Group title (only when 2+)                │
 *   │                              [Create]      │
 *   └────────────────────────────────────────────┘
 *
 * Visible-peers gate is server-side via `listSelectablePrivatePeers`:
 * admin/manager/operational see every staff + client + qa; other roles
 * only see users they share a project with.
 *
 * Single-user select still creates / dedupes a 1:1; 2+ creates a fresh
 * group. The optional title field shows up when ≥ 2 are selected.
 */

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  createPrivateConversation,
  listSelectablePrivatePeers,
  updatePrivateConversation,
} from "../../actions";

interface EditConversation {
  id: string;
  /** Participant IDs excluding the current user (they'll be pre-selected). */
  participantIds: string[];
  title: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
  /** When provided the modal runs in edit mode instead of create mode. */
  editConversation?: EditConversation;
  onUpdated?: () => void;
}

interface Hit {
  id: string;
  first_name: string | null;
  last_name: string | null;
  picture: string | null;
  type: string | null;
}

function nameOf(u: Hit): string {
  return `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || "Unnamed";
}

function initials(u: Hit): string {
  return nameOf(u)
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function UserPickerModal({ open, onClose, onCreated, editConversation, onUpdated }: Props) {
  const [query, setQuery] = useState("");
  const [pool, setPool] = useState<Hit[]>([]);
  const [picked, setPicked] = useState<Hit[]>([]);
  const [groupTitle, setGroupTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load eligible peers once when the modal opens.
  useEffect(() => {
    if (!open) {
      setQuery("");
      setPool([]);
      setPicked([]);
      setGroupTitle("");
      return;
    }
    let cancelled = false;
    setLoading(true);
    void listSelectablePrivatePeers().then((rows) => {
      if (cancelled) return;
      setPool(rows);
      setLoading(false);
      // Edit mode: pre-select existing participants and pre-fill title.
      if (editConversation) {
        const preIds = new Set(editConversation.participantIds);
        setPicked(rows.filter((r) => preIds.has(r.id)));
        setGroupTitle(editConversation.title ?? "");
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const pickedIds = useMemo(() => new Set(picked.map((p) => p.id)), [picked]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pool;
    return pool.filter((u) => nameOf(u).toLowerCase().includes(q));
  }, [pool, query]);

  const isGroup = picked.length >= 2;

  if (!open) return null;

  function add(u: Hit) {
    setPicked((prev) => (prev.some((p) => p.id === u.id) ? prev : [...prev, u]));
  }
  function remove(id: string) {
    setPicked((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleSubmit() {
    if (picked.length === 0) {
      toast.error("Pick at least one person.");
      return;
    }
    setSubmitting(true);

    if (editConversation) {
      const res = await updatePrivateConversation(editConversation.id, {
        participantIds: picked.map((p) => p.id),
        title: isGroup ? (groupTitle.trim() || null) : null,
      });
      setSubmitting(false);
      if (res.error) { toast.error(res.error); return; }
      toast.success("Conversation updated.");
      onUpdated?.();
      onClose();
      return;
    }

    let res;
    if (picked.length === 1) {
      res = await createPrivateConversation(picked[0].id);
    } else {
      res = await createPrivateConversation(picked.map((p) => p.id), {
        title: groupTitle.trim() || null,
      });
    }
    setSubmitting(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    if (res.id) onCreated(res.id);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-elevated border border-border rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="px-5 py-3 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">
              {editConversation ? "Edit conversation" : "New conversation"}
            </h3>
            <p className="text-[11px] text-text-muted">
              {editConversation
                ? "Add or remove participants and update the group title."
                : "Add 1 person for a 1:1 chat, or 2+ for a group."}
            </p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-border shrink-0">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people…"
            className="input-field text-sm"
          />
        </div>

        {/* Two-pane body */}
        <div className="grid grid-cols-2 gap-0 flex-1 min-h-0">
          {/* Available */}
          <div className="border-r border-border flex flex-col min-h-0">
            <div className="px-4 py-2 text-[10px] font-semibold uppercase text-text-muted border-b border-border bg-base/40">
              Available
            </div>
            <ul className="overflow-y-auto flex-1">
              {loading && (
                <li className="px-4 py-6 text-center text-xs text-text-muted">Loading…</li>
              )}
              {!loading && filtered.length === 0 && (
                <li className="px-4 py-6 text-center text-xs text-text-muted">No matches.</li>
              )}
              {filtered.map((u) => {
                const checked = pickedIds.has(u.id);
                return (
                  <li key={u.id}>
                    <div className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors">
                      <div className="w-8 h-8 rounded-full bg-muted overflow-hidden flex items-center justify-center text-[10px] font-semibold text-text-muted shrink-0">
                        {u.picture ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={u.picture} alt="" className="w-full h-full object-cover" />
                        ) : (
                          initials(u) || "—"
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-text-primary truncate">{nameOf(u)}</div>
                        <div className="text-[11px] text-text-muted capitalize">{u.type ?? ""}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => (checked ? remove(u.id) : add(u))}
                        className={[
                          "text-[11px] px-2 py-1 rounded transition-colors",
                          checked
                            ? "bg-accent/15 text-accent hover:bg-accent/25"
                            : "bg-muted text-text-secondary hover:bg-border",
                        ].join(" ")}
                      >
                        {checked ? "Added" : "+ Add"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Selected */}
          <div className="flex flex-col min-h-0">
            <div className="px-4 py-2 text-[10px] font-semibold uppercase text-text-muted border-b border-border bg-base/40 flex items-center justify-between">
              <span>Selected ({picked.length})</span>
              {picked.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPicked([])}
                  className="text-[10px] text-text-muted hover:text-text-primary normal-case"
                >
                  Clear all
                </button>
              )}
            </div>
            <ul className="overflow-y-auto flex-1">
              {picked.length === 0 && (
                <li className="px-4 py-6 text-center text-xs text-text-muted">
                  Pick people from the left.
                </li>
              )}
              {picked.map((u) => (
                <li key={u.id}>
                  <div className="w-full flex items-center gap-3 px-4 py-2.5">
                    <div className="w-8 h-8 rounded-full bg-muted overflow-hidden flex items-center justify-center text-[10px] font-semibold text-text-muted shrink-0">
                      {u.picture ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={u.picture} alt="" className="w-full h-full object-cover" />
                      ) : (
                        initials(u) || "—"
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-text-primary truncate">{nameOf(u)}</div>
                      <div className="text-[11px] text-text-muted capitalize">{u.type ?? ""}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(u.id)}
                      className="text-[11px] px-2 py-1 rounded text-text-muted hover:text-red-300 hover:bg-red-500/10"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            {isGroup && (
              <div className="px-4 py-3 border-t border-border shrink-0">
                <label className="text-[10px] font-medium uppercase text-text-muted mb-1 block">
                  Group title (optional)
                </label>
                <input
                  value={groupTitle}
                  onChange={(e) => setGroupTitle(e.target.value)}
                  placeholder="e.g. Project Atlas QA"
                  className="input-field text-sm"
                  maxLength={120}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border shrink-0 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="text-xs px-4 py-2 rounded text-text-muted hover:text-text-primary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || picked.length === 0}
            className="btn btn-primary text-xs px-4 py-2 disabled:opacity-50"
          >
            {submitting
              ? editConversation ? "Saving…" : "Creating…"
              : editConversation
              ? "Save changes"
              : isGroup
              ? `Create group (${picked.length + 1})`
              : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
