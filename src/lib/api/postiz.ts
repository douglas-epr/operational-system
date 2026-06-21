/**
 * Postiz public API client (social scheduling — replaces Ayrshare).
 * Verified live: base https://api.postiz.com/public/v1, auth header is the raw
 * API key in `Authorization` (NO "Bearer" prefix).
 *
 *   GET  /integrations  → connected channels
 *   POST /posts         → schedule/now across one or many channels
 *
 * Server-only. Used by the content-studio actions and the publish cron worker.
 */

import "server-only";

const BASE = process.env.POSTIZ_API_URL || "https://api.postiz.com/public/v1";

function apiKey(): string {
  const k = process.env.POSTIZ_API_KEY;
  if (!k) throw new Error("Missing env: POSTIZ_API_KEY");
  return k;
}

const POSTIZ_TIMEOUT_MS = 20_000;

async function postizFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    ...init,
    signal: init?.signal ?? AbortSignal.timeout(POSTIZ_TIMEOUT_MS),
    headers: {
      Authorization: apiKey(), // raw key, no Bearer
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

// ── Channels ("integrations" in the API) ────────────────────────────────────

export interface PostizChannel {
  id: string;
  name: string;
  /** Provider identifier, e.g. "linkedin" | "x" | "instagram" | "facebook". */
  identifier: string;
  picture: string | null;
  disabled: boolean;
}

/** List connected channels. Returns [] if none are connected yet. */
export async function listChannels(): Promise<PostizChannel[]> {
  const res = await postizFetch("/integrations");
  if (!res.ok) return [];
  const data = (await res.json().catch(() => [])) as unknown;
  if (!Array.isArray(data)) return [];
  return data.map((raw) => {
    const r = raw as Record<string, unknown>;
    return {
      id: String(r.id ?? ""),
      name: String(r.name ?? r.identifier ?? "Channel"),
      identifier: String(r.identifier ?? r.provider ?? ""),
      picture:
        (r.picture as string) ??
        ((r.profile as Record<string, unknown> | undefined)?.picture as string) ??
        null,
      disabled: Boolean(r.disabled ?? false),
    };
  });
}

// ── Posting ──────────────────────────────────────────────────────────────────

export interface SchedulePostInput {
  /** "schedule" (future-dated) or "now" (immediate). */
  type: "schedule" | "now";
  /** ISO datetime; required for "schedule". */
  date: string;
  /** Plain text body, applied to every selected channel. */
  content: string;
  /** Channels to post to (id + identifier from listChannels). */
  channels: { id: string; identifier: string }[];
  /** Optional uploaded media URLs to attach. */
  imageUrls?: string[];
}

export interface SchedulePostResult {
  returned_an_error: boolean;
  status?: number;
  error?: string;
  /** Map of channel id → external post id (stored in mkt_content.external_post_ids). */
  postIds?: Record<string, string>;
  raw?: unknown;
}

/**
 * Schedule (or immediately publish) a post to one or more channels.
 * Each channel gets its own entry in `posts[]` with a provider-typed `settings`.
 */
export async function schedulePost(
  input: SchedulePostInput
): Promise<SchedulePostResult> {
  if (input.channels.length === 0) {
    return { returned_an_error: true, error: "No channels selected." };
  }

  const images = (input.imageUrls ?? []).map((url) => ({ id: url, path: url }));

  const body = {
    type: input.type,
    date: input.date,
    shortLink: false,
    tags: [] as string[],
    posts: input.channels.map((ch) => ({
      integration: { id: ch.id },
      value: [{ content: input.content, image: images }],
      settings: { __type: ch.identifier },
    })),
  };

  const res = await postizFetch("/posts", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const raw = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      returned_an_error: true,
      status: res.status,
      error:
        (raw as { msg?: string; message?: string }).msg ??
        (raw as { message?: string }).message ??
        `Postiz error ${res.status}`,
      raw,
    };
  }

  // Best-effort extraction of returned post ids, keyed by channel id.
  const postIds: Record<string, string> = {};
  const arr = Array.isArray(raw) ? raw : (raw as { posts?: unknown[] }).posts;
  if (Array.isArray(arr)) {
    arr.forEach((p, i) => {
      const rec = p as Record<string, unknown>;
      const channelId =
        (rec.integrationId as string) ??
        input.channels[i]?.id ??
        String(i);
      const postId = (rec.id ?? rec.postId ?? "") as string;
      if (postId) postIds[channelId] = String(postId);
    });
  }

  return { returned_an_error: false, status: res.status, postIds, raw };
}
