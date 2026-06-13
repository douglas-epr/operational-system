/**
 * Step 2 — Structure & Align.
 * Two-column layout: left shows the idea overview (readonly),
 * right has editable textareas for Core Problem, Target Audience,
 * and Primary Success Metrics. Supports AI regeneration and manual save.
 */
"use client";

import { useState, useEffect } from "react";
import type { IdeaFull } from "@/types/idea-refiner";
import { saveStructureAlign, triggerAiGeneration } from "../actions";
import { cn } from "@/lib/utils";
import AiLoadingOverlay from "./AiLoadingOverlay";
import RichTextEditor from "./RichTextEditor";
import { useAutoTriggerAi, isBlankHtml } from "../_hooks/useAutoTriggerAi";
import { useRegenerate } from "../_hooks/useRegenerate";

interface StructureAlignStepProps {
  ideaFull: IdeaFull;
}

/** Renders the Structure & Align refinement step with editable fields and AI trigger. */
export default function StructureAlignStep({ ideaFull }: StructureAlignStepProps) {
  const { idea, structureAlign } = ideaFull;
  const isAiWorking = idea.current_blocks_updating === "structure_align";

  const [coreProblem, setCoreProblem] = useState(
    structureAlign?.core_problem ?? ""
  );
  const [targetAudience, setTargetAudience] = useState(
    structureAlign?.target_audience ?? ""
  );
  const [successMetrics, setSuccessMetrics] = useState(
    structureAlign?.success_metrics ?? ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const { isRegenerating, error, setError, triggerRegenerate } = useRegenerate(idea.id, "structure_align", isAiWorking);

  useEffect(() => {
    setCoreProblem(structureAlign?.core_problem ?? "");
    setTargetAudience(structureAlign?.target_audience ?? "");
    setSuccessMetrics(structureAlign?.success_metrics ?? "");
  }, [structureAlign?.core_problem, structureAlign?.target_audience, structureAlign?.success_metrics]);

  const isEmpty =
    isBlankHtml(structureAlign?.core_problem) &&
    isBlankHtml(structureAlign?.target_audience) &&
    isBlankHtml(structureAlign?.success_metrics);

  useAutoTriggerAi(idea.id, "structure_align", isEmpty, isAiWorking);

  const canSave =
    !isBlankHtml(coreProblem) &&
    !isBlankHtml(targetAudience) &&
    !isBlankHtml(successMetrics) &&
    !isSaving &&
    !isRegenerating;

  async function handleSave() {
    if (!canSave) return;
    setIsSaving(true);
    setError(null);

    const result = await saveStructureAlign(idea.id, {
      core_problem: coreProblem,
      target_audience: targetAudience,
      success_metrics: successMetrics,
    });

    setIsSaving(false);
    if (result.error) setError(result.error);
  }

  function handleRegenerate() {
    return triggerRegenerate(() => triggerAiGeneration(idea.id, "structure_align"));
  }

  // Show AI loading overlay when generation is in progress OR user just clicked regenerate
  if (isAiWorking || isRegenerating) {
    return <AiLoadingOverlay ideaId={idea.id} step="structure_align" />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left column — Idea overview (readonly) */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-1">
            Idea*
          </h3>
          <div className="tiptap-content rounded-lg border border-border bg-surface p-4">
            <h4 className="text-sm font-bold text-text-primary mb-2">
              {idea.name}
            </h4>
            <div
              className="prose prose-sm prose-invert max-w-none text-sm text-text-secondary"
              dangerouslySetInnerHTML={{ __html: idea.description ?? "<p>No description provided.</p>" }}
            />
          </div>
        </div>
      </div>

      {/* Right column — Editable fields */}
      <div className="space-y-5">
        {/* Core Problem */}
        <div>
          <label
            htmlFor="core-problem"
            className="block text-sm font-semibold text-text-primary mb-1.5"
          >
            The Core Problem*
          </label>
          <RichTextEditor
            content={coreProblem}
            onChange={setCoreProblem}
            editable={!isSaving && !isRegenerating}
            placeholder="Describe the core problem this idea solves..."
            minHeight="min-h-32"
          />
        </div>

        {/* Target Audience */}
        <div>
          <label
            htmlFor="target-audience"
            className="block text-sm font-semibold text-text-primary mb-1.5"
          >
            Target Audience*
          </label>
          <RichTextEditor
            content={targetAudience}
            onChange={setTargetAudience}
            editable={!isSaving && !isRegenerating}
            placeholder="Describe the primary target audience..."
            minHeight="min-h-32"
          />
        </div>

        {/* Primary Success Metrics */}
        <div>
          <label
            htmlFor="success-metrics"
            className="block text-sm font-semibold text-text-primary mb-1.5"
          >
            Primary Success Metric*
          </label>
          <RichTextEditor
            content={successMetrics}
            onChange={setSuccessMetrics}
            editable={!isSaving && !isRegenerating}
            placeholder="Define specific, quantifiable success metrics..."
            minHeight="min-h-32"
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
    </div>
  );
}
