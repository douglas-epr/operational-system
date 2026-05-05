"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Project, UserProfile } from "@/types/projects";
import type {
  PlaybookComment,
  PlaybookCommentReply,
  PlaybookVersion,
} from "@/types/docs";
import { markPlaybookCommentsViewed } from "../actions";
import PlaybookEditor from "./PlaybookEditor";
import CommentThreadPanel from "./CommentThreadPanel";
import { COMMENT_CLICK_EVENT } from "./CommentMarkExtension";
import BuildFromIdeaModal from "./modals/BuildFromIdeaModal";

interface Props {
  project: Project;
  profiles: UserProfile[];
  versions: PlaybookVersion[];
  comments: PlaybookComment[];
  replies: PlaybookCommentReply[];
  currentUserId: string;
  isAdminOrManager: boolean;
  linkedIdeaId: string | null;
}

export default function PlaybookTab({
  project,
  profiles,
  versions,
  comments,
  replies,
  currentUserId,
  isAdminOrManager,
  linkedIdeaId,
}: Props) {
  const router = useRouter();
  const [activeVersionId, setActiveVersionId] = useState(versions[0]?.id ?? "");
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(false);

  const activeVersion = versions.find((v) => v.id === activeVersionId) ?? versions[0];

  // A project-authorized non-admin can read the playbook and add comments,
  // but can't edit the document body itself.
  const canComment =
    isAdminOrManager || project.authorized_users.includes(currentUserId);

  // Mark playbook comments as viewed whenever the version changes.
  useEffect(() => {
    if (!activeVersion) return;
    let cancelled = false;
    const hasUnread = comments.some(
      (c) =>
        c.playbook_id === activeVersion.id &&
        c.created_by !== currentUserId &&
        !(c.viewed_by ?? []).includes(currentUserId)
    );
    if (!hasUnread) return;
    (async () => {
      await markPlaybookCommentsViewed(activeVersion.id);
      if (!cancelled) router.refresh();
    })();
    return () => {
      cancelled = true;
    };
  }, [activeVersion, comments, currentUserId, router]);

  // Listen for clicks on anchored comment marks inside the editor
  useEffect(() => {
    function handler(e: Event) {
      const ce = e as CustomEvent<{ commentId: string }>;
      if (ce.detail?.commentId) setSelectedCommentId(ce.detail.commentId);
    }
    window.addEventListener(COMMENT_CLICK_EVENT, handler);
    return () => window.removeEventListener(COMMENT_CLICK_EVENT, handler);
  }, []);

  const activeComments = activeVersion
    ? comments.filter((c) => c.playbook_id === activeVersion.id)
    : [];

  const visibleComments = showResolved
    ? activeComments
    : activeComments.filter((c) => c.status !== "solved");

  const repliesByComment = new Map<string, PlaybookCommentReply[]>();
  for (const r of replies) {
    const list = repliesByComment.get(r.project_playbook_comment_id) ?? [];
    list.push(r);
    repliesByComment.set(r.project_playbook_comment_id, list);
  }

  const selectedComment =
    selectedCommentId ? activeComments.find((c) => c.id === selectedCommentId) ?? null : null;

  // If the currently-selected comment is hidden (resolved & showResolved=false),
  // close the panel so it doesn't render a ghost thread.
  useEffect(() => {
    if (!selectedCommentId) return;
    const isHidden =
      !activeComments.find((c) => c.id === selectedCommentId) ||
      (!showResolved &&
        activeComments.find((c) => c.id === selectedCommentId)?.status === "solved");
    if (isHidden) setSelectedCommentId(null);
  }, [selectedCommentId, activeComments, showResolved]);

  if (!activeVersion) {
    return (
      <EmptyState
        project={project}
        isAdminOrManager={isAdminOrManager}
      />
    );
  }
  // linkedIdeaId is no longer needed for the empty-state CTA — the modal
  // discovers eligible ideas itself. Reference it to keep the prop wired
  // (TypeScript would otherwise warn about an unused destructure).
  void linkedIdeaId;

  return (
    <div className="h-full flex min-h-0">
      <div className="flex-1 min-w-0">
        <PlaybookEditor
          projectId={project.id}
          versions={versions}
          activeVersion={activeVersion}
          onVersionChange={setActiveVersionId}
          editable={isAdminOrManager}
          canComment={canComment}
          comments={visibleComments}
          allComments={comments}
          currentUserId={currentUserId}
          linkedIdeaId={linkedIdeaId}
          showResolved={showResolved}
          onToggleShowResolved={() => setShowResolved((v) => !v)}
          hasResolvedComments={comments.some((c) => c.status === "solved")}
          isAdminOrManager={isAdminOrManager}
        />
      </div>

      {selectedComment && (
        <div className="w-[400px] shrink-0 border-l border-border flex flex-col bg-surface">
          <CommentThreadPanel
            comment={selectedComment}
            replies={repliesByComment.get(selectedComment.id) ?? []}
            profiles={profiles}
            projectId={project.id}
            currentUserId={currentUserId}
            isAdminOrManager={isAdminOrManager}
            onClose={() => setSelectedCommentId(null)}
          />
        </div>
      )}
    </div>
  );
}

function EmptyState({
  project,
  isAdminOrManager,
}: {
  project: Project;
  isAdminOrManager: boolean;
}) {
  return (
    <div className="h-full flex items-center justify-center text-center p-10">
      <div className="max-w-md">
        <h3 className="text-heading-3 text-text-primary mb-2">No playbook yet</h3>
        <p className="text-sm text-text-muted mb-4">
          {isAdminOrManager
            ? `Create the first playbook version for ${project.name ?? "this project"}.`
            : "An admin or manager hasn't created a playbook yet."}
        </p>
        {isAdminOrManager && (
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <InitialVersionButton projectId={project.id} />
            <BuildFromIdeaButton projectId={project.id} variant="primary" />
          </div>
        )}
      </div>
    </div>
  );
}

function InitialVersionButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return (
    <button
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        const { createPlaybookVersion } = await import("../actions");
        const res = await createPlaybookVersion(projectId, "<p>Start writing…</p>");
        setLoading(false);
        if (res.error) alert(res.error);
        else router.refresh();
      }}
      className="px-4 py-2 text-sm rounded-md bg-accent hover:bg-accent-hover text-white disabled:opacity-60"
    >
      {loading ? "Creating…" : "Create initial version"}
    </button>
  );
}

/**
 * Self-contained "Build from idea" button. Opens BuildFromIdeaModal which
 * fetches the candidate ideas, lets the user pick one, and runs the
 * existing buildPlaybookFromIdea server action under the hood. The button
 * no longer needs a pre-known ideaId — the modal discovers ideas linked
 * to the project, falling back to unassigned ideas if there are none.
 *
 * Two visual variants:
 *   - "primary"  → empty-state CTA (button-style border).
 *   - "toolbar"  → editor toolbar pill (small, with bolt icon).
 */
function BuildFromIdeaButton({
  projectId,
  variant,
}: {
  projectId: string;
  variant: "primary" | "toolbar";
}) {
  const [open, setOpen] = useState(false);
  const cls =
    variant === "primary"
      ? "px-4 py-2 text-sm rounded-md border border-border text-text-primary hover:bg-muted"
      : "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border border-border text-text-secondary hover:text-text-primary hover:bg-muted";
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cls}
        title="Build a new playbook version from a Sandbox idea"
      >
        {variant === "toolbar" && (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )}
        {variant === "primary" ? "Build from Sandbox idea" : "Build from idea"}
      </button>
      <BuildFromIdeaModal
        open={open}
        projectId={projectId}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

export { BuildFromIdeaButton };
