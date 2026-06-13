"use client";

/**
 * InterviewsShell — Interview Intelligence UI (signal-accuracy report, Part F).
 *
 * Flow: paste transcript → run Analyst (Mom Test discipline per interview) →
 * run Synthesizer (themes + contradictions across all interviews) → feed the
 * Signals decision panel.
 *
 * Evidence grade: strong / weak / anti_signal (anti-signal subtracts from score).
 * Mom Test: past behavior quotes = evidence; hypothetical praise = flagged/down-weighted.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MktInterview, MktInterviewSource } from "@/types/marketing";
import {
  saveInterview,
  deleteInterview,
  analyzeInterview,
  synthesizeInterviews,
} from "../actions";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import {
  AddIcon,
  DeleteIcon,
  SparkleIcon,
  UserIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  AlertIcon,
  CheckIcon,
  BookIcon,
} from "@/components/ui/icons";

// ── Constants ──────────────────────────────────────────────────────────────────

const SOURCE_LABELS: Record<MktInterviewSource, string> = {
  outreach: "Via outreach",
  network: "Network",
  panel: "Paid panel",
  inbound: "Inbound",
  booking: "Booked call",
};

const GRADE_STYLE: Record<string, string> = {
  strong:
    "text-[color:var(--success-strong)] bg-[color:var(--success-strong)]/10 border-[color:var(--success-strong)]/30",
  weak: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  anti_signal: "text-red-400 bg-red-400/10 border-red-400/30",
};

const GRADE_LABEL: Record<string, string> = {
  strong: "Strong evidence",
  weak: "Weak evidence",
  anti_signal: "Anti-signal",
};

const inputCls =
  "w-full px-3 py-2 bg-elevated border border-border rounded-md text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent";

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Safely extract a string array from an unknown value; returns object members as strings. */
function asStrings(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((item): string =>
      typeof item === "string"
        ? item
        : String((item as Record<string, unknown>)?.quote ?? JSON.stringify(item))
    )
    .filter((x) => x.length > 0);
}

/** Safely extract an array of objects from an unknown value. */
function asObjects(v: unknown): Record<string, unknown>[] {
  if (!Array.isArray(v)) return [];
  return v.filter((item) => typeof item === "object" && item !== null) as Record<
    string,
    unknown
  >[];
}

/** Safely coerce an unknown value to string for JSX rendering. */
function str(v: unknown, fallback = ""): string {
  if (v == null) return fallback;
  return String(v) || fallback;
}

// ── Root component ─────────────────────────────────────────────────────────────

export default function InterviewsShell({
  ideaId,
  initialInterviews,
  initialSynthesis,
  bookingUrl,
}: {
  ideaId: string;
  initialInterviews: MktInterview[];
  initialSynthesis: Record<string, unknown> | null;
  bookingUrl: string | null;
}) {
  const router = useRouter();
  const [synthPending, setSynthPending] = useState(false);
  const [synthError, setSynthError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(initialInterviews.length === 0);

  const analyzedCount = initialInterviews.filter((iv) => iv.analyzed_at).length;

  async function runSynthesis() {
    setSynthError(null);
    setSynthPending(true);
    const r = await synthesizeInterviews(ideaId);
    setSynthPending(false);
    if (r.error) {
      setSynthError(r.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* ── Booking URL hint ─────────────────────────────────────── */}
      {bookingUrl && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-elevated px-4 py-2.5">
          <p className="flex-1 text-xs text-text-muted">
            <span className="font-semibold text-text-secondary">Booking link:</span>{" "}
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline font-mono break-all"
            >
              {bookingUrl}
            </a>
          </p>
          <span className="text-[10px] text-text-muted shrink-0">
            Used in outreach + post-capture CTA
          </span>
        </div>
      )}

      {/* ── Synthesis panel ──────────────────────────────────────── */}
      <section className="card space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-heading-3 text-text-primary">Cross-interview synthesis</h2>
            <p className="text-xs text-text-muted mt-0.5">
              Aggregates themes, contradictions, and segment contrasts across all analyzed
              interviews. Re-run after each new interview.
            </p>
          </div>
          <button
            onClick={runSynthesis}
            disabled={synthPending || analyzedCount === 0}
            className="btn btn-secondary btn-sm shrink-0"
          >
            <SparkleIcon className="w-3.5 h-3.5" strokeWidth={2} />
            {synthPending ? "Synthesizing…" : "Run synthesis"}
          </button>
        </div>

        {synthError && <p className="text-sm text-red-400">{synthError}</p>}

        {initialSynthesis ? (
          <SynthesisPanel synthesis={initialSynthesis} />
        ) : (
          <p className="text-sm text-text-muted italic">
            {analyzedCount === 0
              ? "Analyze at least one interview to enable synthesis."
              : "No synthesis yet — click 'Run synthesis' above."}
          </p>
        )}
      </section>

      {/* ── Interview list header ─────────────────────────────────── */}
      <section className="card space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-heading-3 text-text-primary">Interviews</h2>
            <p className="text-xs text-text-muted mt-0.5">
              Paste transcripts from Meet, Zoom, Fireflies, or tl;dv. The Analyst applies Mom
              Test discipline — only past behavior counts as evidence.
            </p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="btn btn-secondary btn-sm shrink-0"
          >
            <AddIcon className="w-3.5 h-3.5" strokeWidth={2} /> Add interview
          </button>
        </div>

        {showForm && (
          <AddInterviewForm
            ideaId={ideaId}
            onDone={() => {
              setShowForm(false);
              router.refresh();
            }}
            onCancel={() => setShowForm(false)}
          />
        )}
      </section>

      {/* ── Interview cards ───────────────────────────────────────── */}
      {initialInterviews.length === 0 && !showForm ? (
        <EmptyState
          icon={<BookIcon />}
          title="No interviews yet"
          body="Add your first customer interview transcript to begin Mom Test analysis."
        />
      ) : (
        initialInterviews.map((iv) => (
          <InterviewCard key={iv.id} ideaId={ideaId} interview={iv} />
        ))
      )}
    </div>
  );
}

// ── Add interview form ─────────────────────────────────────────────────────────

function AddInterviewForm({
  ideaId,
  onDone,
  onCancel,
}: {
  ideaId: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [isPending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [segment, setSegment] = useState("");
  const [source, setSource] = useState<MktInterviewSource>("network");
  const [date, setDate] = useState("");
  const [consent, setConsent] = useState(false);
  const [transcript, setTranscript] = useState("");

  function submit() {
    setError(null);
    start(async () => {
      const r = await saveInterview(ideaId, {
        participant_name: name,
        participant_role: role,
        segment,
        source,
        conducted_at: date || null,
        consent,
        transcript,
      });
      if (r.error) {
        setError(r.error);
        return;
      }
      onDone();
    });
  }

  return (
    <div className="rounded-lg border border-border bg-elevated p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputCls}
          placeholder="Participant name (optional)"
        />
        <input
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className={inputCls}
          placeholder="Role / job title (optional)"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          value={segment}
          onChange={(e) => setSegment(e.target.value)}
          className={inputCls}
          placeholder="Segment tag (e.g. SMB founder)"
        />
        <select
          value={source}
          onChange={(e) => setSource(e.target.value as MktInterviewSource)}
          className={inputCls}
        >
          {(Object.keys(SOURCE_LABELS) as MktInterviewSource[]).map((s) => (
            <option key={s} value={s}>
              {SOURCE_LABELS[s]}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={inputCls}
          title="Date conducted"
        />
      </div>
      <textarea
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        rows={8}
        className={inputCls + " resize-y font-mono text-xs leading-relaxed"}
        placeholder="Paste the full interview transcript here. Include speaker labels if available (e.g. 'Interviewer: … Participant: …'). Supports Meet/Zoom transcripts, Fireflies/tl;dv exports."
      />
      <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="accent-accent"
        />
        Participant consented to recording / transcript use
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="btn btn-tertiary btn-sm">
          Cancel
        </button>
        <Button onClick={submit} loading={isPending} disabled={!transcript.trim()}>
          Save interview
        </Button>
      </div>
    </div>
  );
}

// ── Interview card ─────────────────────────────────────────────────────────────

function InterviewCard({
  ideaId,
  interview: iv,
}: {
  ideaId: string;
  interview: MktInterview;
}) {
  const router = useRouter();
  const [isPending, start] = useTransition();
  const [aiPending, setAiPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(!!iv.analyzed_at);

  const grade = str(iv.analysis?.evidence_grade);
  const gradeStyle =
    GRADE_STYLE[grade] ?? "text-text-muted bg-muted border-border";
  const gradeLabel = GRADE_LABEL[grade] ?? "Not analyzed";

  async function analyze() {
    setError(null);
    setAiPending(true);
    const r = await analyzeInterview(ideaId, iv.id);
    setAiPending(false);
    if (r.error) {
      setError(r.error);
      return;
    }
    setShowAnalysis(true);
    router.refresh();
  }

  function remove() {
    if (!confirm("Delete this interview? This cannot be undone.")) return;
    start(async () => {
      await deleteInterview(ideaId, iv.id);
      router.refresh();
    });
  }

  return (
    <section className="card space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <UserIcon className="w-4 h-4 text-text-muted" strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary leading-tight">
              {iv.participant_name || "Anonymous"}
            </p>
            <p className="text-xs text-text-muted mt-0.5 flex flex-wrap gap-x-2">
              {iv.participant_role && <span>{iv.participant_role}</span>}
              {iv.segment && <span className="text-accent">#{iv.segment}</span>}
              <span>{SOURCE_LABELS[iv.source]}</span>
              {iv.conducted_at && (
                <span>{new Date(iv.conducted_at).toLocaleDateString()}</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {grade && (
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded border ${gradeStyle}`}
            >
              {gradeLabel}
            </span>
          )}
          <button
            onClick={analyze}
            disabled={aiPending || isPending || !iv.transcript?.trim()}
            title={
              !iv.transcript?.trim()
                ? "Add a transcript first"
                : iv.analyzed_at
                ? "Re-analyze"
                : "Analyze"
            }
            className="btn btn-secondary btn-sm"
          >
            <SparkleIcon className="w-3.5 h-3.5" strokeWidth={2} />
            {aiPending ? "Analyzing…" : iv.analyzed_at ? "Re-analyze" : "Analyze"}
          </button>
          <button
            onClick={remove}
            disabled={isPending}
            aria-label="Delete interview"
            className="p-1.5 text-text-muted hover:text-red-400 rounded transition-colors"
          >
            <DeleteIcon className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* Transcript toggle */}
      {iv.transcript ? (
        <div>
          <button
            onClick={() => setShowTranscript((v) => !v)}
            className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            {showTranscript ? (
              <ChevronDownIcon className="w-3.5 h-3.5" strokeWidth={2} />
            ) : (
              <ChevronRightIcon className="w-3.5 h-3.5" strokeWidth={2} />
            )}
            {showTranscript ? "Hide transcript" : "View transcript"}
            <span className="ml-1 text-text-muted/60">
              ({iv.transcript.length.toLocaleString()} chars)
            </span>
          </button>
          {showTranscript && (
            <pre className="mt-2 max-h-64 overflow-y-auto rounded-lg bg-elevated border border-border p-3 text-xs text-text-secondary font-mono leading-relaxed whitespace-pre-wrap">
              {iv.transcript}
            </pre>
          )}
        </div>
      ) : (
        <p className="text-xs text-amber-400 italic">
          No transcript yet — paste one and analyze.
        </p>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* Analysis */}
      {iv.analyzed_at && Object.keys(iv.analysis ?? {}).length > 0 && (
        <div>
          <button
            onClick={() => setShowAnalysis((v) => !v)}
            className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-colors mb-3"
          >
            {showAnalysis ? (
              <ChevronDownIcon className="w-3.5 h-3.5" strokeWidth={2} />
            ) : (
              <ChevronRightIcon className="w-3.5 h-3.5" strokeWidth={2} />
            )}
            {showAnalysis ? "Hide analysis" : "Show analysis"}
            <span className="ml-1 text-text-muted/60">
              analyzed {new Date(iv.analyzed_at).toLocaleDateString()}
            </span>
          </button>

          {showAnalysis && <AnalysisPanel analysis={iv.analysis} />}
        </div>
      )}
    </section>
  );
}

// ── Analysis panel ─────────────────────────────────────────────────────────────

function AnalysisPanel({ analysis: a }: { analysis: Record<string, unknown> }) {
  const pains = asObjects(a.pains);
  const pastBehaviors = asObjects(a.past_behaviors);
  const hypothetical = asObjects(a.hypothetical_praise);
  const commitments = asObjects(a.commitment_signals);
  const objections = asObjects(a.objections);
  const summary = str(a.summary);
  const icp = a.icp_fit as Record<string, unknown> | null | undefined;

  return (
    <div className="space-y-4 border-t border-border pt-4">
      {/* Summary */}
      {summary && (
        <p className="text-sm text-text-secondary italic leading-relaxed">
          &ldquo;{summary}&rdquo;
        </p>
      )}

      {/* ICP fit */}
      {icp && (
        <div className="flex items-start gap-2">
          <span className="text-[10px] uppercase tracking-wide text-text-muted font-semibold shrink-0 mt-0.5 w-20">
            ICP Fit
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
              str(icp.score).includes("high")
                ? GRADE_STYLE.strong
                : str(icp.score).includes("no")
                ? GRADE_STYLE.anti_signal
                : GRADE_STYLE.weak
            }`}
          >
            {str(icp.score, "unknown")}
          </span>
          {icp.reasoning ? (
            <span className="text-xs text-text-muted">{str(icp.reasoning)}</span>
          ) : null}
        </div>
      )}

      {/* Pains */}
      {pains.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wide text-text-muted font-semibold mb-2">
            Pains
          </p>
          <div className="space-y-2">
            {pains.map((p, i) => (
              <div key={i} className="rounded-lg bg-elevated border border-border p-2.5">
                <div className="flex items-start gap-2">
                  {p.severity ? (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
                        str(p.severity) === "high"
                          ? "bg-red-500/10 text-red-400"
                          : str(p.severity) === "medium"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-muted text-text-muted"
                      }`}
                    >
                      {str(p.severity)}
                    </span>
                  ) : null}
                  <p className="text-xs text-text-primary">
                    {str(p.pain ?? p.description)}
                  </p>
                </div>
                {p.quote ? (
                  <p className="mt-1.5 text-[11px] text-text-muted italic pl-2 border-l border-border">
                    &ldquo;{str(p.quote)}&rdquo;
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mom Test: past behavior (evidence) */}
      {pastBehaviors.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <CheckIcon
              className="w-3 h-3 text-[color:var(--success-strong)]"
              strokeWidth={2.5}
            />
            <p className="text-[10px] uppercase tracking-wide text-[color:var(--success-strong)] font-semibold">
              Past behavior — counts as evidence
            </p>
          </div>
          <div className="space-y-1.5">
            {pastBehaviors.map((b, i) => (
              <div
                key={i}
                className="text-[11px] text-text-secondary italic pl-2 border-l-2 border-[color:var(--success-strong)]/40"
              >
                &ldquo;{str(b.quote ?? b.behavior)}&rdquo;
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mom Test: hypothetical praise (flagged) */}
      {hypothetical.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <AlertIcon className="w-3 h-3 text-amber-400" strokeWidth={2.5} />
            <p className="text-[10px] uppercase tracking-wide text-amber-400 font-semibold">
              Hypothetical praise — flagged, not counted
            </p>
          </div>
          <div className="space-y-1.5">
            {hypothetical.map((h, i) => (
              <div
                key={i}
                className="text-[11px] text-text-muted italic pl-2 border-l-2 border-amber-400/30"
              >
                &ldquo;{str(h.quote ?? h.statement)}&rdquo;
                {h.why_flagged ? (
                  <span className="ml-1 not-italic text-amber-400/70">
                    ({str(h.why_flagged)})
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Commitment signals */}
      {commitments.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wide text-text-muted font-semibold mb-1.5">
            Commitment signals
          </p>
          <ul className="space-y-1">
            {commitments.map((c, i) => (
              <li key={i} className="text-xs text-text-secondary flex gap-2">
                <span className="text-[color:var(--success-strong)] shrink-0 mt-0.5">✓</span>
                <span>
                  {str(c.signal ?? c.description)}
                  {c.quote && c.signal ? (
                    <span className="text-text-muted italic">
                      {" "}
                      — &ldquo;{str(c.quote)}&rdquo;
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Objections */}
      {objections.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wide text-text-muted font-semibold mb-1.5">
            Objections / dealbreakers
          </p>
          <ul className="space-y-1.5">
            {objections.map((o, i) => (
              <li key={i} className="text-xs text-text-secondary">
                <span className="text-red-400">✗ </span>
                {str(o.objection ?? o.dealbreaker ?? o.quote)}
                {o.quote && (o.objection || o.dealbreaker) ? (
                  <span className="text-text-muted italic">
                    {" "}
                    — &ldquo;{str(o.quote)}&rdquo;
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Synthesis panel ────────────────────────────────────────────────────────────

function SynthesisPanel({ synthesis: s }: { synthesis: Record<string, unknown> }) {
  const themes = asObjects(s.themes);
  const contradictions = asObjects(s.contradictions);
  const pivotIndicators = asObjects(s.pivot_indicators);
  const segmentContrast = asObjects(s.segment_contrast);
  const saturation = s.saturation as Record<string, unknown> | null | undefined;
  const summary = str(s.summary);
  const recommendation = str(s.recommendation);

  return (
    <div className="space-y-4">
      {summary && (
        <p className="text-sm text-text-secondary leading-relaxed">{summary}</p>
      )}

      {/* Saturation indicator */}
      {saturation ? (
        <div
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
            saturation.saturated
              ? "border-[color:var(--success-strong)]/30 bg-[color:var(--success-strong)]/5 text-[color:var(--success-strong)]"
              : "border-amber-400/30 bg-amber-400/5 text-amber-400"
          }`}
        >
          {saturation.saturated
            ? `✓ Theme saturation reached — enough interviews.${saturation.note ? " " + str(saturation.note) : ""}`
            : `Still discovering themes (${str(saturation.new_themes_count, "?")} new in last 3). Keep interviewing.${saturation.note ? " " + str(saturation.note) : ""}`}
        </div>
      ) : null}

      {/* Themes */}
      {themes.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wide text-text-muted font-semibold mb-2">
            Recurring themes
          </p>
          <div className="space-y-2">
            {themes.map((t, i) => (
              <div
                key={i}
                className="rounded-lg bg-elevated border border-border p-2.5"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-text-primary">
                    {str(t.theme)}
                  </span>
                  {t.count != null ? (
                    <span className="text-[10px] text-text-muted bg-muted px-1.5 py-0.5 rounded">
                      {str(t.count)}× mentioned
                    </span>
                  ) : null}
                </div>
                {asStrings(t.supporting_quotes)
                  .slice(0, 2)
                  .map((q, j) => (
                    <p
                      key={j}
                      className="text-[11px] text-text-muted italic border-l border-border pl-2 mt-1"
                    >
                      &ldquo;{q}&rdquo;
                    </p>
                  ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pivot indicators */}
      {pivotIndicators.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wide text-amber-400 font-semibold mb-2">
            Pivot indicators
          </p>
          <ul className="space-y-1.5">
            {pivotIndicators.map((p, i) => (
              <li key={i} className="text-xs text-text-secondary flex gap-2">
                {p.type ? (
                  <span className="shrink-0 uppercase text-[9px] tracking-wide bg-amber-400/10 text-amber-400 px-1.5 py-0.5 rounded font-medium">
                    {str(p.type).replace("_", " ")}
                  </span>
                ) : null}
                {str(p.evidence)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Segment contrast */}
      {segmentContrast.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wide text-text-muted font-semibold mb-2">
            Segment contrast
          </p>
          <div className="space-y-1.5">
            {segmentContrast.map((sc, i) => (
              <div key={i} className="text-xs text-text-secondary">
                {sc.segment ? (
                  <span className="font-semibold text-accent mr-1">
                    #{str(sc.segment)}
                  </span>
                ) : null}
                {str(sc.insight)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contradictions */}
      {contradictions.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wide text-red-400/80 font-semibold mb-2">
            Contradictions vs positioning
          </p>
          <ul className="space-y-1.5">
            {contradictions.map((c, i) => (
              <li key={i} className="text-xs text-red-400/80 flex gap-2">
                <span className="shrink-0">!</span>
                {str(c.contradiction ?? c.detail)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* AI recommendation */}
      {recommendation && (
        <div className="rounded-lg border border-accent/30 bg-accent/5 p-3">
          <p className="text-[10px] uppercase tracking-wide text-accent font-semibold mb-1">
            Recommendation
          </p>
          <p className="text-sm text-text-secondary">{recommendation}</p>
        </div>
      )}
    </div>
  );
}
