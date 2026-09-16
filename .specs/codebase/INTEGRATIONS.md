# INTEGRATIONS

_Brownfield analysis — 2026-06-21. Clients live in `src/lib/api/`._

## AI providers

_Since 2026-08-14, OpenRouter is the only path for text/JSON generation; `claude.ts` was deleted. Since 2026-09-16, sanitiser is `sanitize-html` (jsdom-free); `isomorphic-dompurify` was used until the Cloudflare Workers migration._

| Service | File | Endpoint | Notes |
|---|---|---|---|
| OpenRouter | `openrouter.ts` | `/api/v1/chat/completions` | **All text/JSON generation.** Chat Completions schema (not Responses); platform `OPENROUTER_API_KEY`; per-user `openrouter_model` pref; treats HTTP 200 + `error` payload as failure; 230s timeout |
| Google Gemini | `gemini.ts` | `generativelanguage…:generateContent` | **Image generation only** (`gemini-2.5-flash-image`) via `resolveImageKeys()`; `response_mime_type: application/json` |
| OpenAI | `openai.ts` | `/v1/responses` | **Image generation only** (`gpt-image-1`) via `resolveImageKeys()`; Responses API; 230s timeout |

`ai-config.ts` resolves the config: `resolveAiConfig()` for text/JSON (platform key + per-user model,
no role gate), `resolveImageKeys()` for images (platform Gemini/OpenAI keys). `ai-dispatcher.ts` routes
`generateAiJsonResponse` / `generateAiTextResponse` to `openrouter.ts` only. All AI code uses raw
`fetch` — no AI SDK dependency.

## Email — Brevo (`brevo.ts`)

- `/v3/smtp/email`, `api-key` header. From-fallback `no-reply@move37.fun` (`BREVO_FROM_*`).
- Template sends (password reset, magic link, account details, booking) + `sendRawEmail` (subject + HTML
  + attachments — used for invoice PDF and work-feedback notifications).

## Lead sourcing — Apify (`apify.ts`, server-only)

- `/v2`, `APIFY_TOKEN`. Start run → poll → import; one-shot run webhooks.
- Actors: Google Maps places (`nwua9Gu5YrADL7ZDj`), B2B leads (`code_crafter/leads-finder`, **paid-plan only**),
  6-platform social discovery (LinkedIn/IG/FB/YouTube/X/TikTok) + LinkedIn enrichment + website email extraction.
- Normalisers map raw items → `NormalizedProspect` / `NormalizedSocialProfile`.

## Social scheduling

| Service | File | Auth | Notes |
|---|---|---|---|
| Buffer | `buffer.ts` | Bearer `BUFFER_API_KEY` | GraphQL (`/graphql`) for posting + REST (`/1`) for analytics |
| Postiz | `postiz.ts` | raw key in `Authorization` (no Bearer) | `/public/v1`; replaced Ayrshare for cost |

`buffer-labels.ts` maps channel → display name. Scheduled posts stored in `mkt_content.external_post_ids`.

## Stock images — Pexels (`image-search.ts`)

- `PEXELS_API_KEY`. Stock-photo search for the landing-page builder.

## Webhooks & cron (`src/app/api/`)

- `/api/m/[slug]/capture`, `/api/m/event` — public capture/event beacons (service-role writes, unauthenticated by design — anonymous visitors).
- `/api/webhooks/brevo` (`route.ts:22-81`) — opened/bounced/unsub → outreach + suppression. **No
  auth check at all** (no signature/secret verification) before the service-role write — see `.specs/codebase/CONCERNS.md`.
- `/api/webhooks/calcom` — booking → `meeting_booked` event + `mkt_interview` stub. HMAC
  (`X-Cal-Signature-256`, `CALCOM_WEBHOOK_SECRET`), constant-time compare, **fails closed** in production when the secret is unset.
- `/api/webhooks/tally` — survey response → `mkt_signal.survey_answers`. HMAC (`X-Tally-Signature`,
  `TALLY_WEBHOOK_SECRET`); if the secret is unset, verification is **skipped** (documented as dev-only).
- `/api/mkt/apify-webhook` — one-shot callback registered per Apify run (`registerRunWebhook` in
  `apify.ts`) fires on terminal run states to pull results without polling.
- `/api/mkt/cron/process-outreach|process-content|sync-sourcing` — bearer `CRON_SECRET`, checked via
  `hasBearerSecret`/`secretEquals` (`src/lib/auth/secretCompare.ts`, `timingSafeEqual`-based, fails closed). Scheduled by Cloudflare Cron Triggers in `wrangler.jsonc` (`0 * * * *`, `15 * * * *`, `30 * * * *` — hourly, staggered).

## Supabase

`client.ts` (browser, anon), `server.ts` (`createClient` per-request + `createServiceClient` service-role).
Storage buckets: `avatars`, `user-signatures`, `project-files`, `chat-attachments`.

## Deferred

- **Stripe** (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) — pre-order capture, not yet wired.
