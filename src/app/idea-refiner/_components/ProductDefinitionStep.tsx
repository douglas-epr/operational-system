/**
 * Step 4 — Product Definition & Flows.
 * Left column: readonly idea context + product architecture notes.
 * Right column: rich text Product Summary + Feature List & Logic, with AI regeneration.
 *
 * Note: the legacy "User Flow" section and `idea_user_type` table were removed
 * in 2026-04-15.
 */
"use client";

import { useState, useEffect } from "react";
import type { IdeaFull } from "@/types/idea-refiner";
import { saveProductDefinition, triggerAiGeneration } from "../actions";
import { cn } from "@/lib/utils";
import RichTextEditor from "./RichTextEditor";
import AiLoadingOverlay from "./AiLoadingOverlay";
import { useAutoTriggerAi, clearAutoTriggerGuard, isBlankHtml } from "../_hooks/useAutoTriggerAi";
import { runAiWithTimeout } from "../_hooks/useAiWithTimeout";

interface ProductDefinitionStepProps {
  ideaFull: IdeaFull;
}

export default function ProductDefinitionStep({ ideaFull }: ProductDefinitionStepProps) {
  const { idea, structureAlign, productDefinition } = ideaFull;
  const isAiWorking = idea.current_blocks_updating === "product_definition_flows";

  const [summary, setSummary] = useState(productDefinition?.summary ?? "");
  const [businessModel, setBusinessModel] = useState(productDefinition?.business_model ?? "");
  const [features, setFeatures] = useState(productDefinition?.features ?? "");

  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSummary(productDefinition?.summary ?? "");
    setBusinessModel(productDefinition?.business_model ?? "");
    setFeatures(productDefinition?.features ?? "");
  }, [productDefinition?.summary, productDefinition?.business_model, productDefinition?.features]);

  const isEmpty =
    isBlankHtml(productDefinition?.summary) && isBlankHtml(productDefinition?.features);
  useAutoTriggerAi(idea.id, "product_definition_flows", isEmpty, isAiWorking);

  const canSave =
    !isBlankHtml(summary) &&
    !isBlankHtml(features) &&
    !isSaving &&
    !isRegenerating;

  async function handleSave() {
    if (!canSave) return;
    setIsSaving(true);
    setError(null);

    const result = await saveProductDefinition(idea.id, { summary, business_model: businessModel, features });
    setIsSaving(false);
    if (result.error) setError(result.error);
  }

  async function handleRegenerate() {
    setIsRegenerating(true);
    setError(null);
    clearAutoTriggerGuard(idea.id, "product_definition_flows");
    const result = await runAiWithTimeout(() => triggerAiGeneration(idea.id, "product_definition_flows"));
    setIsRegenerating(false);
    if (result.error) setError(result.error);
  }

  if (isAiWorking || isRegenerating) {
    return <AiLoadingOverlay ideaId={idea.id} step="product_definition_flows" />;
  }

  return (
    <div className="space-y-6">
      {/* ── Top two-column grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column — Readonly context */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-1">Original Idea*</h3>
            <div className="tiptap-content rounded-lg border border-border bg-surface p-4">
              <h4 className="text-sm font-bold text-text-primary mb-2">{idea.name}</h4>
              <div
                className="prose prose-sm prose-invert max-w-none text-sm text-text-secondary"
                dangerouslySetInnerHTML={{ __html: idea.description ?? "<p>No description provided.</p>" }}
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-1">Finalized Core Problem*</h3>
            <div
              className="tiptap-content rounded-lg border border-border bg-surface p-4 prose prose-sm prose-invert max-w-none text-sm text-text-secondary"
              dangerouslySetInnerHTML={{ __html: structureAlign?.core_problem ?? "<p>Not defined yet.</p>" }}
            />
          </div>

          <div className="rounded-lg border border-border bg-surface p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-2">Product Architecture</h3>
            <p className="text-xs text-text-muted mb-2">
              Now that we know the problem, let&apos;s define the solution. Focus on the user journey:
            </p>
            <ul className="text-xs text-text-muted list-disc list-inside space-y-1">
              <li>What is the core value proposition in action?</li>
              <li>What are the key features needed to deliver that value?</li>
              <li>How does the user move from A to B within the product?</li>
            </ul>
          </div>
        </div>

        {/* Right column — Product Summary + Feature List & Logic + Regenerate */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-text-primary">Product Summary*</label>
            <RichTextEditor
              content={summary}
              onChange={setSummary}
              editable={!isSaving && !isRegenerating}
              placeholder="Describe the product vision and architecture..."
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-text-primary">Business Model</label>
            <RichTextEditor
              content={businessModel}
              onChange={setBusinessModel}
              editable={!isSaving && !isRegenerating}
              placeholder="The best-fit business model for this product (e.g. SaaS subscription, marketplace, freemium) and why it fits..."
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-text-primary">
              Feature List &amp; Logic
            </label>
            <RichTextEditor
              content={features}
              onChange={setFeatures}
              editable={!isSaving && !isRegenerating}
              placeholder="Describe the feature list organized by categories..."
            />
          </div>

        </div>
      </div>

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && (
        <p className="text-sm text-red-400" role="alert">{error}</p>
      )}

      {/* ── Action row: Regenerate + Save aligned on a single line ──────── */}
      <div className="flex justify-end items-center gap-3">
        <button
          onClick={handleRegenerate}
          disabled={isRegenerating || isSaving}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
            "bg-accent text-white hover:bg-accent/90 transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <IconRefresh />
          {isRegenerating ? "Regenerating..." : "Regenerate"}
        </button>
        <button
          onClick={handleSave}
          disabled={!canSave}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium",
            "bg-green-600 text-white hover:bg-green-700 transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500",
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

function IconRefresh() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}
