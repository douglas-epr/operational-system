# CONCERNS

_Brownfield analysis — 2026-06-21. Risk / tech-debt register. Severity: 🔴 high · 🟠 medium · 🟡 low._

## 🔴 No automated test coverage

- No test runner, no test files. All verification is `tsc --noEmit` + manual/live walk-throughs.
- **Risk:** regressions in RLS, server actions, and the long AI pipelines go uncaught until manual UAT.
- **Mitigation target:** add Vitest (unit) + Supabase-backed integration tests for RLS and actions, and
  Playwright for the 3–4 critical flows. RLS-per-role is the highest-value first target.

## 🔴 Silent AI-generation failures

- Several past incidents: a swallowed insert error (missing column) or token truncation surfaced as a
  silent ~4-minute timeout with empty data — not as an error.
- **Rule already in place:** check the write `error` after every AI write; pass `maxTokens: 16384` for
  multi-field rich-HTML steps; guard with `isRequestActive`. Any new generation function must follow this.

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
