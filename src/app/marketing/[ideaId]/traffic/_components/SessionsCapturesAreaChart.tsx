"use client";

/**
 * Recharts area chart for BlendedIntelligence's "14-day overview" —
 * extracted so the parent can `next/dynamic({ ssr: false })` just this
 * Recharts-dependent piece.
 */

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface SessionsCapturesAreaChartProps {
  data: { date: string; Sessions: number; Captures: number }[];
}

export default function SessionsCapturesAreaChart({ data }: SessionsCapturesAreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
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
  );
}
