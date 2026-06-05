/**
 * Gemini (Google Generative AI) Utility
 * Source: docs/reference_docs/api-connectors.md — Gemini connector
 * Endpoint: POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key=API_KEY
 * Model used in Bubble: gemini-2.5-flash
 */

const GEMINI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";

// Server-side timeout: slightly less than the client-side 240s in useAiWithTimeout,
// so the server returns a clean error before the client gives up.
const AI_FETCH_TIMEOUT_MS = 230_000;

// ── Types ────────────────────────────────────────────────────────────────────

export interface GeminiPart {
  text: string;
}

export interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

export interface GeminiGenerationConfig {
  response_mime_type?: "application/json" | "text/plain";
  temperature?: number;
  maxOutputTokens?: number;
}

export interface GeminiCandidate {
  content: {
    parts: GeminiPart[];
    role: string;
  };
  finishReason: string;
  index: number;
}

export interface GeminiUsageMetadata {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
}

export interface GeminiResponseBody {
  candidates: GeminiCandidate[];
  usageMetadata: GeminiUsageMetadata;
  modelVersion: string;
}

export interface GeminiResult {
  body?: GeminiResponseBody;
  returned_an_error: boolean;
  status_code?: number;
  status_message?: string;
  /** Convenience: first text from first candidate */
  text?: string;
}

export interface GeminiRequestParams {
  /** Model name, e.g. "gemini-2.5-flash" (default) */
  model?: string;
  contents: GeminiContent[];
  generationConfig?: GeminiGenerationConfig;
  /** Optional API key — falls back to GEMINI_API_KEY env var */
  apiKey?: string;
}

// ── Main function ─────────────────────────────────────────────────────────────

/**
 * Generate content using the Gemini API.
 * Source: "Message" call in Bubble Gemini connector.
 */
export async function generateGeminiContent(
  params: GeminiRequestParams
): Promise<GeminiResult> {
  const apiKey = params.apiKey ?? process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing Gemini API key: provide apiKey param or set GEMINI_API_KEY env var");

  const { model = "gemini-2.5-flash", contents, generationConfig } = params;

  const url = `${GEMINI_BASE_URL}/${model}:generateContent?key=${apiKey}`;

  const body: Record<string, unknown> = { contents };
  if (generationConfig) body.generationConfig = generationConfig;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(AI_FETCH_TIMEOUT_MS),
    });
  } catch (e) {
    const isAbort = e instanceof DOMException && e.name === "TimeoutError";
    return {
      returned_an_error: true,
      status_code: isAbort ? 504 : 0,
      status_message: isAbort
        ? `Gemini request timed out after ${Math.round(AI_FETCH_TIMEOUT_MS / 1000)}s`
        : e instanceof Error ? e.message : "Network error",
    };
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return {
      returned_an_error: true,
      status_code: res.status,
      status_message:
        (err as { error?: { message?: string } }).error?.message ?? res.statusText,
    };
  }

  const data = (await res.json()) as GeminiResponseBody;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

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
  return s.trim();
}

/**
 * Generate content from Gemini and parse the output as JSON.
 * Mirrors Bubble's pattern of using response_mime_type: "application/json".
 */
export async function generateGeminiJsonResponse<T = unknown>(
  prompt: string,
  model = "gemini-2.5-flash",
  apiKey?: string
): Promise<{ data?: T; returned_an_error: boolean; error?: string }> {
  const result = await generateGeminiContent({
    model,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { response_mime_type: "application/json" },
    apiKey,
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

// ── Image generation ──────────────────────────────────────────────────────────

/**
 * Gemini image-generation models ("Nano Banana" family), tried in order.
 * These use :generateContent with inline image output. Names verified against
 * the live ListModels response — older "*-preview"/"*-image-generation"
 * aliases are NOT exposed on standard keys.
 */
const GEMINI_IMAGE_MODELS = [
  "gemini-2.5-flash-image",
  "gemini-3.1-flash-image",
];

export interface GeneratedImage {
  /** Raw image bytes. */
  bytes: Buffer;
  /** MIME type, e.g. "image/png". */
  mimeType: string;
}

/** Try a single Gemini image model. */
async function tryGeminiImageModel(
  model: string,
  prompt: string,
  key: string
): Promise<{ image?: GeneratedImage; error?: string }> {
  const url = `${GEMINI_BASE_URL}/${model}:generateContent?key=${key}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
      }),
      signal: AbortSignal.timeout(AI_FETCH_TIMEOUT_MS),
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "network error" };
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { error: `${model}: ${(err as { error?: { message?: string } }).error?.message ?? res.statusText}` };
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { inlineData?: { data: string; mimeType: string } }[] } }[];
  };
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const inline = parts.find((p) => p.inlineData)?.inlineData;
  if (!inline?.data) return { error: `${model}: no image data returned` };

  return { image: { bytes: Buffer.from(inline.data, "base64"), mimeType: inline.mimeType || "image/png" } };
}

/**
 * Generate an image from a text prompt using Gemini's image-generation model.
 * Tries each model in GEMINI_IMAGE_MODELS until one succeeds.
 */
export async function generateGeminiImage(
  prompt: string,
  apiKey?: string
): Promise<{ image?: GeneratedImage; returned_an_error: boolean; error?: string }> {
  const key = apiKey ?? process.env.GEMINI_API_KEY;
  if (!key) return { returned_an_error: true, error: "Missing Gemini API key" };

  const errors: string[] = [];
  for (const model of GEMINI_IMAGE_MODELS) {
    const r = await tryGeminiImageModel(model, prompt, key);
    if (r.image) return { returned_an_error: false, image: r.image };
    if (r.error) errors.push(r.error);
  }
  return { returned_an_error: true, error: errors.join(" | ") || "Gemini image generation failed" };
}
