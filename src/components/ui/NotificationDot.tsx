/**
 * NotificationDot — red unread bubble. Used in:
 *  - Chat sidebar (per-conversation count)
 *  - Block headers (sum of unread)
 *  - Tab strip (unread per tab)
 *  - Project kanban cards (unread comments)
 *
 * Renders nothing when `count` is 0, so callers can pass it
 * unconditionally.
 */

import { clsx } from "clsx";

interface NotificationDotProps {
  count?: number;
  /** Cap label, e.g. "99+". */
  max?: number;
  /** Show a small filled dot instead of the count. */
  dotOnly?: boolean;
  className?: string;
}

export default function NotificationDot({
  count = 0,
  max = 99,
  dotOnly,
  className,
}: NotificationDotProps) {
  if (count <= 0) return null;
  if (dotOnly) {
    return (
      <span
        className={clsx(
          "inline-block w-2 h-2 rounded-full bg-danger",
          className
        )}
      />
    );
  }
  const text = count > max ? `${max}+` : String(count);
  return <span className={clsx("badge-dot", className)}>{text}</span>;
}
