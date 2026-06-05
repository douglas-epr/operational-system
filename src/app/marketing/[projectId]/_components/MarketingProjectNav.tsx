"use client";

/**
 * Sub-navigation for a project's validation workspace.
 * Tabs are ordered to follow the funnel (Dashboard → Sourcing → Outreach →
 * Content → Landing → Signals). B2B-only tabs (Sourcing, Outreach) are dimmed
 * and tagged when the project runs in Consumer Capture mode, so the workspace
 * matches how the project is actually being validated.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import type { MktFunnelMode } from "@/types/marketing";

interface Tab {
  label: string;
  segment: string | null; // null = index (dashboard)
  group: "b2b" | "inbound" | null;
}

// Funnel order: dashboard → positioning → source → outreach → content → landing → signals
const TABS: Tab[] = [
  { label: "Dashboard", segment: null, group: null },
  { label: "Positioning", segment: "positioning", group: null },
  { label: "Sourcing", segment: "sourcing", group: "b2b" },
  { label: "Outreach", segment: "outreach", group: "b2b" },
  { label: "Content", segment: "content", group: "inbound" },
  { label: "Landing", segment: "landing", group: "inbound" },
  { label: "Signals", segment: "signals", group: null },
];

export default function MarketingProjectNav({
  projectId,
  funnelMode = "hybrid",
}: {
  projectId: string;
  funnelMode?: MktFunnelMode;
}) {
  const pathname = usePathname();
  const base = `/marketing/${projectId}`;

  // In consumer-capture mode, the B2B (cold outreach) tabs are secondary.
  const dimB2B = funnelMode === "consumer_capture";

  return (
    <nav className="flex items-center gap-1 border-b border-border mb-6 overflow-x-auto">
      {TABS.map((tab) => {
        const href = tab.segment ? `${base}/${tab.segment}` : base;
        const isActive = tab.segment
          ? pathname.startsWith(href)
          : pathname === base;
        const secondary = dimB2B && tab.group === "b2b";

        return (
          <Link
            key={tab.label}
            href={href}
            title={secondary ? "B2B outreach — secondary for a consumer-capture project" : undefined}
            className={clsx(
              "px-3 py-2 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors inline-flex items-center gap-1.5",
              isActive
                ? "border-accent text-text-primary font-medium"
                : "border-transparent hover:text-text-primary",
              secondary && !isActive ? "text-text-muted/60" : "text-text-secondary"
            )}
          >
            {tab.label}
            {secondary && (
              <span className="text-[9px] uppercase tracking-wide rounded bg-muted px-1 py-0.5 text-text-muted">
                B2B
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
