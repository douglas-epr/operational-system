"use client";

/**
 * Single-select typeahead with optional "create" footer slot.
 *
 * Used by TalentFormModal (current company), RecommenderFormModal
 * (current company), and ClientFormModal nowhere — but keeps the
 * pattern reusable.
 */

import { useEffect, useRef, useState, useTransition } from "react";
import { CloseIcon, CheckIcon } from "@/components/ui/icons";

export interface PickerItem {
  id: string;
  label: string;
  picture?: string | null;
}

interface Props {
  value: PickerItem | null;
  onChange: (item: PickerItem | null) => void;
  search: (q: string) => Promise<PickerItem[]>;
  placeholder?: string;
  /** Footer slot — typically a "Didn't find … Create one now" link */
  footer?: React.ReactNode;
}

export default function TypeaheadPicker({
  value,
  onChange,
  search,
  placeholder = "Search…",
  footer,
}: Props) {
  const [query, setQuery] = useState(value?.label ?? "");
  const [results, setResults] = useState<PickerItem[]>([]);
  const [open, setOpen] = useState(false);
  const [, start] = useTransition();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value?.label ?? "");
  }, [value]);

  // Click-outside to close
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function handleQuery(q: string) {
    setQuery(q);
    setOpen(true);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    start(async () => {
      setResults(await search(q));
    });
  }

  return (
    <div ref={wrapRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => handleQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        className="input-field pr-8"
        placeholder={placeholder}
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange(null);
            setQuery("");
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-red-400 p-1"
          title="Clear"
          aria-label="Clear"
        >
          <CloseIcon className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
      )}

      {open && (results.length > 0 || footer) && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-elevated border border-border rounded-md shadow-lg py-1 max-h-56 overflow-y-auto">
          {results.map((r) => {
            const selected = value?.id === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  onChange(r);
                  setQuery(r.label);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2 ${
                  selected
                    ? "bg-accent/15 text-accent"
                    : "text-text-secondary hover:bg-muted hover:text-text-primary"
                }`}
              >
                {r.picture && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.picture}
                    alt=""
                    className="w-6 h-6 rounded-full object-cover"
                  />
                )}
                <span className="truncate flex-1">{r.label}</span>
                {selected && (
                  <CheckIcon className="w-4 h-4 shrink-0" strokeWidth={2} />
                )}
              </button>
            );
          })}
          {footer && (
            <div className="border-t border-border px-3 py-2">{footer}</div>
          )}
        </div>
      )}
    </div>
  );
}
