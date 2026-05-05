/**
 * EmptyState — replaces every "No items found" plain-text placeholder
 * (VibeUX 4.15: empty state should guide).
 */

import { clsx } from "clsx";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  body?: string;
  action?: React.ReactNode;
  size?: "sm" | "md";
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  body,
  action,
  size = "md",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center text-center",
        size === "sm" ? "py-10 gap-2" : "py-16 gap-3",
        className
      )}
    >
      {icon && (
        <div
          className={clsx(
            "rounded-full bg-muted text-text-muted flex items-center justify-center mb-1",
            size === "sm"
              ? "w-10 h-10 [&>svg]:w-5 [&>svg]:h-5"
              : "w-14 h-14 [&>svg]:w-7 [&>svg]:h-7"
          )}
        >
          {icon}
        </div>
      )}
      <h3
        className={clsx(
          "font-semibold text-text-primary",
          size === "sm" ? "text-sm" : "text-base"
        )}
      >
        {title}
      </h3>
      {body && (
        <p className="text-sm text-text-muted max-w-md">{body}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
