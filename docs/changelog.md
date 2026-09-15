# Changelog

> Older entries (2026-03 to 2026-06): [changelog-archive/2026-H1.md](changelog-archive/2026-H1.md)

All notable changes to this project are documented here.
Format: `[YYYY-MM-DD] — Description`

## [2026-09-15] — Documentation refresh, spec workspace, project agents, repo reorganization

Context: every root document and every file in `.specs/` still described the pre-OpenRouter AI
model seven weeks after the 2026-08-14 migration shipped. `docs/changelog.md` was the only
current document. This pass reconciled the documentation with the code, established a spec
workspace with binary acceptance criteria, created the project's subagents, and reorganized
the repository root.

### Documentation

- **Corrected the AI model everywhere.** `CLAUDE.md`, `README.md`, `RULES.md`, `architecture.md`
  and `docs/project_status.md` described per-user provider keys, an `OPENAI_API_KEY`/`GEMINI_API_KEY`
  resolution chain, a `referrer`/`lead` personal-key-only tier, and the `os_ai_service` enum — all
  removed on 2026-08-14. They now describe the single platform `OPENROUTER_API_KEY` path through
  `src/lib/api/openrouter.ts`, with `user_ai_settings.openrouter_model` as the only per-user AI
  setting and OpenAI/Gemini retained for image generation only.
- **Removed a documented module that does not exist.** `architecture.md` described
  `src/lib/api/claude.ts` in both the dispatch diagram and the directory map; it was deleted during
  the OpenRouter cutover.
- **New `database.md`** — schema intent by domain, the enum catalogue, the RLS tier model, naming
  conventions as actually observed, the migration workflow, and an audited index inventory.
- **New `design-system.md`** — design tokens with light and dark values, the `PageShell`/`PageHeader`
  contract, a 19-component inventory, the icon policy, both TipTap editors, and the hex-only
  constraint for PDF export.
- **New `hooks.example.md`** — three optional Claude Code hook recipes (ship-command guard,
  post-edit type check, session-end checklist), documented but not enabled.
- **New `CHALLENGES.md`** — the self-learning log required by the operating rules.
- **Operating rules installed** into `CLAUDE.md`: deployment guardrails, the PENDING block
  convention, the code-quality routing table, and the clean-code guard pass.
- **Corrected table counts.** An earlier audit figure of "97 tables, 97 with RLS" was wrong and had
  spread into three documents. Verified across all 39 migrations: the baseline defines 80 tables,
  85 are live, and all 85 have RLS enabled.
- **RTK reference moved** out of `CLAUDE.md` (136 lines of generic command cheat-sheet) into
  `docs/rtk.md`, leaving a pointer.
- **New rules**: indexes on every foreign key in the same migration (§3.6), `/api/*` routes must
  authenticate and fail closed (§6.5), every `dangerouslySetInnerHTML` goes through `sanitizeHtml`
  (§7.4), and `.specs/` plus `docs/project_status.md` must be updated alongside every changelog
  entry (§10.4). The obsolete "Referrer / Lead users" AI section was deleted.

### Spec workspace

- Refreshed all ten files under `.specs/project/` and `.specs/codebase/` against the real code.
- **Five new feature specs** under `.specs/features/` — `security-p0`, `server-action-guards`,
  `auth-roundtrips`, `db-indexes`, `bundle-and-boundaries` — each with P0/P1/P2 stories, numbered
  binary acceptance criteria, explicit out-of-scope lists, and verification commands. 261 criteria total.
- **New `.specs/evaluations/`** holding the pre-change gate baseline (`tsc` clean, lint 82 problems,
  build passing with 41 routes) and the frozen acceptance-criteria checklist used for grading.
- `.specs/codebase/CONCERNS.md` re-ranked against the 2026-09-15 audit, every item carrying
  `file:line` evidence and a pointer to the spec that fixes it.

### Project agents

Six subagents created in `.claude/agents/`, each tracing to a spec or a documented rule:
`move37-migration-author`, `move37-server-action-author`, `move37-ui-builder`,
`move37-spec-conformance-reviewer`, `move37-security-reviewer`, `move37-docs-sync`. Each
code-writing agent carries the stack-context read, the principle-skill routing, the clean-code
guard pass, and a refusal to commit, push, apply to production, or deploy.

### Performance

- **Middleware no longer runs on `/api/*` or `/m/*`.** `src/proxy.ts` ran `auth.getUser()` plus an
  unconditional `profiles` query on every matched request, including cron, webhook and anonymous
  landing traffic, which already authenticate themselves. Two Supabase round-trips per request
  became zero on those paths. The profile query is now also skipped when the requested path is
  already inside the referrer allow-list, where the clamp could never fire.
- **Request-scoped auth lookup.** New `src/lib/auth/current-user.ts` wraps the user-plus-role lookup
  in React `cache()`; `requirePageAccess`, `requireChatUser`, `requireInternalStaff` and
  `getUserIdOrError` all consume it, so repeat gate calls within one request cost one round-trip
  instead of two each.
- **Chat polling reduced.** Four 2-second server-action polls moved to 5 seconds, roughly 60 percent
  fewer round-trips per open tab. The 20-second conversations sidebar poll is now gated on tab
  visibility and refreshes immediately on focus, so a backgrounded tab issues no requests at all.
- **Foreign-key indexes** — new migration `20260915000000_fk_indexes.sql` adds 39 indexes on
  `idea_id`, `landing_id`, `internal_project_id`, `project_id`, `task_id`, `campaign_id`,
  `prospect_id` and Tier-2 `created_by` columns, and drops 4 duplicate index pairs. Applied locally
  only; the header documents the `CREATE INDEX CONCURRENTLY` path for production.
- **Bounded queries.** `okrs`, `internal-projects` and `users` pages replaced `select("*")` with
  explicit column lists and row limits; two `max(order)` computations that fetched an entire column
  to reduce it in JavaScript now order and limit in the database. `select("*")` in the Ideas Refiner
  went from 21 occurrences to 9 across the two heaviest files; the remainder are documented in place
  with revisit triggers, because their rows are forwarded through dynamic key access and a guessed
  column list would be a silent runtime bug.
- **Code splitting.** Both TipTap editors and three Recharts consumers now load through
  `next/dynamic` with token-styled skeletons at matching heights, so no layout shift. Fifteen
  Ideas Refiner and Projects call sites switched to the lazy editor. Callers that read the editor
  through an imperative ref were deliberately left static: `next/dynamic` replaces `ref.current`
  with its own retry object rather than forwarding the ref, so lazy-loading them would have made
  `getHTML()` return undefined and silently saved empty Work Feedback fields.
- **Route boundaries.** The app had no `loading.tsx`, `error.tsx`, `not-found.tsx` or `Suspense`
  anywhere. Added root-level loading, error, global-error and not-found boundaries plus per-segment
  loading skeletons for `dashboard`, `chat`, `ideas-refiner` and `marketing/[ideaId]`.
- `compiler.removeConsole` now strips `console.log` from production builds while keeping
  `console.error`. Removed the deprecated `@types/dompurify` stub from dependencies.
- **Regenerated `src/lib/supabase/types.ts`**, which was stale and missing columns on `idea`
  (`location`, `jurisdiction`) plus three whole tables.

### Repository reorganization

- Git index corrected from `claude.md` to `CLAUDE.md`; on a case-sensitive checkout the old name
  would not have been picked up by tooling expecting the canonical spelling.
- Three committed dev logs (about 820 KB, one of them 816 KB) moved to `archive/legacy-logs/`;
  63 superseded migrations moved to `archive/supabase-migrations-archive/`; a stray Supabase Studio
  scratch query moved to `archive/snippets/`.
- `docs/changelog.md` split: 125 entries through 2026-06-27 moved to
  `docs/changelog-archive/2026-H1.md`, and the byte-order mark stripped from both files.
- `.claude/settings.local.json` and `.claude/scheduled_tasks.lock` untracked (a runtime lock and a
  machine-local permission list containing a dead process id and paths to a previous project name);
  the local allow-list collapsed from 186 entries to 19. A new tracked `.claude/settings.json` holds
  shared prefix permissions and a deny list for push, deploy and production database pushes.
- Removed a broken `.claude/skills` git link that had no `.gitmodules` entry and contained no skills.
- `.claude/launch.json` corrected from port 3000 to 4000 to match `package.json`.
- `skills-lock.json` moved under `.claude/`; five unreferenced Next.js scaffold SVGs removed.
- `.gitignore` extended to cover logs, the machine-local Claude settings, the runtime lock and
  Supabase snippets, and a duplicated `.vercel` entry removed.

## [2026-09-15] — Security P0: public-surface hardening (S1–S8)

- **S1 — Brevo webhook authenticated**: `src/app/api/webhooks/brevo/route.ts` now requires a shared secret (`BREVO_WEBHOOK_SECRET`, via `X-Brevo-Token` header or `?token=` query param, compared with `secretEquals`) before any DB read/write. Fails closed in production when the secret is missing or wrong; warns once and allows in development when unset, matching the Cal.com/Tally pattern.
- **S2 — `sanitizeHtml` is now server-safe**: `src/lib/sanitize.ts` rewritten on `isomorphic-dompurify` (new prod dependency; `@types/dompurify` removed as redundant/deprecated) — no more `typeof window === "undefined"` no-op branch, so RSC/SSR renders are sanitized identically to the client. Allow-list extended for TipTap output (`hr`, `mark`, `sub`, `sup`, `img`; `style`/`colspan`/`rowspan`/`colwidth`/`align`/`src`/`alt`/`title` attrs), plus a `uponSanitizeAttribute` hook that strips `style` values containing `javascript:`, `expression()`, `url()`, `@import`, or `-moz-binding`.
- **S3 — ~19 `dangerouslySetInnerHTML` sites routed through `sanitizeHtml`**: all sites in `src/app/docs/_components/**` and `src/app/ideas-refiner/_components/**` owned by this pass (`DailyFeedbackTab`, `DocumentPreviewModal`, `AgreementDrawer`, `AgreementFormModal`, `PlaybookEditor`, `BriefPreviewModal`, `IdeasGrid`, `PrdPreviewModal`, `ProductDefinitionStep`, `RefiningIcpStep`, `ReportPreviewModal`, `ReportStep`, `StrategicFrameworksStep`, `StructureAlignStep`). `ThemeScript.tsx` documented as an intentional exception (static constant, no runtime data). `ProjectTabsPanel.tsx` / `InternalProjectTabsPanel.tsx` (chat) deferred to the agent owning `src/app/chat/**`.
- **S4 — `/m/[slug]` iframe sandbox tightened**: removed `allow-same-origin` (paired with `allow-scripts` it defeated the sandbox). The iframe now has an opaque origin, so `/api/m/event` and `/api/m/[slug]/capture` gained explicit CORS (`OPTIONS` handler + `Access-Control-Allow-Origin: *`, scoped to POST/OPTIONS, no credentials). **Known regression**: the in-iframe tracker's `utm()` helper reads `parent.location.search`, which is no longer reachable across the opaque-origin boundary — it degrades to `{}` (caught, doesn't throw) rather than throwing, so UTM attribution from in-iframe scroll/click events is lost until a follow-up passes UTM params in via the existing `window.__MKT_*` contract instead.
- **S5 — dedicated unsubscribe signing secret**: `src/lib/marketing/outreach.ts` now signs with `UNSUBSCRIBE_SIGNING_SECRET` (fallback `CRON_SECRET`), never `SUPABASE_SERVICE_ROLE_KEY`. **Migration note**: any unsubscribe link issued before this change and signed via the service-role key will fail verification once `UNSUBSCRIBE_SIGNING_SECRET`/`CRON_SECRET` differ from that key — acceptable since those links are single-purpose and short-lived, but worth a heads-up if old emails are still in inboxes.
- **S6 — rate limiting**: new dependency-free `src/lib/rate-limit.ts` (in-memory, per-instance, fixed-window, hard-capped at 10k tracked keys). Applied to `/api/m/event` (60/60s per IP), `/api/m/[slug]/capture` (5/60s per IP+slug), `/api/m/unsubscribe` (20/60s per IP), and all three `/api/webhooks/*` routes (120/60s per IP). 429 responses carry `Retry-After`. This is explicitly a best-effort courtesy layer, not authoritative — the authoritative control is a Vercel Firewall rate-limit rule (not yet added to `architecture.md` in this pass; see report).
- **S7 — `server-only` guard**: added `import "server-only";` as the first line of `src/lib/supabase/server.ts`, matching `src/lib/marketing/public.ts` / `src/lib/auth/secretCompare.ts`. No client component imports it.
- **S8 — HSTS + report-only CSP**: `next.config.ts` now sends `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` and a `Content-Security-Policy-Report-Only` baseline (`'self'` + `'unsafe-inline'` for style/script, Supabase/OpenRouter/Brevo in `connect-src`, `frame-src 'self' blob:` for the `/m` iframe). Enforcing CSP intentionally not enabled yet. Also added `compiler.removeConsole: { exclude: ["error"] }`.
- **Also**: `vercel.json` now declares hourly (staggered) crons for the three `/api/mkt/cron/*` routes; `.env.example` reconciled to the 23 env vars actually read under `src/` (added `BREVO_WEBHOOK_SECRET`, `UNSUBSCRIBE_SIGNING_SECRET`, `CALCOM_WEBHOOK_SECRET`, `TALLY_WEBHOOK_SECRET`, `BREVO_TEMPLATE_MAGIC_LINK`, `BREVO_TEMPLATE_PASSWORD_RESET`, `BUFFER_API_KEY`, `BUFFER_ORG_ID`; removed unused `APOLLO_API_KEY`, `POSTIZ_CLIENT_ID`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`; fixed `NEXT_PUBLIC_APP_URL` to port 4000).
- **Flagged, not applied in this pass**: documenting the Vercel Firewall rules + per-instance caveat in root `architecture.md` (out of this agent's file-scope this session); the HSTS `preload` directive is irreversible for the apex domain and should be confirmed before it ships; `vercel.json` crons touch a file the security-p0 spec had marked out-of-scope (deferred to a `server-action-guards` spec) — included here per explicit task instruction, flagging the overlap.

## [2026-08-14] — OpenRouter becomes the platform AI provider (no more per-user API keys)

- **What changed**: every text/JSON AI generation in the app now runs through **OpenRouter** on a single platform-owned key (`OPENROUTER_API_KEY`). Users no longer choose a provider or paste their own OpenAI/Gemini/Claude key — the only setting left is *which model* to run on.
- **`resolveAiConfig` is the whole switch**: because all ~30 AI call sites only forward `{ service, apiKey, model }` into the dispatcher, changing the resolver + dispatcher swapped the entire platform. No call site was touched. It now returns `{ service: "openrouter", apiKey: env, model: userPref ?? "openai/gpt-4.1" }` and no longer reads keys or gates on role (the `referrer`/`lead` personal-key-only tier is gone — they get platform AI like everyone else).
- **New `src/lib/api/openrouter.ts`**: OpenRouter speaks the OpenAI **Chat Completions** schema (`/chat/completions`, `messages[]`), not the **Responses** schema (`/responses`, `input`) that `openai.ts` uses — so it needed its own client rather than a base-URL swap. Also treats an HTTP 200 with an `error` payload as a failure, which OpenRouter returns when an upstream provider dies.
- **`ai-dispatcher.ts` collapsed** to a single OpenRouter path; `src/lib/api/claude.ts` deleted (text generation was its only consumer). `openai.ts` and `gemini.ts` remain — **image generation still calls those providers directly** and keeps using `OPENAI_API_KEY` / `GEMINI_API_KEY`.
- **DB** (`20260814120000_openrouter_platform_ai.sql`): added `user_ai_settings.openrouter_model text NOT NULL DEFAULT 'openai/gpt-4.1'`.
- **DB cleanup** (`20260814140000_drop_legacy_user_ai_keys.sql`, same day, after confirmation): dropped `active_service`, `openai_api_key`, `gemini_api_key`, `claude_api_key`, `openai_model`, `gemini_model`, `claude_model`, `use_agency_settings`, and the now-unreferenced `os_ai_service` enum. Verified via `pg_attribute` beforehand that `user_ai_settings.active_service` was the enum's only remaining column (`agency_ai_settings` was dropped 2026-06-14). This destroyed 1 OpenAI key and 2 Gemini keys across 2 rows — **dropping the column does not revoke them, so those keys still need rotating at their providers.** `user_ai_settings` is now just `owner_id, created_at, updated_at, openrouter_model`; RLS still enabled with the `own row` policy; both rows preserved. `AiService` narrowed to the single literal `"openrouter"`.
- **UI**: `AiSettingsForm` is now a single OpenRouter model dropdown (14 curated models, slugs verified against the live `/api/v1/models`) with no key inputs. The "configure AI before you can refine an idea" gate is gone from the Ideas Refiner — `hasAiConfigured` and `AiSettingsModal.tsx` were removed, since AI is always available now. The inline `AiConfigModal` survives as a *change model* affordance on the error toast.
- **Server-side validation**: `saveAiSettings` rejects any model slug not in `OPENROUTER_MODELS` — the value is sent to OpenRouter verbatim, so it must not be free-form user input.
- **Ops**: `OPENROUTER_API_KEY` must be set in Vercel (Production + Preview). Without it `resolveAiConfig` returns `null` and every generation reports "No AI service configured."

## [2026-08-07] — Fix: PRD generation failing with "Could not find the 'description' column of 'idea_prd'"

- **Symptom**: generating a PRD on `/ideas-refiner?idea=…&tab=prd` failed with *"Could not find the 'description' column of 'idea_prd' in the schema cache"*.
- **Root cause**: `20260702000000_idea_prd_single_description.sql` (the PRD collapse) was committed but **never applied to the remote database**. It was the only local migration missing from `supabase_migrations.schema_migrations` — the ledger jumped from `20260701000000` straight to the work-feedback migration. Production still had the ten per-section columns and no `description`, while the deployed code, `types.ts`, and `PrdOutput` all wrote `{ description }`.
- **Second, more serious bug found in that migration**: the backfill used `<>` (SQL *not-equals*) instead of `||` (concatenation) in all ten `THEN` branches — e.g. `THEN '<h2>App Overview</h2>' <> app_overview`. Because `concat_ws` accepts `"any"` and silently casts, this raises **no error**; it would have written `t\nt\nt…` into `description` and then dropped the ten source columns, irreversibly destroying all 7 existing PRDs. Verified by dry-running the exact expression read-only before applying. Fixed the ten operators in the migration file — an exception to the append-only rule that was mandatory here, since the migration had never been applied anywhere and leaving it would corrupt any fresh bootstrap.
- **Applied to production**: added `description text`, backfilled from the old columns (each non-empty section wrapped in its `<h2>` heading), dropped the ten per-section columns, and seeded the `PRD Prompt` row (`5041e57c-…`, group 9) which was absent — the app had been silently falling back to `FALLBACK_PRD` in `ideas-refiner/actions.ts`.
- **Verified**: all 7 PRDs preserved with byte lengths identical to the pre-flight dry run (4.5 KB–21 KB, all starting `<h2>App Overview</h2>`); zero corrupt or empty rows; `idea_prd` columns now exactly match `types.ts`; RLS still enabled with both policies; a rolled-back round-trip insert of `{ idea_id, description }` succeeded; `tsc --noEmit` clean. No application code changes were needed.
- **Note**: as with the 2026-07-31 entry, `NOTIFY pgrst, 'reload schema'` was issued so PostgREST picks up the new column without waiting for its cache to expire.

## [2026-07-31] — Work feedback: new "What we have now" field

- **Why**: work feedback captured what was *done* (`current_work`), what's *next* (`next_work`), and what's *blocked* (`blockers`), but not the present state of the deliverable. "What we have now" fills that gap and is the first field in the form so the entry reads state → past → future → blockers → links.
- **DB** (`20260731000000_work_feedback_current_state.sql`): added nullable `current_state text` to `project_work_feedback` and `internal_project_work_feedback`, with column comments. Additive only — existing rows read as `—` in the UI. No RLS change needed (all policies on both tables are row-level and column-agnostic). Generated `types.ts` + the `ProjectDailyFeedback` / `InternalProjectDailyFeedback` interfaces in `src/types/docs.ts` updated to match.
- **UI**: added a fifth rich-text editor labelled "What we have now" to the New/Edit work feedback modals on both `/chat?block=projects&…&tab=daily_feedback` (`ProjectTabsPanel`) and `/chat?block=internal_projects&…&tab=daily_feedback` (`InternalProjectTabsPanel`), plus the matching read-only `FeedbackBlock` in each entry card. It sits first in the 2-column grid. The retired `/docs` `DailyFeedbackFormModal` + `DailyFeedbackTab` were updated in step for consistency (that route now only redirects, so the change there is not user-visible).
- **Server actions**: `current_state` threaded through `createDailyFeedback` / `updateDailyFeedback` (`docs/actions.ts`) and `createInternalProjectDailyFeedback` / `updateInternalProjectDailyFeedback` (`chat/actions.ts`), including the `select()` used to re-sync the linked chat message. Both `buildFeedbackMessage` and `buildInternalFeedbackMessage` now emit a **What we have now** section, so the auto-posted project chat message stays in step with the record on create *and* edit.
- **Chatbot**: `summarize_work_feedback` (`chat/_chatbot/tools.ts`) now selects and returns `current_state` per entry, and its tool description documents the field. The always-on `WORK_FEEDBACK_GUIDANCE` in `run.ts` adds a **What we have now:** block above "What I worked on this period:", so a prompt like "Summarize my work feedback from 20 jul 2026 to 24 jul 2026" includes it for both project and internal-project entries.
- **Note for deploys**: PostgREST caches the schema, so after applying the migration the API returns *"Could not find the 'current_state' column … in the schema cache"* until the cache reloads (`NOTIFY pgrst, 'reload schema'`).

## [2026-07-09] — Fix: task description not saving

- The `description` column on `project_task` was never wired end-to-end: the `Task` type (`src/types/projects.ts`) had no `description` field, the task-list `select()` queries in `src/app/projects/page.tsx` and `getProjectTabBundle` (`src/app/chat/actions.ts`) didn't fetch it, `TaskInput` (`src/app/projects/actions.ts`) didn't accept it, and `TaskModal` initialized its `description` state to `""` unconditionally and never included it in the save payload. The rich-text editor in the Task modal was effectively a dead end. Added `description` to all four spots so it now loads on edit and persists on create/update. Affects both `/projects` task modals and the `/chat` Client/QA Requests ("General Tasks") kanban, which shares the same modal and a separate select query.

