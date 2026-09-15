"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sanitizeHtml } from "@/lib/sanitize";
import type { Project, UserProfile } from "@/types/projects";
import type { ProjectDailyFeedback } from "@/types/docs";
import { deleteDailyFeedback } from "../actions";
import DailyFeedbackFormModal from "./modals/DailyFeedbackFormModal";

interface Props {
  project: Project;
  profiles: UserProfile[];
  feedbacks: ProjectDailyFeedback[];
  currentUserId: string;
  isAdminOrManager: boolean;
}

export default function DailyFeedbackTab({
  project,
  profiles,
  feedbacks,
  currentUserId,
  isAdminOrManager,
}: Props) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectDailyFeedback | null>(null);

  const profileById = new Map(profiles.map((p) => [p.id, p]));
  // Per the privacy spec, only admin/manager may create new feedbacks.
  const canCreate = isAdminOrManager;

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(f: ProjectDailyFeedback) {
    setEditing(f);
    setFormOpen(true);
  }

  async function handleDelete(f: ProjectDailyFeedback) {
    if (!confirm(`Delete feedback for ${f.date}?`)) return;
    const res = await deleteDailyFeedback(f.id);
    if (res.error) {
      alert(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <h3 className="text-heading-3 text-text-primary">Work Feedback</h3>
        {canCreate && (
          <button
            onClick={openCreate}
            className="bg-accent hover:bg-accent-hover text-white text-xs font-medium px-3 py-1.5 rounded-md"
          >
            + New entry
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {feedbacks.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center p-10">
            <div>
              <h4 className="text-sm font-medium text-text-primary mb-1">
                No entries yet
              </h4>
              <p className="text-xs text-text-muted">
                {canCreate
                  ? 'Click "+ New entry" to share your work progress.'
                  : "No work feedback has been shared for this project."}
              </p>
            </div>
          </div>
        ) : (
          <ul className="p-6 flex flex-col gap-4">
            {feedbacks.map((f) => {
              const owner = profileById.get(f.created_by);
              const ownerName = owner
                ? [owner.first_name, owner.last_name].filter(Boolean).join(" ") || "?"
                : "?";
              const canEdit =
                isAdminOrManager || f.created_by === currentUserId;
              const canDelete = canEdit;
              // Pin the locale so the server (en) and the client (e.g. pt-BR
              // for Brazilian users) render the same string — otherwise the
              // SSR HTML mismatches and React tears down the subtree.
              const fmt = (d: string) =>
                new Date(`${d}T00:00:00`).toLocaleDateString("en-US", {
                  year: "numeric", month: "long", day: "numeric",
                });
              const dateDisplay =
                f.start_date && f.end_date
                  ? `${fmt(f.start_date)} → ${fmt(f.end_date)}`
                  : fmt(f.start_date ?? f.date);

              return (
                <li
                  key={f.id}
                  className="bg-surface border border-border rounded-lg overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white text-[10px] font-semibold overflow-hidden shrink-0">
                        {owner?.picture ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={owner.picture}
                            alt={ownerName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          ownerName[0]?.toUpperCase() ?? "?"
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {dateDisplay}
                          {f.total_time != null ? ` · ${f.total_time}h` : ""}
                        </p>
                        <p className="text-[11px] text-text-muted truncate">
                          {ownerName}
                          {f.updated_at && f.updated_at !== f.created_at
                            ? " · edited"
                            : ""}
                        </p>
                      </div>
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                    <FeedbackBlock
                      label="What we have now"
                      html={f.current_state}
                    />
                    <FeedbackBlock
                      label="What I worked on this period"
                      html={f.current_work}
                    />
                    <FeedbackBlock
                      label="What I will work on next"
                      html={f.next_work}
                    />
                    <FeedbackBlock label="Blockers" html={f.blockers} />
                    <FeedbackBlock
                      label="Video & Links"
                      html={f.video_and_links}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {formOpen && (
        <DailyFeedbackFormModal
          project={project}
          feedback={editing}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function FeedbackBlock({
  label,
  html,
}: {
  label: string;
  html: string | null;
}) {
  const empty = !html || html.trim() === "" || html === "<p></p>";
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-text-muted mb-1">
        {label}
      </p>
      {empty ? (
        <p className="text-xs italic text-text-muted">—</p>
      ) : (
        <div
          className="prose prose-sm prose-invert max-w-none text-xs text-text-primary"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(html ?? "") }}
        />
      )}
    </div>
  );
}
