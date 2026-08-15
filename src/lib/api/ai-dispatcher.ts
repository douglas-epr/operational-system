/**
 * AI dispatcher — every AI generation request in the app goes through here.
 * The platform routes all text/JSON generation through OpenRouter, which
 * fronts OpenAI, Anthropic, Google and others behind one key and one schema.
 */

import type { AiService } from "@/types/settings";
import { generateOpenRouterResponse, generateOpenRouterJsonResponse } from "./openrouter";

export interface AiGenerationParams {
  /** Provider — always "openrouter"; kept so call sites can pass an AiConfig through. */
  service: AiService;
  /** Platform OpenRouter API key */
  apiKey: string;
  /** OpenRouter model slug (e.g. "openai/gpt-4.1") */
  model: string;
  /** The prompt text */
  prompt: string;
  /**
   * Max output tokens. For steps with large JSON responses (ICPs, PRD, Report)
   * pass 16384 to avoid truncation.
   */
  maxTokens?: number;
}

/** Generate a JSON response via OpenRouter. */
export async function generateAiJsonResponse<T = unknown>(
  params: AiGenerationParams
): Promise<{ data?: T; returned_an_error: boolean; error?: string }> {
  const { apiKey, model, prompt, maxTokens } = params;
  return generateOpenRouterJsonResponse<T>({ model, input: prompt, apiKey, maxTokens });
}

/**
 * Generate a plain-text response via OpenRouter.
 * Use this for free-form HTML or prose output (not JSON).
 */
export async function generateAiTextResponse(
  params: AiGenerationParams
): Promise<{ text?: string; returned_an_error: boolean; error?: string }> {
  const { apiKey, model, prompt, maxTokens } = params;
  const res = await generateOpenRouterResponse({ model, input: prompt, apiKey, maxTokens });
  return { returned_an_error: res.returned_an_error, text: res.text, error: res.status_message };
}
