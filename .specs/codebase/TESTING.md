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

## Gate check for any task

A task is **not done** until: `tsc --noEmit` is clean, the changed flow has been exercised
(live walk-through or DB round-trip), and `docs/changelog.md` has an entry.

## Conventions when tests are added (target state)

- AAA structure (Arrange-Act-Assert); descriptive behaviour names.
- Unit (utilities/helpers), integration (server actions + RLS against a local Supabase), and
  E2E (Playwright over critical flows: auth, project task lifecycle, an Ideas Refiner step, a marketing capture).
- RLS policies are the highest-value integration-test target — assert each role sees only what it should.

## Notable manual-test lessons (see STATE.md)

- AI generation failures are often silent (swallowed write error / token truncation) — assert the row
  was actually written, not just that the action returned success.
- Marketing cron workers (`/api/mkt/cron/*`) must be triggered manually in dev (no scheduler wired).
