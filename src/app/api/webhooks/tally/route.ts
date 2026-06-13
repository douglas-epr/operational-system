/**
 * Tally.so → Marketing Validation Engine webhook.
 *
 * Receives FORM_RESPONSE events and attaches the survey answers to the
 * corresponding mkt_signal row. The form must include a hidden field with
 * the key "signalId" (populated via URL param ?signalId={{signal_id}} in the
 * post-capture Tally embed URL).
 *
 * Optionally also reads "ideaId" from hidden fields for additional lookup.
 *
 * Signature: Tally sends X-Tally-Signature: sha256=<hmac> when a signing
 * secret is configured. Store it in TALLY_WEBHOOK_SECRET. If the env var is
 * absent, signature checking is skipped (acceptable in dev).
 */

import { createHmac } from "node:crypto";
import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

interface TallyField {
  key: string;
  label: string;
  type: string;
  value: unknown;
  options?: { id: string; text: string }[];
}

interface TallyPayload {
  eventId: string;
  eventType: string;
  data: {
    responseId: string;
    submittedAt: string;
    formId: string;
    formName: string;
    fields: TallyField[];
  };
}

function verifySignature(rawBody: string, header: string | null): boolean {
  const secret = process.env.TALLY_WEBHOOK_SECRET;
  if (!secret) return true; // skip in dev
  if (!header) return false;
  const expected = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  if (expected.length !== header.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ header.charCodeAt(i);
  return diff === 0;
}

function fieldValue(fields: TallyField[], key: string): string | null {
  const f = fields.find((f) => f.key === key || f.label.toLowerCase() === key.toLowerCase());
  if (!f) return null;
  const v = f.value;
  return v == null ? null : String(v).trim() || null;
}

function answersMap(fields: TallyField[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    if (f.type === "HIDDEN_FIELDS") continue; // skip injected hidden vars
    out[f.key] = f.value;
  }
  return out;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  if (!verifySignature(rawBody, req.headers.get("X-Tally-Signature"))) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = body as TallyPayload;

  if (parsed.eventType !== "FORM_RESPONSE") {
    return Response.json({ ok: true, skipped: true });
  }

  const fields = parsed.data?.fields ?? [];
  const signalId = fieldValue(fields, "signalId");

  if (!signalId) {
    return Response.json({ ok: true, skipped: true, reason: "no_signal_id" });
  }

  const answers = answersMap(fields);
  const sb = createServiceClient();

  const { error } = await sb
    .from("mkt_signal" as never)
    .update({ survey_answers: answers } as never)
    .eq("id", signalId);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
