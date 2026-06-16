"use client";

/** Projects (external) list — column 2 content for block 1. */

import { useCallback, useEffect, useRef, useState } from "react";
import type { ProjectListRow } from "@/types/chat";
import { createClient } from "@/lib/supabase/client";
import { listProjectConversations } from "../../actions";
import UnreadBadge from "../UnreadBadge";

interface Props {
  filter: string;
  activeId: string | null;
  refreshTick?: number;
  onSelect: (id: string | null) => void;
  /** Called whenever the loaded rows change so the sidebar can show a
   *  block-level unread total. */
  onTotalUnread?: (total: number) => void;
}

export default function ProjectsList({
  filter,
  activeId,
  refreshTick,
  onSelect,
  onTotalUnread,
}: Props) {
  const [rows, setRows] = useState<ProjectListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  const refresh = useCallback((isInitial = false) => {
    if (isInitial && !hasFetched.current) setLoading(true);
    void listProjectConversations().then((data) => {
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

  // Re-sort and update unread counts whenever a new message lands in any project.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("projects-list-realtime")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "conversation_project_external_message",
      }, () => { refresh(); })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [refresh]);

  const q = filter.trim().toLowerCase();
  const filtered = q ? rows.filter((r) => (r.name ?? "").toLowerCase().includes(q)) : rows;

  if (loading) return <div className="px-4 py-3 text-xs text-text-muted">Loading…</div>;
  if (filtered.length === 0)
    return <div className="px-4 py-3 text-xs text-text-muted">No projects.</div>;

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
              <div
                className={[
                  "w-5 h-5 rounded overflow-hidden flex items-center justify-center text-[9px] font-semibold shrink-0",
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-muted text-text-muted",
                ].join(" ")}
              >
                {p.picture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.picture} alt="" className="w-full h-full object-cover" />
                ) : (
                  p.name?.[0]?.toUpperCase() ?? "P"
                )}
              </div>
              <span className="truncate flex-1 leading-none">{p.name ?? "Unnamed"}</span>
              <UnreadBadge count={p.unread_count ?? 0} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
