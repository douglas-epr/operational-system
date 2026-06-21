/**
 * Apify webhook receiver — called by Apify when a sourcing run reaches a
 * terminal state (SUCCEEDED / FAILED / ABORTED / TIMED_OUT).
 *
 * URL format: /api/mkt/apify-webhook?sourceRunId=<mkt_source_run.id>&token=<CRON_SECRET>
 *
 * Authentication: token query param must match CRON_SECRET. Apify signs its
 * own requests too, but verifying the HMAC signature requires the secret to
 * be set in the webhook config — using the token param is simpler and safe
 * because the URL is only constructed server-side with the real secret.
 */
import { NextRequest, NextResponse } from "next/server";
import { importSourceRun } from "@/lib/marketing/sourcing";
import { secretEquals } from "@/lib/auth/secretCompare";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const sourceRunId = searchParams.get("sourceRunId");
  const token       = searchParams.get("token");

  // Constant-time compare to avoid leaking the secret via timing.
  if (!secretEquals(token, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!sourceRunId) {
    return NextResponse.json({ error: "Missing sourceRunId" }, { status: 400 });
  }

  const result = await importSourceRun(sourceRunId);
  return NextResponse.json({ ok: true, ...result });
}
