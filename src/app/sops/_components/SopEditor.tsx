"use client";

import { useRef, useState, useTransition } from "react";
import type { SopVersion, SopWithTags } from "@/types/sops";
import {
  RichTextEditor,
  type RichTextEditorHandle,
} from "@/components/editor/RichTextEditor";
import { saveAsNewVersion, updateVersion, deleteVersion, renameVersion } from "../actions";
import { ChevronDownIcon, UploadIcon, AddIcon } from "@/components/ui/icons";

interface Props {
  sop: SopWithTags;
  versions: SopVersion[];
  currentUserId: string;
  isAdminOrManager: boolean;
}

export default function SopEditor({ sop, versions: initialVersions, currentUserId, isAdminOrManager }: Props) {
  const [versions, setVersions]               = useState(initialVersions);
  const [activeVersionId, setActiveVersionId] = useState(initialVersions[0]?.id ?? "");
  const [showVersionDrop, setShowVersionDrop] = useState(false);
  const [saving, startSave]                   = useTransition();
  const [savingNew, startSaveNew]             = useTransition();
  const [saveMsg, setSaveMsg]                 = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, startDelete]               = useTransition();
  const [renamingVersionId, setRenamingVersionId] = useState<string | null>(null);
  const [renameValue, setRenameValue]             = useState("");
  const [renaming, startRename]                   = useTransition();

  const activeVersion = versions.find((v) => v.id === activeVersionId) ?? versions[0];
  const editorRef = useRef<RichTextEditorHandle>(null);

  // Permission helpers
  const canManageVersion = (v: SopVersion) =>
    isAdminOrManager ||
    v.created_by === currentUserId ||
    sop.created_by === currentUserId;

  const canSaveNewVersion =
    isAdminOrManager ||
    sop.created_by === currentUserId ||
    sop.authorized_users.includes(currentUserId);

  function handleDeleteVersion() {
    if (!activeVersionId) return;
    startDelete(async () => {
      const result = await deleteVersion(activeVersionId);
      if (result.error) { flash("Error: " + result.error); return; }
      const remaining = versions.filter((v) => v.id !== activeVersionId);
      setVersions(remaining);
      setActiveVersionId(remaining[0]?.id ?? "");
      if (remaining[0]) editorRef.current?.setContent(remaining[0].content ?? "");
      setShowDeleteConfirm(false);
      flash("Version deleted.");
    });
  }

  function flash(msg: string) {
    setSaveMsg(msg);
    setTimeout(() => setSaveMsg(""), 2500);
  }

  function handleUpdateVersion() {
    if (!editorRef.current || !activeVersionId) return;
    startSave(async () => {
      const html = editorRef.current!.getHTML();
      const result = await updateVersion(activeVersionId, html);
      if (result.error) flash("Error: " + result.error);
      else flash("Saved!");
    });
  }

  function handleSaveNewVersion() {
    if (!editorRef.current) return;
    startSaveNew(async () => {
      const html = editorRef.current!.getHTML();
      const result = await saveAsNewVersion(sop.id, html);
      if (result.error) { flash("Error: " + result.error); return; }
      if (result.version) {
        const newV: SopVersion = {
          id:           result.version.id,
          sop_id:       sop.id,
          version_name: result.version.version_name,
          content:      html,
          created_at:   result.version.created_at,
          created_by:   result.version.created_by,
        };
        setVersions((prev) => [newV, ...prev]);
        setActiveVersionId(newV.id);
        flash("New version saved!");
      }
    });
  }

  function startRenaming(v: SopVersion) {
    setRenamingVersionId(v.id);
    setRenameValue(v.version_name);
  }

  function commitRename(versionId: string) {
    if (!renameValue.trim()) { setRenamingVersionId(null); return; }
    startRename(async () => {
      const result = await renameVersion(versionId, renameValue);
      if (result.error) { flash("Error: " + result.error); return; }
      setVersions((prev) => prev.map((v) => v.id === versionId ? { ...v, version_name: renameValue.trim() } : v));
      setRenamingVersionId(null);
    });
  }

  return (
    <>
      {/* Delete confirmation modal */}
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
                <strong>{activeVersion?.version_name}</strong> will be permanently removed. This cannot be undone.
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

      <RichTextEditor
        ref={editorRef}
        initialHtml={activeVersion?.content ?? ""}
        title={sop.name ?? undefined}
        toolbarRight={
          <>
            {saveMsg && (
              <span className={`text-xs ${saveMsg.startsWith("Error") ? "text-red-400" : "text-green-400"}`}>
                {saveMsg}
              </span>
            )}

            {/* Version selector dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowVersionDrop((v) => !v)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-text-secondary bg-muted border border-border rounded-md hover:border-accent transition-colors"
              >
                {activeVersion
                  ? `${activeVersion.version_name} · ${formatDate(activeVersion.created_at)}`
                  : "No versions"}
                <ChevronDownIcon className="w-3 h-3" strokeWidth={2} />
              </button>
              {showVersionDrop && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowVersionDrop(false)} />
                  <div className="absolute top-full right-0 mt-1 bg-elevated border border-border rounded-lg shadow-xl z-20 min-w-[280px] max-h-64 overflow-y-auto">
                    {versions.map((v) => (
                      <div
                        key={v.id}
                        className={`group flex items-center gap-1 px-3 py-2.5 transition-colors ${
                          v.id === activeVersionId ? "bg-accent/20" : "hover:bg-muted"
                        }`}
                      >
                        {/* Rename inline input */}
                        {renamingVersionId === v.id ? (
                          <input
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={() => commitRename(v.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") { e.preventDefault(); commitRename(v.id); }
                              if (e.key === "Escape") setRenamingVersionId(null);
                            }}
                            className="flex-1 text-xs bg-muted border border-accent rounded px-2 py-0.5 text-text-primary outline-none"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <button
                            className={`flex-1 text-left text-xs truncate ${
                              v.id === activeVersionId ? "text-accent" : "text-text-secondary"
                            }`}
                            onClick={() => {
                              setActiveVersionId(v.id);
                              editorRef.current?.setContent(v.content ?? "");
                              setShowVersionDrop(false);
                            }}
                          >
                            {v.version_name} · {formatDate(v.created_at)}
                          </button>
                        )}

                        {/* Pencil + Trash — only for version author or SOP owner */}
                        {canManageVersion(v) && renamingVersionId !== v.id && (
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button
                              onClick={(e) => { e.stopPropagation(); startRenaming(v); }}
                              title="Rename version"
                              className="p-1 text-text-muted hover:text-text-primary rounded transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveVersionId(v.id);
                                setShowVersionDrop(false);
                                setShowDeleteConfirm(true);
                              }}
                              title="Delete version"
                              className="p-1 text-text-muted hover:text-red-400 rounded transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleUpdateVersion}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-muted border border-border text-text-secondary hover:text-text-primary hover:border-accent transition-colors disabled:opacity-60"
            >
              <UploadIcon className="w-3.5 h-3.5" strokeWidth={2} />
              {saving ? "Saving…" : "Update current version"}
            </button>

            {canSaveNewVersion && (
              <button
                onClick={handleSaveNewVersion}
                disabled={savingNew}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-accent hover:bg-accent-hover text-white transition-colors disabled:opacity-60"
              >
                <AddIcon className="w-3.5 h-3.5" strokeWidth={2} />
                {savingNew ? "Saving…" : "Save as new version"}
              </button>
            )}
          </>
        }
      />
    </>
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
