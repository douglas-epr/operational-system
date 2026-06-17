"use client";

/**
 * ConversationPane — column 2 (right pane) for non-chatbot blocks.
 *
 * Header (title + optional gear button) → TabMenu → either MessageList +
 * MessageComposer (Messages tab) or the matching /docs project tab
 * (Files/Links/Videos/Daily Feedback). Optional ThreadPanel slides in on
 * the right when ?thread=<id> is set.
 *
 * Block-aware tabs: only Projects and Projects Internal expose the doc-style
 * tabs (TabMenu hides itself on the other blocks). The gear button (admin /
 * manager only) opens ConversationMembersModal so admins can CRUD the
 * external_/internal_conversation_authorized_users arrays.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatBlock, ChatTab } from "@/types/chat";
import { getConversationHeader, getProjectChatTabCounts } from "../actions";
import TabMenu, { tabsForBlock } from "./TabMenu";
import MessageList, { type MessageListHandle } from "./MessageList";
import MessageComposer from "./MessageComposer";
import ThreadPanel from "./ThreadPanel";
import ProjectTabsPanel from "./ProjectTabsPanel";
import InternalProjectTabsPanel from "./InternalProjectTabsPanel";
import ClientRequestsTab from "./tabs/ClientRequestsTab";
import ProjectChatbotTab from "./tabs/ProjectChatbotTab";
import InternalProjectTasksTab from "./tabs/InternalProjectTasksTab";

interface Props {
  block: Exclude<ChatBlock, "chatbot">;
  conversationId: string | null;
  currentUserId: string;
  userType: string;
  tab: ChatTab;
  threadId: string | null;
  onTabChange: (t: ChatTab) => void;
  onThreadOpen: (id: string) => void;
  onThreadClose: () => void;
}

export default function ConversationPane({
  block,
  conversationId,
  currentUserId,
  userType,
  tab,
  threadId,
  onTabChange,
  onThreadOpen,
  onThreadClose,
}: Props) {
  const [header, setHeader] = useState<{ title: string | null; picture: string | null } | null>(null);
  const messageListRef = useRef<MessageListHandle | null>(null);
  const [messagesRefreshKey, setMessagesRefreshKey] = useState(0);
  const [tabBlueBadge, setTabBlueBadge] = useState<Partial<Record<ChatTab, number>>>({});
  const [tabRedBadge, setTabRedBadge] = useState<Partial<Record<ChatTab, number>>>({});

  const onClientCounts = useCallback((blue: number, red: number) => {
    setTabBlueBadge((prev) => ({ ...prev, client_requests: blue }));
    setTabRedBadge((prev) => ({ ...prev, client_requests: red }));
  }, []);

  // When a thread is opened, ThreadPanel marks its replies viewed. After
  // the thread closes (or even on open), we want the parent message's
  // `thread_unread_count` badge to drop, so bump the key to refetch.
  useEffect(() => {
    setMessagesRefreshKey((k) => k + 1);
  }, [threadId]);

  useEffect(() => {
    if (!conversationId) {
      setHeader(null);
      return;
    }
    let cancelled = false;
    void getConversationHeader(block, conversationId).then((h) => {
      if (!cancelled) setHeader(h);
    });
    // mark-viewed is handled by ConversationsSidebar (which awaits the
    // RPC before bumping its refresh tick so badge counts reflect the
    // post-mark state in a single render).
    return () => {
      cancelled = true;
    };
  }, [block, conversationId]);

  // Pre-fetch General Requests tab badge counts so the blue + red
  // bubbles appear on the very first render.
  const isProjectBlockNow = block === "projects";
  useEffect(() => {
    if (!conversationId || !isProjectBlockNow) return;
    let cancelled = false;
    void getProjectChatTabCounts(conversationId).then((c) => {
      if (cancelled) return;
      setTabBlueBadge((p) => ({ ...p, client_requests: c.clientOpen }));
      setTabRedBadge((p) => ({ ...p, client_requests: c.clientUnread }));
    });
    return () => {
      cancelled = true;
    };
  }, [conversationId, isProjectBlockNow, messagesRefreshKey]);

  // If the user is on a tab that doesn't apply to this block (e.g. left
  // Projects on `files` then switched to a Private conversation), bounce
  // them back to Messages.
  useEffect(() => {
    const allowed = tabsForBlock(block, userType);
    if (!allowed.includes(tab)) onTabChange("messages");
  }, [block, userType, tab, onTabChange]);

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-text-muted">
        Select a conversation to start chatting.
      </div>
    );
  }

  const isProjectBlock = block === "projects";

  return (
    <div className="flex flex-1 min-w-0 overflow-hidden">
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <div className="px-4 h-12 border-b border-border bg-elevated flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-md bg-muted overflow-hidden flex items-center justify-center text-[10px] font-semibold text-text-muted shrink-0">
            {header?.picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={header.picture} alt="" className="w-full h-full object-cover" />
            ) : (
              header?.title?.[0]?.toUpperCase() ?? "•"
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-[14px] font-semibold text-text-primary truncate leading-none">
              {header?.title ?? "…"}
            </h2>
          </div>
        </div>

        <TabMenu
          block={block}
          active={tab}
          userType={userType}
          onChange={onTabChange}
          tabBlueBadge={tabBlueBadge}
          tabRedBadge={tabRedBadge}
        />

        {tab === "messages" ? (
          <>
            <MessageList
              ref={messageListRef}
              block={block}
              conversationId={conversationId}
              currentUserId={currentUserId}
              tab={tab}
              refreshKey={messagesRefreshKey}
              onOpenThread={onThreadOpen}
            />
            <MessageComposer
              block={block}
              conversationId={conversationId}
              onLocalInsert={(row) => messageListRef.current?.insertLocal(row)}
            />
          </>
        ) : block === "internal_projects" && tab === "tasks" ? (
          <InternalProjectTasksTab
            internalProjectId={conversationId}
            currentUserId={currentUserId}
          />
        ) : block === "internal_projects" ? (
          <InternalProjectTabsPanel internalProjectId={conversationId} tab={tab} />
        ) : !isProjectBlock ? (
          // Fallback for private block — show message list for any unhandled tab.
          <>
            <MessageList
              ref={messageListRef}
              block={block}
              conversationId={conversationId}
              currentUserId={currentUserId}
              tab={tab}
              onOpenThread={onThreadOpen}
            />
            <MessageComposer
              block={block}
              conversationId={conversationId}
              onLocalInsert={(row) => messageListRef.current?.insertLocal(row)}
            />
          </>
        ) : tab === "client_requests" ? (
          <ClientRequestsTab
            projectId={conversationId}
            block={block}
            userType={userType}
            currentUserId={currentUserId}
            onCounts={onClientCounts}
          />
        ) : tab === "chatbot" ? (
          <ProjectChatbotTab
            projectId={conversationId}
            block={block}
            currentUserId={currentUserId}
          />
        ) : (
          <ProjectTabsPanel projectId={conversationId} tab={tab} />
        )}
      </div>

      {threadId && tab === "messages" && (
        <ThreadPanel
          block={block}
          conversationId={conversationId}
          threadId={threadId}
          currentUserId={currentUserId}
          onClose={onThreadClose}
        />
      )}

    </div>
  );
}
