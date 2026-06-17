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
 *
 * Emoji reactions: loaded once after messages are fetched and refreshed
 * optimistically on each toggle. The reactions map is keyed by message id.
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { ChatBlock, ChatMessage, ChatTab, EmojiReaction } from "@/types/chat";
import { getMessages, getReactions, toggleEmoji } from "../actions";
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
  const [messages, setMessages]     = useState<ChatMessage[]>([]);
  const [reactionsMap, setReactionsMap] = useState<Record<string, EmojiReaction[]>>({});
  const [loading, setLoading]       = useState(true);
  const containerRef                = useRef<HTMLDivElement | null>(null);
  const lastTabRef                  = useRef(tab);

  // Initial load (and reload when filters/conversation change)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const safeTab =
      tab === "messages" ||
      tab === "files" ||
      tab === "links" ||
      tab === "videos" ||
      tab === "daily_feedback"
        ? tab
        : "messages";
    void getMessages(block, conversationId, { tab: safeTab }).then(async (rows) => {
      if (cancelled) return;
      setMessages(rows);
      setLoading(false);
      // Load reactions for all fetched messages.
      if (rows.length > 0) {
        const r = await getReactions(block, rows.map((m) => m.id), false);
        if (!cancelled) setReactionsMap(r);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [block, conversationId, tab, refreshKey]);

  // Auto-scroll on new messages (only on Messages / Daily Feedback tab).
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

  useImperativeHandle(
    ref,
    () => ({ insertLocal: handleInsert }),
    [handleInsert]
  );

  // Refresh reactions for a single message (or all visible messages when null).
  // null arrives on DELETE events before REPLICA IDENTITY FULL is active.
  const refreshReactionsForMessage = useCallback(async (messageId: string | null) => {
    const ids = messageId
      ? [messageId]
      : messages.map((m) => m.id);
    if (ids.length === 0) return;
    const updated = await getReactions(block, ids, false);
    setReactionsMap((prev) => ({ ...prev, ...updated }));
  }, [block, messages]);

  const handleMessageDelete = useCallback((id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  // Toggle an emoji on a top-level message and refresh its reactions.
  const handleToggleEmoji = useCallback(async (messageId: string, emojiCode: string) => {
    const res = await toggleEmoji(block, messageId, emojiCode, false);
    if (res.error) return;
    await refreshReactionsForMessage(messageId);
  }, [block, refreshReactionsForMessage]);

  useRealtimeMessages({
    block,
    conversationId,
    onMessageInsert: handleInsert,
    onThreadInsert: handleThreadInsert,
    onEmojiChange: refreshReactionsForMessage,
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

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto py-2">
      {messages.map((m) => (
        <MessageItem
          key={m.id}
          block={block}
          message={m}
          isOwn={m.created_by === currentUserId}
          onOpenThread={() => onOpenThread(m.id)}
          reactions={reactionsMap[m.id]}
          onToggleEmoji={(code) => handleToggleEmoji(m.id, code)}
          onMessageDelete={handleMessageDelete}
        />
      ))}
    </div>
  );
});

export default MessageList;
