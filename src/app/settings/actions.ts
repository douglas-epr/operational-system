/**
 * Server actions for the Settings page:
 *   - Per-user AI config (`user_ai_settings`)
 *   - Agency record (`agency`) — admin-only edit
 */
"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type {
  AiService,
  SaveAgencyInfoPayload,
  SaveAiSettingsPayload,
  Agency,
} from "@/types/settings";

const PATH = "/settings";
const TABLE = "user_ai_settings" as never;
const AGENCY_TABLE = "agency" as never;

/** Row shape for user_ai_settings (until generated types are updated). */
interface AiSettingsRow {
  // Renamed from user_id → owner_id (Part 2 item 3).
  owner_id: string;
  active_service: string | null;
  openai_api_key: string | null;
  gemini_api_key: string | null;
  claude_api_key: string | null;
  openai_model: string | null;
  gemini_model: string | null;
  claude_model: string | null;
}

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

/** Save (upsert) the user's AI settings. */
export async function saveAiSettings(
  payload: SaveAiSettingsPayload
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const row: Record<string, unknown> = {
    owner_id: user.id,
    active_service: payload.activeService,
    openai_model: payload.openaiModel,
    gemini_model: payload.geminiModel,
    claude_model: payload.claudeModel,
  };

  // Only update key fields that were explicitly provided
  if (payload.openaiApiKey !== undefined) {
    row.openai_api_key = payload.openaiApiKey || null;
  }
  if (payload.geminiApiKey !== undefined) {
    row.gemini_api_key = payload.geminiApiKey || null;
  }
  if (payload.claudeApiKey !== undefined) {
    row.claude_api_key = payload.claudeApiKey || null;
  }

  // Check if row exists (column renamed user_id → owner_id, item 3)
  const { data: existing } = await supabase
    .from(TABLE)
    .select("owner_id")
    .eq("owner_id" as never, user.id)
    .maybeSingle();

  if (existing) {
    // Don't include owner_id in the update payload
    const { owner_id: _, ...updateData } = row;
    const { error } = await supabase
      .from(TABLE)
      .update(updateData as never)
      .eq("owner_id" as never, user.id);
    if (error) return { error: (error as { message: string }).message };
  } else {
    // For insert, we need all key fields — default missing ones to null
    if (row.openai_api_key === undefined) row.openai_api_key = null;
    if (row.gemini_api_key === undefined) row.gemini_api_key = null;
    if (row.claude_api_key === undefined) row.claude_api_key = null;
    const { error } = await supabase
      .from(TABLE)
      .insert(row as never);
    if (error) return { error: (error as { message: string }).message };
  }

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

/**
 * Get the active AI service config for the current user.
 * Returns the API key, model, and service name.
 * Server-only — never exposed to client.
 */
export async function getAiSettingsForGeneration(): Promise<{
  service: AiService;
  apiKey: string;
  model: string;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from(TABLE)
    .select(
      "active_service, openai_api_key, gemini_api_key, claude_api_key, openai_model, gemini_model, claude_model"
    )
    .eq("owner_id" as never, user.id)
    .maybeSingle();

  const settings = data as unknown as AiSettingsRow | null;
  if (!settings?.active_service) return null;

  const service = settings.active_service as AiService;
  const keyMap: Record<AiService, string | null> = {
    openai: settings.openai_api_key,
    gemini: settings.gemini_api_key,
    claude: settings.claude_api_key,
  };
  const modelMap: Record<AiService, string> = {
    openai: settings.openai_model ?? "gpt-4.1",
    gemini: settings.gemini_model ?? "gemini-2.5-flash",
    claude: settings.claude_model ?? "claude-sonnet-4-20250514",
  };

  const apiKey = keyMap[service];
  if (!apiKey) return null;

  return { service, apiKey, model: modelMap[service] };
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
