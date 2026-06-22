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
| Framework | Next.js 16.1.6 — App Router + Turbopack |
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
| AI Providers | OpenAI GPT-4.1 · Google Gemini 2.5 Flash · Anthropic Claude Sonnet 4 |
| Lead sourcing | Apify (Google Maps, B2B leads, social discovery) |
| Social scheduling | Buffer · Postiz |
| Stock imagery | Pexels (landing-page image search) |
| PDF / DOCX export | jsPDF + html2canvas · html-docx-js |
| Deployment | Vercel |
| Version Control | GitHub |

---

## Prerequisites

- Node.js 20+
- npm 10+
- A Supabase project (free tier works for development)
- Vercel account (for production deployment)

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
# Edit .env.local — add NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

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
| `OPENAI_API_KEY` | Optional | Last-resort fallback AI key when no per-user key is configured |
| `GEMINI_API_KEY` | Optional | Fallback Google Gemini key (text + image generation) |
| `BREVO_API_KEY` | Optional | Transactional/bulk email (password reset, invoices, work-feedback, outreach) |
| `APIFY_TOKEN` | Optional | Lead sourcing actors (Market Validation → Sourcing) |
| `PEXELS_API_KEY` | Optional | Stock-image search in the landing-page builder |
| `BUFFER_API_KEY` / `POSTIZ_API_KEY` | Optional | Social scheduling for the Content studio |
| `CRON_SECRET` | Optional | Guards the marketing cron worker endpoints |

> Per-user AI provider keys (OpenAI, Gemini, Claude) are configured through the **Settings** page inside the running app. There is **no** agency-level key tier — resolution is personal key → `OPENAI_API_KEY`/`GEMINI_API_KEY` env fallback → none.

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
│   │   ├── settings/                 # AI provider keys & theme
│   │   ├── signin/ & reset_pw/       # Authentication
│   │   ├── sops/                     # Documents / Standard Operating Procedures
│   │   └── users/                    # User management (admin)
│   ├── components/
│   │   ├── layout/                   # PageShell, PageHeader, Sidebar
│   │   └── ui/                       # Icons, primitives
│   ├── lib/
│   │   ├── api/                      # AI dispatchers (OpenAI/Gemini/Claude), Brevo, Apify, Buffer, Postiz, Pexels
│   │   ├── auth/                     # requirePageAccess, page-gate
│   │   ├── data/                     # Shared data fetchers (idea picker, etc.)
│   │   ├── marketing/               # Validation-engine domain logic (sourcing, outreach, public)
│   │   ├── notifications/           # Work-feedback / invoice email builders
│   │   └── supabase/                 # Client, server, service client, generated types
│   └── types/                        # Shared TypeScript interfaces per feature
├── docs/
│   ├── changelog.md                  # Feature-level changelog (updated every session)
│   ├── project_status.md             # Current build completion status
│   └── marketing/                    # Marketing-engine design notes & reports
├── .specs/
│   ├── project/                      # Project goals, roadmap, current state
│   └── codebase/                     # Stack, architecture, conventions, structure, concerns
├── supabase/
│   └── migrations/                   # Numbered SQL migrations (append-only)
├── README.md                         # This file
├── CLAUDE.md                         # AI assistant working instructions
├── architecture.md                   # System architecture deep-dive
└── RULES.md                          # Non-negotiable coding rules
```

---

## Pages & Feature Map

| Route | Roles | Description |
|---|---|---|
| `/dashboard` | admin, manager | KPI strip, recharts charts, key results, project/internal-project overviews |
| `/projects` | admin, manager, operational, developer, client, qa | Project detail: stages, developer tasks, client requests, QA requests |
| `/chat` | admin, manager, operational, developer, client, qa | Messaging with threads, emoji reactions, client/QA kanban tabs, chatbots, file/link/video tabs, work-feedback |
| `/ideas-refiner` | admin, manager, operational, developer, client, lead | 15-step AI wizard: idea → ICP → location → market → benchmarking → frameworks → risk → **go/no-go report** → PRD → DB → design system → milestones → playbook |
| `/marketing` & `/marketing/[ideaId]/*` | admin, manager | Market Validation Engine: positioning, sourcing, outreach, interviews, content, landing, signals, traffic/SEO |
| `/m/[slug]` | Public (anonymous) | Published landing pages with staged capture (quiz / waitlist) and event tracking |
| `/internal-projects` | admin, manager, operational | Internal company projects with kanban and time tracking |
| `/invoices` | admin, manager, operational, developer, client, qa, lead | Invoice generator: rich-text service description, AI fill from work-feedback, PDF + email |
| `/okrs` | admin, manager, operational | Goals and key results tracking |
| `/sops` | admin, manager, operational, developer, client, qa | Documents / SOPs with versioning and TipTap editing |
| `/feedback` | All authenticated | Feedback wall (admin/manager see all; others see own) |
| `/users` | admin | User creation, role assignment, invitation emails |
| `/settings` | All except referrer | Per-user AI provider keys, model selection, theme |
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

Schema changes live in `supabase/migrations/` as timestamped SQL files. Migrations are **append-only** — never edit an existing file.

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

Used across **Ideas Refiner** (15-step generation + chatbots + Devil's-Advocate debate), the **Market Validation Engine** (positioning, outreach personalisation, content drafting, interview analysis), and **invoices** (AI fill). Three providers are supported and swappable per-user:

| Provider | Default Model | Notes |
|---|---|---|
| OpenAI | `gpt-4.1` | Text/JSON via Responses API; `gpt-image-1` for images |
| Google Gemini | `gemini-2.5-flash` | Text/JSON + image generation |
| Anthropic Claude | `claude-sonnet-4-20250514` | Text/JSON; built-in retry + backoff |

**Config resolution order** (see `src/lib/api/ai-config.ts`):

1. Personal key from `user_ai_settings` (set in **Settings**)
2. `OPENAI_API_KEY` / `GEMINI_API_KEY` environment fallback
3. `null` → app shows "Configure AI in Settings"

There is **no agency-key tier** (the `agency_ai_settings` table was dropped on 2026-06-14). `referrer` and `lead` users are restricted to personal keys only — they never trigger the env fallback.

AI prompts are stored in the `prompt` database table and editable by admins/managers at `/prompts`. Each action file also defines a hardcoded `FALLBACK_*` constant used when no database prompt exists for that step.

---

## Deployment

Connected to **Vercel** via GitHub. Every push to `master` triggers an automatic production deployment.

```bash
# Verify the build locally before pushing
npm run build

# The production server runs on port 30003
npm start
```

**Required Vercel environment variables:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` (optional)

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
