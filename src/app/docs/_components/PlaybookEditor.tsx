"use client";

import { useRef, useState, useTransition, useMemo, useCallback, useEffect, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import {
  RichTextEditor,
  type RichTextEditorHandle,
  type RichTextEditorSelection,
} from "@/components/editor/RichTextEditor";
import { cn } from "@/lib/utils";
import { CommentMarkExtension } from "./CommentMarkExtension";
import DocumentPreviewModal from "./DocumentPreviewModal";
import {
  addPlaybookComment,
  createPlaybookVersion,
  deletePlaybookVersion,
  savePlaybookVersion,
} from "../actions";
import { BuildFromIdeaButton } from "./PlaybookTab";
import type { PlaybookComment, PlaybookVersion } from "@/types/docs";

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "playbook"
  );
}

interface Props {
  projectId: string;
  versions: PlaybookVersion[];
  activeVersion: PlaybookVersion;
  onVersionChange: (id: string) => void;
  editable: boolean;
  canComment: boolean;
  comments: PlaybookComment[];
  allComments: PlaybookComment[];
  currentUserId: string;
  /**
   * @deprecated kept for callsite compatibility; the toolbar's
   * "Build from idea" button now opens a picker that discovers ideas
   * itself (linked-first, unassigned-fallback). New callers should omit it.
   */
  linkedIdeaId?: string | null;
  showResolved: boolean;
  onToggleShowResolved: () => void;
  hasResolvedComments: boolean;
  isAdminOrManager?: boolean;
}

export default function PlaybookEditor({
  projectId,
  versions,
  activeVersion,
  onVersionChange,
  editable,
  canComment,
  comments,
  allComments,
  currentUserId,
  linkedIdeaId: _linkedIdeaId,
  showResolved,
  onToggleShowResolved,
  hasResolvedComments,
  isAdminOrManager = false,
}: Props) {
  void _linkedIdeaId;  // deprecated — see Props.linkedIdeaId
  const router = useRouter();
  const editorRef = useRef<RichTextEditorHandle>(null);
  const [saving, startSave] = useTransition();
  const [savingNew, startSaveNew] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [saveMsg, setSaveMsg] = useState("");
  const [showVersionDrop, setShowVersionDrop] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selection, setSelection] = useState<RichTextEditorSelection | null>(null);
  const [composing, setComposing] = useState(false);
  const [composerText, setComposerText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const playbookTitle = activeVersion.version_name ?? "Playbook";
  const playbookSlug = slugify(playbookTitle);

  async function handleExportPdf() {
    setIsExportingPdf(true);
    setExportError(null);
    try {
      // Build a temporary off-screen div with white background so html2canvas
      // can rasterize it without oklch colour issues.
      const container = document.createElement("div");
      container.style.cssText =
        "position:fixed;top:-9999px;left:-9999px;width:800px;background:#fff;color:#111;font-family:Georgia,serif;font-size:14px;line-height:1.6;padding:40px 56px;";
      container.innerHTML =
        `<h1 style="font-size:26px;margin:0 0 6px">${playbookTitle}</h1>` +
        `<p style="color:#666;margin:0 0 20px">Playbook</p>` +
        (activeVersion.content || "<p><em>(empty)</em></p>");
      // Strip the yellow comment-highlight styling so paper copy looks clean.
      container.querySelectorAll<HTMLElement>("span[data-comment-id], .comment-highlight").forEach((el) => {
        el.style.background = "transparent";
        el.style.borderBottom = "none";
      });
      document.body.appendChild(container);

      const { exportElementToPdf } = await import("../../idea-refiner/_lib/exportPdf");
      try {
        await exportElementToPdf({
          source: container,
          filename: `${playbookSlug}.pdf`,
        });
      } finally {
        document.body.removeChild(container);
      }
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "PDF export failed");
    } finally {
      setIsExportingPdf(false);
    }
  }

  async function handleExportDocx() {
    setIsExportingDocx(true);
    setExportError(null);
    try {
      const htmlDocxMod = await import("html-docx-js/dist/html-docx");
      const asBlob = htmlDocxMod.asBlob ?? htmlDocxMod.default?.asBlob;
      if (!asBlob) throw new Error("html-docx-js not available");
      const fullHtml =
        `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${playbookTitle}</title></head>` +
        `<body style="font-family: Georgia, 'Times New Roman', serif; color: #111;">` +
        `<h1 style="font-size: 24pt; margin-bottom: 4pt;">${playbookTitle}</h1>` +
        `<p style="color:#555;margin-top:0;margin-bottom:16pt;">Playbook</p>` +
        (activeVersion.content || "<p><em>(empty)</em></p>") +
        `</body></html>`;
      const blob = asBlob(fullHtml);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${playbookSlug}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "DOCX export failed");
    } finally {
      setIsExportingDocx(false);
    }
  }

  const extensions = useMemo(() => [CommentMarkExtension], []);

  // When `comments` changes, ensure we don't show a popover for a stale id.
  useEffect(() => {
    if (!composing) return;
    if (!selection || !selection.text.trim()) setComposing(false);
  }, [comments, composing, selection]);

  // Stamp `data-status` onto every `span[data-comment-id]` in the editor DOM
  // so CSS can dim/hide resolved highlights without mutating TipTap marks
  // (which would dirty the doc).
  //
  // The editor uses `immediatelyRender: false` so `editorRef.current.getEditor()`
  // returns null on the first render, then becomes non-null asynchronously.
  // We poll on requestAnimationFrame until the editor exists, then run an
  // initial paint() and subscribe to its transaction events. This is the
  // reason the previous `useLayoutEffect` body that early-returned on null
  // editor never painted on mount — its deps `[allComments, activeVersion.id]`
  // never changed afterwards, so the listener was never attached.
  //
  // Once registered, every TipTap transaction triggers paint() on the next
  // animation frame (PM has applied its DOM update by then). Hide behaviour
  // is driven purely by CSS keyed off `data-status="solved"` plus the
  // container's `data-hide-resolved="true"`, so the eye toggle doesn't
  // require any repaint.
  useLayoutEffect(() => {
    let cancelled = false;
    let pollRafId = 0;
    let paintRafId = 0;
    type EditorLike = ReturnType<NonNullable<typeof editorRef.current>["getEditor"]>;
    let attachedEditor: EditorLike = null;
    let schedulePaint: (() => void) | null = null;

    const statusById = new Map(allComments.map((c) => [c.id, c.status]));

    function paintFor(editor: NonNullable<EditorLike>) {
      const root = editor.view.dom as HTMLElement;
      root.querySelectorAll<HTMLElement>("span[data-comment-id]").forEach((sp) => {
        const id = sp.getAttribute("data-comment-id");
        if (!id) return;
        const status = statusById.get(id) ?? "pending";
        if (sp.getAttribute("data-status") !== status) {
          sp.setAttribute("data-status", status);
        }
      });
    }

    function tryAttach() {
      if (cancelled) return;
      const editor = editorRef.current?.getEditor();
      if (!editor) {
        pollRafId = requestAnimationFrame(tryAttach);
        return;
      }
      attachedEditor = editor;

      const fn = () => {
        if (paintRafId) return;
        paintRafId = requestAnimationFrame(() => {
          paintRafId = 0;
          paintFor(editor);
        });
      };
      schedulePaint = fn;

      paintFor(editor);
      editor.on("transaction", fn);
    }

    tryAttach();

    return () => {
      cancelled = true;
      if (pollRafId) cancelAnimationFrame(pollRafId);
      if (paintRafId) cancelAnimationFrame(paintRafId);
      if (attachedEditor && schedulePaint) {
        attachedEditor.off("transaction", schedulePaint);
      }
    };
  }, [allComments, activeVersion.id]);

  function flash(msg: string) {
    setSaveMsg(msg);
    setTimeout(() => setSaveMsg(""), 2500);
  }

  function handleUpdateVersion() {
    if (!editorRef.current) return;
    startSave(async () => {
      const html = editorRef.current!.getHTML();
      const res = await savePlaybookVersion(activeVersion.id, html);
      if (res.error) flash("Error: " + res.error);
      else flash("Saved!");
    });
  }

  function handleSaveNewVersion() {
    if (!editorRef.current) return;
    startSaveNew(async () => {
      const html = editorRef.current!.getHTML();
      const res = await createPlaybookVersion(projectId, html);
      if (res.error) flash("Error: " + res.error);
      else {
        flash("New version saved!");
        router.refresh();
      }
    });
  }

  const canDeleteVersion =
    isAdminOrManager || (activeVersion.created_by != null && activeVersion.created_by === currentUserId);

  function handleDeleteVersion() {
    startDelete(async () => {
      const res = await deletePlaybookVersion(activeVersion.id);
      if (res.error) { flash("Error: " + res.error); return; }
      setShowDeleteConfirm(false);
      router.refresh();
    });
  }

  // The "Build from idea" toolbar button is now self-contained — it owns
  // its own modal + loading state. Dead handler removed.

  const handleSelectionChange = useCallback((sel: RichTextEditorSelection) => {
    setSelection(sel);
    if (!sel.text.trim()) {
      setComposing(false);
      return;
    }
  }, []);

  async function submitComment() {
    if (!editorRef.current || !selection || !selection.text.trim()) return;
    const editor = editorRef.current.getEditor();
    if (!editor) return;
    const text = composerText.trim();
    if (!text) return;
    setSubmitting(true);
    try {
      const res = await addPlaybookComment({
        playbookId: activeVersion.id,
        projectId,
        message: text,
        attachments: [],
      });
      if (res.error || !res.comment) {
        alert(res.error ?? "Failed to save comment");
        return;
      }
      editor
        .chain()
        .focus()
        .setTextSelection({ from: selection.from, to: selection.to })
        .setPlaybookComment(res.comment.id)
        .run();
      // Only admins / managers can persist the mark back into the playbook
      // version (RLS: only they can UPDATE). For everyone else, the anchor
      // highlight stays for the session and the comment itself is still
      // saved to `project_playbook_comment`.
      if (editable) {
        const html = editor.getHTML();
        await savePlaybookVersion(activeVersion.id, html);
      }
      setComposing(false);
      setComposerText("");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
    {showDeleteConfirm && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onClick={() => setShowDeleteConfirm(false)}
      >
        <div
          className="bg-elevated border border-border rounded-xl shadow-[var(--shadow-lg)] w-full max-w-sm mx-4 p-6 flex flex-col gap-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div>
            <h3 className="text-base font-semibold text-text-primary">Delete version?</h3>
            <p className="text-sm text-text-secondary mt-1">
              <strong>{activeVersion.version_name ?? "This version"}</strong> will be permanently removed. This cannot be undone.
            </p>
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 rounded-md bg-muted text-text-secondary text-sm hover:bg-border transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteVersion}
              disabled={deleting}
              className="px-4 py-2 rounded-md bg-red-600 text-white text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </div>
    )}
    <div
      className="relative h-full playbook-editor-wrapper"
      data-hide-resolved={showResolved ? undefined : "true"}
    >
      {/* Hide resolved comment spans by targeting each comment ID directly in CSS.
          This requires no data-status stamping and works immediately on render,
          avoiding all timing/paint-function race conditions. */}
      <style
        dangerouslySetInnerHTML={{
          __html: !showResolved
            ? allComments
                .filter((c) => c.status === "solved")
                .map(
                  (c) =>
                    `span[data-comment-id="${c.id}"]{background:transparent!important;border-bottom:none!important;cursor:inherit!important;pointer-events:none!important;}`
                )
                .join("")
            : "",
        }}
      />
      <RichTextEditor
        ref={editorRef}
        initialHtml={activeVersion.content ?? ""}
        extraExtensions={extensions}
        editable={editable}
        onSelectionChange={canComment ? handleSelectionChange : undefined}
        title={activeVersion.version_name ?? "Playbook"}
        toolbarRight={
          <>
            {saveMsg && (
              <span className={`text-xs ${saveMsg.startsWith("Error") ? "text-red-400" : "text-green-400"}`}>
                {saveMsg}
              </span>
            )}
            {exportError && (
              <span className="text-xs text-red-400" role="alert">
                {exportError}
              </span>
            )}

            {/* Preview modal opener */}
            <button
              onClick={() => setShowPreview(true)}
              title="Preview playbook"
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold",
                "bg-white text-gray-900 hover:bg-gray-100 transition-colors shadow-sm"
              )}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview
            </button>

            {/* Direct PDF download */}
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf || isExportingDocx}
              title="Download playbook as PDF"
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold",
                "bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
              </svg>
              {isExportingPdf ? "Generating…" : "PDF"}
            </button>

            {/* Direct DOCX download */}
            <button
              onClick={handleExportDocx}
              disabled={isExportingPdf || isExportingDocx}
              title="Download playbook as DOCX"
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold",
                "bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
              </svg>
              {isExportingDocx ? "Generating…" : "DOCX"}
            </button>

            {hasResolvedComments && (
              <button
                onClick={onToggleShowResolved}
                title={showResolved ? "Hide resolved comments" : "Show resolved comments"}
                className={`flex items-center justify-center w-7 h-7 rounded-md border transition-colors ${
                  showResolved
                    ? "bg-accent/20 border-accent text-accent"
                    : "bg-muted border-border text-text-secondary hover:text-text-primary hover:border-accent"
                }`}
              >
                {/* Icon reflects current state:
                    showResolved=true  → open eye  (resolved are visible)
                    showResolved=false → eye with slash (resolved are hidden) */}
                {showResolved ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                )}
              </button>
            )}

            {editable && (
              // The button now opens BuildFromIdeaModal (idea picker). It
              // no longer requires a pre-known `linkedIdeaId` — the modal
              // discovers eligible ideas itself, with an unassigned-fallback.
              <BuildFromIdeaButton projectId={projectId} variant="toolbar" />
            )}

            <div className="relative">
              <button
                onClick={() => setShowVersionDrop((v) => !v)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-text-secondary bg-muted border border-border rounded-md hover:border-accent transition-colors"
              >
                {activeVersion.version_name ?? "Version"} · {formatDate(activeVersion.created_at)}
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showVersionDrop && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowVersionDrop(false)} />
                  <div className="absolute top-full right-0 mt-1 bg-elevated border border-border rounded-lg shadow-xl z-20 min-w-[240px] max-h-64 overflow-y-auto">
                    {versions.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => {
                          onVersionChange(v.id);
                          editorRef.current?.setContent(v.content ?? "");
                          setShowVersionDrop(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs transition-colors ${
                          v.id === activeVersion.id
                            ? "bg-accent/20 text-accent"
                            : "text-text-secondary hover:bg-muted"
                        }`}
                      >
                        {v.version_name ?? "Version"} · {formatDate(v.created_at)}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {canDeleteVersion && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleting}
                title="Delete this version"
                className="flex items-center justify-center w-7 h-7 rounded-md border border-border text-text-muted hover:text-red-400 hover:border-red-400 transition-colors disabled:opacity-50"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}

            {editable && (
              <>
                <button
                  onClick={handleUpdateVersion}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-muted border border-border text-text-secondary hover:text-text-primary hover:border-accent transition-colors disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Update current version"}
                </button>
                <button
                  onClick={handleSaveNewVersion}
                  disabled={savingNew}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-accent hover:bg-accent-hover text-white transition-colors disabled:opacity-60"
                >
                  {savingNew ? "Saving…" : "Save as new version"}
                </button>
              </>
            )}
          </>
        }
      />

      {/* Floating "Add comment" trigger */}
      {selection && selection.text.trim() && selection.rect && !composing && (
        <FloatingButton
          top={selection.rect.top + window.scrollY - 40}
          left={selection.rect.left + selection.rect.width / 2}
          onClick={() => setComposing(true)}
          label="Add comment"
        />
      )}

      {/* Composer popover */}
      {composing && selection && selection.rect && (
        <div
          style={{
            position: "fixed",
            top: Math.min(selection.rect.bottom + 8, window.innerHeight - 200),
            left: Math.max(16, selection.rect.left),
            zIndex: 50,
          }}
          className="w-[320px] bg-elevated border border-border rounded-lg shadow-xl p-3"
        >
          <p className="text-[11px] text-text-muted mb-2 truncate">
            On: <span className="text-text-secondary italic">&ldquo;{selection.text.slice(0, 60)}&rdquo;</span>
          </p>
          <textarea
            autoFocus
            rows={3}
            value={composerText}
            onChange={(e) => setComposerText(e.target.value)}
            placeholder="Add a comment…"
            className="w-full bg-muted border border-border rounded-md px-2 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent resize-none"
          />
          <div className="flex items-center justify-end gap-2 mt-2">
            <button
              onClick={() => { setComposing(false); setComposerText(""); }}
              className="text-xs text-text-muted hover:text-text-primary px-2 py-1"
            >
              Cancel
            </button>
            <button
              disabled={submitting || !composerText.trim()}
              onClick={submitComment}
              className="text-xs bg-accent hover:bg-accent-hover disabled:opacity-50 text-white px-3 py-1 rounded"
            >
              {submitting ? "Saving…" : "Comment"}
            </button>
          </div>
        </div>
      )}

      <DocumentPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title={playbookTitle}
        subtitle="Playbook"
        html={activeVersion.content ?? ""}
        filenameBase={playbookSlug}
      />
    </div>
    </>
  );
}

function FloatingButton({
  top,
  left,
  onClick,
  label,
}: {
  top: number;
  left: number;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      style={{
        position: "fixed",
        top,
        left,
        transform: "translateX(-50%)",
        zIndex: 50,
      }}
      className="px-2.5 py-1 bg-accent hover:bg-accent-hover text-white text-[11px] rounded-md shadow-md flex items-center gap-1"
    >
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      {label}
    </button>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) +
    " " +
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
  );
}
