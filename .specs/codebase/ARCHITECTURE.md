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

See **Security layers** below for the full access-control stack (middleware → page gate →
server-action gate → RLS → headers).

## Request lifecycle

1. Middleware → 2. `requirePageAccess()` in `page.tsx` → 3. parallel data fetch (`Promise.all`)
→ 4. mutations via Server Actions (`getUser()` → write → `revalidatePath()` → `{ error? }`)
→ 5. background refresh via Realtime (emoji, idea-gen completion) or interval polling (chat lists/tabs).

## Domains

- **Projects/tasks** — hierarchical `project_task` (level 1–4), `authorized_users[]` membership,
  unread comment badges via `viewed_by[]`.
- **Chat** — `ChatBlock` = projects | internal_projects | private | chatbot; per-block refresh ticks;
  emoji reactions over Realtime.
- **Ideas Refiner** — 15 ordered steps (`IDEA_BLOCKS_ORDERED`: benchmarking=6 before market_opportunity=7);
  AI generation guarded by `isRequestActive(ideaId, requestId)`; Report (step 10) is a go/no-go gate.
  PRD (step 11) is one comprehensive rich-HTML `idea_prd.description` doc (per-feature tooling + phased
  plan); Database/Visual/Milestones/Playbook consume it.
- **Market Validation Engine** — per-`idea` funnel; public landing at `/m/[slug]` (service-role);
  cron workers under `/api/mkt/cron/*`.

## AI subsystem

_Rewritten 2026-08-14 (`20260814120000_openrouter_platform_ai.sql`, `20260814140000_drop_legacy_user_ai_keys.sql`)._

`resolveAiConfig(supabase, userId)` (`src/lib/api/ai-config.ts:26-44`) → `{ service: "openrouter",
apiKey: process.env.OPENROUTER_API_KEY, model }`. There is no per-user key and no role gate: every
call reads the one platform env var and the caller's `user_ai_settings.openrouter_model` preference
(default `openai/gpt-4.1`); a missing env var returns `null` and every call site surfaces "No AI
service configured." `generateAiJsonResponse` / `generateAiTextResponse` (`ai-dispatcher.ts`) now
have a single path into `src/lib/api/openrouter.ts`, which speaks the OpenAI Chat Completions schema
(`/chat/completions`, not the Responses API `openai.ts` uses) — raw `fetch`, no AI SDK. Prompts live
in the `prompt` table with `FALLBACK_*` code constants as the floor.

**Image generation is the one exception**: `resolveImageKeys()` (`ai-config.ts:51-56`) still reads
`GEMINI_API_KEY` / `OPENAI_API_KEY` directly and calls `gemini.ts` / `openai.ts` — those providers were
never routed through OpenRouter. `src/lib/api/claude.ts` was deleted the same day (text generation was
its only consumer).

## Security layers

Five layers, outside-in; only the first four exist today — headers/rate-limiting is planned
(`.specs/features/security-p0/`):

1. **Middleware** (`src/proxy.ts`) — refreshes the session (`auth.getUser()`, lines 49-51) and, for
   any authenticated request, a `profiles.type` lookup (lines 81-85) to clamp `referrer` users —
   this runs on **every** request the matcher covers, including `/api/*` and `/m/*`.
2. **Page gate** (`src/lib/auth/page-gate.ts:87-96`) — `requirePageAccess()` repeats the same
   `getUser()` + `profiles` lookup per server component render (not reused from middleware).
3. **Server-action gate** — ad hoc per feature: `chat/actions.ts`'s `requireChatUser()` (lines 53-69)
   is the model (`getUser()` + role allowlist on every call, including a 2s-interval poll); many other
   `actions.ts` files skip this and rely on RLS alone (~54 exported actions with no `getUser()` call —
   see `.specs/codebase/CONCERNS.md`).
4. **RLS** — every table; the server client runs as the authenticated user. Last/hardest boundary,
   and the *only* boundary for the 54 ungated actions above.
5. **Headers / rate limiting** _(planned, not implemented)_ — no CSP, no per-IP throttling on `/api/m/*`
   or the webhooks; direction decided 2026-09-15 is in-memory + Vercel WAF, no new dependency.

`ROLE_FALLBACK` (used by both middleware and page gate): admin/manager→`/dashboard`,
operational→`/internal-projects`, developer/client/qa/referrer→`/projects`, lead→`/ideas-refiner`.

## Storage

Four public buckets: `avatars` (5MB), `user-signatures` (2MB), `project-files` (50MB), `chat-attachments` (25MB).
Public read; authenticated upload/update/delete.
