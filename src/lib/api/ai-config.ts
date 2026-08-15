/**
 * Shared resolver for the AI config used by every generation call site.
 *
 * Since 2026-08-14 the platform owns a single OpenRouter key (OPENROUTER_API_KEY)
 * and every user shares it — nobody supplies their own key any more. The only
 * per-user preference left is which OpenRouter model to use; missing or invalid
 * preferences fall back to DEFAULT_OPENROUTER_MODEL.
 */

import { AI_SERVICE, DEFAULT_OPENROUTER_MODEL, type AiService } from "@/types/settings";

export interface AiConfig {
  service: AiService;
  apiKey: string;
  model: string;
}

/**
 * Accept *any* shape of Supabase client so callers using the project's
 * typed `Database`-generic client and callers using a bare service-role
 * client both work without union-type spam at the call sites.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = any;

export async function resolveAiConfig(
  supabase: AnySupabaseClient,
  userId: string
): Promise<AiConfig | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const { data } = await supabase
    .from("user_ai_settings")
    .select("openrouter_model")
    .eq("owner_id", userId)
    .maybeSingle();

  const model =
    (data as { openrouter_model?: string | null } | null)?.openrouter_model ||
    DEFAULT_OPENROUTER_MODEL;

  return { service: AI_SERVICE, apiKey, model };
}

/**
 * Resolve provider-specific image-generation keys (Gemini + OpenAI).
 * Image generation still calls the providers directly, so it keeps using
 * the platform env keys rather than OpenRouter.
 */
export async function resolveImageKeys(): Promise<{ gemini: string | null; openai: string | null }> {
  return {
    gemini: process.env.GEMINI_API_KEY ?? null,
    openai: process.env.OPENAI_API_KEY ?? null,
  };
}
