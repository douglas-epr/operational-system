"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/types/projects";
import type { ProjectVideo } from "@/types/docs";
import { createProjectVideo, updateProjectVideo } from "../../actions";

interface Props {
  project: Project;
  video: ProjectVideo | null;
  onClose: () => void;
}

export default function VideoFormModal({ project, video, onClose }: Props) {
  const router = useRouter();
  const isEdit = video !== null;

  const [name, setName] = useState(video?.name ?? "");
  const [url, setUrl] = useState(video?.url ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const n = name.trim();
    const u = url.trim();
    if (!n) {
      alert("Please enter a name.");
      return;
    }
    if (!u) {
      alert("Please enter a URL.");
      return;
    }
    setSaving(true);
    try {
      const res = isEdit
        ? await updateProjectVideo(video!.id, { name: n, url: u })
        : await createProjectVideo({ projectId: project.id, name: n, url: u });
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
      <div className="bg-surface border border-border rounded-lg w-full max-w-md flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h3 className="text-heading-3 text-text-primary">
            {isEdit ? "Edit video" : "New video"}
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

        <div className="px-5 py-4 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kickoff recording"
              className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
            />
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
            disabled={saving}
            className="bg-accent hover:bg-accent-hover text-white text-xs font-medium px-3 py-1.5 rounded-md disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
