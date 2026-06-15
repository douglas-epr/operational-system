"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { IdeaFull } from "@/types/idea-refiner";
import type { PlaybookVersion } from "@/types/docs";
import {
  RichTextEditor,
  type RichTextEditorHandle,
} from "@/components/editor/RichTextEditor";
import {
  createIdeaPlaybookVersion,
  savePlaybookVersion,
  deletePlaybookVersion,
} from "@/app/docs/actions";
import { triggerAiGeneration } from "../actions";
import { ChevronDownIcon, UploadIcon, AddIcon } from "@/components/ui/icons";
import AiLoadingOverlay from "./AiLoadingOverlay";
import { useRegenerate } from "../_hooks/useRegenerate";
import { useAutoTriggerAi } from "../_hooks/useAutoTriggerAi";

interface Props {
  ideaFull: IdeaFull;
  isAdminOrManager: boolean;
  currentUserId: string;
}

export default function PlaybookStep({ ideaFull, isAdminOrManager, currentUserId }: Props) {
  const router = useRouter();
  const [versions, setVersions] = useState<PlaybookVersion[]>(ideaFull.playbookVersions);
  const [activeVersionId, setActiveVersionId] = useState(ideaFull.playbookVersions[0]?.id ?? "");
  const [showVersionDrop, setShowVersionDrop] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saving, startSave] = useTransition();
  const [savingNew, startSaveNew] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [creating, startCreate] = useTransition();
  const [saveMsg, setSaveMsg] = useState("");
  const editorRef = useRef<RichTextEditorHandle>(null);

  // When router.refresh() pushes new server props after AI regeneration, sync
  // local state so the newly-created version becomes visible without a hard reload.
  useEffect(() => {
    const propIds = ideaFull.playbookVersions.map((v) => v.id).join(",");
    const stateIds = versions.map((v) => v.id).join(",");
    if (propIds !== stateIds) {
      setVersions(ideaFull.playbookVersions);
      if (!ideaFull.playbookVersions.find((v) => v.id === activeVersionId)) {
        setActiveVersionId(ideaFull.playbookVersions[0]?.id ?? "");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ideaFull.playbookVersions]);

  const { idea } = ideaFull;
  const isAiWorking = idea.current_blocks_updating === "playbook";
  const { isRegenerating, error: regenError, triggerRegenerate } = useRegenerate(idea.id, "playbook", isAiWorking);

  // Auto-generate on first view when no versions exist.
  useAutoTriggerAi(idea.id, "playbook", versions.length === 0, isAiWorking);

  const activeVersion = versions.find((v) => v.id === activeVersionId) ?? versions[0] ?? null;

  const canEdit =
    isAdminOrManager ||
    ideaFull.idea.created_by === currentUserId ||
    (ideaFull.idea.authorized_users ?? []).includes(currentUserId);

  function flash(msg: string) {
    setSaveMsg(msg);
    setTimeout(() => setSaveMsg(""), 2500);
  }

  function handleSave() {
    if (!activeVersionId || !editorRef.current) return;
    startSave(async () => {
      const html = editorRef.current!.getHTML();
      const res = await savePlaybookVersion(activeVersionId, html);
      if (res.error) flash("Error: " + res.error);
      else { flash("Saved!"); router.refresh(); }
    });
  }

  function handleNewVersion() {
    if (!editorRef.current) return;
    startSaveNew(async () => {
      const html = editorRef.current!.getHTML();
      const res = await createIdeaPlaybookVersion(ideaFull.idea.id, html);
      if (res.error) { flash("Error: " + res.error); return; }
      if (res.version) {
        const newV: PlaybookVersion = {
          id:              res.version.id,
          idea_id:         ideaFull.idea.id,
          version_name:    res.version.version_name ?? `Version ${versions.length + 1}`,
          content:         html,
          google_docs_url: null,
          created_by:      currentUserId,
          created_at:      res.version.created_at,
          updated_at:      res.version.updated_at,
        };
        setVersions((prev) => [newV, ...prev]);
        setActiveVersionId(newV.id);
        flash("New version saved!");
        router.refresh();
      }
    });
  }

  function handleDelete() {
    if (!activeVersionId) return;
    startDelete(async () => {
      const res = await deletePlaybookVersion(activeVersionId);
      if (res.error) { flash("Error: " + res.error); return; }
      const remaining = versions.filter((v) => v.id !== activeVersionId);
      setVersions(remaining);
      setActiveVersionId(remaining[0]?.id ?? "");
      if (remaining[0]) editorRef.current?.setContent(remaining[0].content ?? "");
      setShowDeleteConfirm(false);
      flash("Version deleted.");
      router.refresh();
    });
  }

  function handleCreate() {
    startCreate(async () => {
      const res = await createIdeaPlaybookVersion(ideaFull.idea.id, "<p>Start writing…</p>");
      if (res.error) { flash("Error: " + res.error); return; }
      if (res.version) {
        const newV: PlaybookVersion = {
          id:              res.version.id,
          idea_id:         ideaFull.idea.id,
          version_name:    res.version.version_name ?? "Version 1",
          content:         "<p>Start writing…</p>",
          google_docs_url: null,
          created_by:      currentUserId,
          created_at:      res.version.created_at,
          updated_at:      res.version.updated_at,
        };
        setVersions([newV]);
        setActiveVersionId(newV.id);
        router.refresh();
      }
    });
  }

  // Show overlay while AI is assembling or the Regenerate button was clicked.
  if (isAiWorking || isRegenerating) {
    return <AiLoadingOverlay ideaId={idea.id} step="playbook" />;
  }

  if (!activeVersion) {
    return (
      <div className="flex items-center justify-center h-64 text-center">
        <div className="max-w-sm">
          <p className="text-text-muted text-sm mb-4">No playbook versions yet.</p>
          {canEdit && (
            <div className="flex flex-col gap-2 items-center">
              <button
                onClick={async () => { await triggerRegenerate(() => triggerAiGeneration(idea.id, "playbook")); router.refresh(); }}
                disabled={isRegenerating}
                className="px-4 py-2 text-sm rounded-md bg-accent hover:bg-accent-hover text-white disabled:opacity-60"
              >
                Generate Build Guide
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="px-4 py-2 text-sm rounded-md bg-muted hover:bg-border text-text-secondary disabled:opacity-60"
              >
                {creating ? "Creating…" : "Create blank version"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
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
                <strong>{activeVersion.version_name}</strong> will be permanently removed. This cannot be undone.
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
                onClick={handleDelete}
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
        initialHtml={activeVersion.content ?? ""}
        title={`Playbook — ${ideaFull.idea.name}`}
        toolbarRight={
          <>
            {regenError && (
              <span className="text-xs text-red-400">{regenError}</span>
            )}
            {saveMsg && (
              <span className={`text-xs ${saveMsg.startsWith("Error") ? "text-red-400" : "text-green-400"}`}>
                {saveMsg}
              </span>
            )}

            {/* Version selector */}
            <div className="relative">
              <button
                onClick={() => setShowVersionDrop((v) => !v)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-text-secondary bg-muted border border-border rounded-md hover:border-accent transition-colors"
              >
                {activeVersion.version_name ?? "Version"} · {formatDate(activeVersion.created_at)}
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

            {canEdit && (
              <>
                {/* Regenerate */}
                <button
                  onClick={async () => { await triggerRegenerate(() => triggerAiGeneration(idea.id, "playbook")); router.refresh(); }}
                  disabled={isRegenerating || saving || savingNew}
                  title="Assemble a new Build Guide from PRD, Visual Styles, Database & Milestones"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-muted border border-border text-text-secondary hover:text-text-primary hover:border-accent transition-colors disabled:opacity-60"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {isRegenerating ? "Generating…" : "Regenerate"}
                </button>

                {activeVersion && (
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
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-muted border border-border text-text-secondary hover:text-text-primary hover:border-accent transition-colors disabled:opacity-60"
                >
                  <UploadIcon className="w-3.5 h-3.5" strokeWidth={2} />
                  {saving ? "Saving…" : "Update version"}
                </button>
                <button
                  onClick={handleNewVersion}
                  disabled={savingNew}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-accent hover:bg-accent-hover text-white transition-colors disabled:opacity-60"
                >
                  <AddIcon className="w-3.5 h-3.5" strokeWidth={2} />
                  {savingNew ? "Saving…" : "Save as new version"}
                </button>
              </>
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
