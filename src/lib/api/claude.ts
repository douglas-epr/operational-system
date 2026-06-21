/**
 * Anthropic Claude API Utility
 * Endpoint: POST https://api.anthropic.com/v1/messages
 */

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

// Server-side timeout: slightly less than the client-side 240s in useAiWithTimeout,
// so the server returns a clean error before the client gives up.
const AI_FETCH_TIMEOUT_MS = 230_000;

// Retry config for transient Anthropic failures: 429 (rate limit),
// 529 (overloaded — common on flagship Sonnet/Opus during peak hours),
// 503 (service unavailable), and network-level aborts that weren't timeouts.
const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 1_200;
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 529]);

/**
 * Map short user-facing model aliases (e.g. "claude-sonnet-4-6") to the
 * versioned IDs that Anthropic's API accepts. Short aliases shown in the
 * Settings UI are convenient for users, but Anthropic's Messages API often
 * rejects ambiguous aliases, which was surfacing as intermittent errors.
 * Unknown / already-versioned IDs are passed through unchanged.
 */
const CLAUDE_MODEL_ALIASES: Record<string, string> = {
  "claude-haiku-4-5": "claude-haiku-4-5-20251001",
  "claude-sonnet-4-5": "claude-sonnet-4-5-20250929",
  "claude-opus-4-5": "claude-opus-4-5-20250929",
  // claude-sonnet-4-6, claude-opus-4-8 etc. are already valid API IDs — pass through unchanged
};

function resolveClaudeModel(model: string): string {
  return CLAUDE_MODEL_ALIASES[model] ?? model;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface ClaudeContentBlock {
  type: "text";
  text: string;
}

export interface ClaudeResponseBody {
  id: string;
  type: "message";
  role: "assistant";
  content: ClaudeContentBlock[];
  model: string;
  stop_reason: "end_turn" | "max_tokens" | "stop_sequence" | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface ClaudeResult {
  body?: ClaudeResponseBody;
  returned_an_error: boolean;
  status_code?: number;
  status_message?: string;
  /** Convenience: first text content from the response */
  text?: string;
}

export interface ClaudeRequestParams {
  /** Model to use, e.g. "claude-sonnet-4-20250514" */
  model: string;
  /** The prompt / user message */
  input: string;
  /** Optional system instructions */
  instructions?: string;
  /** Max tokens to generate (default: 4096) */
  maxTokens?: number;
  /** Optional API key — falls back to CLAUDE_API_KEY env var */
  apiKey?: string;
}

// ── Main function ─────────────────────────────────────────────────────────────

/**
 * Send a message to the Anthropic Claude Messages API.
 *
 * Retries transient failures (429 rate-limit, 529 overloaded, 503
 * service-unavailable, 5xx, and network errors) with exponential backoff.
 * `claude-sonnet-4-6` and other short aliases are resolved to their
 * versioned API IDs via CLAUDE_MODEL_ALIASES.
 */
export async function generateClaudeResponse(
  params: ClaudeRequestParams
): Promise<ClaudeResult> {
  const apiKey = params.apiKey ?? process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    return {
      returned_an_error: true,
      status_code: 0,
      status_message: "Missing Claude API key: provide apiKey param or set CLAUDE_API_KEY env var",
    };
  }

  const { input, instructions, maxTokens = 8192 } = params;
  const model = resolveClaudeModel(params.model);

  const body: Record<string, unknown> = {
    model,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: input }],
  };

  if (instructions) {
    body.system = instructions;
  }

  let lastStatusCode: number | undefined;
  let lastStatusMessage: string | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    let res: Response;
    // Use AbortController + setTimeout instead of AbortSignal.timeout() —
    // the static factory doesn't fire reliably in Next.js dev (patched fetch).
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_FETCH_TIMEOUT_MS);
    try {
      res = await fetch(CLAUDE_API_URL, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": ANTHROPIC_VERSION,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (e) {
      clearTimeout(timeoutId);
      // AbortController fires with AbortError; also catch DOMException TimeoutError for safety.
      const isAbort =
        (e instanceof DOMException && (e.name === "AbortError" || e.name === "TimeoutError")) ||
        (e instanceof Error && e.name === "AbortError");
      // Timeouts are NOT retried — the user is waiting, and retrying a
      // 230s timeout would blow past the client-side 240s budget.
      if (isAbort) {
        return {
          returned_an_error: true,
          status_code: 504,
          status_message: `Claude request timed out after ${Math.round(
            AI_FETCH_TIMEOUT_MS / 1000
          )}s (model: ${model})`,
        };
      }
      // Network / DNS flake — retry with backoff.
      lastStatusCode = 0;
      lastStatusMessage = e instanceof Error ? e.message : "Network error";
      if (attempt < MAX_RETRIES) {
        await sleep(BASE_BACKOFF_MS * Math.pow(2, attempt));
        continue;
      }
      return {
        returned_an_error: true,
        status_code: lastStatusCode,
        status_message: lastStatusMessage,
      };
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const providerMessage =
        (err as { error?: { message?: string } }).error?.message ??
        res.statusText;
      lastStatusCode = res.status;
      lastStatusMessage = providerMessage;

      if (RETRYABLE_STATUS.has(res.status) && attempt < MAX_RETRIES) {
        // Honour Retry-After if Anthropic sends one, else exponential backoff.
        const retryAfterHeader = res.headers.get("retry-after");
        const retryAfterMs = retryAfterHeader
          ? Math.max(0, Number(retryAfterHeader) * 1000)
          : BASE_BACKOFF_MS * Math.pow(2, attempt);
        await sleep(isFinite(retryAfterMs) ? retryAfterMs : BASE_BACKOFF_MS);
        continue;
      }

      return {
        returned_an_error: true,
        status_code: res.status,
        status_message:
          res.status === 529
            ? `Claude is temporarily overloaded (model: ${model}). Please try again in a moment.`
            : providerMessage,
      };
    }

    const data = (await res.json()) as ClaudeResponseBody;
    const text = data.content?.find((c) => c.type === "text")?.text;

    return {
      returned_an_error: false,
      body: data,
      text,
    };
  }

  // All retries exhausted without a success.
  return {
    returned_an_error: true,
    status_code: lastStatusCode ?? 0,
    status_message:
      lastStatusMessage ??
      `Claude request failed after ${MAX_RETRIES + 1} attempts (model: ${model})`,
  };
}

// ── Convenience: generate + parse JSON response ───────────────────────────────

/**
 * Strip markdown code fences and extract the JSON object from an AI response.
 * Handles: ```json...```, ```...```, and any leading/trailing prose.
 * Also escapes bare control characters (newlines, tabs) inside JSON string
 * values, which Claude sometimes emits and which break JSON.parse().
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
  // A regex cannot reliably distinguish "inside a string" from structural JSON.
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
 * Generate a response from Claude and parse the output as JSON.
 */
export async function generateClaudeJsonResponse<T = unknown>(
  params: Omit<ClaudeRequestParams, "instructions"> & { instructions?: string }
): Promise<{ data?: T; returned_an_error: boolean; error?: string }> {
  const result = await generateClaudeResponse({
    ...params,
    instructions: [
      params.instructions,
      "Return ONLY valid JSON. Do not include markdown code fences or any text outside the JSON object.",
    ]
      .filter(Boolean)
      .join("\n\n"),
  });

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
