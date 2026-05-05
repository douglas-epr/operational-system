# Blur Studio — Internal Tools

A full-stack internal operations platform built with **Next.js 16, Supabase, and Tailwind CSS v4**, replicating the studio's legacy Bubble.io application with a modern, type-safe architecture.

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

Blur Studio Internal Tools is a role-gated SaaS platform that centralises:

- **Project management** — hierarchical tasks, kanban boards, QA tracking, and client-facing portals
- **Team communication** — real-time chat with per-project tabs, threads, and file sharing
- **Talent & lead pipeline** — talent database, referral tracking, and lead management
- **AI-powered idea development** — Sandbox Planner, an 11-step AI wizard from idea to design system
- **Internal operations** — OKRs, SOPs, internal projects, and dashboard KPIs
- **Document management** — rich-text editing with PDF/DOCX export

The codebase is a direct port of the studio's Bubble.io application. Every feature traces back to a documented Bubble element, page, workflow, or data type in `docs/reference_docs/`.

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
| Email | Brevo (transactional) |
| AI Providers | OpenAI GPT-4.1 · Google Gemini 2.5 Flash · Anthropic Claude Sonnet |
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
cd blur-studio-internal-tools

# 2. Install dependencies
npm install

# 3. Copy and fill environment variables
cp .env.local.clean .env.local
# Edit .env.local — add NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

# 4. Apply all database migrations
npx supabase db push

# 5. Start the development server
npm run dev
# → http://localhost:3000
```

> **First login:** create a user in Supabase Auth Dashboard, then manually set `profiles.type = 'admin'` in the database to access all pages.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service-role key — **server only, never sent to browser** |
| `OPENAI_API_KEY` | Optional | Last-resort fallback AI key if no user/agency key is configured |

> AI provider keys (OpenAI, Gemini, Claude) can also be configured per-user or per-agency through the **Settings** page inside the running app.

---

## Project Structure

```
blur-studio-internal-tools/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── chat/                     # Real-time messaging
│   │   ├── dashboard/                # Admin KPI dashboard
│   │   ├── docs/                     # Project document tabs
│   │   ├── feedback/                 # Feedback management
│   │   ├── internal-projects/        # Internal kanban
│   │   ├── leads/                    # Lead pipeline
│   │   ├── okrs/                     # OKR tracking
│   │   ├── profile/                  # User profile & signature
│   │   ├── projects/                 # Client project management
│   │   ├── prompts/                  # AI prompt library (admin)
│   │   ├── recommended-projects/     # Referrer dashboard
│   │   ├── sandbox-planner/          # AI idea development wizard
│   │   ├── settings/                 # AI & profile settings
│   │   ├── signin/ & reset_pw/       # Authentication
│   │   ├── sops/                     # Standard Operating Procedures
│   │   ├── talent-pool/              # Talent management
│   │   ├── talent-profile/           # Public talent share page
│   │   └── users/                    # User management (admin)
│   ├── components/
│   │   ├── layout/                   # PageShell, PageHeader, Sidebar
│   │   └── ui/                       # Icons, primitives
│   ├── lib/
│   │   ├── api/                      # AI dispatchers (OpenAI/Gemini/Claude), Brevo, JSON converters
│   │   ├── auth/                     # requirePageAccess, page-gate
│   │   ├── data/                     # Shared data fetchers
│   │   └── supabase/                 # Client, server, generated types
│   └── types/                        # Shared TypeScript interfaces per feature
├── docs/
│   ├── changelog.md                  # Feature-level changelog (updated every session)
│   ├── project_status.md             # Current build completion status
│   └── reference_docs/               # Bubble.io export — source of truth for every feature
├── supabase/
│   └── migrations/                   # 45+ numbered SQL migrations (append-only)
├── README.md                         # This file
├── CLAUDE.md                         # AI assistant working instructions
├── architecture.md                   # System architecture deep-dive
└── RULES.md                          # Non-negotiable coding rules
```

---

## Pages & Feature Map

| Route | Roles | Description |
|---|---|---|
| `/dashboard` | admin, manager | KPI strip, recharts charts, key results, project/IP overviews |
| `/projects` | admin, manager, operational, developer, client, qa | Project detail: stages, developer tasks, client requests, QA requests |
| `/chat` | All (scoped) | Messaging with threads, client/QA kanban tabs, chatbot, file sharing |
| `/docs` | admin, manager, operational, developer, client | Files, links, videos, daily feedback, playbook, invoices, agreement signing |
| `/sandbox-planner` | All | 11-step AI wizard: idea → ICP → product definition → PRD → DB schema → design system |
| `/internal-projects` | admin, manager, operational | Internal company projects with kanban and time tracking |
| `/okrs` | admin, manager, operational | Goals and key results tracking |
| `/sops` | admin, manager, operational | Standard operating procedures with versioning and TipTap editing |
| `/feedback` | All (scoped by role) | Feedback submission (admin/manager/operational see all; others see own) |
| `/leads` | admin, manager, operational | Lead pipeline management |
| `/talent-pool` | admin, manager, operational | Talent database, skill tracking, public share links |
| `/recommended-projects` | referrer | Referrer-only project recommendation dashboard |
| `/users` | admin | User creation, role assignment, invitation emails |
| `/settings` | All except referrer | AI provider keys, model selection, agency vs. personal toggle |
| `/profile` | All | Personal info, photo, digital signature |
| `/prompts` | admin | AI prompt library — edit DB prompts used by the sandbox planner |

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
| `referrer` | `/recommended-projects` | Clamped to referrer dashboard by middleware |
| `lead` | `/sandbox-planner` | Sandbox planner + personal AI settings only |

Access is enforced at three independent layers:
1. **Middleware** (`src/proxy.ts`) — refreshes Supabase session and hard-clamps referrer users
2. **Page gate** (`src/lib/auth/page-gate.ts`) — `requirePageAccess()` called at the top of every server component
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
| `public.is_operational_user()` | `true` when role is operational |
| `auth.uid()` | Built-in Supabase — current user's UUID |

---

## AI Integration

Used in **Sandbox Planner** (idea generation) and the **Project Chatbot**. Three providers are supported and swappable per-user:

| Provider | Default Model | Used For |
|---|---|---|
| OpenAI | `gpt-4.1` | Sandbox planner steps, chatbot, task import |
| Google Gemini | `gemini-2.5-flash` | Same feature set |
| Anthropic Claude | `claude-sonnet-4-20250514` | Same feature set |

**Config resolution order** (see `src/lib/api/ai-config.ts`):

1. Personal key (when user opted out of agency settings)
2. Agency-level key (read via service-role client — keys never reach browser)
3. `OPENAI_API_KEY` env var fallback
4. `null` → app shows "configure AI in Settings"

Referrer and Lead users are restricted to personal keys only — they never trigger agency-paid LLM calls.

AI prompts are stored in the `prompt` database table and editable by admins at `/prompts`. Each action file also has a hardcoded `FALLBACK_*` constant used when no database prompt exists for that step.

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
| `npm run dev` | Dev server on port 3000 with Turbopack HMR |
| `npm run build` | Production build (TypeScript check + bundle) |
| `npm start` | Production server on port 30003 |
| `npm run lint` | ESLint |
| `npm run dev:prod` | Build then start (smoke-test production locally) |
