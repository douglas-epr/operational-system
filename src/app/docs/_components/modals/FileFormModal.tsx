"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Project } from "@/types/projects";
import type { DocsAttachment, ProjectFile } from "@/types/docs";
import { createProjectFile, updateProjectFile } from "../../actions";

interface Props {
  project: Project;
  file: ProjectFile | null;
  onClose: () => void;
}

const BUCKET = "project-files";
const MAX_FILE_MB = 50;

export default function FileFormModal({ project, file, onClose }: Props) {
  const router = useRouter();
  const isEdit = file !== null;

  const [name, setName] = useState(file?.name ?? "");
  const [attachments, setAttachments] = useState<DocsAttachment[]>(
    file?.attachments ?? []
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function uploadFiles(files: FileList): Promise<DocsAttachment[]> {
    const supabase = createClient();
    const out: DocsAttachment[] = [];
    for (const f of Array.from(files)) {
      if (f.size > MAX_FILE_MB * 1024 * 1024) {
        alert(`File "${f.name}" is larger than ${MAX_FILE_MB}MB.`);
        continue;
      }
      const ext = f.name.includes(".") ? f.name.split(".").pop() : "";
      const path = `${project.id}/${crypto.randomUUID()}${ext ? "." + ext : ""}`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, f, { upsert: false, contentType: f.type || undefined });
      if (error) {
        alert(`Upload failed: ${error.message}`);
        continue;
      }
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      out.push({
        path,
        url: data.publicUrl,
        name: f.name,
        size: f.size,
        type: f.type || "application/octet-stream",
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
      setAttachments((prev) => [...prev, ...uploaded]);
      // Seed name from first file if empty.
      if (!name && uploaded[0]) setName(uploaded[0].name);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function removeAttachment(idx: number) {
    const att = attachments[idx];
    if (!att) return;
    const supabase = createClient();
    await supabase.storage.from(BUCKET).remove([att.path]);
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      alert("Please enter a name.");
      return;
    }
    if (attachments.length === 0) {
      alert("Please upload at least one file.");
      return;
    }
    setSaving(true);
    try {
      const res = isEdit
        ? await updateProjectFile(file!.id, { name: trimmed, attachments })
        : await createProjectFile({
            projectId: project.id,
            name: trimmed,
            attachments,
          });
      if (res.error) {
        alert(res.error);
        return;
      }
      onClose();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface border border-border rounded-lg w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h3 className="text-heading-3 text-text-primary">
            {isEdit ? "Edit file" : "New file"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-text-muted hover:text-text-primary"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Brand guidelines"
              className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Files
            </label>
            <div className="flex flex-col gap-2">
              {attachments.length > 0 && (
                <ul className="flex flex-col gap-1.5">
                  {attachments.map((a, i) => (
                    <li
                      key={a.path}
                      className="flex items-center gap-2 bg-muted border border-border rounded-md px-2 py-1.5"
                    >
                      <svg
                        className="w-3.5 h-3.5 text-text-muted shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-xs text-text-primary truncate hover:underline"
                      >
                        {a.name}
                      </a>
                      <button
                        onClick={() => removeAttachment(i)}
                        className="text-text-muted hover:text-red-400 text-xs"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-xs border border-dashed border-border rounded-md px-3 py-2 text-text-secondary hover:bg-muted/50 disabled:opacity-50"
              >
                {uploading ? "Uploading…" : "+ Add files"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleAttach}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border shrink-0">
          <button
            onClick={onClose}
            className="text-xs text-text-secondary hover:text-text-primary px-3 py-1.5"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="bg-accent hover:bg-accent-hover text-white text-xs font-medium px-3 py-1.5 rounded-md disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
