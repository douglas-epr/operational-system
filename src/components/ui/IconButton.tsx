/**
 * IconButton — square icon-only ghost button.
 *
 * The single canonical answer to "edit/delete" row actions across the
 * app. Replaces the inconsistent inline pencil/trash buttons that
 * differed between `/projects` and `/okrs`.
 *
 * Always pass an `aria-label` (or it'll fail accessibility lint).
 *
 *   <IconButton icon={<EditIcon />} aria-label="Edit project" onClick={…} />
 *   <IconButton icon={<DeleteIcon />} aria-label="Delete project" tone="danger" onClick={…} />
 */

"use client";

import { clsx } from "clsx";
import { forwardRef } from "react";

export type IconButtonSize = "sm" | "md" | "lg";
export type IconButtonTone = "neutral" | "danger" | "accent";

interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  icon: React.ReactNode;
  /** Required — accessibility */
  "aria-label": string;
  size?: IconButtonSize;
  tone?: IconButtonTone;
  /** Solid background variant for prominent actions. */
  variant?: "ghost" | "solid";
}

const SIZE_CLASS: Record<IconButtonSize, string> = {
  sm: "w-7 h-7",
  md: "w-9 h-9",
  lg: "w-10 h-10",
};

const ICON_SIZE: Record<IconButtonSize, string> = {
  sm: "[&>svg]:w-3.5 [&>svg]:h-3.5",
  md: "[&>svg]:w-4 [&>svg]:h-4",
  lg: "[&>svg]:w-[18px] [&>svg]:h-[18px]",
};

const TONE_GHOST: Record<IconButtonTone, string> = {
  neutral: "text-text-secondary hover:text-text-primary hover:bg-muted",
  danger: "text-text-secondary hover:text-danger-strong hover:bg-danger-soft",
  accent: "text-text-secondary hover:text-accent hover:bg-accent-subtle",
};

const TONE_SOLID: Record<IconButtonTone, string> = {
  neutral: "bg-muted text-text-primary hover:bg-hover",
  danger: "bg-danger-soft text-danger-strong hover:bg-danger/30",
  accent: "bg-accent text-white hover:bg-accent-hover",
};

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    {
      icon,
      size = "md",
      tone = "neutral",
      variant = "ghost",
      className,
      type = "button",
      ...rest
    },
    ref
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={clsx(
          "inline-flex items-center justify-center rounded-md transition-colors shrink-0",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
          SIZE_CLASS[size],
          ICON_SIZE[size],
          variant === "ghost" ? TONE_GHOST[tone] : TONE_SOLID[tone],
          className
        )}
        {...rest}
      >
        {icon}
      </button>
    );
  }
);

export default IconButton;

// Use the lucide-react package to make sure it resolves at build time.
// (Strict tsconfig will complain if a primitive isn't exporting *something*
// alongside default in a barrel; we re-export the type for downstream use.)
export type { IconButtonProps };
