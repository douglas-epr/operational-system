"use client";

/**
 * AccountSecurityForm — lets the signed-in user update their email and
 * password from the Settings page.
 *
 * Two independent forms in one card (the actions are split so each can
 * succeed/fail on its own and we can show targeted messages):
 *  • Email — Supabase sends a confirmation link to the new address.
 *  • Password — requires the current password as proof-of-identity.
 */

import { useState, useTransition } from "react";
import { EmailIcon, KeyIcon, EyeIcon, EyeOffIcon } from "@/components/ui/icons";
import { updateAccountEmail, updateAccountPassword } from "../actions";

interface Props {
  currentEmail: string;
}

export default function AccountSecurityForm({ currentEmail }: Props) {
  return (
    <div className="space-y-6">
      <EmailRow currentEmail={currentEmail} />
      <div className="border-t border-border" />
      <PasswordRow />
    </div>
  );
}

// ── Email ───────────────────────────────────────────────────────────────────

function EmailRow({ currentEmail }: { currentEmail: string }) {
  const [email, setEmail] = useState(currentEmail);
  const [pwd, setPwd] = useState("");
  const [pwdConfirm, setPwdConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const dirty = email.trim().toLowerCase() !== currentEmail.toLowerCase();
  const mismatch = pwd.length > 0 && pwdConfirm.length > 0 && pwd !== pwdConfirm;
  const canSubmit = dirty && !!pwd && !!pwdConfirm && !mismatch && !pending;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setMsg(null);
    startTransition(async () => {
      const res = await updateAccountEmail(email, pwd, pwdConfirm);
      if (res.error) {
        setMsg({ kind: "err", text: res.error });
      } else {
        setMsg({ kind: "ok", text: "Email updated." });
        setPwd("");
        setPwdConfirm("");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2.5">
      <div className="flex items-center gap-2">
        <EmailIcon className="w-4 h-4 text-text-muted" strokeWidth={1.8} />
        <h3 className="text-sm font-semibold text-text-primary">Email address</h3>
      </div>
      <p className="text-xs text-text-muted">
        Used to sign in. Enter your new email plus your current password (twice) to
        confirm the change. The new email becomes active immediately — no
        confirmation link is sent.
      </p>

      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted">
          New email
        </span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          className="mt-1 w-full px-3 py-2 text-sm bg-elevated border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus transition-colors"
        />
      </label>

      <PasswordField
        label="Current password"
        value={pwd}
        onChange={setPwd}
        autoComplete="current-password"
        visible={showPwd}
        onToggleVisible={() => setShowPwd((v) => !v)}
      />
      <PasswordField
        label="Confirm current password"
        value={pwdConfirm}
        onChange={setPwdConfirm}
        autoComplete="current-password"
        visible={showPwd}
        onToggleVisible={() => setShowPwd((v) => !v)}
        helper={mismatch ? "Passwords don't match." : undefined}
        error={mismatch}
      />

      <div className="flex items-center justify-between gap-3 pt-1">
        {msg ? (
          <p
            className={[
              "text-xs",
              msg.kind === "ok" ? "text-success" : "text-danger",
            ].join(" ")}
          >
            {msg.text}
          </p>
        ) : (
          <span />
        )}
        <button
          type="submit"
          disabled={!canSubmit}
          className="px-4 py-2 text-sm font-medium rounded-md bg-accent text-white hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          {pending ? "Updating…" : "Update email"}
        </button>
      </div>
    </form>
  );
}

// ── Password ────────────────────────────────────────────────────────────────

function PasswordRow() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const mismatch = next.length > 0 && confirm.length > 0 && next !== confirm;
  const tooShort = next.length > 0 && next.length < 8;
  const canSubmit =
    !!current && !!next && !!confirm && !mismatch && !tooShort && !pending;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setMsg(null);
    startTransition(async () => {
      const res = await updateAccountPassword(current, next);
      if (res.error) {
        setMsg({ kind: "err", text: res.error });
      } else {
        setMsg({ kind: "ok", text: "Password updated." });
        setCurrent("");
        setNext("");
        setConfirm("");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2.5">
      <div className="flex items-center gap-2">
        <KeyIcon className="w-4 h-4 text-text-muted" strokeWidth={1.8} />
        <h3 className="text-sm font-semibold text-text-primary">Password</h3>
      </div>
      <p className="text-xs text-text-muted">
        Choose a password with at least 8 characters. We&apos;ll ask for your current
        password to confirm it&apos;s really you.
      </p>

      <PasswordField
        label="Current password"
        value={current}
        onChange={setCurrent}
        autoComplete="current-password"
        visible={showCurrent}
        onToggleVisible={() => setShowCurrent((v) => !v)}
      />
      <PasswordField
        label="New password"
        value={next}
        onChange={setNext}
        autoComplete="new-password"
        visible={showNext}
        onToggleVisible={() => setShowNext((v) => !v)}
        helper={tooShort ? "Must be at least 8 characters." : undefined}
        error={tooShort}
      />
      <PasswordField
        label="Confirm new password"
        value={confirm}
        onChange={setConfirm}
        autoComplete="new-password"
        visible={showNext}
        onToggleVisible={() => setShowNext((v) => !v)}
        helper={mismatch ? "Passwords don't match." : undefined}
        error={mismatch}
      />

      <div className="flex items-center justify-between gap-3 pt-1">
        {msg ? (
          <p
            className={[
              "text-xs",
              msg.kind === "ok" ? "text-success" : "text-danger",
            ].join(" ")}
          >
            {msg.text}
          </p>
        ) : (
          <span />
        )}
        <button
          type="submit"
          disabled={!canSubmit}
          className="px-4 py-2 text-sm font-medium rounded-md bg-accent text-white hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          {pending ? "Updating…" : "Update password"}
        </button>
      </div>
    </form>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  visible,
  onToggleVisible,
  helper,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  visible: boolean;
  onToggleVisible: () => void;
  helper?: string;
  error?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted">
        {label}
      </span>
      <div className="mt-1 relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className={[
            "w-full pl-3 pr-10 py-2 text-sm bg-elevated border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none transition-colors",
            error
              ? "border-danger focus:border-danger"
              : "border-border focus:border-border-focus",
          ].join(" ")}
        />
        <button
          type="button"
          onClick={onToggleVisible}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary transition-colors"
        >
          {visible ? (
            <EyeOffIcon className="w-4 h-4" strokeWidth={1.8} />
          ) : (
            <EyeIcon className="w-4 h-4" strokeWidth={1.8} />
          )}
        </button>
      </div>
      {helper && (
        <span
          className={[
            "block mt-1 text-[11px]",
            error ? "text-danger" : "text-text-muted",
          ].join(" ")}
        >
          {helper}
        </span>
      )}
    </label>
  );
}
