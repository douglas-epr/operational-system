"use client";

/**
 * Recharts LineChart for "Ideas created" (last 6 months). Extracted from
 * DashboardOverview so the parent can `next/dynamic({ ssr: false })` it —
 * keeps Recharts out of the initial dashboard bundle.
 */

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { IdeasTrendPoint } from "../_lib/queries";

interface RechartsTooltipPayload {
  active?: boolean;
  payload?: Array<{ value: number; name?: string; color?: string }>;
  label?: string | number;
}

function IdeasTooltip({ active, payload, label }: RechartsTooltipPayload) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-md border border-border bg-elevated/95 backdrop-blur px-2.5 py-1.5 text-[11px] shadow-xl min-w-[120px]">
      <div className="text-text-primary mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
          <span className="text-text-muted">{p.name}</span>
          <span className="ml-auto tabular-nums text-text-primary">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

interface IdeasTrendChartProps {
  data: IdeasTrendPoint[];
}

export default function IdeasTrendChart({ data }: IdeasTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
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
          allowDecimals={false}
          width={32}
        />
        <Tooltip content={<IdeasTooltip />} cursor={{ stroke: "#3f3f46" }} />
        <Line
          type="monotone"
          dataKey="count"
          name="Ideas"
          stroke="#6366f1"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "#6366f1" }}
        />
        <Legend
          iconType="circle"
          wrapperStyle={{ fontSize: 11, color: "#a1a1aa", paddingTop: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
