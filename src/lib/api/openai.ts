/**
 * OpenAI Responses API Utility
 * Source: docs/reference_docs/api-connectors.md — OpenAI connector
 * Endpoint: POST https://api.openai.com/v1/responses
 * Model used in Bubble: GPT-5 (or latest available)
 */

const OPENAI_API_URL = "https://api.openai.com/v1/responses";

// Server-side timeout: slightly less than the client-side 240s in useAiWithTimeout,
// so the server returns a clean error before the client gives up.
const AI_FETCH_TIMEOUT_MS = 230_000;

// ── Types ────────────────────────────────────────────────────────────────────

export interface OpenAIResponseOutputContent {
  type: string;
  text: string;
}

export interface OpenAIResponseOutput {
  id: string;
  type: string;
  status: string;
  role: string;
  content: OpenAIResponseOutputContent[];
}

export interface OpenAIUsage {
  input_tokens: number;
  input_tokens_details: { cached_tokens: number };
  output_tokens: number;
  output_tokens_details: { reasoning_tokens: number };
  total_tokens: number;
}

export interface OpenAIResponseBody {
  id: string;
  object: string;
  created_at: number;
  status: string;
  model: string;
  output: OpenAIResponseOutput[];
  usage: OpenAIUsage;
  error?: string;
}

export interface OpenAIResult {
  body?: OpenAIResponseBody;
  returned_an_error: boolean;
  status_code?: number;
  status_message?: string;
  /** Convenience: first text content from the first output message */
  text?: string;
}

export interface OpenAIRequestParams {
  /** Model to use, e.g. "gpt-4o", "o3", "gpt-4.1" */
  model: string;
  /** The prompt / user message */
  input: string;
  /** Response format type — "text" or "json_object" */
  format?: "text" | "json_object";
  /** Optional system instructions */
  instructions?: string;
  /** Optional API key — falls back to OPENAI_API_KEY env var */
  apiKey?: string;
  /** Max output tokens (maps to max_output_tokens in the Responses API body) */
  maxTokens?: number;
}

// ── Main function ─────────────────────────────────────────────────────────────

/**
 * Send a message to OpenAI via the Responses API.
 * Source: "Message" call in Bubble OpenAI connector.
 */
export async function generateOpenAIResponse(
  params: OpenAIRequestParams
): Promise<OpenAIResult> {
  const apiKey = params.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      returned_an_error: true,
      status_code: 0,
      status_message: "Missing OpenAI API key: provide apiKey param or set OPENAI_API_KEY env var",
    };
  }

  const { model, input, format = "text", instructions, maxTokens } = params;

  const body: Record<string, unknown> = {
    model,
    input,
    text: {
      format: { type: format },
    },
  };

  if (instructions) body.instructions = instructions;
  if (maxTokens) body.max_output_tokens = maxTokens;

  let res: Response;
  try {
    res = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
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
        ? `OpenAI request timed out after ${Math.round(AI_FETCH_TIMEOUT_MS / 1000)}s`
        : e instanceof Error ? e.message : "Network error",
    };
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return {
      returned_an_error: true,
      status_code: res.status,
      status_message: (err as { error?: { message?: string } }).error?.message ?? res.statusText,
    };
  }

  const data = (await res.json()) as OpenAIResponseBody;

  // Extract the first text content for convenience
  const text = data.output?.[0]?.content?.find((c) => c.type === "output_text")?.text;

  return {
    returned_an_error: false,
    body: data,
    text,
  };
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

/**
 * Generate a response and parse the output as JSON.
 * Used by Bubble's "Message (copy)" pattern — extract structured JSON from AI output.
 */
export async function generateOpenAIJsonResponse<T = unknown>(
  params: Omit<OpenAIRequestParams, "format">
): Promise<{ data?: T; returned_an_error: boolean; error?: string }> {
  const result = await generateOpenAIResponse({ ...params, format: "json_object" });

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

// ── Image generation (gpt-image-1) ────────────────────────────────────────────

const OPENAI_IMAGE_URL = "https://api.openai.com/v1/images/generations";

export interface OpenAIGeneratedImage {
  bytes: Buffer;
  mimeType: string;
}

/**
 * Generate an image from a text prompt using OpenAI's gpt-image-1 model.
 * gpt-image-1 always returns base64 (no URL), so we decode to bytes.
 */
export async function generateOpenAIImage(
  prompt: string,
  apiKey?: string
): Promise<{ image?: OpenAIGeneratedImage; returned_an_error: boolean; error?: string }> {
  const key = apiKey ?? process.env.OPENAI_API_KEY;
  if (!key) return { returned_an_error: true, error: "Missing OpenAI API key" };

  let res: Response;
  try {
    res = await fetch(OPENAI_IMAGE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        n: 1,
        size: "1024x1024",
      }),
      signal: AbortSignal.timeout(AI_FETCH_TIMEOUT_MS),
    });
  } catch (e) {
    return {
      returned_an_error: true,
      error: e instanceof Error ? e.message : "OpenAI image network error",
    };
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return {
      returned_an_error: true,
      error: (err as { error?: { message?: string } }).error?.message ?? res.statusText,
    };
  }

  const data = (await res.json()) as { data?: { b64_json?: string }[] };
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) return { returned_an_error: true, error: "OpenAI returned no image data" };

  return {
    returned_an_error: false,
    image: { bytes: Buffer.from(b64, "base64"), mimeType: "image/png" },
  };
}
