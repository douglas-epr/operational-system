/**
 * AI dispatcher — routes AI generation requests to the correct provider.
 * Thin layer over openai.ts, gemini.ts, and claude.ts.
 */

import type { AiService } from "@/types/settings";
import { generateOpenAIResponse, generateOpenAIJsonResponse } from "./openai";
import { generateGeminiContent, generateGeminiJsonResponse } from "./gemini";
import { generateClaudeResponse, generateClaudeJsonResponse } from "./claude";

export interface AiGenerationParams {
  /** Which AI service to use */
  service: AiService;
  /** Decrypted API key for the service */
  apiKey: string;
  /** Model identifier (e.g. "gpt-4.1", "gemini-2.5-flash") */
  model: string;
  /** The prompt text */
  prompt: string;
  /**
   * Max output tokens. Defaults vary by provider (Claude: 8192, Gemini: model default).
   * For steps with large JSON responses (ICPs, PRD, Report) pass 16384 to avoid truncation.
   */
  maxTokens?: number;
}

/**
 * Generate a JSON response from the specified AI service.
 * Routes to the appropriate provider-specific function.
 */
export async function generateAiJsonResponse<T = unknown>(
  params: AiGenerationParams
): Promise<{ data?: T; returned_an_error: boolean; error?: string }> {
  const { service, apiKey, model, prompt, maxTokens } = params;

  switch (service) {
    case "openai":
      return generateOpenAIJsonResponse<T>({
        model,
        input: prompt,
        apiKey,
        maxTokens,
      });

    case "gemini":
      return generateGeminiJsonResponse<T>(prompt, model, apiKey, maxTokens);

    case "claude":
      return generateClaudeJsonResponse<T>({
        model,
        input: prompt,
        apiKey,
        maxTokens,
      });

    default:
      return {
        returned_an_error: true,
        error: `Unknown AI service: ${service}`,
      };
  }
}

/**
 * Generate a plain-text response from the specified AI service.
 * Use this for free-form HTML or prose output (not JSON).
 */
export async function generateAiTextResponse(
  params: AiGenerationParams
): Promise<{ text?: string; returned_an_error: boolean; error?: string }> {
  const { service, apiKey, model, prompt, maxTokens } = params;

  switch (service) {
    case "openai": {
      const res = await generateOpenAIResponse({ model, input: prompt, apiKey, maxTokens });
      return { returned_an_error: res.returned_an_error, text: res.text, error: res.status_message };
    }
    case "gemini": {
      const res = await generateGeminiContent({
        model,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        apiKey,
        generationConfig: maxTokens ? { maxOutputTokens: maxTokens } : undefined,
      });
      return { returned_an_error: res.returned_an_error, text: res.text, error: res.status_message };
    }
    case "claude": {
      const res = await generateClaudeResponse({ model, input: prompt, apiKey, maxTokens });
      return { returned_an_error: res.returned_an_error, text: res.text, error: res.status_message };
    }
    default:
      return { returned_an_error: true, error: `Unknown AI service: ${service}` };
  }
}
