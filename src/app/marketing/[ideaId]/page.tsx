/**
 * /marketing/[ideaId] — per-idea validation dashboard.
 * Funnel snapshot (views → captures → outreach) + social content metrics.
 * Positioning / brand DNA on the /positioning tab.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePageAccess } from "@/lib/auth/page-gate";
import PageShell from "@/components/layout/PageShell";
import KpiCard from "@/components/ui/KpiCard";
import type { UserProfile } from "@/types/projects";
import { VALIDATION_STATUS_LABELS, type DecisionContract } from "@/types/marketing";
import {
  getIdeaContext,
  getFunnelMetrics,
  getOnboardingExtras,
  getContractProgress,
} from "@/lib/marketing/admin";
import { ChevronLeftIcon } from "@/components/ui/icons";
import MarketingProjectNav from "./_components/MarketingProjectNav";
import { FunnelBarChart, ContentMetrics } from "./_components/DashboardCharts";

const STATUS_STYLE: Record<string, string> = {
  validating: "status-in-progress",
  killed: "status-blocked",
  doubling_down: "status-done",
};

export default async function IdeaDashboardPage({
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

  const [m, extras, { count: interviewCount }, { count: adCampaignCount }] = await Promise.all([
    getFunnelMetrics(ideaId),
    getOnboardingExtras(ideaId),
    supabase.from("mkt_interview" as never).select("id", { count: "exact", head: true }).eq("idea_id", ideaId),
    supabase.from("mkt_ad_campaign" as never).select("id", { count: "exact", head: true }).eq("idea_id", ideaId),
  ]);

  const captures = m.quiz + m.waitlist + m.preorders;

  const contract = (ctx.validation?.decision_contract ?? {}) as DecisionContract;
  const contractProgress = await getContractProgress(ideaId, contract, m);

  const base = `/marketing/${ideaId}`;
  const mode = ctx.validation?.funnel_mode ?? "hybrid";
  const isB2B = mode === "b2b_outreach" || mode === "hybrid";

  const icp = (ctx.validation?.icp_definition ?? {}) as Record<string, unknown>;
  const hasBrandDna = !!(icp.description || icp.target_audience);

  const completedSegments: Record<string, boolean> = {
    positioning: !!(ctx.validation?.positioning?.trim() || hasBrandDna),
    landing: extras.landingPublished,
    sourcing: m.prospects > 0,
    outreach: m.sent > 0,
    interviews: (interviewCount ?? 0) > 0,
    content: extras.contentCount > 0,
    traffic: (adCampaignCount ?? 0) > 0,
    signals: captures > 0,
  };

  const kpis = [
    { label: "Page views", value: m.views },
    { label: "Captures", value: captures },
    { label: "Prospects", value: m.prospects },
    { label: "Emails sent", value: m.sent },
    { label: "Replies", value: m.replied },
    { label: "Posts", value: extras.contentCount },
  ];

  const captureStages = [
    { label: "Views", value: m.views },
    { label: "Captures", value: captures },
    { label: "Quiz", value: m.quiz },
    { label: "Waitlist", value: m.waitlist },
  ];

  const outreachStages = [
    { label: "Prospects", value: m.prospects },
    { label: "Sent", value: m.sent },
    { label: "Opened", value: m.opened },
    { label: "Replied", value: m.replied },
  ];

  return (
    <PageShell profile={(profile ?? null) as UserProfile | null}>
      <div className="mb-2">
        <Link
          href="/marketing"
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          <ChevronLeftIcon className="w-4 h-4" strokeWidth={2} />
          All ideas
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <h1 className="text-heading-1 text-text-primary">
          {ctx.ideaName || "Untitled idea"}
        </h1>
        {ctx.validation && (
          <span className={`status-badge ${STATUS_STYLE[ctx.validation.status] ?? ""}`}>
            {VALIDATION_STATUS_LABELS[ctx.validation.status]}
          </span>
        )}
      </div>

      <MarketingProjectNav ideaId={ideaId} funnelMode={mode} completedSegments={completedSegments} />

      {/* Decision Contract progress — evidence vs pre-registered thresholds */}
      {contractProgress.length > 0 && (
        <section className="card mb-8 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-heading-3 text-text-primary">Decision Contract</h2>
            <Link
              href={`${base}/positioning`}
              className="text-xs text-accent hover:underline"
            >
              Edit thresholds
            </Link>
          </div>
          {contract.riskiest_assumption && (
            <p className="text-xs text-text-muted">
              <span className="font-semibold text-text-secondary">Riskiest assumption:</span>{" "}
              {contract.riskiest_assumption}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {contractProgress.map((p) => {
              const isRate = p.unit === "%";
              const display =
                p.current === null
                  ? "manual"
                  : isRate
                  ? `${p.current.toFixed(1)}%`
                  : p.current.toLocaleString();
              return (
                <div
                  key={p.metric}
                  className={`rounded-lg border px-3 py-2.5 ${
                    p.met === true
                      ? "border-[color:var(--success-strong)]/40 bg-[color:var(--success-strong)]/5"
                      : p.met === false
                      ? "border-red-500/30 bg-red-500/5"
                      : "border-border bg-elevated"
                  }`}
                >
                  <p className="text-[11px] text-text-muted truncate" title={p.metric}>
                    {p.metric.replaceAll("_", " ")}
                  </p>
                  <p className="text-lg font-bold text-text-primary leading-tight">
                    {display}
                    <span className="text-xs font-normal text-text-muted">
                      {" "}/ {p.threshold}{p.unit}
                    </span>
                  </p>
                  {p.met === null && p.current !== null ? (
                    <p className="text-[10px] text-amber-400">
                      insufficient data — need n≥{p.min_sample}, have {p.sample}
                    </p>
                  ) : p.met === true ? (
                    <p className="text-[10px] text-[color:var(--success-strong)]">threshold met</p>
                  ) : p.met === false ? (
                    <p className="text-[10px] text-red-400">below threshold</p>
                  ) : (
                    <p className="text-[10px] text-text-muted">tracked manually</p>
                  )}
                </div>
              );
            })}
          </div>
          {contract.kill_condition && (
            <p className="text-[11px] text-text-muted border-t border-border pt-2">
              <span className="font-semibold text-red-400/80">Kill condition:</span>{" "}
              {contract.kill_condition}
            </p>
          )}
        </section>
      )}

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-8">
        {kpis.map((k) => (
          <KpiCard key={k.label} label={k.label} value={k.value.toLocaleString()} />
        ))}
      </div>

      <div className={`grid ${isB2B ? "lg:grid-cols-2" : "lg:grid-cols-1 max-w-xl"} gap-6 mb-8`}>
        <FunnelBarChart title="Demand capture" stages={captureStages} />
        {isB2B && <FunnelBarChart title="Outreach funnel" stages={outreachStages} />}
      </div>

      <ContentMetrics
        draft={extras.contentDraft}
        scheduled={extras.contentScheduled}
        posted={extras.contentPosted}
      />
    </PageShell>
  );
}
