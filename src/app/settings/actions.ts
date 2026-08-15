/**
 * Server actions for the Settings page:
 *   - Per-user AI model preference (`user_ai_settings`)
 *   - Agency record (`agency`) — admin-only edit
 */
"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type {
  SaveAgencyInfoPayload,
  SaveAiSettingsPayload,
  Agency,
} from "@/types/settings";
import { OPENROUTER_MODELS } from "@/types/settings";

const PATH = "/settings";
const TABLE = "user_ai_settings" as never;
const AGENCY_TABLE = "agency" as never;

/** Persist the user's theme preference (light | dark) to their profile row. */
export async function saveTheme(
  theme: "light" | "dark"
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({ theme } as never)
    .eq("id", user.id);

  if (error) return { error: error.message };
  return {};
}

/** Save (upsert) the user's preferred OpenRouter model. */
export async function saveAiSettings(
  payload: SaveAiSettingsPayload
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Only allow models the app actually offers — the slug is sent to OpenRouter verbatim.
  if (!OPENROUTER_MODELS.some((m) => m.id === payload.model)) {
    return { error: "Unknown model." };
  }

  const { error } = await supabase
    .from(TABLE)
    .upsert(
      { owner_id: user.id, openrouter_model: payload.model } as never,
      { onConflict: "owner_id" } as never
    );
  if (error) return { error: (error as { message: string }).message };

  revalidatePath(PATH);
  revalidatePath("/ideas-refiner");
  return {};
}

// ── Agency record (admin-only) ────────────────────────────────────────────────

/** Read the singleton agency row, if any. Any signed-in user may call. */
export async function getAgency(): Promise<Agency | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from(AGENCY_TABLE)
    .select("id, name, website, created_by, created_at, updated_at")
    .order("created_at" as never, { ascending: true })
    .limit(1)
    .maybeSingle();
  return (data ?? null) as Agency | null;
}

/**
 * Upsert the singleton agency row. Only admins succeed (the RLS policy
 * `agency: admin write` enforces it; this helper also returns a friendly
 * error for the UI gate).
 */
export async function saveAgencyInfo(
  payload: SaveAgencyInfoPayload
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("type")
    .eq("id", user.id)
    .maybeSingle();
  const role = (profileRow as { type?: string | null } | null)?.type ?? null;
  if (role !== "admin") return { error: "Only admins can edit the agency." };

  const trimmedName = payload.name.trim();
  if (!trimmedName) return { error: "Agency name is required." };
  const website = payload.website?.trim() || null;

  const { data: existing } = await supabase
    .from(AGENCY_TABLE)
    .select("id")
    .order("created_at" as never, { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from(AGENCY_TABLE)
      .update({ name: trimmedName, website } as never)
      .eq("id" as never, (existing as { id: string }).id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from(AGENCY_TABLE)
      .insert({ name: trimmedName, website, created_by: user.id } as never);
    if (error) return { error: error.message };
  }

  revalidatePath(PATH);
  return {};
}

// ── Account: email & password ───────────────────────────────────────────────

/**
 * Update the signed-in user's email immediately, gated by the user's
 * current password (entered + confirmed in the form). The standard
 * `auth.updateUser({ email })` flow sends a confirmation link to the
 * new address — we explicitly skip that here by going through
 * `auth.admin.updateUserById(...)` with `email_confirm: true`, so the
 * change is committed in one step.
 *
 * Identity proof: we re-authenticate with `signInWithPassword(email,
 * currentPassword)` first; without a successful re-auth the admin
 * update is never called.
 */
export async function updateAccountEmail(
  newEmail: string,
  currentPassword: string,
  confirmCurrentPassword: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return { error: "Not authenticated." };

  const trimmed = (newEmail ?? "").trim().toLowerCase();
  if (!trimmed || !/^\S+@\S+\.\S+$/.test(trimmed)) {
    return { error: "Please enter a valid email address." };
  }
  if (trimmed === (user.email ?? "").toLowerCase()) {
    return { error: "That is already your current email." };
  }
  if (!currentPassword || !confirmCurrentPassword) {
    return { error: "Enter your current password in both fields." };
  }
  if (currentPassword !== confirmCurrentPassword) {
    return { error: "The two current-password fields don't match." };
  }

  // Identity check — fail fast if the password is wrong.
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (signInError) {
    return { error: "Current password is incorrect." };
  }

  // Skip Supabase's "send a confirmation link" flow by going through
  // the admin API with `email_confirm: true`.
  const admin = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.auth as any).admin.updateUserById(user.id, {
    email: trimmed,
    email_confirm: true,
  });
  if (error) return { error: error.message };

  // Mirror to profiles.email if your schema stores it there as well.
  await supabase
    .from("profiles")
    .update({ email: trimmed } as never)
    .eq("id", user.id);

  revalidatePath(PATH);
  return {};
}

/**
 * Update the signed-in user's password. Supabase requires the new password
 * to be at least 6 characters by default; we enforce 8+ here for hygiene.
 *
 * Note: Supabase's `updateUser({ password })` does NOT verify the current
 * password server-side. We accept it from the form for UX consistency
 * (and to stop a stranger who walks up to an unlocked laptop) by
 * re-authenticating with the user's email + currentPassword first.
 */
export async function updateAccountPassword(
  currentPassword: string,
  newPassword: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return { error: "Not authenticated." };

  if (!currentPassword) return { error: "Enter your current password." };
  if (!newPassword || newPassword.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }
  if (currentPassword === newPassword) {
    return { error: "New password must be different from your current one." };
  }

  // Re-authenticate before allowing the password change.
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (signInError) {
    return { error: "Current password is incorrect." };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };

  revalidatePath(PATH);
  return {};
}
