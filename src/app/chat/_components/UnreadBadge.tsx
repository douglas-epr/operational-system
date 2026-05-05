"use client";

/**
 * Small red unread bubble.
 * Renders nothing when count is 0.
 *
 * Mirrors the badge used by /projects on task cards (TasksKanban.tsx),
 * so the same visual language carries across the app.
 */

interface Props {
  count: number;
  /** Optional larger (used inside block headers). */
  size?: "sm" | "md";
}

export default function UnreadBadge({ count, size = "sm" }: Props) {
  if (!count || count <= 0) return null;
  const dim =
    size === "md"
      ? "min-w-[20px] h-5 text-[11px] px-1.5"
      : "min-w-[18px] h-[18px] text-[10px] px-1";
  return (
    <span
      className={`shrink-0 inline-flex items-center justify-center rounded-full bg-red-500 text-white font-bold leading-none ${dim}`}
      title={`${count} unread message${count === 1 ? "" : "s"}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
