# STATE — Move37 Operational System

_Persistent memory: decisions, blockers, lessons, todos, deferred ideas._
_Initialized 2026-06-21 from git history + changelog._

## Decisions

- **2026-09-16 — Cloudflare Workers deployment, OpenNext adapter, Next 16.3.5, sanitizer swap, html-docx-js vendoring.** Host is now Cloudflare Workers (`https://move37-operational-system.f3importers.workers.dev`); Vercel is retired as the host. Adapter chosen: `@opennextjs/cloudflare` 1.20.6 + `wrangler` 4.x — rejected `vinext` because it self-declares "not production-ready"; OpenNext is stable and supports Next 16. Peer range is `>=15.5.24 <16 || >=16.3.3`, which excludes 16.0–16.3.2, so Next was upgraded 16.1.6 → 16.3.5. Sanitizer: `isomorphic-dompurify` → `sanitize-html` (htmlparser2, pure JS) because jsdom cannot run on Workers; `dompurify` retained for browser-only SVG call sites. Stricter allow-list: inline `style` is 3-property + per-property value patterns, URL schemes http/https/mailto (data: only on img src), disallowed tags drop contents, `target=_blank` gains `rel="noopener noreferrer"`. html-docx-js: not replaced (cheaper); UMD build vendored at `public/vendor/html-docx.js`, loaded on demand by `src/lib/load-html-docx.ts`; six export modals call `loadHtmlDocx()`. Crons: Cloudflare Cron Triggers in `wrangler.jsonc` (`0 * * * *`, `15 * * * *`, `30 * * * *` — hourly, staggered). Genuine improvement: Vercel Hobby plan caps crons at once per day and *fails the deployment* for anything more frequent — early in this work that exact limit broke deployments; Cloudflare Cron Triggers are free with no frequency floor. Builds must run on Linux (OpenNext's symlink requirement). Supabase unchanged: same project `bcarzmfdamsozmfjgnpv`, 40 migrations, local and production verified in sync (85 tables, 44 enums on both).

- **2026-09-15 — Poll interval confirmed at 5s, measured live.** The 2s → 5s change was an
  assumption flagged for veto; it is now verified in the running app (8 `POST /chat` requests in a
  22-second window, where 2s polling produced roughly 22). Kept.
- **2026-09-15 — Archived logs are kept, not deleted.** `archive/legacy-logs/` holds three former
  root logs (~820 KB), already preserved in git history. Nothing depends on the space, so they stay;
  remove with `git rm -r archive/legacy-logs` whenever you want them gone.
- **2026-09-15 — Vercel Firewall rules are blocked, not skipped.** No Vercel token is stored on this
  machine, so edge rate-limit rules cannot be created from the repo. The exact rule table and a
  verification command live in `architecture.md`. Until they exist the published rate limits are
  advisory, because `src/lib/rate-limit.ts` counts per serverless instance.
- **2026-09-15 — Production index migration applied directly.** Every target table was under 50 kB,
  so a plain `CREATE INDEX` holds its lock for well under a millisecond and the
  `CREATE INDEX CONCURRENTLY` path documented in the migration header was unnecessary. Applied
  through `apply_migration` so production migration history stays in step with the repo.
- **2026-09-15 — Hardening decisions.** Rate limiting: an in-memory per-instance limiter
  (`src/lib/rate-limit.ts`) plus Vercel Firewall rules as the authoritative control — chosen over
  Upstash Redis to avoid a paid dependency; the limiter is explicitly best-effort and says so.
  Sanitizer: `isomorphic-dompurify` so one allow-list runs on both server and client, rather than
  sanitizing only at write time (which would have left every pre-existing row unsanitized).
  HSTS ships **without** `preload` — entering the browser preload list is slow to reverse and binds
  the apex domain, so it is a deliberate opt-in, not a default. CSP ships Report-Only because the
  app has an inline theme script and `/m` renders a `srcDoc` iframe; enforcement needs a nonce pass.
- **2026-09-15 — Authentication gates add authentication only, never authorization.** Server actions
  that relied on RLS alone are getting an explicit "is there a signed-in user" check. RLS remains the
  authority on *which rows* a user may touch. Adding role checks to those actions would change who
  can do what, which is a product decision and is tracked separately.
- **2026-09-15 — UX blueprint phase deliberately skipped.** The `app-update-kickoff` workflow calls
  for a `dont-make-me-think` friction map and blueprint before UI work. This session changed no user
  journey — only loading/error boundaries and lazy loading, which are invisible when they work — so
  the blueprint gate was skipped on purpose rather than by oversight.
- **2026-09-15 — Repo reorg.** Root logs moved to `archive/legacy-logs/`; `supabase/migrations-archive`
  moved to `archive/supabase-migrations-archive/`; `docs/changelog.md` split at 2026-07 with older
  entries in `docs/changelog-archive/2026-H1.md`; new root docs (`database.md`, `design-system.md`,
  `hooks.example.md`, `CHALLENGES.md`) and `.agents/stack-context.md` created; new
  `.claude/settings.json` (permission allow/deny lists) landed; `.claude/agents/` holds 6 authored
  subagents. Nothing was deleted except five unreferenced Next.js scaffold SVGs — everything else
  was archived, so deletion stays the user's call.
- **2026-08-14 — OpenRouter platform key replaces per-user keys** (migrations
  `20260814120000_openrouter_platform_ai.sql`, `20260814140000_drop_legacy_user_ai_keys.sql`;
  supersedes the 2026-06-14 "agency AI key tier" entry below — kept for history, marked superseded).
  `resolveAiConfig` (`src/lib/api/ai-config.ts:26-44`) now returns `{ service: "openrouter", apiKey:
  process.env.OPENROUTER_API_KEY, model }` — no per-user provider key, no role gate. `user_ai_settings`
  is reduced to `owner_id, created_at, updated_at, openrouter_model` (default `openai/gpt-4.1`);
  `active_service`, all three provider key/model columns, `use_agency_settings`, and the `os_ai_service`
  enum were dropped. `resolveImageKeys()` (`ai-config.ts:51-56`) is untouched — image generation still
  calls Gemini/OpenAI directly on `GEMINI_API_KEY`/`OPENAI_API_KEY`. `referrer`/`lead` no longer have a
  personal-key-only restriction; everyone shares the platform key.
- **2026-07-02 (migration date) — PRD collapsed to one document.** `idea_prd` now stores a single rich-HTML
  `description` (the 10 per-section columns were backfilled into it, then dropped — migration
  `20260702000000_idea_prd_single_description.sql`). The PRD prompt emits 10 numbered sections with
  per-feature "Tools used in this area", Connected Platform Integrations, and a phased delivery plan with
  tools per phase. `PrdOutput = { description }`. Database/Visual/Milestones/Playbook/chatbots/logo-gen and
  the docs-feature playbook compiler all read `idea_prd.description`; legacy prompt placeholders resolve to
  the full doc (primary) or a pointer (secondary) so DB-stored prompts keep working without rewriting them.
- **Step order (confirmed):** `IDEA_BLOCKS_ORDERED` is canonical — benchmarking is step 6, market_opportunity
  step 7 (benchmarking's comparables feed sizing). The `IdeaBlock` type-union order is NOT the step order;
  several docs had drifted to the old market→benchmarking order and were corrected 2026-06-23.
- **2026-06-14 — Removed talent/leads domain.** Dropped `talent*`, `client`, `company` tables and
  the `/talent-pool`, `/talent-profile`, `/leads`, `/recommended-projects` pages. Referrer home → `/projects`.
- **2026-06-14 — Removed agency AI key tier.** _(Superseded 2026-08-14 — see entry above; kept for
  history.)_ Dropped `agency_ai_settings`. AI resolution was personal key → `OPENAI_API_KEY`/
  `GEMINI_API_KEY` env → null. `referrer`/`lead` were personal-key-only.
- **Marketing validation is per-idea, not per-project** (migrated 2026-06-10). All `mkt_*` tables FK to `idea`.
- **Devil's-Advocate debate lives in Risk & Validation (step 9), not Report (step 10).** Report reads the
  debate output; this broke a circular dependency.
- **Report is a pre-build go/no-go gate** (step 10, before PRD). Scores only discovery evidence (steps 1–9).
- **Social provider: Buffer + Postiz** (Postiz replaced Ayrshare for cost). Apify used for sourcing.
- **Rebrand: Blur Studio → Move37** (full migration). Route renamed `sandbox-planner` → `ideas-refiner`.

## Lessons

- **Always check the write error after AI generation.** A swallowed insert error on a missing column
  manifests as a silent ~4-minute timeout with no data (e.g. the un-applied `idea_demand_evidence` migration).
- **Pass `maxTokens: 16384` for multi-field rich-HTML AI steps.** The 8,192 default truncates JSON → parse fails → empty page.
- **Chat tab panels must guard overlapping polls** (`loadingRef`) and only poll while visible — a 2s
  interval fanning out 5 server actions floods the queue and starves user saves.
- **`getPromptTemplate` runs `stripHtml`** on stored prompts — describe output structure in words, not literal tags.
- **DB `prompt` rows override `FALLBACK_*` constants.** When a prompt's variables/output shape change, re-seed
  the DB row via an idempotent `INSERT … ON CONFLICT DO UPDATE` migration AND update the code FALLBACK — editing
  only the constant has no effect where the DB row exists (which is every prompt in local + prod).
- **Dropping a column requires fixing every explicit `select("col, …")`.** PostgREST errors on a missing column,
  so each generate function's select + render-vars must move together; `select("*")` callers (e.g. `loadIdeaFull`)
  adapt automatically.
- **html2canvas can't parse Tailwind v4 `oklch()`** — use inline hex styles for client-side PDF rendering.
- **Windows + Turbopack** can hold stale bracket-route entries; a config no-op edit forces a rescan.
- **Docs/`.specs` drift is a real failure mode, not a hypothetical one.** The 2026-08-14 OpenRouter
  migration left `.specs/codebase/` describing the old per-user-key AI model for 7 weeks before this
  2026-09-15 reconciliation pass. RULES §10 now ties a `.specs/` refresh to every `docs/changelog.md`
  entry that touches architecture, AI, or auth — not just to explicit "map codebase" requests.

## Blockers / Watch-outs

- **Vercel cron** removed for Hobby-plan compatibility; the marketing cron worker endpoints
  (`/api/mkt/cron/*`) need a paid plan or an external scheduler to fire automatically.
- **Apify B2B people-search** (`code_crafter/leads-finder`) is blocked on the Apify free plan; needs a paid plan.
- **No automated test suite** — verification is manual/live (Playwright ad-hoc) + `tsc --noEmit`.

## Deferred Ideas

- Stripe pre-order capture (quiz + waitlist live; preorder stubbed).
- A/B landing variants + `mkt_decision_log` pivot taxonomy (P2).
- PostHog session recordings on landing pages.

## Preferences

- Changelog entry required every session (`docs/changelog.md`).
- Commands prefixed with `rtk` for token savings (see `CLAUDE.md`).
- Local-first: most sessions are local-only (no prod Supabase push / no Vercel deploy) unless explicitly authorized.
- Model routing by task: **Opus** for cross-file reconciliation/audit work (this kind of `.specs`
  catch-up), **Sonnet** for implementing already-spec'd features, **Haiku** for mechanical/rote edits.
