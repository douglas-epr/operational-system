/**
 * POST /api/m/event
 * Public analytics beacon — records a landing-page view/click event.
 * Best-effort; always returns 200 so the client beacon never blocks.
 *
 * Called from inside the sandboxed `/m/[slug]` iframe, which (as of the S4
 * hardening) has an opaque origin (`Origin: null`) since `allow-same-origin`
 * was removed from the sandbox. Explicit CORS headers are required so the
 * browser's preflight (triggered by the JSON content-type) and the POST
 * itself succeed from that opaque origin. This endpoint takes no
 * credentials and is intentionally public, so `Access-Control-Allow-Origin:
 * *` is correct here — never pair it with `allow-credentials`.
 */
import { NextResponse } from "next/server";
import { recordEvent } from "@/lib/marketing/public";
import { checkRateLimit, clientIpFromRequest } from "@/lib/rate-limit";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: Request) {
  // Generous limit — this is a high-frequency tracker beacon, not a
  // sensitive writer. 429 is an acceptable outcome when tripped; a
  // non-throttled request keeps its existing best-effort 200 behavior.
  const rl = checkRateLimit(`m-event:${clientIpFromRequest(req)}`, { limit: 60, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false },
      { status: 429, headers: { ...CORS_HEADERS, "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  let body: {
    slug?: string;
    type?: string;
    sessionId?: string;
    utm?: Record<string, unknown>;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { headers: CORS_HEADERS });
  }

  if (!body.slug || !body.type) {
    return NextResponse.json({ ok: false }, { headers: CORS_HEADERS });
  }

  await recordEvent({
    slug: body.slug,
    type: body.type,
    sessionId: body.sessionId,
    utm: body.utm,
  });

  return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
}
