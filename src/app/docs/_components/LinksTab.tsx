"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Project, UserProfile } from "@/types/projects";
import type { ProjectLink } from "@/types/docs";
import { deleteProjectLink } from "../actions";
import LinkFormModal from "./modals/LinkFormModal";

interface Props {
  project: Project;
  profiles: UserProfile[];
  links: ProjectLink[];
  currentUserId: string;
  isAdminOrManager: boolean;
}

export default function LinksTab({
  project,
  profiles,
  links,
  currentUserId,
  isAdminOrManager,
}: Props) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectLink | null>(null);

  const profileById = new Map(profiles.map((p) => [p.id, p]));
  // Per the privacy spec, only admin/manager may create new links.
  const canCreate = isAdminOrManager;

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(l: ProjectLink) {
    setEditing(l);
    setFormOpen(true);
  }

  async function handleDelete(l: ProjectLink) {
    if (!confirm(`Delete link "${l.name}"?`)) return;
    const res = await deleteProjectLink(l.id);
    if (res.error) {
      alert(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <h3 className="text-heading-3 text-text-primary">Links</h3>
        {canCreate && (
          <button
            onClick={openCreate}
            className="bg-accent hover:bg-accent-hover text-white text-xs font-medium px-3 py-1.5 rounded-md"
          >
            + New link
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {links.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center p-10">
            <div>
              <h4 className="text-sm font-medium text-text-primary mb-1">
                No links yet
              </h4>
              <p className="text-xs text-text-muted">
                {canCreate
                  ? 'Click "+ New link" to add the first link.'
                  : "No links have been shared for this project."}
              </p>
            </div>
          </div>
        ) : (
          <ul>
            {links.map((l) => {
              const owner = profileById.get(l.created_by);
              const ownerName = owner
                ? [owner.first_name, owner.last_name].filter(Boolean).join(" ") || "?"
                : "?";
              const canEdit = isAdminOrManager || l.created_by === currentUserId;
              const canDelete = canEdit;

              return (
                <li
                  key={l.id}
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
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-text-primary truncate">{l.name}</p>
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-accent hover:underline truncate block"
                    >
                      {l.url}
                    </a>
                    <p className="text-[11px] text-text-muted truncate">
                      {ownerName} · {new Date(l.updated_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {canEdit && (
                      <button
                        onClick={() => openEdit(l)}
                        className="text-[11px] text-text-muted hover:text-text-primary px-2 py-1"
                      >
                        Edit
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(l)}
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
        <LinkFormModal
          project={project}
          link={editing}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
