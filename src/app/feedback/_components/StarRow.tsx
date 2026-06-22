"use client";

/**
 * Read-only or interactive 1–5 star row.
 *
 * The rightmost star renders as a "happy face" variant when the current value
 * reaches 5.
 */
interface Props {
  value: number;                       // 0–5
  onChange?: (v: number) => void;      // enables interactive mode when set
  size?: "sm" | "md" | "lg";
}

const SIZES: Record<NonNullable<Props["size"]>, string> = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-7 h-7",
};

export default function StarRow({ value, onChange, size = "md" }: Props) {
  const interactive = typeof onChange === "function";
  const cls = SIZES[size];
  const clamped = Math.max(0, Math.min(5, value));
  const showHappy = clamped === 5;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= clamped;
        const isLast = n === 5;
        const renderHappy = isLast && showHappy;
        return (
          <button
            key={n}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(n === clamped ? 0 : n)}
            className={[
              interactive ? "cursor-pointer" : "cursor-default",
              "focus:outline-none",
              filled ? "text-yellow-400" : "text-text-muted/40",
              interactive && !filled ? "hover:text-yellow-400/70" : "",
            ].join(" ")}
            aria-label={`Rate ${n}`}
          >
            {renderHappy ? (
              <HappyStar className={cls} />
            ) : (
              <Star className={cls} filled={filled} />
            )}
          </button>
        );
      })}
    </div>
  );
}

function Star({ className, filled }: { className: string; filled: boolean }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 2}
      strokeLinejoin="round"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function HappyStar({ className }: { className: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      {/* Simple smile overlay */}
      <g fill="#000">
        <circle cx="9.4" cy="10.8" r="0.9" />
        <circle cx="14.6" cy="10.8" r="0.9" />
        <path
          d="M9 13.4c.8 1.1 1.9 1.7 3 1.7s2.2-.6 3-1.7"
          stroke="#000"
          strokeWidth="1.1"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </svg>
  );
}
