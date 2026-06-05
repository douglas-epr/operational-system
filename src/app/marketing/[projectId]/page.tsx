/**
 * /marketing/[projectId] — per-project validation dashboard.
 * Funnel snapshot (views → captures → outreach) + social content metrics +
 * getting-started steps. Positioning / brand DNA moved to /positioning tab.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePageAccess } from "@/lib/auth/page-gate";
import PageShell from "@/components/layout/PageShell";
import KpiCard from "@/components/ui/KpiCard";
import type { UserProfile } from "@/types/projects";
import { VALIDATION_STATUS_LABELS } from "@/types/marketing";
import { getProjectContext, getFunnelMetrics, getOnboardingExtras } from "@/lib/marketing/admin";
import { ChevronLeftIcon } from "@/components/ui/icons";
import MarketingProjectNav from "./_components/MarketingProjectNav";
import PipelineGuide, { type PipelineStep } from "./_components/PipelineGuide";
import { FunnelBarChart, ContentMetrics } from "./_components/DashboardCharts";

const STATUS_STYLE: Record<string, string> = {
  validating: "status-in-progress",
  killed: "status-blocked",
  doubling_down: "status-done",
};

export default async function ProjectDashboardPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { supabase, userId } = await requirePageAccess(["admin", "manager"]);

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, picture, type, signature")
    .eq("id", userId)
    .single();

  const ctx = await getProjectContext(projectId);
  if (!ctx) notFound();

  const m = await getFunnelMetrics(projectId);
  const extras = await getOnboardingExtras(projectId);
  const captures = m.quiz + m.waitlist + m.preorders;

  const base = `/marketing/${projectId}`;
  const mode = ctx.validation?.funnel_mode ?? "hybrid";
  const isB2B = mode === "b2b_outreach" || mode === "hybrid";

  const icp = (ctx.validation?.icp_definition ?? {}) as Record<string, unknown>;
  const hasBrandDna = !!(icp.description || icp.target_audience);

  const steps: PipelineStep[] = [
    {
      label: "Set positioning",
      hint: "Define brand DNA — powers AI copy.",
      href: `${base}/positioning`,
      done: !!(ctx.validation?.positioning?.trim() || hasBrandDna),
    },
    {
      label: "Publish landing page",
      hint: "Capture quiz / waitlist demand.",
      href: `${base}/landing`,
      done: extras.landingPublished,
    },
    ...(isB2B
      ? [
          {
            label: "Source prospects",
            hint: "Pull leads from Google Maps or LinkedIn.",
            href: `${base}/sourcing`,
            done: m.prospects > 0,
          },
          {
            label: "Run outreach",
            hint: "Sequence + send to prospects.",
            href: `${base}/outreach`,
            done: m.sent > 0,
          },
        ]
      : []),
    {
      label: "Schedule content",
      hint: "Plan social posts on the calendar.",
      href: `${base}/content`,
      done: extras.contentCount > 0,
    },
    {
      label: "Watch signals",
      hint: "Review captured demand + decide.",
      href: `${base}/signals`,
      done: captures > 0,
    },
  ];

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
          All projects
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <h1 className="text-heading-1 text-text-primary">
          {ctx.projectName || "Untitled project"}
        </h1>
        {ctx.validation && (
          <span className={`status-badge ${STATUS_STYLE[ctx.validation.status] ?? ""}`}>
            {VALIDATION_STATUS_LABELS[ctx.validation.status]}
          </span>
        )}
      </div>

      <MarketingProjectNav projectId={projectId} funnelMode={mode} />

      <PipelineGuide steps={steps} />

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
