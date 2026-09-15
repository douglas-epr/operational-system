# TESTING

_Brownfield analysis — 2026-06-21._

## Current reality

There is **no automated test runner** configured in this repo. `package.json` has no `test` script,
and there are no `*.test.ts` / `*.spec.ts` files or a Jest/Vitest/Playwright config checked in.

Verification today is **manual + type-level**:

| Gate | Command / method | When |
|---|---|---|
| Type check | `rtk tsc` / `tsc --noEmit` | Every change — must be 0 errors before "done" |
| Lint | `npm run lint` (`rtk lint`) | Before commit |
| Build smoke | `npm run build` (`rtk next build`) | Before pushing non-trivial changes |
| Live UAT | Manual browser walk-through; ad-hoc Playwright sessions | User-facing features (e.g. full Ideas Refiner generation, marketing funnel) |
| DB round-trip | Insert → read-back → cleanup against local/hosted Supabase | New tables/actions |

## Gate Check Commands

| Gate | When to Use | Command |
|---|---|---|
| Quick | After any code change — must be 0 errors before "done" | `npx tsc --noEmit` |
| Full | Before commit | `npm run lint && npx tsc --noEmit` |
| Build | Before pushing non-trivial changes | `npm run build` |

A task is **not done** until: `tsc --noEmit` is clean, the changed flow has been exercised
(live walk-through or DB round-trip), and `docs/changelog.md` has an entry.

## Parallelism Assessment

| Test Type | Parallel-Safe? | Isolation Model | Evidence |
|---|---|---|---|
| N/A — no automated tests | N/A | No isolation model exists (no Testcontainers, no per-test schema, no mocks) | `package.json` has no `test` script; no `*.test.ts`/`*.spec.ts` files in the repo |

## Manual smoke checklist (Playwright-MCP or a live browser)

Run this walk-through after any change touching auth, layout, or the AI pipeline:

1. `/signin` — sign in, confirm redirect to role home (`ROLE_FALLBACK`).
2. `/projects` — project list loads, open one, confirm task tree + comments render.
3. `/chat` — open a block, send a message, confirm no duplicate-poll flicker (tab panels 2s-poll guard).
4. `/ideas-refiner` — open an idea, run one AI generation step, confirm the write lands (check the
   row, not just a success toast — see the silent-AI-failure lesson in `STATE.md`).
5. `/settings` — confirm the OpenRouter model dropdown loads/saves (no key inputs should be present).

Header/security spot-check: `curl -I https://<deployed-url>/` and `curl -I https://<deployed-url>/api/mkt/cron/process-outreach`
— confirm the cron route 401s without a bearer token, and note any missing security headers
(CSP/HSTS/X-Frame-Options) for `.specs/features/security-p0/`.

## Perf budget

| Budget | Target | Where checked |
|---|---|---|
| First-load JS (gzip) | < 200 KB on `/projects` and `/chat` | `npm run build` route output / Lighthouse |
| Auth round-trips per render | ≤ 1 (`getUser()` + profile lookup) | manual trace of middleware + page-gate calls — currently 2+ (see `ARCHITECTURE.md` § Security layers) |

## Conventions when tests are added (target state)

- AAA structure (Arrange-Act-Assert); descriptive behaviour names.
- Unit (utilities/helpers), integration (server actions + RLS against a local Supabase), and
  E2E (Playwright over critical flows: auth, project task lifecycle, an Ideas Refiner step, a marketing capture).
- RLS policies are the highest-value integration-test target — assert each role sees only what it should.

## Notable manual-test lessons (see STATE.md)

- AI generation failures are often silent (swallowed write error / token truncation) — assert the row
  was actually written, not just that the action returned success.
- Marketing cron workers (`/api/mkt/cron/*`) must be triggered manually in dev (no scheduler wired).
