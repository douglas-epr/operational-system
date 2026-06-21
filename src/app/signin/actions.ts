"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// ── Sign In ───────────────────────────────────────────────────────────────────

export async function signIn(
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error: string }> {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  let authError: string | null = null;

  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) authError = error.message;
  } catch {
    return { error: "Unable to reach the server. Please check your connection and try again." };
  }

  if (authError) {
    return { error: authError };
  }

  // All roles land on /projects after sign-in; the middleware + page gate then
  // route each role to its allowed home (referrer is clamped to /projects).
  redirect("/projects");
}

// ── Send Password Reset Email ─────────────────────────────────────────────────

export async function sendPasswordReset(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const email = formData.get("email") as string;

  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/reset_pw`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
