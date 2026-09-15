/**
 * Brevo event webhook — updates outreach rows from delivery events.
 * Configure in Brevo: send transactional events to
 * /api/webhooks/brevo?token=<BREVO_WEBHOOK_SECRET> (Brevo's webhook UI also
 * supports a custom header, so `X-Brevo-Token` is accepted too — whichever
 * the configured Brevo plan supports).
 * Matches events to mkt_outreach by message-id.
 *
 * Events handled: opened/unique_opened → opened_at; hard_bounce/soft_bounce →
 * bounced; unsubscribed → suppression + status unsub.
 *
 * Note: email *replies* do not arrive here (they go to the from-inbox); reply
 * tracking is manual via the admin UI.
 */
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { secretEquals } from "@/lib/auth/secretCompare";
import { checkRateLimit, clientIpFromRequest } from "@/lib/rate-limit";

interface BrevoEvent {
  event?: string;
  "message-id"?: string;
  messageId?: string;
  email?: string;
}

/** Mirrors the calcom/tally webhooks: fail closed in production, warn-once in dev. */
let warnedMissingSecretOnce = false;
function isAuthorized(req: Request): boolean {
  const secret = process.env.BREVO_WEBHOOK_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") return false;
    if (!warnedMissingSecretOnce) {
      warnedMissingSecretOnce = true;
      console.warn(
        "[webhooks/brevo] BREVO_WEBHOOK_SECRET is not set — allowing unauthenticated requests in development only."
      );
    }
    return true;
  }
  const url = new URL(req.url);
  const provided = req.headers.get("X-Brevo-Token") ?? url.searchParams.get("token");
  return secretEquals(provided, secret);
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = checkRateLimit(`brevo-webhook:${clientIpFromRequest(req)}`, { limit: 120, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  let body: BrevoEvent;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false });
  }

  const event = body.event;
  const messageId = body["message-id"] ?? body.messageId;
  if (!event || !messageId) return NextResponse.json({ ok: true });

  const sb = createServiceClient();

  // Find the outreach row by Brevo message id.
  const { data: rowData } = await sb
    .from("mkt_outreach" as never)
    .select("id, idea_id")
    .eq("brevo_message_id", messageId)
    .maybeSingle();
  const row = rowData as unknown as { id: string; idea_id: string } | null;
  if (!row) return NextResponse.json({ ok: true });

  if (event === "opened" || event === "unique_opened") {
    await sb
      .from("mkt_outreach" as never)
      .update({ status: "opened", opened_at: new Date().toISOString() } as never)
      .eq("id", row.id);
  } else if (event === "hard_bounce" || event === "soft_bounce" || event === "blocked") {
    await sb
      .from("mkt_outreach" as never)
      .update({ status: "bounced" } as never)
      .eq("id", row.id);
  } else if (event === "unsubscribed") {
    await sb
      .from("mkt_outreach" as never)
      .update({ status: "unsub" } as never)
      .eq("id", row.id);
    if (body.email) {
      const email = body.email.toLowerCase();
      // Functional unique index is on lower(email), so avoid ON CONFLICT:
      // check-then-insert instead of upsert.
      const { data: exists } = await sb
        .from("mkt_suppression" as never)
        .select("id")
        .eq("idea_id", row.idea_id)
        .ilike("email", email)
        .maybeSingle();
      if (!exists) {
        await sb.from("mkt_suppression" as never).insert({
          idea_id: row.idea_id,
          email,
          reason: "brevo_unsubscribe",
        } as never);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
