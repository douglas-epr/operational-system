"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AttachmentIcon, EditIcon, DeleteIcon, FileIcon, SendIcon } from "@/components/ui/icons";
import {
  getInternalTaskComments,
  createInternalTaskComment,
  updateInternalTaskComment,
  deleteInternalTaskComment,
  markInternalTaskCommentsViewed,
} from "../actions";
import type {
  InternalTaskComment,
  InternalTaskCommentAttachment,
} from "@/types/internal-projects";

const BUCKET = "internal-task-comment-attachments";
const MAX_FILE_MB = 25;

interface InternalTaskChatProps {
  taskId: string;
  projectId: string;
  currentUserId: string;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function isImage(att: InternalTaskCommentAttachment): boolean {
  return att.type.startsWith("image/");
}

export default function InternalTaskChat({
  taskId,
  projectId,
  currentUserId,
}: InternalTaskChatProps) {
  const router = useRouter();
  const [comments, setComments] = useState<InternalTaskComment[]>([]);
  const [messageText, setMessageText] = useState("");
  const [pending, setPending] = useState<InternalTaskCommentAttachment[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editAttachments, setEditAttachments] = useState<
    InternalTaskCommentAttachment[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rows = await getInternalTaskComments(taskId);
      if (cancelled) return;
      setComments(rows);
      const hasUnread = rows.some((c) => c.created_by !== currentUserId);
      if (hasUnread) {
        await markInternalTaskCommentsViewed(taskId);
        if (!cancelled) router.refresh();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [taskId, currentUserId, router]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  async function uploadFiles(
    files: FileList
  ): Promise<InternalTaskCommentAttachment[]> {
    const supabase = createClient();
    const out: InternalTaskCommentAttachment[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        alert(`File "${file.name}" is larger than ${MAX_FILE_MB}MB.`);
        continue;
      }
      const ext = file.name.includes(".") ? file.name.split(".").pop() : "";
      const path = `${taskId}/${crypto.randomUUID()}${ext ? "." + ext : ""}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        upsert: false,
        contentType: file.type || undefined,
      });
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

  async function handleAttach(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded = await uploadFiles(files);
      setPending((prev) => [...prev, ...uploaded]);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleAttachEdit(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded = await uploadFiles(files);
      setEditAttachments((prev) => [...prev, ...uploaded]);
    } finally {
      setUploading(false);
      if (editFileInputRef.current) editFileInputRef.current.value = "";
    }
  }

  async function removeStorageFile(path: string) {
    const supabase = createClient();
    await supabase.storage.from(BUCKET).remove([path]);
  }

  async function handleRemovePending(idx: number) {
    const att = pending[idx];
    setPending((prev) => prev.filter((_, i) => i !== idx));
    await removeStorageFile(att.path);
  }

  async function handleSend() {
    const msg = messageText.trim();
    if (!msg && pending.length === 0) return;
    setIsSending(true);
    const attachments = pending;
    setMessageText("");
    setPending([]);

    const optimistic: InternalTaskComment = {
      id: `tmp-${Date.now()}`,
      internal_task_id: taskId,
      internal_project_id: projectId,
      // owner_id → created_by, edited_at → updated_at (B8 item 29).
      created_by: currentUserId,
      message: msg,
      attachments,
      updated_at: null,
      created_at: new Date().toISOString(),
      profiles: null,
    };
    setComments((prev) => [...prev, optimistic]);

    await createInternalTaskComment(taskId, projectId, msg, attachments);
    const refreshed = await getInternalTaskComments(taskId);
    setComments(refreshed);
    setIsSending(false);
  }

  function startEdit(c: InternalTaskComment) {
    setEditingId(c.id);
    setEditText(c.message ?? "");
    setEditAttachments(c.attachments ?? []);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditText("");
    setEditAttachments([]);
  }

  async function saveEdit(original: InternalTaskComment) {
    if (!editingId) return;
    const removed = (original.attachments ?? []).filter(
      (a) => !editAttachments.some((e) => e.path === a.path)
    );
    for (const r of removed) {
      await removeStorageFile(r.path);
    }
    await updateInternalTaskComment(editingId, editText.trim(), editAttachments);
    cancelEdit();
    const refreshed = await getInternalTaskComments(taskId);
    setComments(refreshed);
  }

  async function handleDelete(c: InternalTaskComment) {
    if (!confirm("Delete this message?")) return;
    setComments((prev) => prev.filter((x) => x.id !== c.id));
    await deleteInternalTaskComment(c.id);
    const refreshed = await getInternalTaskComments(taskId);
    setComments(refreshed);
  }

  async function removeEditAttachment(idx: number) {
    setEditAttachments((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <div className="rounded-md border border-border overflow-hidden flex flex-col">
      <div className="flex flex-col gap-3 p-3 max-h-[320px] overflow-y-auto bg-muted/20">
        {comments.length === 0 && (
          <p className="text-xs text-text-muted text-center py-4">
            No messages yet.
          </p>
        )}
        {comments.map((c) => {
          const isMine = c.created_by === currentUserId;
          const p = c.profiles;
          const name = p
            ? [p.first_name, p.last_name].filter(Boolean).join(" ") || "?"
            : "?";
          const initial = name[0]?.toUpperCase() ?? "?";
          const time = new Date(c.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          const isEditing = editingId === c.id;

          return (
            <div
              key={c.id}
              className={`flex items-end gap-2 ${
                isMine ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-white text-[9px] font-semibold shrink-0 overflow-hidden">
                {p?.picture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.picture}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initial
                )}
              </div>

              <div
                className={`group flex flex-col gap-0.5 max-w-[75%] ${
                  isMine ? "items-end" : "items-start"
                }`}
              >
                {!isMine && (
                  <span className="text-[10px] text-text-muted px-1">
                    {name}
                  </span>
                )}

                {isEditing ? (
                  <div className="flex flex-col gap-2 w-full bg-elevated border border-accent rounded-2xl p-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full bg-transparent text-xs text-text-primary outline-none resize-none"
                      rows={2}
                    />
                    {editAttachments.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {editAttachments.map((a, i) => (
                          <AttachmentChip
                            key={a.path}
                            att={a}
                            onRemove={() => removeEditAttachment(i)}
                          />
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => editFileInputRef.current?.click()}
                        className="p-1 text-text-muted hover:text-text-primary"
                        title="Attach files"
                      >
                        <AttachmentIcon className="w-4 h-4" strokeWidth={2} />
                      </button>
                      <input
                        ref={editFileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleAttachEdit}
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={cancelEdit}
                          className="text-[10px] text-text-muted hover:text-text-primary"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => saveEdit(c)}
                          className="text-[10px] text-white bg-accent hover:bg-accent-hover px-2 py-1 rounded"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {(c.message || c.attachments?.length > 0) && (
                      <div
                        className={`rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                          isMine
                            ? "bg-accent text-white rounded-br-sm"
                            : "bg-muted text-text-primary rounded-bl-sm"
                        }`}
                      >
                        {c.message && (
                          <div className="whitespace-pre-wrap break-words">
                            {c.message}
                          </div>
                        )}
                        {c.attachments?.length > 0 && (
                          <div
                            className={`flex flex-col gap-1.5 ${
                              c.message ? "mt-2" : ""
                            }`}
                          >
                            {c.attachments.map((a) => (
                              <AttachmentView
                                key={a.path}
                                att={a}
                                onDark={isMine}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                <div
                  className={`flex items-center gap-1.5 ${
                    isMine ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <span className="text-[10px] text-text-muted px-1">
                    {time}
                    {c.updated_at && c.updated_at !== c.created_at ? " · edited" : ""}
                  </span>
                  {isMine && !isEditing && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <button
                        onClick={() => startEdit(c)}
                        className="p-0.5 text-text-muted hover:text-text-primary"
                        title="Edit"
                      >
                        <EditIcon className="w-3 h-3" strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        className="p-0.5 text-text-muted hover:text-red-400"
                        title="Delete"
                      >
                        <DeleteIcon className="w-3 h-3" strokeWidth={2} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {pending.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-3 py-2 border-t border-border bg-muted/10">
          {pending.map((a, i) => (
            <AttachmentChip
              key={a.path}
              att={a}
              onRemove={() => handleRemovePending(i)}
            />
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 px-3 py-2 border-t border-border bg-muted/30">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || isSending}
          className="p-1.5 text-text-muted hover:text-text-primary transition-colors disabled:opacity-40"
          title="Attach files"
        >
          <AttachmentIcon className="w-4 h-4" strokeWidth={2} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleAttach}
        />
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={uploading ? "Uploading…" : "Type here..."}
          className="flex-1 bg-transparent text-xs text-text-primary placeholder:text-text-muted outline-none"
          disabled={isSending}
        />
        <button
          onClick={handleSend}
          disabled={
            (!messageText.trim() && pending.length === 0) ||
            isSending ||
            uploading
          }
          className="p-1.5 rounded-md bg-accent hover:bg-accent-hover text-white transition-colors disabled:opacity-40"
        >
          <SendIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

function AttachmentView({
  att,
  onDark,
}: {
  att: InternalTaskCommentAttachment;
  onDark: boolean;
}) {
  if (isImage(att)) {
    return (
      <a
        href={att.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={att.url}
          alt={att.name}
          className="max-w-[240px] max-h-[200px] rounded-md object-cover border border-border"
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
      className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] ${
        onDark
          ? "bg-white/15 hover:bg-white/25"
          : "bg-elevated hover:bg-border border border-border"
      }`}
    >
      <FileIcon className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
      <span className="flex flex-col min-w-0">
        <span className="truncate max-w-[180px]">{att.name}</span>
        <span
          className={`text-[9px] ${
            onDark ? "opacity-70" : "text-text-muted"
          }`}
        >
          {formatBytes(att.size)}
        </span>
      </span>
    </a>
  );
}

function AttachmentChip({
  att,
  onRemove,
}: {
  att: InternalTaskCommentAttachment;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5 bg-elevated border border-border rounded-md px-2 py-1 text-[10px] text-text-secondary">
      {isImage(att) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={att.url}
          alt={att.name}
          className="w-5 h-5 object-cover rounded"
        />
      ) : (
        <FileIcon className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
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

