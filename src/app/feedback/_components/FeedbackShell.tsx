"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { UserProfile, UserType, Project } from "@/types/projects";
import { USER_TYPE_LABELS } from "@/types/projects";
import type { Feedback } from "@/types/feedback";
import { deleteFeedback } from "../actions";
import FeedbackCard from "./FeedbackCard";
import FeedbackFormModal from "./FeedbackFormModal";

type ProjectLite = Pick<Project, "id" | "name" | "authorized_users">;

interface Props {
  currentUserId: string;
  currentUserType: UserType | null;
  isAdminOrManager: boolean;
  profiles: UserProfile[];
  projects: ProjectLite[];
  feedback: Feedback[];
}

const ALL_USER_TYPES: UserType[] = [
  "admin",
  "manager",
  "operational",
  "developer",
  "client",
  "qa",
  "referrer",
  "lead",
];

export default function FeedbackShell({
  currentUserId,
  currentUserType,
  isAdminOrManager,
  profiles,
  projects,
  feedback,
}: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState<UserType | "">("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Feedback | null>(null);

  const profileById = useMemo(
    () => new Map(profiles.map((p) => [p.id, p])),
    [profiles]
  );
  const projectById = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects]
  );

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return feedback.filter((f) => {
      if (userTypeFilter && f.user_type !== userTypeFilter) return false;
      if (!needle) return true;
      const author = f.created_by ? profileById.get(f.created_by) : null;
      const name =
        [author?.first_name, author?.last_name].filter(Boolean).join(" ") ||
        "";
      return name.toLowerCase().includes(needle);
    });
  }, [feedback, userTypeFilter, search, profileById]);

  const average = useMemo(() => {
    const rated = visible.filter(
      (f) => typeof f.rating === "number" && !Number.isNaN(f.rating!)
    );
    if (rated.length === 0) return null;
    const sum = rated.reduce((acc, f) => acc + (f.rating ?? 0), 0);
    return Math.round((sum / rated.length) * 10) / 10;
  }, [visible]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(f: Feedback) {
    setEditing(f);
    setFormOpen(true);
  }
  async function handleDelete(f: Feedback) {
    if (!confirm("Delete this feedback?")) return;
    const res = await deleteFeedback(f.id);
    if (res.error) alert(res.error);
    else router.refresh();
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-6 pt-6 pb-4 shrink-0">
        <h1 className="text-xl font-bold text-text-primary mr-2">Feedback</h1>

        <div className="flex-1 max-w-xl">
          <div className="relative">
            <svg
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user name"
              className="w-full pl-9 pr-3 py-2 rounded-md bg-surface border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
            />
          </div>
        </div>

        <select
          value={userTypeFilter}
          onChange={(e) => setUserTypeFilter(e.target.value as UserType | "")}
          className="px-3 py-2 rounded-md bg-surface border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
        >
          <option value="">User type</option>
          {ALL_USER_TYPES.map((t) => (
            <option key={t} value={t}>
              {USER_TYPE_LABELS[t]}
            </option>
          ))}
        </select>

        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-accent hover:bg-accent-hover text-white text-sm font-medium"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Feedback
        </button>
      </div>

      {/* ── Stats bar ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 pb-3 shrink-0">
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <span>Average Rating:</span>
          <span className="font-semibold text-text-primary">
            {average !== null ? average.toFixed(1) : "—"}
          </span>
          {average !== null && (
            <svg
              className="w-4 h-4 text-yellow-400"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          )}
        </div>
        <div className="text-sm text-text-muted">
          {visible.length} Feedback{visible.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* ── List ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {visible.length === 0 ? (
          <div className="flex items-center justify-center text-center p-12">
            <div>
              <h3 className="text-heading-3 text-text-primary mb-2">
                No feedback found
              </h3>
              <p className="text-sm text-text-muted">
                Click "New Feedback" to share your experience.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {visible.map((f) => {
              const author = f.created_by ? profileById.get(f.created_by) : null;
              const project = f.project_id ? projectById.get(f.project_id) : null;
              const canEdit =
                isAdminOrManager || f.created_by === currentUserId;
              return (
                <FeedbackCard
                  key={f.id}
                  feedback={f}
                  author={author ?? null}
                  projectName={project?.name ?? null}
                  canEdit={canEdit}
                  onEdit={() => openEdit(f)}
                  onDelete={() => handleDelete(f)}
                />
              );
            })}
          </div>
        )}
      </div>

      {formOpen && (
        <FeedbackFormModal
          projects={projects}
          feedback={editing}
          currentUserType={currentUserType}
          onClose={() => setFormOpen(false)}
        />
      )}
    </div>
  );
}
