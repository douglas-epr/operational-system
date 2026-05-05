/**
 * Badge — semantic chip used in tables, headers, kanbans, sidebars.
 * Wraps the `.badge` utility classes.
 */

import { clsx } from "clsx";

export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "accent";
export type BadgeSize = "sm" | "md";

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  leadingIcon?: React.ReactNode;
  className?: string;
}

const VARIANT_CLASS: Record<BadgeVariant, string> = {
  default: "",
  success: "badge-success",
  warning: "badge-warning",
  danger: "badge-danger",
  info: "badge-info",
  accent: "badge-accent",
};

export default function Badge({
  variant = "default",
  size = "md",
  leadingIcon,
  className,
  children,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        "badge",
        size === "sm" && "badge-sm",
        VARIANT_CLASS[variant],
        className
      )}
    >
      {leadingIcon && (
        <span className="[&>svg]:w-3 [&>svg]:h-3">{leadingIcon}</span>
      )}
      {children}
    </span>
  );
}
