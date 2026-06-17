/**
 * /marketing/[ideaId]/signals — captured demand signals, scored as evidence.
 *
 * Beyond the raw table, this page computes the weighted validation score
 * (commitment-graded: preorder ≫ waitlist ≫ view), splits captures by ICP fit,
 * and refuses to show conversion percentages below the minimum sample —
 * "insufficient data" is an honest answer; a percentage built on n=5 is not.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePageAccess } from "@/lib/auth/page-gate";
import PageShell from "@/components/layout/PageShell";
import KpiCard from "@/components/ui/KpiCard";
import type { UserProfile } from "@/types/projects";
import type { MktSignal } from "@/types/marketing";
import { EVIDENCE_WEIGHTS, MIN_SESSIONS_FOR_RATES } from "@/types/marketing";
import { getIdeaContext, getFunnelMetrics } from "@/lib/marketing/admin";
import { ChevronLeftIcon } from "@/components/ui/icons";
import SignalsTable from "./_components/SignalsTable";
import FunnelView from "../_components/FunnelView";

/** 95% Wilson score interval for a binomial proportion (honest error bars). */
function wilson(successes: number, n: number): { lo: number; hi: number } {
  if (n === 0) return { lo: 0, hi: 0 };
  const z = 1.96;
  const p = successes / n;
  const denom = 1 + (z * z) / n;
  const center = (p + (z * z) / (2 * n)) / denom;
  const margin = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denom;
  return { lo: Math.max(0, center - margin) * 100, hi: Math.min(1, center + margin) * 100 };
}

export default async function SignalsPage({
  params,
}: {
  params: Promise<{ ideaId: string }>;
}) {
  const { ideaId } = await params;
  const { supabase, userId } = await requirePageAccess(["admin", "manager"]);

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, picture, type, signature")
    .eq("id", userId)
    .single();

  const ctx = await getIdeaContext(ideaId);
  if (!ctx) notFound();

  const m = await getFunnelMetrics(ideaId);

  const [{ data: signalsData }, { data: eventRows }, { data: interviewRows }] =
    await Promise.all([
      supabase
        .from("mkt_signal" as never)
        .select("*")
        .eq("idea_id", ideaId)
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("mkt_event" as never)
        .select("type, session_id")
        .eq("idea_id", ideaId)
        .limit(10000),
      supabase
        .from("mkt_interview" as never)
        .select("analysis")
        .eq("idea_id", ideaId),
    ]);

  const signals = (signalsData ?? []) as unknown as MktSignal[];
  const events = (eventRows ?? []) as unknown as { type: string; session_id: string | null }[];
  const interviews = (interviewRows ?? []) as unknown as { analysis: Record<string, unknown> }[];

  // ── Weighted validation score (evidence, not activity) ────────────────────
  const sessions = new Set(
    events.filter((e) => e.type === "view").map((e) => e.session_id).filter(Boolean)
  ).size;
  const eventCount = (t: string) => events.filter((e) => e.type === t).length;

  let score = 0;
  for (const e of events) score += EVIDENCE_WEIGHTS[e.type] ?? 0;
  for (const s of signals) {
    score += EVIDENCE_WEIGHTS[s.type] ?? 0;
    if (s.verified_at) score += EVIDENCE_WEIGHTS.verified_bonus;
  }
  for (const iv of interviews) {
    const grade = String(iv.analysis?.evidence_grade ?? "");
    if (grade === "strong") score += EVIDENCE_WEIGHTS.interview_strong;
    else if (grade === "anti_signal") score -= EVIDENCE_WEIGHTS.interview_strong / 2;
  }

  const confidence =
    sessions >= 200 ? "High" : sessions >= MIN_SESSIONS_FOR_RATES ? "Medium" : "Low";

  // ── ICP split + n-gated conversion ─────────────────────────────────────────
  const icpYes = signals.filter((s) => s.icp_fit === true).length;
  const icpNo = signals.filter((s) => s.icp_fit === false).length;
  const icpUnknown = signals.length - icpYes - icpNo;

  const captures = m.quiz + m.waitlist + m.preorders;
  const enoughData = sessions >= MIN_SESSIONS_FOR_RATES;
  const conv = enoughData && sessions > 0 ? (captures / sessions) * 100 : null;
  const ci = enoughData ? wilson(captures, sessions) : null;

  return (
    <PageShell profile={(profile ?? null) as UserProfile | null}>
      <div className="mb-2">
        <Link
          href={`/marketing/${ideaId}`}
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          <ChevronLeftIcon className="w-4 h-4" strokeWidth={2} />
          {ctx.ideaName || "Idea"}
        </Link>
      </div>

      <h1 className="text-heading-1 text-text-primary mb-5">Signals</h1>

      {/* ── Validation evidence (weighted, ICP-split, n-gated) ───────────── */}
      <section className="card mb-6 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-text-muted mb-0.5">Validation score</p>
            <p className="text-2xl font-bold text-text-primary">{Math.round(score)}</p>
            <details className="mt-1">
              <summary className="text-[10px] text-accent cursor-pointer hover:underline select-none">
                How is this calculated?
              </summary>
              <p className="text-[10px] text-text-muted mt-1 leading-relaxed">
                Each event is weighted by commitment level: preorder +20 · meeting booked +8 · waitlist +3 · CTA click +1 · page view +0.1 · verified capture +5 · interview (strong evidence) +10 · interview (anti-signal) −5.
              </p>
            </details>
          </div>
          <div>
            <p className="text-xs text-text-muted mb-0.5">Confidence</p>
            <p
              className={`text-2xl font-bold ${
                confidence === "High"
                  ? "text-[color:var(--success-strong)]"
                  : confidence === "Medium"
                  ? "text-amber-400"
                  : "text-red-400"
              }`}
            >
              {confidence}
            </p>
            <p className="text-[10px] text-text-muted">{sessions} unique sessions</p>
            <p className="text-[10px] text-text-muted mt-0.5">
              Low &lt;{MIN_SESSIONS_FOR_RATES} · Medium {MIN_SESSIONS_FOR_RATES}–199 · High 200+
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted mb-0.5">Visitor → capture</p>
            {conv !== null && ci ? (
              <>
                <p className="text-2xl font-bold text-text-primary">{conv.toFixed(1)}%</p>
                <p className="text-[10px] text-text-muted">
                  95% CI {ci.lo.toFixed(1)}–{ci.hi.toFixed(1)}%
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-text-muted">—</p>
                <p className="text-[10px] text-amber-400">
                  insufficient data (need n≥{MIN_SESSIONS_FOR_RATES}, have {sessions})
                </p>
              </>
            )}
          </div>
          <div>
            <p className="text-xs text-text-muted mb-0.5">ICP fit</p>
            <p className="text-2xl font-bold text-text-primary">
              {icpYes}
              <span className="text-sm font-normal text-text-muted">
                {" "}fit · {icpNo} non-fit · {icpUnknown} unknown
              </span>
            </p>
            <p className="text-[10px] text-text-muted">
              10 ICP captures &gt; 100 random captures
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-border pt-3 text-[11px] text-text-muted">
          <span>CTA clicks: <strong className="text-text-secondary">{eventCount("cta_click")}</strong></span>
          <span>Scrolled 50%: <strong className="text-text-secondary">{eventCount("scroll_50")}</strong></span>
          <span>Scrolled 90%: <strong className="text-text-secondary">{eventCount("scroll_90")}</strong></span>
          <span>Pricing clicks: <strong className="text-text-secondary">{eventCount("pricing_click")}</strong></span>
          <span>Meetings booked: <strong className="text-text-secondary">{eventCount("meeting_booked")}</strong></span>
          <span>Interviews analyzed: <strong className="text-text-secondary">{interviews.length}</strong></span>
        </div>
      </section>

      <FunnelView
        title="Conversion funnel"
        stages={[
          { label: "Page views", value: sessions },
          { label: "CTA clicks", value: eventCount("cta_click") },
          {
            label: "Captures",
            value: captures,
            note: captures > 0 && icpYes > 0 ? `${icpYes} ICP-fit` : undefined,
          },
          {
            label: "ICP-fit",
            value: icpYes,
            note: icpYes > 0 ? "confirmed ICP" : undefined,
          },
        ]}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Quiz" value={m.quiz.toLocaleString()} />
        <KpiCard label="Waitlist" value={m.waitlist.toLocaleString()} />
        <KpiCard label="Pre-orders" value={m.preorders.toLocaleString()} />
        <KpiCard label="Page views" value={m.views.toLocaleString()} />
      </div>

      <SignalsTable signals={signals} />
    </PageShell>
  );
}
