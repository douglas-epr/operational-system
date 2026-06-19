"use client";

/**
 * EmailMultiInput — free-form email "chip" input.
 *
 * Unlike UserMultiSelect (which picks existing users by id), this lets the user
 * type arbitrary email addresses. Press Enter, comma, space, or blur to commit
 * the current text as a chip. Invalid addresses are rejected with inline feedback.
 *
 *   <EmailMultiInput label="Notify by email" value={emails} onChange={setEmails} />
 */

import { useState } from "react";
import { clsx } from "clsx";
import { CloseIcon } from "./icons";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

interface EmailMultiInputProps {
  label?: string;
  helpText?: string;
  value: string[];
  onChange: (emails: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function EmailMultiInput({
  label,
  helpText,
  value,
  onChange,
  placeholder = "name@example.com",
  disabled,
}: EmailMultiInputProps) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  function commit(raw: string): boolean {
    const email = raw.trim().replace(/,$/, "").trim();
    if (!email) return true; // nothing to add — treat as no-op success
    if (!isValidEmail(email)) {
      setError(`"${email}" is not a valid email address.`);
      return false;
    }
    if (value.some((v) => v.toLowerCase() === email.toLowerCase())) {
      setDraft("");
      return true; // duplicate — silently ignore
    }
    onChange([...value, email]);
    setDraft("");
    setError(null);
    return true;
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "," || (e.key === " " && draft.trim())) {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Backspace" && !draft && value.length > 0) {
      // Quick-remove the last chip when the field is empty.
      onChange(value.slice(0, -1));
    }
  }

  function remove(email: string) {
    onChange(value.filter((v) => v !== email));
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
          {label}
        </label>
      )}
      <div
        className={clsx(
          "min-h-10 px-2 py-1.5 flex items-center flex-wrap gap-1.5 rounded-md border border-border bg-muted",
          "focus-within:border-accent",
          disabled && "opacity-60 pointer-events-none"
        )}
      >
        {value.map((email) => (
          <span
            key={email}
            className="inline-flex items-center gap-1.5 pl-2 pr-1.5 py-0.5 rounded-full bg-surface border border-border text-xs text-text-primary"
          >
            <span className="truncate max-w-[200px]">{email}</span>
            <button
              type="button"
              onClick={() => remove(email)}
              aria-label={`Remove ${email}`}
              className="text-text-muted hover:text-text-primary"
            >
              <CloseIcon className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          type="email"
          value={draft}
          disabled={disabled}
          onChange={(e) => { setDraft(e.target.value); if (error) setError(null); }}
          onKeyDown={handleKeyDown}
          onBlur={() => commit(draft)}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[140px] bg-transparent px-1 py-0.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
        />
      </div>
      {error ? (
        <p className="text-xs text-red-500">{error}</p>
      ) : (
        helpText && <p className="text-xs text-text-muted">{helpText}</p>
      )}
    </div>
  );
}
