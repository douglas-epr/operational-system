/**
 * Textarea — auto-resizing text area sized for the expected input length
 * (VibeUX 5.3 / 1.15).
 */

"use client";

import { clsx } from "clsx";
import { forwardRef, useId } from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helpText?: string;
  error?: string;
  required?: boolean;
  /** Default minimum rows. Use 2 for slogans, 6 for descriptions. */
  minRows?: number;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, helpText, error, required, minRows = 4, className, id, rows, ...rest },
  ref
) {
  const autoId = useId();
  const taId = id ?? autoId;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={taId}
          className="text-xs font-medium text-text-secondary"
        >
          {label}
          {required && <span className="text-danger-strong ml-0.5">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={taId}
        required={required}
        rows={rows ?? minRows}
        className={clsx(
          "input",
          error && "border-danger focus:border-danger focus:[box-shadow:0_0_0_3px_rgba(220,38,38,0.25)]",
          className
        )}
        {...rest}
      />
      {error ? (
        <p className="text-xs text-danger-strong">{error}</p>
      ) : helpText ? (
        <p className="text-xs text-text-muted">{helpText}</p>
      ) : null}
    </div>
  );
});

export default Textarea;
export type { TextareaProps };
