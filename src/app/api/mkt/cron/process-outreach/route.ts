/**
 * Vercel Cron worker — sends due outreach sequence steps.
 * Schedule is configured in vercel.json. Secured by CRON_SECRET: Vercel Cron
 * sends `Authorization: Bearer <CRON_SECRET>` automatically when the env var
 * is set. Manual POST with the same header is allowed for testing.
 */
import { NextResponse } from "next/server";
import { processDueOutreach } from "@/lib/marketing/outreach";
import { hasBearerSecret } from "@/lib/auth/secretCompare";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: Request): boolean {
  // Refuses to run unguarded; constant-time secret compare.
  return hasBearerSecret(req, process.env.CRON_SECRET);
}

async function handle(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await processDueOutreach(50);
  return NextResponse.json({ ok: true, ...result });
}

export async function GET(req: Request) {
  return handle(req);
}
export async function POST(req: Request) {
  return handle(req);
}
