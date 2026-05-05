"use client";

/**
 * MessageList — auto-scrolling list of MessageItem rows for the active
 * conversation. Subscribes to realtime INSERTs via useRealtimeMessages
 * and bumps thread counts on thread inserts.
 *
 * Optimistic insert: parents pass a `messageListRef` and call
 * `messageListRef.current.insertLocal(row)` after a successful
 * server-action insert. The list de-dupes by id, so the realtime
 * INSERT (if it arrives) is a no-op.
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { ChatBlock, ChatMessage, ChatTab } from "@/types/chat";
import { getMessages } from "../actions";
import MessageItem from "./MessageItem";
import { useRealtimeMessages } from "./useRealtimeMessages";

interface Props {
  block: Exclude<ChatBlock, "chatbot">;
  conversationId: string;
  currentUserId: string;
  tab: ChatTab;
  /** Forces a refetch (e.g. after a thread was opened+marked viewed so
   *  the parent's thread_unread_count drops). */
  refreshKey?: number;
  onOpenThread: (id: string) => void;
}

export interface MessageListHandle {
  /** Push a freshly-inserted row into local state (optimistic UI). */
  insertLocal: (row: ChatMessage) => void;
}

const MessageList = forwardRef<MessageListHandle, Props>(function MessageList(
  { block, conversationId, currentUserId, tab, refreshKey, onOpenThread },
  ref
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastTabRef = useRef(tab);

  // Initial load (and reload when filters/conversation change)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    // getMessages only handles the doc tabs + messages; the new
    // client_requests / qa_requests / chatbot tabs don't render MessageList.
    const safeTab =
      tab === "messages" ||
      tab === "files" ||
      tab === "links" ||
      tab === "videos" ||
      tab === "daily_feedback"
        ? tab
        : "messages";
    void getMessages(block, conversationId, { tab: safeTab }).then((rows) => {
      if (cancelled) return;
      setMessages(rows);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [block, conversationId, tab, refreshKey]);

  // Auto-scroll on new messages (only on Messages / Daily Feedback tab —
  // Files/Links/Videos are filter views, scroll-on-update is annoying).
  useEffect(() => {
    if (lastTabRef.current !== tab) {
      lastTabRef.current = tab;
      return;
    }
    if (tab === "messages" || tab === "daily_feedback") {
      const el = containerRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [messages, tab]);

  // Realtime: react to inserts on this conversation
  const handleInsert = useCallback((row: ChatMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === row.id)) return prev;
      // Honor the active tab filter — drop rows that wouldn't render here.
      // The legacy `daily_feedback` tab was retired in Part 2 B8 (the
      // is_daily_feedback column was dropped); getMessages returns [] for
      // it, so realtime inserts on that tab are simply dropped here too.
      if (lastTabRef.current === "daily_feedback") return prev;
      if (lastTabRef.current === "links" && (row.links?.length ?? 0) === 0) return prev;
      if (lastTabRef.current === "files") {
        const hasFile = (row.attachments ?? []).some(
          (a) => !a.type.startsWith("image/") && !a.type.startsWith("video/")
        );
        if (!hasFile) return prev;
      }
      if (lastTabRef.current === "videos") {
        const hasVid = (row.attachments ?? []).some((a) => a.type.startsWith("video/"));
        if (!hasVid) return prev;
      }
      return [...prev, row];
    });
  }, []);
  const handleThreadInsert = useCallback((row: { parent_id: string }) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === row.parent_id ? { ...m, thread_count: (m.thread_count ?? 0) + 1 } : m))
    );
  }, []);

  // Expose the same insert path to the composer for optimistic UI.
  useImperativeHandle(
    ref,
    () => ({
      insertLocal: handleInsert,
    }),
    [handleInsert]
  );

  useRealtimeMessages({
    block,
    conversationId,
    onMessageInsert: handleInsert,
    onThreadInsert: handleThreadInsert,
  });

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-sm text-text-muted">Loading…</div>;
  }
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-text-muted">
        No messages{tab === "messages" ? " yet" : " in this view"}.
      </div>
    );
  }

  // Sender-grouping: a message is a "follow-up" of the previous one when
  // both are by the same author and posted within 5 minutes. Follow-ups
  // render compactly (no avatar / name / timestamp). Slack-style.
  const FIVE_MIN = 5 * 60 * 1000;

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto py-2">
      {messages.map((m, idx) => {
        const prev = idx > 0 ? messages[idx - 1] : null;
        const sameAuthor =
          !!prev && prev.created_by === m.created_by;
        const closeInTime =
          !!prev &&
          new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() <
            FIVE_MIN;
        const grouped = sameAuthor && closeInTime;
        return (
          <MessageItem
            key={m.id}
            block={block}
            message={m}
            isOwn={m.created_by === currentUserId}
            grouped={grouped}
            onOpenThread={() => onOpenThread(m.id)}
          />
        );
      })}
    </div>
  );
});

export default MessageList;
