/**
 * Shared types for the /chat feature.
 *
 * The chat hub has 5 blocks (column 1 of the layout):
 *   - projects            → external project conversations
 *                           (table: external_conversation_project_message)
 *   - projects_internal   → staff-only project conversations
 *                           (table: internal_conversation_project_message)
 *   - internal_projects   → company's own initiatives
 *                           (table: conversation_internal_project_message)
 *   - private             → 1:1 conversations
 *                           (table: private_conversation_message)
 *   - chatbot             → per-user AI sessions
 *                           (table: private_chatbot_message)
 *
 * The first four blocks share the same message shape. ChatBot is separate
 * because messages are author=user|chatbot and may carry tool_calls.
 */

export type ChatBlock =
  | "projects"
  | "projects_internal"
  | "internal_projects"
  | "private"
  | "chatbot";

export type ChatTab =
  | "messages"
  | "files"
  | "links"
  | "videos"
  | "daily_feedback"
  | "client_requests"
  | "qa_requests"
  | "chatbot"
  | "tasks";

export type AuthorType = "user" | "chatbot";

export interface ChatAttachment {
  path: string;
  url: string;
  name: string;
  size: number;
  type: string;
}

export interface ChatMessage {
  id: string;
  /** parent scope id — project_id, internal_project_id, or conversation_id */
  scope_id: string;
  /** Renamed from owner_id (Part 2 items 7/9/11/14). */
  created_by: string;
  author_type: AuthorType;
  message: string;
  attachments: ChatAttachment[];
  links: string[];
  /** Renamed from edited_at (Part 2 items 7/9/11/14). */
  updated_at: string | null;
  created_at: string;
  /** Number of replies in the thread for this message (top-level only) */
  thread_count?: number;
  /** Unread thread replies for the current viewer (top-level only) */
  thread_unread_count?: number;
  profiles?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    picture: string | null;
  } | null;
}

export interface ChatThreadMessage {
  id: string;
  parent_id: string;
  /** Renamed from owner_id (Part 2 items 8/10/12/15). */
  created_by: string;
  author_type: AuthorType;
  message: string;
  attachments: ChatAttachment[];
  links: string[];
  /** Renamed from edited_at (Part 2 items 8/10/12/15). */
  updated_at: string | null;
  created_at: string;
  profiles?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    picture: string | null;
  } | null;
}

export interface PrivateConversationRow {
  id: string;
  participant_user_ids: string[];
  created_by: string;
  created_at: string;
  /** Optional title — set for groups (3+ participants). */
  title?: string | null;
  /**
   * Hydrated peer profile. For 1:1 chats it's the other person; for groups
   * it's the first other participant (UI shows `group_label` or `title`
   * instead of the avatar/name pair).
   */
  peer?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    picture: string | null;
    type: string | null;
  };
  /** Computed display label for groups, e.g. "Ann, Bob + 2 more". */
  group_label?: string | null;
  last_message?: { message: string; created_at: string } | null;
  unread_count?: number;
}

export interface ChatbotConversationRow {
  id: string;
  /** Renamed from owner_id (Part 2 item 35). */
  created_by: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatbotMessageRow {
  id: string;
  chatbot_id: string;
  /** Added in Part 2 item 36. The legacy code referred to `owner_id`
   * even though the DB never had that column on this table; we now
   * align with the new `created_by` column added by B9. */
  created_by: string;
  author_type: AuthorType;
  message: string;
  tool_calls: unknown | null;
  created_at: string;
  updated_at?: string;
}

export interface ProjectListRow {
  id: string;
  name: string | null;
  picture: string | null;
  /** Sum of top-level + thread unread messages for the current user. */
  unread_count?: number;
}

export interface InternalProjectListRow {
  id: string;
  name: string | null;
  unread_count?: number;
}

// ── Labels ───────────────────────────────────────────────────────────────────

export const BLOCK_LABELS: Record<ChatBlock, string> = {
  projects:          "Projects",
  projects_internal: "Projects Internal",
  internal_projects: "Internal Projects",
  private:           "Private Conversations",
  chatbot:           "ChatBot",
};

export const TAB_LABELS: Record<ChatTab, string> = {
  messages:        "Messages",
  files:           "Files",
  links:           "Links",
  videos:          "Videos",
  daily_feedback:  "Daily Feedback",
  client_requests: "Client Requests",
  qa_requests:     "QA Requests",
  chatbot:         "Chatbot",
  tasks:           "Tasks",
};

// ── Per-block table router ───────────────────────────────────────────────────

/**
 * Maps each non-chatbot block to its message + thread tables and the
 * column name used to identify the parent scope.
 *
 * Used by server actions and realtime subscriptions to pick the right
 * table without a switch statement.
 */
export const BLOCK_TABLES: Record<
  Exclude<ChatBlock, "chatbot">,
  { msg: string; thread: string; scopeFk: string }
> = {
  projects: {
    // Renamed from external_conversation_project_message[_thread] in
    // Part 2 B6 (item 7/8) — naming is now consistent with the
    // conversation_private / conversation_internal_project families.
    msg:     "conversation_project_external_message",
    thread:  "conversation_project_external_message_thread",
    scopeFk: "project_id",
  },
  projects_internal: {
    // Renamed from internal_conversation_project_message[_thread] in B6
    // (item 9/10).
    msg:     "conversation_project_internal_message",
    thread:  "conversation_project_internal_message_thread",
    scopeFk: "project_id",
  },
  internal_projects: {
    msg:     "conversation_internal_project_message",
    thread:  "conversation_internal_project_message_thread",
    scopeFk: "internal_project_id",
  },
  private: {
    // Renamed from private_conversation_message[_thread] in B6 (item 14/15).
    msg:     "conversation_private_message",
    thread:  "conversation_private_message_thread",
    scopeFk: "conversation_id",
  },
};

// ── User-type gates ──────────────────────────────────────────────────────────

/** Roles that can reach /chat at all */
export const CHAT_ALLOWED_ROLES = [
  "admin",
  "manager",
  "operational",
  "developer",
  "client",
  "qa",
] as const;

/** Visible blocks per user type — clients/qa never see "Projects Internal" */
export function visibleBlocks(userType: string | null): ChatBlock[] {
  if (!userType) return [];
  // The `chatbot` block is restricted to admin/manager/operational per
  // Part 2 item 35-36 — RLS on `private_chatbot{,_message}` enforces the
  // same on the server, this filter keeps the sidebar tidy.
  const isStaff = ["admin", "manager", "operational"].includes(userType);
  if (userType === "client" || userType === "qa") {
    return ["projects", "internal_projects", "private"];
  }
  return [
    "projects",
    "projects_internal",
    "internal_projects",
    "private",
    ...(isStaff ? (["chatbot"] as const) : []),
  ];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Extract URLs from a message body. Used both server-side (insert) and
 *  client-side (preview). Matches http(s)://… up to the first whitespace. */
const URL_RE = /https?:\/\/[^\s<>"']+/gi;
export function extractLinks(text: string): string[] {
  const matches = text.match(URL_RE);
  if (!matches) return [];
  return Array.from(new Set(matches.map((m) => m.replace(/[).,!?]+$/, ""))));
}

/** Classify an attachment for the Files / Videos tabs. */
export function attachmentKind(a: ChatAttachment): "image" | "video" | "file" {
  if (a.type.startsWith("image/")) return "image";
  if (a.type.startsWith("video/")) return "video";
  return "file";
}
