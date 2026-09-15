# Project Status

_Last updated: 2026-09-15_

Legend: ✅ complete · 🟡 in progress · ⬜ not started

---

## Platform Foundation

- ✅ Next.js 16 App Router + Turbopack scaffolded (dev port 4000, prod 30003)
- ✅ Supabase project connected (hosted `bcarzmfdamsozmfjgnpv` + local stack at `127.0.0.1:54321`)
- ✅ 40 append-only migrations (baseline `20260101000000` → `20260915000000_fk_indexes`); 63 superseded pre-baseline files parked in `archive/supabase-migrations-archive/`
- ✅ Generated DB types in `src/lib/supabase/types.ts`
- ✅ RLS on every table; helper functions (`get_user_type`, `is_admin_or_manager`, `is_staff_role`, `is_operational_user`)
- ✅ Vercel auto-deploy on push to `master`

## Auth & Access

- ✅ Supabase Auth (email/password + magic link + password reset)
- ✅ Sign-in / reset-password pages
- ✅ Session middleware (`src/proxy.ts`) — session refresh, public-zone allow-list, referrer clamp
- ✅ `requirePageAccess()` page gate + `ROLE_FALLBACK` on every server component
- ✅ 8 roles: admin, manager, operational, developer, client, qa, referrer, lead

## Core Pages

- ✅ `dashboard` (KPI strip + key-results / projects / internal-projects views)
- ✅ `projects` (stages, developer tasks, client/QA requests, comments + unread badges)
- ✅ `chat` (blocks, threads, emoji reactions, file/link/video tabs, work-feedback, chatbots)
- ✅ `ideas-refiner` (15-step AI wizard — see below)
- ✅ `internal-projects` (kanban + time tracking)
- ✅ `invoices` (rich-text, AI fill, PDF + email)
- ✅ `okrs` · `sops` (Documents) · `feedback` · `users` · `prompts` · `settings` · `profile`

## Ideas Refiner (15 steps)

- ✅ Steps 1–8: ideas → structure_align → refining_icp → product_definition_flows → location_legislation → benchmarking → market_opportunity → strategic_frameworks
- ✅ Step 9: risk_and_validation (Devil's-Advocate debate + demand evidence)
- ✅ Step 10: report (go/no-go gate, build/refine/kill verdict, Build Brief)
- ✅ Steps 11–15: prd (single comprehensive document — per-feature tooling + phased plan) → database → visual_styles (Design System) → milestones_and_tasks → playbook
- ✅ Per-idea chatbot + Devil's-Advocate chatbot
- ✅ `buildProjectFromIdea` (inherits authorized_users, links idea↔project)

## Market Validation Engine (greenfield — Phases 0–5 + P1/P2)

- ✅ Phase 0–1: foundations, public landing (`/m/[slug]`) + staged capture
- ✅ Phase 2: sourcing via Apify (Google Maps, B2B leads, 6-platform social discovery)
- ✅ Phase 3: outreach engine (Brevo sequences, suppression, cron worker)
- ✅ Phase 4: content studio (Buffer/Postiz scheduler)
- ✅ Phase 5: validation dashboard + signals scoring (weighted, ICP split, Wilson CI)
- ✅ P1: interview intelligence, Cal.com booking webhook, Tally survey, traffic tab
- ✅ Traffic/SEO: ad campaigns (UTM) + `mkt_seo_keyword` rank tracking
- 🟡 Stripe pre-order capture (deferred — quiz + waitlist live, preorder stubbed)
- 🟡 A/B landing variants + `mkt_decision_log` pivot taxonomy (P2, partial)

## Integrations

- ✅ AI: **OpenRouter** on a single platform `OPENROUTER_API_KEY` for all text/JSON (fronts OpenAI · Anthropic · Google · xAI · DeepSeek); OpenAI `gpt-image-1` + Gemini for images only
- ✅ Email: Brevo (transactional templates + raw/attachment sends)
- ✅ Apify (sourcing actors) · Buffer + Postiz (social) · Pexels (image search)
- ✅ Storage buckets: `avatars`, `user-signatures`, `project-files`, `chat-attachments`

## Removed / Retired

- ✅ `talent-pool`, `talent-profile`, `leads`, `recommended-projects` pages + `talent`/`client`/`company` tables (dropped 2026-06-14)
- ✅ `agency_ai_settings` table + agency-key AI tier (dropped 2026-06-14)
- ✅ `/docs` page demoted to a role redirect (its components are reused by the Ideas Refiner Playbook step)
- ✅ Per-user AI provider keys + `os_ai_service` enum (dropped 2026-08-14 — all AI now runs on the platform OpenRouter key; `user_ai_settings` keeps only `openrouter_model`)

## In Progress

Hardening specs live under `.specs/features/`; the pre-change gate baseline is
`.specs/evaluations/_baseline-2026-09-15.md`.

- ✅ `security-p0` — Brevo webhook secret, server-safe `isomorphic-dompurify` sanitizer, every HTML sink sanitized, `/m` iframe sandbox isolation with server-injected UTM, dedicated unsubscribe signing secret, in-memory rate limiter on all public routes, `server-only` guard on the service-role module, HSTS + CSP-Report-Only. Implemented 2026-09-15.
- ✅ `auth-roundtrips` — middleware excluded from `/api/*` and `/m/*`, conditional profile lookup, request-scoped `cache()` auth helper, visibility-gated and slower chat polling. Implemented 2026-09-15.
- ✅ `db-indexes` — 39 foreign-key indexes added, 4 duplicate index pairs dropped, unbounded list queries bounded, `max(order)` pushed into the database. **Applied to local and production** (2026-09-15); verified 17 `idea_id` + 6 `created_by` indexes live, all 4 duplicate twins dropped.
- ✅ `bundle-and-boundaries` — TipTap and Recharts behind `next/dynamic`, route-level loading/error/not-found boundaries added, `removeConsole` in production.
- ✅ `server-action-guards` — 53 explicit authentication gates added across 7 modules (0 ungated writers remain), 6 column allow-lists closing all 7 mass-assignment sites, plus a real ordering bug fixed in `buildPlaybookFromIdea` where an unauthenticated write ran before its auth check. Implemented 2026-09-15.

## Documentation

- ✅ Full documentation refresh + repo reorganisation (2026-09-15): `CLAUDE.md` gained the operating-rules block and lost the inlined RTK reference (now `docs/rtk.md`); `README.md`, `RULES.md`, `architecture.md` and this file brought in line with the OpenRouter migration; root docs split into `CLAUDE.md` · `README.md` · `RULES.md` · `architecture.md` · `database.md` · `design-system.md` · `CHALLENGES.md` · `hooks.example.md`; `.specs/` gained `features/` and `evaluations/`; changelog split at 2026-07 into `docs/changelog.md` + `docs/changelog-archive/2026-H1.md`; retired logs, snippets and superseded migrations moved under `archive/`
- ✅ 6 project subagents in `.claude/agents/` (migration-author, server-action-author, ui-builder, spec-conformance-reviewer, security-reviewer, docs-sync)
- ✅ Security audit 2026-09-15: RLS on 85/85 live tables, all `SECURITY DEFINER` functions pin `search_path`, cron routes use `timingSafeEqual` bearer checks, baseline response headers in `next.config.ts`
