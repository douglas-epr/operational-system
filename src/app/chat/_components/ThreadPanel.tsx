"use client";

/**
 * ThreadPanel — right-side drawer that shows a single message and its
 * thread replies. Activated by ?thread=<message-id>.
 * Supports emoji reactions on both the parent message and each reply.
 */

import { useCallback, useEffect, useState } from "react";
import type { ChatBlock, ChatMessage, ChatThreadMessage, EmojiReaction } from "@/types/chat";
import { getMessages, getReactions, getThreadMessages, markThreadViewed, toggleEmoji } from "../actions";
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
  const [parent, setParent]   = useState<ChatMessage | null>(null);
  const [replies, setReplies] = useState<ChatThreadMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [parentReactions, setParentReactions]   = useState<EmojiReaction[]>([]);
  const [replyReactionsMap, setReplyReactionsMap] = useState<Record<string, EmojiReaction[]>>({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void Promise.all([
      getMessages(block, conversationId, {}),
      getThreadMessages(block, threadId),
    ]).then(async ([all, thrds]) => {
      if (cancelled) return;
      const p = all.find((m) => m.id === threadId) ?? null;
      setParent(p);
      setReplies(thrds);
      setLoading(false);
      // Load reactions for parent message and all replies in parallel.
      const empty: Record<string, EmojiReaction[]> = {};
      const [msgR, threadR] = await Promise.all([
        p ? getReactions(block, [threadId], false) : Promise.resolve(empty),
        thrds.length > 0 ? getReactions(block, thrds.map((r) => r.id), true) : Promise.resolve(empty),
      ]);
      if (!cancelled) {
        setParentReactions(msgR[threadId] ?? []);
        setReplyReactionsMap(threadR);
      }
    });
    void markThreadViewed(block, threadId);
    return () => {
      cancelled = true;
    };
  }, [block, conversationId, threadId]);

  const handleToggleParentEmoji = useCallback(async (code: string) => {
    const res = await toggleEmoji(block, threadId, code, false);
    if (res.error) return;
    const updated = await getReactions(block, [threadId], false);
    setParentReactions(updated[threadId] ?? []);
  }, [block, threadId]);

  const handleToggleReplyEmoji = useCallback(async (replyId: string, code: string) => {
    const res = await toggleEmoji(block, replyId, code, true);
    if (res.error) return;
    const updated = await getReactions(block, [replyId], true);
    setReplyReactionsMap((prev) => ({ ...prev, ...updated }));
  }, [block]);

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
              reactions={parentReactions}
              onToggleEmoji={(code) => handleToggleParentEmoji(code)}
              onMessageDelete={() => setParent(null)}
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
                reactions={replyReactionsMap[r.id]}
                onToggleEmoji={(code) => handleToggleReplyEmoji(r.id, code)}
                onMessageDelete={(id) => setReplies((prev) => prev.filter((x) => x.id !== id))}
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
