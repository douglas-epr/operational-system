"use client";

/** Internal Projects list — column 2 content for block 3.
 *  Staff-only by RLS; the action returns [] for non-staff users. */

import { useCallback, useEffect, useRef, useState } from "react";
import type { InternalProjectListRow } from "@/types/chat";
import { createClient } from "@/lib/supabase/client";
import { listInternalProjectConversations } from "../../actions";
import UnreadBadge from "../UnreadBadge";

interface Props {
  filter: string;
  activeId: string | null;
  refreshTick?: number;
  onSelect: (id: string | null) => void;
  onTotalUnread?: (total: number) => void;
}

export default function InternalProjectsList({
  filter,
  activeId,
  refreshTick,
  onSelect,
  onTotalUnread,
}: Props) {
  const [rows, setRows] = useState<InternalProjectListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  const refresh = useCallback((isInitial = false) => {
    if (isInitial && !hasFetched.current) setLoading(true);
    void listInternalProjectConversations().then((data) => {
      hasFetched.current = true;
      setRows(data);
      setLoading(false);
      if (onTotalUnread) onTotalUnread(data.reduce((s, r) => s + (r.unread_count ?? 0), 0));
    });
  }, [onTotalUnread]);

  useEffect(() => {
    refresh(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTick]);

  // Re-sort and update unread counts whenever a new message lands in any internal project.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("internal-projects-list-realtime")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "conversation_internal_project_message",
      }, () => { refresh(); })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [refresh]);

  const q = filter.trim().toLowerCase();
  const filtered = q ? rows.filter((r) => (r.name ?? "").toLowerCase().includes(q)) : rows;

  if (loading) return <div className="px-4 py-3 text-xs text-text-muted">Loading…</div>;
  if (filtered.length === 0)
    return <div className="px-4 py-3 text-xs text-text-muted">No internal projects.</div>;

  return (
    <ul>
      {filtered.map((p) => {
        const isActive = activeId === p.id;
        return (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onSelect(p.id)}
              className={[
                "w-full flex items-center gap-2 px-2 h-7 rounded-md text-left text-[13px] transition-colors",
                isActive
                  ? "bg-accent text-white font-medium"
                  : "text-text-secondary hover:bg-muted/50 hover:text-text-primary",
              ].join(" ")}
            >
              <svg
                className={[
                  "w-3.5 h-3.5 shrink-0",
                  isActive ? "text-white" : "text-text-muted",
                ].join(" ")}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-16 0H3" />
              </svg>
              <span className="truncate flex-1 leading-none">{p.name ?? "Unnamed"}</span>
              <UnreadBadge count={p.unread_count ?? 0} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
