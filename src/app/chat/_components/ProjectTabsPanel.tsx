"use client";

/**
 * ProjectTabsPanel — self-contained Files / Links / Videos / Daily Feedback
 * for the projects (external client) chat block.
 *
 * Mirrors InternalProjectTabsPanel exactly: all CRUD modals inline, tick-based
 * onRefresh so mutations re-fetch immediately, 2-second background poll.
 * Uses docs/actions.ts for CRUD (same actions used by /docs page).
 */

import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { RichTextEditor, type RichTextEditorHandle } from "@/components/editor/RichTextEditor";
import DatePicker from "@/components/DatePicker";

/** Shared compact textarea for the optional resource description field. */
function DescriptionField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-secondary mb-1">Description</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        placeholder="What is this about? (optional)"
        className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
      />
    </div>
  );
}
import type { ChatTab } from "@/types/chat";
import type {
  DocsAttachment,
  ProjectFile,
  ProjectLink,
  ProjectVideo,
  ProjectDailyFeedback,
} from "@/types/docs";
import AttachmentTile from "../../docs/_components/AttachmentTile";
import {
  getProjectForTabs,
  getProjectFiles,
  getProjectLinks,
  getProjectVideos,
  getProjectDailyFeedbacks,
} from "../actions";
import {
  createProjectFile,
  updateProjectFile,
  deleteProjectFile,
  createProjectLink,
  updateProjectLink,
  deleteProjectLink,
  createProjectVideo,
  updateProjectVideo,
  deleteProjectVideo,
  createDailyFeedback,
  updateDailyFeedback,
  deleteDailyFeedback,
} from "../../docs/actions";

const FILE_BUCKET = "project-files";
const MAX_FILE_MB = 50;
const POLL_MS = 2000;

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  picture: string | null;
}

interface PanelState {
  profiles: Profile[];
  currentUserId: string;
  isAdminOrManager: boolean;
  files: ProjectFile[];
  links: ProjectLink[];
  videos: ProjectVideo[];
  feedbacks: ProjectDailyFeedback[];
}

// ── Shared UI helpers ──────────────────────────────────────────────────────────

function ModalShell({
  title,
  wide,
  onClose,
  children,
}: {
  title: string;
  wide?: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`bg-surface border border-border rounded-lg flex flex-col max-h-[92vh] w-full ${wide ? "max-w-4xl" : "max-w-lg"}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h3 className="text-heading-3 text-text-primary">{title}</h3>
          <button onClick={onClose} className="p-1 text-text-muted hover:text-text-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalFooter({
  onClose,
  onSave,
  saving,
}: {
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border shrink-0">
      <button onClick={onClose} className="text-xs text-text-secondary hover:text-text-primary px-3 py-1.5">
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        className="bg-accent hover:bg-accent-hover text-white text-xs font-medium px-3 py-1.5 rounded-md disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

function EmptyState({
  noun,
  canCreate,
  hint,
}: {
  noun: string;
  canCreate: boolean;
  hint: string;
}) {
  return (
    <div className="h-full flex items-center justify-center text-center p-10">
      <div>
        <h4 className="text-sm font-medium text-text-primary mb-1">No {noun} yet</h4>
        <p className="text-xs text-text-muted">{canCreate ? hint : `No ${noun} have been shared.`}</p>
      </div>
    </div>
  );
}

function ownerName(profiles: Profile[], id: string) {
  const p = profiles.find((x) => x.id === id);
  return p ? [p.first_name, p.last_name].filter(Boolean).join(" ") || "?" : "?";
}

// ── Files ──────────────────────────────────────────────────────────────────────

function FileModal({
  projectId,
  file,
  onClose,
  onSaved,
}: {
  projectId: string;
  file: ProjectFile | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = file !== null;
  const [name, setName] = useState(file?.name ?? "");
  const [description, setDescription] = useState(file?.description ?? "");
  const [attachments, setAttachments] = useState<DocsAttachment[]>(file?.attachments ?? []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(list: FileList) {
    const supabase = createClient();
    setUploading(true);
    const out: DocsAttachment[] = [];
    try {
      for (const f of Array.from(list)) {
        if (f.size > MAX_FILE_MB * 1024 * 1024) {
          alert(`"${f.name}" exceeds ${MAX_FILE_MB}MB.`);
          continue;
        }
        const ext = f.name.includes(".") ? f.name.split(".").pop() : "";
        const path = `projects/${projectId}/${crypto.randomUUID()}${ext ? "." + ext : ""}`;
        const { error } = await supabase.storage
          .from(FILE_BUCKET)
          .upload(path, f, { contentType: f.type || undefined });
        if (error) { alert(`Upload failed: ${error.message}`); continue; }
        const { data } = supabase.storage.from(FILE_BUCKET).getPublicUrl(path);
        out.push({ path, url: data.publicUrl, name: f.name, size: f.size, type: f.type || "application/octet-stream" });
      }
      setAttachments((p) => [...p, ...out]);
      if (!name && out[0]) setName(out[0].name);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function removeAt(idx: number) {
    const att = attachments[idx];
    if (!att) return;
    await createClient().storage.from(FILE_BUCKET).remove([att.path]);
    setAttachments((p) => p.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    const n = name.trim();
    if (!n) { alert("Please enter a name."); return; }
    if (!attachments.length) { alert("Please upload at least one file."); return; }
    setSaving(true);
    try {
      const d = description.trim() || null;
      const res = isEdit
        ? await updateProjectFile(file!.id, { name: n, description: d, attachments })
        : await createProjectFile({ projectId, name: n, description: d, attachments });
      if (res.error) { alert(res.error); return; }
      onClose();
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title={isEdit ? "Edit file" : "New file"} onClose={onClose}>
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Brand guidelines"
            className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
        </div>
        <DescriptionField value={description} onChange={setDescription} />
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Files</label>
          <div className="flex flex-col gap-2">
            {attachments.length > 0 && (
              <ul className="flex flex-col gap-1.5">
                {attachments.map((a, i) => (
                  <li key={a.path} className="flex items-center gap-2 bg-muted border border-border rounded-md px-2 py-1.5">
                    <a href={a.url} target="_blank" rel="noopener noreferrer" className="flex-1 text-xs text-text-primary truncate hover:underline">
                      {a.name}
                    </a>
                    <button onClick={() => removeAt(i)} className="text-text-muted hover:text-red-400 text-xs">
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="text-xs border border-dashed border-border rounded-md px-3 py-2 text-text-secondary hover:bg-muted/50 disabled:opacity-50"
            >
              {uploading ? "Uploading…" : "+ Add files"}
            </button>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => { if (e.target.files) void handleFiles(e.target.files); }}
            />
          </div>
        </div>
      </div>
      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving || uploading} />
    </ModalShell>
  );
}

function FilesContent({
  projectId,
  files,
  profiles,
  currentUserId,
  isAdminOrManager,
  onRefresh,
}: {
  projectId: string;
  files: ProjectFile[];
  profiles: Profile[];
  currentUserId: string;
  isAdminOrManager: boolean;
  onRefresh: () => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectFile | null>(null);

  async function handleDelete(f: ProjectFile) {
    if (!confirm(`Delete "${f.name}"?`)) return;
    const supabase = createClient();
    if (f.attachments.length) {
      await supabase.storage.from(FILE_BUCKET).remove(f.attachments.map((a) => a.path));
    }
    const res = await deleteProjectFile(f.id);
    if (res.error) { alert(res.error); return; }
    onRefresh();
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <h3 className="text-heading-3 text-text-primary">Files</h3>
        {isAdminOrManager && (
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="bg-accent hover:bg-accent-hover text-white text-xs font-medium px-3 py-1.5 rounded-md"
          >
            + New file
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {!files.length ? (
          <EmptyState noun="files" canCreate={isAdminOrManager} hint='Click "+ New file" to upload.' />
        ) : (
          <ul>
            {files.map((f) => {
              const canEdit = isAdminOrManager || f.created_by === currentUserId;
              return (
                <li key={f.id} className="flex flex-col gap-2 px-6 py-4 border-b border-border last:border-b-0 hover:bg-muted/30">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text-primary truncate">{f.name}</p>
                      <p className="text-[11px] text-text-muted truncate">
                        {f.attachments.length} {f.attachments.length === 1 ? "file" : "files"} · {ownerName(profiles, f.created_by)} · {new Date(f.updated_at).toLocaleDateString()}
                      </p>
                      {f.description && (
                        <p className="text-xs text-text-secondary mt-0.5 whitespace-pre-wrap">{f.description}</p>
                      )}
                    </div>
                    {canEdit && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => { setEditing(f); setModalOpen(true); }} className="text-[11px] text-text-muted hover:text-text-primary px-2 py-1">Edit</button>
                        <button onClick={() => handleDelete(f)} className="text-[11px] text-text-muted hover:text-red-400 px-2 py-1">Delete</button>
                      </div>
                    )}
                  </div>
                  {f.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                      {f.attachments.map((a) => <AttachmentTile key={a.path} attachment={a} size={48} />)}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {modalOpen && (
        <FileModal
          projectId={projectId}
          file={editing}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSaved={onRefresh}
        />
      )}
    </div>
  );
}

// ── Links ──────────────────────────────────────────────────────────────────────

function LinkModal({
  projectId,
  link,
  onClose,
  onSaved,
}: {
  projectId: string;
  link: ProjectLink | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = link !== null;
  const [name, setName] = useState(link?.name ?? "");
  const [description, setDescription] = useState(link?.description ?? "");
  const [url, setUrl] = useState(link?.url ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const n = name.trim();
    const u = url.trim();
    if (!n) { alert("Please enter a name."); return; }
    if (!u) { alert("Please enter a URL."); return; }
    setSaving(true);
    try {
      const d = description.trim() || null;
      const res = isEdit
        ? await updateProjectLink(link!.id, { name: n, description: d, url: u })
        : await createProjectLink({ projectId, name: n, description: d, url: u });
      if (res.error) { alert(res.error); return; }
      onClose();
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title={isEdit ? "Edit link" : "New link"} onClose={onClose}>
      <div className="px-5 py-4 flex flex-col gap-4">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Figma mockup"
            className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
        </div>
        <DescriptionField value={description} onChange={setDescription} />
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
        </div>
      </div>
      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} />
    </ModalShell>
  );
}

function LinksContent({
  projectId,
  links,
  profiles,
  currentUserId,
  isAdminOrManager,
  onRefresh,
}: {
  projectId: string;
  links: ProjectLink[];
  profiles: Profile[];
  currentUserId: string;
  isAdminOrManager: boolean;
  onRefresh: () => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectLink | null>(null);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <h3 className="text-heading-3 text-text-primary">Links</h3>
        {isAdminOrManager && (
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="bg-accent hover:bg-accent-hover text-white text-xs font-medium px-3 py-1.5 rounded-md"
          >
            + New link
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {!links.length ? (
          <EmptyState noun="links" canCreate={isAdminOrManager} hint='Click "+ New link" to add one.' />
        ) : (
          <ul>
            {links.map((l) => {
              const canEdit = isAdminOrManager || l.created_by === currentUserId;
              return (
                <li key={l.id} className="flex items-center gap-3 px-6 py-3 border-b border-border last:border-b-0 hover:bg-muted/30">
                  <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-text-primary truncate">{l.name}</p>
                    <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-accent hover:underline truncate block">
                      {l.url}
                    </a>
                    {l.description && (
                      <p className="text-xs text-text-secondary mt-0.5 whitespace-pre-wrap">{l.description}</p>
                    )}
                    <p className="text-[11px] text-text-muted truncate">
                      {ownerName(profiles, l.created_by)} · {new Date(l.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  {canEdit && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => { setEditing(l); setModalOpen(true); }} className="text-[11px] text-text-muted hover:text-text-primary px-2 py-1">Edit</button>
                      <button
                        onClick={async () => {
                          if (!confirm(`Delete "${l.name}"?`)) return;
                          const res = await deleteProjectLink(l.id);
                          if (res.error) { alert(res.error); return; }
                          onRefresh();
                        }}
                        className="text-[11px] text-text-muted hover:text-red-400 px-2 py-1"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {modalOpen && (
        <LinkModal
          projectId={projectId}
          link={editing}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSaved={onRefresh}
        />
      )}
    </div>
  );
}

// ── Videos ─────────────────────────────────────────────────────────────────────

function VideoModal({
  projectId,
  video,
  onClose,
  onSaved,
}: {
  projectId: string;
  video: ProjectVideo | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = video !== null;
  const [name, setName] = useState(video?.name ?? "");
  const [description, setDescription] = useState(video?.description ?? "");
  const [url, setUrl] = useState(video?.url ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const n = name.trim();
    const u = url.trim();
    if (!n) { alert("Please enter a name."); return; }
    if (!u) { alert("Please enter a URL."); return; }
    setSaving(true);
    try {
      const d = description.trim() || null;
      const res = isEdit
        ? await updateProjectVideo(video!.id, { name: n, description: d, url: u })
        : await createProjectVideo({ projectId, name: n, description: d, url: u });
      if (res.error) { alert(res.error); return; }
      onClose();
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title={isEdit ? "Edit video" : "New video"} onClose={onClose}>
      <div className="px-5 py-4 flex flex-col gap-4">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Kickoff recording"
            className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
        </div>
        <DescriptionField value={description} onChange={setDescription} />
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
        </div>
      </div>
      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} />
    </ModalShell>
  );
}

function VideosContent({
  projectId,
  videos,
  profiles,
  currentUserId,
  isAdminOrManager,
  onRefresh,
}: {
  projectId: string;
  videos: ProjectVideo[];
  profiles: Profile[];
  currentUserId: string;
  isAdminOrManager: boolean;
  onRefresh: () => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectVideo | null>(null);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <h3 className="text-heading-3 text-text-primary">Videos</h3>
        {isAdminOrManager && (
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="bg-accent hover:bg-accent-hover text-white text-xs font-medium px-3 py-1.5 rounded-md"
          >
            + New video
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {!videos.length ? (
          <EmptyState noun="videos" canCreate={isAdminOrManager} hint='Click "+ New video" to add a link.' />
        ) : (
          <ul>
            {videos.map((v) => {
              const canEdit = isAdminOrManager || v.created_by === currentUserId;
              return (
                <li key={v.id} className="flex items-center gap-3 px-6 py-3 border-b border-border last:border-b-0 hover:bg-muted/30">
                  <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-text-primary truncate">{v.name ?? "Untitled"}</p>
                    {v.url && (
                      <a href={v.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-accent hover:underline truncate block">
                        {v.url}
                      </a>
                    )}
                    {v.description && (
                      <p className="text-xs text-text-secondary mt-0.5 whitespace-pre-wrap">{v.description}</p>
                    )}
                    <p className="text-[11px] text-text-muted truncate">
                      {ownerName(profiles, v.created_by)} · {new Date(v.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  {canEdit && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => { setEditing(v); setModalOpen(true); }} className="text-[11px] text-text-muted hover:text-text-primary px-2 py-1">Edit</button>
                      <button
                        onClick={async () => {
                          if (!confirm(`Delete "${v.name ?? "Untitled"}"?`)) return;
                          const res = await deleteProjectVideo(v.id);
                          if (res.error) { alert(res.error); return; }
                          onRefresh();
                        }}
                        className="text-[11px] text-text-muted hover:text-red-400 px-2 py-1"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {modalOpen && (
        <VideoModal
          projectId={projectId}
          video={editing}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSaved={onRefresh}
        />
      )}
    </div>
  );
}

// ── Daily Feedback ─────────────────────────────────────────────────────────────

function FeedbackBlock({ label, html }: { label: string; html: string | null }) {
  const empty = !html || html.trim() === "" || html === "<p></p>";
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-text-muted mb-1">{label}</p>
      {empty ? (
        <p className="text-xs italic text-text-muted">—</p>
      ) : (
        <div
          className="prose prose-sm prose-invert max-w-none text-xs text-text-primary"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: html ?? "" }}
        />
      )}
    </div>
  );
}

function FeedbackModal({
  projectId,
  feedback,
  onClose,
  onSaved,
}: {
  projectId: string;
  feedback: ProjectDailyFeedback | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = feedback !== null;
  const [saving, startSave] = useTransition();
  const [startDate, setStartDate] = useState(feedback?.start_date ?? feedback?.date ?? new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(feedback?.end_date ?? feedback?.date ?? new Date().toISOString().slice(0, 10));
  const [totalTime, setTotalTime] = useState<string>(feedback?.total_time != null ? String(feedback.total_time) : "");
  const currentStateRef = useRef<RichTextEditorHandle>(null);
  const todayRef = useRef<RichTextEditorHandle>(null);
  const tomorrowRef = useRef<RichTextEditorHandle>(null);
  const blockersRef = useRef<RichTextEditorHandle>(null);
  const linksRef = useRef<RichTextEditorHandle>(null);

  function handleSave() {
    if (!startDate || !endDate) { alert("Please pick a start and end date."); return; }
    if (startDate > endDate) { alert("Start date must be on or before end date."); return; }
    const parsedTotal = totalTime.trim() === "" ? null : Number(totalTime);
    if (parsedTotal !== null && (Number.isNaN(parsedTotal) || parsedTotal < 0)) {
      alert("Total time must be a non-negative number."); return;
    }
    const payload = {
      start_date: startDate,
      end_date: endDate,
      total_time: parsedTotal,
      current_state: currentStateRef.current?.getHTML() ?? null,
      current_work: todayRef.current?.getHTML() ?? null,
      next_work: tomorrowRef.current?.getHTML() ?? null,
      blockers: blockersRef.current?.getHTML() ?? null,
      video_and_links: linksRef.current?.getHTML() ?? null,
    };
    startSave(async () => {
      const res = isEdit
        ? await updateDailyFeedback(feedback!.id, payload)
        : await createDailyFeedback({ projectId, ...payload });
      if (res.error) { alert(res.error); return; }
      onClose();
      onSaved();
    });
  }

  const fields: Array<{ label: string; ref: React.RefObject<RichTextEditorHandle | null>; html: string }> = [
    { label: "What we have now", ref: currentStateRef, html: feedback?.current_state ?? "" },
    { label: "What I worked on this period", ref: todayRef, html: feedback?.current_work ?? "" },
    { label: "What I will work on next", ref: tomorrowRef, html: feedback?.next_work ?? "" },
    { label: "Next week forecast & blockers", ref: blockersRef, html: feedback?.blockers ?? "" },
    { label: "Video & Links", ref: linksRef, html: feedback?.video_and_links ?? "" },
  ];

  return (
    <ModalShell title={isEdit ? "Edit work feedback" : "New work feedback"} wide onClose={onClose}>
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium uppercase tracking-wider text-text-muted">Start date</label>
            <DatePicker value={startDate} onChange={setStartDate} size="compact" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium uppercase tracking-wider text-text-muted">End date</label>
            <DatePicker value={endDate} onChange={setEndDate} size="compact" minDate={startDate} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium uppercase tracking-wider text-text-muted">Total time worked (h)</label>
            <input
              type="number"
              min={0}
              step="0.25"
              value={totalTime}
              onChange={(e) => setTotalTime(e.target.value)}
              placeholder="0"
              className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map(({ label, ref, html }) => (
            <div key={label} className="flex flex-col gap-1">
              <label className="text-[11px] font-medium uppercase tracking-wider text-text-muted">{label}</label>
              <div className="border border-border rounded-md overflow-y-auto bg-muted/30 max-h-[360px]">
                <RichTextEditor ref={ref} initialHtml={html} hideFooter autoHeight />
              </div>
            </div>
          ))}
        </div>
      </div>
      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} />
    </ModalShell>
  );
}

function FeedbackContent({
  projectId,
  feedbacks,
  profiles,
  currentUserId,
  isAdminOrManager,
  onRefresh,
}: {
  projectId: string;
  feedbacks: ProjectDailyFeedback[];
  profiles: Profile[];
  currentUserId: string;
  isAdminOrManager: boolean;
  onRefresh: () => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectDailyFeedback | null>(null);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <h3 className="text-heading-3 text-text-primary">Work Feedback</h3>
        {isAdminOrManager && (
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="bg-accent hover:bg-accent-hover text-white text-xs font-medium px-3 py-1.5 rounded-md"
          >
            + New entry
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {!feedbacks.length ? (
          <EmptyState noun="entries" canCreate={isAdminOrManager} hint='Click "+ New entry" to share today&apos;s progress.' />
        ) : (
          <ul className="p-6 flex flex-col gap-4">
            {feedbacks.map((f) => {
              const owner = profiles.find((p) => p.id === f.created_by);
              const name = owner ? [owner.first_name, owner.last_name].filter(Boolean).join(" ") || "?" : "?";
              const canEdit = isAdminOrManager || f.created_by === currentUserId;
              const fmt = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-US", {
                year: "numeric", month: "long", day: "numeric",
              });
              const dateDisplay =
                f.start_date && f.end_date
                  ? `${fmt(f.start_date)} → ${fmt(f.end_date)}`
                  : fmt(f.start_date ?? f.date);
              return (
                <li key={f.id} className="bg-surface border border-border rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white text-[10px] font-semibold overflow-hidden shrink-0">
                        {owner?.picture ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={owner.picture} alt={name} className="w-full h-full object-cover" />
                        ) : (
                          name[0]?.toUpperCase() ?? "?"
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {dateDisplay}
                          {f.total_time != null ? ` · ${f.total_time}h` : ""}
                        </p>
                        <p className="text-[11px] text-text-muted truncate">
                          {name}{f.updated_at && f.updated_at !== f.created_at ? " · edited" : ""}
                        </p>
                      </div>
                    </div>
                    {canEdit && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => { setEditing(f); setModalOpen(true); }} className="text-[11px] text-text-muted hover:text-text-primary px-2 py-1">Edit</button>
                        <button
                          onClick={async () => {
                            if (!confirm("Delete this work feedback?")) return;
                            const res = await deleteDailyFeedback(f.id);
                            if (res.error) { alert(res.error); return; }
                            onRefresh();
                          }}
                          className="text-[11px] text-text-muted hover:text-red-400 px-2 py-1"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                    <FeedbackBlock label="What we have now" html={f.current_state} />
                    <FeedbackBlock label="What I worked on this period" html={f.current_work} />
                    <FeedbackBlock label="What I will work on next" html={f.next_work} />
                    <FeedbackBlock label="Next week forecast & blockers" html={f.blockers} />
                    <FeedbackBlock label="Video & Links" html={f.video_and_links} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {modalOpen && (
        <FeedbackModal
          projectId={projectId}
          feedback={editing}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSaved={onRefresh}
        />
      )}
    </div>
  );
}

// ── Main panel ─────────────────────────────────────────────────────────────────

export default function ProjectTabsPanel({
  projectId,
  tab,
}: {
  projectId: string;
  tab: Exclude<ChatTab, "messages">;
}) {
  const [state, setState] = useState<PanelState | null>(null);
  const [tick, setTick] = useState(0);
  // Guards against overlapping polls. Each load() fans out to several server
  // actions, which share one client-side queue; without this guard a slow cycle
  // lets ticks pile up unbounded and starve the user's save action.
  const loadingRef = useRef(false);

  function refresh() {
    setTick((t) => t + 1);
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (loadingRef.current) return; // a previous poll is still in flight — skip
      loadingRef.current = true;
      try {
        const [meta, files, links, videos, feedbacks] = await Promise.all([
          getProjectForTabs(projectId),
          getProjectFiles(projectId),
          getProjectLinks(projectId),
          getProjectVideos(projectId),
          getProjectDailyFeedbacks(projectId),
        ]);
        if (cancelled) return;
        setState({
          profiles: (meta.profiles as unknown as Profile[]),
          currentUserId: meta.currentUserId,
          isAdminOrManager: meta.isAdminOrManager,
          files,
          links,
          videos,
          feedbacks,
        });
      } finally {
        loadingRef.current = false;
      }
    }

    void load();
    const id = window.setInterval(() => {
      // Don't poll while the tab is hidden — avoids flooding when backgrounded.
      if (document.visibilityState === "visible") void load();
    }, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [projectId, tick]);

  if (!state) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-text-muted">
        Loading…
      </div>
    );
  }

  const common = {
    projectId,
    profiles: state.profiles,
    currentUserId: state.currentUserId,
    isAdminOrManager: state.isAdminOrManager,
    onRefresh: refresh,
  };

  if (tab === "files") return <FilesContent {...common} files={state.files} />;
  if (tab === "links") return <LinksContent {...common} links={state.links} />;
  if (tab === "videos") return <VideosContent {...common} videos={state.videos} />;
  return <FeedbackContent {...common} feedbacks={state.feedbacks} />;
}
