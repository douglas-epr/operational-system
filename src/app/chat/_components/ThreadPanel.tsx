"use client";

/**
 * ThreadPanel — right-side drawer that shows a single message and its
 * thread replies. Activated by ?thread=<message-id>.
 */

import { useEffect, useState } from "react";
import type { ChatBlock, ChatMessage, ChatThreadMessage } from "@/types/chat";
import { getMessages, getThreadMessages, markThreadViewed } from "../actions";
import MessageItem from "./MessageItem";
import MessageComposer from "./MessageComposer";

interface Props {
  block: Exclude<ChatBlock, "chatbot">;
  conversationId: string;
  threadId: string;
  currentUserId: string;
  onClose: () => void;
}

export default function ThreadPanel({ block, conversationId, threadId, currentUserId, onClose }: Props) {
  const [parent, setParent] = useState<ChatMessage | null>(null);
  const [replies, setReplies] = useState<ChatThreadMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void Promise.all([
      getMessages(block, conversationId, {}),
      getThreadMessages(block, threadId),
    ]).then(([all, thrds]) => {
      if (cancelled) return;
      setParent(all.find((m) => m.id === threadId) ?? null);
      setReplies(thrds);
      setLoading(false);
    });
    // Mark every reply on this thread as viewed for the caller, so the
    // per-message thread bubble drops as soon as they open the drawer.
    void markThreadViewed(block, threadId);
    return () => {
      cancelled = true;
    };
  }, [block, conversationId, threadId]);

  // Optimistic poll on focus — replies don't fire realtime per-thread (we
  // only subscribe at the conversation level), so refetch when the panel is
  // opened. Future: scope a thread-level channel if traffic warrants it.

  return (
    <aside className="w-[360px] shrink-0 border-l border-border bg-elevated flex flex-col">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
        <h3 className="text-sm font-semibold text-text-primary">Thread</h3>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading && <div className="px-4 py-6 text-sm text-text-muted">Loading…</div>}
        {!loading && parent && (
          <>
            <MessageItem
              block={block}
              message={parent}
              isOwn={parent.created_by === currentUserId}
            />
            <div className="px-4 py-1 text-[11px] text-text-muted border-y border-border">
              {replies.length} {replies.length === 1 ? "reply" : "replies"}
            </div>
            {replies.map((r) => (
              <MessageItem
                key={r.id}
                block={block}
                message={r}
                isOwn={r.created_by === currentUserId}
                isThread
              />
            ))}
          </>
        )}
      </div>
      <MessageComposer
        block={block}
        conversationId={conversationId}
        parentMessageId={threadId}
        onLocalThreadInsert={(row) =>
          setReplies((prev) =>
            prev.some((r) => r.id === row.id) ? prev : [...prev, row]
          )
        }
      />
    </aside>
  );
}
