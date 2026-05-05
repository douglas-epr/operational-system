"use client";

/**
 * Multi-select typeahead — selected items render as removable chips
 * above the input. Used for "Devs/Agencies who recommend this talent"
 * and "Clients who recommend this talent" in TalentFormModal.
 */

import { useEffect, useRef, useState, useTransition } from "react";
import type { PickerItem } from "./TypeaheadPicker";

interface Props {
  values: PickerItem[];
  onChange: (items: PickerItem[]) => void;
  search: (q: string) => Promise<PickerItem[]>;
  placeholder?: string;
  footer?: React.ReactNode;
}

export default function TypeaheadMultiPicker({
  values,
  onChange,
  search,
  placeholder = "Search…",
  footer,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PickerItem[]>([]);
  const [open, setOpen] = useState(false);
  const [, start] = useTransition();
  const wrapRef = useRef<HTMLDivElement>(null);

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

  function add(item: PickerItem) {
    if (!values.some((v) => v.id === item.id)) {
      onChange([...values, item]);
    }
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  function remove(id: string) {
    onChange(values.filter((v) => v.id !== id));
  }

  return (
    <div ref={wrapRef} className="flex flex-col gap-2">
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map((v) => (
            <span
              key={v.id}
              className="inline-flex items-center gap-1.5 bg-muted rounded-full pl-1 pr-2.5 py-1 text-xs text-text-primary"
            >
              {v.picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={v.picture}
                  alt=""
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <span className="w-5 h-5 rounded-full bg-border flex items-center justify-center text-[10px] text-text-muted">
                  {(v.label[0] || "?").toUpperCase()}
                </span>
              )}
              <span className="truncate max-w-[150px]">{v.label}</span>
              <button
                type="button"
                onClick={() => remove(v.id)}
                className="text-text-muted hover:text-red-400 ml-0.5"
                aria-label="Remove"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          className="input-field"
          placeholder={placeholder}
        />
        {open && (results.length > 0 || footer) && (
          <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-elevated border border-border rounded-md shadow-lg py-1 max-h-56 overflow-y-auto">
            {results
              .filter((r) => !values.some((v) => v.id === r.id))
              .map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => add(r)}
                  className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-muted hover:text-text-primary transition-colors flex items-center gap-2"
                >
                  {r.picture && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.picture}
                      alt=""
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  )}
                  <span className="truncate">{r.label}</span>
                </button>
              ))}
            {footer && (
              <div className="border-t border-border px-3 py-2">{footer}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
