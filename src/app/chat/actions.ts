"use server";

/**
 * /chat server actions.
 *
 * One file covers the four "regular" conversation flavors (projects,
 * projects_internal, internal_projects, private) plus the chatbot.
 * Each action uses createClient() so RLS clamps the data to what the
 * caller is allowed to see — the role gate at the top is defense in
 * depth.
 *
 * RLS-backed listing actions never need a manual auth filter — selects
 * just return what the user is allowed to read.
 */

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  BLOCK_TABLES,
  CHAT_ALLOWED_ROLES,
  extractLinks,
  type ChatAttachment,
  type ChatBlock,
  type ChatbotConversationRow,
  type ChatbotMessageRow,
  type ChatMessage,
  type ChatThreadMessage,
  type EmojiReaction,
  type InternalProjectListRow,
  type PrivateConversationRow,
  type ProjectListRow,
} from "@/types/chat";
import type {
  DocsAttachment,
  InternalProjectDailyFeedback,
  InternalProjectFile,
  InternalProjectLink,
  InternalProjectVideo,
  ProjectDailyFeedback,
  ProjectFile,
  ProjectLink,
  ProjectVideo,
} from "@/types/docs";
import { runChatbotTurn } from "./_chatbot/run";
import {
  runProjectChatbotTurn,
  type ProjectChatbotMessageRow,
  type ProjectChatbotScope,
} from "./_chatbot/runProjectBot";

// ── Auth helper ─────────────────────────────────────────────────────────────

async function requireChatUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" as const };
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, type")
    .eq("id", user.id)
    .single();
  const t = profile?.type ?? null;
  if (!t || !CHAT_ALLOWED_ROLES.includes(t as (typeof CHAT_ALLOWED_ROLES)[number])) {
    return { error: "Forbidden" as const };
  }
  return { supabase, userId: user.id, userType: t };
}

// ── Unread count helpers ────────────────────────────────────────────────────

/**
 * Compute unread counts (top-level + thread, per scope id) for a set of
 * scope ids on a single block. A row is "unread" iff the caller is not in
 * `viewed_by` AND is not the author.
 *
 * Uses simple SELECTs because Supabase JS doesn't expose `NOT (viewed_by @>
 * ARRAY[uuid])` directly — we filter client-side after pulling created_by +
 * viewed_by columns. This is bounded by what the user can see (RLS) plus
 * the scope id filter, which is small in practice.
 *
 * NOTE: chat tables had their owner_id columns renamed to created_by in
 * Part 2 B8.
 */
async function unreadByScope(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  block: Exclude<ChatBlock, "chatbot">,
  scopeIds: string[]
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (scopeIds.length === 0) return out;
  const { msg, thread, scopeFk } = BLOCK_TABLES[block];

  // For project-scoped chat blocks (external + internal), the unread total
  // also counts unread `project_task_comment` rows whose task is a Client
  // Requests or QA Requests task on that project. The chat list bubble is
  // the user's "anything new on this project" indicator — task-thread
  // comments belong in it just as much as conversation messages do.
  const includeTaskComments = block === "projects";

  const promises: Promise<{ data: unknown }>[] = [
    supabase
      .from(msg)
      .select(`${scopeFk}, created_by, viewed_by`)
      .in(scopeFk, scopeIds),
    supabase
      .from(thread)
      .select(`${scopeFk}, created_by, viewed_by`)
      .in(scopeFk, scopeIds),
  ];
  if (includeTaskComments) {
    // Limit to the two task types that surface in the project chat tabs.
    promises.push(
      supabase
        .from("project_task_comment")
        .select("project_id, created_by, viewed_by, project_task!inner(type)")
        .in("project_id", scopeIds)
        .in("project_task.type", ["client_requests"])
    );
  }
  const results = await Promise.all(promises);
  const msgs    = (results[0] as { data: unknown }).data;
  const thrds   = (results[1] as { data: unknown }).data;
  const taskCmts = includeTaskComments ? (results[2] as { data: unknown }).data : null;

  function tally(rows: Array<Record<string, unknown>>, fkCol: string = scopeFk) {
    for (const row of rows ?? []) {
      const sid = row[fkCol] as string | null;
      if (!sid) continue;
      const author = row.created_by as string | null;
      if (author === userId) continue;
      const viewed = (row.viewed_by as string[] | null) ?? [];
      if (viewed.includes(userId)) continue;
      out.set(sid, (out.get(sid) ?? 0) + 1);
    }
  }
  tally((msgs ?? []) as Array<Record<string, unknown>>);
  tally((thrds ?? []) as Array<Record<string, unknown>>);
  if (includeTaskComments && taskCmts) {
    // project_task_comment rows are scoped by project_id; the inner-join
    // filter on project_task.type narrows to client_requests / qa_requests.
    tally((taskCmts ?? []) as Array<Record<string, unknown>>, "project_id");
  }
  return out;
}

// ── Listing: regular blocks (projects / projects_internal / internal_projects)
// RLS clamps results so we just SELECT.

export async function listProjectConversations(): Promise<ProjectListRow[]> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return [];
  // RLS now handles all visibility: admin sees all; everyone else sees only
  // projects where their uid is in authorized_users (migration 20260616000000).
  const { data } = await ctx.supabase
    .from("project")
    .select("id, name, picture");
  const rows = (data ?? []) as ProjectListRow[];
  if (rows.length === 0) return [];

  // Sort by most-recently-active conversation (last message timestamp desc).
  const { data: lastMsgsData } = await ctx.supabase
    .from("conversation_project_external_message")
    .select("project_id, created_at")
    .in("project_id", rows.map((p) => p.id))
    .order("created_at", { ascending: false })
    .limit(2000);
  const latestByProject = new Map<string, string>();
  for (const m of (lastMsgsData ?? []) as Array<{ project_id: string; created_at: string }>) {
    if (!latestByProject.has(m.project_id)) latestByProject.set(m.project_id, m.created_at);
  }
  rows.sort((a, b) => {
    const aT = latestByProject.get(a.id) ?? "";
    const bT = latestByProject.get(b.id) ?? "";
    if (bT !== aT) return bT < aT ? -1 : 1;
    return (a.name ?? "").localeCompare(b.name ?? "");
  });

  const unread = await unreadByScope(
    ctx.supabase,
    ctx.userId,
    "projects",
    rows.map((p) => p.id)
  );
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    picture: p.picture,
    unread_count: unread.get(p.id) ?? 0,
  }));
}


export async function listInternalProjectConversations(): Promise<InternalProjectListRow[]> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return [];
  // Internal-project chat is staff-only by RLS; UI mirrors that.
  if (!["admin", "manager", "operational"].includes(ctx.userType)) return [];
  const { data } = await ctx.supabase
    .from("internal_project")
    .select("id, name");
  const rows = (data ?? []) as InternalProjectListRow[];
  if (rows.length === 0) return [];

  // Sort by most-recently-active conversation (last message timestamp desc).
  const { data: lastMsgsData } = await ctx.supabase
    .from("conversation_internal_project_message")
    .select("internal_project_id, created_at")
    .in("internal_project_id", rows.map((r) => r.id))
    .order("created_at", { ascending: false })
    .limit(2000);
  const latestByProject = new Map<string, string>();
  for (const m of (lastMsgsData ?? []) as Array<{ internal_project_id: string; created_at: string }>) {
    if (!latestByProject.has(m.internal_project_id)) latestByProject.set(m.internal_project_id, m.created_at);
  }
  rows.sort((a, b) => {
    const aT = latestByProject.get(a.id) ?? "";
    const bT = latestByProject.get(b.id) ?? "";
    if (bT !== aT) return bT < aT ? -1 : 1;
    return (a.name ?? "").localeCompare(b.name ?? "");
  });

  const unread = await unreadByScope(
    ctx.supabase,
    ctx.userId,
    "internal_projects",
    rows.map((r) => r.id)
  );
  return rows.map((r) => ({ ...r, unread_count: unread.get(r.id) ?? 0 }));
}

// ── Listing: private 1:1 ─────────────────────────────────────────────────────

export async function listPrivateConversations(): Promise<PrivateConversationRow[]> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return [];
  const { data: rows } = await ctx.supabase
    .from("conversation_private")
    .select("id, participant_user_ids, created_by, created_at, title")
    .order("created_at", { ascending: false });
  const list = (rows ?? []) as PrivateConversationRow[];
  if (list.length === 0) return [];

  // Hydrate peer profile (the other participant) and a tiny "last message"
  // preview for each conversation.
  const peerIds = new Set<string>();
  for (const c of list) {
    for (const id of c.participant_user_ids ?? []) {
      if (id !== ctx.userId) peerIds.add(id);
    }
  }
  const { data: profilesData } = await ctx.supabase
    .from("profiles")
    .select("id, first_name, last_name, picture, type")
    .in("id", Array.from(peerIds));
  const profMap = new Map<string, NonNullable<PrivateConversationRow["peer"]>>();
  for (const p of profilesData ?? []) {
    profMap.set((p as { id: string }).id, p as unknown as NonNullable<PrivateConversationRow["peer"]>);
  }

  const ids = list.map((c) => c.id);
  const { data: lastMsgs } = await ctx.supabase
    .from("conversation_private_message")
    .select("conversation_id, message, created_at")
    .in("conversation_id", ids)
    .order("created_at", { ascending: false })
    .limit(200); // good enough — pick first per conv
  const lastByConv = new Map<string, { message: string; created_at: string }>();
  for (const m of (lastMsgs ?? []) as Array<{ conversation_id: string; message: string; created_at: string }>) {
    if (!lastByConv.has(m.conversation_id)) {
      lastByConv.set(m.conversation_id, { message: m.message, created_at: m.created_at });
    }
  }

  const unread = await unreadByScope(ctx.supabase, ctx.userId, "private", ids);

  list.sort((a, b) => {
    const aT = lastByConv.get(a.id)?.created_at ?? "";
    const bT = lastByConv.get(b.id)?.created_at ?? "";
    return bT < aT ? -1 : bT > aT ? 1 : 0;
  });

  return list.map((c) => {
    const others = (c.participant_user_ids ?? []).filter((id) => id !== ctx.userId);
    const isGroup = others.length > 1;
    let groupLabel: string | null = null;
    if (isGroup) {
      const names = others
        .map((id) => profMap.get(id))
        .filter((p): p is NonNullable<typeof p> => Boolean(p))
        .map((p) => `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "Someone");
      const firstTwo = names.slice(0, 2).join(", ");
      const rest = names.length > 2 ? ` + ${names.length - 2} more` : "";
      groupLabel = (c.title && c.title.trim()) || firstTwo + rest || "Group";
    }
    return {
      ...c,
      peer: others.length > 0 ? profMap.get(others[0]) : undefined,
      group_label: groupLabel,
      last_message: lastByConv.get(c.id) ?? null,
      unread_count: unread.get(c.id) ?? 0,
    };
  });
}

/**
 * Role-gated peer list for the New-Conversation user picker.
 *
 * - admin / manager / operational: every profile in the system
 *   except referrers and leads.
 * - everyone else: only profiles that share at least one project with the
 *   caller (intersection of either external_conversation_authorized_users
 *   or internal_conversation_authorized_users across the projects the
 *   caller is a member of).
 *
 * Used by `UserPickerModal`. The component filters the result client-side
 * by the search box.
 */
export async function listSelectablePrivatePeers(): Promise<
  { id: string; first_name: string | null; last_name: string | null; picture: string | null; type: string | null }[]
> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return [];
  const elevated =
    ctx.userType === "admin" || ctx.userType === "manager" || ctx.userType === "operational";

  if (elevated) {
    const { data } = await ctx.supabase
      .from("profiles")
      .select("id, first_name, last_name, picture, type")
      .neq("id", ctx.userId)
      .not("type", "in", "(referrer,lead)")
      .order("first_name");
    return (data ?? []) as Array<{
      id: string;
      first_name: string | null;
      last_name: string | null;
      picture: string | null;
      type: string | null;
    }>;
  }

  // Non-elevated: gather peers via projects the caller is a member of.
  const { data: projectsData } = await ctx.supabase
    .from("project")
    .select("external_conversation_authorized_users");
  const peerIds = new Set<string>();
  for (const row of (projectsData ?? []) as Array<{
    external_conversation_authorized_users: string[] | null;
  }>) {
    const ext = row.external_conversation_authorized_users ?? [];
    if (!ext.includes(ctx.userId)) continue;
    for (const id of ext) if (id !== ctx.userId) peerIds.add(id);
  }
  if (peerIds.size === 0) return [];
  const { data } = await ctx.supabase
    .from("profiles")
    .select("id, first_name, last_name, picture, type")
    .in("id", Array.from(peerIds))
    .not("type", "in", "(referrer,lead)")
    .order("first_name");
  return (data ?? []) as Array<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    picture: string | null;
    type: string | null;
  }>;
}

export async function searchUsersForPrivate(query: string): Promise<
  { id: string; first_name: string | null; last_name: string | null; picture: string | null; type: string | null }[]
> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return [];
  const q = query.trim();
  let req = ctx.supabase
    .from("profiles")
    .select("id, first_name, last_name, picture, type")
    .neq("id", ctx.userId)
    .not("type", "in", "(referrer,lead)")
    .order("first_name")
    .limit(20);
  if (q) {
    req = req.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`);
  }
  const { data } = await req;
  return (data ?? []) as Array<{ id: string; first_name: string | null; last_name: string | null; picture: string | null; type: string | null }>;
}

/**
 * Open or create a private conversation.
 *
 * - Pass a single peer id (legacy / 1:1) — dedupes against existing 2-person
 *   chats so you don't end up with parallel DMs.
 * - Pass an array of 2+ peer ids → group conversation. Groups never dedupe
 *   (the user might want a fresh group with the same members but a new
 *   topic) and accept an optional `title` for the conversation header.
 *
 * The `private_conversation.participant_user_ids` array always includes
 * the caller; RLS uses it on every read/write.
 */
export async function createPrivateConversation(
  peer: string | string[],
  options: { title?: string | null } = {}
): Promise<{ id?: string; error?: string }> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return { error: ctx.error };

  const peerIds = (Array.isArray(peer) ? peer : [peer])
    .filter((id) => typeof id === "string" && id.length > 0 && id !== ctx.userId);
  // Dedupe peer ids (UI multi-select can double-click).
  const uniquePeers = Array.from(new Set(peerIds));
  if (uniquePeers.length === 0) return { error: "Pick at least one other person." };

  const isGroup = uniquePeers.length >= 2;
  const participants = Array.from(new Set([ctx.userId, ...uniquePeers]));

  // Idempotent dedup ONLY for 1:1 chats. Groups always create fresh.
  if (!isGroup) {
    const { data: existing } = await ctx.supabase
      .from("conversation_private")
      .select("id, participant_user_ids")
      .contains("participant_user_ids", uniquePeers);
    for (const row of (existing ?? []) as Array<{ id: string; participant_user_ids: string[] }>) {
      const ids = row.participant_user_ids ?? [];
      if (ids.length === 2 && ids.includes(ctx.userId) && ids.includes(uniquePeers[0])) {
        return { id: row.id };
      }
    }
  }

  const insertRow: Record<string, unknown> = {
    participant_user_ids: participants,
    created_by: ctx.userId,
  };
  if (isGroup && options.title && options.title.trim()) {
    insertRow.title = options.title.trim().slice(0, 120);
  }

  const { data: inserted, error } = await ctx.supabase
    .from("conversation_private")
    .insert(insertRow as never)
    .select("id")
    .single();
  if (error || !inserted) return { error: error?.message ?? "Failed to create conversation" };
  revalidatePath("/chat");
  return { id: (inserted as { id: string }).id };
}

/** Update a private conversation's members and/or title.
 *  Only the conversation creator or an admin may call this. */
export async function updatePrivateConversation(
  id: string,
  data: { participantIds: string[]; title: string | null }
): Promise<{ error?: string }> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return { error: ctx.error };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: conv } = await (ctx.supabase as any)
    .from("conversation_private")
    .select("id, created_by")
    .eq("id", id)
    .single();

  if (!conv) return { error: "Conversation not found." };
  if (conv.created_by !== ctx.userId && ctx.userType !== "admin") {
    return { error: "Only the conversation creator or an admin can edit this." };
  }

  // Always keep the original creator in the participant list.
  const participants = Array.from(new Set([conv.created_by, ...data.participantIds]));
  if (participants.length < 2) return { error: "A conversation needs at least 2 participants." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (createServiceClient() as any)
    .from("conversation_private")
    .update({ participant_user_ids: participants, title: data.title ?? null })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/chat");
  return {};
}

/** Delete a private conversation (and its messages via CASCADE).
 *  Only the conversation creator or an admin may call this. */
export async function deletePrivateConversation(id: string): Promise<{ error?: string }> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return { error: ctx.error };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: conv } = await (ctx.supabase as any)
    .from("conversation_private")
    .select("id, created_by")
    .eq("id", id)
    .single();

  if (!conv) return { error: "Conversation not found." };
  if (conv.created_by !== ctx.userId && ctx.userType !== "admin") {
    return { error: "Only the conversation creator or an admin can delete this." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (createServiceClient() as any)
    .from("conversation_private")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/chat");
  return {};
}

// ── Mark-viewed ─────────────────────────────────────────────────────────────

const MARK_RPC: Record<Exclude<ChatBlock, "chatbot">, string> = {
  projects: "mark_external_project_messages_viewed",
  internal_projects: "mark_conversation_internal_project_messages_viewed",
  private: "mark_private_conversation_messages_viewed",
};

const MARK_RPC_PARAM: Record<Exclude<ChatBlock, "chatbot">, string> = {
  projects: "p_project_id",
  internal_projects: "p_internal_project_id",
  private: "p_conversation_id",
};

const MARK_THREAD_RPC: Record<Exclude<ChatBlock, "chatbot">, string> = {
  projects: "mark_external_project_thread_viewed",
  internal_projects: "mark_conversation_internal_project_thread_viewed",
  private: "mark_private_conversation_thread_viewed",
};

/**
 * Mark every top-level + thread row in a scope as viewed by the caller.
 * Called when a user opens a conversation. Idempotent — RPC only updates
 * rows where the caller isn't already in viewed_by.
 */
export async function markConversationViewed(
  block: Exclude<ChatBlock, "chatbot">,
  conversationId: string
): Promise<{ error?: string }> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return { error: ctx.error };
  const fnName = MARK_RPC[block];
  const param = MARK_RPC_PARAM[block];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (ctx.supabase as any).rpc(fnName, { [param]: conversationId });
  if (error) {
    // Surface RPC failures to the server log — silent failure here cost
    // us a "why is the unread count never decreasing" bug for weeks.
    console.error("[chat] markConversationViewed failed:", fnName, error.message);
    return { error: error.message };
  }
  return {};
}

/**
 * Mark every reply on a single thread as viewed by the caller. Called
 * when ThreadPanel mounts. Only touches the thread table for the given
 * parent message id.
 */
export async function markThreadViewed(
  block: Exclude<ChatBlock, "chatbot">,
  parentId: string
): Promise<{ error?: string }> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return { error: ctx.error };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (ctx.supabase as any).rpc(MARK_THREAD_RPC[block], {
    p_parent_id: parentId,
  });
  if (error) {
    console.error("[chat] markThreadViewed failed:", MARK_THREAD_RPC[block], error.message);
    return { error: error.message };
  }
  return {};
}

// ── Project chat tab badges (Client Requests / QA Requests) ─────────────────
//
// Pre-fetches the four numbers shown on the chat-tab pill cluster so the
// badges appear immediately when a conversation loads — without having to
// mount the full kanban wrappers. The kanban wrappers continue to refresh
// the same numbers via onCounts every 2 s once they mount.
export async function getProjectChatTabCounts(
  projectId: string
): Promise<{
  clientOpen: number;
  clientUnread: number;
}> {
  const ctx = await requireChatUser();
  if ("error" in ctx) {
    return { clientOpen: 0, clientUnread: 0 };
  }

  const [{ data: tasks }, { data: comments }] = await Promise.all([
    ctx.supabase
      .from("project_task")
      .select("id, type, status")
      .eq("project_id", projectId)
      .eq("type", "client_requests"),
    ctx.supabase
      .from("project_task_comment")
      .select("project_id, created_by, viewed_by, project_task!inner(type)")
      .eq("project_id", projectId)
      .eq("project_task.type", "client_requests"),
  ]);

  let clientOpen = 0;
  for (const t of (tasks ?? []) as Array<{ type: string; status: string }>) {
    if (t.type === "client_requests" && t.status === "not_started") clientOpen++;
  }

  let clientUnread = 0;
  for (const c of (comments ?? []) as Array<{
    created_by: string | null;
    viewed_by: string[] | null;
    project_task: { type: string } | null;
  }>) {
    if (!c.project_task) continue;
    if (c.created_by === ctx.userId) continue;
    if ((c.viewed_by ?? []).includes(ctx.userId)) continue;
    if (c.project_task.type === "client_requests") clientUnread++;
  }

  return { clientOpen, clientUnread };
}

// ── Messages ────────────────────────────────────────────────────────────────

// Renamed from `profiles!owner_id` after Part 2 B8 renamed the chat tables'
// `owner_id` columns to `created_by`. The FK constraints carry the new
// column name so PostgREST resolves the embed against `created_by`.
const PROFILE_SELECT = "profiles:profiles!created_by(id, first_name, last_name, picture)";

export async function getMessages(
  block: Exclude<ChatBlock, "chatbot">,
  conversationId: string,
  opts: { tab?: "messages" | "files" | "links" | "videos" | "daily_feedback"; limit?: number } = {}
): Promise<ChatMessage[]> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return [];
  const { msg, scopeFk } = BLOCK_TABLES[block];
  const limit = opts.limit ?? 100;

  // Build the select. We pull a thread reply count via a related-table count
  // trick using the thread table's FK back to the parent.
  // Cast the table name to never so supabase-js' literal-type narrowing
  // accepts a runtime string. Same trick used in sandbox-planner actions.
  let req = ctx.supabase
    .from(msg as never)
    // Part 2 B8 renamed owner_id→created_by, edited_at→updated_at, and
    // dropped is_daily_feedback. The "Daily Feedback" tab is now served
    // by the project_daily_feedback table (see /docs).
    .select(`id, ${scopeFk}, created_by, author_type, message, attachments, links, updated_at, created_at, ${PROFILE_SELECT}`)
    .eq(scopeFk, conversationId)
    .order("created_at", { ascending: true })
    .limit(limit);

  // Tab filters
  if (opts.tab === "daily_feedback") {
    // is_daily_feedback was dropped from the chat message tables in B8.
    // Daily-feedback content lives in project_daily_feedback now and is
    // surfaced through /docs, not through this code path. Returning no
    // rows here keeps the legacy daily_feedback tab non-fatal.
    return [];
  } else if (opts.tab === "links") {
    // links is TEXT[]: row qualifies if it has any element. Use NOT eq '{}'.
    req = req.not("links", "eq", "{}");
  }
  // files / videos are filtered post-fetch on attachments mime prefix because
  // jsonb_path filters via supabase-js are clunky. Fast enough for chat sizes.

  const { data } = await req;
  let rows = ((data ?? []) as unknown as Array<ChatMessage & { [k: string]: unknown }>).map((r) => ({
    ...r,
    scope_id: (r as Record<string, unknown>)[scopeFk] as string,
  }));

  if (opts.tab === "files") {
    rows = rows.filter((r) =>
      (r.attachments ?? []).some((a) => !a.type.startsWith("image/") && !a.type.startsWith("video/"))
    );
  } else if (opts.tab === "videos") {
    rows = rows.filter((r) => (r.attachments ?? []).some((a) => a.type.startsWith("video/")));
  }

  // Hydrate thread counts (total + unread for current user) in one batched
  // query. "Unread" = caller not in viewed_by AND caller is not the author.
  const ids = rows.map((r) => r.id);
  if (ids.length > 0) {
    const { data: threadRows } = await ctx.supabase
      .from(BLOCK_TABLES[block].thread as never)
      .select("parent_id, created_by, viewed_by")
      .in("parent_id", ids);
    const total = new Map<string, number>();
    const unread = new Map<string, number>();
    for (const t of (threadRows ?? []) as unknown as Array<{
      parent_id: string;
      created_by: string | null;
      viewed_by: string[] | null;
    }>) {
      total.set(t.parent_id, (total.get(t.parent_id) ?? 0) + 1);
      if (t.created_by === ctx.userId) continue;
      if ((t.viewed_by ?? []).includes(ctx.userId)) continue;
      unread.set(t.parent_id, (unread.get(t.parent_id) ?? 0) + 1);
    }
    rows = rows.map((r) => ({
      ...r,
      thread_count: total.get(r.id) ?? 0,
      thread_unread_count: unread.get(r.id) ?? 0,
    }));
  }

  return rows as ChatMessage[];
}

export async function getThreadMessages(
  block: Exclude<ChatBlock, "chatbot">,
  parentId: string
): Promise<ChatThreadMessage[]> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return [];
  const { thread } = BLOCK_TABLES[block];
  const { data } = await ctx.supabase
    .from(thread as never)
    .select(`id, parent_id, created_by, message, attachments, links, updated_at, created_at, ${PROFILE_SELECT}`)
    .eq("parent_id", parentId)
    .order("created_at", { ascending: true });
  // Thread tables have no `author_type` column — synthesize 'user'.
  return ((data ?? []) as Array<Omit<ChatThreadMessage, "author_type">>).map((r) => ({
    ...r,
    author_type: "user" as const,
  }));
}

export async function sendMessage(
  block: Exclude<ChatBlock, "chatbot">,
  conversationId: string,
  message: string,
  attachments: ChatAttachment[] = []
): Promise<{ row?: ChatMessage; error?: string }> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return { error: ctx.error };
  const trimmed = message.trim();
  if (!trimmed && attachments.length === 0) return { error: "Empty message" };

  const { msg, scopeFk } = BLOCK_TABLES[block];
  const links = extractLinks(trimmed);
  const insertRow: Record<string, unknown> = {
    created_by: ctx.userId,
    author_type: "user",
    message: trimmed,
    attachments,
    links,
  };
  insertRow[scopeFk] = conversationId;

  // Return the full row + joined profile so the optimistic UI insert in
  // <MessageList> doesn't have to wait for the realtime echo.
  const { data, error } = await ctx.supabase
    .from(msg as never)
    .insert(insertRow as never)
    .select(
      `id, ${scopeFk}, created_by, author_type, message, attachments, links, updated_at, created_at, ${PROFILE_SELECT}`
    )
    .single();
  if (error) return { error: error.message };
  revalidatePath("/chat");
  const inserted = data as unknown as ChatMessage & {
    [k: string]: unknown;
  };
  const row: ChatMessage = {
    ...inserted,
    scope_id: (inserted as Record<string, unknown>)[scopeFk] as string,
    thread_count: 0,
  };
  return { row };
}

export async function replyInThread(
  block: Exclude<ChatBlock, "chatbot">,
  parentId: string,
  conversationId: string,
  message: string,
  attachments: ChatAttachment[] = []
): Promise<{ row?: ChatThreadMessage; error?: string }> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return { error: ctx.error };
  const trimmed = message.trim();
  if (!trimmed && attachments.length === 0) return { error: "Empty message" };

  const { thread, scopeFk } = BLOCK_TABLES[block];
  const links = extractLinks(trimmed);
  const insertRow: Record<string, unknown> = {
    parent_id: parentId,
    created_by: ctx.userId,
    message: trimmed,
    attachments,
    links,
  };
  insertRow[scopeFk] = conversationId;

  // Thread tables have no `author_type` column — replies are always 'user'.
  // We synthesize it on the returned row to match the ChatThreadMessage shape.
  const { data, error } = await ctx.supabase
    .from(thread as never)
    .insert(insertRow as never)
    .select(
      `id, parent_id, created_by, message, attachments, links, updated_at, created_at, ${PROFILE_SELECT}`
    )
    .single();
  if (error) return { error: error.message };
  revalidatePath("/chat");
  const row = data as unknown as Omit<ChatThreadMessage, "author_type">;
  return { row: { ...row, author_type: "user" } as ChatThreadMessage };
}

export async function editMessage(
  block: Exclude<ChatBlock, "chatbot">,
  messageId: string,
  message: string,
  attachments: ChatAttachment[],
  isThread: boolean
): Promise<{ error?: string }> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return { error: ctx.error };
  const { msg, thread } = BLOCK_TABLES[block];
  const table = isThread ? thread : msg;
  const links = extractLinks(message);
  const { error } = await ctx.supabase
    .from(table as never)
    // edited_at was renamed to updated_at in B8; the trigger keeps it
    // fresh automatically, but we write it explicitly here so an edit
    // shows the bumped timestamp in the same RPC.
    .update({ message, attachments, links, updated_at: new Date().toISOString() } as never)
    .eq("id", messageId);
  if (error) return { error: error.message };
  revalidatePath("/chat");
  return {};
}

export async function deleteMessage(
  block: Exclude<ChatBlock, "chatbot">,
  messageId: string,
  isThread: boolean
): Promise<{ error?: string }> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return { error: ctx.error };
  const { msg, thread } = BLOCK_TABLES[block];
  const table = isThread ? thread : msg;

  // Pull attachments first so we can clean up storage.
  const { data: existing } = await ctx.supabase
    .from(table as never)
    .select("attachments")
    .eq("id", messageId)
    .single();
  const attachments = ((existing as unknown as { attachments?: ChatAttachment[] } | null)?.attachments ?? []) as ChatAttachment[];
  const paths = Array.isArray(attachments) ? attachments.map((a) => a.path).filter(Boolean) : [];
  if (paths.length > 0) {
    await ctx.supabase.storage.from("chat-attachments").remove(paths);
  }

  const { error } = await ctx.supabase.from(table as never).delete().eq("id", messageId);
  if (error) return { error: error.message };
  revalidatePath("/chat");
  return {};
}

// ── Conversation header (title + picture) ───────────────────────────────────

export async function getConversationHeader(
  block: Exclude<ChatBlock, "chatbot">,
  conversationId: string
): Promise<{ title: string | null; picture: string | null } | null> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return null;
  if (block === "private") {
    const { data } = await ctx.supabase
      .from("conversation_private")
      .select("participant_user_ids, title")
      .eq("id", conversationId)
      .single();
    const row = data as { participant_user_ids?: string[]; title?: string | null } | null;
    const others = (row?.participant_user_ids ?? []).filter((id) => id !== ctx.userId);
    if (others.length === 0) return { title: row?.title ?? "Private", picture: null };

    // Group conversation (3+ participants — i.e. caller + 2+ others).
    if (others.length > 1) {
      if (row?.title && row.title.trim()) {
        return { title: row.title.trim(), picture: null };
      }
      // No explicit title → render "<First> + N others".
      const { data: peers } = await ctx.supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", others);
      const names = (peers ?? []).map((p) => {
        const x = p as { first_name: string | null; last_name: string | null };
        return `${x.first_name ?? ""} ${x.last_name ?? ""}`.trim() || "Someone";
      });
      const firstTwo = names.slice(0, 2).join(", ");
      const rest = names.length > 2 ? ` + ${names.length - 2} more` : "";
      return { title: firstTwo + rest, picture: null };
    }

    // 1:1 — render the peer's name.
    const peerId = others[0];
    const { data: peer } = await ctx.supabase
      .from("profiles")
      .select("first_name, last_name, picture")
      .eq("id", peerId)
      .single();
    const p = peer as { first_name: string | null; last_name: string | null; picture: string | null } | null;
    return {
      title: p ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "User" : "Unknown",
      picture: p?.picture ?? null,
    };
  }
  if (block === "internal_projects") {
    const { data } = await ctx.supabase
      .from("internal_project")
      .select("name")
      .eq("id", conversationId)
      .single();
    return { title: (data as { name: string | null } | null)?.name ?? null, picture: null };
  }
  // projects / projects_internal share the project row.
  const { data } = await ctx.supabase
    .from("project")
    .select("name, picture")
    .eq("id", conversationId)
    .single();
  const p = data as { name: string | null; picture: string | null } | null;
  return { title: p?.name ?? null, picture: p?.picture ?? null };
}

// ── ChatBot ─────────────────────────────────────────────────────────────────

export async function listChatbotSessions(): Promise<ChatbotConversationRow[]> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return [];
  const { data } = await ctx.supabase
    .from("private_chatbot")
    // private_chatbot.owner_id was renamed to created_by in B8 (item 35).
    .select("id, created_by, title, created_at, updated_at");
  const rows = (data ?? []) as ChatbotConversationRow[];
  if (rows.length === 0) return [];

  const { data: lastMsgsData } = await ctx.supabase
    .from("private_chatbot_message")
    .select("chatbot_id, created_at")
    .in("chatbot_id", rows.map((r) => r.id))
    .order("created_at", { ascending: false })
    .limit(2000);
  const latestBySession = new Map<string, string>();
  for (const m of (lastMsgsData ?? []) as Array<{ chatbot_id: string; created_at: string }>) {
    if (!latestBySession.has(m.chatbot_id)) latestBySession.set(m.chatbot_id, m.created_at);
  }
  rows.sort((a, b) => {
    const aT = latestBySession.get(a.id) ?? a.updated_at ?? "";
    const bT = latestBySession.get(b.id) ?? b.updated_at ?? "";
    return bT < aT ? -1 : bT > aT ? 1 : 0;
  });
  return rows;
}

export async function createChatbotSession(title?: string): Promise<{ id?: string; error?: string }> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return { error: ctx.error };
  const { data, error } = await ctx.supabase
    .from("private_chatbot")
    .insert({ created_by: ctx.userId, title: title?.trim() || "New chat" })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/chat");
  return { id: (data as { id: string }).id };
}

export async function renameChatbotSession(id: string, title: string): Promise<{ error?: string }> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return { error: ctx.error };
  const { error } = await ctx.supabase
    .from("private_chatbot")
    .update({ title: title.trim() || "Untitled" })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/chat");
  return {};
}

export async function deleteChatbotSession(id: string): Promise<{ error?: string }> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return { error: ctx.error };
  const { error } = await ctx.supabase.from("private_chatbot").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/chat");
  return {};
}

export async function getChatbotMessages(chatbotId: string): Promise<ChatbotMessageRow[]> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return [];
  const { data } = await ctx.supabase
    .from("private_chatbot_message")
    // created_by was added in B9 (item 36); legacy rows have it null,
    // so we coalesce to the current user when hydrating client-side.
    .select("id, chatbot_id, author_type, message, tool_calls, created_at, created_by, updated_at")
    .eq("chatbot_id", chatbotId)
    .order("created_at", { ascending: true });
  return ((data ?? []) as Array<Partial<ChatbotMessageRow>>).map((m) => ({
    ...(m as ChatbotMessageRow),
    created_by: m.created_by ?? ctx.userId,
  }));
}

export async function sendChatbotMessage(
  chatbotId: string,
  message: string
): Promise<{ userMsg?: ChatbotMessageRow; botMsg?: ChatbotMessageRow; error?: string }> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return { error: ctx.error };
  const trimmed = message.trim();
  if (!trimmed) return { error: "Empty message" };

  const { data: userRow, error: userErr } = await ctx.supabase
    .from("private_chatbot_message")
    // created_by was added in B9 (item 36) — set it explicitly so legacy
    // rows aren't created with null authors.
    .insert({ chatbot_id: chatbotId, author_type: "user", message: trimmed, created_by: ctx.userId })
    .select("id, chatbot_id, author_type, message, tool_calls, created_at, created_by, updated_at")
    .single();
  if (userErr || !userRow) return { error: userErr?.message ?? "Failed to save message" };

  // Bump updated_at on the parent session.
  await ctx.supabase
    .from("private_chatbot")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", chatbotId);

  // If first message, set the title to the first 60 chars.
  const { count } = await ctx.supabase
    .from("private_chatbot_message")
    .select("id", { count: "exact", head: true })
    .eq("chatbot_id", chatbotId);
  if ((count ?? 0) <= 1) {
    await ctx.supabase
      .from("private_chatbot")
      .update({ title: trimmed.slice(0, 60) })
      .eq("id", chatbotId);
  }

  const userMsg = {
    ...(userRow as ChatbotMessageRow),
    created_by: (userRow as ChatbotMessageRow).created_by ?? ctx.userId,
  } as ChatbotMessageRow;

  const turn = await runChatbotTurn(chatbotId);
  if (turn.error) {
    // runChatbotTurn already inserts a fallback assistant message on
    // failure, so we still return it as botMsg if available.
    return { userMsg, botMsg: turn.botMsg, error: turn.error };
  }
  return { userMsg, botMsg: turn.botMsg };
}

// ── Conversation members CRUD ──────────────────────────────────────────────
//
// Manages the project.external_conversation_authorized_users and
// project.internal_conversation_authorized_users arrays. Only admin/manager
// can edit; the trigger `project_fill_conversation_users` is now INSERT-only
// so manual edits survive subsequent updates of `authorized_users`.

type ConversationChannel = "external" | "internal";

const CONVERSATION_COLUMN: Record<ConversationChannel, string> = {
  external: "external_conversation_authorized_users",
  internal: "internal_conversation_authorized_users",
};

export interface ConversationMember {
  id: string;
  first_name: string | null;
  last_name: string | null;
  picture: string | null;
  type: string | null;
}

export async function getConversationMembers(
  projectId: string,
  channel: ConversationChannel
): Promise<ConversationMember[]> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return [];
  if (ctx.userType !== "admin" && ctx.userType !== "manager") return [];
  const col = CONVERSATION_COLUMN[channel];
  const { data: project } = await ctx.supabase
    .from("project")
    .select(`id, ${col}`)
    .eq("id", projectId)
    .single();
  const ids = ((project as Record<string, unknown> | null)?.[col] ?? []) as string[];
  if (ids.length === 0) return [];
  const { data: profiles } = await ctx.supabase
    .from("profiles")
    .select("id, first_name, last_name, picture, type")
    .in("id", ids);
  return (profiles ?? []) as ConversationMember[];
}

async function mutateConversationMember(
  projectId: string,
  channel: ConversationChannel,
  userId: string,
  op: "add" | "remove"
): Promise<{ error?: string }> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return { error: ctx.error };
  if (ctx.userType !== "admin" && ctx.userType !== "manager") {
    return { error: "Only admins and managers can change conversation members." };
  }
  const col = CONVERSATION_COLUMN[channel];

  // Read current array, mutate, write back. We can't use atomic array_append
  // through supabase-js easily, and since the trigger is now INSERT-only,
  // a read-modify-write is safe for our scale.
  const { data: row } = await ctx.supabase
    .from("project")
    .select(`id, ${col}`)
    .eq("id", projectId)
    .single();
  if (!row) return { error: "Project not found" };
  // Dynamic select string defeats supabase-js's literal-type inference, so
  // `row` is typed as a ParserError. Round-trip through `unknown` so we can
  // index into it safely.
  const current = (((row as unknown) as Record<string, unknown>)[col] ?? []) as string[];
  const next =
    op === "add"
      ? Array.from(new Set([...current, userId]))
      : current.filter((id) => id !== userId);
  if (next.length === current.length && op === "add") {
    return {}; // already a member — no-op
  }

  const { error } = await ctx.supabase
    .from("project")
    .update({ [col]: next } as never)
    .eq("id", projectId);
  if (error) return { error: error.message };
  revalidatePath("/chat");
  return {};
}

export async function addConversationMember(
  projectId: string,
  channel: ConversationChannel,
  userId: string
): Promise<{ error?: string }> {
  return mutateConversationMember(projectId, channel, userId, "add");
}

export async function removeConversationMember(
  projectId: string,
  channel: ConversationChannel,
  userId: string
): Promise<{ error?: string }> {
  return mutateConversationMember(projectId, channel, userId, "remove");
}

// ── Project tab data fetchers ──────────────────────────────────────────────
//
// Used by ConversationPane to render the same Files / Links / Videos /
// Daily Feedback UI that /docs already ships, when the user clicks one of
// those tabs on a Projects (or Projects Internal) conversation. RLS on
// project_file / project_link / project_video / project_daily_feedback
// already gates the rows the same way /docs does.

export async function getProjectFiles(projectId: string): Promise<ProjectFile[]> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return [];
  const { data } = await ctx.supabase
    .from("project_file")
    .select("id, project_id, name, attachments, created_by, created_at, updated_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  return ((data ?? []) as unknown as Array<
    Omit<ProjectFile, "attachments"> & { attachments: unknown }
  >).map((f) => ({
    ...f,
    attachments: Array.isArray(f.attachments) ? (f.attachments as DocsAttachment[]) : [],
  }));
}

export async function getProjectLinks(projectId: string): Promise<ProjectLink[]> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return [];
  const { data } = await ctx.supabase
    .from("project_link")
    .select("id, project_id, name, url, created_by, created_at, updated_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as ProjectLink[];
}

export async function getProjectVideos(projectId: string): Promise<ProjectVideo[]> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return [];
  const { data } = await ctx.supabase
    .from("project_video")
    .select("id, project_id, name, url, created_by, created_at, updated_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as ProjectVideo[];
}

export async function getProjectDailyFeedbacks(
  projectId: string
): Promise<ProjectDailyFeedback[]> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return [];
  const { data } = await ctx.supabase
    .from("project_work_feedback")
    .select(
      "id, project_id, date, start_date, end_date, total_time, current_work, next_work, blockers, video_and_links, created_by, created_at, updated_at"
    )
    .eq("project_id", projectId)
    .order("date", { ascending: false });
  return (data ?? []) as unknown as ProjectDailyFeedback[];
}

// ── Client Requests / QA Requests tab bundle ───────────────────────────────

/**
 * One-shot fetch for the chat-side Client/QA Requests kanban. Returns the
 * project's tasks + assignees + visible profiles + per-task unread comment
 * counts + the project's authorized_users[] array — everything TasksKanban
 * needs to render.
 *
 * RLS already clamps tasks to projects the caller can see, so the only
 * extra work here is the unread-comment fold (mirrors src/app/projects/page.tsx).
 */
export async function getProjectTabBundle(projectId: string): Promise<{
  tasks: Array<Record<string, unknown>>;
  profiles: Array<Record<string, unknown>>;
  authorizedUserIds: string[];
  unreadByTaskId: Record<string, number>;
  currentUserId: string;
  error?: string;
}> {
  const ctx = await requireChatUser();
  if ("error" in ctx) {
    return {
      tasks: [],
      profiles: [],
      authorizedUserIds: [],
      unreadByTaskId: {},
      currentUserId: "",
      error: ctx.error,
    };
  }
  const [{ data: tasks }, { data: profiles }, { data: project }, { data: unread }] =
    await Promise.all([
      ctx.supabase
        .from("project_task")
        .select(
          // Part 2 item 10/34: assignees is now a UUID[] column. The
          // hydration into the legacy task_assignees shape happens below.
          "id, project_id, parent_task_id, name, order, start_date_estimated, end_date_estimated, start_date_real, end_date_real, real_time, estimated_time, type, level, status, assignees"
        )
        .eq("project_id", projectId),
      ctx.supabase
        .from("profiles")
        .select("id, first_name, last_name, picture, type"),
      ctx.supabase
        .from("project")
        .select("authorized_users")
        .eq("id", projectId)
        .single(),
      ctx.supabase
        .from("project_task_comment")
        // task_comment.owner_id was renamed to created_by in B8 (item 32).
        .select("task_id, viewed_by")
        .eq("project_id", projectId)
        .neq("created_by", ctx.userId),
    ]);
  const unreadByTaskId: Record<string, number> = {};
  for (const row of (unread ?? []) as Array<{ task_id: string; viewed_by: string[] | null }>) {
    if ((row.viewed_by ?? []).includes(ctx.userId)) continue;
    unreadByTaskId[row.task_id] = (unreadByTaskId[row.task_id] ?? 0) + 1;
  }

  // Hydrate assignees UUID[] → legacy task_assignees: [{user_id, profiles}]
  // shape so existing UI components keep working.
  const allProfiles = (profiles ?? []) as Array<{ id: string; first_name: string | null; last_name: string | null; picture: string | null }>;
  const profileById = new Map(allProfiles.map((p) => [p.id, p]));
  const hydratedTasks = ((tasks ?? []) as Array<Record<string, unknown> & { assignees?: string[] }>).map((t) => ({
    ...t,
    task_assignees: ((t.assignees ?? []) as string[]).map((uid) => ({
      user_id: uid,
      profiles: profileById.get(uid) ?? null,
    })),
  }));

  return {
    tasks: hydratedTasks as Array<Record<string, unknown>>,
    profiles: (profiles ?? []) as Array<Record<string, unknown>>,
    authorizedUserIds:
      ((project as { authorized_users: string[] | null } | null)?.authorized_users ?? []) as string[],
    unreadByTaskId,
    currentUserId: ctx.userId,
  };
}

// ── Internal Project Tasks tab bundle ──────────────────────────────────────

/**
 * One-shot fetch for the chat-side Internal Projects "Tasks" tab. Returns
 * the internal_project + its tasks + assignees + visible profiles + time
 * tracks + key results — everything `InternalProjectKanban` needs to render.
 *
 * RLS already clamps tables to staff visibility. This mirrors the loads in
 * `src/app/internal-projects/page.tsx` (detail view).
 */
export async function getInternalProjectTaskBundle(
  internalProjectId: string
): Promise<{
  project: Record<string, unknown> | null;
  tasks: Array<Record<string, unknown>>;
  profiles: Array<Record<string, unknown>>;
  projectAssignees: Array<Record<string, unknown>>;
  timeTracks: Array<Record<string, unknown>>;
  keyResults: Array<Record<string, unknown>>;
  currentUserId: string;
  error?: string;
}> {
  const ctx = await requireChatUser();
  if ("error" in ctx) {
    return {
      project: null,
      tasks: [],
      profiles: [],
      projectAssignees: [],
      timeTracks: [],
      keyResults: [],
      currentUserId: "",
      error: ctx.error,
    };
  }
  const [
    { data: project },
    { data: tasks },
    { data: projAssignees },
    { data: timeTracks },
    { data: profiles },
    { data: keyResults },
  ] = await Promise.all([
    ctx.supabase.from("internal_project").select("*").eq("id", internalProjectId).single(),
    ctx.supabase
      .from("internal_project_task")
      .select("*")
      .eq("internal_project_id", internalProjectId)
      .order("order", { ascending: true }),
    ctx.supabase
      .from("internal_project_assignees")
      .select("internal_project_id, user_id")
      .eq("internal_project_id", internalProjectId),
    ctx.supabase
      .from("internal_project_task_time_track")
      .select("*")
      .eq("internal_project_id", internalProjectId),
    ctx.supabase.from("profiles").select("id, first_name, last_name, picture, type"),
    ctx.supabase
      .from("internal_key_result")
      .select("id, name, internal_goal_id"),
  ]);
  return {
    project: (project ?? null) as Record<string, unknown> | null,
    tasks: (tasks ?? []) as Array<Record<string, unknown>>,
    profiles: (profiles ?? []) as Array<Record<string, unknown>>,
    projectAssignees: (projAssignees ?? []) as Array<Record<string, unknown>>,
    timeTracks: (timeTracks ?? []) as Array<Record<string, unknown>>,
    keyResults: (keyResults ?? []) as Array<Record<string, unknown>>,
    currentUserId: ctx.userId,
  };
}

/** Returns the full project row + visible profiles for tabs that need them
 *  (DailyFeedbackTab requires a Project + UserProfile[] + currentUserId).
 *  Uses service client to bypass RLS on the project fetch, then manually
 *  verifies the caller is in authorized_users (admins bypass the check). */
export async function getProjectForTabs(
  projectId: string
): Promise<{
  project: Record<string, unknown> | null;
  profiles: Array<Record<string, unknown>>;
  currentUserId: string;
  isAdminOrManager: boolean;
}> {
  const ctx = await requireChatUser();
  if ("error" in ctx) {
    return { project: null, profiles: [], currentUserId: "", isAdminOrManager: false };
  }
  const svc = createServiceClient();
  const [{ data: project }, { data: profiles }] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (svc as any)
      .from("project")
      .select(
        "id, name, picture, status, stage, program, description, price, referrer_commission, start_date_real, end_date_real, start_date_estimated, end_date_estimated, estimated_time, real_time, authorized_users, change_automatically_project_estimated_time, change_automatically_milestone_estimated_time, change_automatically_project_start_end_dates, change_automatically_milestone_start_end_dates, talent_who_recommended_id, company_that_recommended_id, created_at"
      )
      .eq("id", projectId)
      .single(),
    ctx.supabase
      .from("profiles")
      .select("id, first_name, last_name, picture, type"),
  ]);
  // Manual authorization: admins always pass; others must be in authorized_users
  if (project && ctx.userType !== "admin") {
    const au = ((project as Record<string, unknown>).authorized_users as string[]) ?? [];
    if (!au.includes(ctx.userId)) {
      return { project: null, profiles: [], currentUserId: ctx.userId, isAdminOrManager: false };
    }
  }
  return {
    project: (project ?? null) as Record<string, unknown> | null,
    profiles: (profiles ?? []) as Array<Record<string, unknown>>,
    currentUserId: ctx.userId,
    isAdminOrManager: ctx.userType === "admin" || ctx.userType === "manager",
  };
}

// ── Project-scoped chatbot ──────────────────────────────────────────────────
//
// Two tables: project_chatbot_message (Projects block, external) and
// project_internal_chatbot_message (Projects Internal block, staff-only).
// Both keyed by project_id; the conversation is shared across every member
// of the project. RLS clamps reads/writes to authorized members.

const PROJECT_BOT_TABLES: Record<ProjectChatbotScope, string> = {
  external: "project_chatbot_message",
  internal: "project_internal_chatbot_message",
};

function blockToProjectBotScope(
  block: Exclude<ChatBlock, "chatbot">
): ProjectChatbotScope | null {
  if (block === "projects") return "external";
  return null;
}

export async function getProjectChatbotMessages(
  block: Exclude<ChatBlock, "chatbot">,
  projectId: string
): Promise<ProjectChatbotMessageRow[]> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return [];
  const scope = blockToProjectBotScope(block);
  if (!scope) return [];
  const table = PROJECT_BOT_TABLES[scope];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (ctx.supabase as any)
    .from(table)
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  return (data ?? []) as ProjectChatbotMessageRow[];
}

export async function sendProjectChatbotMessage(
  block: Exclude<ChatBlock, "chatbot">,
  projectId: string,
  message: string
): Promise<{
  userMsg?: ProjectChatbotMessageRow;
  botMsg?: ProjectChatbotMessageRow;
  error?: string;
}> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return { error: ctx.error };
  const scope = blockToProjectBotScope(block);
  if (!scope) return { error: "Chatbot is only available on projects/projects_internal blocks." };
  const trimmed = message.trim();
  if (!trimmed) return { error: "Empty message" };

  const table = PROJECT_BOT_TABLES[scope];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userRow, error: userErr } = await (ctx.supabase as any)
    .from(table)
    .insert({
      project_id: projectId,
      // project_chatbot_message.owner_id renamed → created_by (B8 item 38/39)
      created_by: ctx.userId,
      author_type: "user",
      message: trimmed,
    })
    .select("*")
    .single();
  if (userErr || !userRow) return { error: userErr?.message ?? "Failed to save message" };

  const turn = await runProjectChatbotTurn(scope, projectId);
  if (turn.error) {
    return {
      userMsg: userRow as ProjectChatbotMessageRow,
      botMsg: turn.botMsg,
      error: turn.error,
    };
  }
  return {
    userMsg: userRow as ProjectChatbotMessageRow,
    botMsg: turn.botMsg,
  };
}

// ── Internal-project file / link / video / daily-feedback tabs ───────────────

export async function getInternalProjectMeta(
  _internalProjectId: string
): Promise<{
  profiles: Array<{ id: string; first_name: string | null; last_name: string | null; picture: string | null }>;
  currentUserId: string;
  isAdminOrManager: boolean;
}> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return { profiles: [], currentUserId: "", isAdminOrManager: false };
  const { data: profiles } = await ctx.supabase
    .from("profiles")
    .select("id, first_name, last_name, picture");
  return {
    profiles: (profiles ?? []) as Array<{ id: string; first_name: string | null; last_name: string | null; picture: string | null }>,
    currentUserId: ctx.userId,
    isAdminOrManager: ctx.userType === "admin" || ctx.userType === "manager",
  };
}

export async function getInternalProjectFiles(internalProjectId: string): Promise<InternalProjectFile[]> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (ctx.supabase as any)
    .from("internal_project_file")
    .select("id, internal_project_id, name, attachments, created_by, created_at, updated_at")
    .eq("internal_project_id", internalProjectId)
    .order("created_at", { ascending: false });
  return ((data ?? []) as unknown as Array<Omit<InternalProjectFile, "attachments"> & { attachments: unknown }>).map((f) => ({
    ...f,
    attachments: Array.isArray(f.attachments) ? (f.attachments as DocsAttachment[]) : [],
  }));
}

export async function createInternalProjectFile(input: {
  internalProjectId: string;
  name: string;
  attachments: DocsAttachment[];
}): Promise<{ error?: string }> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return { error: ctx.error };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (ctx.supabase as any)
    .from("internal_project_file")
    .insert({ internal_project_id: input.internalProjectId, name: input.name, attachments: input.attachments, created_by: ctx.userId });
  if (error) return { error: error.message };
  revalidatePath("/chat");
  return {};
}

export async function updateInternalProjectFile(
  id: string,
  input: { name: string; attachments: DocsAttachment[] }
): Promise<{ error?: string }> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return { error: ctx.error };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (ctx.supabase as any)
    .from("internal_project_file")
    .update({ name: input.name, attachments: input.attachments })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/chat");
  return {};
}

export async function deleteInternalProjectFile(id: string): Promise<{ error?: string }> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return { error: ctx.error };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (ctx.supabase as any).from("internal_project_file").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/chat");
  return {};
}

export async function getInternalProjectLinks(internalProjectId: string): Promise<InternalProjectLink[]> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (ctx.supabase as any)
    .from("internal_project_link")
    .select("id, internal_project_id, name, url, created_by, created_at, updated_at")
    .eq("internal_project_id", internalProjectId)
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as InternalProjectLink[];
}

export async function createInternalProjectLink(input: {
  internalProjectId: string;
  name: string;
  url: string;
}): Promise<{ error?: string }> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return { error: ctx.error };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (ctx.supabase as any)
    .from("internal_project_link")
    .insert({ internal_project_id: input.internalProjectId, name: input.name, url: input.url, created_by: ctx.userId });
  if (error) return { error: error.message };
  revalidatePath("/chat");
  return {};
}

export async function updateInternalProjectLink(
  id: string,
  input: { name: string; url: string }
): Promise<{ error?: string }> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return { error: ctx.error };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (ctx.supabase as any)
    .from("internal_project_link")
    .update({ name: input.name, url: input.url })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/chat");
  return {};
}

export async function deleteInternalProjectLink(id: string): Promise<{ error?: string }> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return { error: ctx.error };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (ctx.supabase as any).from("internal_project_link").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/chat");
  return {};
}

export async function getInternalProjectVideos(internalProjectId: string): Promise<InternalProjectVideo[]> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (ctx.supabase as any)
    .from("internal_project_video")
    .select("id, internal_project_id, name, url, created_by, created_at, updated_at")
    .eq("internal_project_id", internalProjectId)
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as InternalProjectVideo[];
}

export async function createInternalProjectVideo(input: {
  internalProjectId: string;
  name: string;
  url: string;
}): Promise<{ error?: string }> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return { error: ctx.error };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (ctx.supabase as any)
    .from("internal_project_video")
    .insert({ internal_project_id: input.internalProjectId, name: input.name, url: input.url, created_by: ctx.userId });
  if (error) return { error: error.message };
  revalidatePath("/chat");
  return {};
}

export async function updateInternalProjectVideo(
  id: string,
  input: { name: string; url: string }
): Promise<{ error?: string }> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return { error: ctx.error };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (ctx.supabase as any)
    .from("internal_project_video")
    .update({ name: input.name, url: input.url })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/chat");
  return {};
}

export async function deleteInternalProjectVideo(id: string): Promise<{ error?: string }> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return { error: ctx.error };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (ctx.supabase as any).from("internal_project_video").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/chat");
  return {};
}

export async function getInternalProjectDailyFeedbacks(internalProjectId: string): Promise<InternalProjectDailyFeedback[]> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (ctx.supabase as any)
    .from("internal_project_work_feedback")
    .select("id, internal_project_id, date, start_date, end_date, total_time, current_work, next_work, blockers, video_and_links, created_by, created_at, updated_at")
    .eq("internal_project_id", internalProjectId)
    .order("date", { ascending: false });
  return (data ?? []) as unknown as InternalProjectDailyFeedback[];
}

function buildInternalFeedbackMessage(fields: {
  date: string;
  start_date: string | null;
  end_date: string | null;
  total_time: number | null;
  current_work: string | null;
  next_work: string | null;
  blockers: string | null;
  video_and_links: string | null;
}): string {
  const s = (label: string, html: string | null) =>
    `<p><strong>${label}</strong></p>${html ?? "<p>—</p>"}`;
  const period =
    fields.start_date && fields.end_date
      ? `${fields.start_date} → ${fields.end_date}`
      : fields.start_date ?? fields.date;
  const totalLine =
    fields.total_time != null
      ? `<p><strong>Total time worked:</strong> ${fields.total_time}h</p>`
      : "";
  return [
    `<p><strong>📋 Work Feedback – ${period}</strong></p>`,
    totalLine,
    s("What I worked on this period", fields.current_work),
    s("What I will work on next", fields.next_work),
    s("Blockers", fields.blockers),
    s("Video &amp; Links", fields.video_and_links),
  ].join("");
}

export async function createInternalProjectDailyFeedback(input: {
  internalProjectId: string;
  start_date: string | null;
  end_date: string | null;
  total_time: number | null;
  current_work: string | null;
  next_work: string | null;
  blockers: string | null;
  video_and_links: string | null;
}): Promise<{ error?: string }> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return { error: ctx.error };
  const { internalProjectId, ...rest } = input;
  // Legacy NOT NULL `date` mirrors the work-period start.
  const legacyDate = input.start_date ?? new Date().toISOString().slice(0, 10);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (ctx.supabase as any)
    .from("internal_project_work_feedback")
    .insert({ internal_project_id: internalProjectId, created_by: ctx.userId, date: legacyDate, ...rest })
    .select("id")
    .single();
  if (error) return { error: error.message };

  // Create linked chat message so the feedback appears in the internal project chat.
  if (data?.id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svc = createServiceClient() as any;
    const { data: msg } = await svc
      .from("conversation_internal_project_message")
      .insert({
        internal_project_id: internalProjectId,
        created_by:          ctx.userId,
        author_type:         "user",
        message:             buildInternalFeedbackMessage({ ...input, date: legacyDate }),
        attachments:         [],
        links:               [],
      })
      .select("id")
      .single();
    if (msg?.id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (ctx.supabase as any)
        .from("internal_project_work_feedback")
        .update({ conversation_internal_project_message_id: msg.id })
        .eq("id", data.id);
    }
  }

  revalidatePath("/chat");
  return {};
}

export async function updateInternalProjectDailyFeedback(
  id: string,
  input: {
    start_date: string | null;
    end_date: string | null;
    total_time: number | null;
    current_work: string | null;
    next_work: string | null;
    blockers: string | null;
    video_and_links: string | null;
  }
): Promise<{ error?: string }> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return { error: ctx.error };
  // Keep the legacy `date` column aligned with the work-period start.
  const updates: Record<string, unknown> = { ...input };
  if (input.start_date) updates.date = input.start_date;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (ctx.supabase as any)
    .from("internal_project_work_feedback")
    .update(updates)
    .eq("id", id);
  if (error) return { error: error.message };

  // Sync updated fields to the linked chat message.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: fb } = await (ctx.supabase as any)
    .from("internal_project_work_feedback")
    .select("date, start_date, end_date, total_time, current_work, next_work, blockers, video_and_links, conversation_internal_project_message_id")
    .eq("id", id)
    .single();
  if (fb?.conversation_internal_project_message_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svc = createServiceClient() as any;
    await svc
      .from("conversation_internal_project_message")
      .update({ message: buildInternalFeedbackMessage(fb) })
      .eq("id", fb.conversation_internal_project_message_id);
  }

  revalidatePath("/chat");
  return {};
}

export async function deleteInternalProjectDailyFeedback(id: string): Promise<{ error?: string }> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return { error: ctx.error };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (ctx.supabase as any).from("internal_project_work_feedback").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/chat");
  return {};
}

// ── Emoji reactions ───────────────────────────────────────────────────────────

/**
 * Load emoji reactions for a batch of message IDs.
 * Works for both top-level messages (isThread=false) and thread replies
 * (isThread=true). Returns a map keyed by message id → sorted reaction list.
 * `user_reacted` is pre-computed so the client doesn't need to know the userId.
 */
export async function getReactions(
  block: Exclude<ChatBlock, "chatbot">,
  messageIds: string[],
  isThread: boolean,
): Promise<Record<string, EmojiReaction[]>> {
  if (messageIds.length === 0) return {};
  const ctx = await requireChatUser();
  if ("error" in ctx) return {};

  const { msg, thread } = BLOCK_TABLES[block];
  const baseTable = isThread ? thread : msg;
  const tableName  = `${baseTable}_emoji`;
  const fkCol      = `${baseTable}_id`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (ctx.supabase as any)
    .from(tableName)
    .select(`${fkCol}, created_by, emoji_code, profiles(first_name, last_name)`)
    .in(fkCol, messageIds);

  const rows = (data ?? []) as Array<{
    [key: string]: unknown;
    created_by: string;
    emoji_code: string;
    profiles: { first_name: string | null; last_name: string | null } | null;
  }>;

  // Group by (messageId, emoji_code) → aggregate
  const grouped: Record<string, Record<string, { count: number; user_ids: string[]; user_names: string[] }>> = {};
  for (const r of rows) {
    const msgId   = r[fkCol] as string;
    const code    = r.emoji_code;
    const name    = `${r.profiles?.first_name ?? ""} ${r.profiles?.last_name ?? ""}`.trim() || "User";
    if (!grouped[msgId]) grouped[msgId] = {};
    if (!grouped[msgId][code]) grouped[msgId][code] = { count: 0, user_ids: [], user_names: [] };
    grouped[msgId][code].count++;
    grouped[msgId][code].user_ids.push(r.created_by);
    grouped[msgId][code].user_names.push(name);
  }

  const out: Record<string, EmojiReaction[]> = {};
  for (const [msgId, emojiMap] of Object.entries(grouped)) {
    out[msgId] = Object.entries(emojiMap).map(([emoji_code, agg]) => ({
      emoji_code,
      count: agg.count,
      user_names: agg.user_names,
      user_reacted: agg.user_ids.includes(ctx.userId),
    }));
  }
  return out;
}

/**
 * Toggle an emoji reaction on a message. If the caller has already reacted
 * with this emoji it is removed; otherwise it is added. One reaction per
 * (message, user, emoji_code) is enforced by a DB unique constraint.
 */
export async function toggleEmoji(
  block: Exclude<ChatBlock, "chatbot">,
  messageId: string,
  emojiCode: string,
  isThread: boolean,
): Promise<{ error?: string }> {
  const ctx = await requireChatUser();
  if ("error" in ctx) return { error: ctx.error };

  const { msg, thread } = BLOCK_TABLES[block];
  const baseTable = isThread ? thread : msg;
  const tableName  = `${baseTable}_emoji`;
  const fkCol      = `${baseTable}_id`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = ctx.supabase as any;

  const { data: existing } = await supabase
    .from(tableName)
    .select("id")
    .eq(fkCol, messageId)
    .eq("created_by", ctx.userId)
    .eq("emoji_code", emojiCode)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from(tableName).delete().eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from(tableName)
      .insert({ [fkCol]: messageId, created_by: ctx.userId, emoji_code: emojiCode });
    if (error) return { error: error.message };
  }
  return {};
}
