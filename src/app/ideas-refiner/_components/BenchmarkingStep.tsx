/**
 * Step 5 — Benchmarking.
 * Four editable rich-text sections: Overview, Comparison Table,
 * Possible Business Models, Key Takeaways.
 * Supports AI regeneration and manual save.
 */
"use client";

import { useState, useEffect } from "react";
import type { IdeaFull } from "@/types/idea-refiner";
import { saveBenchmarking, triggerAiGeneration } from "../actions";
import AiLoadingOverlay from "./AiLoadingOverlay";
import RichTextEditor from "./RichTextEditor.lazy";
import { useRegenerate } from "../_hooks/useRegenerate";
import { createPortal } from "react-dom";
import { useStepActions } from "../_context/StepActionsContext";

interface BenchmarkingStepProps {
  ideaFull: IdeaFull;
}

export default function BenchmarkingStep({ ideaFull }: BenchmarkingStepProps) {
  const { idea, benchmarking } = ideaFull;
  const isAiWorking = idea.current_blocks_updating === "benchmarking";

  const [overview, setOverview] = useState(benchmarking?.overview ?? "");
  const [comparison, setComparison] = useState(benchmarking?.comparison ?? "");
  const [possibleBusinessModels, setPossibleBusinessModels] = useState(
    benchmarking?.possible_business_models ?? ""
  );
  const [takeaways, setTakeaways] = useState(benchmarking?.takeaways ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const { isRegenerating, error, setError, triggerRegenerate } = useRegenerate(idea.id, "benchmarking", isAiWorking);

  useEffect(() => {
    setOverview(benchmarking?.overview ?? "");
    setComparison(benchmarking?.comparison ?? "");
    setPossibleBusinessModels(benchmarking?.possible_business_models ?? "");
    setTakeaways(benchmarking?.takeaways ?? "");
  }, [
    benchmarking?.overview,
    benchmarking?.comparison,
    benchmarking?.possible_business_models,
    benchmarking?.takeaways,
  ]);

  const { actionBarEl, onOpenAiConfig } = useStepActions();

  const canSave =
    (overview.trim().length > 0 ||
      comparison.trim().length > 0 ||
      possibleBusinessModels.trim().length > 0 ||
      takeaways.trim().length > 0) &&
    !isSaving &&
    !isRegenerating;

  async function handleSave() {
    if (!canSave) return;
    setIsSaving(true);
    setError(null);

    const result = await saveBenchmarking(idea.id, {
      overview: overview.trim(),
      comparison: comparison.trim(),
      possible_business_models: possibleBusinessModels.trim(),
      takeaways: takeaways.trim(),
    });

    setIsSaving(false);
    if (result.error) setError(result.error);
  }

  function handleRegenerate() {
    return triggerRegenerate(() => triggerAiGeneration(idea.id, "benchmarking"));
  }

  if (isAiWorking || isRegenerating) {
    return <AiLoadingOverlay ideaId={idea.id} step="benchmarking" />;
  }

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div>
        <label className="block text-sm font-semibold text-text-primary mb-1.5">
          Overview
        </label>
        <RichTextEditor
          content={overview}
          onChange={setOverview}
          editable={!isSaving && !isRegenerating}
        />
      </div>

      {/* Comparison Table */}
      <div>
        <label className="block text-sm font-semibold text-text-primary mb-1.5">
          Comparison Table
        </label>
        <RichTextEditor
          content={comparison}
          onChange={setComparison}
          editable={!isSaving && !isRegenerating}
        />
      </div>

      {/* Possible Business Models */}
      <div>
        <label className="block text-sm font-semibold text-text-primary mb-1.5">
          Possible Business Models
        </label>
        <RichTextEditor
          content={possibleBusinessModels}
          onChange={setPossibleBusinessModels}
          editable={!isSaving && !isRegenerating}
        />
      </div>

      {/* Key Takeaways */}
      <div>
        <label className="block text-sm font-semibold text-text-primary mb-1.5">
          Key Takeaways
        </label>
        <RichTextEditor
          content={takeaways}
          onChange={setTakeaways}
          editable={!isSaving && !isRegenerating}
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      {actionBarEl && createPortal(
        <div className="flex items-center gap-2">
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating || isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isRegenerating ? "Regenerating..." : "Regenerate"}
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {isSaving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={onOpenAiConfig}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted border border-border text-text-secondary hover:text-text-primary hover:bg-muted/80 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Change AI Model
          </button>
        </div>,
        actionBarEl
      )}
    </div>
  );
}
