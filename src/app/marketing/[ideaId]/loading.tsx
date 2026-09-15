/**
 * `/marketing/[ideaId]` (+ nested tabs, e.g. `/traffic`) loading skeleton —
 * approximates the validation dashboard's back-link + heading + nav tabs +
 * KPI strip + charts layout. `PageShell` needs a fetched `profile`, which
 * isn't available yet here, so this mirrors its chrome dimensions with
 * static skeleton blocks instead of the real `Sidebar`.
 */
import { Skeleton } from "@/components/ui";

export default function MarketingIdeaLoading() {
  return (
    <div className="min-h-screen bg-base flex">
      <div className="w-[var(--sidebar-width)] shrink-0 bg-sidebar border-r border-border" />
      <div className="flex-1 min-w-0 px-8 py-7">
        <Skeleton variant="text" w={90} h={14} className="mb-4" />
        <Skeleton variant="text" w={260} h={24} className="mb-5" />

        <div className="flex items-center gap-2 mb-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="rect" w={90} h={32} />
          ))}
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rect" h={72} />
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Skeleton variant="rect" h={220} />
          <Skeleton variant="rect" h={220} />
        </div>

        <Skeleton variant="rect" h={200} />
      </div>
    </div>
  );
}
