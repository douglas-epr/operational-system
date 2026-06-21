/**
 * IdeaChatbot
 * ------------------------------------------------------------------
 * Floating chat widget mounted on every Sandbox Planner step (except the
 * Ideas list). A round bubble bottom-right toggles a panel that lets the
 * user ask questions about the currently-selected idea. The server action
 * `sendChatMessage` rebuilds the full idea context on every send so the
 * bot always answers from fresh data.
 */
"use client";

import { sanitizeHtml } from "@/lib/sanitize";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { IdeaBlock, IdeaChatbotMessage } from "@/types/idea-refiner";
import { loadChatHistory, sendChatMessage } from "../actions";

interface IdeaChatbotProps {
  ideaId: string;
  currentTab: IdeaBlock;
}

export default function IdeaChatbot({ ideaId, currentTab }: IdeaChatbotProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<IdeaChatbotMessage[]>([]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [loadedForIdea, setLoadedForIdea] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // ── Load history whenever the idea changes ──────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoadedForIdea(null);
    setMessages([]);
    void loadChatHistory(ideaId).then((res) => {
      if (cancelled) return;
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setMessages(res.messages ?? []);
      setLoadedForIdea(ideaId);
    });
    return () => {
      cancelled = true;
    };
  }, [ideaId]);

  // ── Realtime: pick up messages from other sessions (e.g. collaborator) ─
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`idea-chatbot-${ideaId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "idea_chatbot",
          filter: `idea_id=eq.${ideaId}`,
        },
        (payload) => {
          const row = payload.new as unknown as IdeaChatbotMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [...prev, row];
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [ideaId]);

  // ── Auto-scroll to bottom on new messages / open ────────────────────────
  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, isPending, open]);

  // ── Escape key closes, focus textarea on open ───────────────────────────
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    textareaRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const handleSend = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const text = input.trim();
      if (!text || isPending) return;
      setInput("");
      startTransition(async () => {
        const res = await sendChatMessage(ideaId, text, currentTab);
        if (res.error) {
          toast.error(res.error);
        }
        setMessages((prev) => {
          const next = [...prev];
          const have = new Set(next.map((m) => m.id));
          if (res.userMsg && !have.has(res.userMsg.id)) next.push(res.userMsg);
          if (res.botMsg && !have.has(res.botMsg.id)) next.push(res.botMsg);
          return next;
        });
      });
    },
    [input, isPending, ideaId, currentTab],
  );

  return (
    <>
      {/* Floating bubble */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close idea chatbot" : "Open idea chatbot"}
        className={cn(
          "fixed bottom-4 right-4 z-40 w-14 h-14 rounded-full flex items-center justify-center",
          "bg-accent text-white shadow-xl hover:bg-accent/90 transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
        )}
      >
        {open ? <IconClose /> : <IconChat />}
      </button>

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Idea chatbot"
          className={cn(
            "fixed bottom-20 right-4 z-40 flex flex-col overflow-hidden",
            "w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-6rem)]",
            "rounded-xl border border-border bg-surface shadow-2xl",
          )}
        >
          {/* Header */}
          <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Idea Chatbot</h2>
              <p className="text-xs text-text-muted">Grounded in this idea&apos;s data</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="p-1 rounded hover:bg-elevated text-text-muted hover:text-text-primary"
            >
              <IconClose />
            </button>
          </header>

          {/* Messages */}
          <div
            ref={listRef}
            className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-base"
          >
            {loadedForIdea !== ideaId && (
              <p className="text-xs text-text-muted italic">Loading history...</p>
            )}
            {loadedForIdea === ideaId && messages.length === 0 && !isPending && (
              <p className="text-xs text-text-muted italic">
                Ask anything about this idea — ICPs, PRD, milestones, report score, etc.
              </p>
            )}
            {messages.map((m) => (
              <MessageBubble key={m.id} m={m} />
            ))}
            {isPending && <TypingDots />}
          </div>

          {/* Composer */}
          <form
            onSubmit={handleSend}
            className="shrink-0 border-t border-border bg-surface p-3 space-y-2"
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  (e.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
                }
              }}
              rows={2}
              placeholder="Ask about this idea..."
              disabled={isPending}
              className={cn(
                "w-full resize-none rounded-lg border border-border bg-base px-3 py-2 text-sm",
                "text-text-primary placeholder:text-text-muted",
                "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
                "disabled:opacity-60",
              )}
            />
            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={!input.trim() || isPending}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                  "bg-accent text-white hover:bg-accent/90 transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
              >
                {isPending ? "Sending..." : "Send"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function MessageBubble({ m }: { m: IdeaChatbotMessage }) {
  const isUser = m.type === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
          isUser
            ? "bg-accent text-white rounded-br-sm"
            : "bg-elevated text-text-primary rounded-bl-sm",
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{m.message}</p>
        ) : (
          <div
            className="prose prose-sm prose-invert max-w-none break-words"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(m.message) }}
          />
        )}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex justify-start">
      <div className="bg-elevated text-text-muted rounded-2xl rounded-bl-sm px-3 py-2 text-sm">
        <span className="inline-flex items-center gap-1">
          <Dot delay="0ms" />
          <Dot delay="150ms" />
          <Dot delay="300ms" />
        </span>
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full bg-text-muted animate-pulse"
      style={{ animationDelay: delay }}
    />
  );
}

function IconChat() {
  // Clean rounded speech-bubble with three dots — no tail/chevron.
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 6a2 2 0 012-2h12a2 2 0 012 2v9a2 2 0 01-2 2h-6l-4 4v-4H6a2 2 0 01-2-2V6z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 10.5h.01M12 10.5h.01M16 10.5h.01"
      />
    </svg>
  );
}

function IconClose() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
