# Spec: Auth Round-Trips — middleware scope, request-scoped user cache, poll hygiene

Status: implemented 2026-09-15 (local only; production apply and deploy pending)

Source: approved plan `1-please-update-all-wondrous-pixel.md`, Phase 4b "Performance — P0" (items P1–P3).

## Objective

Every page view in Move37 OS pays for the same identity lookup several times over. `src/proxy.ts`
(the middleware) calls `getUser()` and then queries `profiles.type` on **every** matched request —
including `/api/*` and `/m/*`, which neither need a session nor consult the clamp. `requirePageAccess`
then repeats both calls in the page, and `requireChatUser` repeats them again for each of its 55 server
actions. On a chat screen with four 2-second polls, that is a continuous stream of Supabase round-trips
per user, plus a sidebar poll that keeps firing in a hidden tab.

Success = zero auth work on `/api` and `/m`, the `profiles` query issued only when the referrer clamp can
actually apply, one identity lookup per request reused by every consumer via React `cache()`, and polling
that stops when nobody is looking.

This is a pure round-trip reduction. Auth semantics must be **identical** before and after: the same
users land on the same pages, the same roles are refused, and the referrer clamp still holds.

## Evidence

| # | Finding | Evidence (file:line) |
|---|---|---|
| P1a | Middleware calls `getUser()` and then queries `profiles.type` on every matched request | `src/proxy.ts:50-52`, `src/proxy.ts:82-86` |
| P1b | The matcher excludes neither `/api` nor `/m`, so unauthenticated public routes still pay for both calls | `src/proxy.ts:100-108` |
| P1c | The `profiles.type` result has exactly one consumer — the `referrer` clamp against `REFERRER_ALLOW_PREFIXES` — yet it is fetched unconditionally | `src/proxy.ts:82-86` |
| P2a | `requirePageAccess` repeats the same `getUser()` + `profiles` pair inside the page render | `src/lib/auth/page-gate.ts:87-96` |
| P2b | `requireChatUser` repeats it again, once per server action, across 55 call sites | `src/app/chat/actions.ts:53-69` |
| P3a | `ProjectTabsPanel` polls a server action every 2000 ms | `src/app/chat/_components/ProjectTabsPanel.tsx:985` |
| P3b | `InternalProjectTabsPanel` polls every 2000 ms | `src/app/chat/_components/InternalProjectTabsPanel.tsx:1006` |
| P3c | `InternalProjectTasksTab` polls every 2000 ms | `src/app/chat/_components/tabs/InternalProjectTasksTab.tsx:69` |
| P3d | `TaskRequestsKanbanWrapper` polls every 2000 ms | `src/app/projects/_components/TaskRequestsKanbanWrapper.tsx:79` |
| P3e | `ConversationsSidebar` polls every 20 s with **no** document-visibility gate, so a background tab keeps querying | `src/app/chat/_components/ConversationsSidebar.tsx:119` |

Already verified **compliant**, so not in scope for change: the codebase uses `getUser()` rather than
`getSession()` throughout; `@supabase/ssr` cookie flags are at their secure defaults; the four tab polls
already hold an in-flight `loadingRef` guard and only run while their tab is visible.

## Stories

### P0 — Narrow the middleware matcher (P1b)

As a visitor hitting a public landing page or a webhook, I want the middleware to not run at all, so an
unauthenticated request costs zero Supabase calls and the cron/webhook endpoints stop paying for a
session refresh they discard.

**Acceptance criteria**

- AC1: The matcher excludes `/api`. `grep -n "api" src/proxy.ts` shows `api` inside the negative-lookahead group of the `matcher` config.
- AC2: The matcher excludes `/m`. `grep -n "matcher" -A3 src/proxy.ts` shows `m` (the public landing prefix) in the same exclusion group.
- AC3: The matcher still excludes static assets. The exclusion group still contains `_next/static`, `_next/image` and `favicon.ico`.
- AC4: The middleware no longer runs on an API route. With a `console.count` temporarily added at the top of the middleware in dev, `curl http://localhost:4000/api/m/event` produces **0** middleware invocations (counter unchanged).
- AC5: The middleware no longer runs on a landing page. `curl http://localhost:4000/m/<test-slug>` produces **0** middleware invocations.
- AC6: The middleware **still** runs on an app route. `curl http://localhost:4000/projects` produces exactly **1** middleware invocation.
- AC7: The public zone still works without a session: `curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/m/<test-slug>` prints `200`, and `/signin` and `/reset_pw` remain reachable.
- AC8: Auth is unchanged for app routes: signed out, `curl -s -o /dev/null -w "%{http_code}" -L http://localhost:4000/projects` still lands on `/signin`.
- AC9: The temporary instrumentation is removed before the change is considered done. `grep -rc "console.count\|console.time" src/proxy.ts` returns `0`.

### P0 — Query `profiles` only when the clamp can apply (P1c)

As a signed-in staff user, I want the middleware to skip the `profiles.type` lookup on paths where the
referrer clamp could never change the outcome, so the common case costs one call instead of two.

**Acceptance criteria**

- AC1: The `profiles` query sits behind a condition on `user` being present. `grep -n "profiles" -B6 src/proxy.ts` shows the query inside a branch guarded by a truthy `user`.
- AC2: The `profiles` query is additionally guarded on the pathname. The same context shows a pathname test against `REFERRER_ALLOW_PREFIXES` (or its complement) before the query.
- AC3: There is exactly one `profiles` query in the middleware. `grep -c "from(\"profiles\")" src/proxy.ts` returns `1`.
- AC4: An unauthenticated matched request issues **0** `profiles` queries. Verify with `npx supabase logs` (or `mcp__supabase__query_logs`) on the local stack while loading `/signin` signed out: no `profiles` select appears.
- AC5: A signed-in request to a path **inside** the referrer allow-list (`/projects`, `/feedback`, `/profile`) issues **0** `profiles` queries, because the clamp cannot redirect there.
- AC6: A signed-in request to a path **outside** the allow-list (e.g. `/chat`) issues exactly **1** `profiles` query, because the clamp may fire.
- AC7: A `referrer` user is still clamped: signed in as `referrer`, requesting `/chat` redirects to `/projects`.
- AC8: A `referrer` user is still allowed inside the allow-list: signed in as `referrer`, `/projects`, `/feedback` and `/profile` each return `200`.
- AC9: A non-`referrer` user is not clamped: signed in as `admin`, `/chat` returns `200`.
- AC10: The Supabase session cookie is still refreshed on every matched request (the middleware's original purpose) — `curl -I` on an app route with a near-expiry session shows a `set-cookie` for the Supabase auth cookie.

### P0 — One identity lookup per request via React `cache()` (P2)

As a developer, I want a single request-scoped `getCurrentUser()` that every gate reuses, so a page that
renders and then runs three server actions performs one identity lookup instead of four.

**Acceptance criteria**

- AC1: The helper module exists. `test -f src/lib/auth/current-user.ts` exits `0`.
- AC2: It is wrapped in React `cache()`. `grep -n "from \"react\"" src/lib/auth/current-user.ts` and `grep -n "cache(" src/lib/auth/current-user.ts` each return at least 1 line.
- AC3: It is server-only. `head -n 1 src/lib/auth/current-user.ts` equals `import "server-only";`.
- AC4: It returns the shape the existing gates need. `grep -n "userId" src/lib/auth/current-user.ts` and `grep -n "role" src/lib/auth/current-user.ts` each return at least 1 line.
- AC5: `page-gate.ts` consumes it instead of calling Supabase directly. `grep -n "current-user" src/lib/auth/page-gate.ts` returns at least 1 line, and `grep -c "auth.getUser()" src/lib/auth/page-gate.ts` returns `0`.
- AC6: `requireChatUser` consumes it. `grep -n "current-user" src/app/chat/actions.ts` returns at least 1 line, and `grep -c "auth.getUser()" src/app/chat/actions.ts` returns `0`.
- AC7: Every other `require*` gate consumes it. `grep -rln "export async function require" src/lib/auth src/app/*/actions.ts | xargs grep -lc "current-user" | wc -l` equals the number of files in that list.
- AC8: Direct `getUser()` calls outside the helper are eliminated from gate code. `grep -rn "auth.getUser()" src/lib/auth src/app/*/actions.ts | grep -vc "current-user.ts"` returns `0`.
- AC9: Measured de-duplication: on one `/chat` page load followed by three server actions in the same request tree, the local Supabase log shows fewer `auth`/`profiles` round-trips than the pre-change baseline recorded in `.specs/evaluations/`. The post number is strictly lower.
- AC10: `requirePageAccess` behaviour is byte-identical — the existing role-fallback table (`ROLE_FALLBACK`) still routes each of `admin`, `manager`, `operational`, `developer`, `client`, `qa`, `referrer`, `lead` to the same destination when it hits a page it may not see (verify one page per role).
- AC11: `cache()` does not leak across requests — two different signed-in users loading the same page in parallel see their own role (manual two-browser check).

### P1 — Sidebar poll respects document visibility (P3e)

As a user with the app open in a background tab, I want the conversations sidebar to stop polling while
the tab is hidden, so an idle tab costs nothing.

**Acceptance criteria**

- AC1: The sidebar reads document visibility. `grep -n "visibilityState\|visibilitychange" src/app/chat/_components/ConversationsSidebar.tsx` returns at least 1 line.
- AC2: The poll is skipped (or the interval cleared) while hidden — the tick callback returns early on `document.hidden`, verified by reading the effect.
- AC3: The listener is removed on unmount. The same effect's cleanup calls `removeEventListener("visibilitychange", ...)`.
- AC4: Observed behaviour: with DevTools Network open and the tab backgrounded for 60 s, **0** requests to the sidebar's server action are recorded.
- AC5: Observed recovery: bringing the tab forward issues a refresh within one interval, so the list is not stale (a request appears within 20 s of focus).
- AC6: The existing in-flight guard is retained. `grep -n "loadingRef\|inFlight" src/app/chat/_components/ConversationsSidebar.tsx` returns at least 1 line.

### P1 — Raise the four tab polls to 5000 ms, keeping their guards (P3a–P3d)

As a user, I want the chat/task tab panels to refresh often enough to feel live but slowly enough that
my own saves are not starved by a flood of queued server actions.

Interval **5000 ms is the proposal — ASSUMED**, pending the owner's confirmation.

**Acceptance criteria**

- AC1: `ProjectTabsPanel` polls at 5000 ms. `grep -n "5000" src/app/chat/_components/ProjectTabsPanel.tsx` returns at least 1 line and `grep -c "2000" src/app/chat/_components/ProjectTabsPanel.tsx` returns `0`.
- AC2: `InternalProjectTabsPanel` polls at 5000 ms — same two checks against that file.
- AC3: `InternalProjectTasksTab` polls at 5000 ms — same two checks against that file.
- AC4: `TaskRequestsKanbanWrapper` polls at 5000 ms — same two checks against that file.
- AC5: The interval is a named constant, not a magic number repeated four times. `grep -rn "POLL_INTERVAL_MS" src/app src/lib | wc -l` returns `>= 5` (one definition plus four uses).
- AC6: Every one of the four keeps its in-flight guard. `grep -lc "loadingRef" src/app/chat/_components/ProjectTabsPanel.tsx src/app/chat/_components/InternalProjectTabsPanel.tsx src/app/chat/_components/tabs/InternalProjectTasksTab.tsx src/app/projects/_components/TaskRequestsKanbanWrapper.tsx | wc -l` returns `4`.
- AC7: Every one of the four still polls only while its tab is visible (the existing guard is not removed) — verified by reading each effect's condition.
- AC8: The `hasFetched` ref pattern is preserved — the loading spinner appears on first fetch only, not on background polls (manual check: switch tabs twice, no spinner flash on the second visit).
- AC9: Emoji reactions still arrive over Supabase Realtime, not the poll (unchanged) — `grep -rn "channel(" src/app/chat | wc -l` is unchanged relative to HEAD.
- AC10: Measured: over 60 s on one open project chat, the number of server-action requests drops by roughly 60 % versus the pre-change baseline recorded in `.specs/evaluations/` (post count strictly lower than pre).

### P2 — Backoff when nothing changed (optional, weight 0)

As a user, I would like an idle conversation to poll progressively less often, so long-lived tabs cost
almost nothing. Absence is **not** a defect for this pass.

**Acceptance criteria**

- AC1: The poll interval grows when consecutive responses are unchanged. `grep -rn "backoff" src/app/chat | wc -l` returns `>= 1`.
- AC2: The interval resets to the base value on any change or user interaction.
- AC3: The interval is capped. A named maximum constant exists and is `<= 30000`.

## Out of scope

- **JWT custom claim for `user_type`** (a Supabase Auth Hook putting the role in the token so middleware
  needs zero DB calls). **Deferred** — recorded as a roadmap item in `.specs/project/STATE.md`.
- **Migrating polling to Supabase Realtime.** **Deferred** — recorded as a deferred idea in
  `.specs/project/STATE.md`. Emoji reactions already use Realtime and stay as they are.
- Moving auth checks into client components — forbidden by CLAUDE.md; all auth stays server-side.
- Switching from `getUser()` to `getSession()` — already correct, must not regress.
- Changing `ROLE_FALLBACK`, the public-zone list, or any role's home page.
- Changing the referrer clamp's allow-list contents (`/projects`, `/feedback`, `/profile`).
- Database indexes, `select("*")` reduction and `max(order)` queries → `.specs/features/db-indexes/spec.md`.
- Bundle splitting and Suspense/loading boundaries → `.specs/features/bundle-and-boundaries/spec.md`.
- Adding authorization gates to the 54 ungated actions → `.specs/features/server-action-guards/spec.md`.
- Applying anything to **production** Supabase, pushing, or deploying.

## Files touched

| File | Change |
|---|---|
| `src/proxy.ts` | narrow `matcher` (exclude `/api`, `/m`, static); guard the `profiles` query on `user` **and** pathname outside `REFERRER_ALLOW_PREFIXES` |
| `src/lib/auth/current-user.ts` | **new** — `server-only`, React `cache()`-wrapped `{ supabase, userId, role }` lookup |
| `src/lib/auth/page-gate.ts` | consume `current-user`; drop the direct `getUser()` + `profiles` pair |
| `src/app/chat/actions.ts` | `requireChatUser` consumes `current-user` |
| `src/app/*/actions.ts` | remaining `require*` gates consume `current-user` |
| `src/app/chat/_components/ConversationsSidebar.tsx` | document-visibility gate + listener cleanup |
| `src/app/chat/_components/ProjectTabsPanel.tsx` | interval → `POLL_INTERVAL_MS` (5000) |
| `src/app/chat/_components/InternalProjectTabsPanel.tsx` | same |
| `src/app/chat/_components/tabs/InternalProjectTasksTab.tsx` | same |
| `src/app/projects/_components/TaskRequestsKanbanWrapper.tsx` | same |
| `src/lib/constants.ts` (or equivalent) | `POLL_INTERVAL_MS` constant |
| `.specs/evaluations/` | before/after round-trip and request counts |

## Verification

Gate (must pass, per `.specs/codebase/TESTING.md` — there is no test runner):

```bash
npm run build && npm run lint && npx tsc --noEmit
```

Per-spec checks:

```bash
# P1 — matcher scope and single guarded profiles query
grep -n "matcher" -A6 src/proxy.ts
grep -c 'from("profiles")' src/proxy.ts     # expect 1

# P2 — one cached lookup, no stray getUser in gates
head -n 1 src/lib/auth/current-user.ts       # expect: import "server-only";
grep -rn "auth.getUser()" src/lib/auth src/app/*/actions.ts | grep -v current-user.ts

# P3 — interval and guards
grep -rn "POLL_INTERVAL_MS" src | wc -l
grep -rn "2000" src/app/chat/_components/ProjectTabsPanel.tsx src/app/chat/_components/InternalProjectTabsPanel.tsx
grep -n "visibilitychange" src/app/chat/_components/ConversationsSidebar.tsx

# route-level smoke: public zone still open, app zone still gated
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4000/m/<test-slug>
curl -s -o /dev/null -w "%{http_code}\n" -L http://localhost:4000/projects
```

Measurement, recorded before and after in `.specs/evaluations/`:

- Supabase round-trips per page load (local stack logs) for `/projects`, `/chat`, `/ideas-refiner`.
- Server-action requests over 60 s on one open project chat (DevTools Network, filtered to POST).
- `requirePageAccess` wall time in dev via a temporary `console.time`, removed afterwards.

Manual role walk: `admin`, `manager`, `developer`, `client`, `qa`, `referrer` — each lands where
`ROLE_FALLBACK` says, and the `referrer` clamp still holds.

## Boundaries

**Always**

- Keep auth server-side; never move a check into a client component.
- Use `getUser()`, never `getSession()`.
- Preserve the in-flight guard and the visible-tab condition on every poll.
- Preserve the `hasFetched` ref pattern so spinners appear on first fetch only.
- Use per-block refresh ticks, never a global tick.
- Remove any temporary `console.time` / `console.count` instrumentation before calling the work done.
- Add a `docs/changelog.md` entry at the end of the session.

**Ask first**

- The final poll interval (5000 ms is ASSUMED).
- Removing any poll entirely, or moving a poll to Realtime.
- Changing `REFERRER_ALLOW_PREFIXES`, `ROLE_FALLBACK`, or the public-zone prefix list.
- Adding a JWT custom claim / Supabase Auth Hook (deferred by decision).
- Adding a dependency.

**Never**

- `git commit`.
- `git push`.
- Apply a migration to **production** Supabase.
- Deploy to Vercel.

## Open questions

1. Poll interval: **5000 ms is ASSUMED**. Confirm, or give a number per surface (task kanban may want to
   stay faster than the chat tab panels).
2. Does any consumer other than the referrer clamp read `profiles.type` from the middleware response
   headers? The audit found none, but AC2's pathname guard silently changes behaviour if one exists.
3. `/m` exclusion: confirm that no landing page relies on the middleware's cookie refresh. Landing pages
   are anonymous and write through the service-role client, so this should be safe — verify.
4. React `cache()` is per-request in the RSC render pass; whether it also de-duplicates across
   *sequential server actions in the same request* needs confirmation on Next 16.1.6. If it does not,
   AC9's measured improvement will come from the page render only, and that is acceptable — but the AC
   threshold must then be re-stated.
5. The sidebar's 20 s interval is left unchanged; should it also move to the shared constant?

---

## Audit corrections (2026-09-15, post-freeze)

Evidence errors found by the independent re-audit of `e96b250`. ACs left as written.

- **Path.** `TaskRequestsKanbanWrapper.tsx` is at `src/app/chat/_components/tabs/`, not
  `src/app/projects/_components/`.
- **The polling guards were not all "already present".** This spec asserted that all four tab
  polls already held a `loadingRef` overlap guard and the `hasFetched` first-load pattern, and that
  the work was merely to preserve them. In fact `loadingRef` existed in 2 of 4 (absent from
  `InternalProjectTasksTab.tsx` and `TaskRequestsKanbanWrapper.tsx`), `hasFetched` existed in 0 of 4,
  and `ConversationsSidebar.tsx:119` had a bare `setInterval` with neither guard. So AC6 of the tab
  story and AC6/AC8 of the sidebar story describe **additions**, not preservations. Anyone reading
  this spec as a description of the pre-existing code would be misled.
- **Regression tripwires.** In the frozen baseline, the middleware checks C1 and C2 already score
  0.33 and 0.48 at base, because the existing middleware satisfies the behavioural criteria
  (referrer clamp, public zone, single profile query, signed-out redirect). They are not build
  targets. If a later grade shows either one *falling*, the matcher narrowing or the pathname guard
  has broken auth semantics, which this spec forbids.
