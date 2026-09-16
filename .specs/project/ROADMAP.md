# ROADMAP — Move37 Operational System

_Snapshot 2026-09-16. Status mirrors `docs/project_status.md`._

## Shipped

| Milestone | Status |
|---|---|
| Platform foundation (Next 16, Supabase, RLS, 40 migrations, Vercel) | ✅ |
| Auth + 8-role access model (middleware + page gate + RLS) | ✅ |
| Core pages (dashboard, projects, chat, internal-projects, okrs, sops, feedback, users, prompts, settings, profile) | ✅ |
| Invoices (rich-text, AI fill, PDF + email) | ✅ |
| Ideas Refiner — 15 steps incl. Risk & Validation debate + go/no-go Report + Build Brief + single-document PRD (per-feature tooling + phased plan) | ✅ |
| Market Validation Engine — Phases 0–5 + interview intelligence + traffic/SEO | ✅ |
| Integrations: OpenRouter (text/JSON), OpenAI + Gemini (images), Brevo, Apify, Buffer/Postiz, Pexels | ✅ |
| Storage buckets (avatars, signatures, project-files, chat-attachments) | ✅ |
| **2026-08-14 — OpenRouter platform AI**: all text/JSON generation routes through one platform key; per-user provider keys dropped | ✅ |
| **2026-09-15 — Documentation + spec workspace**: root docs reconciled with the code, `database.md` / `design-system.md` / `hooks.example.md` / `CHALLENGES.md` added, `.specs/{features,evaluations}` established, 6 project subagents authored, repo root reorganized | ✅ |
| **2026-09-15 — security-p0**: Brevo webhook secret, server-safe sanitizer on every HTML sink, `/m` iframe sandbox isolation, dedicated unsubscribe signing secret, rate limiting on public routes, `server-only` service-role guard, HSTS + CSP-Report-Only | ✅ |
| **2026-09-15 — auth-roundtrips**: middleware off `/api/*` and `/m/*`, conditional profile lookup, request-scoped `cache()` auth helper, visibility-gated + slower chat polling | ✅ |
| **2026-09-15 — db-indexes**: 39 FK indexes added, 4 duplicate pairs dropped, list queries bounded, `max(order)` pushed into the database (applied to local and production) | ✅ |
| **2026-09-15 — bundle-and-boundaries**: TipTap + Recharts behind `next/dynamic`, route loading/error/not-found boundaries, `removeConsole` in production | ✅ |
| **2026-09-16 — Cloudflare Workers deployment**: Host migrated from Vercel to Cloudflare Workers. Adapter `@opennextjs/cloudflare` 1.20.6 + `wrangler` 4.x. Next 16.1.6 → 16.3.5. Sanitizer: `isomorphic-dompurify` → `sanitize-html` (jsdom-free). html-docx-js vendored + on-demand loaded. Crons: Cloudflare Cron Triggers (free, hourly). Production Supabase verified in sync. | ✅ |

## In Progress / Next

| Item | Status | Notes |
|---|---|---|
| ~~**server-action-guards**~~ | ✅ | Done 2026-09-15: 53 gates, 6 allow-lists, 0 ungated writers remaining |
| ~~Apply `20260915000000_fk_indexes.sql` to production~~ | ✅ | Applied 2026-09-15. Every target table was under 50 kB so a plain `CREATE INDEX` locked for under a millisecond; `CONCURRENTLY` was unnecessary at this size |
| ~~Repair local migration history~~ | ✅ | Repaired 2026-09-15: 14 migrations applied, 2 marked applied via `migration repair`, 0 unrecorded remaining, types regenerated |
| CSP enforce mode with a per-request nonce | 🟡 | Report-Only is live; enforcement needs a nonce for the inline theme script and the `/m` `srcDoc` iframe |
| Cloudflare WAF rate-limit rules | 🟡 | Rules need to be created in the Cloudflare dashboard; exact table in `architecture.md` under "Rate limiting: where the real limit lives". 4 rules (mkt-capture, mkt-event, mkt-unsubscribe, webhooks). |
| Worker secrets (10 unset) | 🟡 | Must set via `npx wrangler secret put`: Brevo templates/sender (email), Postiz (social), Gemini/OpenAI (images), Cal.com/Tally (webhooks), Pexels (stock images). Deployment works; features using these fail gracefully. |
| Lazy-load the ref-based rich-text callers | 🟡 | `next/dynamic` does not forward refs, so these need an imperative-handle-free editor API first |
| Stripe pre-order capture | 🟡 | Quiz + waitlist live; preorder stubbed (deferred per decision) |
| A/B landing variants + decision-log pivot taxonomy (P2) | 🟡 | Partial |
| Test suite (unit / integration / E2E) | ⬜ | No automated test runner configured yet — see `.specs/codebase/TESTING.md` |

## Deferred

- JWT `user_type` claim (would remove the remaining profile-table round-trip from middleware).
- Supabase Realtime for chat (replace the remaining interval polling).
- Index `created_by` on the six tables whose owner check lives in split per-command policies rather than the Tier-2 `FOR ALL` shape.
- Narrow the last 9 `select("*")` calls in the Ideas Refiner, which forward rows through dynamic key access.
- PostHog session recordings.

## Guiding Constraints

- Append-only migrations; RLS on every new table; an index on every new foreign key.
- Build to the patterns already in the codebase; greenfield marketing features document in `docs/marketing/`.
- Update `docs/changelog.md` every session, and `.specs/` plus `docs/project_status.md` alongside it (`RULES.md` §10.4).
