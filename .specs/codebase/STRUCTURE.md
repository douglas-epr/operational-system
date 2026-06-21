# STRUCTURE

_Brownfield analysis — 2026-06-21._

## Top level

```
move37-operational-system/
├── src/                      # Application code
├── supabase/migrations/      # 28 append-only SQL migrations
├── docs/                     # changelog, project_status, reference_docs/, marketing/
├── .specs/                   # This spec-driven workspace
├── CLAUDE.md README.md architecture.md RULES.md
```

## src/app (App Router routes)

| Path | Roles | Purpose |
|---|---|---|
| `signin`, `reset_pw` | public | auth |
| `page.tsx` | auth | redirect → role home |
| `dashboard` | admin, manager | KPI + key-results/projects/IP views |
| `projects` | admin,manager,operational,developer,client,qa | project detail, tasks, comments |
| `chat` | staff + clients | blocks, threads, reactions, tabs, chatbots |
| `ideas-refiner` | admin,manager,operational,developer,client,lead | 15-step AI wizard |
| `marketing` + `marketing/[ideaId]/*` | admin, manager | Market Validation Engine (8 sub-tabs) |
| `m/[slug]` | public | published landing pages (service-role) |
| `internal-projects` | admin,manager,operational | kanban + time tracking |
| `invoices` | all except referrer | invoice generator (PDF + email) |
| `okrs` | admin,manager,operational | goals + key results |
| `sops` | staff + clients | Documents / SOPs (versioned) |
| `feedback` | all auth | feedback wall |
| `users` | admin | user management |
| `prompts` | admin, manager | AI prompt library |
| `settings` | all except referrer | per-user AI keys + theme |
| `profile` | all auth | profile + signature |
| `docs` | all auth | role redirect (components reused by Playbook step) |
| `api/*` | — | webhooks, public capture, `mkt/cron/*` workers |

Per-feature: `page.tsx` (RSC) · `actions.ts` (`"use server"`) · `_components/` · sometimes `_lib/`, `_hooks/`.

## src/components

- `layout/` — `PageShell`, `PageHeader`, `Sidebar` (`NAV_ITEMS` groups: workspace, collaboration, operations, administration).
- `ui/` — `icons.tsx` (all SVGs as named exports) + shared primitives.

## src/lib

| Dir | Contents |
|---|---|
| `api/` | `ai-config`, `ai-dispatcher`, `openai`, `gemini`, `claude`, `json-converters`, `brevo`, `apify`, `buffer`, `postiz`, `buffer-labels`, `image-search` (Pexels) |
| `auth/` | `page-gate.ts` — `requirePageAccess`, `ROLE_FALLBACK` |
| `data/` | `ideaPicker.ts` and other shared fetchers |
| `marketing/` | validation-engine domain logic (sourcing, outreach, public, admin, content) |
| `notifications/` | work-feedback / invoice email builders (`feedbackEmail.ts`) |
| `supabase/` | `client.ts` (browser), `server.ts` (`createClient` + `createServiceClient`), `types.ts` (generated) |

## src/types

`projects`, `chat`, `idea-refiner` (IdeaBlock×15, IdeaStyles, design tokens), `marketing` (mkt_* enums),
`docs` (Invoice, PlaybookVersion, file/link/video), `internal-projects`, `okrs`, `sops`, `feedback`, `settings`.

## src/proxy.ts

Next.js 16 middleware — session refresh, public-zone allow-list, referrer clamp.
