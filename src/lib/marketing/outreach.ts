/**
 * Outreach engine core (Phase 3).
 *
 * Server-only helpers shared by the admin actions and the Vercel Cron worker:
 *  - template rendering ({{first_name}} etc.)
 *  - suppression checks + signed unsubscribe tokens (GDPR/PECR)
 *  - processDueOutreach(): the worker that sends due sequence steps via Brevo,
 *    respecting suppression, then schedules the next step.
 *
 * All DB access uses the service-role client (the cron has no user session).
 */

import "server-only";
import { createHmac } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { sendRawEmail } from "@/lib/api/brevo";
import { resolveAiConfig } from "@/lib/api/ai-config";
import { generateAiTextResponse } from "@/lib/api/ai-dispatcher";
import type {
  MktProspect,
  MktSequenceStep,
  MktCampaign,
} from "@/types/marketing";

// ── Templating ────────────────────────────────────────────────────────────────

/** Replace {{key}} tokens with values (missing keys → empty string). */
export function renderTemplate(
  tpl: string,
  vars: Record<string, string>
): string {
  return tpl.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_, k: string) =>
    vars[k.toLowerCase()] ?? ""
  );
}

/** Build the merge variables available to a sequence step for a prospect. */
export function prospectVars(p: MktProspect): Record<string, string> {
  const first = (p.name ?? "").trim().split(/\s+/)[0] ?? "";
  return {
    first_name: first,
    name: p.name ?? "",
    company: p.company ?? "",
    title: p.title ?? "",
    email: p.email ?? "",
    ai_opening: "",
    booking_link: "", // populated in processDueOutreach from mkt_validation.booking_url
  };
}

// ── Suppression + unsubscribe tokens ────────────────────────────────────────────

function secret(): string {
  // No hardcoded fallback — a predictable "dev" key would let anyone forge
  // unsubscribe tokens for any (idea, email) pair and mass-suppress prospects.
  // Deliberately never falls back to the Supabase service-role secret: using
  // the project's highest-privilege credential as an HMAC signing key would
  // mean a leaked unsubscribe-link signature could be traded against DB
  // access. UNSUBSCRIBE_SIGNING_SECRET is the dedicated, purpose-built
  // secret; CRON_SECRET is the documented fallback (already a private, long
  // random secret used only for the cron worker's own auth).
  const s = process.env.UNSUBSCRIBE_SIGNING_SECRET || process.env.CRON_SECRET;
  if (!s) throw new Error("Missing env: UNSUBSCRIBE_SIGNING_SECRET or CRON_SECRET (required to sign unsubscribe tokens)");
  return s;
}

/** Deterministic, non-guessable token tying an email to a project. */
export function unsubscribeToken(ideaId: string, email: string): string {
  return createHmac("sha256", secret())
    .update(`${ideaId}:${email.toLowerCase()}`)
    .digest("hex")
    .slice(0, 24);
}

export function verifyUnsubscribeToken(
  ideaId: string,
  email: string,
  token: string
): boolean {
  const expected = unsubscribeToken(ideaId, email);
  // constant-ish time compare
  if (token.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  return diff === 0;
}

export function unsubscribeUrl(ideaId: string, email: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "";
  const t = unsubscribeToken(ideaId, email);
  return `${base}/api/m/unsubscribe?p=${ideaId}&e=${encodeURIComponent(email)}&t=${t}`;
}

type SB = ReturnType<typeof createServiceClient>;

async function isSuppressed(
  sb: SB,
  ideaId: string,
  email: string
): Promise<boolean> {
  const { data } = await sb
    .from("mkt_suppression" as never)
    .select("id")
    .eq("idea_id", ideaId)
    .ilike("email", email)
    .maybeSingle();
  return !!data;
}

// ── HTML wrapper ────────────────────────────────────────────────────────────────

function wrapHtml(bodyText: string, unsubUrl: string): string {
  const paragraphs = bodyText
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px">${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a">
${paragraphs}
<hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0 12px"/>
<p style="font-size:12px;color:#888;margin:0">
  Don't want these emails? <a href="${unsubUrl}" style="color:#888">Unsubscribe</a>.
</p>
</div>`;
}

// ── The worker ──────────────────────────────────────────────────────────────────

export interface ProcessResult {
  processed: number;
  sent: number;
  skipped: number;
  failed: number;
}

/**
 * Send all due outreach steps (status='queued', scheduled_at <= now).
 * For each: check suppression, render (optionally AI-personalise), send via
 * Brevo, mark sent, then schedule the next step in the sequence.
 */
export async function processDueOutreach(limit = 50): Promise<ProcessResult> {
  const sb = createServiceClient();
  const nowIso = new Date().toISOString();
  const result: ProcessResult = { processed: 0, sent: 0, skipped: 0, failed: 0 };

  const { data: dueData } = await sb
    .from("mkt_outreach" as never)
    .select("*")
    .eq("status", "queued")
    .lte("scheduled_at", nowIso)
    .order("scheduled_at", { ascending: true })
    .limit(limit);

  const due = (dueData ?? []) as unknown as {
    id: string;
    idea_id: string;
    prospect_id: string;
    campaign_id: string;
    step_order: number;
  }[];

  // Small per-run caches.
  const stepCache = new Map<string, MktSequenceStep | null>();
  const campaignCache = new Map<string, MktCampaign | null>();
  const positioningCache = new Map<string, string>();
  const bookingUrlCache = new Map<string, string>();

  async function getStep(campaignId: string, order: number) {
    const key = `${campaignId}:${order}`;
    if (stepCache.has(key)) return stepCache.get(key)!;
    const { data } = await sb
      .from("mkt_sequence_step" as never)
      .select("*")
      .eq("campaign_id", campaignId)
      .eq("step_order", order)
      .maybeSingle();
    const step = (data as unknown as MktSequenceStep) ?? null;
    stepCache.set(key, step);
    return step;
  }
  async function getCampaign(id: string) {
    if (campaignCache.has(id)) return campaignCache.get(id)!;
    const { data } = await sb
      .from("mkt_campaign" as never)
      .select("*")
      .eq("id", id)
      .maybeSingle();
    const c = (data as unknown as MktCampaign) ?? null;
    campaignCache.set(id, c);
    return c;
  }
  async function getPositioning(ideaId: string) {
    if (positioningCache.has(ideaId)) return positioningCache.get(ideaId)!;
    const { data } = await sb
      .from("mkt_validation" as never)
      .select("positioning")
      .eq("idea_id", ideaId)
      .maybeSingle();
    const pos = (data as { positioning: string | null } | null)?.positioning ?? "";
    positioningCache.set(ideaId, pos);
    return pos;
  }
  async function getBookingUrl(ideaId: string) {
    if (bookingUrlCache.has(ideaId)) return bookingUrlCache.get(ideaId)!;
    const { data } = await sb
      .from("mkt_validation" as never)
      .select("booking_url")
      .eq("idea_id", ideaId)
      .maybeSingle();
    const url = (data as { booking_url: string | null } | null)?.booking_url ?? "";
    bookingUrlCache.set(ideaId, url);
    return url;
  }

  for (const o of due) {
    result.processed++;

    const { data: prospectData } = await sb
      .from("mkt_prospect" as never)
      .select("*")
      .eq("id", o.prospect_id)
      .maybeSingle();
    const prospect = (prospectData as unknown as MktProspect) ?? null;

    if (!prospect?.email) {
      await sb.from("mkt_outreach" as never).update({ status: "bounced" } as never).eq("id", o.id);
      result.skipped++;
      continue;
    }

    if (await isSuppressed(sb, o.idea_id, prospect.email)) {
      await sb.from("mkt_outreach" as never).update({ status: "unsub" } as never).eq("id", o.id);
      result.skipped++;
      continue;
    }

    // Respect a paused campaign — leave the step queued so it resumes on unpause.
    const campaignForGate = await getCampaign(o.campaign_id);
    if (campaignForGate?.status === "paused") {
      result.skipped++;
      continue;
    }

    const step = await getStep(o.campaign_id, o.step_order);
    if (!step) {
      await sb.from("mkt_outreach" as never).update({ status: "bounced" } as never).eq("id", o.id);
      result.skipped++;
      continue;
    }

    const vars = prospectVars(prospect);
    vars.booking_link = await getBookingUrl(o.idea_id);

    // Optional AI personalisation of the opening line.
    if (step.ai_personalise) {
      try {
        const campaign = await getCampaign(o.campaign_id);
        const positioning = await getPositioning(o.idea_id);
        const cfg = campaign?.created_by
          ? await resolveAiConfig(sb, campaign.created_by)
          : null;
        if (cfg) {
          const prompt = `Write ONE short, specific opening line (max 25 words) for a cold outreach email.
Recipient: ${prospect.name || "there"}${prospect.title ? `, ${prospect.title}` : ""}${prospect.company ? ` at ${prospect.company}` : ""}.
What we're testing / positioning: ${positioning || "a new product"}.
Return only the sentence — no greeting, no sign-off, no quotes.`;
          const res = await generateAiTextResponse({
            service: cfg.service,
            apiKey: cfg.apiKey,
            model: cfg.model,
            prompt,
          });
          if (!res.returned_an_error && res.text) {
            vars.ai_opening = res.text.trim().replace(/^["']|["']$/g, "");
          }
        }
      } catch {
        // best-effort; fall back to the template as written
      }
    }

    const subject = renderTemplate(step.subject_tpl ?? "", vars).trim() || "Quick question";
    const bodyText = renderTemplate(step.body_tpl ?? "", vars);
    const html = wrapHtml(bodyText, unsubscribeUrl(o.idea_id, prospect.email));

    const send = await sendRawEmail({
      to: { email: prospect.email, name: prospect.name ?? prospect.email },
      subject,
      htmlContent: html,
      tags: [`mkt:${o.idea_id}`, `campaign:${o.campaign_id}`],
    });

    if (send.returned_an_error) {
      await sb.from("mkt_outreach" as never).update({ status: "bounced" } as never).eq("id", o.id);
      result.failed++;
      continue;
    }

    await sb
      .from("mkt_outreach" as never)
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        brevo_message_id: send.messageId ?? null,
      } as never)
      .eq("id", o.id);
    result.sent++;

    // Schedule the next step, if any.
    const { data: nextData } = await sb
      .from("mkt_sequence_step" as never)
      .select("step_order, delay_days")
      .eq("campaign_id", o.campaign_id)
      .gt("step_order", o.step_order)
      .order("step_order", { ascending: true })
      .limit(1)
      .maybeSingle();
    const next = nextData as unknown as { step_order: number; delay_days: number } | null;
    if (next) {
      const when = new Date(Date.now() + (next.delay_days ?? 0) * 86_400_000).toISOString();
      await sb.from("mkt_outreach" as never).insert({
        idea_id: o.idea_id,
        prospect_id: o.prospect_id,
        campaign_id: o.campaign_id,
        step_order: next.step_order,
        status: "queued",
        scheduled_at: when,
      } as never);
    }
  }

  return result;
}
