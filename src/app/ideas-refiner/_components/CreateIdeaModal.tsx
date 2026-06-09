/**
 * Create / Edit Idea modal.
 * Collects name (required), description (required), and optional project,
 * then calls the createIdea or updateIdea server action depending on mode.
 * Pass `idea` to switch to edit mode — the fields are prefilled and the
 * submit button updates the existing row.
 */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/app/projects/_components/modals/Modal";
import type { Idea, ProjectOption } from "@/types/idea-refiner";
import { createIdea, updateIdea } from "../actions";
import { cn } from "@/lib/utils";
import RichTextEditor from "./RichTextEditor";
import { isBlankHtml } from "../_hooks/useAutoTriggerAi";

interface CreateIdeaModalProps {
  open: boolean;
  onClose: () => void;
  projects: ProjectOption[];
  /** Pre-select this project in the dropdown (from URL ?project= param). */
  defaultProjectId?: string;
  /** When provided, the modal renders in edit-mode for this idea. */
  idea?: Idea | null;
  currentUserId?: string;
  isAdminOrManager?: boolean;
}

/** Modal form for creating or editing an idea with early validation. */
export default function CreateIdeaModal({
  open,
  onClose,
  projects,
  defaultProjectId,
  idea = null,
  currentUserId,
  isAdminOrManager = false,
}: CreateIdeaModalProps) {
  const router = useRouter();
  const isEdit = idea !== null;
  // In edit mode, only allow editing if the user is admin/manager or the idea creator.
  const canEdit = !isEdit || isAdminOrManager || (!!currentUserId && idea?.created_by === currentUserId);

  const [name, setName] = useState(idea?.name ?? "");
  const [description, setDescription] = useState(idea?.description ?? "");
  const [projectId, setProjectId] = useState(
    idea?.project_id ?? defaultProjectId ?? ""
  );

  // Sync when the editing target or default project changes.
  useEffect(() => {
    if (idea) {
      setName(idea.name ?? "");
      setDescription(idea.description ?? "");
      setProjectId(idea.project_id ?? "");
    } else {
      setProjectId(defaultProjectId ?? "");
    }
  }, [idea, defaultProjectId]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameValid = name.trim().length > 0;
  const descriptionValid = !isBlankHtml(description);
  const canSubmit = canEdit && nameValid && descriptionValid && !isSubmitting;

  function resetForm() {
    if (isEdit) return; // Preserve edited state until the caller unmounts.
    setName("");
    setDescription("");
    setProjectId(defaultProjectId ?? "");
    setError(null);
  }

  function handleClose() {
    if (isSubmitting) return;
    resetForm();
    onClose();
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);

    const result = isEdit
      ? await updateIdea(idea!.id, {
          name: name.trim(),
          description: description,
          project_id: projectId || null,
        })
      : await createIdea({
          name: name.trim(),
          description: description,
          project_id: projectId || undefined,
        });

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    resetForm();
    onClose();
    router.refresh();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? "Edit Idea" : "Create Idea"}
    >
      <div className="px-6 pb-2 space-y-5 overflow-y-auto max-h-[60vh]">
        {/* Name */}
        <div>
          <label
            htmlFor="idea-name"
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            Name<span className="text-red-400">*</span>
          </label>
          <input
            id="idea-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name here..."
            disabled={isSubmitting || !canEdit}
            className={cn(
              "w-full rounded-lg border px-3 py-2.5 text-sm bg-base text-text-primary placeholder:text-text-muted",
              "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
              "disabled:opacity-50",
              !nameValid && name.length > 0 ? "border-red-400" : "border-border"
            )}
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="idea-description"
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            Description<span className="text-red-400">*</span>
          </label>
          <RichTextEditor
            content={description}
            onChange={setDescription}
            editable={canEdit && !isSubmitting}
            placeholder="Describe here the main problem you are trying to solve..."
            minHeight="min-h-32"
          />
        </div>

        {/* Project (optional) */}
        <div>
          <label
            htmlFor="idea-project"
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            Project
          </label>
          <select
            id="idea-project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            disabled={isSubmitting || !canEdit}
            className={cn(
              "w-full rounded-lg border border-border px-3 py-2.5 text-sm bg-base text-text-primary",
              "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
              "disabled:opacity-50"
            )}
          >
            <option value="">Choose an option...</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name ?? "Untitled"}
              </option>
            ))}
          </select>
        </div>

        {/* Error message */}
        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 px-6 py-4 border-t border-border">
        <button
          onClick={handleClose}
          disabled={isSubmitting}
          className={cn(
            "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium",
            "border border-border text-text-secondary hover:text-text-primary hover:bg-muted transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
            "disabled:opacity-50"
          )}
        >
          Close
        </button>
        {canEdit && (
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
              "bg-accent text-white hover:bg-accent/90",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isSubmitting
              ? isEdit
                ? "Saving..."
                : "Creating..."
              : isEdit
                ? "Save"
                : "Create"}
          </button>
        )}
      </div>
    </Modal>
  );
}
