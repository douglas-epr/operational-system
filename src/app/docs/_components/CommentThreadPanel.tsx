"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/types/projects";
import type {
  DocsAttachment,
  PlaybookComment,
  PlaybookCommentReply,
} from "@/types/docs";
import {
  addPlaybookCommentReply,
  deletePlaybookComment,
  deletePlaybookCommentReply,
  editPlaybookComment,
  editPlaybookCommentReply,
  markPlaybookCommentRepliesViewed,
  setPlaybookCommentStatus,
} from "../actions";

const BUCKET = "project-playbook-attachments";
const MAX_FILE_MB = 25;

interface Props {
  comment: PlaybookComment;
  replies: PlaybookCommentReply[];
  profiles: UserProfile[];
  currentUserId: string;
  isAdminOrManager: boolean;
  onClose: () => void;
}

export default function CommentThreadPanel({
  comment,
  replies,
  profiles,
  currentUserId,
  isAdminOrManager,
  onClose,
}: Props) {
  const router = useRouter();
  const [replyText, setReplyText] = useState("");
  const [pending, setPending] = useState<DocsAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editAttachments, setEditAttachments] = useState<DocsAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const profileById = new Map(profiles.map((p) => [p.id, p]));

  // Mark replies as viewed on open / when the list changes
  useEffect(() => {
    const hasUnread = replies.some(
      (r) =>
        r.created_by !== currentUserId &&
        !(r.viewed_by ?? []).includes(currentUserId)
    );
    if (!hasUnread) return;
    let cancelled = false;
    (async () => {
      await markPlaybookCommentRepliesViewed(comment.id);
      if (!cancelled) router.refresh();
    })();
    return () => {
      cancelled = true;
    };
  }, [comment.id, replies, currentUserId, router]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [replies]);

  async function uploadFiles(files: FileList): Promise<DocsAttachment[]> {
    const supabase = createClient();
    const out: DocsAttachment[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        alert(`File "${file.name}" is larger than ${MAX_FILE_MB}MB.`);
        continue;
      }
      const ext = file.name.includes(".") ? file.name.split(".").pop() : "";
      const path = `${comment.playbook_id}/${comment.id}/${crypto.randomUUID()}${ext ? "." + ext : ""}`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: false, contentType: file.type || undefined });
      if (error) {
        alert(`Upload failed: ${error.message}`);
        continue;
      }
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      out.push({
        path,
        url: data.publicUrl,
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
      });
    }
    return out;
  }

  async function handleAttach(
    e: React.ChangeEvent<HTMLInputElement>,
    target: "pending" | "edit"
  ) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded = await uploadFiles(files);
      if (target === "pending") setPending((prev) => [...prev, ...uploaded]);
      else setEditAttachments((prev) => [...prev, ...uploaded]);
    } finally {
      setUploading(false);
      if (target === "pending" && fileInputRef.current) fileInputRef.current.value = "";
      if (target === "edit" && editFileInputRef.current) editFileInputRef.current.value = "";
    }
  }

  async function removeStorageFile(path: string) {
    const supabase = createClient();
    await supabase.storage.from(BUCKET).remove([path]);
  }

  async function handleSendReply() {
    const msg = replyText.trim();
    if (!msg && pending.length === 0) return;
    setSending(true);
    try {
      const res = await addPlaybookCommentReply({
        commentId: comment.id,
        playbookId: comment.playbook_id,
        message: msg,
        attachments: pending,
      });
      if (res.error) {
        alert(res.error);
        return;
      }
      setReplyText("");
      setPending([]);
      router.refresh();
    } finally {
      setSending(false);
    }
  }

  function startEdit(
    row: { id: string; message: string | null; attachments: DocsAttachment[] }
  ) {
    setEditingId(row.id);
    setEditText(row.message ?? "");
    setEditAttachments(row.attachments ?? []);
  }
  function cancelEdit() {
    setEditingId(null);
    setEditText("");
    setEditAttachments([]);
  }
  async function saveEditFor(target: "comment" | "reply", originalAttachments: DocsAttachment[]) {
    if (!editingId) return;
    const removed = originalAttachments.filter(
      (a) => !editAttachments.some((e) => e.path === a.path)
    );
    for (const r of removed) await removeStorageFile(r.path);
    const fn = target === "comment" ? editPlaybookComment : editPlaybookCommentReply;
    await fn(editingId, { message: editText.trim(), attachments: editAttachments });
    cancelEdit();
    router.refresh();
  }

  async function handleDeleteRow(
    target: "comment" | "reply",
    id: string,
    attachments: DocsAttachment[]
  ) {
    if (!confirm("Delete this message?")) return;
    for (const a of attachments) await removeStorageFile(a.path);
    const fn = target === "comment" ? deletePlaybookComment : deletePlaybookCommentReply;
    await fn(id);
    if (target === "comment") onClose();
    router.refresh();
  }

  const rows: Array<{
    kind: "comment" | "reply";
    id: string;
    message: string | null;
    attachments: DocsAttachment[];
    created_by: string;
    created_at: string;
    updated_at: string;
  }> = [
    {
      kind: "comment",
      id: comment.id,
      message: comment.message,
      attachments: comment.attachments ?? [],
      created_by: comment.created_by,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
    },
    ...replies.map((r) => ({
      kind: "reply" as const,
      id: r.id,
      message: r.message,
      attachments: r.attachments ?? [],
      created_by: r.created_by,
      created_at: r.created_at,
      updated_at: r.updated_at,
    })),
  ];

  const canToggleStatus =
    comment.created_by === currentUserId || isAdminOrManager;
  const isSolved = comment.status === "solved";

  async function handleToggleStatus() {
    const next = isSolved ? "pending" : "solved";
    const res = await setPlaybookCommentStatus(comment.id, next);
    if (res.error) {
      alert(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-text-primary">Thread</h3>
          {isSolved && (
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">
              Resolved
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {canToggleStatus && (
            <button
              onClick={handleToggleStatus}
              className={`p-1 rounded transition-colors ${
                isSolved
                  ? "text-green-400 hover:text-green-300"
                  : "text-text-muted hover:text-green-400"
              }`}
              title={isSolved ? "Reopen comment" : "Mark as solved"}
            >
              {isSolved ? (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm-1.293-6.293l5-5-1.414-1.414L10 13.586l-2.293-2.293-1.414 1.414 3 3a1 1 0 001.414 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-text-muted hover:text-text-primary"
            title="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {rows.map((row) => {
          const p = profileById.get(row.created_by);
          const name =
            p ? [p.first_name, p.last_name].filter(Boolean).join(" ") || "?" : "?";
          const isMine = row.created_by === currentUserId;
          const canEdit = isMine;
          const canDelete = isMine || isAdminOrManager;
          const isEditing = editingId === row.id;

          return (
            <div key={`${row.kind}-${row.id}`} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-white text-[9px] font-semibold overflow-hidden shrink-0">
                  {p?.picture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.picture} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    name[0]?.toUpperCase() ?? "?"
                  )}
                </div>
                <span className="text-[11px] font-medium text-text-primary">{name}</span>
                <span className="text-[10px] text-text-muted">
                  {new Date(row.created_at).toLocaleString()}
                  {row.updated_at && row.updated_at !== row.created_at && " · edited"}
                </span>
                {row.kind === "comment" && (
                  <span className="text-[9px] uppercase tracking-wider text-text-muted ml-auto">
                    Pinned
                  </span>
                )}
              </div>

              {isEditing ? (
                <div className="bg-muted/30 border border-accent rounded-md p-2 flex flex-col gap-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={3}
                    className="w-full bg-transparent text-xs text-text-primary outline-none resize-none"
                  />
                  {editAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {editAttachments.map((a, i) => (
                        <AttachmentChip
                          key={a.path}
                          att={a}
                          onRemove={() =>
                            setEditAttachments((prev) => prev.filter((_, j) => j !== i))
                          }
                        />
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => editFileInputRef.current?.click()}
                      className="text-[11px] text-text-muted hover:text-text-primary"
                    >
                      Attach
                    </button>
                    <input
                      ref={editFileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => handleAttach(e, "edit")}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={cancelEdit}
                        className="text-[11px] text-text-muted hover:text-text-primary"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => saveEditFor(row.kind, row.attachments)}
                        className="text-[11px] bg-accent hover:bg-accent-hover text-white px-2 py-1 rounded"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-muted/30 rounded-md px-3 py-2">
                  {row.message && (
                    <p className="text-xs text-text-primary whitespace-pre-wrap break-words">
                      {row.message}
                    </p>
                  )}
                  {row.attachments.length > 0 && (
                    <div className="flex flex-col gap-1.5 mt-1.5">
                      {row.attachments.map((a) => (
                        <AttachmentView key={a.path} att={a} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!isEditing && (canEdit || canDelete) && (
                <div className="flex items-center gap-2 pl-7">
                  {canEdit && (
                    <button
                      onClick={() => startEdit(row)}
                      className="text-[10px] text-text-muted hover:text-text-primary"
                    >
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDeleteRow(row.kind, row.id, row.attachments)}
                      className="text-[10px] text-text-muted hover:text-red-400"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Reply composer */}
      {pending.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-3 py-2 border-t border-border">
          {pending.map((a, i) => (
            <AttachmentChip
              key={a.path}
              att={a}
              onRemove={async () => {
                await removeStorageFile(a.path);
                setPending((prev) => prev.filter((_, j) => j !== i));
              }}
            />
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-border">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || sending}
          className="p-1.5 text-text-muted hover:text-text-primary disabled:opacity-40"
          title="Attach files"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleAttach(e, "pending")}
        />
        <input
          type="text"
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendReply();
            }
          }}
          placeholder={uploading ? "Uploading…" : "Reply…"}
          className="flex-1 bg-transparent text-xs text-text-primary placeholder:text-text-muted outline-none"
          disabled={sending}
        />
        <button
          onClick={handleSendReply}
          disabled={sending || uploading || (!replyText.trim() && pending.length === 0)}
          className="p-1.5 rounded-md bg-accent hover:bg-accent-hover text-white disabled:opacity-40"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </div>
    </>
  );
}

function AttachmentChip({
  att,
  onRemove,
}: {
  att: DocsAttachment;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5 bg-elevated border border-border rounded-md px-2 py-1 text-[10px] text-text-secondary">
      {att.type.startsWith("image/") ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={att.url} alt={att.name} className="w-5 h-5 object-cover rounded" />
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )}
      <span className="truncate max-w-[140px]">{att.name}</span>
      <button
        type="button"
        onClick={onRemove}
        className="text-text-muted hover:text-red-400 ml-1"
        aria-label={`Remove ${att.name}`}
      >
        ×
      </button>
    </div>
  );
}

function AttachmentView({ att }: { att: DocsAttachment }) {
  if (att.type.startsWith("image/")) {
    return (
      <a href={att.url} target="_blank" rel="noopener noreferrer" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={att.url}
          alt={att.name}
          className="max-w-full max-h-40 rounded-md object-cover border border-border"
        />
      </a>
    );
  }
  return (
    <a
      href={att.url}
      target="_blank"
      rel="noopener noreferrer"
      download={att.name}
      className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] bg-elevated hover:bg-border border border-border text-text-secondary"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span className="truncate">{att.name}</span>
    </a>
  );
}
