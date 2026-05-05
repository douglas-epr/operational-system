/**
 * Select — wrapper over native <select> styled to match `<Input>`.
 *
 *   <Select label="Country" value={c} onChange={setC} options={[...]} />
 */

"use client";

import { clsx } from "clsx";
import { forwardRef, useId } from "react";
import { ChevronDownIcon } from "./icons";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string;
  helpText?: string;
  error?: string;
  required?: boolean;
  options: SelectOption[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, helpText, error, required, options, placeholder, className, id, ...rest },
  ref
) {
  const autoId = useId();
  // Skip the DOM id when there's no label — useId() values diverge between
  // SSR and client when provider nesting shifts the fiber counter.
  const sId = id ?? (label ? autoId : undefined);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={sId} className="text-xs font-medium text-text-secondary">
          {label}
          {required && <span className="text-danger-strong ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={sId}
          required={required}
          className={clsx(
            "input pr-9 appearance-none cursor-pointer",
            error && "border-danger",
            className
          )}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
      </div>
      {error ? (
        <p className="text-xs text-danger-strong">{error}</p>
      ) : helpText ? (
        <p className="text-xs text-text-muted">{helpText}</p>
      ) : null}
    </div>
  );
});

export default Select;
export type { SelectProps, SelectOption };
