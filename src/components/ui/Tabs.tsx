"use client";

/**
 * Tabs — horizontal tab strip. Single source of truth for the active-
 * state visual: 2 px accent underline + bold label.
 *
 *   <Tabs
 *     activeId="messages"
 *     onChange={(id) => setTab(id)}
 *     tabs={[
 *       { id: "messages", label: "Messages" },
 *       { id: "files", label: "Files", count: 4 },
 *     ]}
 *   />
 */

import Link from "next/link";
import { clsx } from "clsx";
import NotificationDot from "./NotificationDot";

export interface TabItem {
  id: string;
  label: string;
  /** Optional count badge (red if `unread`, neutral otherwise). */
  count?: number;
  unread?: boolean;
  href?: string;
  disabled?: boolean;
}

interface TabsProps {
  tabs: TabItem[];
  activeId: string;
  onChange?: (id: string) => void;
  /** When true, fills the available width and distributes tabs evenly. */
  fill?: boolean;
  className?: string;
}

export default function Tabs({
  tabs,
  activeId,
  onChange,
  fill,
  className,
}: TabsProps) {
  return (
    <div
      role="tablist"
      className={clsx(
        "flex gap-1 border-b border-border bg-elevated px-2",
        fill && "w-full",
        className
      )}
    >
      {tabs.map((t) => {
        const isActive = t.id === activeId;
        const inner = (
          <span
            className={clsx(
              "inline-flex items-center gap-2 px-3 h-10 text-sm font-medium border-b-2 -mb-px transition-colors",
              isActive
                ? "border-accent text-text-primary"
                : "border-transparent text-text-secondary hover:text-text-primary",
              t.disabled && "opacity-50 cursor-not-allowed",
              fill && "flex-1 justify-center"
            )}
          >
            {t.label}
            {typeof t.count === "number" && t.count > 0 && (
              t.unread ? (
                <NotificationDot count={t.count} />
              ) : (
                <span
                  className={clsx(
                    "min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-semibold inline-flex items-center justify-center",
                    isActive
                      ? "bg-accent-subtle text-accent"
                      : "bg-muted text-text-secondary"
                  )}
                >
                  {t.count}
                </span>
              )
            )}
          </span>
        );

        if (t.href && !t.disabled) {
          return (
            <Link
              key={t.id}
              href={t.href}
              role="tab"
              aria-selected={isActive}
              className={clsx(fill && "flex-1")}
            >
              {inner}
            </Link>
          );
        }

        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={t.disabled}
            onClick={() => !t.disabled && onChange?.(t.id)}
            className={clsx(
              "appearance-none bg-transparent",
              fill && "flex-1"
            )}
          >
            {inner}
          </button>
        );
      })}
    </div>
  );
}
