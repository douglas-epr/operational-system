"use client";

/**
 * Toolbar — search input + filter slots + primary CTA. Used by every
 * list/grid page (`/projects`, `/leads`, `/talent-pool`, `/sops`,
 * `/users`, `/feedback`).
 *
 *   <Toolbar
 *     search={{ value: q, onChange: setQ, placeholder: "Search projects" }}
 *     filters={
 *       <Select options={…} value={status} onChange={…} />
 *     }
 *     action={
 *       <Button leadingIcon={<AddIcon />}>New project</Button>
 *     }
 *   />
 */

import { clsx } from "clsx";
import { SearchIcon } from "./icons";

interface ToolbarProps {
  search?: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
  };
  filters?: React.ReactNode;
  action?: React.ReactNode;
  countLabel?: React.ReactNode;
  className?: string;
}

export default function Toolbar({
  search,
  filters,
  action,
  countLabel,
  className,
}: ToolbarProps) {
  return (
    <div className={clsx("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-3 flex-wrap">
        {search && (
          <div className="relative flex-1 min-w-[240px]">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            <input
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              placeholder={search.placeholder ?? "Search…"}
              className="input input--icon-left"
            />
          </div>
        )}
        {filters && (
          <div className="flex items-center gap-2 flex-wrap">{filters}</div>
        )}
        {action && <div className="ml-auto">{action}</div>}
      </div>
      {countLabel && (
        <div className="text-xs text-text-muted text-right tabular-nums">
          {countLabel}
        </div>
      )}
    </div>
  );
}
