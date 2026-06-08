/**
 * Step 11 — Report.
 * Final readiness dashboard: donut score, 6-area weighted summary, automatic
 * penalties, threshold guide, and a Live Preview opening the full Playbook.
 */
"use client";

import { useState, useEffect } from "react";
import type { IdeaFull, IdeaReportArea, IdeaReportPenalty } from "@/types/idea-refiner";
import { saveReport, triggerAiGeneration } from "../actions";
import { cn } from "@/lib/utils";
import AiLoadingOverlay from "./AiLoadingOverlay";
import ReportPreviewModal from "./ReportPreviewModal";
import { useAutoTriggerAi, clearAutoTriggerGuard } from "../_hooks/useAutoTriggerAi";
import { runAiWithTimeout } from "../_hooks/useAiWithTimeout";

interface ReportStepProps {
  ideaFull: IdeaFull;
}

// Uniform CTA button classes — keeps all four Next-Steps buttons visually identical.
const CTA_BASE =
  "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors";
const CTA_PRIMARY = `${CTA_BASE} bg-accent text-white hover:bg-accent/90`;
const CTA_SECONDARY = `${CTA_BASE} bg-accent/15 text-accent hover:bg-accent/25`;
const CTA_OUTLINE = `${CTA_BASE} border border-border bg-transparent text-text-primary hover:bg-white/5`;
const CTA_PRIMARY_DISABLED = `${CTA_BASE} bg-accent/60 text-white/80 cursor-not-allowed`;

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

  const [headline, setHeadline] = useState(report?.headline ?? "");
  const [summary, setSummary] = useState(report?.summary ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    setHeadline(report?.headline ?? "");
    setSummary(report?.summary ?? "");
  }, [report?.headline, report?.summary]);

  const isEmpty = report?.final_score == null;
  useAutoTriggerAi(idea.id, "report", isEmpty, isAiWorking);

  async function handleRegenerate() {
    setIsRegenerating(true);
    setError(null);
    clearAutoTriggerGuard(idea.id, "report");
    const result = await runAiWithTimeout(() => triggerAiGeneration(idea.id, "report"));
    setIsRegenerating(false);
    if (result.error) setError(result.error);
  }

  async function handleSaveHeader() {
    setIsSaving(true);
    setError(null);
    const res = await saveReport(idea.id, { headline: headline.trim(), summary: summary.trim() });
    setIsSaving(false);
    if (res.error) setError(res.error);
  }

  if (isAiWorking || isRegenerating) {
    return <AiLoadingOverlay ideaId={idea.id} step="report" />;
  }

  const score = report?.final_score ?? 0;
  const threshold = report?.threshold_bucket ?? null;
  const thresholdLabel =
    threshold === "ready"
      ? "Ready for Sandbox"
      : threshold === "refine"
      ? "Needs Refinement"
      : threshold === "risk"
      ? "High Risk"
      : "Pending";
  const thresholdColor =
    threshold === "ready"
      ? "#22c55e"
      : threshold === "refine"
      ? "#f59e0b"
      : threshold === "risk"
      ? "#ef4444"
      : "#6b7280";

  const areas: IdeaReportArea[] = report?.area_scores ?? [];
  const penalties: IdeaReportPenalty[] = report?.penalties ?? [];

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Readiness Report</h2>
          <p className="text-sm text-text-secondary">
            Final weighted score, automatic penalties, and your downloadable playbook.
          </p>
        </div>
        <button
          onClick={handleRegenerate}
          disabled={isRegenerating || isSaving}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium",
            "bg-accent text-white hover:bg-accent/90 transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Regenerate
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      {!report ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-text-secondary">
          No report generated yet. Click <span className="font-medium">Regenerate</span> to build
          one from all prior steps.
        </div>
      ) : (
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
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="Headline verdict"
                    className="w-full bg-transparent border-none text-2xl font-semibold text-text-primary focus:outline-none placeholder:text-text-secondary/60"
                  />
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    rows={3}
                    placeholder="Short summary of the verdict"
                    className="mt-2 w-full bg-transparent border-none text-sm text-text-secondary focus:outline-none resize-none placeholder:text-text-secondary/60"
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={handleSaveHeader}
                      disabled={isSaving}
                      className="text-xs px-3 py-1.5 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                  </div>
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

            {/* Penalties */}
            <div className="rounded-xl border border-red-500/30 bg-red-500/5">
              <div className="px-6 py-4 border-b border-red-500/30 flex items-center gap-2">
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M4.93 19h14.14c1.54 0 2.5-1.67 1.73-3L13.73 5a2 2 0 00-3.46 0L3.2 16c-.77 1.33.19 3 1.73 3z" />
                </svg>
                <h3 className="text-sm font-semibold text-text-primary">
                  Automatic Penalties Applied
                </h3>
              </div>
              {penalties.length === 0 ? (
                <div className="px-6 py-4 text-sm text-text-secondary">No penalties triggered.</div>
              ) : (
                <ul className="divide-y divide-red-500/20">
                  {penalties.map((p, i) => (
                    <li key={i} className="px-6 py-3 flex items-center justify-between">
                      <span className="text-sm text-text-primary">{p.label}</span>
                      <span className="text-sm font-semibold text-red-400">{p.points} pts</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="px-6 py-3 text-[11px] text-text-secondary border-t border-red-500/20">
                Penalties are derived automatically from the content of prior steps. Addressing the
                root cause in the relevant step will remove the deduction on the next regeneration.
              </div>
            </div>

            {/* Playbook preview card */}
            <div className="rounded-xl border border-border bg-surface">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-primary">Blur Studio Playbook</h3>
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
                  Opens a paginated document that ties together every step of the sandbox for
                  download as PDF or DOCX.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT — 1/3 */}
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-surface p-6">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h3 className="text-sm font-semibold text-text-primary">Next Steps</h3>
              </div>
              {report.next_steps ? (
                <div
                  className="text-sm text-text-secondary report-next-steps mb-4 [&_button]:hidden [&_a.btn]:hidden [&_a[role=button]]:hidden [&_ul]:hidden [&_ol]:hidden"
                  dangerouslySetInnerHTML={{ __html: report.next_steps }}
                />
              ) : (
                <p className="text-sm text-text-secondary mb-4">
                  Your playbook is ready. Download it to share with the team, or initiate a sandbox
                  review to take the next step.
                </p>
              )}
              <div className="flex flex-col gap-2">
                <button className={CTA_PRIMARY}>Schedule Follow-Up Meeting</button>
                <button className={CTA_SECONDARY}>Refine Validation Strategy</button>
                <button
                  onClick={() => setIsPreviewOpen(true)}
                  className={CTA_OUTLINE}
                >
                  Download Playbook (PDF)
                </button>
                <button
                  disabled
                  className={CTA_PRIMARY_DISABLED}
                  title="Coming soon"
                >
                  Initiate Sandbox Review
                </button>
              </div>
            </div>

            {/* Threshold Guide */}
            <div className="rounded-xl border border-border bg-surface p-6">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Threshold Guide</h3>
              <ul className="space-y-2 text-xs">
                <li className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full" style={{ background: "#22c55e" }} />
                    Ready for Sandbox
                  </span>
                  <span className="text-text-secondary">≥ 75</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full" style={{ background: "#f59e0b" }} />
                    Needs Refinement
                  </span>
                  <span className="text-text-secondary">60 – 74</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full" style={{ background: "#ef4444" }} />
                    High Risk
                  </span>
                  <span className="text-text-secondary">&lt; 60</span>
                </li>
              </ul>
            </div>

            {/* Founders Program */}
            <div
              className="rounded-xl p-6 text-white"
              style={{
                background:
                  "linear-gradient(135deg, rgba(139,92,246,0.35) 0%, rgba(236,72,153,0.25) 100%)",
                border: "1px solid rgba(139,92,246,0.4)",
              }}
            >
              <h3 className="text-sm font-semibold mb-1">Founders Program</h3>
              <p className="text-xs opacity-90">
                Qualified ideas can be fast-tracked into the Blur Studio Founders Program — ask your
                account manager for details.
              </p>
            </div>
          </div>
        </div>
      )}

      <ReportPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        ideaName={idea.name}
        report={report}
      />
    </div>
  );
}
