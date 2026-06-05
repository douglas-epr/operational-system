"use client";

/**
 * DashboardCharts — Recharts-based visualisations for the validation dashboard.
 * Client component because Recharts hooks into the DOM for sizing.
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// ── Funnel bar chart ──────────────────────────────────────────────────────────

interface FunnelChartProps {
  title: string;
  stages: { label: string; value: number; color?: string }[];
}

export function FunnelBarChart({ title, stages }: FunnelChartProps) {
  const max = Math.max(1, ...stages.map((s) => s.value));

  return (
    <section className="card">
      <h2 className="text-heading-3 text-text-primary mb-4">{title}</h2>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={stages}
          layout="vertical"
          margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
        >
          <XAxis type="number" domain={[0, max]} hide />
          <YAxis
            type="category"
            dataKey="label"
            width={90}
            tick={{ fontSize: 11, fill: "var(--text-muted)" }}
          />
          <Tooltip
            cursor={{ fill: "var(--surface)" }}
            contentStyle={{
              background: "var(--elevated)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(v) => [(v as number).toLocaleString(), "Count"]}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20}>
            {stages.map((s, i) => (
              <Cell
                key={i}
                fill={s.color ?? "var(--accent)"}
                fillOpacity={0.75}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Conversion rates below the chart */}
      <div className="flex gap-4 mt-3 flex-wrap">
        {stages.map((s, i) => {
          const prev = i > 0 ? stages[i - 1].value : null;
          const conv =
            prev && prev > 0 ? `${Math.round((s.value / prev) * 100)}%` : null;
          return (
            <div key={s.label} className="text-center">
              <p className="text-lg font-bold text-text-primary tabular-nums">
                {s.value.toLocaleString()}
              </p>
              <p className="text-[11px] text-text-muted">{s.label}</p>
              {conv && (
                <p className="text-[10px] text-accent font-semibold">{conv}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Content metrics card ──────────────────────────────────────────────────────

interface ContentMetricsProps {
  draft: number;
  scheduled: number;
  posted: number;
}

export function ContentMetrics({ draft, scheduled, posted }: ContentMetricsProps) {
  const total = draft + scheduled + posted;
  const postRate = total > 0 ? Math.round((posted / total) * 100) : 0;

  return (
    <section className="card">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-heading-3 text-text-primary">Social content</h2>
        <a
          href="https://analyze.buffer.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-accent hover:underline flex items-center gap-1"
        >
          Engagement metrics in Buffer ↗
        </a>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total posts", value: total, color: "text-text-primary", bg: "bg-surface" },
          { label: "Posted", value: posted, color: "text-[color:var(--success-strong)]", bg: "bg-[color:var(--success-strong)]/5" },
          { label: "Scheduled", value: scheduled, color: "text-accent", bg: "bg-accent/5" },
          { label: "Drafts", value: draft, color: "text-text-secondary", bg: "bg-muted/30" },
        ].map((item) => (
          <div key={item.label} className={`${item.bg} rounded-xl border border-border p-4 text-center`}>
            <p className={`text-2xl font-bold tabular-nums ${item.color}`}>{item.value}</p>
            <p className="text-xs text-text-muted mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Proportional bar */}
      {total > 0 && (
        <>
          <div className="h-2 rounded-full bg-muted overflow-hidden flex gap-px mb-2">
            {posted > 0 && (
              <div className="h-full bg-[color:var(--success-strong)] transition-all rounded-l-full" style={{ width: `${(posted / total) * 100}%` }} />
            )}
            {scheduled > 0 && (
              <div className="h-full bg-accent transition-all" style={{ width: `${(scheduled / total) * 100}%` }} />
            )}
            {draft > 0 && (
              <div className="h-full bg-text-muted/30 transition-all rounded-r-full" style={{ width: `${(draft / total) * 100}%` }} />
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex gap-4 text-[11px] text-text-muted">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[color:var(--success-strong)]" /> Posted</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-accent" /> Scheduled</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-text-muted/30" /> Draft</span>
            </div>
            <span className="text-xs text-text-muted">{postRate}% published</span>
          </div>
        </>
      )}

      {/* Engagement note */}
      {posted > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-elevated border border-border flex items-start gap-2">
          <span className="text-accent mt-0.5 text-sm">ℹ</span>
          <p className="text-xs text-text-muted leading-relaxed">
            Likes, comments and impressions are available in{" "}
            <a href="https://analyze.buffer.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Buffer Analytics</a>
            {" "}and on each platform. Click any posted chip on the calendar to get a direct link.
          </p>
        </div>
      )}
    </section>
  );
}
