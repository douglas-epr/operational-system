"use client";

import { useState, useEffect } from "react";
import type { IdeaFull } from "@/types/idea-refiner";
import { saveMilestonesAndTasks, triggerAiGeneration } from "../actions";
import { cn } from "@/lib/utils";
import AiLoadingOverlay from "./AiLoadingOverlay";
import RichTextEditor from "./RichTextEditor";
import { useAutoTriggerAi, isBlankHtml } from "../_hooks/useAutoTriggerAi";
import { useRegenerate } from "../_hooks/useRegenerate";

interface MilestonesAndTasksStepProps {
  ideaFull: IdeaFull;
}

export default function MilestonesAndTasksStep({ ideaFull }: MilestonesAndTasksStepProps) {
  const { idea, milestonesAndTasks } = ideaFull;
  const isAiWorking = idea.current_blocks_updating === "milestones_and_tasks";

  const [content, setContent] = useState(milestonesAndTasks?.content ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const { isRegenerating, error, setError, triggerRegenerate } = useRegenerate(idea.id, "milestones_and_tasks", isAiWorking);

  useEffect(() => {
    setContent(milestonesAndTasks?.content ?? "");
  }, [milestonesAndTasks?.content]);

  const isEmpty = isBlankHtml(milestonesAndTasks?.content);
  useAutoTriggerAi(idea.id, "milestones_and_tasks", isEmpty, isAiWorking);

  const canSave = content.trim().length > 0 && !isSaving && !isRegenerating;

  async function handleSave() {
    if (!canSave) return;
    setIsSaving(true);
    setError(null);
    const result = await saveMilestonesAndTasks(idea.id, { content: content.trim() });
    setIsSaving(false);
    if (result.error) setError(result.error);
  }

  function handleRegenerate() {
    return triggerRegenerate(
      () => triggerAiGeneration(idea.id, "milestones_and_tasks", undefined, "claude_code")
    );
  }

  if (isAiWorking || isRegenerating) {
    return <AiLoadingOverlay ideaId={idea.id} step="milestones_and_tasks" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-text-primary mb-1.5">
          Milestones & Tasks
        </label>
        <RichTextEditor
          content={content}
          onChange={setContent}
          editable={!isSaving && !isRegenerating}
        />
      </div>

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        <button
          onClick={handleRegenerate}
          disabled={isRegenerating || isSaving}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium",
            "bg-accent text-white hover:bg-accent/90 transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isRegenerating ? "Regenerating..." : "Regenerate"}
        </button>
        <button
          onClick={handleSave}
          disabled={!canSave}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium",
            "bg-green-600 text-white hover:bg-green-700 transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
