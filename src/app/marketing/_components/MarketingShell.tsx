"use client";

/**
 * MarketingShell — idea-card grid for the validation engine.
 *
 * Shows all ideas grouped by project (sidebar filter). Clicking a card opens
 * the idea's marketing dashboard. Modelled after the Ideas Refiner grid.
 */

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { MktIdeaListItem } from "@/types/marketing";
import { VALIDATION_STATUS_LABELS } from "@/types/marketing";
import { cn } from "@/lib/utils";
import { SearchIcon, MegaphoneIcon } from "@/components/ui/icons";

interface Props {
  initialIdeas: MktIdeaListItem[];
}

export default function MarketingShell({ initialIdeas }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const selectedProject = searchParams.get("project") ?? null;

  // Derive unique projects from the idea list for the sidebar
  const projects = useMemo(() => {
    const seen = new Map<string, string | null>();
    for (const i of initialIdeas) {
      if (i.project_id && !seen.has(i.project_id)) {
        seen.set(i.project_id, i.project_name);
      }
    }
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }, [initialIdeas]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return initialIdeas.filter((i) => {
      if (!selectedProject || selectedProject === "general") {
        if (i.project_id !== null) return false;
      } else {
        if (i.project_id !== selectedProject) return false;
      }
      if (q && !(i.idea_name ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [initialIdeas, search, selectedProject]);

  function handleProjectSelect(projectId: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (projectId) {
      params.set("project", projectId);
    } else {
      params.delete("project");
    }
    router.push(`/marketing${params.toString() ? `?${params.toString()}` : ""}`);
  }

  const validatedCount = initialIdeas.filter((i) => i.validation).length;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Project filter sidebar */}
      <aside className="w-48 shrink-0 border-r border-border overflow-y-auto py-4">
        <h3 className="px-4 text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
          Projects
        </h3>
        <button
          onClick={() => handleProjectSelect("general")}
          className={cn(
            "w-full text-left px-4 py-1.5 text-sm transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset",
            selectedProject === "general" || !selectedProject
              ? "bg-accent text-white font-medium"
              : "text-text-secondary hover:text-text-primary hover:bg-muted"
          )}
        >
          General Ideas
        </button>
        {projects.map((p) => (
          <button
            key={p.id}
            onClick={() => handleProjectSelect(p.id)}
            className={cn(
              "w-full text-left px-4 py-1.5 text-sm truncate transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset",
              selectedProject === p.id
                ? "bg-accent text-white font-medium"
                : "text-text-secondary hover:text-text-primary hover:bg-muted"
            )}
          >
            {p.name ?? "Untitled"}
          </button>
        ))}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <div>
            <h1 className="text-xl font-bold text-text-primary">Market Validation</h1>
            <p className="text-sm text-text-muted mt-0.5">
              {validatedCount} of {initialIdeas.length} ideas in validation
            </p>
          </div>
          <div className="relative w-56">
            <SearchIcon
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
              strokeWidth={2}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ideas..."
              className="w-full pl-9 pr-3 py-2 bg-elevated border border-border rounded-md text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        {/* Cards grid */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <MegaphoneIcon className="w-12 h-12 text-text-muted/40 mb-3" />
              <p className="text-sm text-text-muted">
                {search ? "No ideas match your search." : "No ideas found."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((i) => (
                <IdeaMarketingCard key={i.idea_id} item={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const STATUS_STYLE: Record<string, string> = {
  validating: "status-in-progress",
  killed: "status-blocked",
  doubling_down: "status-done",
};

function IdeaMarketingCard({ item }: { item: MktIdeaListItem }) {
  const v = item.validation;
  const captures = item.metrics
    ? item.metrics.quiz + item.metrics.waitlist + item.metrics.preorders
    : null;

  return (
    <Link
      href={`/marketing/${item.idea_id}`}
      className="group relative flex flex-col bg-surface border border-border rounded-xl p-5 transition-shadow hover:shadow-md cursor-pointer"
    >
      {/* Status badge */}
      {v && (
        <span className={`absolute top-3 right-3 status-badge ${STATUS_STYLE[v.status] ?? ""}`}>
          {VALIDATION_STATUS_LABELS[v.status]}
        </span>
      )}

      <h3 className="text-sm font-semibold text-text-primary line-clamp-2 mb-0.5 pr-24">
        {item.idea_name ?? "Untitled idea"}
      </h3>

      {item.idea_version_name && (
        <p className="text-[11px] text-text-muted mb-3">{item.idea_version_name}</p>
      )}

      {/* Metrics row — always shown, zeros when no metrics yet */}
      <div className="flex items-center gap-4 text-xs text-text-muted mt-auto pt-3 border-t border-border">
        <span>
          <span className="text-text-primary font-semibold tabular-nums">
            {item.metrics?.views ?? 0}
          </span>{" "}
          views
        </span>
        <span>
          <span className="text-text-primary font-semibold tabular-nums">
            {captures ?? 0}
          </span>{" "}
          captures
        </span>
        <span>
          <span className="text-text-primary font-semibold tabular-nums">
            {item.metrics?.replied ?? 0}
          </span>{" "}
          replies
        </span>
      </div>
    </Link>
  );
}
