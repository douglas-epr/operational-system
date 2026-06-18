"use client";

import { useState, useEffect } from "react";
import type { IdeaFull } from "@/types/idea-refiner";
import { saveLocationLegislation, triggerAiGeneration } from "../actions";
import AiLoadingOverlay from "./AiLoadingOverlay";
import RichTextEditor from "./RichTextEditor";
import { useRegenerate } from "../_hooks/useRegenerate";
import { createPortal } from "react-dom";
import { useStepActions } from "../_context/StepActionsContext";

interface LocationLegislationStepProps {
  ideaFull: IdeaFull;
}

export default function LocationLegislationStep({ ideaFull }: LocationLegislationStepProps) {
  const { idea, locationLegislation } = ideaFull;
  const isAiWorking = idea.current_blocks_updating === "location_legislation";

  const [regulatoryBodies, setRegulatoryBodies] = useState(locationLegislation?.regulatory_bodies ?? "");
  const [keyLegislation, setKeyLegislation] = useState(locationLegislation?.key_legislation ?? "");
  const [licensingRequirements, setLicensingRequirements] = useState(locationLegislation?.licensing_requirements ?? "");
  const [dataPrivacyRules, setDataPrivacyRules] = useState(locationLegislation?.data_privacy_rules ?? "");
  const [complianceTimeline, setComplianceTimeline] = useState(locationLegislation?.compliance_timeline ?? "");
  const [regulatoryMoat, setRegulatoryMoat] = useState(locationLegislation?.regulatory_moat ?? "");
  const [redFlags, setRedFlags] = useState(locationLegislation?.red_flags ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const { isRegenerating, error, setError, triggerRegenerate } = useRegenerate(
    idea.id, "location_legislation", isAiWorking
  );

  useEffect(() => {
    setRegulatoryBodies(locationLegislation?.regulatory_bodies ?? "");
    setKeyLegislation(locationLegislation?.key_legislation ?? "");
    setLicensingRequirements(locationLegislation?.licensing_requirements ?? "");
    setDataPrivacyRules(locationLegislation?.data_privacy_rules ?? "");
    setComplianceTimeline(locationLegislation?.compliance_timeline ?? "");
    setRegulatoryMoat(locationLegislation?.regulatory_moat ?? "");
    setRedFlags(locationLegislation?.red_flags ?? "");
  }, [
    locationLegislation?.regulatory_bodies,
    locationLegislation?.key_legislation,
    locationLegislation?.licensing_requirements,
    locationLegislation?.data_privacy_rules,
    locationLegislation?.compliance_timeline,
    locationLegislation?.regulatory_moat,
    locationLegislation?.red_flags,
  ]);

  const { actionBarEl, onOpenAiConfig } = useStepActions();

  const hasContent =
    regulatoryBodies.trim().length > 0 ||
    keyLegislation.trim().length > 0 ||
    licensingRequirements.trim().length > 0;

  const canSave = hasContent && !isSaving && !isRegenerating;

  async function handleSave() {
    if (!canSave) return;
    setIsSaving(true);
    setError(null);
    const result = await saveLocationLegislation(idea.id, {
      regulatory_bodies: regulatoryBodies.trim(),
      key_legislation: keyLegislation.trim(),
      licensing_requirements: licensingRequirements.trim(),
      data_privacy_rules: dataPrivacyRules.trim(),
      compliance_timeline: complianceTimeline.trim(),
      regulatory_moat: regulatoryMoat.trim(),
      red_flags: redFlags.trim(),
    });
    setIsSaving(false);
    if (result.error) setError(result.error);
  }

  function handleRegenerate() {
    return triggerRegenerate(() => triggerAiGeneration(idea.id, "location_legislation"));
  }

  if (isAiWorking || isRegenerating) {
    return <AiLoadingOverlay ideaId={idea.id} step="location_legislation" />;
  }

  const isEditing = !isSaving && !isRegenerating;
  const hasNoData = !idea.location && !idea.jurisdiction && !locationLegislation;

  return (
    <div className="space-y-6">
      {hasNoData ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center max-w-xl mx-auto mt-2">
          <p className="text-sm font-semibold text-text-primary mb-2">No location set</p>
          <p className="text-sm text-text-muted">
            Add a Target Location and Jurisdiction in the Structure &amp; Align step for a location-specific analysis, or click Generate for a general regulatory overview.
          </p>
        </div>
      ) : (
        <>
          {(idea.location || idea.jurisdiction) && (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-sm">
              <span className="font-semibold text-text-primary">Target:</span>
              <span className="text-text-secondary">
                {[idea.location, idea.jurisdiction].filter(Boolean).join(" · ")}
              </span>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">
              Regulatory Bodies
            </label>
            <RichTextEditor content={regulatoryBodies} onChange={setRegulatoryBodies} editable={isEditing} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">
              Key Legislation
            </label>
            <RichTextEditor content={keyLegislation} onChange={setKeyLegislation} editable={isEditing} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">
              Licensing Requirements
            </label>
            <RichTextEditor content={licensingRequirements} onChange={setLicensingRequirements} editable={isEditing} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">
              Data Privacy Rules
            </label>
            <RichTextEditor content={dataPrivacyRules} onChange={setDataPrivacyRules} editable={isEditing} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">
              Compliance Timeline
            </label>
            <RichTextEditor content={complianceTimeline} onChange={setComplianceTimeline} editable={isEditing} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">
              Regulatory Moat
            </label>
            <RichTextEditor content={regulatoryMoat} onChange={setRegulatoryMoat} editable={isEditing} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">
              Red Flags
            </label>
            <RichTextEditor content={redFlags} onChange={setRedFlags} editable={isEditing} />
          </div>
        </>
      )}

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
            {isRegenerating ? "Generating..." : "Generate"}
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
