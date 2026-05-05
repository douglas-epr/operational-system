"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Project, UserProfile } from "@/types/projects";
import type { DocsAttachment, ProjectFile } from "@/types/docs";
import { deleteProjectFile } from "../actions";
import FileFormModal from "./modals/FileFormModal";
import AttachmentTile from "./AttachmentTile";

interface Props {
  project: Project;
  profiles: UserProfile[];
  files: ProjectFile[];
  currentUserId: string;
  isAdminOrManager: boolean;
}

const BUCKET = "project-files";

export default function FilesTab({
  project,
  profiles,
  files,
  currentUserId,
  isAdminOrManager,
}: Props) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectFile | null>(null);

  const profileById = new Map(profiles.map((p) => [p.id, p]));
  // Per the privacy spec, only admin/manager may upload new files.
  const canCreate = isAdminOrManager;

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(f: ProjectFile) {
    setEditing(f);
    setFormOpen(true);
  }

  async function removeStorageFiles(attachments: DocsAttachment[]) {
    if (attachments.length === 0) return;
    const supabase = createClient();
    await supabase.storage.from(BUCKET).remove(attachments.map((a) => a.path));
  }

  async function handleDelete(f: ProjectFile) {
    if (!confirm(`Delete file "${f.name}"?`)) return;
    await removeStorageFiles(f.attachments);
    const res = await deleteProjectFile(f.id);
    if (res.error) {
      alert(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <h3 className="text-heading-3 text-text-primary">Files</h3>
        {canCreate && (
          <button
            onClick={openCreate}
            className="bg-accent hover:bg-accent-hover text-white text-xs font-medium px-3 py-1.5 rounded-md"
          >
            + New file
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {files.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center p-10">
            <div>
              <h4 className="text-sm font-medium text-text-primary mb-1">
                No files yet
              </h4>
              <p className="text-xs text-text-muted">
                {canCreate
                  ? 'Click "+ New file" to upload your first file.'
                  : "No files have been shared for this project."}
              </p>
            </div>
          </div>
        ) : (
          <ul>
            {files.map((f) => {
              const owner = profileById.get(f.created_by);
              const ownerName = owner
                ? [owner.first_name, owner.last_name].filter(Boolean).join(" ") || "?"
                : "?";
              const canEdit = isAdminOrManager || f.created_by === currentUserId;
              const canDelete = canEdit;

              return (
                <li
                  key={f.id}
                  className="flex flex-col gap-2 px-6 py-4 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {f.name}
                      </p>
                      <p className="text-[11px] text-text-muted truncate">
                        {f.attachments.length}{" "}
                        {f.attachments.length === 1 ? "file" : "files"} ·{" "}
                        {ownerName} ·{" "}
                        {new Date(f.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {canEdit && (
                        <button
                          onClick={() => openEdit(f)}
                          className="text-[11px] text-text-muted hover:text-text-primary px-2 py-1"
                        >
                          Edit
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(f)}
                          className="text-[11px] text-text-muted hover:text-red-400 px-2 py-1"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  {f.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                      {f.attachments.map((a) => (
                        <AttachmentTile key={a.path} attachment={a} size={48} />
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {formOpen && (
        <FileFormModal
          project={project}
          file={editing}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
