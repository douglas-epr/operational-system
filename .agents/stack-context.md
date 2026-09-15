# Stack Context

Generated: 2026-09-15

## Stack
- **Language**: TypeScript 5 (strict mode, `noEmit`, `target: ES2017`, `moduleResolution: bundler`) — no `.js` app code aside from `scripts/unwrap-types.js`
- **Framework**: Next.js 16.1.6, App Router, Turbopack (`next.config.ts` pins `turbopack.root` to the repo to stop Tailwind v4 from scanning outside it); React 19.2.3 + React DOM 19.2.3; DB layer is Supabase (`@supabase/ssr` 0.9, `@supabase/supabase-js` 2.98) — no ORM, raw `supabase-js` query builder against PostgreSQL 15/17
- **Build**: `next build` (Turbopack), dev via `next dev --port 4000` (Turbopack)
- **Test**: **FACT — no test runner and no tests exist in this repo.** No Jest/Vitest/Playwright config, no `__tests__`/`*.test.*`/`*.spec.*` files, no test script in `package.json`.
- **Lint**: ESLint 9 flat config (`eslint.config.mjs`) via `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`. CI gate: **no** — no `.github/workflows/` in this repo; lint is a manual/local gate only (`npm run lint`, exit 1 on errors but nothing currently blocks a push on it).
- **Format**: no dedicated formatter config (no `.prettierrc`); relies on ESLint's `core-web-vitals`/`typescript` rule sets. CI gate: no.

## Secondary Languages
- SQL (PL/pgSQL) — `supabase/migrations/*.sql`, append-only migration files defining schema, enums, RLS policies, and helper functions
- CSS — Tailwind v4 utility classes + a small set of CSS custom properties for design tokens; `postcss.config.mjs` only wires `@tailwindcss/postcss`, no other PostCSS plugins

## Conventions
- **Deploy**: Vercel, auto-deploy on push to `master`. Dev server port **4000** (`package.json` `dev` script), prod/local-prod port **30003** (`dev:prod` / `start` scripts). No `vercel.json` build/route overrides — the file only sets `$schema`.
- **Middleware naming**: Next.js 16 renamed `middleware.ts` → `proxy.ts`. This repo's session/auth gate lives at `src/proxy.ts` (exports `proxy()` + `config.matcher`), not `middleware.ts` — do not look for the old filename.
- **AI integration — FACT, not a mistake to "fix"**: there is **no AI SDK** (no Vercel AI SDK, no LangChain) anywhere in this codebase. All text/JSON AI generation is a **raw `fetch` call to OpenRouter** in `src/lib/api/openrouter.ts` (OpenAI-compatible Chat Completions schema, single platform-owned `OPENROUTER_API_KEY`, see `docs/changelog.md` 2026-08-14 entry). `resolveAiConfig()` in `src/lib/api/ai-config.ts` is the sole resolver for text/JSON generation — it no longer branches on provider or reads per-user keys. OpenAI and Gemini are used **only for image generation**, via `resolveImageKeys()` in the same file, which just reads `OPENAI_API_KEY` / `GEMINI_API_KEY` from the environment directly (no dispatcher, no fallback chain).
- **Table naming convention** — sampled from `supabase/migrations/20260101000000_production_baseline.sql` (first 15 `CREATE TABLE` statements): `agency`, `agency_ai_settings`, `agreement_template`, `client`, `client_who_referred_this_talent`, `company`, `conversation_internal_project_message`, `conversation_internal_project_message_thread`, `conversation_private`, `conversation_private_message`, `conversation_private_message_thread`, `conversation_project_external_message`, `conversation_project_external_message_thread`, `conversation_project_internal_message`, `conversation_project_internal_message_thread`. **Convention: singular, snake_case** (never pluralized — `client` not `clients`, `agency` not `agencies`), including for compound/junction-style tables (`conversation_*_message_thread`). No mixed or plural table names observed in the sample.
- **RLS**: every table carries policies built on `public.get_user_type()`, `public.is_admin_or_manager()`, `public.is_staff_role()`, `public.is_operational_user()`, and `auth.uid()` (see project `CLAUDE.md` / `RULES.md` §3 for the three-tier model).
- **Migrations**: append-only — every schema change is a new numbered file under `supabase/migrations/`; existing migrations are never edited (`RULES.md` §2.1).
- **Env config**: `.env.example` documents required vars — Supabase (URL/anon/service-role), Brevo, `OPENROUTER_API_KEY` (required, platform text/JSON AI), `OPENAI_API_KEY`/`GEMINI_API_KEY` (image-gen only), `CRON_SECRET` (Vercel Cron auth for `/api/mkt/cron/*`), Apollo/Apify/Pexels/Postiz/Stripe for the marketing validation engine.
- **Local Supabase** (`supabase/config.toml`): API port 54321, DB port 54322, Studio 54323, Inbucket (email testing) 54324, Postgres major version 17, storage file size limit 50MiB.

## CI Gates
- **None configured.** No `.github/workflows/`, no `.gitlab-ci.yml`, no other CI pipeline found in the repo. `npm run build`, `npm run lint`, and `npx tsc --noEmit` are the three gate commands this project treats as its manual quality bar (see `.specs/evaluations/_baseline-2026-09-15.md`), but nothing currently enforces them automatically before a `master` push triggers the Vercel auto-deploy.
