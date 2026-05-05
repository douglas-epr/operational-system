/**
 * ICP Pill Selector.
 * Horizontal scrollable row of selectable ICP tabs.
 * When edit/delete/add callbacks are provided, shows action icons per tab.
 */
"use client";

import type { IdeaIcp } from "@/types/sandbox-planner";
import { cn } from "@/lib/utils";

interface IcpPillSelectorProps {
  icps: IdeaIcp[];
  selectedId: string | null;
  onSelect: (icpId: string) => void;
  onAdd?: () => void;
  onEdit?: (icp: IdeaIcp) => void;
  onDelete?: (icpId: string) => void;
  addLabel?: string;
  /** Optional completion counts per ICP, keyed by ICP id. Format: "done/total". */
  completionBadges?: Record<string, string>;
}

export default function IcpPillSelector({
  icps,
  selectedId,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
  addLabel = "Add ICP",
  completionBadges,
}: IcpPillSelectorProps) {
  if (icps.length === 0 && !onAdd) {
    return (
      <p className="text-sm text-text-muted italic">
        No ICPs generated yet. Run AI to generate them.
      </p>
    );
  }

  return (
    <div
      className="flex items-center bg-muted/60 rounded-full px-2 py-1.5 overflow-x-auto gap-0.5"
      role="tablist"
      aria-label="ICP personas"
    >
      {icps.map((icp) => {
        const isSelected = icp.id === selectedId;
        const badge = completionBadges?.[icp.id];

        return (
          <div key={icp.id} className="flex items-center shrink-0">
            <button
              role="tab"
              aria-selected={isSelected}
              onClick={() => onSelect(icp.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors whitespace-nowrap",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1",
                isSelected
                  ? "bg-white text-gray-900 font-semibold shadow-sm"
                  : "text-text-secondary hover:text-text-primary font-medium"
              )}
            >
              <span className="truncate max-w-40">{icp.name ?? "Unnamed"}</span>
              {badge && (
                <span
                  className={cn(
                    "text-xs font-semibold px-1.5 py-0.5 rounded-md",
                    isSelected ? "bg-black/10 text-gray-700" : "bg-muted text-text-muted"
                  )}
                >
                  {badge}
                </span>
              )}
            </button>

            {onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(icp); }}
                aria-label={`Edit ${icp.name}`}
                className="p-1 text-text-muted hover:text-text-primary transition-colors focus-visible:outline-none shrink-0"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}

            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(icp.id); }}
                aria-label={`Delete ${icp.name}`}
                className="p-1 text-text-muted hover:text-red-400 transition-colors focus-visible:outline-none shrink-0"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        );
      })}

      {onAdd && (
        <button
          onClick={onAdd}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold text-accent hover:text-accent/80 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {addLabel}
        </button>
      )}
    </div>
  );
}
