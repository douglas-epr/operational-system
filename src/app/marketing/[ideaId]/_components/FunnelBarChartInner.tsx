"use client";

/**
 * Recharts bar half of `FunnelBarChart` (see `DashboardCharts.tsx`).
 * Extracted so the outer card can `next/dynamic({ ssr: false })` just the
 * Recharts-dependent piece and keep the card chrome + conversion-rate
 * strip (no Recharts dependency) rendering immediately.
 */

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface FunnelBarChartInnerProps {
  stages: { label: string; value: number; color?: string }[];
}

export default function FunnelBarChartInner({ stages }: FunnelBarChartInnerProps) {
  const max = Math.max(1, ...stages.map((s) => s.value));

  return (
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
            <Cell key={i} fill={s.color ?? "var(--accent)"} fillOpacity={0.75} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
