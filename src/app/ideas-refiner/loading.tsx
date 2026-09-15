/**
 * `/ideas-refiner` loading skeleton — approximates SandboxPlannerShell's
 * tab rail + step content layout. `PageShell` needs a fetched `profile`,
 * which isn't available yet here, so this mirrors its chrome dimensions
 * with static skeleton blocks instead of the real `Sidebar`.
 */
import { Skeleton } from "@/components/ui";

export default function IdeasRefinerLoading() {
  return (
    <div className="h-screen bg-base flex overflow-hidden">
      <div className="w-[var(--sidebar-width)] shrink-0 bg-sidebar border-r border-border" />
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center gap-2 px-6 py-3 border-b border-border shrink-0 overflow-x-auto">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rect" w={110} h={28} />
          ))}
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4 max-w-3xl">
          <Skeleton variant="text" w={260} h={20} />
          <Skeleton variant="rect" h={160} />
          <Skeleton variant="text" />
          <Skeleton variant="text" w="85%" />
          <Skeleton variant="rect" h={160} />
        </div>
      </div>
    </div>
  );
}
