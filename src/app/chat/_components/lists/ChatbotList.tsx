"use client";

/** ChatBot session list — column 2 content for block 5. */

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { ChatbotConversationRow } from "@/types/chat";
import {
  createChatbotSession,
  deleteChatbotSession,
  listChatbotSessions,
} from "../../actions";

interface Props {
  filter: string;
  activeId: string | null;
  onSelect: (id: string | null) => void;
}

export default function ChatbotList({ filter, activeId, onSelect }: Props) {
  const [rows, setRows] = useState<ChatbotConversationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = () => {
    let cancelled = false;
    setLoading(true);
    void listChatbotSessions().then((data) => {
      if (cancelled) return;
      setRows(data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  };

  useEffect(() => {
    return reload();
  }, []);

  async function handleNew() {
    const res = await createChatbotSession();
    if (res.error) {
      toast.error(res.error);
      return;
    }
    if (res.id) {
      onSelect(res.id);
      reload();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this chat?")) return;
    const res = await deleteChatbotSession(id);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    if (activeId === id) onSelect(null);
    reload();
  }

  const q = filter.trim().toLowerCase();
  const filtered = q ? rows.filter((r) => r.title.toLowerCase().includes(q)) : rows;

  return (
    <>
      <div className="px-1 pt-1 pb-0.5">
        <button
          type="button"
          onClick={handleNew}
          className="w-full flex items-center gap-2 px-2 h-7 rounded-md text-[12.5px] font-medium text-text-secondary hover:text-text-primary hover:bg-muted/50 transition-colors"
        >
          <svg className="w-3.5 h-3.5 shrink-0 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span className="truncate leading-none">New chat</span>
        </button>
      </div>
      {loading && <div className="px-3 py-2 text-[11px] text-text-muted">Loading…</div>}
      {!loading && filtered.length === 0 && (
        <div className="px-3 py-2 text-[11px] text-text-muted">No chats yet.</div>
      )}
      <ul>
        {filtered.map((c) => {
          const isActive = activeId === c.id;
          return (
            <li key={c.id} className="group relative">
              <button
                type="button"
                onClick={() => onSelect(c.id)}
                className={[
                  "w-full flex items-center gap-2 pl-2 pr-7 h-7 rounded-md text-left text-[13px] transition-colors",
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
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="truncate flex-1 leading-none">{c.title}</span>
              </button>
              <button
                type="button"
                onClick={() => handleDelete(c.id)}
                title="Delete chat"
                className={[
                  "absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded",
                  isActive ? "text-white/80 hover:text-white" : "text-text-muted hover:text-danger",
                ].join(" ")}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                </svg>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
