/**
 * Step 1 — Ideas Grid.
 * Displays all user ideas as cards with a project filter sidebar,
 * header with user name and create button.
 */
"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Idea, ProjectOption } from "@/types/idea-refiner";
import type { UserAiSettingsClient } from "@/types/settings";
import { cn } from "@/lib/utils";
import CreateIdeaModal from "./CreateIdeaModal";
import AiSettingsModal from "./AiSettingsModal";
import ConfirmDeleteModal from "@/app/projects/_components/modals/ConfirmDeleteModal";
import { deleteIdea } from "../actions";

interface IdeasGridProps {
  ideas: Idea[];
  projects: ProjectOption[];
  userName: string;
  currentUserId: string;
  isAdminOrManager: boolean;
  onSelectIdea: (ideaId: string) => void;
  /** Current project filter from URL ?project= param. null = show all. */
  selectedProjectId: string | null;
  /** Whether the user has a configured AI service with a valid key. */
  hasAiConfigured: boolean;
  /** Masked AI settings for the settings modal form. */
  aiSettings: UserAiSettingsClient;
}

/** Renders the ideas overview: project filter, header, and card grid. */
export default function IdeasGrid({
  ideas,
  projects,
  userName,
  currentUserId,
  isAdminOrManager,
  onSelectIdea,
  selectedProjectId,
  hasAiConfigured,
  aiSettings,
}: IdeasGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [pendingIdeaId, setPendingIdeaId] = useState<string | null>(null);
  const [deletingIdea, setDeletingIdea] = useState<Idea | null>(null);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);

  /** Gate "See Refinement" — show AI settings modal if not configured. */
  function handleSelectIdea(ideaId: string) {
    if (!hasAiConfigured) {
      setPendingIdeaId(ideaId);
      setAiModalOpen(true);
      return;
    }
    onSelectIdea(ideaId);
  }

  /** After AI settings are saved, proceed to the pending idea. */
  function handleAiConfigured() {
    setAiModalOpen(false);
    if (pendingIdeaId) {
      onSelectIdea(pendingIdeaId);
      setPendingIdeaId(null);
    }
    router.refresh();
  }

  // Filter ideas by selected project
  const filteredIdeas = useMemo(() => {
    if (!selectedProjectId || selectedProjectId === "general")
      return ideas.filter((i) => !i.project_id);
    return ideas.filter((i) => i.project_id === selectedProjectId);
  }, [ideas, selectedProjectId]);

  /** Update the project URL param. */
  function handleProjectSelect(projectId: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (projectId) {
      params.set("project", projectId);
    } else {
      params.delete("project");
    }
    // Clear idea/tab params when changing project filter
    params.delete("idea");
    params.delete("tab");
    const qs = params.toString();
    router.push(`/ideas-refiner${qs ? `?${qs}` : ""}`);
  }

  // Determine defaultProjectId for the Create Idea modal
  const defaultProjectId =
    selectedProjectId && selectedProjectId !== "general"
      ? selectedProjectId
      : undefined;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Project filter sidebar */}
      <aside className="w-48 shrink-0 border-r border-border overflow-y-auto py-4">
        <h3 className="px-4 text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
          Projects
        </h3>
        <button
          onClick={() => handleProjectSelect("general")}
          className={cn(
            "w-full text-left px-4 py-1.5 text-sm transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset",
            selectedProjectId === "general" || !selectedProjectId
              ? "bg-accent text-white font-medium"
              : "text-text-secondary hover:text-text-primary hover:bg-muted"
          )}
        >
          General Ideas
        </button>
        {projects.map((p) => (
          <button
            key={p.id}
            onClick={() => handleProjectSelect(p.id)}
            className={cn(
              "w-full text-left px-4 py-1.5 text-sm truncate transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset",
              selectedProjectId === p.id
                ? "bg-accent text-white font-medium"
                : "text-text-secondary hover:text-text-primary hover:bg-muted"
            )}
          >
            {p.name ?? "Untitled"}
          </button>
        ))}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <h1 className="text-xl font-bold text-text-primary">
            Ideas Refiner
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setModalOpen(true)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium",
                "bg-accent text-white hover:bg-accent/90 transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              )}
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
              Create New Idea
            </button>
          </div>
        </div>

        {/* Cards grid */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {filteredIdeas.length === 0 ? (
            <EmptyState onCreateClick={() => setModalOpen(true)} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredIdeas.map((idea) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  onSelect={() => handleSelectIdea(idea.id)}
                  onDeleteClick={() => setDeletingIdea(idea)}
                  onEditClick={() => setEditingIdea(idea)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Idea Modal */}
      <CreateIdeaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        projects={projects}
        defaultProjectId={defaultProjectId}
      />

      {/* Edit Idea Modal (same component, edit mode) */}
      <CreateIdeaModal
        open={!!editingIdea}
        onClose={() => setEditingIdea(null)}
        projects={projects}
        idea={editingIdea}
        currentUserId={currentUserId}
        isAdminOrManager={isAdminOrManager}
      />

      {/* AI Settings Modal — shown when user needs to configure AI before refinement */}
      <AiSettingsModal
        open={aiModalOpen}
        onClose={() => {
          setAiModalOpen(false);
          setPendingIdeaId(null);
        }}
        initialSettings={aiSettings}
        onConfigured={handleAiConfigured}
      />

      {/* Delete Idea confirm modal */}
      <ConfirmDeleteModal
        open={!!deletingIdea}
        onClose={() => setDeletingIdea(null)}
        kind="idea"
        itemName={deletingIdea?.name ?? ""}
        onConfirm={async () => {
          if (!deletingIdea) return {};
          const result = await deleteIdea(deletingIdea.id);
          if (!result.error) {
            router.refresh();
          }
          return result;
        }}
      />
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

interface IdeaCardProps {
  idea: Idea;
  onSelect: () => void;
  onDeleteClick: () => void;
  onEditClick: () => void;
}

/** Single idea card displaying name and description. Click to open refinement. */
function IdeaCard({ idea, onSelect, onDeleteClick, onEditClick }: IdeaCardProps) {
  return (
    <div
      className="group relative flex flex-col bg-surface border border-border rounded-xl p-5 transition-shadow hover:shadow-md cursor-pointer"
      onClick={onSelect}
    >
      {/* Action buttons — hidden until hover */}
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          aria-label="Edit idea"
          onClick={(e) => {
            e.stopPropagation();
            onEditClick();
          }}
          className="p-1.5 rounded-md text-text-muted/70 hover:text-accent hover:bg-accent/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M16.732 3.732a2.5 2.5 0 113.536 3.536L7.5 20.036 3 21l.964-4.5L16.732 3.732z" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Delete idea"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick();
          }}
          className="p-1.5 rounded-md text-text-muted/70 hover:text-red-500 hover:bg-red-500/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <h3 className="text-sm font-semibold text-text-primary line-clamp-2 mb-2 pr-16">
        {idea.name}
      </h3>
      <div
        className="text-xs text-text-muted line-clamp-3 flex-1 prose prose-invert max-w-none [&_*]:!text-xs [&_*]:!leading-snug [&_p]:!my-0"
        dangerouslySetInnerHTML={{
          __html: idea.description ?? "<em>No description yet.</em>",
        }}
      />
    </div>
  );
}

/** Empty state shown when no ideas match the current filter. */
function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <svg
        className="w-12 h-12 text-text-muted/40 mb-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      </svg>
      <p className="text-sm text-text-muted mb-4">
        No ideas yet. Start by creating one.
      </p>
      <button
        onClick={onCreateClick}
        className={cn(
          "px-4 py-2 rounded-lg text-sm font-medium",
          "bg-accent text-white hover:bg-accent/90 transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        )}
      >
        Create New Idea
      </button>
    </div>
  );
}
