/**
 * Step 7 — PRD (Product Requirements Document).
 * Nine editable rich-text sections in collapsible cards.
 * Supports AI regeneration and manual save.
 */
"use client";

import { useState, useEffect } from "react";
import type { IdeaFull } from "@/types/idea-refiner";
import { savePrd, triggerAiGeneration } from "../actions";
import { cn } from "@/lib/utils";
import AiLoadingOverlay from "./AiLoadingOverlay";
import RichTextEditor from "./RichTextEditor";
import PrdPreviewModal from "./PrdPreviewModal";
import { isBlankHtml } from "../_hooks/useAutoTriggerAi";
import { useRegenerate } from "../_hooks/useRegenerate";
import { createPortal } from "react-dom";
import { useStepActions } from "../_context/StepActionsContext";

const PRD_SECTIONS = [
  { key: "app_overview", label: "App Overview" },
  { key: "objectives", label: "Objectives" },
  { key: "priority_personas", label: "Users Type" },
  { key: "essential_features", label: "Essential Features" },
  { key: "user_flow", label: "Core User Flow" },
  { key: "non_functional_reqs", label: "Non-Functional Requirements" },
  { key: "out_of_scope", label: "Out of Scope" },
  { key: "success_indicators", label: "Success Indicators" },
  { key: "phasing_notes", label: "Phasing Notes" },
] as const;

type PrdKey = (typeof PRD_SECTIONS)[number]["key"];

interface PrdStepProps {
  ideaFull: IdeaFull;
}

export default function PrdStep({ ideaFull }: PrdStepProps) {
  const { idea, prd } = ideaFull;
  const isAiWorking = idea.current_blocks_updating === "prd";

  const [fields, setFields] = useState<Record<PrdKey, string>>({
    app_overview: prd?.app_overview ?? "",
    objectives: prd?.objectives ?? "",
    priority_personas: prd?.priority_personas ?? "",
    essential_features: prd?.essential_features ?? "",
    user_flow: prd?.user_flow ?? "",
    non_functional_reqs: prd?.non_functional_reqs ?? "",
    out_of_scope: prd?.out_of_scope ?? "",
    success_indicators: prd?.success_indicators ?? "",
    phasing_notes: prd?.phasing_notes ?? "",
  });

  const [expandedSections, setExpandedSections] = useState<Set<PrdKey>>(
    new Set(PRD_SECTIONS.map((s) => s.key))
  );
  const [isSaving, setIsSaving] = useState(false);
  const { isRegenerating, error, setError, triggerRegenerate } = useRegenerate(idea.id, "prd", isAiWorking);
  const [showPreview, setShowPreview] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);

  useEffect(() => {
    setFields({
      app_overview: prd?.app_overview ?? "",
      objectives: prd?.objectives ?? "",
      priority_personas: prd?.priority_personas ?? "",
      essential_features: prd?.essential_features ?? "",
      user_flow: prd?.user_flow ?? "",
      non_functional_reqs: prd?.non_functional_reqs ?? "",
      out_of_scope: prd?.out_of_scope ?? "",
      success_indicators: prd?.success_indicators ?? "",
      phasing_notes: prd?.phasing_notes ?? "",
    });
  }, [prd]);

  function setField(key: PrdKey, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function toggleSection(key: PrdKey) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const hasContent = Object.values(fields).some((v) => v.trim().length > 0);
  const canSave = hasContent && !isSaving && !isRegenerating;

  const isEmpty =
    !prd ||
    [
      prd.app_overview,
      prd.objectives,
      prd.priority_personas,
      prd.essential_features,
      prd.user_flow,
      prd.non_functional_reqs,
      prd.out_of_scope,
      prd.success_indicators,
      prd.phasing_notes,
    ].every(isBlankHtml);
  const { actionBarEl, onOpenAiConfig } = useStepActions();

  function buildDocumentHtml(): string {
    const bodyHtml = PRD_SECTIONS.map(
      (s) =>
        `<h2>${s.label}</h2>${fields[s.key] || "<p><em>(empty)</em></p>"}`
    ).join("");
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${idea.name} — PRD</title></head><body><h1>${idea.name} — PRD</h1>${bodyHtml}</body></html>`;
  }

  async function handleExportPdf() {
    setIsExportingPdf(true);
    setError(null);
    try {
      // Build a temporary off-screen div with white background so html2canvas
      // can rasterize it without oklch colour issues.
      const container = document.createElement("div");
      container.style.cssText =
        "position:fixed;top:-9999px;left:-9999px;width:800px;background:#fff;color:#111;font-family:Georgia,serif;font-size:14px;line-height:1.6;padding:40px 56px;";
      container.innerHTML = `<h1 style="font-size:26px;margin:0 0 6px">${idea.name} — PRD</h1><p style="color:#666;margin:0 0 20px">Product Requirements Document</p>` +
        PRD_SECTIONS.map(
          (s) =>
            `<h2 style="font-size:18px;margin:20px 0 6px;color:#111">${s.label}</h2><div>${fields[s.key] || "<p><em>(empty)</em></p>"}</div>`
        ).join("");
      document.body.appendChild(container);

      const { exportElementToPdf } = await import("../_lib/exportPdf");
      const slug = idea.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "prd";
      try {
        await exportElementToPdf({
          source: container,
          filename: `${slug}-prd.pdf`,
        });
      } finally {
        document.body.removeChild(container);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "PDF export failed");
    } finally {
      setIsExportingPdf(false);
    }
  }

  async function handleExportDocx() {
    setIsExportingDocx(true);
    setError(null);
    try {
      const htmlDocxMod = await import("html-docx-js/dist/html-docx");
      const asBlob = htmlDocxMod.asBlob ?? htmlDocxMod.default?.asBlob;
      if (!asBlob) throw new Error("html-docx-js not available");
      const blob = asBlob(buildDocumentHtml());
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const slug = idea.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "prd";
      a.download = `${slug}-prd.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "DOCX export failed");
    } finally {
      setIsExportingDocx(false);
    }
  }

  async function handleSave() {
    if (!canSave) return;
    setIsSaving(true);
    setError(null);

    const trimmed: Record<string, string> = {};
    for (const [k, v] of Object.entries(fields)) {
      trimmed[k] = v.trim();
    }

    const result = await savePrd(idea.id, trimmed);
    setIsSaving(false);
    if (result.error) setError(result.error);
  }

  function handleRegenerate() {
    return triggerRegenerate(() => triggerAiGeneration(idea.id, "prd"));
  }

  if (isAiWorking || isRegenerating) {
    return <AiLoadingOverlay ideaId={idea.id} step="prd" />;
  }

  return (
    <div className="space-y-4">
      {/* Export toolbar — always visible at top */}
      <div className="flex items-center justify-end gap-2 pb-1">
          {/* Preview modal opener */}
          <button
            onClick={() => setShowPreview(true)}
            disabled={isRegenerating || isSaving}
            title="Preview full PRD document"
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold",
              "bg-white text-gray-900 hover:bg-gray-100 transition-colors shadow-sm",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Preview
          </button>

          {/* Direct PDF download */}
          <button
            onClick={handleExportPdf}
            disabled={isRegenerating || isSaving || isExportingPdf}
            title="Download PRD as PDF"
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold",
              "bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
            </svg>
            {isExportingPdf ? "Generating…" : "PDF"}
          </button>

          {/* Direct DOCX download */}
          <button
            onClick={handleExportDocx}
            disabled={isRegenerating || isSaving || isExportingDocx}
            title="Download PRD as DOCX"
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold",
              "bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
            </svg>
            {isExportingDocx ? "Generating…" : "DOCX"}
          </button>
        </div>

      {PRD_SECTIONS.map(({ key, label }) => {
        const isExpanded = expandedSections.has(key);
        return (
          <div
            key={key}
            className="rounded-xl border border-border bg-surface overflow-hidden"
          >
            <button
              type="button"
              onClick={() => toggleSection(key)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors"
            >
              <span className="text-sm font-semibold text-text-primary">
                {label}
              </span>
              <svg
                className={cn(
                  "w-4 h-4 text-text-muted transition-transform",
                  isExpanded && "rotate-180"
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {isExpanded && (
              <div className="px-4 pb-4">
                <RichTextEditor
                  content={fields[key]}
                  onChange={(html) => setField(key, html)}
                  editable={!isSaving && !isRegenerating}
                />
              </div>
            )}
          </div>
        );
      })}

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

      <PrdPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        ideaName={idea.name}
        sections={PRD_SECTIONS.map(({ key, label }) => ({
          key,
          label,
          html: fields[key],
        }))}
      />
    </div>
  );
}
