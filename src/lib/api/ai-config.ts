/**
 * Shared resolver for the user's AI config (provider + API key + model).
 *
 * Resolution order:
 *   1. Read the caller's `user_ai_settings` row + `profiles.type`.
 *   2. `referrer` / `lead` roles: personal keys only — no env fallback.
 *   3. Everyone else: personal keys → OPENAI_API_KEY env last-resort → null.
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
}

/**
 * Accept *any* shape of Supabase client so callers using the project's
 * typed `Database`-generic client and callers using a bare service-role
 * client both work without union-type spam at the call sites.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = any;

export const PERSONAL_ONLY_ROLES: ReadonlySet<string> = new Set(["referrer", "lead"]);

const DEFAULT_MODELS: Record<AiService, string> = {
  openai: "gpt-4.1",
  gemini: "gemini-2.5-flash",
  claude: "claude-sonnet-4-20250514",
};

/** Build an AiConfig from a settings row, or null if it doesn't resolve. */
function configFromRow(row: UserAiSettingsRow | null): AiConfig | null {
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

export async function resolveAiConfig(
  supabase: AnySupabaseClient,
  userId: string
): Promise<AiConfig | null> {
  const [{ data: userData }, { data: profileData }] = await Promise.all([
    supabase
      .from("user_ai_settings")
      .select(
        "active_service, openai_api_key, gemini_api_key, claude_api_key, openai_model, gemini_model, claude_model"
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

  const personal = configFromRow(settings);
  if (personal) return personal;

  // Personal-only roles never get the env fallback.
  if (role && PERSONAL_ONLY_ROLES.has(role)) return null;

  const envKey = process.env.OPENAI_API_KEY;
  if (envKey) return { service: "openai", apiKey: envKey, model: DEFAULT_MODELS.openai };

  return null;
}

/**
 * Resolve provider-specific image-generation keys (Gemini + OpenAI).
 * Order per provider: personal key → env var.
 */
export async function resolveImageKeys(
  supabase: AnySupabaseClient,
  userId: string
): Promise<{ gemini: string | null; openai: string | null }> {
  const { data: userData } = await supabase
    .from("user_ai_settings")
    .select("gemini_api_key, openai_api_key")
    .eq("owner_id", userId)
    .maybeSingle();
  const personal = (userData ?? null) as { gemini_api_key: string | null; openai_api_key: string | null } | null;

  // Require the service-role client to be importable (unused now but kept for
  // consistency with the module's other service-role helpers).
  void createServiceClient;

  return {
    gemini: personal?.gemini_api_key ?? process.env.GEMINI_API_KEY ?? null,
    openai: personal?.openai_api_key ?? process.env.OPENAI_API_KEY ?? null,
  };
}
