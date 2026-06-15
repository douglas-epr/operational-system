"use client";

/**
 * ChatShell
 * ------------------------------------------------------------------
 * Orchestrates the 2-column /chat layout (the global app Sidebar lives
 * outside this shell). URL is the source of truth.
 *
 *   col 1  ConversationsSidebar  — Slack-style sectioned list of every
 *                                  visible block; one filter input on top.
 *   col 2  ConversationPane / ChatbotPane — message stream + composer.
 *
 * The previous icon-only BlockSidebar has been removed. Each block is now
 * a section header with its own list rendered immediately below.
 */

import type { ChatBlock, ChatTab } from "@/types/chat";
import ConversationsSidebar from "./ConversationsSidebar";
import ConversationPane from "./ConversationPane";
import ChatbotPane from "./ChatbotPane";
import { useChatUrlState } from "./useChatUrlState";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface Props {
  currentUserId: string;
  userType: string;
  initialBlock: ChatBlock;
  initialConversationId: string | null;
  initialTab: ChatTab;
  initialThreadId: string | null;
}

export default function ChatShell({
  currentUserId,
  userType,
  initialBlock,
  initialConversationId,
  initialTab,
  initialThreadId,
}: Props) {
  const url = useChatUrlState();
  const router = useRouter();

  // Keep server-rendered defaults referenced (the URL is authoritative,
  // so these props are effectively unused on the client side beyond SSR).
  void initialBlock;
  void initialConversationId;
  void initialTab;
  void initialThreadId;

  // If the user is on a forbidden block (e.g. client on projects_internal),
  // bounce to the default block.
  useEffect(() => {
    const forbidden =
      url.block === "internal_projects" && !["admin", "manager", "operational"].includes(userType);
    if (forbidden) {
      router.replace("/chat", { scroll: false });
    }
  }, [url.block, userType, router]);

  return (
    <div className="flex flex-1 min-w-0 overflow-hidden bg-base">
      <ConversationsSidebar
        userType={userType}
        currentUserId={currentUserId}
        activeBlock={url.block}
        activeConversationId={url.conversationId}
        onSelect={url.setBlockAndConversation}
      />
      <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
        {url.block === "chatbot" ? (
          <ChatbotPane
            currentUserId={currentUserId}
            chatbotId={url.conversationId}
            onSelect={url.setConversation}
          />
        ) : (
          <ConversationPane
            block={url.block}
            conversationId={url.conversationId}
            currentUserId={currentUserId}
            userType={userType}
            tab={url.tab}
            threadId={url.threadId}
            onTabChange={url.setTab}
            onThreadOpen={url.setThread}
            onThreadClose={() => url.setThread(null)}
          />
        )}
      </div>
    </div>
  );
}
