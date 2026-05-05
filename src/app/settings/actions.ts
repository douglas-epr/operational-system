/**
 * Server actions for the Settings page:
 *   - Per-user AI config (`user_ai_settings`)
 *   - Agency record (`agency`)            — admin-only edit
 *   - Agency-wide AI config (`agency_ai_settings`) — admin/manager edit
 *
 * The agency-AI helpers also expose a `getAgencyAiSettingsSummary` server
 * action that returns just `{active_service, has_*_key, models}` (no raw
 * keys) — used by the per-user form to render a read-only preview when
 * the user has the "Use my agency's AI keys" toggle ON.
 */
"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { clampUseAgencyForRole, PERSONAL_ONLY_ROLES } from "@/lib/api/ai-config";
import type {
  AiService,
  SaveAgencyAiSettingsPayload,
  SaveAgencyInfoPayload,
  SaveAiSettingsPayload,
  Agency,
  AgencyAiSettingsSummary,
} from "@/types/settings";

const PATH = "/settings";
const TABLE = "user_ai_settings" as never;
const AGENCY_TABLE = "agency" as never;
const AGENCY_AI_TABLE = "agency_ai_settings" as never;

void PERSONAL_ONLY_ROLES; // re-exported for tests; unused at runtime here.

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

  // Resolve the caller's role so we can enforce the referrer/lead gate
  // server-side: those roles can NEVER set use_agency_settings = TRUE.
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("type")
    .eq("id", user.id)
    .maybeSingle();
  const role = (profileRow as { type?: string | null } | null)?.type ?? null;
  const useAgency = clampUseAgencyForRole(payload.useAgencySettings, role);

  // Build the row to upsert
  const row: Record<string, unknown> = {
    owner_id: user.id,
    active_service: payload.activeService,
    openai_model: payload.openaiModel,
    gemini_model: payload.geminiModel,
    claude_model: payload.claudeModel,
    use_agency_settings: useAgency,
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
  revalidatePath("/sandbox-planner");
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

// ── Agency AI settings (admin/manager only) ───────────────────────────────────

/**
 * Public summary used by the per-user AI form to render the read-only
 * "Using agency keys" preview. NEVER returns the raw keys.
 */
export async function getAgencyAiSettingsSummary(): Promise<AgencyAiSettingsSummary | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // The agency_ai_settings row carries the keys; only admin/manager can read
  // it via the user-scoped client. For everyone else we still want to show
  // *whether* the agency has keys configured for each service, so a
  // service-role probe runs but only returns booleans + service/model.
  const { data: { } } = { data: {} } as { data: Record<string, never> };

  // Check the agency exists at all.
  const { data: agencyRow } = await supabase
    .from(AGENCY_TABLE)
    .select("id")
    .order("created_at" as never, { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!agencyRow) return null;

  // For elevated users, read directly via the RLS-clamped client (works,
  // since their policy allows SELECT). For everyone else, ask the server
  // resolver — but we can't expose keys, so we use service-role here and
  // strip the keys before returning.
  const { createServiceClient } = await import("@/lib/supabase/server");
  const sb = createServiceClient();
  const { data } = await sb
    .from("agency_ai_settings")
    .select(
      "active_service, openai_api_key, gemini_api_key, claude_api_key, openai_model, gemini_model, claude_model"
    )
    .eq("agency_id", (agencyRow as { id: string }).id)
    .maybeSingle();
  if (!data) return null;
  const r = data as Record<string, string | null>;
  return {
    active_service: (r.active_service as AiService | null) ?? null,
    has_openai_key: Boolean(r.openai_api_key),
    has_gemini_key: Boolean(r.gemini_api_key),
    has_claude_key: Boolean(r.claude_api_key),
    openai_model: r.openai_model,
    gemini_model: r.gemini_model,
    claude_model: r.claude_model,
  };
}

/**
 * Read the full agency_ai_settings row (keys included). Only admin/manager
 * succeed (RLS policy gates it); the wrapper checks the role for a
 * friendlier UI error.
 */
export async function getAgencyAiSettings(): Promise<{
  agency_id: string;
  active_service: AiService | null;
  openai_api_key: string | null;
  gemini_api_key: string | null;
  claude_api_key: string | null;
  openai_model: string | null;
  gemini_model: string | null;
  claude_model: string | null;
} | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("type")
    .eq("id", user.id)
    .maybeSingle();
  const role = (profileRow as { type?: string | null } | null)?.type ?? null;
  if (role !== "admin" && role !== "manager") return null;

  const { data: agencyRow } = await supabase
    .from(AGENCY_TABLE)
    .select("id")
    .order("created_at" as never, { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!agencyRow) return null;

  const { data } = await supabase
    .from(AGENCY_AI_TABLE)
    .select(
      "agency_id, active_service, openai_api_key, gemini_api_key, claude_api_key, openai_model, gemini_model, claude_model"
    )
    .eq("agency_id" as never, (agencyRow as { id: string }).id)
    .maybeSingle();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? null) as any;
}

/**
 * Upsert the agency AI settings. Admin/manager only. Mirrors saveAiSettings
 * but on the agency table.
 */
export async function saveAgencyAiSettings(
  payload: SaveAgencyAiSettingsPayload
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
  if (role !== "admin" && role !== "manager") {
    return { error: "Only admins and managers can edit agency AI settings." };
  }

  const { data: agencyRow } = await supabase
    .from(AGENCY_TABLE)
    .select("id")
    .order("created_at" as never, { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!agencyRow) {
    return { error: "Set the Agency information first (under Agency)." };
  }
  const agencyId = (agencyRow as { id: string }).id;

  const row: Record<string, unknown> = {
    agency_id: agencyId,
    active_service: payload.activeService,
    openai_model: payload.openaiModel,
    gemini_model: payload.geminiModel,
    claude_model: payload.claudeModel,
  };
  if (payload.openaiApiKey !== undefined) row.openai_api_key = payload.openaiApiKey || null;
  if (payload.geminiApiKey !== undefined) row.gemini_api_key = payload.geminiApiKey || null;
  if (payload.claudeApiKey !== undefined) row.claude_api_key = payload.claudeApiKey || null;

  const { data: existing } = await supabase
    .from(AGENCY_AI_TABLE)
    .select("agency_id")
    .eq("agency_id" as never, agencyId)
    .maybeSingle();

  if (existing) {
    const { agency_id: _aid, ...updateData } = row;
    void _aid;
    const { error } = await supabase
      .from(AGENCY_AI_TABLE)
      .update(updateData as never)
      .eq("agency_id" as never, agencyId);
    if (error) return { error: error.message };
  } else {
    if (row.openai_api_key === undefined) row.openai_api_key = null;
    if (row.gemini_api_key === undefined) row.gemini_api_key = null;
    if (row.claude_api_key === undefined) row.claude_api_key = null;
    const { error } = await supabase
      .from(AGENCY_AI_TABLE)
      .insert(row as never);
    if (error) return { error: error.message };
  }

  revalidatePath(PATH);
  revalidatePath("/sandbox-planner");
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
