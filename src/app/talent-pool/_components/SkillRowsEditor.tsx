"use client";

/**
 * Editor for rows of `[item, score 1-10]` pairs — used for the Tools and
 * Programming Languages sections of the Talent form.
 *
 * Each row is a grid: [searchable item picker | score | delete]
 *
 * The item picker is a custom dropdown (not a native <select>) so we can:
 *   - guarantee a wide, readable list inside narrow modal columns,
 *   - show the currently-selected option as highlighted with a checkmark,
 *   - filter by typing.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { DeleteIcon, ChevronDownIcon, CheckIcon } from "@/components/ui/icons";

interface Row {
  key: string;        // enum value (e.g. "bubble") or "" for unset
  score: number | null;
}

interface Props {
  rows: Row[];
  onChange: (rows: Row[]) => void;
  options: { value: string; label: string }[];
  itemLabel: string;     // "Tool" or "Language"
  addLabel?: string;     // "+ Add tool"
}

export default function SkillRowsEditor({
  rows,
  onChange,
  options,
  itemLabel,
  addLabel,
}: Props) {
  function update(idx: number, patch: Partial<Row>) {
    onChange(rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }
  function remove(idx: number) {
    onChange(rows.filter((_, i) => i !== idx));
  }
  function add() {
    onChange([...rows, { key: "", score: null }]);
  }

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, idx) => {
        const usedElsewhere = new Set(
          rows.filter((_, i) => i !== idx).map((r) => r.key).filter(Boolean)
        );
        const opts = options.filter((o) => !usedElsewhere.has(o.value));
        return (
          <div
            key={idx}
            className="grid grid-cols-[minmax(0,1fr)_92px_36px] items-center gap-2"
          >
            <ItemPicker
              value={row.key}
              onChange={(v) => update(idx, { key: v })}
              options={opts}
              placeholder={`Select ${itemLabel.toLowerCase()}…`}
            />
            <select
              value={row.score ?? ""}
              onChange={(e) =>
                update(idx, {
                  score: e.target.value === "" ? null : Number(e.target.value),
                })
              }
              className="input-field"
              title="Score (1-10)"
            >
              <option value="">Score…</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => remove(idx)}
              className="p-2 text-text-muted hover:text-red-400 transition-colors flex items-center justify-center"
              aria-label="Remove"
            >
              <DeleteIcon className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        );
      })}
      <button
        type="button"
        onClick={add}
        className="text-xs text-accent hover:underline self-start"
      >
        {addLabel ?? `+ Add ${itemLabel.toLowerCase()}`}
      </button>
    </div>
  );
}

/** Custom dropdown trigger + searchable list for one item slot. */
function ItemPicker({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <div ref={ref} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full input-field flex items-center justify-between gap-2 text-left"
      >
        <span className={`truncate ${selected ? "text-text-primary" : "text-text-muted"}`}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDownIcon className={`w-4 h-4 text-text-muted transition-transform shrink-0 ${open ? "rotate-180" : ""}`} strokeWidth={2} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-elevated border border-border rounded-md shadow-lg overflow-hidden">
          <div className="p-1.5 border-b border-border">
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="input-field text-xs"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs text-text-muted">No matches.</div>
            ) : (
              filtered.map((o) => {
                const isSel = o.value === value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-sm transition-colors flex items-center justify-between gap-2 ${
                      isSel
                        ? "bg-accent/15 text-accent"
                        : "text-text-secondary hover:bg-muted hover:text-text-primary"
                    }`}
                  >
                    <span className="truncate">{o.label}</span>
                    {isSel && (
                      <CheckIcon className="w-4 h-4 shrink-0" strokeWidth={2} />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
