"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Project, UserType } from "@/types/projects";
import type { Feedback } from "@/types/feedback";
import { createFeedback, updateFeedback } from "../actions";
import StarRow from "./StarRow";

type ProjectLite = Pick<Project, "id" | "name" | "authorized_users">;

interface Props {
  projects: ProjectLite[];
  feedback: Feedback | null;
  currentUserType: UserType | null;
  onClose: () => void;
}

export default function FeedbackFormModal({
  projects,
  feedback,
  onClose,
}: Props) {
  const router = useRouter();
  const [saving, startSave] = useTransition();
  const isEdit = !!feedback;

  // Project is OPTIONAL per Part 2 item 10 — `feedback.project_id` is
  // nullable in the schema. The picker now offers a "(no project)"
  // option and the submit button no longer requires a project.
  const [projectId, setProjectId] = useState<string>(
    feedback?.project_id ?? ""
  );
  const [rating, setRating] = useState<number>(feedback?.rating ?? 0);
  const [comment, setComment] = useState<string>(feedback?.comment ?? "");

  // Submit when there's at least a rating OR a comment — feedback should
  // carry SOME content even if it's not project-scoped.
  const canSubmit = rating > 0 || comment.trim().length > 0;

  function handleSave() {
    if (!canSubmit) {
      alert("Please add a rating or a comment before saving.");
      return;
    }
    startSave(async () => {
      const payload = {
        project_id: projectId || null,
        rating: rating || null,
        comment: comment.trim() || null,
      };
      const res = isEdit
        ? await updateFeedback(feedback!.id, payload)
        : await createFeedback(payload);
      if (res.error) {
        alert(res.error);
        return;
      }
      router.refresh();
      onClose();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-border rounded-lg w-full max-w-lg overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold text-text-primary">Feedback</h2>
          <button
            onClick={onClose}
            className="p-1 text-text-muted hover:text-text-primary"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
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

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-5">
          {/* Project (optional) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-secondary">
              Project <span className="text-text-muted">(optional)</span>
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="px-3 py-2 rounded-md bg-base border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
            >
              <option value="">— No project —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Rating */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-secondary">
              Rating
            </label>
            <StarRow value={rating} onChange={setRating} size="lg" />
          </div>

          {/* Comment */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-secondary">
              Comment
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us your experience working with us…"
              rows={5}
              className="px-3 py-2 rounded-md bg-base border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-6 py-3 border-t border-border bg-muted/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md border border-border text-text-secondary hover:text-text-primary hover:border-accent"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !canSubmit}
            className="px-5 py-2 text-sm font-semibold rounded-md bg-accent hover:bg-accent-hover text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : isEdit ? "Save" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
