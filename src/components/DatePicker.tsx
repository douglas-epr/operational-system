"use client";

import { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import {
  format,
  parse,
  isValid,
  addMonths,
  subMonths,
  setMonth,
  setYear,
  getMonth,
  getYear,
} from "date-fns";

interface DatePickerProps {
  /** ISO date string: YYYY-MM-DD (or empty string / null) */
  value: string | null | undefined;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  /** "compact" for narrow cells (time-tracker rows) */
  size?: "default" | "compact";
  /** When true, the input cannot be opened or cleared. */
  readOnly?: boolean;
  /** ISO date string (YYYY-MM-DD). Dates before this are disabled. */
  minDate?: string | null;
  /** ISO date string (YYYY-MM-DD). Dates after this are disabled. */
  maxDate?: string | null;
}

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export default function DatePicker({
  value,
  onChange,
  className = "",
  placeholder = "dd/mm/yyyy",
  size = "default",
  readOnly = false,
  minDate = null,
  maxDate = null,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"calendar" | "months" | "years">("calendar");
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;
  const validSelected = selected && isValid(selected) ? selected : undefined;
  const displayValue = validSelected ? format(validSelected, "dd/MM/yyyy") : "";

  // Month displayed in the calendar (controlled)
  const [calMonth, setCalMonth] = useState<Date>(validSelected ?? new Date());

  // Sync calMonth when value changes externally
  useEffect(() => {
    if (validSelected) setCalMonth(validSelected);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // Year range for the year picker: current view year ±8
  const yearRangeCenter = getYear(calMonth);
  const years = Array.from({ length: 16 }, (_, i) => yearRangeCenter - 7 + i);

  // Close on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setView("calendar");
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  function handleOpen() {
    if (readOnly) return;
    setOpen((o) => {
      if (!o) setView("calendar");
      return !o;
    });
  }

  const minDateObj = minDate ? parse(minDate, "yyyy-MM-dd", new Date()) : null;
  const maxDateObj = maxDate ? parse(maxDate, "yyyy-MM-dd", new Date()) : null;
  const disabledMatchers: Array<{ before: Date } | { after: Date }> = [];
  if (minDateObj && isValid(minDateObj)) disabledMatchers.push({ before: minDateObj });
  if (maxDateObj && isValid(maxDateObj)) disabledMatchers.push({ after: maxDateObj });

  function handleSelectDay(date: Date | undefined) {
    onChange(date ? format(date, "yyyy-MM-dd") : "");
    setOpen(false);
    setView("calendar");
  }

  function handleSelectMonth(monthIdx: number) {
    setCalMonth((prev) => setMonth(prev, monthIdx));
    setView("calendar");
  }

  function handleSelectYear(year: number) {
    setCalMonth((prev) => setYear(prev, year));
    setView("calendar");
  }

  const cursorCls = readOnly ? "cursor-default text-text-muted" : "cursor-pointer";
  const inputCls =
    size === "compact"
      ? `text-xs bg-muted border border-border rounded px-2 py-1 text-text-primary focus:outline-none focus:border-accent w-full ${cursorCls} ${className}`
      : `input-field ${cursorCls} ${className}`;

  return (
    <div className="relative w-full" ref={containerRef}>
      <input
        type="text"
        readOnly
        value={displayValue}
        placeholder={placeholder}
        onClick={handleOpen}
        onKeyDown={(e) => {
          if (readOnly) return;
          if (e.key === "Delete" || e.key === "Backspace") {
            e.preventDefault();
            onChange("");
            setOpen(false);
            setView("calendar");
          }
        }}
        className={inputCls}
      />

      {open && (
        <div className="absolute top-full left-0 z-[200] mt-1 w-[280px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-2xl p-3 select-none">

          {/* ── Custom header ── */}
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => {
                if (view === "calendar") setCalMonth(subMonths(calMonth, 1));
                else if (view === "years") {
                  setCalMonth((prev) => setYear(prev, getYear(prev) - 16));
                }
              }}
              className="p-1 rounded hover:bg-[var(--color-muted)] text-[var(--color-text-secondary)] transition-colors text-base leading-none"
            >
              ‹
            </button>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setView(view === "months" ? "calendar" : "months")}
                className="text-sm font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors px-1 rounded hover:bg-[var(--color-muted)]"
              >
                {MONTHS[getMonth(calMonth)]}
              </button>
              <button
                onClick={() => setView(view === "years" ? "calendar" : "years")}
                className="text-sm font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors px-1 rounded hover:bg-[var(--color-muted)]"
              >
                {getYear(calMonth)}
              </button>
            </div>

            <button
              onClick={() => {
                if (view === "calendar") setCalMonth(addMonths(calMonth, 1));
                else if (view === "years") {
                  setCalMonth((prev) => setYear(prev, getYear(prev) + 16));
                }
              }}
              className="p-1 rounded hover:bg-[var(--color-muted)] text-[var(--color-text-secondary)] transition-colors text-base leading-none"
            >
              ›
            </button>
          </div>

          {/* ── Month picker ── */}
          {view === "months" && (
            <div className="grid grid-cols-3 gap-1 mb-2">
              {MONTHS.map((m, idx) => (
                <button
                  key={m}
                  onClick={() => handleSelectMonth(idx)}
                  className={`py-1.5 rounded text-xs font-medium transition-colors ${
                    idx === getMonth(calMonth)
                      ? "bg-[var(--color-accent)] text-white"
                      : "hover:bg-[var(--color-muted)] text-[var(--color-text-primary)]"
                  }`}
                >
                  {m.slice(0, 3)}
                </button>
              ))}
            </div>
          )}

          {/* ── Year picker ── */}
          {view === "years" && (
            <div className="grid grid-cols-4 gap-1 mb-2">
              {years.map((y) => (
                <button
                  key={y}
                  onClick={() => handleSelectYear(y)}
                  className={`py-1.5 rounded text-xs font-medium transition-colors ${
                    y === yearRangeCenter
                      ? "bg-[var(--color-accent)] text-white"
                      : "hover:bg-[var(--color-muted)] text-[var(--color-text-primary)]"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          )}

          {/* ── Calendar ── */}
          {view === "calendar" && (
            <DayPicker
              mode="single"
              selected={validSelected}
              month={calMonth}
              onMonthChange={setCalMonth}
              onSelect={handleSelectDay}
              disabled={disabledMatchers.length > 0 ? disabledMatchers : undefined}
              hideNavigation
              classNames={{
                root: "text-[var(--color-text-primary)]",
                months: "flex flex-col",
                month: "space-y-1",
                month_caption: "hidden",
                month_grid: "w-full border-collapse",
                weekdays: "flex",
                weekday:
                  "w-9 text-center text-[11px] font-medium text-[var(--color-text-muted)] py-1",
                week: "flex mt-1",
                day: "w-9 h-9 p-0 text-center",
                day_button:
                  "w-9 h-9 rounded-full text-sm transition-colors hover:bg-[var(--color-muted)] text-[var(--color-text-primary)] focus:outline-none",
                selected:
                  "bg-[var(--color-accent)] text-white rounded-full",
                today: "font-bold text-[var(--color-accent)]",
                outside: "opacity-30",
                disabled: "opacity-20 cursor-not-allowed",
              }}
            />
          )}

          {/* ── Footer ── */}
          <div className="flex items-center gap-3 border-t border-[var(--color-border)] pt-2 mt-2">
            <button
              onClick={() => { onChange(format(new Date(), "yyyy-MM-dd")); setOpen(false); setView("calendar"); }}
              className="text-xs text-[var(--color-accent)] hover:underline"
            >
              Today
            </button>
            <button
              onClick={() => { onChange(""); setOpen(false); setView("calendar"); }}
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
            >
              Clear
            </button>
            <button
              onClick={() => { setOpen(false); setView("calendar"); }}
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] ml-auto"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
