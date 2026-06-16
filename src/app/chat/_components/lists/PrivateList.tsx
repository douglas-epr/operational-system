"use client";

/** Private 1:1 / group conversation list.
 *  Creator and admins get inline edit + delete icons on each row. */

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { PrivateConversationRow } from "@/types/chat";
import { deletePrivateConversation, listPrivateConversations } from "../../actions";
import UserPickerModal from "../modals/UserPickerModal";
import UnreadBadge from "../UnreadBadge";

interface Props {
  filter: string;
  activeId: string | null;
  refreshTick?: number;
  onSelect: (id: string | null) => void;
  currentUserId: string;
  userType: string;
  onTotalUnread?: (total: number) => void;
}

export default function PrivateList({
  filter,
  activeId,
  refreshTick,
  onSelect,
  currentUserId,
  userType,
  onTotalUnread,
}: Props) {
  const [rows, setRows] = useState<PrivateConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<PrivateConversationRow | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const hasFetched = useRef(false);

  const reload = () => {
    let cancelled = false;
    if (!hasFetched.current) setLoading(true);
    void listPrivateConversations().then((data) => {
      if (cancelled) return;
      hasFetched.current = true;
      setRows(data);
      setLoading(false);
      if (onTotalUnread)
        onTotalUnread(data.reduce((s, r) => s + (r.unread_count ?? 0), 0));
    });
    return () => { cancelled = true; };
  };

  useEffect(() => {
    return reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTick]);

  async function handleDelete(id: string) {
    setDeleting(true);
    const res = await deletePrivateConversation(id);
    setDeleting(false);
    if (res.error) { toast.error(res.error); return; }
    setConfirmDeleteId(null);
    if (activeId === id) onSelect(null);
    reload();
  }

  const q = filter.trim().toLowerCase();
  const filtered = q
    ? rows.filter((r) => {
        const peerName = `${r.peer?.first_name ?? ""} ${r.peer?.last_name ?? ""}`.toLowerCase();
        const groupName = (r.group_label ?? r.title ?? "").toLowerCase();
        return peerName.includes(q) || groupName.includes(q);
      })
    : rows;

  return (
    <>
      {loading && <div className="px-3 py-2 text-[11px] text-text-muted">Loading…</div>}
      {!loading && filtered.length === 0 && (
        <div className="px-3 py-2 text-[11px] text-text-muted">No conversations yet.</div>
      )}
      <ul>
        {filtered.map((c) => {
          const isGroup = (c.participant_user_ids?.length ?? 0) > 2;
          const peer = c.peer;
          const name = isGroup
            ? c.title?.trim() || c.group_label || "Group"
            : peer
              ? `${peer.first_name ?? ""} ${peer.last_name ?? ""}`.trim() || "Unknown"
              : "Unknown";
          const initials = isGroup
            ? "👥"
            : name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
          const isActive = activeId === c.id;
          const canManage = c.created_by === currentUserId || userType === "admin";

          return (
            <li key={c.id} className="group relative">
              <button
                type="button"
                onClick={() => onSelect(c.id)}
                className={[
                  "w-full flex items-center gap-2 px-2 h-7 rounded-md text-left text-[13px] transition-colors",
                  canManage ? "pr-14" : "pr-2",
                  isActive
                    ? "bg-accent text-white font-medium"
                    : "text-text-secondary hover:bg-muted/50 hover:text-text-primary",
                ].join(" ")}
              >
                <div
                  className={[
                    "w-5 h-5 rounded overflow-hidden shrink-0 flex items-center justify-center text-[9px] font-semibold",
                    isActive ? "bg-white/20 text-white" : "bg-muted text-text-muted",
                  ].join(" ")}
                >
                  {peer?.picture && !isGroup ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={peer.picture} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className={isGroup ? "text-[11px]" : ""}>{initials}</span>
                  )}
                </div>
                <span className="truncate flex-1 leading-none">{name}</span>
                <UnreadBadge count={c.unread_count ?? 0} />
              </button>

              {canManage && (
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Edit */}
                  <button
                    type="button"
                    title="Edit conversation"
                    onClick={() => setEditTarget(c)}
                    className={[
                      "p-0.5 rounded transition-colors",
                      isActive ? "text-white/70 hover:text-white" : "text-text-muted hover:text-text-primary",
                    ].join(" ")}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  {/* Delete */}
                  <button
                    type="button"
                    title="Delete conversation"
                    onClick={() => setConfirmDeleteId(c.id)}
                    className={[
                      "p-0.5 rounded transition-colors",
                      isActive ? "text-white/70 hover:text-white" : "text-text-muted hover:text-danger",
                    ].join(" ")}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                    </svg>
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Edit modal — reuses UserPickerModal in edit mode */}
      {editTarget && (
        <UserPickerModal
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          onCreated={() => {}}
          editConversation={{
            id: editTarget.id,
            participantIds: (editTarget.participant_user_ids ?? []).filter(
              (id) => id !== currentUserId
            ),
            title: editTarget.title ?? null,
          }}
          onUpdated={() => { setEditTarget(null); reload(); }}
        />
      )}

      {/* Delete confirmation dialog */}
      {confirmDeleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-elevated border border-border rounded-lg shadow-2xl p-5 flex flex-col gap-4"
          >
            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-1">Delete conversation?</h3>
              <p className="text-[12px] text-text-muted">
                This will permanently delete the conversation and all its messages for everyone.
                This cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="text-xs px-4 py-2 rounded text-text-muted hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deleting}
                className="text-xs px-4 py-2 rounded bg-danger text-white hover:bg-danger/80 disabled:opacity-50 transition-colors"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
