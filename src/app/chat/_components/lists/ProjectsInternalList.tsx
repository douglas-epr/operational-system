"use client";

/** Projects Internal list — column 2 content for block 2.
 *  Visually identical to ProjectsList; the underlying server query is
 *  filtered by the project.internal_conversation_authorized_users array. */

import { useEffect, useRef, useState } from "react";
import type { ProjectListRow } from "@/types/chat";
import { listProjectsInternalConversations } from "../../actions";
import UnreadBadge from "../UnreadBadge";

interface Props {
  filter: string;
  activeId: string | null;
  refreshTick?: number;
  onSelect: (id: string | null) => void;
  onTotalUnread?: (total: number) => void;
}

export default function ProjectsInternalList({
  filter,
  activeId,
  refreshTick,
  onSelect,
  onTotalUnread,
}: Props) {
  const [rows, setRows] = useState<ProjectListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    let cancelled = false;
    if (!hasFetched.current) setLoading(true);
    void listProjectsInternalConversations().then((data) => {
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
  }, [refreshTick, onTotalUnread]);

  const q = filter.trim().toLowerCase();
  const filtered = q ? rows.filter((r) => (r.name ?? "").toLowerCase().includes(q)) : rows;

  if (loading) return <div className="px-4 py-3 text-xs text-text-muted">Loading…</div>;
  if (filtered.length === 0)
    return <div className="px-4 py-3 text-xs text-text-muted">No internal channels.</div>;

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
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V8a4 4 0 118 0v3" />
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
