import "server-only";
import { timingSafeEqual } from "node:crypto";

/**
 * Constant-time string comparison for secrets (CRON_SECRET, webhook tokens).
 * Avoids the timing side-channel of `a === b`. Returns false on any mismatch,
 * including length mismatch, without throwing.
 */
export function secretEquals(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** True when the request carries `Authorization: Bearer <secret>` (constant-time). */
export function hasBearerSecret(req: Request, secret: string | undefined): boolean {
  if (!secret) return false;
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return false;
  return secretEquals(header.slice("Bearer ".length), secret);
}
