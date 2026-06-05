/**
 * GET /api/m/unsubscribe?p=<projectId>&e=<email>&t=<token>
 * Public one-click unsubscribe (PECR/GDPR). Verifies the signed token, adds the
 * email to mkt_suppression for the project, and returns a small confirmation page.
 */
import { createServiceClient } from "@/lib/supabase/server";
import { verifyUnsubscribeToken } from "@/lib/marketing/outreach";

function page(message: string, ok: boolean): Response {
  const html = `<!doctype html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Unsubscribe</title>
<style>body{font-family:Arial,Helvetica,sans-serif;background:#0d0d10;color:#f4f4f5;
display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0}
.box{max-width:420px;padding:32px;text-align:center}
h1{font-size:20px;margin:0 0 8px}p{color:#a1a1aa;font-size:14px;line-height:1.6}</style>
</head><body><div class="box"><h1>${ok ? "You're unsubscribed" : "Link invalid"}</h1>
<p>${message}</p></div></body></html>`;
  return new Response(html, {
    status: ok ? 200 : 400,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("p") ?? "";
  const email = (url.searchParams.get("e") ?? "").toLowerCase();
  const token = url.searchParams.get("t") ?? "";

  if (!projectId || !email || !token || !verifyUnsubscribeToken(projectId, email, token)) {
    return page("This unsubscribe link is invalid or has expired.", false);
  }

  const sb = createServiceClient();
  const { data: exists } = await sb
    .from("mkt_suppression" as never)
    .select("id")
    .eq("project_id", projectId)
    .ilike("email", email)
    .maybeSingle();

  if (!exists) {
    await sb.from("mkt_suppression" as never).insert({
      project_id: projectId,
      email,
      reason: "unsubscribe_link",
    } as never);
  }

  // Stop any queued steps for matching prospects in this project.
  const { data: prospectRows } = await sb
    .from("mkt_prospect" as never)
    .select("id")
    .eq("project_id", projectId)
    .ilike("email", email);
  const prospectIds = ((prospectRows ?? []) as unknown as { id: string }[]).map(
    (r) => r.id
  );
  if (prospectIds.length > 0) {
    await sb
      .from("mkt_outreach" as never)
      .update({ status: "unsub" } as never)
      .eq("project_id", projectId)
      .eq("status", "queued")
      .in("prospect_id", prospectIds);
  }

  return page("You won't receive any more emails from us about this.", true);
}
