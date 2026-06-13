"use client";

import { useActionState, useState } from "react";
import { signIn, sendPasswordReset } from "./actions";

// ── View types ────────────────────────────────────────────────────────────────
// Mirrors Bubble custom state: custom.view_ = "signin" | "reset_password" | "email_sent"

type View = "signin" | "reset_password" | "email_sent";

// ── Root page (client component) ─────────────────────────────────────────────

export default function SignInPage() {
  const [view, setView] = useState<View>("signin");

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* ── Left panel — form ───────────────────────────────────────── */}
      <div className="flex flex-col bg-[#f5f5f7]">
        {/* Logo — top-left */}
        <div className="p-6 flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#FFB800] flex items-center justify-center text-[#0D0D1A] text-xs font-bold leading-none select-none">
            M
          </div>
          <span className="text-[13px] font-semibold text-[#1a1a1a]">
            Move37
          </span>
        </div>

        {/* Card — vertically centered */}
        <div className="flex-1 flex items-center justify-center px-6 pb-16">
          <div className="w-full max-w-sm">
            {view === "signin" && (
              <SignInForm onForgotPassword={() => setView("reset_password")} />
            )}
            {view === "reset_password" && (
              <ResetPasswordForm
                onBack={() => setView("signin")}
                onSuccess={() => setView("email_sent")}
              />
            )}
            {view === "email_sent" && (
              <EmailSentConfirmation onBack={() => setView("signin")} />
            )}
          </div>
        </div>
      </div>

      {/* ── Right panel — branding ──────────────────────────────────── */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-[#4338ca] px-12 text-white text-center">
        <h1 className="text-4xl font-bold leading-tight mb-3">
          Welcome to Move37!
        </h1>
        <p className="text-base text-white/80 mb-10">
          Easily manage and track your projects all in one place.
        </p>
        {/* Product image placeholder — replace with actual asset */}
        <div className="w-72 h-52 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
          <span className="text-white/40 text-sm">Product image</span>
        </div>
      </div>
    </div>
  );
}

// ── Sign In form ──────────────────────────────────────────────────────────────

function SignInForm({ onForgotPassword }: { onForgotPassword: () => void }) {
  const [state, action, pending] = useActionState(signIn, null);

  return (
    <form action={action} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <h2 className="text-2xl font-bold text-[#1a1a1a] mb-2">Sign In</h2>
      <p className="text-sm text-[#6b7280] mb-6">
        Use the fields below to sign in to your Move37 account.
      </p>

      {state?.error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-4">
          {state.error}
        </p>
      )}

      {/* Email */}
      <div className="mb-4">
        <label htmlFor="email" className="block text-sm font-medium text-[#374151] mb-1">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="johndoe@gmail.com"
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[#1a1a1a] placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
        />
      </div>

      {/* Password */}
      <div className="mb-6">
        <label htmlFor="password" className="block text-sm font-medium text-[#374151] mb-1">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          placeholder="••••••••••••••"
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[#1a1a1a] placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-accent text-white font-medium text-sm py-2.5 hover:bg-accent-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>

      {/* Forgot password */}
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-sm text-[#6b7280] underline underline-offset-2 hover:text-[#374151] transition-colors"
        >
          Forgot Password?
        </button>
      </div>
    </form>
  );
}

// ── Reset Password form ───────────────────────────────────────────────────────

function ResetPasswordForm({
  onBack,
  onSuccess,
}: {
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [state, action, pending] = useActionState(
    async (prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      const result = await sendPasswordReset(prev, formData);
      if (result.success) onSuccess();
      return result;
    },
    null
  );

  return (
    <form action={action} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <h2 className="text-2xl font-bold text-[#1a1a1a] mb-2">Reset Password</h2>
      <p className="text-sm text-[#6b7280] mb-6">
        Enter email that is associated with your account and we will send you
        the password reset link
      </p>

      {state?.error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-4">
          {state.error}
        </p>
      )}

      {/* Email */}
      <div className="mb-6">
        <label htmlFor="reset-email" className="block text-sm font-medium text-[#374151] mb-1">
          Email
        </label>
        <input
          id="reset-email"
          name="email"
          type="email"
          required
          placeholder="johndoe@gmail.com"
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[#1a1a1a] placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-accent text-white font-medium text-sm py-2.5 hover:bg-accent-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pending ? "Sending…" : "Send Link"}
      </button>

      {/* Back to sign in */}
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-[#6b7280] underline underline-offset-2 hover:text-[#374151] transition-colors"
        >
          Remember password? Sign In
        </button>
      </div>
    </form>
  );
}

// ── Email sent confirmation ───────────────────────────────────────────────────

function EmailSentConfirmation({ onBack }: { onBack: () => void }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
        <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-[#1a1a1a] mb-2">Check your email</h2>
      <p className="text-sm text-[#6b7280] mb-6">
        We sent a password reset link to your email. It may take a few minutes
        to arrive.
      </p>
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-[#6b7280] underline underline-offset-2 hover:text-[#374151] transition-colors"
      >
        Back to Sign In
      </button>
    </div>
  );
}
