/**
 * Types for user AI settings.
 * Maps to the `user_ai_settings` table and `os_ai_service` enum.
 */

/** AI service enum — matches PostgreSQL `os_ai_service`. */
export type AiService = "openai" | "gemini" | "claude";

/** Human-readable labels for each AI service. */
export const AI_SERVICE_LABELS: Record<AiService, string> = {
  openai: "OpenAI",
  gemini: "Google Gemini",
  claude: "Anthropic Claude",
};

/** Ordered list of AI service values. */
export const AI_SERVICE_VALUES: AiService[] = ["openai", "gemini", "claude"];

/**
 * Available models per AI service.
 * Kept in sync with each provider's public model list as of 2026-04.
 * Fast/balanced models (mini/flash/haiku) are placed at the top of each list
 * because most Sandbox Planner prompts are I/O-bound and benefit more from
 * low latency than from the extra reasoning depth of the flagship tiers.
 */
export const DEFAULT_MODELS: Record<AiService, string[]> = {
  openai: [
    "gpt-5-mini",
    "gpt-5-nano",
    "gpt-5",
    "gpt-4.1-mini",
    "gpt-4.1-nano",
    "gpt-4.1",
    "gpt-4o-mini",
    "gpt-4o",
    "o4-mini",
    "o3-mini",
    "o3",
    "o3-pro",
    "o1",
  ],
  gemini: [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro",
    "gemini-3-flash",
    "gemini-3-flash-lite",
    "gemini-3-pro",
  ],
  claude: [
    "claude-haiku-4-5",
    "claude-sonnet-4-5",
    "claude-sonnet-4-6",
    "claude-opus-4-5",
    "claude-opus-4-6",
    "claude-haiku-4-5-20251001",
    "claude-sonnet-4-20250514",
    "claude-opus-4-20250514",
  ],
};

/** Client-safe AI settings shape — API keys masked to booleans. */
export interface UserAiSettingsClient {
  activeService: AiService | null;
  openaiKeySet: boolean;
  geminiKeySet: boolean;
  claudeKeySet: boolean;
  openaiModel: string;
  geminiModel: string;
  claudeModel: string;
}

/** Payload sent from the settings form to the server action. */
export interface SaveAiSettingsPayload {
  activeService: AiService | null;
  /** undefined = keep existing key, empty string = clear key */
  openaiApiKey?: string;
  geminiApiKey?: string;
  claudeApiKey?: string;
  openaiModel: string;
  geminiModel: string;
  claudeModel: string;
}

// ── Agency record + agency-wide AI ───────────────────────────────────────────

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

