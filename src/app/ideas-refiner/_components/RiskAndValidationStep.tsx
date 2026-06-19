"use client";

import { useEffect, useState } from "react";
import type { IdeaFull, RiskItem, ValidationTestStep, WhyWeWinItem, DemandEvidence, IdeaReportDebateTurn } from "@/types/idea-refiner";
import { triggerAiGeneration, saveRiskAndValidation } from "../actions";
import AiLoadingOverlay from "./AiLoadingOverlay";
import { useRegenerate } from "../_hooks/useRegenerate";
import { createPortal } from "react-dom";
import { useStepActions } from "../_context/StepActionsContext";
import { cn } from "@/lib/utils";

interface RiskAndValidationStepProps {
  ideaFull: IdeaFull;
}

const SEVERITY_OPTIONS = ["Critical", "High", "Medium", "Low"] as const;
const LIKELIHOOD_OPTIONS = ["Very Likely", "Likely", "Possible", "Unlikely"] as const;

const SEVERITY_COLORS: Record<string, string> = {
  Critical: "bg-red-500/20 text-red-400 border-red-500/30",
  High: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Low: "bg-green-500/20 text-green-400 border-green-500/30",
};

const LIKELIHOOD_COLORS: Record<string, string> = {
  "Very Likely": "text-red-400",
  Likely: "text-orange-400",
  Possible: "text-yellow-400",
  Unlikely: "text-text-muted",
};

export default function RiskAndValidationStep({ ideaFull }: RiskAndValidationStepProps) {
  const { idea, riskAndValidation } = ideaFull;
  const isAiWorking = idea.current_blocks_updating === "risk_and_validation";

  const { isRegenerating, error, setError, triggerRegenerate } = useRegenerate(
    idea.id, "risk_and_validation", isAiWorking
  );

  const [isDebateOpen, setIsDebateOpen] = useState(false);
  const [editRisk, setEditRisk] = useState<RiskItem[]>([]);
  const [editValidation, setEditValidation] = useState<Record<string, unknown>>({});
  const [editWhyWeWin, setEditWhyWeWin] = useState<WhyWeWinItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEditRisk(Array.isArray(riskAndValidation?.risk_register) ? [...(riskAndValidation.risk_register as RiskItem[])] : []);
    setEditValidation((riskAndValidation?.validation_test as Record<string, unknown>) ?? {});
    setEditWhyWeWin(Array.isArray(riskAndValidation?.why_we_win) ? [...(riskAndValidation.why_we_win as WhyWeWinItem[])] : []);
    setError(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riskAndValidation]);

  const { actionBarEl, onOpenAiConfig } = useStepActions();

  function handleRegenerate() {
    return triggerRegenerate(() => triggerAiGeneration(idea.id, "risk_and_validation"));
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    const result = await saveRiskAndValidation(idea.id, {
      risk_register: editRisk,
      validation_test: editValidation,
      why_we_win: editWhyWeWin,
    });
    setIsSaving(false);
    if (result.error) setError(result.error);
  }

  function updateRiskItem(index: number, field: keyof RiskItem, value: string) {
    setEditRisk(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }

  function updateValidationField(field: string, value: unknown) {
    setEditValidation(prev => ({ ...prev, [field]: value }));
  }

  function updateValidationStep(index: number, field: string, value: string) {
    const steps = (editValidation.steps as ValidationTestStep[] ?? []).map((s, i) =>
      i === index ? { ...s, [field]: value } : s
    );
    setEditValidation(prev => ({ ...prev, steps }));
  }

  function updateWhyWeWinItem(index: number, field: keyof WhyWeWinItem, value: string) {
    setEditWhyWeWin(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }

  if (isAiWorking || isRegenerating) {
    return <AiLoadingOverlay ideaId={idea.id} step="risk_and_validation" />;
  }

  if (!riskAndValidation) {
    return (
      <>
        <div className="rounded-xl border border-border bg-surface p-8 text-center max-w-xl mx-auto mt-8">
          <p className="text-sm font-semibold text-text-primary mb-2">No data yet</p>
          <p className="text-sm text-text-muted">
            Click <span className="font-medium text-text-primary">Regenerate</span> at the top to run the Devil&apos;s Advocate debate and create your risk register.
          </p>
        </div>
        {error && <p className="text-sm text-red-400 mt-4 text-center" role="alert">{error}</p>}
        {actionBarEl && createPortal(
          <ActionBar onRegenerate={handleRegenerate} onSave={handleSave} isRegenerating={false} isSaving={false} onOpenAiConfig={onOpenAiConfig} />,
          actionBarEl
        )}
      </>
    );
  }

  const { demand_evidence } = riskAndValidation;
  const debateTranscript = riskAndValidation.debate_transcript as IdeaReportDebateTurn[] | null | undefined;
  const debateMeta = riskAndValidation.debate_meta as {
    problem_rounds: number;
    solution_rounds: number;
    problem_converged: boolean;
    solution_converged: boolean;
    impasse_note?: string;
  } | null | undefined;
  const validationSteps = editValidation.steps as ValidationTestStep[] | undefined;

  return (
    <div className="space-y-8">
      {/* The Debate — Devil's Advocate collapsible transcript */}
      {debateTranscript && debateTranscript.length > 0 && (
        <div className="rounded-xl border border-border bg-surface">
          <button
            onClick={() => setIsDebateOpen(!isDebateOpen)}
            className="w-full px-6 py-4 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="text-sm font-semibold text-text-primary">The Debate</h3>
              {debateMeta && (
                <span className="text-[10px] text-text-muted">
                  ({debateMeta.problem_rounds}p + {debateMeta.solution_rounds}s rounds
                  {debateMeta.problem_converged && debateMeta.solution_converged ? " · converged" : " · impasse"})
                </span>
              )}
            </div>
            <svg
              className={cn("w-4 h-4 text-text-secondary transition-transform", isDebateOpen && "rotate-180")}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isDebateOpen && (
            <div className="border-t border-border divide-y divide-border">
              {debateMeta?.impasse_note && (
                <div className="px-6 py-3 text-xs text-amber-400 bg-amber-500/5">
                  {debateMeta.impasse_note}
                </div>
              )}
              {(["problem", "solution"] as const).map((gate) => {
                const gateTurns = debateTranscript.filter((t) => t.gate === gate);
                if (!gateTurns.length) return null;
                return (
                  <div key={gate}>
                    <div className="px-6 py-2 bg-muted/40 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                      Gate {gate === "problem" ? "1 — Right Problem" : "2 — Right Solution"}
                    </div>
                    {gateTurns.map((turn, i) => (
                      <div key={i} className="px-6 py-4 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold",
                              turn.role === "skeptic"
                                ? "bg-red-500/15 text-red-400 border border-red-500/30"
                                : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                            )}
                          >
                            {turn.role === "skeptic" ? "Skeptic" : "Advocate"} · Round {turn.round}
                          </span>
                          {turn.agree && (
                            <span className="text-[10px] text-green-400">✓ agreed</span>
                          )}
                        </div>
                        <p className="text-sm text-text-secondary">{turn.content}</p>
                        <p className="text-xs text-text-muted italic">
                          Proposed: &ldquo;{turn.proposed_statement}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Agreed Problem & Solution summary */}
      {(riskAndValidation.agreed_problem || riskAndValidation.agreed_solution) && (
        <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
          <h2 className="text-base font-bold text-text-primary">Debate Outcome</h2>
          {riskAndValidation.agreed_problem && (
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Agreed Problem</p>
              <p className="text-sm text-text-primary">{riskAndValidation.agreed_problem as string}</p>
            </div>
          )}
          {riskAndValidation.agreed_solution && (
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Agreed Solution</p>
              <p className="text-sm text-text-primary">{riskAndValidation.agreed_solution as string}</p>
            </div>
          )}
        </div>
      )}

      {/* Demand Validation — read-only (AI-generated structured output) */}
      {demand_evidence && (
        <DemandValidationSection demand={demand_evidence as DemandEvidence} />
      )}

      {/* Risk Register — editable */}
      {editRisk.length > 0 && (
        <section>
          <h2 className="text-base font-bold text-text-primary mb-4 pb-2 border-b border-border">
            Risk Register
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 text-xs font-semibold text-text-muted uppercase tracking-wider w-1/4">Risk</th>
                  <th className="text-left py-2 pr-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Severity</th>
                  <th className="text-left py-2 pr-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Likelihood</th>
                  <th className="text-left py-2 pr-4 text-xs font-semibold text-text-muted uppercase tracking-wider w-1/3">Mitigation</th>
                  <th className="text-left py-2 text-xs font-semibold text-text-muted uppercase tracking-wider">Owner</th>
                </tr>
              </thead>
              <tbody>
                {editRisk.map((item, i) => (
                  <tr key={i} className="border-b border-border/50 align-top">
                    <td className="py-2 pr-4">
                      <textarea
                        value={item.risk ?? ""}
                        onChange={(e) => updateRiskItem(i, "risk", e.target.value)}
                        rows={2}
                        className="w-full bg-transparent text-text-primary text-sm resize-none focus:outline-none focus:ring-1 focus:ring-accent/50 rounded p-1"
                      />
                    </td>
                    <td className="py-2 pr-4">
                      <select
                        value={item.severity ?? "Medium"}
                        onChange={(e) => updateRiskItem(i, "severity", e.target.value)}
                        className={cn(
                          "rounded px-2 py-1 text-xs font-medium border focus:outline-none focus:ring-1 focus:ring-accent/50 bg-transparent",
                          SEVERITY_COLORS[item.severity] ?? "bg-muted text-text-secondary border-border"
                        )}
                      >
                        {SEVERITY_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="py-2 pr-4">
                      <select
                        value={item.likelihood ?? "Possible"}
                        onChange={(e) => updateRiskItem(i, "likelihood", e.target.value)}
                        className={cn(
                          "rounded px-2 py-1 text-xs border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-accent/50",
                          LIKELIHOOD_COLORS[item.likelihood] ?? "text-text-secondary"
                        )}
                      >
                        {LIKELIHOOD_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </td>
                    <td className="py-2 pr-4">
                      <textarea
                        value={item.mitigation ?? ""}
                        onChange={(e) => updateRiskItem(i, "mitigation", e.target.value)}
                        rows={2}
                        className="w-full bg-transparent text-text-secondary text-sm resize-none focus:outline-none focus:ring-1 focus:ring-accent/50 rounded p-1"
                      />
                    </td>
                    <td className="py-2">
                      <input
                        value={item.owner ?? ""}
                        onChange={(e) => updateRiskItem(i, "owner", e.target.value)}
                        className="w-full bg-transparent text-text-muted text-sm focus:outline-none focus:ring-1 focus:ring-accent/50 rounded p-1"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Validation Experiment — editable */}
      {Object.keys(editValidation).length > 0 && (
        <section>
          <h2 className="text-base font-bold text-text-primary mb-4 pb-2 border-b border-border">
            Validation Experiment
          </h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="rounded-lg border border-border bg-surface px-4 py-2">
              <p className="text-xs text-text-muted mb-1">Budget Max</p>
              <input
                value={(editValidation.budget_max as string) ?? ""}
                onChange={(e) => updateValidationField("budget_max", e.target.value)}
                className="bg-transparent text-sm font-semibold text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/50 rounded p-0.5 w-32"
              />
            </div>
            <div className="rounded-lg border border-border bg-surface px-4 py-2">
              <p className="text-xs text-text-muted mb-1">Duration (weeks)</p>
              <input
                value={(editValidation.duration_weeks as string | number) ?? ""}
                onChange={(e) => updateValidationField("duration_weeks", e.target.value)}
                type="number"
                min="1"
                className="bg-transparent text-sm font-semibold text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/50 rounded p-0.5 w-20"
              />
            </div>
          </div>

          {validationSteps && validationSteps.length > 0 && (
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Week</th>
                    <th className="text-left py-2 pr-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Action</th>
                    <th className="text-left py-2 pr-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Success Metric</th>
                    <th className="text-left py-2 text-xs font-semibold text-text-muted uppercase tracking-wider">Kill Criterion</th>
                  </tr>
                </thead>
                <tbody>
                  {validationSteps.map((step, i) => (
                    <tr key={i} className="border-b border-border/50 align-top">
                      <td className="py-2 pr-4">
                        <input
                          value={step.week_range ?? ""}
                          onChange={(e) => updateValidationStep(i, "week_range", e.target.value)}
                          className="w-full bg-transparent text-text-primary text-sm font-medium focus:outline-none focus:ring-1 focus:ring-accent/50 rounded p-1"
                        />
                      </td>
                      <td className="py-2 pr-4">
                        <textarea
                          value={step.action ?? ""}
                          onChange={(e) => updateValidationStep(i, "action", e.target.value)}
                          rows={2}
                          className="w-full bg-transparent text-text-secondary text-sm resize-none focus:outline-none focus:ring-1 focus:ring-accent/50 rounded p-1"
                        />
                      </td>
                      <td className="py-2 pr-4">
                        <textarea
                          value={step.success_metric ?? ""}
                          onChange={(e) => updateValidationStep(i, "success_metric", e.target.value)}
                          rows={2}
                          className="w-full bg-transparent text-text-secondary text-sm resize-none focus:outline-none focus:ring-1 focus:ring-accent/50 rounded p-1"
                        />
                      </td>
                      <td className="py-2">
                        <textarea
                          value={step.kill_criterion ?? ""}
                          onChange={(e) => updateValidationStep(i, "kill_criterion", e.target.value)}
                          rows={2}
                          className="w-full bg-transparent text-red-400 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-accent/50 rounded p-1"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
              <p className="text-xs font-semibold text-red-400 mb-1">Kill Criteria</p>
              <textarea
                value={(editValidation.kill_criteria as string) ?? ""}
                onChange={(e) => updateValidationField("kill_criteria", e.target.value)}
                rows={3}
                className="w-full bg-transparent text-text-secondary text-sm resize-none focus:outline-none focus:ring-1 focus:ring-accent/50 rounded p-1"
              />
            </div>
            <div className="rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3">
              <p className="text-xs font-semibold text-green-400 mb-1">Deliverable (if passes)</p>
              <textarea
                value={(editValidation.deliverable as string) ?? ""}
                onChange={(e) => updateValidationField("deliverable", e.target.value)}
                rows={3}
                className="w-full bg-transparent text-text-secondary text-sm resize-none focus:outline-none focus:ring-1 focus:ring-accent/50 rounded p-1"
              />
            </div>
          </div>
        </section>
      )}

      {/* Why We Win — editable */}
      {editWhyWeWin.length > 0 && (
        <section>
          <h2 className="text-base font-bold text-text-primary mb-4 pb-2 border-b border-border">
            Why We Win
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {editWhyWeWin.map((item, i) => (
              <div key={i} className="rounded-lg border border-border bg-surface px-4 py-3 space-y-2">
                <input
                  value={item.advantage ?? ""}
                  onChange={(e) => updateWhyWeWinItem(i, "advantage", e.target.value)}
                  placeholder="Advantage"
                  className="w-full bg-transparent text-text-primary text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-accent/50 rounded p-1"
                />
                <textarea
                  value={item.why_hard_to_copy ?? ""}
                  onChange={(e) => updateWhyWeWinItem(i, "why_hard_to_copy", e.target.value)}
                  rows={2}
                  placeholder="Why it's hard to copy"
                  className="w-full bg-transparent text-text-secondary text-sm resize-none focus:outline-none focus:ring-1 focus:ring-accent/50 rounded p-1"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Inline Save button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={isSaving || isRegenerating}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-400" role="alert">{error}</p>
      )}

      {actionBarEl && createPortal(
        <ActionBar onRegenerate={handleRegenerate} onSave={handleSave} isRegenerating={isRegenerating} isSaving={isSaving} onOpenAiConfig={onOpenAiConfig} />,
        actionBarEl
      )}
    </div>
  );
}

const GRADE_STYLES: Record<string, string> = {
  unproven: "bg-red-500/15 text-red-400 border-red-500/30",
  emerging: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  proven: "bg-green-500/15 text-green-400 border-green-500/30",
};

const CONFIDENCE_STYLES: Record<string, string> = {
  low: "text-red-400",
  medium: "text-yellow-400",
  high: "text-green-400",
};

const STRENGTH_STYLES: Record<string, string> = {
  stated: "bg-muted text-text-secondary border-border",
  behavioral: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  financial: "bg-green-500/15 text-green-400 border-green-500/30",
};

const STATUS_STYLES: Record<string, string> = {
  unproven: "text-red-400",
  emerging: "text-yellow-400",
  proven: "text-green-400",
};

function DemandValidationSection({ demand }: { demand: DemandEvidence }) {
  const { hypothesis, riskiest_assumptions, experiments, signals_to_watch, debate_insights, verdict } = demand;

  return (
    <section>
      <h2 className="text-base font-bold text-text-primary mb-4 pb-2 border-b border-border">
        Demand Validation
      </h2>

      {/* Verdict + Hypothesis */}
      <div className="rounded-lg border border-border bg-surface px-4 py-4 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <span className={cn(
            "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border uppercase tracking-wider",
            GRADE_STYLES[verdict.grade] ?? "bg-muted text-text-secondary border-border"
          )}>
            {verdict.grade}
          </span>
          <span className={cn("text-xs font-medium", CONFIDENCE_STYLES[verdict.confidence] ?? "text-text-muted")}>
            Confidence: {verdict.confidence}
          </span>
        </div>
        <p className="text-sm font-medium text-text-primary mb-2">{hypothesis}</p>
        <p className="text-sm text-text-secondary mb-3">{verdict.rationale}</p>
        <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2">
          <p className="text-xs font-semibold text-text-muted mb-0.5">Highest-leverage next test</p>
          <p className="text-sm text-text-primary">{verdict.highest_leverage_next_test}</p>
        </div>
      </div>

      {/* Riskiest Assumptions */}
      {riskiest_assumptions && riskiest_assumptions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Riskiest Assumptions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 text-xs font-semibold text-text-muted uppercase tracking-wider w-1/3">Assumption</th>
                  <th className="text-left py-2 pr-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Evidence Today</th>
                  <th className="text-left py-2 pr-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Needed</th>
                  <th className="text-left py-2 pr-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Strength</th>
                  <th className="text-left py-2 text-xs font-semibold text-text-muted uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {riskiest_assumptions.map((a, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-3 pr-3 font-medium text-text-primary">{a.assumption}</td>
                    <td className="py-3 pr-3 text-text-secondary">{a.evidence_today}</td>
                    <td className="py-3 pr-3 text-text-secondary">{a.evidence_needed}</td>
                    <td className="py-3 pr-3">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
                        STRENGTH_STYLES[a.strength] ?? "bg-muted text-text-secondary border-border"
                      )}>
                        {a.strength}
                      </span>
                    </td>
                    <td className={cn("py-3 text-sm font-medium", STATUS_STYLES[a.status] ?? "text-text-secondary")}>
                      {a.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ordered Experiments */}
      {experiments && experiments.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Validation Experiments (cheapest → strongest)</h3>
          <div className="space-y-3">
            {[...experiments].sort((a, b) => a.sequence_order - b.sequence_order).map((e, i) => (
              <div key={i} className="rounded-lg border border-border bg-surface px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center">
                    {e.sequence_order}
                  </span>
                  <span className="text-sm font-semibold text-text-primary">{e.method}</span>
                </div>
                <p className="text-sm text-text-secondary mb-2">{e.why_this_method}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="rounded border border-border/60 bg-muted/40 px-2 py-1.5">
                    <p className="text-xs text-text-muted mb-0.5">Budget / Sample</p>
                    <p className="text-xs font-medium text-text-primary">{e.sample_or_budget}</p>
                  </div>
                  <div className="rounded border border-green-500/20 bg-green-500/5 px-2 py-1.5">
                    <p className="text-xs text-green-400 mb-0.5">Pass threshold</p>
                    <p className="text-xs font-medium text-text-primary">{e.success_threshold}</p>
                  </div>
                  <div className="rounded border border-red-500/20 bg-red-500/5 px-2 py-1.5">
                    <p className="text-xs text-red-400 mb-0.5">Kill criterion</p>
                    <p className="text-xs font-medium text-text-primary">{e.kill_criterion}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Signals to Watch */}
      {signals_to_watch && signals_to_watch.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Signals to Watch</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {signals_to_watch.map((s, i) => (
              <div key={i} className={cn(
                "rounded-lg border px-3 py-2 flex items-start gap-2",
                s.is_anti_signal
                  ? "border-red-500/20 bg-red-500/5"
                  : "border-border bg-surface"
              )}>
                <span className={cn(
                  "flex-shrink-0 mt-0.5 w-2 h-2 rounded-full",
                  s.is_anti_signal ? "bg-red-400" : "bg-green-400"
                )} />
                <div>
                  <p className="text-sm text-text-primary">{s.signal}</p>
                  <span className={cn(
                    "inline-flex mt-1 items-center px-1.5 py-0.5 rounded text-xs font-medium border",
                    STRENGTH_STYLES[s.type] ?? "bg-muted text-text-secondary border-border"
                  )}>
                    {s.type}{s.is_anti_signal ? " — anti-signal" : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debate Insights */}
      {debate_insights && debate_insights.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Debate Insights on Demand</h3>
          <div className="space-y-2">
            {debate_insights.map((d, i) => (
              <div key={i} className="rounded-lg border border-border bg-surface px-4 py-3">
                <p className="text-xs font-semibold text-text-muted mb-1">{d.source}</p>
                <p className="text-sm text-text-primary mb-1">{d.insight}</p>
                <p className="text-sm text-text-secondary italic">{d.implication_for_demand}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function ActionBar({
  onRegenerate,
  onSave,
  isRegenerating,
  isSaving,
  onOpenAiConfig,
}: {
  onRegenerate: () => void;
  onSave: () => void;
  isRegenerating: boolean;
  isSaving: boolean;
  onOpenAiConfig: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onSave}
        disabled={isSaving || isRegenerating}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSaving ? "Saving..." : "Save"}
      </button>
      <button
        onClick={onRegenerate}
        disabled={isRegenerating}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {isRegenerating ? "Generating..." : "Regenerate"}
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
    </div>
  );
}
