"use client";

/**
 * ConversationMembersModal
 * ------------------------------------------------------------------
 * Admin/manager-only modal for editing the
 * project.{external,internal}_conversation_authorized_users array.
 *
 * Two halves:
 *   - Top: list of current members with a "Remove" action per row.
 *   - Bottom: typeahead (reuses searchUsersForPrivate) to add a new user.
 *
 * Server-side, the addConversationMember / removeConversationMember
 * actions both gate on userType IN ('admin','manager').
 */

import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  addConversationMember,
  getConversationMembers,
  removeConversationMember,
  searchUsersForPrivate,
  type ConversationMember,
} from "../../actions";

interface Props {
  projectId: string;
  channel: "external" | "internal";
  onClose: () => void;
}

interface Hit {
  id: string;
  first_name: string | null;
  last_name: string | null;
  picture: string | null;
  type: string | null;
}

const CHANNEL_LABEL: Record<Props["channel"], string> = {
  external: "External conversation",
  internal: "Internal conversation",
};

export default function ConversationMembersModal({ projectId, channel, onClose }: Props) {
  const [members, setMembers] = useState<ConversationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [isPending, startTransition] = useTransition();

  const reload = useCallback(async () => {
    setLoading(true);
    const rows = await getConversationMembers(projectId, channel);
    setMembers(rows);
    setLoading(false);
  }, [projectId, channel]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const t = setTimeout(() => {
      startTransition(async () => {
        const data = await searchUsersForPrivate(query);
        setHits(data);
      });
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  const memberIds = new Set(members.map((m) => m.id));

  async function handleAdd(userId: string) {
    const res = await addConversationMember(projectId, channel, userId);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Member added");
    await reload();
  }

  async function handleRemove(userId: string) {
    if (!confirm("Remove this user from the conversation?")) return;
    const res = await removeConversationMember(projectId, channel, userId);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Member removed");
    await reload();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-elevated border border-border rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Conversation members</h3>
            <p className="text-[11px] text-text-muted">{CHANNEL_LABEL[channel]}</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Members list */}
        <div className="border-b border-border">
          <div className="px-4 py-2 text-[11px] uppercase tracking-wider text-text-muted">
            Current ({members.length})
          </div>
          <ul className="max-h-48 overflow-y-auto">
            {loading && (
              <li className="px-4 py-3 text-xs text-text-muted">Loading…</li>
            )}
            {!loading && members.length === 0 && (
              <li className="px-4 py-3 text-xs text-text-muted">No members yet.</li>
            )}
            {members.map((m) => {
              const name = `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim() || "Unnamed";
              return (
                <li
                  key={m.id}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-muted/40"
                >
                  <div className="w-7 h-7 rounded-full bg-muted overflow-hidden flex items-center justify-center text-[10px] font-semibold text-text-muted shrink-0">
                    {m.picture ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.picture} alt="" className="w-full h-full object-cover" />
                    ) : (
                      name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-text-primary truncate">{name}</div>
                    <div className="text-[11px] text-text-muted capitalize">{m.type ?? ""}</div>
                  </div>
                  <button
                    onClick={() => handleRemove(m.id)}
                    className="text-[11px] text-text-muted hover:text-red-400 px-2 py-1"
                  >
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Add new */}
        <div className="px-4 py-2 text-[11px] uppercase tracking-wider text-text-muted">
          Add member
        </div>
        <div className="px-3 pb-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people…"
            className="input-field text-sm"
          />
        </div>
        <ul className="flex-1 overflow-y-auto">
          {isPending && hits.length === 0 && (
            <li className="px-4 py-3 text-center text-xs text-text-muted">Searching…</li>
          )}
          {!isPending && hits.length === 0 && (
            <li className="px-4 py-3 text-center text-xs text-text-muted">No matches.</li>
          )}
          {hits
            .filter((u) => !memberIds.has(u.id))
            .map((u) => {
              const name = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || "Unnamed";
              return (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => handleAdd(u.id)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-muted overflow-hidden flex items-center justify-center text-[10px] font-semibold text-text-muted shrink-0">
                      {u.picture ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={u.picture} alt="" className="w-full h-full object-cover" />
                      ) : (
                        name
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-text-primary truncate">{name}</div>
                      <div className="text-[11px] text-text-muted capitalize">{u.type ?? ""}</div>
                    </div>
                    <span className="text-[11px] text-accent">+ Add</span>
                  </button>
                </li>
              );
            })}
        </ul>
      </div>
    </div>
  );
}
