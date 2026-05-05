"use client";

/**
 * Project Chatbot tab — per-project shared LLM conversation, used inside
 * the Projects + Projects Internal chat blocks.
 *
 * UI mirrors ChatbotPane (private chatbot) but writes to
 * `project_chatbot_message` (block "projects") or
 * `project_internal_chatbot_message` (block "projects_internal").
 *
 * Realtime: subscribes to inserts on the appropriate table filtered by
 * project_id, so other members see messages live.
 */

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { ChatBlock } from "@/types/chat";
import {
  getProjectChatbotMessages,
  sendProjectChatbotMessage,
} from "../../actions";
import type { ProjectChatbotMessageRow } from "../../_chatbot/runProjectBot";

interface Props {
  projectId: string;
  block: Exclude<ChatBlock, "chatbot">;
  currentUserId: string;
}

const TABLE_BY_BLOCK: Record<"projects" | "projects_internal", string> = {
  projects: "project_chatbot_message",
  projects_internal: "project_internal_chatbot_message",
};

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export default function ProjectChatbotTab({ projectId, block, currentUserId }: Props) {
  const [messages, setMessages] = useState<ProjectChatbotMessageRow[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const listRef = useRef<HTMLDivElement | null>(null);

  // Initial load.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void getProjectChatbotMessages(block, projectId).then((rows) => {
      if (cancelled) return;
      setMessages(rows);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [block, projectId]);

  // Realtime subscription so concurrent members see the same conversation.
  useEffect(() => {
    if (block !== "projects" && block !== "projects_internal") return;
    const table = TABLE_BY_BLOCK[block];
    const supabase = createClient();
    const channel = supabase
      .channel(`projbot:${block}:${projectId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table, filter: `project_id=eq.${projectId}` },
        (payload) => {
          const row = payload.new as ProjectChatbotMessageRow;
          setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [block, projectId]);

  // Auto-scroll on new messages / pending.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isPending]);

  function handleSend() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    startTransition(async () => {
      const res = await sendProjectChatbotMessage(block, projectId, text);
      if (res.error && !res.botMsg) {
        toast.error(res.error);
        return;
      }
      setMessages((prev) => {
        const have = new Set(prev.map((m) => m.id));
        const next = [...prev];
        if (res.userMsg && !have.has(res.userMsg.id)) next.push(res.userMsg);
        if (res.botMsg && !have.has(res.botMsg.id)) next.push(res.botMsg);
        return next;
      });
    });
  }

  // Project-block guard so the runtime never tries to write to a private bot.
  if (block !== "projects" && block !== "projects_internal") {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-text-muted">
        Chatbot is only available on Projects / Projects Internal.
      </div>
    );
  }

  void currentUserId;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div ref={listRef} className="flex-1 overflow-y-auto py-3 px-4 space-y-3">
        {loading && <div className="text-sm text-text-muted">Loading…</div>}
        {!loading && messages.length === 0 && (
          <div className="text-sm text-text-muted">
            Ask me about this project. I can also create Client Requests / QA Requests tasks for you.
          </div>
        )}
        {messages.map((m) => {
          const isUser = m.author_type === "user";
          return (
            <div
              key={m.id}
              className={[
                "max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words",
                isUser
                  ? "ml-auto bg-accent/20 text-text-primary"
                  : "bg-muted text-text-primary",
              ].join(" ")}
            >
              <div className="text-[10px] text-text-muted mb-0.5">
                {isUser ? "User" : "Bot"} · {fmtTime(m.created_at)}
              </div>
              {m.message}
              {!isUser && Array.isArray(m.tool_calls) && (m.tool_calls as unknown[]).length > 0 && (
                <details className="mt-2 text-[11px] text-text-muted">
                  <summary className="cursor-pointer">
                    {(m.tool_calls as unknown[]).length} tool call(s)
                  </summary>
                  <pre className="mt-1 p-2 bg-base/60 border border-border rounded overflow-x-auto">
                    {JSON.stringify(m.tool_calls, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          );
        })}
        {isPending && (
          <div className="bg-muted text-text-muted text-sm rounded-lg px-3 py-2 italic">
            Thinking…
          </div>
        )}
      </div>

      <div className="border-t border-border bg-elevated px-4 py-3 shrink-0 flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
          placeholder="Ask anything about this project…"
          rows={2}
          className="input-field text-sm flex-1 resize-none"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={isPending || !input.trim()}
          className="btn btn-primary text-sm px-3 py-2 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
