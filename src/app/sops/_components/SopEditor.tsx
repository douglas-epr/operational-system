"use client";

import { useRef, useState, useTransition } from "react";
import type { SopVersion, SopWithTags } from "@/types/sops";
import {
  RichTextEditor,
  type RichTextEditorHandle,
} from "@/components/editor/RichTextEditor";
import { saveAsNewVersion, updateVersion, deleteVersion } from "../actions";
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

  const activeVersion = versions.find((v) => v.id === activeVersionId) ?? versions[0];
  const editorRef = useRef<RichTextEditorHandle>(null);

  const canDeleteVersion =
    isAdminOrManager || (activeVersion?.created_by != null && activeVersion.created_by === currentUserId);

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
        };
        setVersions((prev) => [newV, ...prev]);
        setActiveVersionId(newV.id);
        flash("New version saved!");
      }
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
                  <div className="absolute top-full right-0 mt-1 bg-elevated border border-border rounded-lg shadow-xl z-20 min-w-[240px] max-h-64 overflow-y-auto">
                    {versions.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => {
                          setActiveVersionId(v.id);
                          editorRef.current?.setContent(v.content ?? "");
                          setShowVersionDrop(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs transition-colors ${
                          v.id === activeVersionId
                            ? "bg-accent/20 text-accent"
                            : "text-text-secondary hover:bg-muted"
                        }`}
                      >
                        {v.version_name} · {formatDate(v.created_at)}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {canDeleteVersion && activeVersion && (
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

            <button
              onClick={handleUpdateVersion}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-muted border border-border text-text-secondary hover:text-text-primary hover:border-accent transition-colors disabled:opacity-60"
            >
              <UploadIcon className="w-3.5 h-3.5" strokeWidth={2} />
              {saving ? "Saving…" : "Update current version"}
            </button>

            <button
              onClick={handleSaveNewVersion}
              disabled={savingNew}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-accent hover:bg-accent-hover text-white transition-colors disabled:opacity-60"
            >
              <AddIcon className="w-3.5 h-3.5" strokeWidth={2} />
              {savingNew ? "Saving…" : "Save as new version"}
            </button>
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
