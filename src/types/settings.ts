/**
 * Types for user AI settings. Maps to the `user_ai_settings` table.
 *
 * Since 2026-08-14 the platform routes ALL AI generation through OpenRouter
 * using a single platform-owned key — users no longer supply their own keys.
 * The only per-user preference left is which OpenRouter model to use, so the
 * old `os_ai_service` enum and the per-provider key columns are gone.
 */

/** The single provider the app generates through. */
export type AiService = "openrouter";

/** The only provider the app talks to. */
export const AI_SERVICE: AiService = "openrouter";

/** Default OpenRouter model — the prompt suite is tuned against it. */
export const DEFAULT_OPENROUTER_MODEL = "openai/gpt-4.1";

/**
 * Curated OpenRouter models offered in Settings, balanced-first.
 * Slugs verified against https://openrouter.ai/api/v1/models (2026-08-14).
 */
export const OPENROUTER_MODELS: { id: string; label: string }[] = [
  { id: "openai/gpt-4.1", label: "GPT-4.1 (balanced default)" },
  { id: "openai/gpt-4.1-mini", label: "GPT-4.1 Mini (fastest)" },
  { id: "openai/gpt-5.4-mini", label: "GPT-5.4 Mini" },
  { id: "openai/gpt-5.4", label: "GPT-5.4" },
  { id: "openai/gpt-5.2", label: "GPT-5.2" },
  { id: "anthropic/claude-haiku-4.5", label: "Claude Haiku 4.5" },
  { id: "anthropic/claude-sonnet-4.5", label: "Claude Sonnet 4.5" },
  { id: "anthropic/claude-sonnet-4.6", label: "Claude Sonnet 4.6" },
  { id: "anthropic/claude-opus-4.6", label: "Claude Opus 4.6" },
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { id: "google/gemini-3.5-flash", label: "Gemini 3.5 Flash" },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  { id: "x-ai/grok-4.6", label: "Grok 4.6" },
  { id: "deepseek/deepseek-chat-v3.1", label: "DeepSeek Chat v3.1" },
];

/** Client-safe AI settings shape. No keys — the platform owns the key. */
export interface UserAiSettingsClient {
  model: string;
}

/** Payload sent from the settings form to the server action. */
export interface SaveAiSettingsPayload {
  model: string;
}

// ── Agency record ────────────────────────────────────────────────────────────

/** One-row "this is the agency that owns this install" record. */
export interface Agency {
  id: string;
  name: string;
  website: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaveAgencyInfoPayload {
  name: string;
  website?: string | null;
}
