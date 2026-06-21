# Project Status

_Last updated: 2026-06-21_

Legend: ✅ complete · 🟡 in progress · ⬜ not started

---

## Platform Foundation

- ✅ Next.js 16 App Router + Turbopack scaffolded (dev port 4000, prod 30003)
- ✅ Supabase project connected (hosted `bcarzmfdamsozmfjgnpv` + local stack at `127.0.0.1:54321`)
- ✅ 28 append-only migrations applied (baseline `20260101000000` → `20260626000000`)
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

- ✅ Steps 1–8: ideas → structure_align → refining_icp → product_definition_flows → location_legislation → market_opportunity → benchmarking → strategic_frameworks
- ✅ Step 9: risk_and_validation (Devil's-Advocate debate + demand evidence)
- ✅ Step 10: report (go/no-go gate, build/refine/kill verdict, Build Brief)
- ✅ Steps 11–15: prd → database → visual_styles (Design System) → milestones_and_tasks → playbook
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

- ✅ AI: OpenAI (Responses API + `gpt-image-1`), Gemini (text + image), Claude (retry/backoff)
- ✅ Email: Brevo (transactional templates + raw/attachment sends)
- ✅ Apify (sourcing actors) · Buffer + Postiz (social) · Pexels (image search)
- ✅ Storage buckets: `avatars`, `user-signatures`, `project-files`, `chat-attachments`

## Removed / Retired

- ✅ `talent-pool`, `talent-profile`, `leads`, `recommended-projects` pages + `talent`/`client`/`company` tables (dropped 2026-06-14)
- ✅ `agency_ai_settings` table + agency-key AI tier (dropped 2026-06-14)
- ✅ `/docs` page demoted to a role redirect (its components are reused by the Ideas Refiner Playbook step)
