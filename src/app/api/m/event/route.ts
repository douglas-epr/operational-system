/**
 * POST /api/m/event
 * Public analytics beacon — records a landing-page view/click event.
 * Best-effort; always returns 200 so the client beacon never blocks.
 */
import { NextResponse } from "next/server";
import { recordEvent } from "@/lib/marketing/public";

export async function POST(req: Request) {
  let body: {
    slug?: string;
    type?: string;
    sessionId?: string;
    utm?: Record<string, unknown>;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false });
  }

  if (!body.slug || !body.type) {
    return NextResponse.json({ ok: false });
  }

  await recordEvent({
    slug: body.slug,
    type: body.type,
    sessionId: body.sessionId,
    utm: body.utm,
  });

  return NextResponse.json({ ok: true });
}
