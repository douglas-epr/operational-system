"use client";

/**
 * Recharts BarChart for "Active projects · hours estimated vs real".
 * Extracted from DashboardOverview so the parent can
 * `next/dynamic({ ssr: false })` it — keeps Recharts out of the initial
 * dashboard bundle.
 */

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ProjectHoursRow } from "../_lib/queries";

interface HoursTooltipPayload {
  active?: boolean;
  payload?: Array<{
    value: number;
    name?: string;
    color?: string;
    payload: ProjectHoursRow;
  }>;
  label?: string | number;
}

function HoursTooltip({ active, payload, label }: HoursTooltipPayload) {
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

interface ActiveHoursChartProps {
  data: ProjectHoursRow[];
}

export default function ActiveHoursChart({ data }: ActiveHoursChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        layout="vertical"
        data={data}
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
        <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: "#a1a1aa", paddingTop: 4 }} />
        <Bar dataKey="estimated_hours" name="Estimated" fill="#3f3f46" radius={[0, 3, 3, 0]} />
        <Bar dataKey="real_hours" name="Real" fill="#6366f1" radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
