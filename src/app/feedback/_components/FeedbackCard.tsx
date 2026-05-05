"use client";

import type { UserProfile } from "@/types/projects";
import type { Feedback } from "@/types/feedback";
import StarRow from "./StarRow";

interface Props {
  feedback: Feedback;
  author: UserProfile | null;
  projectName: string | null;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export default function FeedbackCard({
  feedback,
  author,
  projectName,
  canEdit,
  onEdit,
  onDelete,
}: Props) {
  const name =
    [author?.first_name, author?.last_name].filter(Boolean).join(" ") ||
    "Unknown user";
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <button
      type="button"
      onClick={canEdit ? onEdit : undefined}
      className={[
        "text-left bg-surface border border-border rounded-lg p-4 flex flex-col gap-3",
        "transition-colors",
        canEdit ? "hover:border-accent cursor-pointer" : "cursor-default",
      ].join(" ")}
    >
      {/* Header: avatar · name · delete */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-accent overflow-hidden flex items-center justify-center text-white text-xs font-semibold shrink-0">
            {author?.picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={author.picture}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              initials || "?"
            )}
          </div>
          <p className="text-sm font-semibold text-text-primary truncate">
            {name}
          </p>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete feedback"
            className="p-1 text-text-muted hover:text-red-400 transition-colors"
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Stars */}
      <StarRow value={feedback.rating ?? 0} size="md" />

      {/* Project */}
      {projectName && (
        <p className="text-sm font-semibold text-text-primary truncate">
          {projectName}
        </p>
      )}

      {/* Comment */}
      {feedback.comment && (
        <p className="text-sm text-text-secondary whitespace-pre-wrap break-words">
          {feedback.comment}
        </p>
      )}
    </button>
  );
}
