/**
 * FunnelView — proportional horizontal bars for a funnel. Each stage's bar is
 * scaled to the largest stage so drop-off is visible at a glance. Server
 * component (pure presentational).
 */

export interface FunnelStage {
  label: string;
  value: number;
  /** Optional sub-note, e.g. a conversion % or £ amount. */
  note?: string;
}

export default function FunnelView({
  title,
  stages,
}: {
  title: string;
  stages: FunnelStage[];
}) {
  const max = Math.max(1, ...stages.map((s) => s.value));

  return (
    <section className="mb-8">
      <h2 className="text-heading-3 text-text-primary mb-3">{title}</h2>
      <div className="card space-y-2.5">
        {stages.map((s, i) => {
          const pct = Math.round((s.value / max) * 100);
          // Conversion from the previous stage.
          const prev = i > 0 ? stages[i - 1].value : null;
          const conv =
            prev && prev > 0 ? `${Math.round((s.value / prev) * 100)}%` : null;
          return (
            <div key={s.label} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-xs text-text-muted text-right">
                {s.label}
              </span>
              <div className="flex-1 h-7 rounded-md bg-muted/40 overflow-hidden relative">
                <div
                  className="h-full bg-accent/70 rounded-md transition-all"
                  style={{ width: `${Math.max(pct, s.value > 0 ? 6 : 0)}%` }}
                />
                <span className="absolute inset-y-0 left-2 flex items-center text-xs font-semibold text-text-primary tabular-nums">
                  {s.value.toLocaleString()}
                  {s.note ? <span className="text-text-muted font-normal ml-1.5">· {s.note}</span> : null}
                </span>
              </div>
              <span className="w-12 shrink-0 text-[11px] text-text-muted tabular-nums text-right">
                {conv ?? ""}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
