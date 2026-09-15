/**
 * POST /api/m/[slug]/capture
 * Public endpoint — records a quiz/waitlist demand signal for a landing page.
 * Writes via the service-role client (see src/lib/marketing/public.ts).
 *
 * Called from inside the sandboxed `/m/[slug]` iframe, which (as of the S4
 * hardening) has an opaque origin (`Origin: null`) since `allow-same-origin`
 * was removed from the sandbox. Explicit CORS headers are required so the
 * browser's preflight and the POST itself succeed from that opaque origin.
 * This endpoint takes no credentials and is intentionally public, so
 * `Access-Control-Allow-Origin: *` is correct here — never pair it with
 * `allow-credentials`.
 */
import { NextResponse } from "next/server";
import { recordSignal } from "@/lib/marketing/public";
import type { MktSignalType } from "@/types/marketing";
import { checkRateLimit, clientIpFromRequest } from "@/lib/rate-limit";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const rl = checkRateLimit(`m-capture:${clientIpFromRequest(req)}:${slug}`, {
    limit: 5,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { ...CORS_HEADERS, "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  let body: {
    type?: MktSignalType;
    email?: string;
    name?: string;
    quizAnswers?: Record<string, unknown>;
    utm?: Record<string, unknown>;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400, headers: CORS_HEADERS });
  }

  if (!body.type) {
    return NextResponse.json({ error: "Missing signal type." }, { status: 400, headers: CORS_HEADERS });
  }

  const result = await recordSignal({
    slug,
    type: body.type,
    email: body.email,
    name: body.name,
    quizAnswers: body.quizAnswers,
    utm: body.utm,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400, headers: CORS_HEADERS });
  }
  return NextResponse.json({ ok: true, id: result.id }, { headers: CORS_HEADERS });
}
