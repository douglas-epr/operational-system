"use client";

/**
 * useChatUrlState
 * ------------------------------------------------------------------
 * Tiny URL-state helper for /chat.  Mirrors the DocsShell pattern —
 * the URL is the source of truth, components read from
 * useSearchParams(), and any change goes through router.replace() so
 * back/forward works as expected.
 */

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import type { ChatBlock, ChatTab } from "@/types/chat";

export interface ChatUrlState {
  block: ChatBlock;
  conversationId: string | null;
  tab: ChatTab;
  threadId: string | null;
  setBlock: (b: ChatBlock) => void;
  setConversation: (id: string | null) => void;
  /** Set block + conversation atomically (used by ConversationsSidebar). */
  setBlockAndConversation: (b: ChatBlock, id: string | null) => void;
  setTab: (t: ChatTab) => void;
  setThread: (id: string | null) => void;
}

const VALID_BLOCKS: ChatBlock[] = ["projects", "internal_projects", "private", "chatbot"];
const VALID_TABS: ChatTab[] = [
  "messages",
  "files",
  "links",
  "videos",
  "daily_feedback",
  "client_requests",
  "chatbot",
  "tasks",
];

export function useChatUrlState(): ChatUrlState {
  const router = useRouter();
  const params = useSearchParams();

  const block: ChatBlock =
    (VALID_BLOCKS as string[]).includes(params.get("block") ?? "")
      ? (params.get("block") as ChatBlock)
      : "projects";
  const tab: ChatTab =
    (VALID_TABS as string[]).includes(params.get("tab") ?? "")
      ? (params.get("tab") as ChatTab)
      : "messages";
  const conversationId = params.get("conversation") || null;
  const threadId = params.get("thread") || null;

  const push = useCallback(
    (updates: Record<string, string | null>) => {
      const sp = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v == null || v === "") sp.delete(k);
        else sp.set(k, v);
      }
      const qs = sp.toString();
      router.replace(qs ? `/chat?${qs}` : "/chat", { scroll: false });
    },
    [params, router]
  );

  return {
    block,
    conversationId,
    tab,
    threadId,
    setBlock: (b) => push({ block: b, conversation: null, tab: null, thread: null }),
    setConversation: (id) => push({ conversation: id, tab: null, thread: null }),
    setBlockAndConversation: (b, id) =>
      push({ block: b, conversation: id, tab: null, thread: null }),
    setTab: (t) => push({ tab: t === "messages" ? null : t, thread: null }),
    setThread: (id) => push({ thread: id }),
  };
}
