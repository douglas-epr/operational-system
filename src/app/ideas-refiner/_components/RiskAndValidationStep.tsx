"use client";

import { useEffect } from "react";
import type { IdeaFull, RiskItem, ValidationTestStep, WhyWeWinItem } from "@/types/idea-refiner";
import { triggerAiGeneration } from "../actions";
import AiLoadingOverlay from "./AiLoadingOverlay";
import { useRegenerate } from "../_hooks/useRegenerate";
import { createPortal } from "react-dom";
import { useStepActions } from "../_context/StepActionsContext";
import { cn } from "@/lib/utils";

interface RiskAndValidationStepProps {
  ideaFull: IdeaFull;
}

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
  const { idea, riskAndValidation, report } = ideaFull;
  const isAiWorking = idea.current_blocks_updating === "risk_and_validation";

  const { isRegenerating, error, setError, triggerRegenerate } = useRegenerate(
    idea.id, "risk_and_validation", isAiWorking
  );

  useEffect(() => {
    setError(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riskAndValidation]);

  const { actionBarEl, onOpenAiConfig } = useStepActions();

  function handleRegenerate() {
    return triggerRegenerate(() => triggerAiGeneration(idea.id, "risk_and_validation"));
  }

  if (isAiWorking || isRegenerating) {
    return <AiLoadingOverlay ideaId={idea.id} step="risk_and_validation" />;
  }

  if (!riskAndValidation) {
    return (
      <>
        <div className="rounded-xl border border-border bg-surface p-8 text-center max-w-xl mx-auto mt-8">
          <p className="text-sm font-semibold text-text-primary mb-2">No data yet</p>
          <p className="text-sm text-text-muted mb-4">
            {report
              ? "Click Generate to create your risk register, validation experiment, and competitive advantage analysis."
              : "Complete the Report step first, then generate this analysis."}
          </p>
          {report && (
            <button
              onClick={handleRegenerate}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-accent text-white hover:bg-accent/90 transition-colors"
            >
              Generate
            </button>
          )}
        </div>
        {error && <p className="text-sm text-red-400 mt-4 text-center" role="alert">{error}</p>}
        {actionBarEl && createPortal(
          <ActionBar onRegenerate={handleRegenerate} isRegenerating={false} onOpenAiConfig={onOpenAiConfig} />,
          actionBarEl
        )}
      </>
    );
  }

  const { risk_register, validation_test, why_we_win } = riskAndValidation;

  return (
    <div className="space-y-8">
      {/* Risk Register */}
      {risk_register && risk_register.length > 0 && (
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
                {(risk_register as RiskItem[]).map((item, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-3 pr-4 font-medium text-text-primary">{item.risk}</td>
                    <td className="py-3 pr-4">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
                        SEVERITY_COLORS[item.severity] ?? "bg-muted text-text-secondary border-border"
                      )}>
                        {item.severity}
                      </span>
                    </td>
                    <td className={cn("py-3 pr-4 text-sm", LIKELIHOOD_COLORS[item.likelihood] ?? "text-text-secondary")}>
                      {item.likelihood}
                    </td>
                    <td className="py-3 pr-4 text-text-secondary">{item.mitigation}</td>
                    <td className="py-3 text-text-muted">{item.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Validation Test */}
      {validation_test && (
        <section>
          <h2 className="text-base font-bold text-text-primary mb-4 pb-2 border-b border-border">
            Validation Experiment
          </h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="rounded-lg border border-border bg-surface px-4 py-2">
              <p className="text-xs text-text-muted">Budget Max</p>
              <p className="text-sm font-semibold text-text-primary">{validation_test.budget_max}</p>
            </div>
            <div className="rounded-lg border border-border bg-surface px-4 py-2">
              <p className="text-xs text-text-muted">Duration</p>
              <p className="text-sm font-semibold text-text-primary">{validation_test.duration_weeks} weeks</p>
            </div>
          </div>

          {validation_test.steps && validation_test.steps.length > 0 && (
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
                  {(validation_test.steps as ValidationTestStep[]).map((step, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-3 pr-4 font-medium text-text-primary whitespace-nowrap">{step.week_range}</td>
                      <td className="py-3 pr-4 text-text-secondary">{step.action}</td>
                      <td className="py-3 pr-4 text-text-secondary">{step.success_metric}</td>
                      <td className="py-3 text-red-400 text-sm">{step.kill_criterion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {validation_test.kill_criteria && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
                <p className="text-xs font-semibold text-red-400 mb-1">Kill Criteria</p>
                <p className="text-sm text-text-secondary">{validation_test.kill_criteria}</p>
              </div>
            )}
            {validation_test.deliverable && (
              <div className="rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3">
                <p className="text-xs font-semibold text-green-400 mb-1">Deliverable (if passes)</p>
                <p className="text-sm text-text-secondary">{validation_test.deliverable}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Why We Win */}
      {why_we_win && why_we_win.length > 0 && (
        <section>
          <h2 className="text-base font-bold text-text-primary mb-4 pb-2 border-b border-border">
            Why We Win
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(why_we_win as WhyWeWinItem[]).map((item, i) => (
              <div key={i} className="rounded-lg border border-border bg-surface px-4 py-3">
                <p className="text-sm font-semibold text-text-primary mb-1">{item.advantage}</p>
                <p className="text-sm text-text-secondary">{item.why_hard_to_copy}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {error && (
        <p className="text-sm text-red-400" role="alert">{error}</p>
      )}

      {actionBarEl && createPortal(
        <ActionBar onRegenerate={handleRegenerate} isRegenerating={isRegenerating} onOpenAiConfig={onOpenAiConfig} />,
        actionBarEl
      )}
    </div>
  );
}

function ActionBar({
  onRegenerate,
  isRegenerating,
  onOpenAiConfig,
}: {
  onRegenerate: () => void;
  isRegenerating: boolean;
  onOpenAiConfig: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
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
