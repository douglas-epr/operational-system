# INTEGRATIONS

_Brownfield analysis — 2026-06-21. Clients live in `src/lib/api/`._

## AI providers

| Service | File | Endpoint | Notes |
|---|---|---|---|
| OpenAI | `openai.ts` | `/v1/responses` | Responses API (not completions); `gpt-image-1` for images; 230s timeout |
| Google Gemini | `gemini.ts` | `generativelanguage…:generateContent` | text + image (`gemini-2.5-flash-image`); `response_mime_type: application/json` |
| Anthropic Claude | `claude.ts` | `/v1/messages` | retry (429/529/5xx) + exp backoff; model-alias resolution; default 8192 max_tokens |

`ai-config.ts` resolves provider keys (personal → env, no agency tier). `ai-dispatcher.ts` routes
`generateAiJsonResponse` / `generateAiTextResponse`. All providers share a JSON-sanitisation state
machine (escape bare control chars, strip code fences).

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

- `/api/m/[slug]/capture`, `/api/m/event` — public capture/event beacons (service-role writes).
- `/api/webhooks/brevo` — opened/bounced/unsub → outreach + suppression.
- `/api/webhooks/calcom` — booking → `meeting_booked` event + `mkt_interview` stub.
- `/api/webhooks/tally` — survey response → `mkt_signal.survey_answers`.
- `/api/mkt/cron/process-outreach|process-content|sync-sourcing` — `CRON_SECRET`-guarded workers.

## Supabase

`client.ts` (browser, anon), `server.ts` (`createClient` per-request + `createServiceClient` service-role).
Storage buckets: `avatars`, `user-signatures`, `project-files`, `chat-attachments`.

## Deferred

- **Stripe** (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) — pre-order capture, not yet wired.
