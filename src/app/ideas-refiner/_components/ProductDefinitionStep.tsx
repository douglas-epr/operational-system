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
import { isBlankHtml } from "../_hooks/useAutoTriggerAi";
import { useRegenerate } from "../_hooks/useRegenerate";
import { createPortal } from "react-dom";
import { useStepActions } from "../_context/StepActionsContext";

interface ProductDefinitionStepProps {
  ideaFull: IdeaFull;
}

export default function ProductDefinitionStep({ ideaFull }: ProductDefinitionStepProps) {
  const { idea, structureAlign, productDefinition } = ideaFull;
  const isAiWorking = idea.current_blocks_updating === "product_definition_flows";

  const [summary, setSummary] = useState(productDefinition?.summary ?? "");
  const [businessModel, setBusinessModel] = useState(productDefinition?.business_model ?? "");
  const [features, setFeatures] = useState(productDefinition?.features ?? "");
  const [goToMarket, setGoToMarket] = useState(productDefinition?.go_to_market ?? "");

  const [isSaving, setIsSaving] = useState(false);
  const { isRegenerating, error, setError, triggerRegenerate } = useRegenerate(idea.id, "product_definition_flows", isAiWorking);

  useEffect(() => {
    setSummary(productDefinition?.summary ?? "");
    setBusinessModel(productDefinition?.business_model ?? "");
    setFeatures(productDefinition?.features ?? "");
    setGoToMarket(productDefinition?.go_to_market ?? "");
  }, [productDefinition?.summary, productDefinition?.business_model, productDefinition?.features, productDefinition?.go_to_market]);

  const { actionBarEl, onOpenAiConfig } = useStepActions();

  const canSave =
    !isBlankHtml(summary) &&
    !isBlankHtml(features) &&
    !isSaving &&
    !isRegenerating;

  async function handleSave() {
    if (!canSave) return;
    setIsSaving(true);
    setError(null);

    const result = await saveProductDefinition(idea.id, { summary, business_model: businessModel, features, go_to_market: goToMarket });
    setIsSaving(false);
    if (result.error) setError(result.error);
  }

  function handleRegenerate() {
    return triggerRegenerate(() => triggerAiGeneration(idea.id, "product_definition_flows"));
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

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-text-primary">Go-to-Market</label>
            <RichTextEditor
              content={goToMarket}
              onChange={setGoToMarket}
              editable={!isSaving && !isRegenerating}
              placeholder="Describe the go-to-market strategy — the wedge user, zero-CAC supply/demand acquisition, first use case, and year-one distribution channels..."
            />
          </div>

        </div>
      </div>

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && (
        <p className="text-sm text-red-400" role="alert">{error}</p>
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

function IconRefresh() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}
