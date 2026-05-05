"use client";

/**
 * Multi-select dropdown rendering options as toggleable chips.
 * Used by FilterRow for Level / Authority Level / Tools / Programming
 * Languages / Recommended-by-Levels / Countries / Companies.
 */

import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "@/components/ui/icons";

interface Option {
  value: string;
  label: string;
}

interface Props {
  label: string;
  options: Option[];
  values: string[];
  onChange: (values: string[]) => void;
}

export default function MultiChipSelect({ label, options, values, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function toggle(v: string) {
    onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 input-field text-left"
      >
        <span className="truncate text-sm">
          {values.length === 0
            ? label
            : `${label} (${values.length})`}
        </span>
        <ChevronDownIcon className={`w-4 h-4 text-text-muted transition-transform shrink-0 ${open ? "rotate-180" : ""}`} strokeWidth={2} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-40 bg-elevated border border-border rounded-md shadow-lg p-2 max-h-64 overflow-y-auto">
          {options.length === 0 ? (
            <p className="text-xs text-text-muted px-2 py-1.5">No options.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {options.map((o) => {
                const selected = values.includes(o.value);
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => toggle(o.value)}
                    className={[
                      "px-2.5 py-1 rounded-full text-xs transition-colors border",
                      selected
                        ? "bg-accent text-white border-accent"
                        : "bg-muted text-text-secondary border-border hover:text-text-primary",
                    ].join(" ")}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          )}
          {values.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mt-2 text-xs text-text-muted hover:text-red-400"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
