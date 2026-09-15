/**
 * Step 6 — Strategic Frameworks.
 * Displays per-ICP framework cards: Value Proposition (2×2 grid), JTBD Synthesis,
 * ICP Architect (editable), NABC Pitch (2×2 grid), and Optimization Suggestions.
 * All rich-text fields are editable and can be saved per ICP.
 * Shows AI-generated ICP fit score.
 */
"use client";

import { useState, useMemo, useEffect } from "react";
import type { IdeaFull, IdeaIcp, IdeaOptimizationSuggestion } from "@/types/idea-refiner";
import { triggerAiGeneration, saveStrategicFramework } from "../actions";
import { cn } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitize";
import IcpPillSelector from "./IcpPillSelector";
import AiLoadingOverlay from "./AiLoadingOverlay";
import RichTextEditor from "./RichTextEditor.lazy";
import { useRegenerate } from "../_hooks/useRegenerate";
import { createPortal } from "react-dom";
import { useStepActions } from "../_context/StepActionsContext";

/** Fields that count toward "completion" for an ICP's strategic frameworks. */
const FRAMEWORK_FIELDS: (keyof IdeaIcp)[] = [
  "value_proposition_icp_pains",
  "value_proposition_icp_gains",
  "jtbd",
  "title",
  "pitch_need",
  "pitch_approach",
  "pitch_benefit",
  "pitch_competition",
];

/** Per-ICP editable state for all framework fields. */
interface IcpEditState {
  // Value Proposition 2×2
  vpPains: string;
  vpSolutions: string;
  vpGains: string;
  vpGainCreators: string;
  // JTBD
  jtbd: string;
  // NABC 2×2
  pitchNeed: string;
  pitchApproach: string;
  pitchBenefit: string;
  pitchCompetition: string;
  // ICP Architect
  title: string;
  subtitle: string;
  picture: string;
  tags: string; // comma-separated
  psychographics: string;
  firmographics: string;
}

function icpToEditState(icp: IdeaIcp): IcpEditState {
  return {
    vpPains: icp.value_proposition_icp_pains ?? "",
    vpSolutions: icp.value_proposition_value_map_solutions ?? "",
    vpGains: icp.value_proposition_icp_gains ?? "",
    vpGainCreators: icp.value_proposition_value_map_gain_creators ?? "",
    jtbd: icp.jtbd ?? "",
    pitchNeed: icp.pitch_need ?? "",
    pitchApproach: icp.pitch_approach ?? "",
    pitchBenefit: icp.pitch_benefit ?? "",
    pitchCompetition: icp.pitch_competition ?? "",
    title: icp.title ?? "",
    subtitle: icp.subtitle ?? "",
    picture: icp.picture ?? "",
    tags: icp.tags.join(", "),
    psychographics: icp.psychographics ?? "",
    firmographics: icp.firmographics ?? "",
  };
}

interface StrategicFrameworksStepProps {
  ideaFull: IdeaFull;
}

/** Renders the Strategic Frameworks step with per-ICP framework cards and AI regeneration. */
export default function StrategicFrameworksStep({ ideaFull }: StrategicFrameworksStepProps) {
  const { idea, icps, optimizationSuggestions } = ideaFull;
  const isAiWorking = idea.current_blocks_updating === "strategic_frameworks";

  const [selectedIcpId, setSelectedIcpId] = useState<string | null>(
    icps[0]?.id ?? null
  );
  const [editState, setEditState] = useState<Record<string, IcpEditState>>({});
  const { isRegenerating, error, setError, triggerRegenerate } = useRegenerate(idea.id, "strategic_frameworks", isAiWorking);
  const [isSavingFramework, setIsSavingFramework] = useState(false);

  const selectedIcp = icps.find((i) => i.id === selectedIcpId) ?? null;

  // Populate editState from ICP data (runs when icps change, e.g. after AI regeneration)
  useEffect(() => {
    const next: Record<string, IcpEditState> = {};
    for (const icp of icps) {
      next[icp.id] = icpToEditState(icp);
    }
    setEditState(next);
  }, [icps]);

  // Completion badges: count filled framework fields per ICP
  const completionBadges = useMemo(() => {
    const badges: Record<string, string> = {};
    for (const icp of icps) {
      const filled = FRAMEWORK_FIELDS.filter(
        (f) => icp[f] != null && String(icp[f]).trim() !== ""
      ).length;
      badges[icp.id] = `${filled}/${FRAMEWORK_FIELDS.length}`;
    }
    return badges;
  }, [icps]);

  const { actionBarEl, onOpenAiConfig } = useStepActions();

  // Filter optimization suggestions for selected ICP
  const icpSuggestions = useMemo(
    () =>
      selectedIcpId
        ? optimizationSuggestions.filter((s) => s.icp_id === selectedIcpId)
        : [],
    [optimizationSuggestions, selectedIcpId]
  );

  function updateField(field: keyof IcpEditState, value: string) {
    if (!selectedIcpId) return;
    setEditState((prev) => ({
      ...prev,
      [selectedIcpId]: { ...(prev[selectedIcpId] ?? icpToEditState(selectedIcp!)), [field]: value },
    }));
  }

  async function handleSaveFramework() {
    if (!selectedIcpId || !editState[selectedIcpId]) return;
    setIsSavingFramework(true);
    setError(null);
    const s = editState[selectedIcpId];
    const parsedTags = s.tags
      ? s.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];
    const result = await saveStrategicFramework(selectedIcpId, {
      value_proposition_icp_pains: s.vpPains || null,
      value_proposition_value_map_solutions: s.vpSolutions || null,
      value_proposition_icp_gains: s.vpGains || null,
      value_proposition_value_map_gain_creators: s.vpGainCreators || null,
      jtbd: s.jtbd || null,
      pitch_need: s.pitchNeed || null,
      pitch_approach: s.pitchApproach || null,
      pitch_benefit: s.pitchBenefit || null,
      pitch_competition: s.pitchCompetition || null,
      title: s.title || null,
      subtitle: s.subtitle || null,
      picture: s.picture || null,
      tags: parsedTags,
      psychographics: s.psychographics || null,
      firmographics: s.firmographics || null,
    });
    setIsSavingFramework(false);
    if (result.error) setError(result.error);
  }

  function handleRegenerate() {
    return triggerRegenerate(() =>
      triggerAiGeneration(idea.id, "strategic_frameworks")
    );
  }

  if (isAiWorking || isRegenerating) {
    return <AiLoadingOverlay ideaId={idea.id} step="strategic_frameworks" />;
  }

  if (icps.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        No ICPs available. Complete the Refining ICP step first.
      </p>
    );
  }

  const currentEditState = selectedIcpId
    ? (editState[selectedIcpId] ?? (selectedIcp ? icpToEditState(selectedIcp) : null))
    : null;

  return (
    <div className="space-y-6">
      {/* ICP pills with completion badges */}
      <IcpPillSelector
        icps={icps}
        selectedId={selectedIcpId}
        onSelect={setSelectedIcpId}
        completionBadges={completionBadges}
      />

      {selectedIcp && currentEditState && (
        <div className="space-y-6">
          {/* Row 1: Value Proposition (2×2) | JTBD Synthesis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ValuePropositionCard
              vpPains={currentEditState.vpPains}
              vpSolutions={currentEditState.vpSolutions}
              vpGains={currentEditState.vpGains}
              vpGainCreators={currentEditState.vpGainCreators}
              onChangePains={(v) => updateField("vpPains", v)}
              onChangeSolutions={(v) => updateField("vpSolutions", v)}
              onChangeGains={(v) => updateField("vpGains", v)}
              onChangeGainCreators={(v) => updateField("vpGainCreators", v)}
              disabled={isSavingFramework}
            />

            <EditableFrameworkCard
              title="JTBD Synthesis"
              icon="JT"
              sections={[
                {
                  label: null,
                  value: currentEditState.jtbd,
                  onChange: (v) => updateField("jtbd", v),
                },
              ]}
              disabled={isSavingFramework}
            />
          </div>

          {/* Row 2: ICP Architect (editable) | NABC Pitch (2×2) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <EditableIcpArchitectCard
              icp={selectedIcp}
              editState={currentEditState}
              onChangeField={updateField}
              disabled={isSavingFramework}
            />
            <NabcPitchCard
              need={currentEditState.pitchNeed}
              approach={currentEditState.pitchApproach}
              benefit={currentEditState.pitchBenefit}
              competition={currentEditState.pitchCompetition}
              onChangeNeed={(v) => updateField("pitchNeed", v)}
              onChangeApproach={(v) => updateField("pitchApproach", v)}
              onChangeBenefit={(v) => updateField("pitchBenefit", v)}
              onChangeCompetition={(v) => updateField("pitchCompetition", v)}
              disabled={isSavingFramework}
            />
          </div>

          {/* Optimization Suggestions */}
          {icpSuggestions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-3">
                Optimization Suggestions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {icpSuggestions.map((s) => (
                  <SuggestionCard key={s.id} suggestion={s} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
            disabled={isRegenerating || isSavingFramework}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isRegenerating ? "Regenerating..." : "Regenerate"}
          </button>
          <button
            onClick={handleSaveFramework}
            disabled={!selectedIcpId || isSavingFramework || isRegenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {isSavingFramework ? "Saving..." : "Save"}
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

// ── Card Components ──────────────────────────────────────────────────────────

interface EditableSection {
  label: string | null;
  value: string;
  onChange: (v: string) => void;
}

interface EditableFrameworkCardProps {
  title: string;
  icon: string;
  sections: EditableSection[];
  disabled?: boolean;
}

/** Framework card with editable RichTextEditor sections (vertical stack). */
function EditableFrameworkCard({ title, icon, sections, disabled = false }: EditableFrameworkCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-accent/10 text-accent text-xs font-bold">
          {icon}
        </span>
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      </div>
      <div className="space-y-3">
        {sections.map((s, i) => (
          <div key={i}>
            {s.label && (
              <p className="text-xs font-medium text-text-muted mb-1">
                {s.label}
              </p>
            )}
            <RichTextEditor
              content={s.value}
              onChange={s.onChange}
              editable={!disabled}
              placeholder="Not generated yet — use Regenerate or type here."
              minHeight="min-h-24"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Value Proposition card with a 2×2 grid layout:
 *  Top-left: ICP (PAINS) | Top-right: VALUE MAP (SOLUTIONS)
 *  Bottom-left: ICP (GAINS) | Bottom-right: VALUE MAP (GAIN CREATORS)
 */
interface ValuePropositionCardProps {
  vpPains: string;
  vpSolutions: string;
  vpGains: string;
  vpGainCreators: string;
  onChangePains: (v: string) => void;
  onChangeSolutions: (v: string) => void;
  onChangeGains: (v: string) => void;
  onChangeGainCreators: (v: string) => void;
  disabled?: boolean;
}

function ValuePropositionCard({
  vpPains,
  vpSolutions,
  vpGains,
  vpGainCreators,
  onChangePains,
  onChangeSolutions,
  onChangeGains,
  onChangeGainCreators,
  disabled = false,
}: ValuePropositionCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-accent/10 text-accent text-xs font-bold">
          VP
        </span>
        <h3 className="text-sm font-semibold text-text-primary">Value Proposition</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {/* Top-left: ICP (PAINS) */}
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
            ICP (PAINS)
          </p>
          <RichTextEditor
            content={vpPains}
            onChange={onChangePains}
            editable={!disabled}
            placeholder="ICP's specific pains..."
            minHeight="min-h-28"
          />
        </div>
        {/* Top-right: VALUE MAP (SOLUTIONS) */}
        <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
          <p className="text-xs font-semibold text-accent/80 uppercase tracking-wide mb-2">
            VALUE MAP (SOLUTIONS)
          </p>
          <RichTextEditor
            content={vpSolutions}
            onChange={onChangeSolutions}
            editable={!disabled}
            placeholder="How the product relieves pains..."
            minHeight="min-h-28"
          />
        </div>
        {/* Bottom-left: ICP (GAINS) */}
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
            ICP (GAINS)
          </p>
          <RichTextEditor
            content={vpGains}
            onChange={onChangeGains}
            editable={!disabled}
            placeholder="ICP's desired gains..."
            minHeight="min-h-28"
          />
        </div>
        {/* Bottom-right: VALUE MAP (GAIN CREATORS) */}
        <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
          <p className="text-xs font-semibold text-accent/80 uppercase tracking-wide mb-2">
            VALUE MAP (GAIN CREATORS)
          </p>
          <RichTextEditor
            content={vpGainCreators}
            onChange={onChangeGainCreators}
            editable={!disabled}
            placeholder="How the product creates gains..."
            minHeight="min-h-28"
          />
        </div>
      </div>
    </div>
  );
}

/** NABC Pitch card with a 2×2 grid layout:
 *  Top-left: NEED | Top-right: APPROACH
 *  Bottom-left: BENEFIT | Bottom-right: COMPETITION
 */
interface NabcPitchCardProps {
  need: string;
  approach: string;
  benefit: string;
  competition: string;
  onChangeNeed: (v: string) => void;
  onChangeApproach: (v: string) => void;
  onChangeBenefit: (v: string) => void;
  onChangeCompetition: (v: string) => void;
  disabled?: boolean;
}

function NabcPitchCard({
  need,
  approach,
  benefit,
  competition,
  onChangeNeed,
  onChangeApproach,
  onChangeBenefit,
  onChangeCompetition,
  disabled = false,
}: NabcPitchCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-accent/10 text-accent text-xs font-bold">
          NP
        </span>
        <h3 className="text-sm font-semibold text-text-primary">NABC Pitch</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {/* Top-left: NEED */}
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
            NEED
          </p>
          <RichTextEditor
            content={need}
            onChange={onChangeNeed}
            editable={!disabled}
            placeholder="The market need..."
            minHeight="min-h-28"
          />
        </div>
        {/* Top-right: APPROACH */}
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
            APPROACH
          </p>
          <RichTextEditor
            content={approach}
            onChange={onChangeApproach}
            editable={!disabled}
            placeholder="Our unique approach..."
            minHeight="min-h-28"
          />
        </div>
        {/* Bottom-left: BENEFIT */}
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
            BENEFIT
          </p>
          <RichTextEditor
            content={benefit}
            onChange={onChangeBenefit}
            editable={!disabled}
            placeholder="Key benefits delivered..."
            minHeight="min-h-28"
          />
        </div>
        {/* Bottom-right: COMPETITION */}
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
            COMPETITION
          </p>
          <RichTextEditor
            content={competition}
            onChange={onChangeCompetition}
            editable={!disabled}
            placeholder="Competitive differentiation..."
            minHeight="min-h-28"
          />
        </div>
      </div>
    </div>
  );
}

/** ICP Architect card — fully editable: title, subtitle, tags, psychographics, firmographics. */
interface EditableIcpArchitectCardProps {
  icp: IdeaIcp;
  editState: IcpEditState;
  onChangeField: (field: keyof IcpEditState, value: string) => void;
  disabled?: boolean;
}

function EditableIcpArchitectCard({
  icp,
  editState,
  onChangeField,
  disabled = false,
}: EditableIcpArchitectCardProps) {
  const tagList = editState.tags
    ? editState.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-accent/10 text-accent text-xs font-bold">
          IA
        </span>
        <h3 className="text-sm font-semibold text-text-primary">ICP Architect</h3>
      </div>

      {icp.score_rationale && (
        <div
          className="mb-3 text-xs text-text-muted prose prose-invert prose-xs max-w-none [&_*]:!text-xs"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(icp.score_rationale) }}
        />
      )}

      <div className="space-y-3">
        {/* Profile header with avatar + editable title/subtitle */}
        <div className="flex items-start gap-3">
          {icp.picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={icp.picture}
              alt={icp.name ?? "ICP"}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0 mt-1"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-text-muted text-xs font-bold flex-shrink-0 mt-1">
              {(icp.name ?? "?")[0].toUpperCase()}
            </div>
          )}
          <div className="flex-1 space-y-1.5">
            <input
              type="text"
              value={editState.title}
              onChange={(e) => onChangeField("title", e.target.value)}
              disabled={disabled}
              placeholder="Archetype title (e.g. The Overwhelmed SMB Owner)"
              className={cn(
                "w-full rounded-md border border-border bg-muted/30 px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted",
                "focus:outline-none focus:ring-1 focus:ring-accent",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            />
            <input
              type="text"
              value={editState.subtitle}
              onChange={(e) => onChangeField("subtitle", e.target.value)}
              disabled={disabled}
              placeholder="Archetype subtitle (brief tagline)"
              className={cn(
                "w-full rounded-md border border-border bg-muted/30 px-3 py-1.5 text-xs text-text-muted placeholder:text-text-muted",
                "focus:outline-none focus:ring-1 focus:ring-accent",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            />
            <input
              type="url"
              value={editState.picture}
              onChange={(e) => onChangeField("picture", e.target.value)}
              disabled={disabled}
              placeholder="Avatar URL (e.g. https://api.dicebear.com/7.x/personas/svg?seed=...)"
              className={cn(
                "w-full rounded-md border border-border bg-muted/30 px-3 py-1.5 text-[10px] text-text-muted placeholder:text-text-muted/60",
                "focus:outline-none focus:ring-1 focus:ring-accent",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <p className="text-xs font-medium text-text-muted mb-1">Tags (comma-separated)</p>
          <input
            type="text"
            value={editState.tags}
            onChange={(e) => onChangeField("tags", e.target.value)}
            disabled={disabled}
            placeholder="e.g. Startup, B2B, Tech-savvy"
            className={cn(
              "w-full rounded-md border border-border bg-muted/30 px-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted",
              "focus:outline-none focus:ring-1 focus:ring-accent",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          />
          {tagList.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tagList.map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-full bg-muted text-text-muted text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Psychographics */}
        <div>
          <p className="text-xs font-medium text-text-muted mb-1">Psychographics</p>
          <RichTextEditor
            content={editState.psychographics}
            onChange={(v) => onChangeField("psychographics", v)}
            editable={!disabled}
            placeholder="Psychographic profile..."
            minHeight="min-h-20"
          />
        </div>

        {/* Firmographics */}
        <div>
          <p className="text-xs font-medium text-text-muted mb-1">Firmographics</p>
          <RichTextEditor
            content={editState.firmographics}
            onChange={(v) => onChangeField("firmographics", v)}
            editable={!disabled}
            placeholder="Firmographic profile..."
            minHeight="min-h-20"
          />
        </div>
      </div>
    </div>
  );
}

/** Optimization suggestion card. */
function SuggestionCard({ suggestion }: { suggestion: IdeaOptimizationSuggestion }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h4 className="text-sm font-semibold text-text-primary mb-1">
        {suggestion.name ?? "Suggestion"}
      </h4>
      <p className="text-xs text-text-secondary whitespace-pre-wrap">
        {suggestion.description ?? "No description."}
      </p>
    </div>
  );
}
