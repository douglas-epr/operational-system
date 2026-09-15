/**
 * Root-level route loading fallback. Applies to any route segment that
 * doesn't define its own more specific `loading.tsx` (ideas-refiner, chat,
 * marketing/[ideaId], and dashboard all have their own — see those
 * folders). Deliberately chrome-less (no `PageShell`/`Sidebar`): this file
 * is also the fallback for unauthenticated routes like `/signin`, so it
 * can't assume a logged-in profile exists yet.
 */
import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-6">
      <div className="w-full max-w-md flex flex-col gap-3">
        <Skeleton variant="text" w="40%" h={14} />
        <Skeleton variant="rect" h={140} />
        <Skeleton variant="text" />
        <Skeleton variant="text" w="70%" />
      </div>
    </div>
  );
}
