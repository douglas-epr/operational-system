"use client";

/**
 * MarketingShell — project list for the validation engine.
 *
 * Each project is a card: if validation is enabled it links through to the
 * per-project dashboard and shows mode + status; otherwise it offers an
 * "Enable validation" action that creates the `mkt_validation` row.
 */

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { MktProjectListItem } from "@/types/marketing";
import { VALIDATION_STATUS_LABELS } from "@/types/marketing";
import { enableValidation } from "../actions";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import {
  SearchIcon,
  MegaphoneIcon,
  RocketIcon,
  ArrowRightIcon,
} from "@/components/ui/icons";

interface Props {
  initialProjects: MktProjectListItem[];
}

// Map validation status to the app's semantic status-badge classes (globals.css).
const STATUS_STYLE: Record<string, string> = {
  validating: "status-in-progress",
  killed: "status-blocked",
  doubling_down: "status-done",
};

export default function MarketingShell({ initialProjects }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "enabled" | "not_enabled">("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return initialProjects.filter((p) => {
      if (q && !(p.project_name ?? "").toLowerCase().includes(q)) return false;
      if (filter === "enabled" && !p.validation) return false;
      if (filter === "not_enabled" && p.validation) return false;
      return true;
    });
  }, [initialProjects, search, filter]);

  const enabledCount = initialProjects.filter((p) => p.validation).length;

  // Portfolio rollup across enabled projects.
  const totals = initialProjects.reduce(
    (acc, p) => {
      const m = p.metrics;
      if (!m) return acc;
      acc.views += m.views;
      acc.captures += m.quiz + m.waitlist + m.preorders;
      acc.prospects += m.prospects;
      acc.replied += m.replied;
      return acc;
    },
    { views: 0, captures: 0, prospects: 0, replied: 0 }
  );

  return (
    <div className="px-8 py-8">
      <PageHeader
        title="Marketing"
        subtitle={`${enabledCount} of ${initialProjects.length} projects in validation`}
        compact
      />

      {/* Portfolio rollup */}
      {enabledCount > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <SummaryStat label="Page views" value={totals.views} />
          <SummaryStat label="Captures" value={totals.captures} />
          <SummaryStat label="Prospects" value={totals.prospects} />
          <SummaryStat label="Replies" value={totals.replied} />
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-0">
          <SearchIcon
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
            strokeWidth={2}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search project"
            className="w-full pl-9 pr-3 py-2 bg-elevated border border-border rounded-md text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="px-3 py-2 bg-elevated border border-border rounded-md text-sm text-text-primary focus:outline-none focus:border-accent min-w-[160px]"
        >
          <option value="all">All projects</option>
          <option value="enabled">In validation</option>
          <option value="not_enabled">Not enabled</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<MegaphoneIcon />}
          title="No projects"
          body="Validation attaches to your existing projects. Create a project first, then enable validation here."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <ProjectCard
              key={p.project_id}
              item={p}
              onEnabled={() => router.refresh()}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-elevated p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted">
        {label}
      </p>
      <p className="font-display text-2xl font-bold text-text-primary tabular-nums mt-1">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function ProjectCard({
  item,
  onEnabled,
}: {
  item: MktProjectListItem;
  onEnabled: () => void;
}) {
  const [isPending, start] = useTransition();
  const v = item.validation;

  function handleEnable(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    start(async () => {
      // All projects use Hybrid mode by default
      const r = await enableValidation(item.project_id, "hybrid");
      if (r.error) { alert(r.error); return; }
      onEnabled();
    });
  }

  if (v) {
    return (
      <Link
        href={`/marketing/${item.project_id}`}
        className="card card-interactive flex flex-col gap-3 group"
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-text-primary truncate">
            {item.project_name || "Untitled project"}
          </p>
          <span className={`status-badge ${STATUS_STYLE[v.status] ?? ""} shrink-0`}>
            {VALIDATION_STATUS_LABELS[v.status]}
          </span>
        </div>
        {item.metrics && (
          <div className="flex items-center gap-4 text-xs text-text-muted mt-1">
            <span>
              <span className="text-text-primary font-semibold tabular-nums">{item.metrics.views}</span>{" "}views
            </span>
            <span>
              <span className="text-text-primary font-semibold tabular-nums">
                {item.metrics.quiz + item.metrics.waitlist + item.metrics.preorders}
              </span>{" "}captures
            </span>
            <span>
              <span className="text-text-primary font-semibold tabular-nums">{item.metrics.replied}</span>{" "}replies
            </span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-xs text-accent mt-auto opacity-0 group-hover:opacity-100 transition-opacity">
          Open dashboard <ArrowRightIcon className="w-3.5 h-3.5" strokeWidth={2} />
        </div>
      </Link>
    );
  }

  // Not in validation yet — card is clickable but shows Enable button
  return (
    <Link
      href={`/marketing/${item.project_id}`}
      className="card card-interactive flex flex-col gap-3 group"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-text-primary truncate">
          {item.project_name || "Untitled project"}
        </p>
        <span className="text-xs text-text-muted">Not in validation</span>
      </div>
      <div className="flex items-center justify-between mt-auto">
        <span className="text-xs text-text-muted opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          View project <ArrowRightIcon className="w-3 h-3" strokeWidth={2} />
        </span>
        <Button
          size="sm"
          variant="secondary"
          loading={isPending}
          leadingIcon={<RocketIcon className="w-4 h-4" strokeWidth={2} />}
          onClick={handleEnable}
        >
          Enable
        </Button>
      </div>
    </Link>
  );
}
