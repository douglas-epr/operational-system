/**
 * In-memory, per-instance, fixed-window rate limiter. Dependency-free.
 *
 * IMPORTANT — per-instance only: Vercel serverless/edge functions do not
 * share memory across invocations or regions, so this limiter is
 * best-effort — a client can get a fresh window by hitting a different
 * lambda instance. It still stops naive floods from a single warm instance
 * and cheaply shapes traffic, but it is NOT the authoritative control.
 * The authoritative limit is the Vercel Firewall rate-limit rule documented
 * in `architecture.md` (per-IP rules on `/api/m/*` and `/api/webhooks/*`),
 * which is enforced at the edge in front of every instance. Treat every
 * limit here as a courtesy throttle layered under that WAF rule, not a
 * replacement for it.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

export interface RateLimitOptions {
  /** Max requests allowed within the window. */
  limit: number;
  /** Window size in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds: number;
}

// Hard cap so a flood of distinct keys (e.g. spoofed IPs) can't grow this
// map without bound. When full, the oldest bucket (by resetAt) is evicted
// to make room — a cheap approximation of LRU that's good enough for a
// best-effort, per-instance limiter.
const MAX_ENTRIES = 10_000;

const buckets = new Map<string, Bucket>();

function evictExpired(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

function evictOldestIfFull(): void {
  if (buckets.size < MAX_ENTRIES) return;
  let oldestKey: string | null = null;
  let oldestResetAt = Infinity;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < oldestResetAt) {
      oldestResetAt = bucket.resetAt;
      oldestKey = key;
    }
  }
  if (oldestKey !== null) buckets.delete(oldestKey);
}

/**
 * Fixed-window check-and-increment. Returns `{ ok: false, retryAfterSeconds }`
 * once `opts.limit` requests have been recorded for `key` within the current
 * window; otherwise records the request and returns `{ ok: true, ... }`.
 */
export function checkRateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();

  // Lazy eviction: cheap sweep of expired entries on each call keeps the
  // map from growing unbounded between requests, without a background timer.
  evictExpired(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    evictOldestIfFull();
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }

  if (existing.count >= opts.limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000) };
  }

  existing.count += 1;
  return { ok: true, retryAfterSeconds: 0 };
}

/** Derive the rate-limit key's client IP from standard proxy headers. */
export function clientIpFromRequest(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
