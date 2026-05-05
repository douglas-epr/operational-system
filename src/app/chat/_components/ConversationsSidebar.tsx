"use client";

/**
 * ConversationsSidebar — Slack-style sectioned list.
 *
 * One filter input on top, then collapsible sections (one per visible
 * block). Tighter row density and refined active/hover states give the
 * surface a Slack-like read.
 *
 * Visibility rules (mirror the previous BlockSidebar):
 *   client / qa            → projects, private, chatbot
 *   developer              → projects, projects_internal, private, chatbot
 *   admin/manager/operational → all 5
 */

import { useEffect, useMemo, useState } from "react";
import type { ChatBlock } from "@/types/chat";
import { BLOCK_LABELS } from "@/types/chat";
import ProjectsList from "./lists/ProjectsList";
import ProjectsInternalList from "./lists/ProjectsInternalList";
import InternalProjectsList from "./lists/InternalProjectsList";
import PrivateList from "./lists/PrivateList";
import ChatbotList from "./lists/ChatbotList";
import UnreadBadge from "./UnreadBadge";
import { markConversationViewed } from "../actions";
import {
  BriefcaseIcon,
  LockIcon,
  FolderIcon,
  UserIcon,
  SparkleIcon,
  ChevronRightIcon,
  SearchIcon,
} from "@/components/ui/icons";

interface Props {
  userType: string;
  currentUserId: string;
  activeBlock: ChatBlock;
  activeConversationId: string | null;
  /** Single setter — selecting a row writes both block + conversation. */
  onSelect: (block: ChatBlock, conversationId: string | null) => void;
}

const ALL_BLOCKS: ChatBlock[] = [
  "projects",
  "projects_internal",
  "internal_projects",
  "private",
  "chatbot",
];

function visibleBlocksFor(userType: string): ChatBlock[] {
  if (userType === "client" || userType === "qa") {
    return ["projects", "private", "chatbot"];
  }
  if (userType === "developer") {
    return ["projects", "projects_internal", "private", "chatbot"];
  }
  return ALL_BLOCKS;
}

export default function ConversationsSidebar({
  userType,
  currentUserId,
  activeBlock,
  activeConversationId,
  onSelect,
}: Props) {
  const visible = visibleBlocksFor(userType);
  const [filter, setFilter] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [unreadByBlock, setUnreadByBlock] = useState<Record<string, number>>({});
  const [refreshTickByBlock, setRefreshTickByBlock] = useState<Record<ChatBlock, number>>({
    projects: 0,
    projects_internal: 0,
    internal_projects: 0,
    private: 0,
    chatbot: 0,
  });

  function toggle(b: ChatBlock) {
    setCollapsed((c) => ({ ...c, [b]: !c[b] }));
  }

  // When the user opens a conversation, mark it viewed FIRST (RPC writes
  // viewed_by[] on every message + thread row in scope), then bump the
  // refresh tick so each list re-fetches with fresh unread counts.
  // Chatbot block has no viewed_by tracking — skip the RPC there.
  useEffect(() => {
    if (
      !activeConversationId ||
      activeBlock === "chatbot" ||
      activeBlock === undefined
    ) {
      return;
    }
    let cancelled = false;
    void markConversationViewed(
      activeBlock as Exclude<ChatBlock, "chatbot">,
      activeConversationId
    ).then(() => {
      if (!cancelled)
        setRefreshTickByBlock((prev) => ({
          ...prev,
          [activeBlock]: (prev[activeBlock] ?? 0) + 1,
        }));
    });
    return () => {
      cancelled = true;
    };
  }, [activeBlock, activeConversationId]);

  useEffect(() => {
    const t = setInterval(() => {
      setRefreshTickByBlock((prev) => ({
        projects: prev.projects + 1,
        projects_internal: prev.projects_internal + 1,
        internal_projects: prev.internal_projects + 1,
        private: prev.private + 1,
        chatbot: prev.chatbot + 1,
      }));
    }, 20_000);
    return () => clearInterval(t);
  }, []);

  // Stable callback per block so the lists don't refetch on every render.
  const setBlockTotal = useMemo<Record<string, (n: number) => void>>(() => {
    const make = (b: ChatBlock) => (n: number) =>
      setUnreadByBlock((prev) => (prev[b] === n ? prev : { ...prev, [b]: n }));
    return {
      projects: make("projects"),
      projects_internal: make("projects_internal"),
      internal_projects: make("internal_projects"),
      private: make("private"),
      chatbot: make("chatbot"),
    };
  }, []);

  return (
    <aside className="w-[260px] shrink-0 border-r border-border bg-elevated flex flex-col">
      {/* ── Header & filter ─────────────────────────────────────── */}
      <div className="px-3.5 pt-4 pb-3 border-b border-border shrink-0">
        <h2 className="text-[13px] font-semibold text-text-primary mb-2.5 px-0.5">
          Chat
        </h2>
        <div className="relative">
          <SearchIcon
            className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            strokeWidth={1.8}
          />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter"
            className="w-full h-8 pl-8 pr-2.5 bg-base border border-border rounded-md text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus transition-colors"
          />
        </div>
      </div>

      {/* ── Sections ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto py-1">
        {visible.map((b) => {
          const isCollapsed = collapsed[b];
          return (
            <section key={b} className="px-2 mb-1">
              <header
                className="flex items-center gap-1.5 px-2 h-7 cursor-pointer select-none rounded-md hover:bg-muted/40 transition-colors"
                onClick={() => toggle(b)}
              >
                <ChevronRightIcon
                  className={[
                    "w-3 h-3 text-text-muted transition-transform shrink-0",
                    !isCollapsed ? "rotate-90" : "",
                  ].join(" ")}
                  strokeWidth={2.5}
                />
                <BlockIcon block={b} />
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-muted flex-1 truncate">
                  {BLOCK_LABELS[b]}
                </span>
                <UnreadBadge count={unreadByBlock[b] ?? 0} />
              </header>
              {!isCollapsed && (
                <div className="pt-0.5 pb-1.5">
                  {b === "projects" && (
                    <ProjectsList
                      filter={filter}
                      activeId={activeBlock === b ? activeConversationId : null}
                      refreshTick={refreshTickByBlock.projects}
                      onSelect={(id) => onSelect(b, id)}
                      onTotalUnread={setBlockTotal[b]}
                    />
                  )}
                  {b === "projects_internal" && (
                    <ProjectsInternalList
                      filter={filter}
                      activeId={activeBlock === b ? activeConversationId : null}
                      refreshTick={refreshTickByBlock.projects_internal}
                      onSelect={(id) => onSelect(b, id)}
                      onTotalUnread={setBlockTotal[b]}
                    />
                  )}
                  {b === "internal_projects" && (
                    <InternalProjectsList
                      filter={filter}
                      activeId={activeBlock === b ? activeConversationId : null}
                      refreshTick={refreshTickByBlock.internal_projects}
                      onSelect={(id) => onSelect(b, id)}
                      onTotalUnread={setBlockTotal[b]}
                    />
                  )}
                  {b === "private" && (
                    <PrivateList
                      filter={filter}
                      activeId={activeBlock === b ? activeConversationId : null}
                      refreshTick={refreshTickByBlock.private}
                      onSelect={(id) => onSelect(b, id)}
                      currentUserId={currentUserId}
                      onTotalUnread={setBlockTotal[b]}
                    />
                  )}
                  {b === "chatbot" && (
                    <ChatbotList
                      filter={filter}
                      activeId={activeBlock === b ? activeConversationId : null}
                      onSelect={(id) => onSelect(b, id)}
                    />
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </aside>
  );
}

function BlockIcon({ block }: { block: ChatBlock }) {
  const cls = "w-3.5 h-3.5 text-text-muted shrink-0";
  switch (block) {
    case "projects":
      return <BriefcaseIcon className={cls} strokeWidth={1.8} />;
    case "projects_internal":
      return <LockIcon className={cls} strokeWidth={1.8} />;
    case "internal_projects":
      return <FolderIcon className={cls} strokeWidth={1.8} />;
    case "private":
      return <UserIcon className={cls} strokeWidth={1.8} />;
    case "chatbot":
      return <SparkleIcon className={cls} strokeWidth={1.8} />;
  }
}
