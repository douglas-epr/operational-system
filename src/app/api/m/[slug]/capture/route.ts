/**
 * POST /api/m/[slug]/capture
 * Public endpoint — records a quiz/waitlist demand signal for a landing page.
 * Writes via the service-role client (see src/lib/marketing/public.ts).
 */
import { NextResponse } from "next/server";
import { recordSignal } from "@/lib/marketing/public";
import type { MktSignalType } from "@/types/marketing";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

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
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.type) {
    return NextResponse.json({ error: "Missing signal type." }, { status: 400 });
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
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, id: result.id });
}
