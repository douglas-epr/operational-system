"use client";

/**
 * DashboardOverview — `/dashboard` (root view).
 *
 * Mission-control layout for admin/manager.
 *
 *   ┌────────────────────────────────────────────────────────────┐
 *   │ Header: hello + date + live badge                          │
 *   │                                                             │
 *   │ ┌───────────┬───────────┬───────────┬───────────┐          │
 *   │ │ Total     │ Playbooks │ Active    │ KR%       │ KPI strip │
 *   │ │ Ideas     │ assembled │ projects  │ achieved  │           │
 *   │ └───────────┴───────────┴───────────┴───────────┘          │
 *   │                                                             │
 *   │ ┌──────────────────────────┐ ┌─────────────────────────┐   │
 *   │ │ Ideas created (6-month   │ │ Projects by status      │   │
 *   │ │ trend line)              │ │ (cells)                 │   │
 *   │ └──────────────────────────┘ └─────────────────────────┘   │
 *   │                                                             │
 *   │ ┌──────────────────────────┐ ┌─────────────────────────┐   │
 *   │ │ Recent key results       │ │ Internal projects status │   │
 *   │ └──────────────────────────┘ └─────────────────────────┘   │
 *   │                                                             │
 *   │ ┌──────────────────────────┐ ┌─────────────────────────┐   │
 *   │ │ Marketing pipeline       │ │ Active project hours    │   │
 *   │ └──────────────────────────┘ └─────────────────────────┘   │
 *   └────────────────────────────────────────────────────────────┘
 *
 * VibeUX compliance:
 *   1.6 — no gradients
 *   6.3 — no pie charts (horizontal BarChart)
 */

import Link from "next/link";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui";
import KpiCard from "@/components/ui/KpiCard";
import TeamWorkloadChart from "./TeamWorkloadChart";
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  INTERNAL_PROJECT_STATUSES,
  INTERNAL_PROJECT_STATUS_LABELS,
  INTERNAL_PROJECT_STATUS_CLASSES,
  KEY_RESULT_STATUS_CLASSES,
  KEY_RESULT_STATUS_LABELS,
  type ProjectStatus,
} from "../_lib/constants";
import type { DashboardMetrics } from "../_lib/queries";

// Recharts (~ideas trend line + active-hours bar) is a heavy client-only
// library — lazy-load it out of the initial dashboard bundle. Each chart's
// outer sizing wrapper (`h-64` / inline `height`) stays in this file so the
// Skeleton fallback fills the exact same box (no layout shift).
const IdeasTrendChart = dynamic(() => import("./IdeasTrendChart"), {
  ssr: false,
  loading: () => <Skeleton variant="rect" h="100%" />,
});
const ActiveHoursChart = dynamic(() => import("./ActiveHoursChart"), {
  ssr: false,
  loading: () => <Skeleton variant="rect" h="100%" />,
});

interface Props {
  metrics: DashboardMetrics;
  viewerName: string | null;
}

// ── Display helpers ───────────────────────────────────────────────────────────

function pct(part: number, total: number): number {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function todayLabel(): string {
  return new Date().toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function greeting(name: string | null): string {
  const h    = new Date().getHours();
  const slot = h < 5 ? "Late" : h < 12 ? "Morning" : h < 18 ? "Afternoon" : "Evening";
  if (slot === "Late") return name ? `Up late, ${name}` : "Mission control";
  return name ? `Good ${slot.toLowerCase()}, ${name}` : `Good ${slot.toLowerCase()}`;
}

const PROJECT_STATUS_HEX: Record<ProjectStatus, string> = {
  prospecting: "#f59e0b",
  not_started: "#71717a",
  in_progress: "#6366f1",
  done:        "#22c55e",
  blocked:     "#ef4444",
  archived:    "#52525b",
  lost_deal:   "#f43f5e",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function DashboardOverview({ metrics, viewerName }: Props) {
  const { ideas, ideas_trend, marketing, keyResults, kr_highlights, projects, active_hours, internalProjects, member_project_hours } = metrics;

  const activeProjectCount = (projects.by_status.in_progress ?? 0) + (projects.by_status.prospecting ?? 0);
  const krAchievedPct      = pct(keyResults.achieved, keyResults.total);

  const playbookPct = pct(ideas.with_playbooks, ideas.total);

  const projectStatusCells = PROJECT_STATUSES.map((s) => ({
    name:   PROJECT_STATUS_LABELS[s],
    status: s,
    value:  projects.by_status[s] ?? 0,
  })).sort((a, b) => b.value - a.value);

  const outreachReplyRate = marketing.total_outreach_sent > 0
    ? Math.round((marketing.total_replies / marketing.total_outreach_sent) * 100)
    : 0;

  return (
    <div className="px-8 py-7 max-w-[1600px] mx-auto w-full">
      {/* Header */}
      <header className="flex items-end justify-between flex-wrap gap-4 mb-7 fade-up">
        <div>
          <h1 className="text-heading-1 text-text-primary">{greeting(viewerName)}</h1>
          <p className="text-sm text-text-muted mt-1">{todayLabel()}</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-text-muted">
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-elevated border border-border">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live · refreshes on reload
          </span>
        </div>
      </header>

      {/* ── KPI strip ─────────────────────────────────────────────── */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-4 fade-up"
        style={{ animationDelay: "60ms" }}
      >
        <KpiCard
          label="Total ideas"
          value={String(ideas.total)}
          delta={{ value: `${ideas.created_this_month} new this month`, positive: true }}
          meta="All ideas in the refiner"
        />
        <KpiCard
          label="Playbooks assembled"
          value={String(ideas.with_playbooks)}
          delta={{ value: `${playbookPct}% of ideas`, positive: playbookPct >= 30 }}
          meta="Ideas with at least one build guide"
        />
        <KpiCard
          label="Active projects"
          value={String(activeProjectCount)}
          delta={{ value: `${projects.total} total`, positive: true }}
          meta={`${projects.by_status.in_progress ?? 0} in-progress · ${projects.by_status.prospecting ?? 0} prospecting`}
        />
        <KpiCard
          label="Key results achieved"
          value={`${krAchievedPct}%`}
          delta={{ value: `${keyResults.achieved} of ${keyResults.total}`, positive: krAchievedPct >= 50 }}
          meta={`${keyResults.not_achieved} still open`}
        />
      </div>

      {/* ── Row 2: ideas trend + project status ──────────────────── */}
      <div
        className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-4 fade-up"
        style={{ animationDelay: "120ms" }}
      >
        <DashCard className="lg:col-span-8" title="Ideas created" subtitle="Last 6 months">
          {ideas_trend.every((p) => p.count === 0) ? (
            <ChartEmpty message="No ideas created in the past 6 months." />
          ) : (
            <div className="h-64">
              <IdeasTrendChart data={ideas_trend} />
            </div>
          )}
        </DashCard>

        <DashCard
          className="lg:col-span-4"
          title="Projects by status"
          subtitle={`${projects.total} total`}
          href="/dashboard?view=projects"
        >
          {projects.total === 0 ? (
            <ChartEmpty message="No projects yet." />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {projectStatusCells.map((cell) => {
                const p = pct(cell.value, projects.total);
                return (
                  <div
                    key={cell.status}
                    className="rounded-md border border-border/60 bg-base/40 px-3 py-2.5 hover:border-accent/50 transition-colors"
                  >
                    <div className="flex items-baseline justify-between gap-1">
                      <span className="text-[10px] uppercase tracking-wider text-text-muted truncate">
                        {cell.name}
                      </span>
                      <span className="tabular-nums text-lg font-semibold text-text-primary">
                        {cell.value}
                      </span>
                    </div>
                    <div className="h-1 mt-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full transition-all"
                        style={{ width: `${p}%`, background: PROJECT_STATUS_HEX[cell.status] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DashCard>
      </div>

      {/* ── Row 3: KR highlights + IP status ─────────────────────── */}
      <div
        className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-4 fade-up"
        style={{ animationDelay: "180ms" }}
      >
        <DashCard
          className="lg:col-span-6"
          title="Recent key results"
          subtitle={`${keyResults.total} total`}
          href="/dashboard?view=key-results"
        >
          {kr_highlights.length === 0 ? (
            <ChartEmpty message="No key results yet." />
          ) : (
            <ul className="divide-y divide-border/60 -mx-1">
              {kr_highlights.map((kr) => (
                <li key={kr.id} className="flex items-center gap-3 px-1 py-2.5 first:pt-1 last:pb-1">
                  <span
                    className={`shrink-0 w-2 h-2 rounded-full ${kr.achieved ? "bg-emerald-400" : "bg-zinc-500"}`}
                  />
                  <span className="flex-1 truncate text-sm text-text-primary">{kr.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${KEY_RESULT_STATUS_CLASSES[kr.status]}`}>
                    {KEY_RESULT_STATUS_LABELS[kr.status]}
                  </span>
                  <span className="tabular-nums text-[11px] text-text-muted shrink-0 w-14 text-right">
                    {kr.current_value ?? "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </DashCard>

        <DashCard
          className="lg:col-span-6"
          title="Internal projects"
          subtitle={`${internalProjects.total} total`}
          href="/dashboard?view=internal-projects"
        >
          <div className="grid grid-cols-3 gap-2">
            {INTERNAL_PROJECT_STATUSES.map((s) => {
              const n = internalProjects.by_status[s] ?? 0;
              const p = pct(n, internalProjects.total);
              return (
                <div
                  key={s}
                  className="rounded-md border border-border/60 bg-base/40 px-3 py-2.5 hover:border-accent/50 transition-colors"
                >
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-text-muted">
                      {INTERNAL_PROJECT_STATUS_LABELS[s]}
                    </span>
                    <span className="tabular-nums text-lg font-semibold text-text-primary">{n}</span>
                  </div>
                  <div className="h-1 mt-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full ${INTERNAL_PROJECT_STATUS_CLASSES[s].split(" ")[0]}`}
                      style={{ width: `${p}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </DashCard>
      </div>

      {/* ── Row 4: Marketing pipeline + active project hours ─────── */}
      <div
        className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-4 fade-up"
        style={{ animationDelay: "240ms" }}
      >
        <DashCard className="lg:col-span-4" title="Marketing pipeline" subtitle="All ideas">
          <div className="grid grid-cols-1 gap-2">
            <MarketingStatRow
              label="Contacts sourced"
              value={marketing.total_prospects}
              note="mkt_prospect"
            />
            <MarketingStatRow
              label="Outreach sent"
              value={marketing.total_outreach_sent}
              note={`${outreachReplyRate}% reply rate`}
            />
            <MarketingStatRow
              label="Replies received"
              value={marketing.total_replies}
              highlight={marketing.total_replies > 0}
            />
            <MarketingStatRow
              label="Demand signals"
              value={marketing.total_signals}
              note="quiz / waitlist / pre-order"
              highlight={marketing.total_signals > 0}
            />
            <MarketingStatRow
              label="Active validations"
              value={marketing.active_validations}
              highlight={marketing.active_validations > 0}
            />
          </div>
        </DashCard>

        <DashCard
          className="lg:col-span-8"
          title="Active projects · hours estimated vs real"
          subtitle="Top 8 by burn"
        >
          {active_hours.length === 0 ? (
            <ChartEmpty message="No projects in progress right now." />
          ) : (
            <div style={{ height: Math.max(220, active_hours.length * 36) }}>
              <ActiveHoursChart data={active_hours} />
            </div>
          )}
        </DashCard>
      </div>

      {/* ── Row 5: Team workload (% of hours per project, per member) ─── */}
      <div
        className="grid grid-cols-1 gap-3 mb-4 fade-up"
        style={{ animationDelay: "300ms" }}
      >
        <DashCard
          title="Team workload · % of hours per project"
          subtitle="From logged work feedback"
        >
          <TeamWorkloadChart rows={member_project_hours} />
        </DashCard>
      </div>
    </div>
  );
}

// ── Internal sub-components ───────────────────────────────────────────────────

function DashCard({
  title,
  subtitle,
  href,
  className = "",
  style,
  children,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const inner = (
    <div
      className={[
        "card h-full flex flex-col",
        href ? "hover:border-accent/60 transition-colors" : "",
        className,
      ].join(" ")}
      style={style}
    >
      <div className="flex items-baseline justify-between mb-3 shrink-0">
        <h2 className="text-sm font-semibold text-text-primary tracking-tight">{title}</h2>
        {subtitle && <span className="text-[11px] text-text-muted">{subtitle}</span>}
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
  return href ? (
    <Link href={href} className={`group block ${className}`} style={style}>
      {inner}
    </Link>
  ) : (
    <div className={`group ${className}`} style={style}>{inner}</div>
  );
}

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="h-44 flex items-center justify-center text-xs text-text-muted">
      {message}
    </div>
  );
}

function MarketingStatRow({
  label,
  value,
  note,
  highlight = false,
}: {
  label: string;
  value: number;
  note?: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-2 border-b border-border/40 last:border-0">
      <div>
        <span className="text-[13px] text-text-secondary">{label}</span>
        {note && <span className="ml-1.5 text-[10px] text-text-muted">{note}</span>}
      </div>
      <span
        className={`tabular-nums text-lg font-semibold ${
          highlight ? "text-accent" : "text-text-primary"
        }`}
      >
        {value.toLocaleString()}
      </span>
    </div>
  );
}

