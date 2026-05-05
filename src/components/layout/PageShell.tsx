/**
 * PageShell — every page's outer chrome.
 *
 *   <PageShell profile={profile}>
 *     <PageHeader title="Projects" />
 *     <SomeContent />
 *   </PageShell>
 *
 * Replaces the hand-rolled `<div className="flex h-screen bg-base"> +
 * <Sidebar /> + <main className="ml-[220px]">` boilerplate that today
 * lives at the top of every page.tsx.
 *
 * The sidebar starts collapsed (icon-only, 60 px) on every page. Hover
 * expands it as an overlay; clicking the toggle pins it open and the
 * main column reserves 232 px. State is owned by SidebarContext.
 */

import { clsx } from "clsx";
import type { UserProfile } from "@/types/projects";
import Sidebar from "./Sidebar";
import { SidebarProvider } from "./SidebarContext";

interface PageShellProps {
  profile: UserProfile | null;
  children: React.ReactNode;
  /** When true, the main column is `overflow-hidden` (use for chat-style
   *  full-bleed pages). Default = scrollable. */
  fullBleed?: boolean;
  /** Disable the inner page-shell padding. */
  flush?: boolean;
  className?: string;
}

export default function PageShell({
  profile,
  children,
  fullBleed,
  flush,
  className,
}: PageShellProps) {
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-base overflow-hidden">
        <Sidebar profile={profile} />
        <main
          className={clsx(
            "flex flex-col flex-1 ml-[var(--sidebar-width)] min-w-0 transition-[margin] duration-200",
            fullBleed ? "overflow-hidden" : "overflow-y-auto",
            !flush && !fullBleed && "px-8 py-7",
            className
          )}
        >
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
