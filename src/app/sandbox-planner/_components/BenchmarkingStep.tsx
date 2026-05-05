/**
 * Step 5 — Benchmarking.
 * Four editable rich-text sections: Overview, Comparison Table,
 * Possible Business Models, Key Takeaways.
 * Supports AI regeneration and manual save.
 */
"use client";

import { useState, useEffect } from "react";
import type { IdeaFull } from "@/types/sandbox-planner";
import { saveBenchmarking, triggerAiGeneration } from "../actions";
import { cn } from "@/lib/utils";
import AiLoadingOverlay from "./AiLoadingOverlay";
import RichTextEditor from "./RichTextEditor";
import { useAutoTriggerAi, clearAutoTriggerGuard, isBlankHtml } from "../_hooks/useAutoTriggerAi";
import { runAiWithTimeout } from "../_hooks/useAiWithTimeout";

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
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const isEmpty =
    isBlankHtml(benchmarking?.overview) &&
    isBlankHtml(benchmarking?.comparison) &&
    isBlankHtml(benchmarking?.possible_business_models) &&
    isBlankHtml(benchmarking?.takeaways);
  useAutoTriggerAi(idea.id, "benchmarking", isEmpty, isAiWorking);

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

  async function handleRegenerate() {
    setIsRegenerating(true);
    setError(null);
    clearAutoTriggerGuard(idea.id, "benchmarking");
    const result = await runAiWithTimeout(() => triggerAiGeneration(idea.id, "benchmarking"));

    setIsRegenerating(false);
    if (result.error) setError(result.error);
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
  );
}
