# Marketing Validation Engine (`mkt_*`)

> **Greenfield domain.** The Marketing Validation Engine is a deliberate,
> authorized new product domain. This README is its source of truth, satisfying
> the "no orphan code" rule (`CLAUDE.md` #7) for everything under the `mkt_`
> prefix and the `/marketing` + `/m` routes.

## Purpose

A generic, **project-agnostic** demand-validation pipeline that attaches to any
existing project (`public.project`) and lets the team find the *cheapest credible
test* of demand before committing to a full build:

```
Source  →  Outreach  →  Content  →  Capture  →  Measure
```

Two funnel modes per project:
- **B2B outreach** — source named prospects, run personalised 1:1 sequences.
- **Consumer capture** — no cold outreach; drive a quiz/waitlist via content + ads.

Every project picks which capture stages to run, in escalating signal strength:
**quiz → waitlist → pre-order/deposit**.

## Architecture

| Concern | Where |
|---|---|
| Admin zone (staff-gated) | `/marketing`, `/marketing/[projectId]/*` — `requirePageAccess(["admin","manager"])` |
| Public zone (anonymous) | `/m/[slug]` landing pages + `/api/m/*` capture/checkout/event + `/api/webhooks/stripe` |
| Background workers | `/api/mkt/cron/*` (Vercel Cron, guarded by `CRON_SECRET`) |
| Data | `mkt_*` tables, every row FK'd to `public.project(id)` |
| Public reads/writes | Performed **server-side with the service-role client** — no anon RLS policies exposed |

The public landing pages are exempt from the auth gate via the `isPublicRoute`
allowlist in `src/proxy.ts` (`/m` prefix).

## Data model

Migration: `supabase/migrations/20260601000000_marketing_validation_engine.sql`.
TypeScript: `src/types/marketing.ts`.

| Table | Purpose |
|---|---|
| `mkt_validation` | Per-project funnel config (1:1 with `project`) |
| `mkt_prospect` | Sourced B2B contact (deduped by project + email) |
| `mkt_source_run` | A sourcing job (Apollo / Apify run) |
| `mkt_campaign` | Outreach campaign |
| `mkt_sequence_step` | Step within a campaign sequence |
| `mkt_outreach` | Per-prospect outbound message log |
| `mkt_content` | Content piece for multi-channel social |
| `mkt_landing` | Landing page config (public slug) |
| `mkt_signal` | **Captured demand** (quiz / waitlist / pre-order) |
| `mkt_event` | Analytics beacon (views / clicks) |
| `mkt_suppression` | Unsubscribe / GDPR suppression |

**RLS:** every table — admin/manager full, or staff member of the linked project
(`auth.uid() = ANY(project.authorized_users)`).

## External tools (build-vs-buy)

| Capability | Tool | Lib |
|---|---|---|
| B2B contact sourcing | Apollo.io | `src/lib/api/apollo.ts` |
| Scraping (Google Maps, LinkedIn) | Apify | `src/lib/api/apify.ts` |
| Outreach email send | Brevo (reused) | `src/lib/api/brevo.ts` |
| Social posting (LI/IG/FB/X/+30) | Postiz | `src/lib/api/postiz.ts` |
| Pre-order / deposit | Stripe Checkout | `src/lib/api/stripe.ts` |
| Copy / personalisation | AI dispatcher (reused) | `src/lib/api/ai-dispatcher.ts` |

Env keys: `APOLLO_API_KEY`, `APIFY_TOKEN`, `POSTIZ_API_KEY`, `POSTIZ_CLIENT_ID`,
`POSTIZ_API_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`NEXT_PUBLIC_APP_URL`, `CRON_SECRET` (plus existing `BREVO_*` and AI keys).

### Postiz integration notes (Phase 4)
Postiz = open-source, cheaper Buffer/Ayrshare alternative. Public API:
- `GET /public/v1/integrations` → connected **channels** (API calls them
  "integrations"). Use to render the "post to…" channel picker.
- `POST /public/v1/posts` → schedule to one/many channels at a time; each
  platform has its own `settings.__type` schema (thread vs single, first
  comment, community vs profile, etc.).
- Cloud rate limit ~100 create-post requests/hour; batch channels per request.
Our content studio mirrors **Buffer/Postiz UX**: a multi-channel **composer**
(AI-drafted body, per-channel preview) + a drag-and-drop **calendar/queue**.

## Compliance (UK / GDPR)

- B2B cold email under PECR legitimate-interest with one-click unsubscribe;
  `mkt_suppression` is checked before **every** outbound send.
- Consumer is **opt-in only** (quiz/waitlist), never cold.
- Respect Apify/LinkedIn and Ayrshare ToS (rate limits, no aggressive automation).
- Minimal data collection; clear privacy notice; no medical/financial claims at
  the validation stage.

## Build phases

0. **Foundations** ✅ — schema + RLS, types, `/marketing` zone + enable-validation,
   sidebar nav, middleware public allowlist, this doc.
1. **Landing + staged capture** ✅ — public `/m/[slug]`, landing builder, quiz +
   waitlist capture (pre-order stubbed pending Stripe), analytics beacon, signals
   table. Highest-leverage slice: projects can collect demand signals now.
2. **Sourcing** ✅ — Apify Google Maps scraper → `mkt_prospect` (async start →
   cron import, deduped by project+email). Apollo people-search deferred (free
   plan returns 403; key configured, needs a paid Apollo plan).
3. **Outreach engine** ✅ — prospects (manual + CSV), campaigns, sequence steps,
   AI-personalised opening lines, Brevo send with GDPR suppression + one-click
   unsubscribe, Brevo event webhook, and a Vercel Cron worker (`CRON_SECRET`).
   Manual prospect entry means it works before Phase 2 lands.
4. **Content studio** ✅ — calendar-first (Buffer-style) scheduler: month grid
   with drag-to-reschedule, AI drafting off positioning, schedule/publish via
   Postiz, publish cron worker. Connect channels in the Postiz dashboard to post.
5. **Validation dashboard** ✅ — portfolio rollup on `/marketing`, per-project
   funnel, and the kill / double-down decision + positioning on the project page.

### Switching on pre-order later
Set `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`, build `src/lib/api/stripe.ts`
+ `/api/m/[slug]/checkout` + `/api/webhooks/stripe`, then allow the `preorder`
stage in `CaptureForm` and `recordSignal` (currently hard-rejected).
