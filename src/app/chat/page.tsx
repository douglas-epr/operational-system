/**
 * /chat — Slack-like multi-block messaging hub.
 *
 * Layout (inside the main content area):
 *   col 1 (~64px)  Block sidebar — 5 icon switches
 *   col 2 (~280px) Conversation list for the active block
 *   col 3 (flex)   Active conversation: tab menu + message stream + composer
 *
 * URL is the source of truth for active block / conversation / tab / thread,
 * matching the DocsShell pattern in src/app/docs/_components/DocsShell.tsx.
 *
 * Access: admin, manager, operational, developer, client, qa.
 *         Referrers + leads are excluded (referrers are also clamped by the
 *         proxy in src/proxy.ts).
 */

import { redirect } from "next/navigation";
import { requirePageAccess } from "@/lib/auth/page-gate";
import PageShell from "@/components/layout/PageShell";
import type { UserProfile } from "@/types/projects";
import { CHAT_ALLOWED_ROLES, type ChatBlock, type ChatTab } from "@/types/chat";
import ChatShell from "./_components/ChatShell";

interface PageProps {
  searchParams: Promise<{
    block?: string;
    conversation?: string;
    tab?: string;
    thread?: string;
  }>;
}

const VALID_BLOCKS: ChatBlock[] = ["projects", "projects_internal", "internal_projects", "private", "chatbot"];
const VALID_TABS: ChatTab[] = [
  "messages",
  "files",
  "links",
  "videos",
  "daily_feedback",
  "client_requests",
  "qa_requests",
  "chatbot",
  "tasks",
];

export default async function ChatPage({ searchParams }: PageProps) {
  // Gate: admin/manager/operational/developer/qa/client (matches
  // CHAT_ALLOWED_ROLES). The shared helper sends referrer →
  // /recommended-projects, lead → /sandbox-planner.
  const { supabase, userId, role } = await requirePageAccess([
    "admin",
    "manager",
    "operational",
    "developer",
    "qa",
    "client",
  ]);

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, picture, type")
    .eq("id", userId)
    .single();

  const userType = role as string;
  // Defensive: keep the historical CHAT_ALLOWED_ROLES check live so
  // future role additions don't accidentally widen access here.
  if (!CHAT_ALLOWED_ROLES.includes(userType as (typeof CHAT_ALLOWED_ROLES)[number])) {
    redirect("/");
  }

  const sp = await searchParams;
  const block = (VALID_BLOCKS as string[]).includes(sp.block ?? "")
    ? (sp.block as ChatBlock)
    : "projects";
  const tab = (VALID_TABS as string[]).includes(sp.tab ?? "")
    ? (sp.tab as ChatTab)
    : "messages";
  const conversationId = sp.conversation ?? null;
  const threadId = sp.thread ?? null;

  return (
    <PageShell profile={(profile ?? null) as UserProfile | null} fullBleed flush>
      <ChatShell
        currentUserId={userId}
        userType={userType}
        initialBlock={block}
        initialConversationId={conversationId}
        initialTab={tab}
        initialThreadId={threadId}
      />
    </PageShell>
  );
}
