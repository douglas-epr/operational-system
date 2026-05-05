"use client";

/**
 * AvatarMultiPicker — multi-select user picker rendered as a row of
 * avatar circles + a "+" disc that toggles a dropdown panel of all
 * candidates. Each avatar in the selected row is removable on click;
 * the dropdown shows avatar + name rows that toggle membership.
 *
 * Used today by the SOP modal's "Authorized Users" field; intended to
 * replace any `<select>`-driven multi-select going forward.
 *
 * Visual reference: screenshot 2 of the 2026-04-29 brief — a flowing
 * row of MQ/MD/JC/FQ/RD circles plus a dashed "+" tile, then a panel
 * below listing remaining users with their avatar + name on each row.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import type { UserProfile } from "@/types/projects";

interface Props {
  /** Every selectable profile. */
  profiles: UserProfile[];
  /** Selected ids. Order is preserved in the selected row. */
  selected: string[];
  onChange: (ids: string[]) => void;
  /** Optional label rendered above the field. Omit if a parent renders one. */
  label?: string;
  /** When the candidate list is large, surface a search input. Default: true. */
  searchable?: boolean;
  /** Custom empty-state for the dropdown. */
  emptyText?: string;
  /** Visual size of the avatar circles. */
  size?: "sm" | "md";
}

function nameOf(p: UserProfile | undefined | null): string {
  if (!p) return "User";
  return [p.first_name, p.last_name].filter(Boolean).join(" ") || "User";
}

function initialsOf(p: UserProfile | undefined | null): string {
  return nameOf(p)
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function AvatarMultiPicker({
  profiles,
  selected,
  onChange,
  label,
  searchable = true,
  emptyText = "No users available.",
  size = "md",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  const sizeCls = size === "md" ? "w-9 h-9 text-[11px]" : "w-7 h-7 text-[10px]";

  // Click-outside collapses the dropdown.
  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const selectedProfiles = useMemo(
    () =>
      selected
        .map((id) => profiles.find((p) => p.id === id))
        .filter((p): p is UserProfile => Boolean(p)),
    [selected, profiles]
  );

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return profiles.filter((p) => {
      if (q && !nameOf(p).toLowerCase().includes(q)) return false;
      return true;
    });
  }, [profiles, query]);

  function toggle(id: string) {
    if (selectedSet.has(id)) {
      onChange(selected.filter((x) => x !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  return (
    <div ref={wrapperRef} className="flex flex-col gap-2">
      {label && (
        <label className="text-xs font-medium text-text-secondary">{label}</label>
      )}

      {/* Selected row + add button */}
      <div className="flex flex-wrap items-center gap-2">
        {selectedProfiles.map((p) => {
          const name = nameOf(p);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p.id)}
              title={`Remove ${name}`}
              className={`group relative ${sizeCls} rounded-full bg-accent text-white border-2 border-elevated overflow-hidden flex items-center justify-center font-semibold shrink-0 hover:ring-2 hover:ring-rose-500/40 transition`}
            >
              {p.picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.picture} alt={name} className="w-full h-full object-cover" />
              ) : (
                initialsOf(p)
              )}
              {/* Remove × overlay on hover */}
              <span className="absolute inset-0 flex items-center justify-center bg-rose-500/90 text-white opacity-0 group-hover:opacity-100 text-sm font-bold transition-opacity">
                ×
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Add user"
          className={[
            sizeCls,
            "rounded-full border-2 border-dashed flex items-center justify-center shrink-0 transition-colors",
            open
              ? "border-accent text-accent bg-accent/10"
              : "border-border text-text-muted hover:border-accent hover:text-accent",
          ].join(" ")}
        >
          +
        </button>
      </div>

      {/* Dropdown panel */}
      {open && (
        <div className="rounded-md border border-border bg-surface shadow-xl overflow-hidden">
          {searchable && profiles.length > 6 && (
            <div className="p-2 border-b border-border">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search people…"
                className="input-field text-sm h-8 w-full"
              />
            </div>
          )}
          <ul className="max-h-72 overflow-y-auto">
            {candidates.length === 0 && (
              <li className="px-4 py-6 text-center text-xs text-text-muted">
                {query.trim() ? "No matches." : emptyText}
              </li>
            )}
            {candidates.map((p) => {
              const isSelected = selectedSet.has(p.id);
              const name = nameOf(p);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => toggle(p.id)}
                    className={[
                      "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                      isSelected ? "bg-accent/10" : "hover:bg-muted",
                    ].join(" ")}
                  >
                    <span
                      className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-[11px] font-semibold shrink-0 ${
                        isSelected ? "bg-accent text-white" : "bg-muted text-text-secondary border border-border"
                      }`}
                    >
                      {p.picture ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.picture} alt={name} className="w-full h-full object-cover" />
                      ) : (
                        initialsOf(p)
                      )}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm text-text-primary truncate">
                        {name}
                      </span>
                      {p.type && (
                        <span className="block text-[10px] text-text-muted capitalize">
                          {p.type}
                        </span>
                      )}
                    </span>
                    {isSelected && (
                      <svg
                        className="w-4 h-4 text-accent"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
