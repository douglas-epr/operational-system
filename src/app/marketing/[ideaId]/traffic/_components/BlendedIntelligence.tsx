"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { TrafficOverview } from "../actions";

function fmt(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1000) return `$${(dollars / 1000).toFixed(1)}k`;
  return `$${dollars.toFixed(2)}`;
}

function pct(v: number | null, decimals = 1): string {
  if (v === null) return "—";
  return `${v.toFixed(decimals)}%`;
}

interface KpiChipProps {
  label: string;
  value: string;
  sub?: string;
  muted?: boolean;
}

function KpiChip({ label, value, sub, muted }: KpiChipProps) {
  return (
    <div className="flex flex-col gap-0.5 px-4 py-3 rounded-lg border border-border bg-elevated">
      <p className="text-[10px] uppercase tracking-wider text-text-muted font-medium">{label}</p>
      <p className={`text-xl font-bold tabular-nums ${muted ? "text-text-muted" : "text-text-primary"}`}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-text-muted">{sub}</p>}
    </div>
  );
}

// ── Rule-based recommendations ────────────────────────────────────────────────

interface RecommendationRule {
  key: string;
  message: string;
  severity: "warn" | "info";
}

function computeRecommendations(
  overview: TrafficOverview,
  landingPublished: boolean,
  hasSeoKeywords: boolean
): RecommendationRule[] {
  const recs: RecommendationRule[] = [];
  const { totals } = overview;

  if (!landingPublished) {
    recs.push({
      key: "no_landing",
      message: "Publish your landing page — traffic has nowhere to convert.",
      severity: "warn",
    });
  }

  if (totals.sessions > 20 && totals.cvr_pct !== null && totals.cvr_pct < 1) {
    recs.push({
      key: "low_cvr",
      message: `Overall conversion is ${pct(totals.cvr_pct)} — below the 1% threshold. Review your landing page copy and CTA.`,
      severity: "warn",
    });
  }

  if (!hasSeoKeywords) {
    recs.push({
      key: "no_seo",
      message: "Add your first SEO keywords to the tracker to measure organic rank.",
      severity: "info",
    });
  }

  for (const src of overview.bySource) {
    if (src.sessions > 10 && src.cvr_pct !== null && src.cvr_pct < 0.5) {
      recs.push({
        key: `low_cvr_${src.source}`,
        message: `"${src.source}" has ${pct(src.cvr_pct)} conversion across ${src.sessions} sessions — consider pausing or adjusting the ad.`,
        severity: "warn",
      });
    }
  }

  return recs;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  overview: TrafficOverview;
  landingPublished: boolean;
  hasSeoKeywords: boolean;
}

export default function BlendedIntelligence({ overview, landingPublished, hasSeoKeywords }: Props) {
  const { daily, totals, bySource } = overview;
  const recs = computeRecommendations(overview, landingPublished, hasSeoKeywords);

  const chartData = daily.map((d) => ({
    date: d.date.slice(5), // MM-DD
    Sessions: d.sessions,
    Captures: d.captures,
  }));

  const hasData = totals.sessions > 0 || totals.captures > 0;

  return (
    <div className="space-y-6">
      {/* ── Recommended actions ──────────────────────────────────────────────── */}
      {recs.length > 0 && (
        <section className="card space-y-2">
          <h2 className="text-heading-3 text-text-primary">Recommended actions</h2>
          <ul className="space-y-1.5">
            {recs.map((r) => (
              <li key={r.key} className="flex items-start gap-2 text-sm">
                <span
                  className={`mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full ${
                    r.severity === "warn" ? "bg-amber-400" : "bg-accent"
                  }`}
                />
                <span className="text-text-secondary">{r.message}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Blended macro chart + KPI chips ──────────────────────────────────── */}
      <section className="card space-y-4">
        <h2 className="text-heading-3 text-text-primary">14-day overview</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiChip
            label="Total sessions"
            value={totals.sessions.toLocaleString()}
            muted={totals.sessions === 0}
          />
          <KpiChip
            label="Total captures"
            value={totals.captures.toLocaleString()}
            muted={totals.captures === 0}
          />
          <KpiChip
            label="CVR"
            value={pct(totals.cvr_pct)}
            sub="captures ÷ sessions"
            muted={totals.cvr_pct === null}
          />
          <KpiChip
            label="CPA"
            value={totals.cpa_cents !== null ? fmt(totals.cpa_cents) : "—"}
            sub={totals.spend_cents > 0 ? `${fmt(totals.spend_cents)} total spend` : "no spend recorded"}
            muted={totals.cpa_cents === null}
          />
        </div>

        {hasData ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart
              data={chartData}
              margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gradSessions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradCaptures" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                tickLine={false}
                axisLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, color: "var(--text-muted)" }}
              />
              <Area
                type="monotone"
                dataKey="Sessions"
                stroke="var(--accent)"
                strokeWidth={1.5}
                fill="url(#gradSessions)"
              />
              <Area
                type="monotone"
                dataKey="Captures"
                stroke="#f59e0b"
                strokeWidth={1.5}
                fill="url(#gradCaptures)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-32 flex items-center justify-center text-sm text-text-muted">
            No session or capture data yet — drive traffic to your landing page.
          </div>
        )}
      </section>

      {/* ── Cross-channel attribution table ──────────────────────────────────── */}
      {bySource.length > 0 && (
        <section className="card space-y-3">
          <h2 className="text-heading-3 text-text-primary">Attribution by channel</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 text-[11px] font-medium text-text-muted pr-5">Source</th>
                  <th className="pb-2 text-[11px] font-medium text-text-muted pr-5 text-right">Sessions</th>
                  <th className="pb-2 text-[11px] font-medium text-text-muted pr-5 text-right">Captures</th>
                  <th className="pb-2 text-[11px] font-medium text-text-muted pr-5 text-right">CVR</th>
                  <th className="pb-2 text-[11px] font-medium text-text-muted text-right">Avg ICP-fit</th>
                </tr>
              </thead>
              <tbody>
                {bySource.map((s) => (
                  <tr key={s.source} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-5 font-medium text-text-primary text-xs">{s.source}</td>
                    <td className="py-2 pr-5 text-right text-xs tabular-nums text-text-secondary">
                      {s.sessions.toLocaleString()}
                    </td>
                    <td className="py-2 pr-5 text-right text-xs tabular-nums text-text-secondary">
                      {s.captures.toLocaleString()}
                    </td>
                    <td className={`py-2 pr-5 text-right text-xs tabular-nums font-semibold ${
                      s.cvr_pct === null
                        ? "text-text-muted"
                        : s.cvr_pct >= 2
                        ? "text-[color:var(--success-strong)]"
                        : s.cvr_pct >= 1
                        ? "text-amber-400"
                        : "text-red-400"
                    }`}>
                      {pct(s.cvr_pct)}
                    </td>
                    <td className="py-2 text-right text-xs tabular-nums text-text-secondary">
                      {s.avg_icp_fit_pct !== null ? pct(s.avg_icp_fit_pct, 0) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[10px] text-text-muted mt-2">
              Sorted by CVR (highest first). CVR color:{" "}
              <span className="text-[color:var(--success-strong)]">≥2% strong</span> ·{" "}
              <span className="text-amber-400">1–2% ok</span> ·{" "}
              <span className="text-red-400">&lt;1% low</span>
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
