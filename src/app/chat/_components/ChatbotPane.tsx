"use client";

/**
 * ChatbotPane — column 3 for block 5.
 *
 * Replaces ConversationPane when block="chatbot". The chatbot has no
 * tabs and no threads — just a message stream + composer that writes
 * to private_chatbot_message and triggers an LLM round-trip via
 * sendChatbotMessage().
 */

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import type { ChatbotMessageRow } from "@/types/chat";
import { getChatbotMessages, sendChatbotMessage, createChatbotSession } from "../actions";
import { sanitizeHtml } from "@/lib/sanitize";

interface Props {
  currentUserId: string;
  chatbotId: string | null;
  onSelect: (id: string | null) => void;
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatbotPane({ currentUserId, chatbotId, onSelect }: Props) {
  const [messages, setMessages] = useState<ChatbotMessageRow[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!chatbotId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void getChatbotMessages(chatbotId).then((rows) => {
      if (cancelled) return;
      setMessages(rows);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [chatbotId]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isPending]);

  async function handleSend() {
    const text = input.trim();
    if (!text) return;
    let id = chatbotId;
    if (!id) {
      const c = await createChatbotSession();
      if (c.error || !c.id) {
        toast.error(c.error ?? "Could not create chat");
        return;
      }
      id = c.id;
      onSelect(id);
    }
    setInput("");
    startTransition(async () => {
      const res = await sendChatbotMessage(id!, text);
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

  if (!chatbotId) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center text-sm text-text-muted">
          Select or start a new chat to talk to the bot.
        </div>
      </div>
    );
  }

  void currentUserId;
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-elevated flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-md bg-accent/20 text-accent flex items-center justify-center shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="text-sm font-semibold text-text-primary">ChatBot</h2>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto py-3 px-4 space-y-3">
        {loading && <div className="text-sm text-text-muted">Loading…</div>}
        {!loading && messages.length === 0 && (
          <div className="text-sm text-text-muted">
            Ask me about your projects, tasks, or teammates. I&apos;ll look things up via tools.
          </div>
        )}
        {messages.map((m) => {
          const isUser = m.author_type === "user";
          return (
            <div
              key={m.id}
              className={[
                "max-w-[80%] rounded-lg px-3 py-2 text-sm break-words",
                isUser
                  ? "ml-auto bg-accent/20 text-text-primary"
                  : "bg-muted text-text-primary",
              ].join(" ")}
            >
              <div className="text-[10px] text-text-muted mb-0.5">
                {isUser ? "You" : "Bot"} · {fmtTime(m.created_at)}
              </div>
              {isUser ? (
                <span className="whitespace-pre-wrap">{m.message}</span>
              ) : (
                <div
                  className="[&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_em]:italic [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:ml-1 [&_code]:bg-black/10 [&_code]:rounded [&_code]:px-0.5 [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-semibold"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(m.message) }}
                />
              )}
              {!isUser && Array.isArray(m.tool_calls) && (m.tool_calls as unknown[]).length > 0 && (
                <details className="mt-2 text-[11px] text-text-muted">
                  <summary className="cursor-pointer">{(m.tool_calls as unknown[]).length} tool call(s)</summary>
                  <pre className="mt-1 p-2 bg-base/60 border border-border rounded overflow-x-auto">
                    {JSON.stringify(m.tool_calls, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          );
        })}
        {isPending && (
          <div className="bg-muted text-text-muted text-sm rounded-lg px-3 py-2 italic">Thinking…</div>
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
          placeholder="Ask anything…"
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
