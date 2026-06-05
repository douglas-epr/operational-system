/**
 * Vercel Cron worker — publishes due scheduled social posts via Postiz.
 * Secured by CRON_SECRET (Bearer). Manual POST allowed for testing.
 */
import { NextResponse } from "next/server";
import { processDueContent } from "@/lib/marketing/content";

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
  const result = await processDueContent(25);
  return NextResponse.json({ ok: true, ...result });
}

export async function GET(req: Request) {
  return handle(req);
}
export async function POST(req: Request) {
  return handle(req);
}
