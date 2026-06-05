/**
 * Brevo event webhook — updates outreach rows from delivery events.
 * Configure in Brevo: send transactional events to /api/webhooks/brevo.
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

interface BrevoEvent {
  event?: string;
  "message-id"?: string;
  messageId?: string;
  email?: string;
}

export async function POST(req: Request) {
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
    .select("id, project_id")
    .eq("brevo_message_id", messageId)
    .maybeSingle();
  const row = rowData as unknown as { id: string; project_id: string } | null;
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
        .eq("project_id", row.project_id)
        .ilike("email", email)
        .maybeSingle();
      if (!exists) {
        await sb.from("mkt_suppression" as never).insert({
          project_id: row.project_id,
          email,
          reason: "brevo_unsubscribe",
        } as never);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
