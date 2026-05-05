"use client";

/**
 * MessageItem — single row in the message stream (Slack-style).
 *
 * Grouped rendering: when `grouped` is true (same author + within 5 min
 * of the previous message), we hide the avatar + name + timestamp and
 * indent only the message body; the timestamp surfaces in the left rail
 * on row hover. Top-level messages get a hover toolbar in the top-right
 * with reply / edit / delete affordances.
 */

import { useState } from "react";
import { toast } from "sonner";
import type { ChatBlock, ChatMessage, ChatThreadMessage } from "@/types/chat";
import { deleteMessage, editMessage } from "../actions";
import {
  AttachmentIcon,
  EditIcon,
  DeleteIcon,
  MessageIcon,
  CloseIcon,
  CheckIcon,
} from "@/components/ui/icons";

type AnyMessage = ChatMessage | ChatThreadMessage;

interface Props {
  block: Exclude<ChatBlock, "chatbot">;
  message: AnyMessage;
  isOwn: boolean;
  isThread?: boolean;
  /** When true, render compactly (same author as previous within 5 min). */
  grouped?: boolean;
  /** Open the side thread for this message (only on top-level messages). */
  onOpenThread?: () => void;
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtTimeShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function MessageItem({
  block,
  message,
  isOwn,
  isThread,
  grouped,
  onOpenThread,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.message);

  const name =
    `${message.profiles?.first_name ?? ""} ${message.profiles?.last_name ?? ""}`.trim() ||
    "User";
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const threadCount = !isThread ? (message as ChatMessage).thread_count ?? 0 : 0;
  const threadUnread = !isThread ? (message as ChatMessage).thread_unread_count ?? 0 : 0;

  async function saveEdit() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    const res = await editMessage(block, message.id, trimmed, message.attachments ?? [], !!isThread);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    setEditing(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this message?")) return;
    const res = await deleteMessage(block, message.id, !!isThread);
    if (res.error) {
      toast.error(res.error);
    }
  }

  // Spacing & layout differs for grouped vs first-of-author rows.
  const rowPadding = grouped ? "py-0.5" : "pt-2.5 pb-1";

  return (
    <div className={`relative px-4 ${rowPadding} hover:bg-muted/40 group flex items-start gap-3`}>
      {/* Left rail — avatar OR hover-only timestamp ─────────────── */}
      {grouped ? (
        <div className="w-9 shrink-0 flex justify-center">
          <span className="text-[10px] text-text-muted opacity-0 group-hover:opacity-100 leading-[22px] tabular-nums transition-opacity">
            {fmtTimeShort(message.created_at)}
          </span>
        </div>
      ) : (
        <div className="w-9 h-9 rounded-md bg-muted overflow-hidden shrink-0 flex items-center justify-center text-[11px] font-semibold text-text-muted">
          {message.profiles?.picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={message.profiles.picture} alt="" className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>
      )}

      <div className="min-w-0 flex-1">
        {/* Header — only on first message of an author group ──── */}
        {!grouped && (
          <div className="flex items-baseline gap-2 leading-tight">
            <span className="text-[13.5px] font-semibold text-text-primary">{name}</span>
            <span className="text-[11px] text-text-muted tabular-nums">{fmtTime(message.created_at)}</span>
            {message.updated_at && message.updated_at !== message.created_at && (
              <span className="text-[10px] text-text-muted italic">(edited)</span>
            )}
          </div>
        )}

        {editing ? (
          <div className="mt-1">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              className="input-field text-sm w-full"
              autoFocus
            />
            <div className="flex gap-1.5 mt-1.5">
              <button
                onClick={saveEdit}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-accent text-white hover:bg-accent-hover transition-colors"
              >
                <CheckIcon className="w-3 h-3" strokeWidth={2.5} />
                Save
              </button>
              <button
                onClick={() => {
                  setDraft(message.message);
                  setEditing(false);
                }}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border border-border text-text-secondary hover:text-text-primary hover:bg-muted transition-colors"
              >
                <CloseIcon className="w-3 h-3" strokeWidth={2.5} />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className={`text-[14px] text-text-primary whitespace-pre-wrap break-words ${grouped ? "" : "mt-0.5"} leading-[1.45]`}>
            {renderBody(message.message)}
          </div>
        )}

        {/* Attachments ──────────────────────────────────────── */}
        {Array.isArray(message.attachments) && message.attachments.length > 0 && !editing && (
          <ul className="mt-1.5 flex flex-wrap gap-2">
            {message.attachments.map((a) => (
              <li key={a.path}>
                {a.type.startsWith("image/") ? (
                  <a href={a.url} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={a.url}
                      alt={a.name}
                      className="max-h-48 rounded-md border border-border"
                    />
                  </a>
                ) : a.type.startsWith("video/") ? (
                  <video src={a.url} controls className="max-h-48 rounded-md border border-border" />
                ) : (
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-border bg-elevated hover:bg-muted transition-colors text-text-primary"
                  >
                    <AttachmentIcon className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.8} />
                    <span className="truncate max-w-[200px]">{a.name}</span>
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Thread chip — Slack-style ─────────────────────────── */}
        {!isThread && onOpenThread && (threadCount > 0 || threadUnread > 0) && (
          <button
            onClick={onOpenThread}
            className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-transparent hover:border-border hover:bg-elevated transition-colors text-[11.5px] text-accent font-medium"
          >
            <MessageIcon className="w-3 h-3" strokeWidth={2} />
            <span>
              {threadCount > 0
                ? `${threadCount} ${threadCount === 1 ? "reply" : "replies"}`
                : "View thread"}
            </span>
            {threadUnread > 0 && (
              <span
                className="inline-flex items-center justify-center min-w-[16px] h-4 rounded-full bg-danger text-white text-[10px] font-semibold leading-none px-1 tabular-nums"
                title={`${threadUnread} unread`}
              >
                {threadUnread > 99 ? "99+" : threadUnread}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Hover toolbar — top-right of the row, all actions ─────── */}
      {!editing && (
        <div className="absolute -top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-elevated border border-border rounded-md shadow-[var(--shadow-sm)] px-0.5 py-0.5 z-10">
          {!isThread && onOpenThread && (
            <button
              onClick={onOpenThread}
              title="Reply in thread"
              className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-muted transition-colors"
            >
              <MessageIcon className="w-3.5 h-3.5" strokeWidth={1.8} />
            </button>
          )}
          {isOwn && (
            <>
              <button
                onClick={() => setEditing(true)}
                title="Edit"
                className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-muted transition-colors"
              >
                <EditIcon className="w-3.5 h-3.5" strokeWidth={1.8} />
              </button>
              <button
                onClick={handleDelete}
                title="Delete"
                className="p-1.5 rounded text-text-muted hover:text-danger hover:bg-muted transition-colors"
              >
                <DeleteIcon className="w-3.5 h-3.5" strokeWidth={1.8} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/** Auto-link http(s) URLs in the message body. */
function renderBody(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const re = /https?:\/\/[^\s<>"']+/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const url = match[0];
    parts.push(
      <a
        key={`${match.index}-${url}`}
        href={url}
        target="_blank"
        rel="noreferrer"
        className="text-accent hover:underline"
      >
        {url}
      </a>
    );
    last = match.index + url.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
