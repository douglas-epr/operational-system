/**
 * `/chat` loading skeleton — approximates ChatShell's 2-column layout
 * (ConversationsSidebar ~260px + conversation pane). `PageShell` needs a
 * fetched `profile`, which isn't available yet here, so this mirrors its
 * chrome dimensions with static skeleton blocks instead of the real
 * `Sidebar`/`ConversationsSidebar`.
 */
import { Skeleton } from "@/components/ui";

export default function ChatLoading() {
  return (
    <div className="h-screen bg-base flex overflow-hidden">
      <div className="w-[var(--sidebar-width)] shrink-0 bg-sidebar border-r border-border" />
      <div className="w-[260px] shrink-0 border-r border-border bg-elevated flex flex-col gap-2 p-4">
        <Skeleton variant="text" w="60%" h={14} />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} variant="rect" h={40} />
        ))}
      </div>
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="h-14 border-b border-border shrink-0 flex items-center px-6">
          <Skeleton variant="text" w={180} h={16} />
        </div>
        <div className="flex-1 p-6 flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="rect" h={56} w={i % 2 === 0 ? "60%" : "45%"} />
          ))}
        </div>
      </div>
    </div>
  );
}
