"use client";

/**
 * MessageComposer
 * ------------------------------------------------------------------
 * Textarea + attach button. Files are uploaded to the chat-attachments
 * storage bucket (public read) before the message row is inserted, so
 * the action only needs the {path,url,name,size,type} payload.
 *
 * Pattern matches src/app/profile/_components/ProfileForm.tsx upload flow.
 *
 * Optimistic UI: when the parent passes `onLocalInsert`, the composer
 * pushes the freshly-inserted row into the parent's state so the message
 * appears in the list within ~1 RTT — no waiting for the realtime echo.
 * The list de-dupes by id, so the realtime INSERT (if it arrives) is a
 * no-op.
 *
 * The previous "Send as daily feedback" checkbox has been removed: daily
 * feedback now flows through the dedicated /docs Daily Feedback tab,
 * which writes to project_daily_feedback (not the chat message tables).
 */

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type {
  ChatAttachment,
  ChatBlock,
  ChatMessage,
  ChatThreadMessage,
} from "@/types/chat";
import { replyInThread, sendMessage } from "../actions";
import { AttachmentIcon, SendIcon, CloseIcon } from "@/components/ui/icons";

interface Props {
  block: Exclude<ChatBlock, "chatbot">;
  conversationId: string;
  /** When set, posts to the thread of this parent message id. */
  parentMessageId?: string;
  /** Called with the inserted top-level row for optimistic list updates. */
  onLocalInsert?: (row: ChatMessage) => void;
  /** Called with the inserted thread row for optimistic thread updates. */
  onLocalThreadInsert?: (row: ChatThreadMessage) => void;
}

export default function MessageComposer({
  block,
  conversationId,
  parentMessageId,
  onLocalInsert,
  onLocalThreadInsert,
}: Props) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    const supabase = createClient();
    const newAttachments: ChatAttachment[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${conversationId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("chat-attachments")
        .upload(path, file, { contentType: file.type });
      if (error) {
        toast.error(`Upload failed: ${error.message}`);
        continue;
      }
      const { data: pub } = supabase.storage.from("chat-attachments").getPublicUrl(path);
      newAttachments.push({
        path,
        url: pub.publicUrl,
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
      });
    }
    if (newAttachments.length > 0) {
      setAttachments((prev) => [...prev, ...newAttachments]);
    }
  }

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed && attachments.length === 0) return;
    startTransition(async () => {
      if (parentMessageId) {
        const res = await replyInThread(
          block,
          parentMessageId,
          conversationId,
          trimmed,
          attachments
        );
        if (res.error) {
          toast.error(res.error);
          return;
        }
        if (res.row && onLocalThreadInsert) onLocalThreadInsert(res.row);
      } else {
        const res = await sendMessage(block, conversationId, trimmed, attachments);
        if (res.error) {
          toast.error(res.error);
          return;
        }
        if (res.row && onLocalInsert) onLocalInsert(res.row);
      }
      setText("");
      setAttachments([]);
    });
  }

  const canSend = !isPending && (text.trim().length > 0 || attachments.length > 0);

  return (
    <div className="px-4 py-3 shrink-0 bg-base">
      {/* One bordered card wraps the textarea + action row — Slack-style. */}
      <div className="rounded-lg border border-border bg-elevated focus-within:border-border-focus transition-colors overflow-hidden">
        {attachments.length > 0 && (
          <ul className="px-3 pt-2 flex flex-wrap gap-1.5">
            {attachments.map((a) => (
              <li
                key={a.path}
                className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border border-border bg-base"
              >
                <AttachmentIcon className="w-3 h-3 text-text-muted" strokeWidth={1.8} />
                <span className="truncate max-w-[180px]">{a.name}</span>
                <button
                  type="button"
                  onClick={() => setAttachments((prev) => prev.filter((x) => x.path !== a.path))}
                  className="text-text-muted hover:text-danger transition-colors"
                  aria-label={`Remove ${a.name}`}
                >
                  <CloseIcon className="w-3 h-3" strokeWidth={2} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={parentMessageId ? "Reply…" : "Type a message…"}
          rows={2}
          className="block w-full bg-transparent border-none px-3 pt-2.5 pb-2 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none"
        />

        <div className="flex items-center justify-between px-2 py-1.5 border-t border-border/60">
          <input
            type="file"
            ref={fileInputRef}
            multiple
            className="hidden"
            onChange={(e) => {
              void handleUpload(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach file"
            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-text-muted hover:text-text-primary hover:bg-muted transition-colors"
          >
            <AttachmentIcon className="w-4 h-4" strokeWidth={1.8} />
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            title="Send (Enter)"
            aria-label="Send message"
            className={[
              "inline-flex items-center justify-center w-8 h-8 rounded-md transition-colors",
              canSend
                ? "bg-accent text-white hover:bg-accent-hover"
                : "bg-muted text-text-muted cursor-not-allowed",
            ].join(" ")}
          >
            <SendIcon className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </div>
  );
}
