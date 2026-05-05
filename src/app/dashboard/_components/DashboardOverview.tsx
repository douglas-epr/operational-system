"use client";

/**
 * DashboardOverview — `/dashboard` (root view).
 *
 * Mission-control layout for admin/manager. Dense by design: managers
 * want to scan many numbers at once, not be wowed.
 *
 *   ┌───────────────────────────────────────────────────────────┐
 *   │ Header: hello + date + live badge                         │
 *   │                                                            │
 *   │ ┌────────┬────────┬────────┬────────┐                     │
 *   │ │ Revenue│ Profit │ Active │ KR%    │  ← KPI strip        │
 *   │ └────────┴────────┴────────┴────────┘                     │
 *   │                                                            │
 *   │ ┌─────────────────────────┐ ┌────────────────────────┐    │
 *   │ │ Revenue trend (line,8col│ │ Projects by status     │    │
 *   │ │ no gradients)           │ │ (horizontal bar, 4col) │    │
 *   │ └─────────────────────────┘ └────────────────────────┘    │
 *   │                                                            │
 *   │ ┌─────────────────────────┐ ┌────────────────────────┐    │
 *   │ │ Recent KRs (top 5)      │ │ Internal-project status│    │
 *   │ └─────────────────────────┘ └────────────────────────┘    │
 *   │                                                            │
 *   │ ┌──────────────────────────────────────────────────────┐  │
 *   │ │ Active projects: hours estimated vs real (bar)       │  │
 *   │ └──────────────────────────────────────────────────────┘  │
 *   └───────────────────────────────────────────────────────────┘
 *
 * VibeUX compliance:
 *   1.6  — no gradients (linearGradient fills removed, AreaChart → LineChart)
 *   6.3  — no pie charts (donut replaced with horizontal BarChart)
 * Charts use the already-installed `recharts` package.
 */

import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import KpiCard from "@/components/ui/KpiCard";
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

interface Props {
  metrics: DashboardMetrics;
  viewerName: string | null;
}

// ── Display helpers ───────────────────────────────────────────────────────────

const fmtMoney0 = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n || 0);

const fmtMoneyCompact = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n || 0);

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
  const h = new Date().getHours();
  const slot = h < 5 ? "Late" : h < 12 ? "Morning" : h < 18 ? "Afternoon" : "Evening";
  if (slot === "Late") return name ? `Up late, ${name}` : "Mission control";
  return name ? `Good ${slot.toLowerCase()}, ${name}` : `Good ${slot.toLowerCase()}`;
}

// Status colors keyed to the design token palette (no free-form hex on bg surfaces).
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
  const {
    finance,
    revenue_trend,
    keyResults,
    kr_highlights,
    projects,
    active_hours,
    internalProjects,
  } = metrics;

  const activeProjectCount =
    (projects.by_status.in_progress ?? 0) + (projects.by_status.prospecting ?? 0);
  const krAchievedPct = pct(keyResults.achieved, keyResults.total);

  const revenueDelta    = finance.revenue - finance.prev_revenue;
  const revenueDeltaPct =
    finance.prev_revenue > 0
      ? Math.round((revenueDelta / finance.prev_revenue) * 100)
      : finance.revenue > 0 ? 100 : 0;

  const profitDelta    = finance.profit - finance.prev_profit;
  const profitDeltaPct =
    finance.prev_profit > 0
      ? Math.round((profitDelta / finance.prev_profit) * 100)
      : finance.profit > 0 ? 100 : 0;

  // Stat-cell data: keep zero buckets so the grid stays consistent across
  // viewports, but rank them by count so the active statuses sort first.
  const projectStatusCells = PROJECT_STATUSES.map((s) => ({
    name:   PROJECT_STATUS_LABELS[s],
    status: s,
    value:  projects.by_status[s] ?? 0,
  })).sort((a, b) => b.value - a.value);

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

      {/* ── KPI strip ───────────────────────────────────────────── */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-4 fade-up"
        style={{ animationDelay: "60ms" }}
      >
        <KpiCard
          label={`Revenue · ${finance.month_label}`}
          value={fmtMoney0(finance.revenue)}
          delta={{
            value:    `${Math.abs(revenueDeltaPct)}% vs last month`,
            positive: revenueDeltaPct >= 0,
          }}
          meta={
            finance.invoice_count === 0
              ? `No invoices recorded for ${finance.month_label} yet`
              : `${finance.invoice_count} invoice${finance.invoice_count === 1 ? "" : "s"}`
          }
        />
        <KpiCard
          label={`Profit · ${finance.month_label}`}
          value={fmtMoney0(finance.profit)}
          delta={{
            value:    `${Math.abs(profitDeltaPct)}% vs last month`,
            positive: profitDeltaPct >= 0,
          }}
          meta={`Costs ≈ ${fmtMoney0(finance.costs)}`}
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
          delta={{
            value:    `${keyResults.achieved} of ${keyResults.total}`,
            positive: krAchievedPct >= 50,
          }}
          meta={`${keyResults.not_achieved} still open`}
        />
      </div>

      {/* ── Row 2: revenue trend + project status bars ──────────── */}
      <div
        className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-4 fade-up"
        style={{ animationDelay: "120ms" }}
      >
        {/* Revenue trend — LineChart (no gradients, VibeUX 1.6) */}
        <DashCard className="lg:col-span-8" title="Revenue trend" subtitle="Last 6 months">
          {revenue_trend.every((p) => p.revenue === 0) ? (
            <ChartEmpty message="No invoices in the past 6 months." />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={revenue_trend}
                  margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                >
                  <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#71717a" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#71717a" }}
                    tickFormatter={(v) => fmtMoneyCompact(Number(v))}
                    width={56}
                  />
                  <Tooltip content={<RevenueTooltip />} cursor={{ stroke: "#3f3f46" }} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "#6366f1" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    name="Profit"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "#22c55e" }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: 11, color: "#a1a1aa", paddingTop: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </DashCard>

        {/* Projects by status — grid-of-cells (VibeUX 6.3: no pie charts; keeps
            the same dense overview style as the Internal projects panel below). */}
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
                        style={{
                          width:    `${p}%`,
                          background: PROJECT_STATUS_HEX[cell.status],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DashCard>
      </div>

      {/* ── Row 3: KR highlights + IP status ────────────────────── */}
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
                <li
                  key={kr.id}
                  className="flex items-center gap-3 px-1 py-2.5 first:pt-1 last:pb-1"
                >
                  <span
                    className={`shrink-0 w-2 h-2 rounded-full ${
                      kr.achieved ? "bg-emerald-400" : "bg-zinc-500"
                    }`}
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
                    <span className="tabular-nums text-lg font-semibold text-text-primary">
                      {n}
                    </span>
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

      {/* ── Row 4: Active project hours ─────────────────────────── */}
      <DashCard
        className="fade-up"
        style={{ animationDelay: "240ms" } as React.CSSProperties}
        title="Active projects · hours estimated vs real"
        subtitle="Top 8 by burn"
      >
        {active_hours.length === 0 ? (
          <ChartEmpty message="No projects in progress right now." />
        ) : (
          <div style={{ height: Math.max(220, active_hours.length * 36) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={active_hours}
                margin={{ top: 4, right: 16, left: 4, bottom: 0 }}
                barCategoryGap={6}
              >
                <CartesianGrid stroke="#27272a" strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#71717a" }}
                  tickFormatter={(v) => `${v}h`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={140}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#a1a1aa" }}
                />
                <Tooltip content={<HoursTooltip />} cursor={{ fill: "#27272a55" }} />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: 11, color: "#a1a1aa", paddingTop: 4 }}
                />
                <Bar dataKey="estimated_hours" name="Estimated" fill="#3f3f46" radius={[0, 3, 3, 0]} />
                <Bar dataKey="real_hours"       name="Real"      fill="#6366f1" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </DashCard>
    </div>
  );
}

// ── Internal sub-components ───────────────────────────────────────────────────

/**
 * DashCard — dashboard-local card wrapper that supports an optional `href`
 * (wraps inner content in a `<Link>` so the whole surface is clickable).
 * Uses the `.card` CSS utility but adds a custom header row with subtitle.
 */
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

/** Slim empty-state shown inside chart panels — no icon, just a message. */
function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="h-44 flex items-center justify-center text-xs text-text-muted">
      {message}
    </div>
  );
}

// ── Tooltip sub-components ────────────────────────────────────────────────────

interface RechartsTooltipPayload<T = Record<string, unknown>> {
  active?: boolean;
  payload?: Array<{ value: number; name?: string; color?: string; payload: T }>;
  label?: string | number;
}

function RevenueTooltip({ active, payload, label }: RechartsTooltipPayload) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-md border border-border bg-elevated/95 backdrop-blur px-2.5 py-1.5 text-[11px] shadow-xl min-w-[140px]">
      <div className="text-text-primary mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
          <span className="text-text-muted">{p.name}</span>
          <span className="ml-auto tabular-nums text-text-primary">{fmtMoneyCompact(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function HoursTooltip({
  active,
  payload,
  label,
}: RechartsTooltipPayload<{
  name: string;
  estimated_hours: number;
  real_hours: number;
  burn: number;
}>) {
  if (!active || !payload || payload.length === 0) return null;
  const burn = payload[0]?.payload.burn ?? 0;
  return (
    <div className="rounded-md border border-border bg-elevated/95 backdrop-blur px-2.5 py-1.5 text-[11px] shadow-xl">
      <div className="text-text-primary mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
          <span className="text-text-muted">{p.name}</span>
          <span className="ml-auto tabular-nums text-text-primary">{Math.round(p.value)}h</span>
        </div>
      ))}
      <div className={`mt-1 pt-1 border-t border-border tabular-nums ${burn > 1 ? "text-rose-400" : "text-emerald-400"}`}>
        Burn: {(burn * 100).toFixed(0)}%
      </div>
    </div>
  );
}
