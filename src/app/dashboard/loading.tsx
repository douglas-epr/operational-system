/**
 * `/dashboard` loading skeleton — approximates DashboardOverview's default
 * view (KPI strip + two chart rows). `PageShell` itself needs a fetched
 * `profile`, which isn't available yet here, so this mirrors its chrome
 * dimensions (`--sidebar-width` reserved margin) with static skeleton
 * blocks instead of the real `Sidebar`.
 */
import { Skeleton } from "@/components/ui";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-base flex">
      <div className="w-[var(--sidebar-width)] shrink-0 bg-sidebar border-r border-border" />
      <div className="flex-1 min-w-0 px-8 py-7 max-w-[1600px] mx-auto w-full">
        <div className="flex items-end justify-between mb-7">
          <div className="flex flex-col gap-2">
            <Skeleton variant="text" w={220} h={24} />
            <Skeleton variant="text" w={140} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rect" h={92} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-4">
          <Skeleton variant="rect" h={280} className="lg:col-span-8" />
          <Skeleton variant="rect" h={280} className="lg:col-span-4" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <Skeleton variant="rect" h={220} className="lg:col-span-6" />
          <Skeleton variant="rect" h={220} className="lg:col-span-6" />
        </div>
      </div>
    </div>
  );
}
