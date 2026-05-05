"use client";

/** Private 1:1 conversation list — column 2 content for block 4.
 *  Includes a "+ New conversation" button that opens UserPickerModal. */

import { useEffect, useRef, useState } from "react";
import type { PrivateConversationRow } from "@/types/chat";
import { listPrivateConversations } from "../../actions";
import UserPickerModal from "../modals/UserPickerModal";
import UnreadBadge from "../UnreadBadge";

interface Props {
  filter: string;
  activeId: string | null;
  refreshTick?: number;
  onSelect: (id: string | null) => void;
  currentUserId: string;
  onTotalUnread?: (total: number) => void;
}

export default function PrivateList({
  filter,
  activeId,
  refreshTick,
  onSelect,
  currentUserId,
  onTotalUnread,
}: Props) {
  const [rows, setRows] = useState<PrivateConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
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
    return () => {
      cancelled = true;
    };
  };

  useEffect(() => {
    return reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTick]);

  const q = filter.trim().toLowerCase();
  const filtered = q
    ? rows.filter((r) => {
        const peerName = `${r.peer?.first_name ?? ""} ${r.peer?.last_name ?? ""}`.toLowerCase();
        const groupName = (r.group_label ?? r.title ?? "").toLowerCase();
        return peerName.includes(q) || groupName.includes(q);
      })
    : rows;

  void currentUserId;
  return (
    <>
      <div className="px-1 pt-1 pb-0.5">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="w-full flex items-center gap-2 px-2 h-7 rounded-md text-[12.5px] font-medium text-text-secondary hover:text-text-primary hover:bg-muted/50 transition-colors"
        >
          <svg className="w-3.5 h-3.5 shrink-0 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span className="truncate leading-none">New conversation</span>
        </button>
      </div>
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
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onSelect(c.id)}
                className={[
                  "w-full flex items-center gap-2 px-2 h-7 rounded-md text-left text-[13px] transition-colors",
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
            </li>
          );
        })}
      </ul>
      <UserPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onCreated={(id) => {
          setPickerOpen(false);
          reload();
          onSelect(id);
        }}
      />
    </>
  );
}
