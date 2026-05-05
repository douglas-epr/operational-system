/**
 * Input — canonical 40 px text input.
 *
 *   <Input placeholder="Search…" leadingIcon={<SearchIcon />} />
 *   <Input label="Email" error="Required" />
 *   <Input label="Country" helpText="ISO-3166 alpha-2" />
 */

"use client";

import { clsx } from "clsx";
import { forwardRef, useId } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helpText?: string;
  error?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  required?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    helpText,
    error,
    leadingIcon,
    trailingIcon,
    required,
    className,
    id,
    ...rest
  },
  ref
) {
  const autoId = useId();
  // Skip the DOM id when there's no label — useId() values diverge between
  // SSR and client when provider nesting shifts the fiber counter.
  const inputId = id ?? (label ? autoId : undefined);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-text-secondary"
        >
          {label}
          {required && <span className="text-danger-strong ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {leadingIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted [&>svg]:w-4 [&>svg]:h-4 pointer-events-none">
            {leadingIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          required={required}
          className={clsx(
            "input",
            leadingIcon && "input--icon-left",
            trailingIcon && "pr-10",
            error && "border-danger focus:border-danger focus:[box-shadow:0_0_0_3px_rgba(220,38,38,0.25)]",
            className
          )}
          {...rest}
        />
        {trailingIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted [&>svg]:w-4 [&>svg]:h-4">
            {trailingIcon}
          </div>
        )}
      </div>
      {error ? (
        <p className="text-xs text-danger-strong">{error}</p>
      ) : helpText ? (
        <p className="text-xs text-text-muted">{helpText}</p>
      ) : null}
    </div>
  );
});

export default Input;
export type { InputProps };
