# Move37 — Internal Tools

A full-stack internal operations platform built with **Next.js 16, Supabase, and Tailwind CSS v4** — a modern, type-safe system for running the studio's projects, communication, billing, and AI-assisted idea development.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Documentation Map](#documentation-map)
- [Project Agents](#project-agents)
- [Pages & Feature Map](#pages--feature-map)
- [User Roles](#user-roles)
- [Database & Migrations](#database--migrations)
- [AI Integration](#ai-integration)
- [Deployment](#deployment)
- [Scripts](#scripts)

---

## Overview

Move37 Operational System is a role-gated SaaS platform that centralises:

- **Project management** — hierarchical tasks, kanban boards, QA/client request tracking, and client-facing portals
- **Team communication** — chat with per-project tabs, threads, emoji reactions, file/link/video sharing, work-feedback, and AI chatbots
- **AI-powered idea development** — **Ideas Refiner**, a 15-step AI wizard from raw idea → Devil's-Advocate go/no-go report → PRD → DB schema → design system → build playbook
- **Market Validation Engine** — demand-validation pipeline (positioning → sourcing → outreach → content → landing → signals → traffic/SEO) attached to any idea
- **Internal operations** — OKRs, SOPs/Documents, internal projects, and an admin KPI dashboard
- **Billing** — invoice generator with rich-text service descriptions, AI fill from work-feedback, PDF export, and email delivery

The codebase and the `.specs/` workspace are the source of truth — features follow the patterns established in the existing code. (The operational core was originally ported from a legacy Bubble.io app; that migration is complete and the Bubble export is no longer maintained.)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.3.5 — App Router + Turbopack |
| Language | TypeScript 5 (strict) |
| Database | Supabase (PostgreSQL 15 + RLS) |
| Auth | Supabase Auth (email/password + magic link) |
| Storage | Supabase Storage |
| Styling | Tailwind CSS v4 + CSS custom properties design tokens |
| Rich Text | TipTap v3 (10+ extensions) |
| Charts | Recharts v3 |
| Date Handling | date-fns v4 + react-day-picker v9 |
| Toast / Notifications | Sonner v2 |
| Email | Brevo (transactional + bulk) |
| AI — text / JSON | **OpenRouter** — one platform key fronting OpenAI, Anthropic, Google, xAI, DeepSeek |
| AI — images | OpenAI `gpt-image-1` · Google Gemini |
| Lead sourcing | Apify (Google Maps, B2B leads, social discovery) |
| Social scheduling | Buffer · Postiz |
| Stock imagery | Pexels (landing-page image search) |
| PDF / DOCX export | jsPDF + html2canvas · html-docx-js (vendored, loaded on demand) |
| HTML sanitisation | sanitize-html (jsdom-free) |
| Deployment | Cloudflare Workers via `@opennextjs/cloudflare` 1.20.6 + `wrangler` 4.x |
| Crons | Cloudflare Cron Triggers (free, hourly, no frequency floor) |
| Version Control | GitHub |

---

## Prerequisites

- Node.js 20+
- npm 10+
- A Supabase project (free tier works for development)
- Cloudflare account with a Workers domain (for production deployment)

---

## Getting Started

```bash
# 1. Clone the repository
git clone <repo-url>
cd move37-operational-system

# 2. Install dependencies
npm install

# 3. Copy and fill environment variables
cp .env.example .env.local
# Edit .env.local — at minimum NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY and OPENROUTER_API_KEY (required for every AI feature)

# 4. Apply all database migrations
npx supabase db push

# 5. Start the development server
npm run dev
# → http://localhost:4000
```

> **First login:** create a user in Supabase Auth Dashboard, then manually set `profiles.type = 'admin'` in the database to access all pages.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service-role key — **server only, never sent to browser** |
| `OPENROUTER_API_KEY` | ✅ | **Required for all AI.** Single platform key for every text/JSON generation. Without it the app reports "No AI service configured." |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public base URL — the Cloudflare Workers domain (e.g. `https://move37-operational-system.f3importers.workers.dev`) |
| `OPENAI_API_KEY` | Optional | **Image generation only** (`gpt-image-1`). Not used for text/JSON. |
| `GEMINI_API_KEY` | Optional | **Image generation only.** Not used for text/JSON. |
| `BREVO_API_KEY` | Optional | Transactional/bulk email (password reset, invoices, work-feedback, outreach) |
| `BREVO_FROM_EMAIL` / `BREVO_FROM_NAME` | Optional | Sender identity on every Brevo send |
| `BREVO_TEMPLATE_MAGIC_LINK` | Optional | Brevo template id for the magic-link sign-in email |
| `BREVO_TEMPLATE_PASSWORD_RESET` | Optional | Brevo template id for the password-reset email |
| `APIFY_TOKEN` | Optional | Lead sourcing actors (Market Validation → Sourcing) |
| `PEXELS_API_KEY` | Optional | Stock-image search in the landing-page builder |
| `BUFFER_API_KEY` | Optional | Buffer social scheduling for the Content studio |
| `BUFFER_ORG_ID` | Optional | Buffer organisation id paired with `BUFFER_API_KEY` |
| `POSTIZ_API_KEY` / `POSTIZ_API_URL` | Optional | Postiz social scheduling (Buffer alternative) |
| `CRON_SECRET` | ✅ in prod | Bearer token guarding the marketing cron workers (`/api/mkt/cron/*`) |
| `CALCOM_WEBHOOK_SECRET` | Optional | HMAC secret verifying the Cal.com booking webhook |
| `TALLY_WEBHOOK_SECRET` | Optional | HMAC secret verifying the Tally survey webhook |
| `BREVO_WEBHOOK_SECRET` | Planned | Shared secret for the Brevo delivery/engagement webhook — being added (see `.specs/features/security-p0/spec.md`) |

> **AI keys are not per-user.** Since 2026-08-14 the platform owns one `OPENROUTER_API_KEY` and every user shares it. The **Settings** page only lets a user pick which OpenRouter model to generate with (`user_ai_settings.openrouter_model`). There is no agency-key tier and no personal-key tier. `OPENAI_API_KEY` / `GEMINI_API_KEY` survive strictly for image generation.

---

## Project Structure

```
move37-operational-system/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # Webhooks + marketing cron + public capture endpoints
│   │   ├── chat/                     # Messaging: threads, reactions, tabs, chatbots
│   │   ├── dashboard/                # Admin KPI dashboard
│   │   ├── docs/                     # Role redirect (docs components reused by Playbook step)
│   │   ├── feedback/                 # Feedback wall
│   │   ├── ideas-refiner/            # 15-step AI idea development wizard
│   │   ├── internal-projects/        # Internal kanban + time tracking
│   │   ├── invoices/                 # Invoice generator (PDF + email)
│   │   ├── m/[slug]/                 # Public landing pages (anonymous, service-role)
│   │   ├── marketing/                # Market Validation Engine (admin/manager)
│   │   │   └── [ideaId]/             #   positioning · sourcing · outreach · interviews
│   │   │                             #   content · landing · signals · traffic
│   │   ├── okrs/                     # OKR tracking
│   │   ├── profile/                  # User profile & signature
│   │   ├── projects/                 # Client project management
│   │   ├── prompts/                  # AI prompt library (admin/manager)
│   │   ├── settings/                 # OpenRouter model selection & theme
│   │   ├── signin/ & reset_pw/       # Authentication
│   │   ├── sops/                     # Documents / Standard Operating Procedures
│   │   └── users/                    # User management (admin)
│   ├── components/
│   │   ├── layout/                   # PageShell, PageHeader, Sidebar
│   │   └── ui/                       # Icons, primitives
│   ├── lib/
│   │   ├── api/                      # openrouter (all text/JSON), ai-config, ai-dispatcher,
│   │   │                             # openai + gemini (images only), brevo, apify,
│   │   │                             # buffer, postiz, image-search
│   │   ├── auth/                     # requirePageAccess, page-gate
│   │   ├── data/                     # Shared data fetchers (idea picker, etc.)
│   │   ├── marketing/                # Validation-engine domain logic (sourcing, outreach, public)
│   │   ├── notifications/            # Work-feedback / invoice email builders
│   │   └── supabase/                 # Client, server, service client, generated types
│   └── types/                        # Shared TypeScript interfaces per feature
├── .agents/
│   └── stack-context.md              # Language, framework, commands, CI gates
├── .claude/
│   ├── agents/                       # 6 project subagents (see Project Agents)
│   ├── settings.json                 # Shared permissions (committed)
│   ├── settings.local.json           # Personal overrides (untracked)
│   └── launch.json                   # Debugger launch config (port 4000)
├── .specs/
│   ├── project/                      # Goals, roadmap, current state
│   ├── codebase/                     # Stack, architecture, conventions, structure, testing
│   ├── features/                     # Per-feature specs + acceptance criteria
│   └── evaluations/                  # Spec-conformance baselines & reports
├── docs/
│   ├── changelog.md                  # Feature-level changelog, 2026-07 onward
│   ├── changelog-archive/2026-H1.md  # Archived first-half-2026 changelog
│   ├── project_status.md             # Current build completion status
│   ├── rtk.md                        # Token-saving CLI command reference
│   └── marketing/                    # Marketing-engine design notes & reports
├── supabase/
│   └── migrations/                   # 39 numbered SQL migrations (append-only)
├── archive/
│   ├── legacy-logs/                  # Retired dev/server logs
│   ├── supabase-migrations-archive/  # 63 superseded pre-baseline migrations
│   └── snippets/                     # Retired code snippets kept for reference
├── README.md                         # This file
├── CLAUDE.md                         # AI assistant working instructions + operating rules
├── RULES.md                          # Non-negotiable coding rules
├── architecture.md                   # System architecture deep-dive
├── database.md                       # Narrative schema reference
├── design-system.md                  # Design tokens, typography, component contracts
├── CHALLENGES.md                     # Session friction log (self-learning)
└── hooks.example.md                  # Optional Claude Code hooks (not enabled)
```

### Documentation Map

| Document | What it is for | Audience |
|---|---|---|
| `README.md` | Getting started, stack, structure, deployment | Humans / GitHub |
| `CLAUDE.md` | Project memory + operating rules, loaded into every Claude Code session | Claude Code |
| `RULES.md` | Enforcement-focused, non-negotiable rules | Everyone |
| `architecture.md` | Request lifecycle, data flows, security layers, directory map | Engineers |
| `database.md` | Narrative schema reference — tables, columns, relationships | Engineers |
| `design-system.md` | Design tokens, typography, spacing, component contracts | Engineers / design |
| `CHALLENGES.md` | Dated log of friction hit while working in this repo; read at session start | Claude Code |
| `hooks.example.md` | Optional, **not-enabled** Claude Code hook recipes for `.claude/settings.json` | Maintainers |
| `docs/project_status.md` | Feature-by-feature build completion status | Everyone |
| `docs/changelog.md` | What changed, per session | Everyone |
| `docs/rtk.md` | RTK token-saving command reference | Claude Code |
| `docs/marketing/` | Market Validation Engine design notes | Engineers |
| `.specs/project/` | Goals, roadmap, current state, decisions | Everyone |
| `.specs/codebase/` | Stack, architecture, conventions, structure, testing | Everyone |
| `.specs/features/<slug>/spec.md` | Per-feature spec + acceptance criteria | Everyone |
| `.specs/evaluations/` | Spec-conformance baselines and grading reports | Everyone |
| `.agents/stack-context.md` | Language, framework, test/lint/format commands, CI gates | Claude Code |

### Project Agents

Six project-scoped subagents live in `.claude/agents/`: `move37-migration-author` (append-only SQL + RLS + types), `move37-server-action-author` (the `"use server"` mutation layer), `move37-ui-builder` (pages, components, design tokens), `move37-spec-conformance-reviewer` (grades a diff against `.specs/features/*/spec.md`), `move37-security-reviewer` (read-only RLS / endpoint / secret audit), and `move37-docs-sync` (keeps these documents consistent with the code).

---

## Pages & Feature Map

| Route | Roles | Description |
|---|---|---|
| `/dashboard` | admin, manager | KPI strip, recharts charts, key results, project/internal-project overviews |
| `/projects` | admin, manager, operational, developer, client, qa | Project detail: stages, developer tasks, client requests, QA requests |
| `/chat` | admin, manager, operational, developer, client, qa | Messaging with threads, emoji reactions, client/QA kanban tabs, chatbots, file/link/video tabs, work-feedback |
| `/ideas-refiner` | admin, manager, operational, developer, client, lead | 15-step AI wizard: idea → structure → ICP → product → location → benchmarking → market → frameworks → risk → **go/no-go report** → PRD → DB → design system → milestones → playbook |
| `/marketing` & `/marketing/[ideaId]/*` | admin, manager | Market Validation Engine: positioning, sourcing, outreach, interviews, content, landing, signals, traffic/SEO |
| `/m/[slug]` | Public (anonymous) | Published landing pages with staged capture (quiz / waitlist) and event tracking |
| `/internal-projects` | admin, manager, operational | Internal company projects with kanban and time tracking |
| `/invoices` | admin, manager, operational, developer, client, qa, lead | Invoice generator: rich-text service description, AI fill from work-feedback, PDF + email |
| `/okrs` | admin, manager, operational | Goals and key results tracking |
| `/sops` | admin, manager, operational, developer, client, qa | Documents / SOPs with versioning and TipTap editing |
| `/feedback` | All authenticated | Feedback wall (admin/manager see all; others see own) |
| `/users` | admin | User creation, role assignment, invitation emails |
| `/settings` | All except referrer | OpenRouter model selection, theme |
| `/profile` | All authenticated | Personal info, photo, digital signature |
| `/prompts` | admin, manager | AI prompt library — edit DB prompts used by Ideas Refiner & chatbots |

> **Removed since the early build:** the standalone `/talent-pool`, `/talent-profile`, `/leads`, and `/recommended-projects` pages (and their `talent`/`client`/`company` tables) were dropped in the 2026-06-14 cleanup migration. Referrer users now land on `/projects`.

---

## User Roles

Eight roles defined in `profiles.type` (PostgreSQL enum `os_user_type`):

| Role | Default Home | Access Level |
|---|---|---|
| `admin` | `/dashboard` | Full platform access |
| `manager` | `/dashboard` | Full platform access |
| `operational` | `/internal-projects` | Internal tools; no direct client data |
| `developer` | `/projects` | Assigned projects, all task types, comments |
| `client` | `/projects` | Assigned projects + `client_requests` tasks only |
| `qa` | `/projects` | Assigned projects + `qa_requests` tasks only |
| `referrer` | `/projects` | Clamped by middleware to `/projects`, `/feedback`, `/profile` |
| `lead` | `/ideas-refiner` | Ideas Refiner + invoices + personal AI settings only |

Access is enforced at three independent layers:
1. **Middleware** (`src/proxy.ts`) — refreshes Supabase session and hard-clamps `referrer` users to an allow-list of prefixes
2. **Page gate** (`src/lib/auth/page-gate.ts`) — `requirePageAccess()` called at the top of every server component; wrong-role users redirect to their home via `ROLE_FALLBACK`
3. **Database RLS** — every table has row-level security policies; the server-side client always runs as the authenticated user

---

## Database & Migrations

Schema changes live in `supabase/migrations/` as timestamped SQL files — **39 append-only migrations**, from the `20260101000000_production_baseline.sql` baseline through `20260814140000_drop_legacy_user_ai_keys.sql`. Migrations are **append-only** — never edit an existing file. (63 superseded pre-baseline migrations are kept for history in `archive/supabase-migrations-archive/` and are not applied.)

```bash
# Push all pending migrations to the remote Supabase project
npx supabase db push

# Regenerate TypeScript types after a schema change
npx supabase gen types typescript --project-id <ref> > src/lib/supabase/types.ts

# Or update types.ts manually to match the new columns
```

**RLS helper functions** (defined in the initial schema migration):

| Function | Purpose |
|---|---|
| `public.get_user_type()` | Returns current user's `profiles.type` |
| `public.is_admin_or_manager()` | `true` when role is admin or manager |
| `public.is_staff_role()` | `true` for admin / manager / operational |
| `public.is_operational_user()` | `true` for developer / client / qa |
| `auth.uid()` | Built-in Supabase — current user's UUID |

---

## AI Integration

Used across **Ideas Refiner** (15-step generation + chatbots + Devil's-Advocate debate), the **Market Validation Engine** (positioning, outreach personalisation, content drafting, interview analysis), and **invoices** (AI fill).

### Text / JSON — OpenRouter only

Since 2026-08-14 every text and JSON generation goes through a single **OpenRouter** call path on one platform-owned key. OpenRouter fronts OpenAI, Anthropic, Google, xAI and DeepSeek behind one schema, so adding a model is a slug change rather than a new client.

| Concern | Where |
|---|---|
| HTTP client | `src/lib/api/openrouter.ts` (raw `fetch` — no AI SDK dependency) |
| Dispatcher | `src/lib/api/ai-dispatcher.ts` — `generateAiJsonResponse` / `generateAiTextResponse` |
| Config resolver | `src/lib/api/ai-config.ts` — `resolveAiConfig(supabase, userId)` |
| Model catalogue + default | `src/types/settings.ts` — `OPENROUTER_MODELS`, `DEFAULT_OPENROUTER_MODEL` (`openai/gpt-4.1`) |

**Config resolution** (`resolveAiConfig`) is deliberately flat:

1. `OPENROUTER_API_KEY` env var → the key every user shares
2. Missing → `null` → app shows "No AI service configured."

The model comes from `user_ai_settings.openrouter_model`, falling back to `DEFAULT_OPENROUTER_MODEL`. `service` is always `"openrouter"`.

There are **no per-user provider keys**, no `agency_ai_settings` tier, no `os_ai_service` enum (all dropped in `20260814140000_drop_legacy_user_ai_keys.sql`), and no referrer/lead carve-out. The **Settings** page now only picks a model.

### Images — providers called directly

Image generation is the one path that still talks to providers directly. `resolveImageKeys()` reads `GEMINI_API_KEY` / `OPENAI_API_KEY` from the environment and dispatches to `src/lib/api/gemini.ts` or `src/lib/api/openai.ts` (`gpt-image-1`).

### Prompts

AI prompts are stored in the `prompt` database table and editable by admins/managers at `/prompts`. Each action file also defines a hardcoded `FALLBACK_*` constant used when no database prompt exists for that step. Large rich-HTML generations (single-document PRD, Database, Visual Styles) must pass `maxTokens: 16384`.

---

## Deployment

Deployed on **Cloudflare Workers** via `@opennextjs/cloudflare` 1.20.6 and `wrangler` 4.x. The production domain is `https://move37-operational-system.f3importers.workers.dev`.

### Build & Deploy

**Builds must run on Linux** — the OpenNext adapter requires symlink support and fails on Windows locally. Use a container or CI.

```bash
# Build for Cloudflare Workers
npx opennextjs-cloudflare build

# Deploy to Cloudflare Workers
npx wrangler deploy
```

### Cloudflare Secrets

Worker secrets are set via the CLI, not the codebase. Set them with:

```bash
npx wrangler secret put NAME
```

**Required secrets:**
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL` (the Cloudflare domain)
- `OPENROUTER_API_KEY` — all text/JSON AI generation fails without it
- `CRON_SECRET` — guards `/api/mkt/cron/*` routes

**Optional secrets** (see `Environment Variables` above for descriptions):
- `BREVO_API_KEY`, `BREVO_FROM_EMAIL`, `BREVO_FROM_NAME`, `BREVO_TEMPLATE_*`
- `OPENAI_API_KEY` / `GEMINI_API_KEY` (image generation only)
- `APIFY_TOKEN`, `PEXELS_API_KEY`, `BUFFER_API_KEY` + `BUFFER_ORG_ID`, `POSTIZ_API_KEY`
- `CALCOM_WEBHOOK_SECRET`, `TALLY_WEBHOOK_SECRET`

**10 secrets currently unset on the Worker** (as of 2026-09-16):
Outbound email templates, Cal.com/Tally webhook verification, social publishing via Postiz, stock images, and AI image generation will fail until these are set: `BREVO_FROM_EMAIL`, `BREVO_FROM_NAME`, `BREVO_TEMPLATE_MAGIC_LINK`, `BREVO_TEMPLATE_PASSWORD_RESET`, `CALCOM_WEBHOOK_SECRET`, `TALLY_WEBHOOK_SECRET`, `POSTIZ_API_KEY`, `POSTIZ_API_URL`, `GEMINI_API_KEY`, `OPENAI_API_KEY`, `PEXELS_API_KEY`.

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Dev server on port 4000 with Turbopack HMR |
| `npm run build` | Production build (TypeScript check + bundle) |
| `npm start` | Production server on port 30003 |
| `npm run lint` | ESLint |
| `npm run dev:prod` | Build then start (smoke-test production locally) |
| `npm run db:start` / `db:stop` | Start / stop the local Supabase stack |
| `npm run db:reset` | Reset local DB and re-apply all migrations |
| `npm run db:status` / `db:studio` | Local Supabase status / open Studio |
