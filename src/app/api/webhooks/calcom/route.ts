/**
 * Cal.com → Marketing Validation Engine webhook.
 *
 * Receives BOOKING_CREATED events and:
 *  1. Fires a `meeting_booked` event for the signals funnel.
 *  2. Creates an mkt_interview stub so the team can paste the transcript later.
 *
 * Setup: in Cal.com, add a webhook pointing to /api/webhooks/calcom with secret
 * stored in CALCOM_WEBHOOK_SECRET. The booking URL must include ?ideaId=<uuid>
 * as a query param — Cal.com passes URL query params into payload.metadata.
 *
 * Signature: X-Cal-Signature-256: sha256=<hmac-sha256-over-raw-body>
 */

import { createHmac } from "node:crypto";
import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit, clientIpFromRequest } from "@/lib/rate-limit";

function verifySignature(rawBody: string, header: string | null): boolean {
  const secret = process.env.CALCOM_WEBHOOK_SECRET;
  // Fail CLOSED in production: a missing secret must reject, not bypass auth.
  if (!secret) return process.env.NODE_ENV !== "production";
  if (!header) return false;
  const expected = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  if (expected.length !== header.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ header.charCodeAt(i);
  return diff === 0;
}

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(`calcom-webhook:${clientIpFromRequest(req)}`, { limit: 120, windowMs: 60_000 });
  if (!rl.ok) {
    return Response.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  const rawBody = await req.text();

  if (!verifySignature(rawBody, req.headers.get("X-Cal-Signature-256"))) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload = (body as { triggerEvent?: string; payload?: Record<string, unknown> });

  // Only handle booking creation events.
  if (payload.triggerEvent !== "BOOKING_CREATED") {
    return Response.json({ ok: true, skipped: true });
  }

  const data = payload.payload ?? {};
  const metadata = (data.metadata ?? {}) as Record<string, unknown>;
  const ideaId = typeof metadata.ideaId === "string" ? metadata.ideaId.trim() : null;

  if (!ideaId) {
    // Booking URL was not configured with ?ideaId= — nothing to do.
    return Response.json({ ok: true, skipped: true, reason: "no_idea_id" });
  }

  const attendees = Array.isArray(data.attendees) ? data.attendees as { name?: string; email?: string }[] : [];
  const attendee = attendees[0] ?? {};
  const name = typeof attendee.name === "string" ? attendee.name.trim() : null;
  const email = typeof attendee.email === "string" ? attendee.email.trim() : null;
  const startTime = typeof data.startTime === "string" ? data.startTime : new Date().toISOString();

  const sb = createServiceClient();

  // Find the landing page for this idea (needed for mkt_event.landing_id).
  const { data: landingRow } = await sb
    .from("mkt_landing" as never)
    .select("id")
    .eq("idea_id", ideaId)
    .eq("published", true)
    .limit(1)
    .maybeSingle();
  const landingId = (landingRow as { id: string } | null)?.id ?? null;

  // Record the meeting_booked funnel event (best-effort).
  if (landingId) {
    await sb.from("mkt_event" as never).insert({
      idea_id: ideaId,
      landing_id: landingId,
      type: "meeting_booked",
      session_id: null,
      utm: {},
    } as never);
  }

  // Create an interview stub for the Interviews tab.
  await sb.from("mkt_interview" as never).insert({
    idea_id: ideaId,
    participant_name: name,
    participant_email: email,
    source: "booking",
    interview_date: startTime.slice(0, 10), // YYYY-MM-DD
    consent_given: true, // Cal.com requires consent during booking flow
    transcript: null,
  } as never);

  return Response.json({ ok: true });
}
