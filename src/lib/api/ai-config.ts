/**
 * Shared resolver for the user's AI config (which provider + which API key
 * + which model to call).
 *
 * Resolution order (NEW, 2026-04-29):
 *
 *   1. Look up the caller's `user_ai_settings` row + `profiles.type`.
 *
 *   2. If the caller's profile.type is 'referrer' or 'lead':
 *        - PERSONAL ONLY. Return their personal config when active_service +
 *          matching api key are present; otherwise return null.
 *        - Skip the agency lookup AND the OPENAI_API_KEY env fallback —
 *          external referrers/leads never get agency-paid LLM calls or
 *          accidentally use a stale shared env key.
 *
 *   3. Otherwise (admin / manager / operational / developer / client / qa):
 *        a. If `use_agency_settings` is FALSE AND personal active_service +
 *           matching api key are present → use the personal config.
 *        b. Otherwise read the singleton `agency_ai_settings` via the
 *           service-role client (RLS bypass — non-admin LLM calls work,
 *           keys never reach the browser). If active_service + matching
 *           api key are present → use the agency config.
 *        c. Otherwise fall back to `OPENAI_API_KEY` env.
 *        d. Otherwise return null.
 *
 * Used by:
 *   - `src/app/sandbox-planner/actions.ts` (idea generation steps)
 *   - `src/app/chat/_chatbot/run.ts` (chatbot turns)
 *   - `src/app/chat/_chatbot/runProjectBot.ts` (project chatbot turns)
 *   - `src/app/projects/actions.ts::importTasksFromIdea`
 *
 * Returns `null` if nothing resolves — the caller surfaces a "configure AI
 * in Settings" message rather than silently no-op.
 */

import type { AiService } from "@/types/settings";
import { createServiceClient } from "@/lib/supabase/server";

export interface AiConfig {
  service: AiService;
  apiKey: string;
  model: string;
}

interface UserAiSettingsRow {
  active_service: string | null;
  openai_api_key: string | null;
  gemini_api_key: string | null;
  claude_api_key: string | null;
  openai_model: string | null;
  gemini_model: string | null;
  claude_model: string | null;
  use_agency_settings: boolean | null;
}

interface AgencyAiSettingsRow {
  active_service: string | null;
  openai_api_key: string | null;
  gemini_api_key: string | null;
  claude_api_key: string | null;
  openai_model: string | null;
  gemini_model: string | null;
  claude_model: string | null;
}

/**
 * Accept *any* shape of Supabase client so callers using the project's
 * typed `Database`-generic client and callers using a bare service-role
 * client both work without union-type spam at the call sites.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = any;

const PERSONAL_ONLY_ROLES: ReadonlySet<string> = new Set(["referrer", "lead"]);

const DEFAULT_MODELS: Record<AiService, string> = {
  openai: "gpt-4.1",
  gemini: "gemini-2.5-flash",
  claude: "claude-sonnet-4-20250514",
};

/** Build an AiConfig from a settings row, or null if it doesn't resolve. */
function configFromRow(
  row: UserAiSettingsRow | AgencyAiSettingsRow | null
): AiConfig | null {
  if (!row?.active_service) return null;
  const service = row.active_service as AiService;
  const keyMap: Record<AiService, string | null> = {
    openai: row.openai_api_key,
    gemini: row.gemini_api_key,
    claude: row.claude_api_key,
  };
  const modelMap: Record<AiService, string> = {
    openai: row.openai_model ?? DEFAULT_MODELS.openai,
    gemini: row.gemini_model ?? DEFAULT_MODELS.gemini,
    claude: row.claude_model ?? DEFAULT_MODELS.claude,
  };
  const apiKey = keyMap[service];
  if (!apiKey) return null;
  return { service, apiKey, model: modelMap[service] };
}

/** Service-role read of the singleton agency_ai_settings row. */
async function loadAgencyAiSettings(): Promise<AgencyAiSettingsRow | null> {
  try {
    const sb = createServiceClient();
    // The singleton agency. If multiple rows exist somehow, just take the
    // first — admins can clean it up. ORDER BY created_at so the choice is
    // deterministic.
    const { data: agency } = await sb
      .from("agency")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!agency) return null;
    const { data } = await sb
      .from("agency_ai_settings")
      .select(
        "active_service, openai_api_key, gemini_api_key, claude_api_key, openai_model, gemini_model, claude_model"
      )
      .eq("agency_id", (agency as { id: string }).id)
      .maybeSingle();
    return (data ?? null) as AgencyAiSettingsRow | null;
  } catch {
    return null;
  }
}

export async function resolveAiConfig(
  supabase: AnySupabaseClient,
  userId: string
): Promise<AiConfig | null> {
  // 1. Read the user's settings + role in parallel.
  const [{ data: userData }, { data: profileData }] = await Promise.all([
    supabase
      .from("user_ai_settings")
      .select(
        "active_service, openai_api_key, gemini_api_key, claude_api_key, openai_model, gemini_model, claude_model, use_agency_settings"
      )
      .eq("owner_id", userId)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("type")
      .eq("id", userId)
      .maybeSingle(),
  ]);
  const settings = (userData ?? null) as UserAiSettingsRow | null;
  const role = (profileData as { type?: string | null } | null)?.type ?? null;

  // 2. Personal-only roles (referrer / lead) never touch agency or env.
  if (role && PERSONAL_ONLY_ROLES.has(role)) {
    return configFromRow(settings);
  }

  // 3a. Personal keys win when the user has explicitly opted out of agency.
  const useAgency = settings?.use_agency_settings ?? true;
  if (!useAgency) {
    const personal = configFromRow(settings);
    if (personal) return personal;
    // Fall through to agency (if their personal keys are missing, treat it
    // as "I haven't set them up yet, please use whatever's available").
  }

  // 3b. Agency settings via service-role read.
  const agency = await loadAgencyAiSettings();
  const agencyConfig = configFromRow(agency);
  if (agencyConfig) return agencyConfig;

  // 3c. Last-resort env-var fallback.
  const envKey = process.env.OPENAI_API_KEY;
  if (envKey) return { service: "openai", apiKey: envKey, model: DEFAULT_MODELS.openai };

  return null;
}

/**
 * Resolve provider-specific image-generation keys (Gemini + OpenAI),
 * independent of the active TEXT service. Image generation needs a specific
 * provider, so we surface both keys when available.
 *
 * Order per provider: personal key → agency key → env var.
 */
export async function resolveImageKeys(
  supabase: AnySupabaseClient,
  userId: string
): Promise<{ gemini: string | null; openai: string | null }> {
  const { data: userData } = await supabase
    .from("user_ai_settings")
    .select("gemini_api_key, openai_api_key, use_agency_settings")
    .eq("owner_id", userId)
    .maybeSingle();
  const personal = (userData ?? null) as { gemini_api_key: string | null; openai_api_key: string | null } | null;

  const agency = await loadAgencyAiSettings();

  return {
    gemini: personal?.gemini_api_key ?? agency?.gemini_api_key ?? process.env.GEMINI_API_KEY ?? null,
    openai: personal?.openai_api_key ?? agency?.openai_api_key ?? process.env.OPENAI_API_KEY ?? null,
  };
}

/**
 * Server-action helper: enforce that referrer / lead profiles can never
 * flip `use_agency_settings` to TRUE. Used by `saveAiSettings` so a
 * crafted client-side request can't bypass the UI gate.
 */
export function clampUseAgencyForRole(
  requested: boolean | null | undefined,
  role: string | null
): boolean {
  if (role && PERSONAL_ONLY_ROLES.has(role)) return false;
  return requested ?? true;
}

export { PERSONAL_ONLY_ROLES };
