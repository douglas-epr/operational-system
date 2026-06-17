/**
 * Step 11 — Report.
 * Final readiness dashboard: donut score, 6-area weighted summary, automatic
 * penalties, threshold guide, and a Live Preview opening the full Playbook.
 */
"use client";

import { useState } from "react";
import type { IdeaFull, IdeaReportArea, IdeaReportPenalty, IdeaReportAlignment, IdeaReportDebateTurn } from "@/types/idea-refiner";
import { triggerAiGeneration } from "../actions";
import { cn } from "@/lib/utils";
import AiLoadingOverlay from "./AiLoadingOverlay";
import ReportPreviewModal from "./ReportPreviewModal";
import { useRegenerate } from "../_hooks/useRegenerate";
import { createPortal } from "react-dom";
import { useStepActions } from "../_context/StepActionsContext";

interface ReportStepProps {
  ideaFull: IdeaFull;
}

const STATUS_LABEL: Record<IdeaReportArea["status"], string> = {
  strong: "STRONG",
  average: "AVERAGE",
  weak: "WEAK",
};

function statusPill(status: IdeaReportArea["status"]) {
  const base = "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide";
  if (status === "strong") return `${base} bg-green-500/15 text-green-400 border border-green-500/30`;
  if (status === "weak") return `${base} bg-red-500/15 text-red-400 border border-red-500/30`;
  return `${base} bg-amber-500/15 text-amber-400 border border-amber-500/30`;
}

function Donut({ score, color }: { score: number; color: string }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const dash = (pct / 100) * c;
  return (
    <svg viewBox="0 0 120 120" className="w-32 h-32">
      <circle cx="60" cy="60" r={r} fill="none" stroke="#2a2a2a" strokeWidth="10" />
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c - dash}`}
        transform="rotate(-90 60 60)"
      />
      <text
        x="60"
        y="58"
        textAnchor="middle"
        fill="currentColor"
        fontSize="26"
        fontWeight="700"
      >
        {pct}
      </text>
      <text x="60" y="78" textAnchor="middle" fill="#9ca3af" fontSize="11">
        / 100
      </text>
    </svg>
  );
}

export default function ReportStep({ ideaFull }: ReportStepProps) {
  const { idea, report } = ideaFull;
  const isAiWorking = idea.current_blocks_updating === "report";

  const { isRegenerating, error, setError, triggerRegenerate } = useRegenerate(idea.id, "report", isAiWorking);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDebateOpen, setIsDebateOpen] = useState(false);

  const { actionBarEl, onOpenAiConfig } = useStepActions();

  function handleRegenerate() {
    return triggerRegenerate(() => triggerAiGeneration(idea.id, "report"));
  }

  if (isAiWorking || isRegenerating) {
    return <AiLoadingOverlay ideaId={idea.id} step="report" />;
  }

  const score = report?.final_score ?? 0;
  // Typed as string so legacy buckets ("ready"/"risk") on older reports still map.
  // "build"/"refine"/"kill" are the current buckets; "ready"/"risk" are legacy
  // values kept readable so older reports still render correctly.
  const threshold: string | null = report?.threshold_bucket ?? null;
  const thresholdLabel =
    threshold === "build" || threshold === "ready"
      ? "Build"
      : threshold === "refine"
      ? "Needs Refinement"
      : threshold === "kill" || threshold === "risk"
      ? "Kill — Don't Build"
      : "Pending";
  const thresholdColor =
    threshold === "build" || threshold === "ready"
      ? "#22c55e"
      : threshold === "refine"
      ? "#f59e0b"
      : threshold === "kill" || threshold === "risk"
      ? "#ef4444"
      : "#6b7280";

  const areas: IdeaReportArea[] = report?.area_scores ?? [];
  const penalties: IdeaReportPenalty[] = report?.penalties ?? [];
  const penaltyTotal = penalties.reduce((s, p) => s + Math.abs(p.points), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary">Go / No-Go Report</h2>
        <p className="text-sm text-text-secondary">
          A Devil&apos;s Advocate verdict on whether to build, refine, or kill this idea — before any build work.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      {!report ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-text-secondary">
          No verdict generated yet. Click <span className="font-medium">Regenerate</span> to score
          this idea from the discovery steps.
        </div>
      ) : (
        <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT — 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header card */}
            <div className="rounded-xl border border-border bg-surface p-6">
              <div className="flex items-start gap-6">
                <div className="text-text-primary">
                  <Donut score={score} color={thresholdColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold mb-2"
                    style={{
                      color: thresholdColor,
                      background: `${thresholdColor}22`,
                      border: `1px solid ${thresholdColor}66`,
                    }}
                  >
                    {thresholdLabel}
                  </div>
                  {report.headline ? (
                    <h2 className="text-2xl font-semibold text-text-primary leading-snug">
                      {report.headline}
                    </h2>
                  ) : (
                    <h2 className="text-2xl font-semibold text-text-secondary/50 italic">
                      Headline pending
                    </h2>
                  )}
                  {report.summary && (
                    <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                      {report.summary}
                    </p>
                  )}
                  {/* Score math formula */}
                  {report.completeness_score != null && report.alignment != null && (
                    <div className="mt-3 pt-3 border-t border-border text-[11px] text-text-secondary font-mono">
                      Completeness <span className="text-text-primary font-semibold">{report.completeness_score}</span>
                      {" × 75% + Alignment "}
                      <span className="text-text-primary font-semibold">{report.alignment.alignment_score}</span>
                      {" × 25% − "}
                      <span className="text-red-400 font-semibold">{penaltyTotal}</span>
                      {" penalties = "}
                      <span className="font-semibold" style={{ color: thresholdColor }}>{score}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Weighted Score Summary */}
            <div className="rounded-xl border border-border bg-surface">
              <div className="px-6 py-4 border-b border-border flex items-center gap-2">
                <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19a3 3 0 11-6 0 3 3 0 016 0zm12-3a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 className="text-sm font-semibold text-text-primary">Weighted Score Summary</h3>
              </div>
              <ul className="divide-y divide-border">
                {areas.map((a) => (
                  <li key={a.key} className="px-6 py-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary truncate">{a.label}</span>
                        <span className={statusPill(a.status)}>{STATUS_LABEL[a.status]}</span>
                      </div>
                      <div className="mt-0.5 text-[11px] uppercase tracking-wide text-text-secondary">
                        Weight: {a.weight_pct}% · {a.weighted_points} pts
                      </div>
                      {a.description && (
                        <div className="mt-1 text-xs text-text-secondary">{a.description}</div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-2xl font-semibold text-text-primary">{a.raw_score_pct}</div>
                      <div className="text-[10px] text-text-secondary">/ 100 raw</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Penalties — hidden when no penalty points were triggered */}
            {penaltyTotal > 0 && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/5">
                <div className="px-6 py-4 border-b border-red-500/30 flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M4.93 19h14.14c1.54 0 2.5-1.67 1.73-3L13.73 5a2 2 0 00-3.46 0L3.2 16c-.77 1.33.19 3 1.73 3z" />
                  </svg>
                  <h3 className="text-sm font-semibold text-text-primary">
                    Automatic Penalties Applied
                  </h3>
                </div>
                <ul className="divide-y divide-red-500/20">
                  {penalties.filter((p) => p.points !== 0).map((p, i) => (
                    <li key={i} className="px-6 py-3 flex items-center justify-between">
                      <span className="text-sm text-text-primary">{p.label}</span>
                      <span className="text-sm font-semibold text-red-400">{p.points} pts</span>
                    </li>
                  ))}
                </ul>
                <div className="px-6 py-3 text-[11px] text-text-secondary border-t border-red-500/20">
                  Penalties are derived automatically from the content of prior steps. Addressing the
                  root cause in the relevant step will remove the deduction on the next regeneration.
                </div>
              </div>
            )}

            {/* Debate transcript (collapsible) */}
            {report.debate_transcript && report.debate_transcript.length > 0 && (
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
                    {report.debate_meta && (
                      <span className="text-[10px] text-text-muted">
                        ({report.debate_meta.problem_rounds}p + {report.debate_meta.solution_rounds}s rounds
                        {report.debate_meta.problem_converged && report.debate_meta.solution_converged ? " · converged" : " · impasse"})
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
                    {report.debate_meta?.impasse_note && (
                      <div className="px-6 py-3 text-xs text-amber-400 bg-amber-500/5">
                        {report.debate_meta.impasse_note}
                      </div>
                    )}
                    {(["problem", "solution"] as const).map((gate) => {
                      const gateTurns = report.debate_transcript!.filter((t: IdeaReportDebateTurn) => t.gate === gate);
                      if (!gateTurns.length) return null;
                      return (
                        <div key={gate}>
                          <div className="px-6 py-2 bg-muted/40 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                            Gate {gate === "problem" ? "1 — Right Problem" : "2 — Right Solution"}
                          </div>
                          {gateTurns.map((turn: IdeaReportDebateTurn, i: number) => (
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

          </div>

          {/* RIGHT — 1/3 */}
          <div className="space-y-6">
            {/* Go/No-Go Evaluation (full playbook preview) */}
            <div className="rounded-xl border border-border bg-surface">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-primary">Go/No-Go Evaluation</h3>
                <button
                  onClick={() => setIsPreviewOpen(true)}
                  className="text-xs px-3 py-1.5 rounded-md bg-accent text-white hover:bg-accent/90"
                >
                  Live Preview
                </button>
              </div>
              <div className="px-6 py-4 text-sm text-text-secondary">
                <div className="text-text-primary font-medium">
                  {report.playbook_title ?? "Product Strategy Playbook"}
                </div>
                {report.playbook_subtitle && (
                  <div className="mt-0.5 text-xs">{report.playbook_subtitle}</div>
                )}
                <p className="mt-2">
                  Opens a paginated document with the full go/no-go case for
                  download as PDF or DOCX.
                </p>
                {report.next_steps && (
                  <div
                    className="mt-3 text-xs text-text-secondary border-t border-border pt-3 [&_button]:hidden [&_a.btn]:hidden [&_a[role=button]]:hidden [&_ul]:hidden [&_ol]:hidden"
                    dangerouslySetInnerHTML={{ __html: report.next_steps }}
                  />
                )}
              </div>
            </div>

            {/* Verdict Guide */}
            <div className="rounded-xl border border-border bg-surface p-6">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Verdict Guide</h3>
              <ul className="space-y-2 text-xs">
                <li className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full" style={{ background: "#22c55e" }} />
                    Build
                  </span>
                  <span className="text-text-secondary">≥ 75</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full" style={{ background: "#f59e0b" }} />
                    Refine
                  </span>
                  <span className="text-text-secondary">60 – 74</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full" style={{ background: "#ef4444" }} />
                    Kill — Don&apos;t Build
                  </span>
                  <span className="text-text-secondary">&lt; 60</span>
                </li>
              </ul>
            </div>

            {/* Agreed framing (3 cards) */}
            {(report.agreed_problem || report.agreed_solution || report.recommendation) && (
              <div className="rounded-xl border border-border bg-surface divide-y divide-border">
                <div className="px-6 py-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  <h3 className="text-sm font-semibold text-text-primary">Debate Consensus</h3>
                </div>
                {report.agreed_problem && (
                  <div className="px-6 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1">Agreed Problem (Bottleneck)</p>
                    <p className="text-sm text-text-primary">{report.agreed_problem}</p>
                  </div>
                )}
                {report.agreed_solution && (
                  <div className="px-6 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1">Agreed Solution</p>
                    <p className="text-sm text-text-primary">{report.agreed_solution}</p>
                  </div>
                )}
                {report.recommendation && (
                  <div className="px-6 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1">Recommendation</p>
                    <p className="text-sm text-text-secondary">{report.recommendation}</p>
                  </div>
                )}
              </div>
            )}

            {/* Alignment block */}
            {report.alignment && (
              <AlignmentBlock alignment={report.alignment} />
            )}
          </div>
        </div>

        {/* Revised Idea Description — full width */}
        {report.revised_description && (
          <div className="rounded-xl border border-accent/30 bg-accent/5">
            <div className="px-6 py-4 border-b border-accent/20 flex items-center gap-2">
              <svg className="w-5 h-5 text-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <h3 className="text-sm font-semibold text-text-primary">Revised Idea Description</h3>
              <span className="text-xs text-text-muted ml-1">— copy to create a new refined idea</span>
            </div>
            <div
              className="px-6 py-5 prose prose-sm prose-invert max-w-none [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:text-text-primary [&_h2]:mt-4 [&_h2]:mb-1 [&_p]:text-text-secondary [&_p]:leading-relaxed"
              dangerouslySetInnerHTML={{ __html: report.revised_description }}
            />
          </div>
        )}
        </div>
      )}

      <ReportPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        ideaName={idea.name}
        report={report}
      />

      {actionBarEl && createPortal(
        <div className="flex items-center gap-2">
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isRegenerating ? "Regenerating..." : "Regenerate"}
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

function AlignmentBlock({ alignment }: { alignment: IdeaReportAlignment }) {
  const distancePill = {
    minor: "bg-green-500/15 text-green-400 border-green-500/30",
    moderate: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    major: "bg-red-500/15 text-red-400 border-red-500/30",
  }[alignment.reframe_distance];

  function Bar({ label, value }: { label: string; value: number }) {
    const color = value >= 70 ? "#22c55e" : value >= 40 ? "#f59e0b" : "#ef4444";
    return (
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-text-secondary">{label}</span>
          <span className="text-xs font-semibold text-text-primary">{value}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Alignment to Correct Framing</h3>
        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border", distancePill)}>
          {alignment.reframe_distance} reframe
        </span>
      </div>
      <div className="space-y-3">
        <Bar label="Problem fit" value={alignment.problem_fit_pct} />
        <Bar label="Solution fit" value={alignment.solution_fit_pct} />
      </div>
      <div className="pt-1 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-text-secondary">Alignment score</span>
          <span className="text-sm font-bold text-text-primary">{alignment.alignment_score}</span>
        </div>
        <p className="text-xs text-text-muted italic">{alignment.verdict}</p>
      </div>
      {(alignment.problem_rationale || alignment.solution_rationale) && (
        <div className="pt-1 border-t border-border space-y-1.5">
          {alignment.problem_rationale && (
            <p className="text-xs text-text-secondary"><span className="font-medium text-text-primary">Problem: </span>{alignment.problem_rationale}</p>
          )}
          {alignment.solution_rationale && (
            <p className="text-xs text-text-secondary"><span className="font-medium text-text-primary">Solution: </span>{alignment.solution_rationale}</p>
          )}
        </div>
      )}
    </div>
  );
}
