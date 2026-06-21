# ARCHITECTURE

_Brownfield analysis — 2026-06-21. Full detail in root `architecture.md`._

## Shape

No separate backend. All server logic is Next.js **Server Actions** (`"use server"` in co-located
`actions.ts`) and **Route Handlers** (webhooks, public capture, cron). Server Components fetch data
and gate access; client components are leaf/orchestrator UI receiving data as props.

```
Browser
  └─ proxy.ts (middleware)            session refresh · public-zone allow-list · referrer clamp
      └─ App Router (RSC)             requirePageAccess() gate → parallel data fetch
          ├─ Supabase JS (server)     row-scoped via anon key (RLS-enforced)
          └─ Supabase JS (service)    createServiceClient() — elevated reads/writes (public capture, AI config)
      Supabase: PostgreSQL 15 + RLS + Auth + Storage + (partial) Realtime
```

## Three-layer access model

1. **Middleware** (`src/proxy.ts`) — refresh session; allow public `/signin`, `/reset_pw`, `/m/*`,
   `/api/*`; clamp `referrer` to `/projects`,`/feedback`,`/profile`.
2. **Page gate** (`src/lib/auth/page-gate.ts`) — `requirePageAccess(allowed)`; wrong role → `ROLE_FALLBACK` home.
3. **RLS** — every table; the server client runs as the authenticated user. Last/hardest boundary.

`ROLE_FALLBACK`: admin/manager→`/dashboard`, operational→`/internal-projects`,
developer/client/qa/referrer→`/projects`, lead→`/ideas-refiner`.

## Request lifecycle

1. Middleware → 2. `requirePageAccess()` in `page.tsx` → 3. parallel data fetch (`Promise.all`)
→ 4. mutations via Server Actions (`getUser()` → write → `revalidatePath()` → `{ error? }`)
→ 5. background refresh via Realtime (emoji, idea-gen completion) or interval polling (chat lists/tabs).

## Domains

- **Projects/tasks** — hierarchical `project_task` (level 1–4), `authorized_users[]` membership,
  unread comment badges via `viewed_by[]`.
- **Chat** — `ChatBlock` = projects | internal_projects | private | chatbot; per-block refresh ticks;
  emoji reactions over Realtime.
- **Ideas Refiner** — 15 ordered steps (`IDEA_BLOCKS_ORDERED`); AI generation guarded by
  `isRequestActive(ideaId, requestId)`; Report (step 10) is a go/no-go gate.
- **Market Validation Engine** — per-`idea` funnel; public landing at `/m/[slug]` (service-role);
  cron workers under `/api/mkt/cron/*`.

## AI subsystem

`resolveAiConfig(supabase, userId)` → `{ service, apiKey, model }`. Resolution: personal key → env
fallback → null (no agency tier). `generateAiJsonResponse` / `generateAiTextResponse` dispatch to
`openai.ts` / `gemini.ts` / `claude.ts`. Prompts live in the `prompt` table with `FALLBACK_*` code constants.

## Storage

Four public buckets: `avatars` (5MB), `user-signatures` (2MB), `project-files` (50MB), `chat-attachments` (25MB).
Public read; authenticated upload/update/delete.
