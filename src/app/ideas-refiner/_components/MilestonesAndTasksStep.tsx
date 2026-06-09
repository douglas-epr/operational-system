/**
 * Step 10 — Project Milestones & Tasks.
 * Single editable rich-text section for milestones with tasks and time estimates.
 * Supports AI regeneration (with Bubble / Claude Code platform picker) and manual save.
 */
"use client";

import { useState, useEffect } from "react";
import type { IdeaFull } from "@/types/idea-refiner";
import { saveMilestonesAndTasks, triggerAiGeneration } from "../actions";
import { cn } from "@/lib/utils";
import AiLoadingOverlay from "./AiLoadingOverlay";
import RichTextEditor from "./RichTextEditor";
import { useAutoTriggerAi, clearAutoTriggerGuard, isBlankHtml } from "../_hooks/useAutoTriggerAi";
import { runAiWithTimeout } from "../_hooks/useAiWithTimeout";

interface MilestonesAndTasksStepProps {
  ideaFull: IdeaFull;
}

export default function MilestonesAndTasksStep({ ideaFull }: MilestonesAndTasksStepProps) {
  const { idea, milestonesAndTasks } = ideaFull;
  const isAiWorking = idea.current_blocks_updating === "milestones_and_tasks";

  const [content, setContent] = useState(milestonesAndTasks?.content ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPlatformModal, setShowPlatformModal] = useState(false);

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

  async function handleRegenerate(platform: "bubble" | "claude_code") {
    setShowPlatformModal(false);
    setIsRegenerating(true);
    setError(null);
    clearAutoTriggerGuard(idea.id, "milestones_and_tasks");
    const result = await runAiWithTimeout(
      () => triggerAiGeneration(idea.id, "milestones_and_tasks", undefined, platform)
    );
    setIsRegenerating(false);
    if (result.error) setError(result.error);
  }

  if (isAiWorking || isRegenerating) {
    return <AiLoadingOverlay ideaId={idea.id} step="milestones_and_tasks" />;
  }

  return (
    <div className="space-y-6">
      {/* Platform selection modal */}
      {showPlatformModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowPlatformModal(false)}
        >
          <div
            className="bg-elevated border border-border rounded-xl shadow-[var(--shadow-lg)] w-full max-w-sm mx-4 p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-base font-semibold text-text-primary">Choose Development Platform</h3>
              <p className="text-sm text-text-secondary mt-1">
                We&apos;ll tailor time estimates to your stack.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleRegenerate("bubble")}
                className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:border-accent hover:bg-accent/5 transition-colors text-left"
              >
                {/* Bubble.io logo — vertical stem + open ring, blue dot */}
                <svg width="28" height="32" viewBox="0 0 100 115" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                  <defs>
                    <mask id="bubble-ring-mask">
                      <rect width="100" height="115" fill="white"/>
                      <circle cx="57" cy="75" r="18" fill="black"/>
                    </mask>
                  </defs>
                  <g mask="url(#bubble-ring-mask)" fill="#1C1C1C">
                    <rect x="13" y="0" width="15" height="80"/>
                    <circle cx="57" cy="75" r="31"/>
                  </g>
                  <circle cx="16" cy="104" r="13" fill="#0000FF"/>
                </svg>
                <div>
                  <p className="text-sm font-medium text-text-primary">Bubble</p>
                  <p className="text-xs text-text-muted">No-code visual development</p>
                </div>
              </button>

              <button
                onClick={() => handleRegenerate("claude_code")}
                className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:border-accent hover:bg-accent/5 transition-colors text-left"
              >
                {/* Claude Code mascot — pixel-art character, 2 paired legs, transparent eye holes */}
                <svg width="32" height="20" viewBox="0 0 16 10" xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges" className="shrink-0">
                  <path fill="#CC7A5A" fillRule="evenodd" d="
                    M2,0 L14,0 L14,5 L2,5 Z
                    M0,2 L2,2 L2,4 L0,4 Z
                    M14,2 L16,2 L16,4 L14,4 Z
                    M2,5 L4,5 L4,10 L2,10 Z
                    M5,5 L7,5 L7,10 L5,10 Z
                    M9,5 L11,5 L11,10 L9,10 Z
                    M12,5 L14,5 L14,10 L12,10 Z
                    M4,1 L7,1 L7,4 L4,4 Z
                    M9,1 L12,1 L12,4 L9,4 Z
                  "/>
                </svg>
                <div>
                  <p className="text-sm font-medium text-text-primary">Claude Code</p>
                  <p className="text-xs text-text-muted">TypeScript / Next.js / AI-assisted coding</p>
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowPlatformModal(false)}
              className="text-sm text-text-muted hover:text-text-secondary transition-colors self-center"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Milestones & Tasks */}
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

      {/* Error */}
      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => setShowPlatformModal(true)}
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
