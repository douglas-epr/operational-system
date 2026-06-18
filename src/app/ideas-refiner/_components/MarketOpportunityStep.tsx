"use client";

import { useState, useEffect } from "react";
import type { IdeaFull } from "@/types/idea-refiner";
import { saveMarketOpportunity, triggerAiGeneration } from "../actions";
import AiLoadingOverlay from "./AiLoadingOverlay";
import RichTextEditor from "./RichTextEditor";
import { useRegenerate } from "../_hooks/useRegenerate";
import { createPortal } from "react-dom";
import { useStepActions } from "../_context/StepActionsContext";

interface MarketOpportunityStepProps {
  ideaFull: IdeaFull;
}

export default function MarketOpportunityStep({ ideaFull }: MarketOpportunityStepProps) {
  const { idea, marketOpportunity } = ideaFull;
  const isAiWorking = idea.current_blocks_updating === "market_opportunity";

  const [tamDescription, setTamDescription] = useState(marketOpportunity?.tam_description ?? "");
  const [tamEstimate, setTamEstimate] = useState(marketOpportunity?.tam_estimate ?? "");
  const [samDescription, setSamDescription] = useState(marketOpportunity?.sam_description ?? "");
  const [samEstimate, setSamEstimate] = useState(marketOpportunity?.sam_estimate ?? "");
  const [somDescription, setSomDescription] = useState(marketOpportunity?.som_description ?? "");
  const [somEstimate, setSomEstimate] = useState(marketOpportunity?.som_estimate ?? "");
  const [dataSources, setDataSources] = useState(marketOpportunity?.data_sources ?? "");
  const [segmentFilterLogic, setSegmentFilterLogic] = useState(marketOpportunity?.segment_filter_logic ?? "");
  const [growthDrivers, setGrowthDrivers] = useState(marketOpportunity?.growth_drivers ?? "");
  const [marketRisks, setMarketRisks] = useState(marketOpportunity?.market_risks ?? "");
  const [pricePoint, setPricePoint] = useState(marketOpportunity?.price_point ?? "");
  const [billingModel, setBillingModel] = useState(marketOpportunity?.billing_model ?? "");
  const [cacEstimate, setCacEstimate] = useState(marketOpportunity?.cac_estimate ?? "");
  const [ltvEstimate, setLtvEstimate] = useState(marketOpportunity?.ltv_estimate ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const { isRegenerating, error, setError, triggerRegenerate } = useRegenerate(
    idea.id, "market_opportunity", isAiWorking
  );

  useEffect(() => {
    setTamDescription(marketOpportunity?.tam_description ?? "");
    setTamEstimate(marketOpportunity?.tam_estimate ?? "");
    setSamDescription(marketOpportunity?.sam_description ?? "");
    setSamEstimate(marketOpportunity?.sam_estimate ?? "");
    setSomDescription(marketOpportunity?.som_description ?? "");
    setSomEstimate(marketOpportunity?.som_estimate ?? "");
    setDataSources(marketOpportunity?.data_sources ?? "");
    setSegmentFilterLogic(marketOpportunity?.segment_filter_logic ?? "");
    setGrowthDrivers(marketOpportunity?.growth_drivers ?? "");
    setMarketRisks(marketOpportunity?.market_risks ?? "");
    setPricePoint(marketOpportunity?.price_point ?? "");
    setBillingModel(marketOpportunity?.billing_model ?? "");
    setCacEstimate(marketOpportunity?.cac_estimate ?? "");
    setLtvEstimate(marketOpportunity?.ltv_estimate ?? "");
  }, [
    marketOpportunity?.tam_description,
    marketOpportunity?.tam_estimate,
    marketOpportunity?.sam_description,
    marketOpportunity?.sam_estimate,
    marketOpportunity?.som_description,
    marketOpportunity?.som_estimate,
    marketOpportunity?.data_sources,
    marketOpportunity?.segment_filter_logic,
    marketOpportunity?.growth_drivers,
    marketOpportunity?.market_risks,
    marketOpportunity?.price_point,
    marketOpportunity?.billing_model,
    marketOpportunity?.cac_estimate,
    marketOpportunity?.ltv_estimate,
  ]);

  const { actionBarEl, onOpenAiConfig } = useStepActions();

  const hasContent = tamDescription.trim().length > 0 || tamEstimate.trim().length > 0;
  const canSave = hasContent && !isSaving && !isRegenerating;

  async function handleSave() {
    if (!canSave) return;
    setIsSaving(true);
    setError(null);
    const result = await saveMarketOpportunity(idea.id, {
      tam_description: tamDescription.trim(),
      tam_estimate: tamEstimate.trim(),
      sam_description: samDescription.trim(),
      sam_estimate: samEstimate.trim(),
      som_description: somDescription.trim(),
      som_estimate: somEstimate.trim(),
      data_sources: dataSources.trim(),
      segment_filter_logic: segmentFilterLogic.trim(),
      growth_drivers: growthDrivers.trim(),
      market_risks: marketRisks.trim(),
      price_point: pricePoint.trim(),
      billing_model: billingModel.trim(),
      cac_estimate: cacEstimate.trim(),
      ltv_estimate: ltvEstimate.trim(),
    });
    setIsSaving(false);
    if (result.error) setError(result.error);
  }

  function handleRegenerate() {
    return triggerRegenerate(() => triggerAiGeneration(idea.id, "market_opportunity"));
  }

  if (isAiWorking || isRegenerating) {
    return <AiLoadingOverlay ideaId={idea.id} step="market_opportunity" />;
  }

  const isEditing = !isSaving && !isRegenerating;

  return (
    <div className="space-y-8">
      {/* TAM */}
      <section>
        <h2 className="text-base font-bold text-text-primary mb-4 pb-2 border-b border-border">
          Total Addressable Market (TAM)
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">Definition</label>
            <RichTextEditor content={tamDescription} onChange={setTamDescription} editable={isEditing} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">Estimate &amp; Source</label>
            <RichTextEditor content={tamEstimate} onChange={setTamEstimate} editable={isEditing} />
          </div>
        </div>
      </section>

      {/* SAM */}
      <section>
        <h2 className="text-base font-bold text-text-primary mb-4 pb-2 border-b border-border">
          Serviceable Addressable Market (SAM)
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">Definition</label>
            <RichTextEditor content={samDescription} onChange={setSamDescription} editable={isEditing} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">Estimate &amp; Source</label>
            <RichTextEditor content={samEstimate} onChange={setSamEstimate} editable={isEditing} />
          </div>
        </div>
      </section>

      {/* SOM */}
      <section>
        <h2 className="text-base font-bold text-text-primary mb-4 pb-2 border-b border-border">
          Serviceable Obtainable Market (SOM)
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">Definition</label>
            <RichTextEditor content={somDescription} onChange={setSomDescription} editable={isEditing} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">Estimate &amp; Assumptions</label>
            <RichTextEditor content={somEstimate} onChange={setSomEstimate} editable={isEditing} />
          </div>
        </div>
      </section>

      {/* Supporting data */}
      <section>
        <h2 className="text-base font-bold text-text-primary mb-4 pb-2 border-b border-border">
          Supporting Analysis
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">Data Sources</label>
            <RichTextEditor content={dataSources} onChange={setDataSources} editable={isEditing} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">Segment Filter Logic</label>
            <RichTextEditor content={segmentFilterLogic} onChange={setSegmentFilterLogic} editable={isEditing} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">Growth Drivers</label>
            <RichTextEditor content={growthDrivers} onChange={setGrowthDrivers} editable={isEditing} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">Market Risks</label>
            <RichTextEditor content={marketRisks} onChange={setMarketRisks} editable={isEditing} />
          </div>
        </div>
      </section>

      {/* Offer & Pricing */}
      <section>
        <h2 className="text-base font-bold text-text-primary mb-4 pb-2 border-b border-border">
          Offer &amp; Pricing
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">Price Point</label>
            <RichTextEditor content={pricePoint} onChange={setPricePoint} editable={isEditing} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">Billing Model</label>
            <RichTextEditor content={billingModel} onChange={setBillingModel} editable={isEditing} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">CAC Estimate</label>
            <RichTextEditor content={cacEstimate} onChange={setCacEstimate} editable={isEditing} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">LTV Estimate</label>
            <RichTextEditor content={ltvEstimate} onChange={setLtvEstimate} editable={isEditing} />
          </div>
        </div>
      </section>

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
