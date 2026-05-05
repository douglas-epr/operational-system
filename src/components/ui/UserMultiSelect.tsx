"use client";

/**
 * UserMultiSelect — single canonical user picker.
 *
 * Replaces the three different pickers that today render in
 * `/projects` (avatar bubble strip + dropdown list),
 * `/internal-projects` (dashed-circle plus search modal), and
 * `/sops` (checkboxed flyout).
 *
 *   <UserMultiSelect
 *     label="Authorized users"
 *     value={ids}
 *     onChange={setIds}
 *     options={profiles.map(p => ({ id: p.id, name: fullName(p), role: p.type, picture: p.picture }))}
 *   />
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { clsx } from "clsx";
import Avatar from "./Avatar";
import IconButton from "./IconButton";
import { AddIcon, CheckIcon, CloseIcon, SearchIcon } from "./icons";

export interface UserMultiSelectOption {
  id: string;
  name: string;
  role?: string | null;
  picture?: string | null;
}

interface UserMultiSelectProps {
  label?: string;
  helpText?: string;
  value: string[];
  onChange: (ids: string[]) => void;
  options: UserMultiSelectOption[];
  placeholder?: string;
  /** Optional cap on how many users can be selected. */
  max?: number;
  disabled?: boolean;
  required?: boolean;
}

export default function UserMultiSelect({
  label,
  helpText,
  value,
  onChange,
  options,
  placeholder = "Add people",
  max,
  disabled,
  required,
}: UserMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside.
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Reset query when reopening.
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const optionsById = useMemo(() => {
    const map = new Map<string, UserMultiSelectOption>();
    for (const o of options) map.set(o.id, o);
    return map;
  }, [options]);

  const selected = useMemo(
    () => value.map((id) => optionsById.get(id)).filter(Boolean) as UserMultiSelectOption[],
    [value, optionsById]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.name.toLowerCase().includes(q));
  }, [options, query]);

  const atMax = typeof max === "number" && value.length >= max;

  function toggle(id: string) {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      if (atMax) return;
      onChange([...value, id]);
    }
  }

  function remove(id: string) {
    onChange(value.filter((v) => v !== id));
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-text-secondary">
          {label}
          {required && <span className="text-danger-strong ml-0.5">*</span>}
        </label>
      )}
      <div ref={wrapRef} className="relative">
        {/* Trigger: avatar chips + add button */}
        <div
          className={clsx(
            "min-h-10 px-2 py-1.5 flex items-center flex-wrap gap-1.5 rounded-md border border-border bg-elevated",
            "focus-within:border-accent focus-within:[box-shadow:0_0_0_3px_var(--accent-ring)]",
            disabled && "opacity-60 pointer-events-none"
          )}
        >
          {selected.length === 0 && !open && (
            <span className="text-sm text-text-muted px-1">{placeholder}</span>
          )}
          {selected.map((s) => (
            <span
              key={s.id}
              className="inline-flex items-center gap-1.5 pl-1 pr-1.5 py-0.5 rounded-full bg-muted text-xs text-text-primary"
            >
              <Avatar name={s.name} src={s.picture} size="xs" />
              <span className="truncate max-w-[140px]">{s.name}</span>
              <button
                type="button"
                onClick={() => remove(s.id)}
                aria-label={`Remove ${s.name}`}
                className="text-text-muted hover:text-text-primary -mr-0.5"
              >
                <CloseIcon className="w-3 h-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => !disabled && setOpen((v) => !v)}
            aria-label="Add people"
            aria-expanded={open}
            disabled={disabled || atMax}
            className={clsx(
              "ml-auto inline-flex items-center justify-center w-6 h-6 rounded-md text-text-secondary hover:text-text-primary hover:bg-muted",
              "disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            )}
          >
            <AddIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Popover */}
        {open && (
          <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 rounded-md border border-border bg-elevated shadow-[0_16px_32px_rgba(0,0,0,0.30)] overflow-hidden">
            <div className="p-2 border-b border-border-subtle">
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search people…"
                  className="w-full h-8 pl-8 pr-2 text-sm rounded bg-base border border-border-subtle focus:border-accent focus:outline-none"
                />
              </div>
            </div>
            <ul className="max-h-72 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-3 py-6 text-center text-xs text-text-muted">
                  No matches
                </li>
              ) : (
                filtered.map((o) => {
                  const checked = value.includes(o.id);
                  const disabledRow = !checked && atMax;
                  return (
                    <li key={o.id}>
                      <button
                        type="button"
                        onClick={() => toggle(o.id)}
                        disabled={disabledRow}
                        className={clsx(
                          "w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors",
                          "hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed",
                          checked && "bg-accent-subtle"
                        )}
                      >
                        <Avatar name={o.name} src={o.picture} size="sm" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm text-text-primary truncate">
                            {o.name}
                          </div>
                          {o.role && (
                            <div className="text-[11px] text-text-muted capitalize truncate">
                              {o.role}
                            </div>
                          )}
                        </div>
                        {checked && (
                          <CheckIcon className="w-4 h-4 text-accent shrink-0" />
                        )}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
            {typeof max === "number" && (
              <div className="px-3 py-2 text-[11px] text-text-muted border-t border-border-subtle">
                {value.length} / {max} selected
              </div>
            )}
          </div>
        )}
      </div>
      {helpText && (
        <p className="text-xs text-text-muted">{helpText}</p>
      )}
    </div>
  );
}

/* IconButton + IconButton intentionally re-imported for static analysis */
export { IconButton };
