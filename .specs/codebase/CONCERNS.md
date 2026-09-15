# CONCERNS

_Brownfield analysis — 2026-06-21, reconciled 2026-09-15 against a security/perf audit._
_Severity: 🔴 high · 🟠 medium · 🟡 low. Each item cites file:line evidence and, where a fix is planned, the `.specs/features/<slug>` spec that owns it._

## Verified OK (strengths, re-confirmed 2026-09-15)

- RLS enabled on all 85/85 live tables (verified across all 39 migrations 2026-09-15; see database.md).
- All 32 `SECURITY DEFINER` functions pin `search_path` (e.g. `supabase/migrations/20260101000000_production_baseline.sql`, `SET "search_path" TO 'public'`).
- Cron routes (`/api/mkt/cron/*`) and the Cal.com webhook fail **closed** and compare secrets in constant time (`src/lib/auth/secretCompare.ts`, `timingSafeEqual`; `webhooks/calcom/route.ts` fails closed in production when the secret is unset).
- Zero `console.log` in `src/`.
- Only 3 distinct `NEXT_PUBLIC_*` vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`).

## 🔴 Unauthenticated webhook with service-role writes

- `src/app/api/webhooks/brevo/route.ts:22-81` — the Brevo event webhook has **no signature or secret
  check at all** (contrast `calcom`/`tally`, which both verify HMAC). Any caller who knows the URL can
  POST a fabricated `event`/`message-id`/`email` and flip `mkt_outreach.status` or insert into
  `mkt_suppression` via the service-role client (bypasses RLS).
- **Fix:** see `.specs/features/security-p0/spec.md` — add HMAC or a shared-secret query param,
  matching the `calcom`/`tally` pattern.

## 🔴 Mass-assignment server action

- `src/app/ideas-refiner/actions.ts:369-378` (`saveIcpProfile`) takes `data: Record<string, unknown>`
  straight from the client and calls `.update(data)` with no field allowlist and **no `getUser()`
  call** — RLS is the only gate, and any key the caller sends (not just ICP fields) reaches the update.
- **Fix:** see `.specs/features/security-p0/spec.md` — allowlist the updatable columns; add the
  `getUser()` gate.

## 🔴 Server actions with no `getUser()` gate (RLS-only)

- ~54 exported server actions across the 23 `actions.ts` files have no `getUser()`/role check —
  only 56 total `getUser()` calls exist across all of them, concentrated in a handful of files. The
  good pattern is `chat/actions.ts`'s `requireChatUser()` (lines 53-69): `getUser()` + role allowlist
  on every call, including the 2s-poll listing actions.
- **Risk:** a logic gap in a table's RLS policy has no second layer of defense on these paths.
- **Fix:** see `.specs/features/server-action-guards/spec.md` — extend the `requireChatUser`-style
  gate to every mutating action; read-only actions can stay RLS-only per `ARCHITECTURE.md`.

## 🔴 No automated test coverage

- No test runner, no test files. All verification is `tsc --noEmit` + manual/live walk-throughs.
- **Risk:** regressions in RLS, server actions, and the long AI pipelines go uncaught until manual UAT.
- **Mitigation target:** add Vitest (unit) + Supabase-backed integration tests for RLS and actions, and
  Playwright for the 3–4 critical flows. RLS-per-role is the highest-value first target.

## 🔴 Silent AI-generation failures

- Several past incidents: a swallowed insert error (missing column) or token truncation surfaced as a
  silent ~4-minute timeout with empty data — not as an error. Still applicable post-2026-08-14: the
  OpenRouter migration changed the transport (`openrouter.ts`) but not the write path, so the same
  discipline is required at every call site.
- **Rule already in place:** check the write `error` after every AI write; pass `maxTokens: 16384` for
  multi-field rich-HTML steps; guard with `isRequestActive`. Any new generation function must follow this.

## 🟠 Sanitizer is a no-op on the server; 36 `dangerouslySetInnerHTML` sites

- `src/lib/sanitize.ts:24` — `sanitizeHtml()` returns the input **unmodified** whenever
  `typeof window === "undefined"`, i.e. on every server render. The comment justifies this as
  "messages come from trusted LLM/server sources," but 27 files (36 occurrences) call
  `dangerouslySetInnerHTML`, and not all of that HTML originates server-side (e.g. rich-text fields
  edited by users, AI-generated landing-page HTML rendered inside `/m/[slug]`).
- **Fix:** see `.specs/features/security-p0/spec.md` — direction agreed 2026-09-15 is
  `isomorphic-dompurify` so the same sanitizer runs on both server and client.

## 🟠 Public landing iframe sandboxed with `allow-scripts allow-same-origin`

- `src/app/m/[slug]/page.tsx:94-98` — the AI-generated landing page renders in an `<iframe
  sandbox="allow-scripts allow-forms allow-same-origin allow-popups">`. `allow-scripts` +
  `allow-same-origin` together is the well-known combination that lets sandboxed content remove its
  own `sandbox` attribute via script and escape the sandbox entirely.
- **Fix:** see `.specs/features/security-p0/spec.md` — drop `allow-same-origin` (the landing doc
  doesn't need same-origin access to the parent) or move the iframe to a separate origin.

## 🟠 Unsubscribe-token HMAC falls back to the service-role key

- `src/lib/marketing/outreach.ts:56` — `secret()` uses `CRON_SECRET || SUPABASE_SERVICE_ROLE_KEY` to
  sign unsubscribe tokens. The fallback avoids a predictable dev key, but it means the service-role
  key doubles as an HMAC secret for a public-facing token; rotating one now has a side effect on the other.
- **Fix:** see `.specs/features/security-p0/spec.md` — introduce a dedicated `UNSUBSCRIBE_HMAC_SECRET`.

## 🟠 No rate limiting on public marketing endpoints

- `src/lib/marketing/public.ts:67-69` — the code comment states outright: "these endpoints are
  unauthenticated and (currently) unthrottled." Field-length caps exist, but there's no per-IP/session
  throttle on `/api/m/*` writes (capture, event beacons).
- **Fix:** see `.specs/features/security-p0/spec.md` — direction agreed 2026-09-15 is in-memory +
  Vercel WAF, no new dependency.

## 🟠 Repeated auth round-trips per request

- Three separate layers each re-fetch the session and/or profile: middleware (`src/proxy.ts:50-52`
  `getUser()`, `:82-86` `profiles` lookup) on every matched request including `/api/*` and `/m/*`;
  `page-gate.ts:87-96` (`requirePageAccess`) repeats both per server-component render; `chat/actions.ts`'s
  `requireChatUser` (lines 53-69) repeats them again on every chat action, including a 2s-interval poll.
- **Impact:** avoidable latency and DB load on every page render and every poll tick.
- **Fix:** see `.specs/features/auth-roundtrips/spec.md` — target ≤ 1 round-trip per render (e.g. a
  JWT `user_type` claim so downstream layers read it from the session instead of querying `profiles`).

## 🟠 Unindexed FK columns and duplicate indexes

- Roughly 40 foreign-key columns across the schema have no supporting index, and at least one
  confirmed duplicate pair exists: `idea_project_id_idx` and `idx_idea_project_id`, both `btree` on
  `idea(project_id)` (`supabase/migrations/20260101000000_production_baseline.sql:3394,3398`) — see
  the index-naming duality noted in `CONVENTIONS.md`.
- **Fix:** see `.specs/features/db-indexes/spec.md` — add missing FK indexes, drop the confirmed
  duplicate(s), standardize on the `idx_<table>_<col>` naming form.

## 🟠 Unbounded list queries

- `src/app/okrs/page.tsx:26-39`, `src/app/internal-projects/page.tsx:35-76`, and
  `src/app/users/page.tsx:22-29` (the last selects specific columns, not `*`, but still fetches every
  row with no `.limit()`/pagination) load an entire table per render.
- **Fix:** see `.specs/features/bundle-and-boundaries/spec.md` — add pagination or a row cap once one
  of these tables is large enough to matter.

## 🟠 Cron workers not scheduled

- `/api/mkt/cron/*` workers exist but Vercel cron config was removed (Hobby-plan incompatibility).
- **Impact:** outreach sending and scheduled-content publishing don't fire automatically — need a paid
  plan or an external scheduler (e.g. cron-job.org hitting the `CRON_SECRET`-guarded endpoints).

## 🟠 Service-role client surface

- `createServiceClient()` bypasses RLS and is used in the public capture zone (`/m`, `/api/m`).
- **Risk:** any logic error there can read/write across tenants. Keep service-role usage minimal,
  server-only, and validated (stage-enabled checks, hard-reject unpaid preorder, HMAC unsubscribe tokens).

## 🟠 Heavy DB-types file & schema drift

- `src/lib/supabase/types.ts` is large (~10k lines). Feature interfaces in `src/types/` can drift from it.
- **Rule:** regenerate or hand-update `types.ts` after every migration and keep `src/types/` in sync.

## 🟡 Codebase is the spec — keep `.specs/` current

- The legacy Bubble export has been removed; the codebase and `.specs/` are now the source of truth.
  As the platform grows (marketing engine, expanded Ideas Refiner), keep `.specs/` and the design-token
  docs in sync with the code so new work matches established patterns rather than re-inventing them.

## 🟡 Windows + Turbopack route caching

- Renaming bracket routes (`[projectId]`→`[ideaId]`) left stale Turbopack manifest entries → 404s.
- **Workaround:** force a dev-server rescan (no-op `next.config.ts` edit) after renaming dynamic segments.

## 🟡 Client-side PDF rendering constraints

- Invoice PDF uses html2canvas, which can't parse Tailwind v4 `oklch()` — the invoice document must use
  inline hex styles. Re-sanitise HTML before the offscreen render.

## 🟡 Polling pressure on chat

- 2s tab-panel polls previously flooded the server-action queue. Fixed with `loadingRef` + visibility
  gating, but any new polling UI must adopt the same guards to avoid starving user saves.

## 🟡 Heavy client bundles: TipTap and recharts statically imported, zero loading/error boundaries

- The TipTap-based `RichTextEditor` is statically imported (no `next/dynamic`) across ~19+ client
  files (ideas-refiner, chat, docs, invoices); `recharts` is statically imported in 4 files
  (`dashboard`, `marketing/[ideaId]/traffic`, `marketing/[ideaId]`, `okrs`). Only 3 files in the whole
  app use `next/dynamic` at all.
- There are **zero** `loading.tsx`, `error.tsx`, or `not-found.tsx` files and no `<Suspense>` boundary
  anywhere in `src/app` — every route ships one synchronous render with no loading/error UI and no
  code-split boundary.
- **Fix:** see `.specs/features/bundle-and-boundaries/spec.md` — lazy-load the editor/chart bundles on
  the routes that don't need them on first paint; add `loading.tsx` to the heaviest routes.

## 🟡 `@types/dompurify` in production dependencies

- `package.json` lists `@types/dompurify` under `dependencies`, not `devDependencies` — a types-only
  package that ships no runtime code but is bundled into the deploy graph unnecessarily.
- **Fix:** move to `devDependencies` in a routine dependency-cleanup pass.
