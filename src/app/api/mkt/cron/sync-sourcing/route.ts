/**
 * Vercel Cron worker — polls running Apify sourcing runs and imports completed
 * datasets into mkt_prospect. Secured by CRON_SECRET (Bearer).
 */
import { NextResponse } from "next/server";
import { importDueSourceRuns } from "@/lib/marketing/sourcing";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

async function handle(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await importDueSourceRuns(20);
  return NextResponse.json({ ok: true, ...result });
}

export async function GET(req: Request) {
  return handle(req);
}
export async function POST(req: Request) {
  return handle(req);
}
