/**
 * KpiCard — single-metric card used in dashboards.
 *
 *   <KpiCard
 *     label="Revenue · This month"
 *     value="$24,800"
 *     delta={{ value: "12% vs last month", positive: true }}
 *     meta="42 invoices"
 *   />
 *
 * Implementation note: this primitive is intentionally Tailwind-utility-first
 * (rather than relying solely on the `.kpi`/`.kpi-label`/`.kpi-value`/`.kpi-delta`/`.kpi-meta`
 * CSS chain in globals.css). The custom classes are kept additively as theme
 * hooks, but the layout — flex-column stack, label uppercase, big tabular value
 * — is enforced by utilities so the card can never silently collapse into
 * inline text if the custom CSS fails to compile.
 */

import { clsx } from "clsx";
import { TrendDownIcon, TrendUpIcon } from "./icons";

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  delta?: {
    value: string;
    positive: boolean;
  };
  meta?: React.ReactNode;
  className?: string;
}

export default function KpiCard({
  label,
  value,
  delta,
  meta,
  className,
}: KpiCardProps) {
  return (
    <div
      className={clsx(
        // Card chrome — explicit so we don't depend on `.kpi` styles loading.
        "kpi flex flex-col gap-1.5",
        "rounded-xl border border-border bg-elevated",
        "p-5",
        className
      )}
    >
      <span className="kpi-label block text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted leading-[1.2]">
        {label}
      </span>
      <span className="kpi-value block font-display text-[28px] font-bold leading-[1.1] text-text-primary tabular-nums">
        {value}
      </span>
      {delta && (
        <span
          className={clsx(
            "kpi-delta inline-flex items-center gap-1 text-[11px] font-medium leading-[1.3] tabular-nums",
            delta.positive
              ? "text-[color:var(--success-strong)]"
              : "text-[color:var(--danger-strong)]"
          )}
        >
          {delta.positive ? (
            <TrendUpIcon className="w-3 h-3" />
          ) : (
            <TrendDownIcon className="w-3 h-3" />
          )}
          {delta.value}
        </span>
      )}
      {meta && (
        <span className="kpi-meta block text-[11px] leading-[1.4] text-text-muted">
          {meta}
        </span>
      )}
    </div>
  );
}
