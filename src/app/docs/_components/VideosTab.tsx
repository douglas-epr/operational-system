"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Project, UserProfile } from "@/types/projects";
import type { ProjectVideo } from "@/types/docs";
import { deleteProjectVideo } from "../actions";
import VideoFormModal from "./modals/VideoFormModal";

interface Props {
  project: Project;
  profiles: UserProfile[];
  videos: ProjectVideo[];
  currentUserId: string;
  isAdminOrManager: boolean;
}

export default function VideosTab({
  project,
  profiles,
  videos,
  currentUserId,
  isAdminOrManager,
}: Props) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectVideo | null>(null);

  const profileById = new Map(profiles.map((p) => [p.id, p]));
  // Per the privacy spec, only admin/manager may add new videos.
  const canCreate = isAdminOrManager;

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(v: ProjectVideo) {
    setEditing(v);
    setFormOpen(true);
  }

  async function handleDelete(v: ProjectVideo) {
    if (!confirm(`Delete video "${v.name ?? "Untitled"}"?`)) return;
    const res = await deleteProjectVideo(v.id);
    if (res.error) {
      alert(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <h3 className="text-heading-3 text-text-primary">Videos</h3>
        {canCreate && (
          <button
            onClick={openCreate}
            className="bg-accent hover:bg-accent-hover text-white text-xs font-medium px-3 py-1.5 rounded-md"
          >
            + New video
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {videos.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center p-10">
            <div>
              <h4 className="text-sm font-medium text-text-primary mb-1">
                No videos yet
              </h4>
              <p className="text-xs text-text-muted">
                {canCreate
                  ? 'Click "+ New video" to add the first video link.'
                  : "No videos have been shared for this project."}
              </p>
            </div>
          </div>
        ) : (
          <ul>
            {videos.map((v) => {
              const owner = profileById.get(v.created_by);
              const ownerName = owner
                ? [owner.first_name, owner.last_name].filter(Boolean).join(" ") || "?"
                : "?";
              const canEdit = isAdminOrManager || v.created_by === currentUserId;
              const canDelete = canEdit;

              return (
                <li
                  key={v.id}
                  className="flex items-center gap-3 px-6 py-3 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
                >
                  <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <svg
                      className="w-4 h-4 text-text-muted"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-text-primary truncate">
                      {v.name ?? "Untitled"}
                    </p>
                    {v.url && (
                      <a
                        href={v.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-accent hover:underline truncate block"
                      >
                        {v.url}
                      </a>
                    )}
                    <p className="text-[11px] text-text-muted truncate">
                      {ownerName} · {new Date(v.updated_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {canEdit && (
                      <button
                        onClick={() => openEdit(v)}
                        className="text-[11px] text-text-muted hover:text-text-primary px-2 py-1"
                      >
                        Edit
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(v)}
                        className="text-[11px] text-text-muted hover:text-red-400 px-2 py-1"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {formOpen && (
        <VideoFormModal
          project={project}
          video={editing}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
