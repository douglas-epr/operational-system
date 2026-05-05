/**
 * Button — canonical button primitive for the entire app.
 *
 * Wraps the `.btn` utility classes from `globals.css`. The variant /
 * size names match VibeUX 1.12 (primary / secondary / tertiary /
 * destructive) and 1.14 (40 px default height).
 *
 * Usage:
 *   <Button variant="primary" leadingIcon={<AddIcon />}>New project</Button>
 *   <Button variant="secondary" loading>Save</Button>
 *   <Button variant="destructive" size="sm">Delete</Button>
 */

"use client";

import { clsx } from "clsx";
import { forwardRef } from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "destructive"
  | "destructive-outline";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  tertiary: "btn-tertiary",
  destructive: "btn-destructive",
  "destructive-outline": "btn-destructive-outline",
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: "btn-sm",
  md: "",
  lg: "btn-lg",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    leadingIcon,
    trailingIcon,
    loading,
    fullWidth,
    disabled,
    children,
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
      disabled={disabled || loading}
      className={clsx(
        "btn",
        VARIANT_CLASS[variant],
        SIZE_CLASS[size],
        fullWidth && "w-full",
        className
      )}
      {...rest}
    >
      {loading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        leadingIcon
      )}
      {children}
      {!loading && trailingIcon}
    </button>
  );
});

export default Button;
