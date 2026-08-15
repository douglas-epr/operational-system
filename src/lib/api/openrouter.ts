/**
 * OpenRouter Chat Completions Utility
 * Endpoint: POST https://openrouter.ai/api/v1/chat/completions
 *
 * OpenRouter speaks the OpenAI *Chat Completions* schema (messages[]), not the
 * newer *Responses* schema used by openai.ts — hence a separate client.
 */

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Server-side timeout: slightly less than the client-side 240s in useAiWithTimeout,
// so the server returns a clean error before the client gives up.
const AI_FETCH_TIMEOUT_MS = 230_000;

// ── Types ────────────────────────────────────────────────────────────────────

export interface OpenRouterResult {
  returned_an_error: boolean;
  status_code?: number;
  status_message?: string;
  text?: string;
}

export interface OpenRouterRequestParams {
  /** OpenRouter model slug, e.g. "openai/gpt-4.1", "anthropic/claude-sonnet-4.6" */
  model: string;
  /** The prompt / user message */
  input: string;
  /** Response format — "text" or "json_object" */
  format?: "text" | "json_object";
  /** Optional system instructions */
  instructions?: string;
  /** Platform API key */
  apiKey: string;
  /** Max output tokens */
  maxTokens?: number;
}

interface OpenRouterResponseBody {
  choices?: { message?: { content?: string | null } }[];
  error?: { message?: string };
}

// ── Main function ─────────────────────────────────────────────────────────────

/** Send a prompt to OpenRouter and return the assistant text. */
export async function generateOpenRouterResponse(
  params: OpenRouterRequestParams
): Promise<OpenRouterResult> {
  const { model, input, format = "text", instructions, apiKey, maxTokens } = params;

  if (!apiKey) {
    return {
      returned_an_error: true,
      status_code: 0,
      status_message: "Missing OpenRouter API key — set OPENROUTER_API_KEY.",
    };
  }

  const messages: { role: string; content: string }[] = [];
  if (instructions) messages.push({ role: "system", content: instructions });
  messages.push({ role: "user", content: input });

  const body: Record<string, unknown> = { model, messages };
  if (format === "json_object") body.response_format = { type: "json_object" };
  if (maxTokens) body.max_tokens = maxTokens;

  let res: Response;
  try {
    res = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // Optional OpenRouter attribution headers.
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://move37.fun",
        "X-Title": "Move37 Operational System",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(AI_FETCH_TIMEOUT_MS),
    });
  } catch (e) {
    const isAbort = e instanceof DOMException && e.name === "TimeoutError";
    return {
      returned_an_error: true,
      status_code: isAbort ? 504 : 0,
      status_message: isAbort
        ? `OpenRouter request timed out after ${Math.round(AI_FETCH_TIMEOUT_MS / 1000)}s`
        : e instanceof Error ? e.message : "Network error",
    };
  }

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as OpenRouterResponseBody;
    return {
      returned_an_error: true,
      status_code: res.status,
      status_message: err.error?.message ?? res.statusText,
    };
  }

  const data = (await res.json()) as OpenRouterResponseBody;
  // OpenRouter can return HTTP 200 with an error payload when an upstream provider fails.
  if (data.error) {
    return { returned_an_error: true, status_code: 502, status_message: data.error.message };
  }

  const text = data.choices?.[0]?.message?.content ?? undefined;
  if (!text) {
    return { returned_an_error: true, status_code: 502, status_message: "OpenRouter returned no content" };
  }

  return { returned_an_error: false, text };
}

// ── Convenience: generate + parse JSON response ───────────────────────────────

/**
 * Strip markdown code fences and extract the JSON object from an AI response.
 * Handles: ```json...```, ```...```, and any leading/trailing prose.
 */
function sanitizeJsonText(text: string): string {
  let s = text.trim();
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    s = s.slice(start, end + 1);
  }
  // Escape bare control chars inside JSON string values using a state machine.
  let inString = false;
  let wasEscaped = false;
  let result = "";
  for (const ch of s) {
    if (wasEscaped) {
      result += ch;
      wasEscaped = false;
    } else if (ch === "\\") {
      result += ch;
      wasEscaped = true;
    } else if (ch === '"') {
      result += ch;
      inString = !inString;
    } else if (inString && ch === "\n") {
      result += "\\n";
    } else if (inString && ch === "\r") {
      result += "\\r";
    } else if (inString && ch === "\t") {
      result += "\\t";
    } else {
      result += ch;
    }
  }
  return result.trim();
}

/** Generate a response and parse the output as JSON. */
export async function generateOpenRouterJsonResponse<T = unknown>(
  params: Omit<OpenRouterRequestParams, "format">
): Promise<{ data?: T; returned_an_error: boolean; error?: string }> {
  const result = await generateOpenRouterResponse({ ...params, format: "json_object" });

  if (result.returned_an_error || !result.text) {
    return {
      returned_an_error: true,
      error: result.status_message ?? "No response text",
    };
  }

  const sanitized = sanitizeJsonText(result.text);
  try {
    const data = JSON.parse(sanitized) as T;
    return { returned_an_error: false, data };
  } catch {
    return {
      returned_an_error: true,
      error: `Failed to parse JSON response: ${sanitized.slice(0, 300)}`,
    };
  }
}
