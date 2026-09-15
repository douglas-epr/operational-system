# Spec: Server Action Guards — authorization, allow-lists, cron & env reconciliation

Status: in progress 2026-09-15

Source: approved plan `1-please-update-all-wondrous-pixel.md`, Phase 4b "Security — P1" (items S9–S12).

## Objective

Every mutating server action in Move37 OS is a **public HTTP endpoint** with a generated ID — Next.js
exposes it whether or not a page links to it. 54 of them currently perform no `supabase.auth.getUser()`
check and rely on RLS as the only gate, and a family of "save" actions accepts an unfiltered
`Record<string, unknown>` straight into `.update()`, which lets a caller write any column the RLS policy
happens to allow (including `created_by`, `project_id`, `order`, or a status enum out of workflow order).

Success = the module's existing gate helper runs before the first database call in every mutating action,
every `Record<string, unknown>` update passes a column allow-list, `vercel.json` actually declares the
crons the code claims exist, and `.env.example` matches the variables the code reads.

Explicitly **defense in depth**, not a replacement: RLS stays exactly as it is. The gates turn a silent
RLS-denied no-op into an explicit `{ error }`, and stop mass assignment that RLS cannot see.

## Evidence

| # | Finding | Evidence (file:line) |
|---|---|---|
| S9 | 54 mutating server actions have no `getUser()` / gate call and rely on RLS alone. Per-module count from the audit: docs 17, ideas-refiner 18, projects 7, sops 5, internal-projects 3, invoices 2, settings 1 | `src/app/docs/actions.ts`, `src/app/ideas-refiner/actions.ts`, `src/app/projects/actions.ts`, `src/app/sops/actions.ts`, `src/app/internal-projects/actions.ts`, `src/app/invoices/actions.ts`, `src/app/settings/actions.ts` |
| S10 | Mass assignment: `saveIcpProfile(icpId, data: Record<string, unknown>)` passes `data` unfiltered to `.update(data)`; sibling "save" actions in the same file follow the pattern | `src/app/ideas-refiner/actions.ts:369-378` (+ siblings in the same module) |
| S11 | `vercel.json` has no `crons` block although the worker route's own comment states it is invoked by a cron | `vercel.json` (contains only `$schema`) vs `src/app/api/mkt/cron/process-outreach/route.ts:3` |
| S12 | `.env.example` drift — missing `CALCOM_WEBHOOK_SECRET`, `TALLY_WEBHOOK_SECRET`, `BREVO_TEMPLATE_MAGIC_LINK`, `BREVO_TEMPLATE_PASSWORD_RESET`, `BUFFER_API_KEY`, `BUFFER_ORG_ID`; stale/unread `APOLLO_API_KEY`, `POSTIZ_CLIENT_ID`, `STRIPE_*`; `NEXT_PUBLIC_APP_URL` still on port 3000 while `package.json` dev runs 4000 | `.env.example`, `package.json:6` |

Reference pattern that already does this correctly, to be copied rather than reinvented:
`requireChatUser` in `src/app/chat/actions.ts:53-69` (55 call sites).

## Stories

### P0 — Gate every ungated mutating server action (S9)

As the platform owner, I want every mutating server action to establish the caller's identity before it
touches the database, so an unauthenticated or wrong-role POST to a generated action ID gets an explicit
refusal instead of leaning on RLS to fail silently.

**Acceptance criteria**

- AC1: `src/app/docs/actions.ts` — every exported `async function` that performs a write has a gate call before its first `await supabase.from(` call. Verify: the count of exported async functions containing `.insert(`, `.update(`, `.upsert(` or `.delete(` equals the count of those same functions containing a gate call (`requireActionUser` / `getUser()`); the two numbers are equal and the module's ungated-write count is `0`.
- AC2: `src/app/ideas-refiner/actions.ts` — same check, ungated-write count is `0`.
- AC3: `src/app/projects/actions.ts` — same check, ungated-write count is `0`.
- AC4: `src/app/sops/actions.ts` — same check, ungated-write count is `0`.
- AC5: `src/app/internal-projects/actions.ts` — same check, ungated-write count is `0`.
- AC6: `src/app/invoices/actions.ts` — same check, ungated-write count is `0`.
- AC7: `src/app/settings/actions.ts` — same check, ungated-write count is `0`.
- AC8: The repo-wide count of gate calls increases by at least 54. `git diff -U0 -- 'src/app/**/actions.ts' | grep -c "^+.*requireActionUser\|^+.*auth.getUser()"` returns `>= 54`.
- AC9: The gate is a single shared helper per module, not 54 copies of the same five lines. `grep -rn "export async function requireActionUser\|export async function require" src/lib/auth src/app/*/actions.ts | wc -l` returns `>= 1`, and no module defines more than one such helper.
- AC10: The refusal uses the established convention — the helper's failure path yields `{ error: "Not authenticated" }` (or the role equivalent) and the action returns it. `grep -rn "Not authenticated" src/app | wc -l` returns `>= 7` (one per gated module).
- AC11: No gated action throws across the server-action boundary. `grep -rn "throw new Error" src/app/*/actions.ts | wc -l` does not increase relative to `git stash`-ed HEAD (`git diff -U0 -- 'src/app/**/actions.ts' | grep -c "^+.*throw new Error"` returns `0`).
- AC12: Unauthenticated behaviour is observable: signed out, loading `/projects` redirects to `/signin` (existing middleware) **and** a direct POST to a known action ID returns a body containing `Not authenticated` rather than an empty success. Verify with one representative action via `curl` using the `Next-Action` header captured from the page source.
- AC13: A signed-in staff user can still perform every previously-working mutation — manual walk of create/edit/delete in Docs, Ideas Refiner (one step), Projects (one task), SOPs, Internal Projects, Invoices and Settings shows no new error toast.

### P0 — Column allow-lists for `Record<string, unknown>` updates (S10)

As the platform owner, I want every "save this entity" action to write only the columns that action owns,
so a crafted payload cannot set `created_by`, re-parent a row to another `idea_id` / `project_id`, or jump
a status enum.

**Acceptance criteria**

- AC1: `saveIcpProfile` no longer spreads its argument into the update. `grep -n "\.update(data)" src/app/ideas-refiner/actions.ts` returns `0` lines.
- AC2: A reusable picker exists. `grep -rn "export function pick" src/lib | wc -l` returns `>= 1`.
- AC3: Every action in `src/app/ideas-refiner/actions.ts` that takes a `Record<string, unknown>` parameter calls the picker before its update. Verify: `grep -c "Record<string, unknown>" src/app/ideas-refiner/actions.ts` equals the number of `pick(` call sites in the same file.
- AC4: The allow-list for each entity is a named, module-level constant (not an inline literal at the call site). `grep -n "_COLUMNS\s*=\|_ALLOWED\s*=" src/app/ideas-refiner/actions.ts` returns `>= 1` line per guarded entity.
- AC5: `created_by` is not writable through any allow-list. `grep -rn "created_by" src/app/ideas-refiner/actions.ts` shows it only inside `.insert({ ... created_by: user.id })` expressions, never inside an allow-list constant.
- AC6: Foreign-key re-parenting is not writable — no allow-list constant in `src/app/ideas-refiner/actions.ts` contains `idea_id`, `project_id` or `id`.
- AC7: An unknown key is dropped rather than rejected loudly (the UI sends whole form objects): saving an ICP profile with an extra `"evil": 1` key succeeds and the row shows no such column (DB round-trip check against local Supabase).
- AC8: A crafted `created_by` in the payload does **not** change the row: after saving with `{"created_by":"<other-uuid>"}`, `select created_by` for that row returns the original value.
- AC9: No legitimate field is lost — saving a fully populated ICP profile through the UI and re-reading it returns every field the form displayed (manual round-trip).

### P1 — Declare the marketing crons in `vercel.json` (S11)

As the platform owner, I want the three marketing cron workers actually scheduled by Vercel, so due
outreach is sent and scheduled content is published without a manual trigger, and the code comment stops
lying.

**Acceptance criteria**

- AC1: `vercel.json` has a `crons` array. `node -e "const c=require('./vercel.json');process.exit(Array.isArray(c.crons)?0:1)"` exits `0`.
- AC2: It has exactly one entry per existing cron route. `node -e "const c=require('./vercel.json');process.exit(c.crons.length===3?0:1)"` exits `0`, and `ls -d src/app/api/mkt/cron/*/ | wc -l` returns `3`.
- AC3: Every entry's `path` resolves to a real route file. For each `crons[i].path`, `test -f "src/app${path}/route.ts"` exits `0`.
- AC4: Every entry has a non-empty 5-field `schedule` string. `node -e "const c=require('./vercel.json');process.exit(c.crons.every(x=>typeof x.schedule==='string'&&x.schedule.trim().split(/\s+/).length===5)?0:1)"` exits `0`.
- AC5: The file is valid JSON and keeps its `$schema`. `node -e "const c=require('./vercel.json');process.exit(c.\$schema?0:1)"` exits `0`.
- AC6: The routes remain secret-guarded — cron routes are not made public by being scheduled. `grep -rlc "CRON_SECRET" src/app/api/mkt/cron/*/route.ts | wc -l` returns `3`.
- AC7: The stale comment is now true: `grep -n "cron" src/app/api/mkt/cron/process-outreach/route.ts` describes a schedule that matches the `vercel.json` entry for the same path.

### P1 — Reconcile `.env.example` with the code (S12)

As a developer onboarding this repo, I want `.env.example` to list exactly the variables the code reads,
so a fresh clone boots without hunting through `src/lib/api/*` and without provisioning services we no
longer use.

**Acceptance criteria**

- AC1: Every `process.env.X` name read in `src/` (excluding `NODE_ENV` and `NEXT_RUNTIME`) appears as a `X=` key in `.env.example`. Verify: `comm -23 <(grep -rhoP 'process\.env\.\K[A-Z0-9_]+' src | sort -u) <(grep -oP '^\K[A-Z0-9_]+(?==)' .env.example | sort -u)` returns `0` lines.
- AC2: `.env.example` declares no variable the code never reads. The reverse `comm -13` of the same two lists returns `0` lines.
- AC3: `CALCOM_WEBHOOK_SECRET` is present. `grep -c "^CALCOM_WEBHOOK_SECRET=" .env.example` returns `1`.
- AC4: `TALLY_WEBHOOK_SECRET` is present. `grep -c "^TALLY_WEBHOOK_SECRET=" .env.example` returns `1`.
- AC5: `BREVO_TEMPLATE_MAGIC_LINK` is present. `grep -c "^BREVO_TEMPLATE_MAGIC_LINK=" .env.example` returns `1`.
- AC6: `BREVO_TEMPLATE_PASSWORD_RESET` is present. `grep -c "^BREVO_TEMPLATE_PASSWORD_RESET=" .env.example` returns `1`.
- AC7: `BUFFER_API_KEY` is present. `grep -c "^BUFFER_API_KEY=" .env.example` returns `1`.
- AC8: `BUFFER_ORG_ID` is present. `grep -c "^BUFFER_ORG_ID=" .env.example` returns `1`.
- AC9: `APOLLO_API_KEY` is gone. `grep -c "APOLLO_API_KEY" .env.example` returns `0`.
- AC10: `POSTIZ_CLIENT_ID` is gone. `grep -c "POSTIZ_CLIENT_ID" .env.example` returns `0`.
- AC11: No `STRIPE_*` variable remains. `grep -c "^STRIPE_" .env.example` returns `0`.
- AC12: `NEXT_PUBLIC_APP_URL` uses the real dev port. `grep "^NEXT_PUBLIC_APP_URL=" .env.example` contains `:4000` and `grep -c "3000" .env.example` returns `0`.
- AC13: No real secret value is committed — every value in `.env.example` is a placeholder. `grep -cP '=(?!\s*$)(?!your_|<|changeme|placeholder|http)' .env.example` returns `0`.

### P2 — Origin / Fetch-Metadata check on server actions (optional, weight 0)

As the platform owner, I would like server actions to reject cross-site invocations, so a third-party page
cannot drive a signed-in staff browser into a mutation. Absence is **not** a defect for this pass.

**Acceptance criteria**

- AC1: `next.config.ts` declares `experimental.serverActions.allowedOrigins` listing the production domain and `localhost:4000`. `grep -n "allowedOrigins" next.config.ts` returns at least 1 line.
- AC2: A POST to a server action with a foreign `Origin` header is refused with a 4xx.
- AC3: The same POST with the correct `Origin` still succeeds.

## Out of scope

- Changing or adding any RLS policy. The three-tier model (`is_admin_or_manager()`, creator, project
  member) and the `project_task` role matrix stay exactly as they are; these gates are additive.
- The chat module — `requireChatUser` already gates all 55 call sites; it is the **reference pattern**,
  not a target.
- Converting any client-side mutation to a server action (there are none; rule 6 already holds).
- Public / unauthenticated surface hardening — webhook secrets, sanitizer, iframe sandbox, rate limiting,
  HSTS/CSP → `.specs/features/security-p0/spec.md`.
- Reducing the number of auth round-trips the new gates introduce → `.specs/features/auth-roundtrips/spec.md`
  (the `cache()`-wrapped current-user helper is what keeps this spec cheap; specs land in that order).
- Choosing the cron **schedule** values themselves (see Open questions) — this spec only requires that a
  valid 5-field schedule exists for each of the three routes.
- Rotating any secret that may already be exposed, and provisioning the new Vercel environment variables.
- Applying anything to **production** Supabase, pushing, or deploying.

## Files touched

| File | Change |
|---|---|
| `src/lib/auth/require-action-user.ts` | **new** (or extend `src/lib/auth/`) — shared `{ supabase, userId, role }` gate returning `{ error }` on failure |
| `src/app/docs/actions.ts` | gate 17 actions |
| `src/app/ideas-refiner/actions.ts` | gate 18 actions; column allow-lists for `saveIcpProfile` and siblings |
| `src/app/projects/actions.ts` | gate 7 actions |
| `src/app/sops/actions.ts` | gate 5 actions |
| `src/app/internal-projects/actions.ts` | gate 3 actions |
| `src/app/invoices/actions.ts` | gate 2 actions |
| `src/app/settings/actions.ts` | gate 1 action |
| `src/lib/pick.ts` | **new** — `pick(obj, allowedKeys)` column filter |
| `vercel.json` | add `crons` for the 3 `/api/mkt/cron/*` routes |
| `.env.example` | sync to the variables actually read; port 4000 |
| `next.config.ts` | (P2 only) `experimental.serverActions.allowedOrigins` |

## Verification

Gate (must pass, per `.specs/codebase/TESTING.md` — there is no test runner):

```bash
npm run build && npm run lint && npx tsc --noEmit
```

Per-spec checks:

```bash
# S9 — no ungated write remains in the seven modules
for f in docs ideas-refiner projects sops internal-projects invoices settings; do
  echo "== $f"; grep -c "requireActionUser\|auth.getUser()" "src/app/$f/actions.ts"
done

# S10 — no unfiltered spread into update
grep -n "\.update(data)" src/app/ideas-refiner/actions.ts

# S11 — crons declared and every path real
node -e "const c=require('./vercel.json');console.log(c.crons.length);c.crons.forEach(x=>console.log(x.path,x.schedule))"

# S12 — env symmetric difference is empty both ways
comm -3 <(grep -rhoP 'process\.env\.\K[A-Z0-9_]+' src | sort -u) \
        <(grep -oP '^\K[A-Z0-9_]+(?==)' .env.example | sort -u)
```

Manual walk (no automated E2E exists): signed in as `admin`, then as `developer`, then as `client` —
create/edit/delete one row in each of the seven gated modules and confirm no new failure; signed out,
confirm a direct action POST returns `Not authenticated`.

## Boundaries

**Always**

- Call `supabase.auth.getUser()` (never trust a client-supplied user ID) before the first write.
- Set `created_by: user.id` on insert wherever the column exists.
- Return `{ error?: string }`; never throw across the server-action boundary.
- `revalidatePath()` after a mutation so server-rendered pages refresh.
- Keep the allow-list next to the action that owns the entity, as a named constant.
- Update `.env.example` in the same change as any new environment variable.
- Add a `docs/changelog.md` entry at the end of the session.

**Ask first**

- Any RLS policy change (a failing gate is an app-layer bug until proven otherwise).
- Adding a dependency.
- Choosing the cron schedule values.
- Enabling `serverActions.allowedOrigins` (P2) — it can break preview deployments on generated domains.
- Widening any column allow-list after review.

**Never**

- `git commit`.
- `git push`.
- Apply a migration to **production** Supabase.
- Deploy to Vercel.

## Open questions

1. **Count discrepancy**: the plan states "54 server actions" but the per-module breakdown
   (17+18+7+5+3+2+1) sums to **53**. One action is unattributed. Re-run the audit and reconcile before
   freezing `_ac-baseline.md`; AC8's `>= 54` threshold assumes the total is right and the breakdown is
   short by one.
2. Cron schedules for the three `/api/mkt/cron/*` routes are **ASSUMED / PENDING** — proposal:
   `process-outreach` every 15 min (`*/15 * * * *`), content publish every 15 min offset
   (`5,20,35,50 * * * *`), third worker hourly (`0 * * * *`). Needs the owner's number; Vercel Hobby
   plans also cap cron frequency, so the plan tier matters.
3. Which role each gated action requires is **ASSUMED** to be "any authenticated staff user" unless the
   page that hosts it already calls `requirePageAccess([...])`; per-action role tightening (e.g. invoices
   → admin/manager only) needs a decision per module.
4. Whether `settings/actions.ts`'s single action should be gated to the *owning* user (`userId` match)
   rather than any authenticated user — likely yes, confirm.
5. `.env.example` AC1/AC2 use a strict two-way diff; if any variable is read only in a script outside
   `src/` (e.g. a Supabase seed), the allow-list for AC2 needs an explicit exception list.

---

## Audit corrections (2026-09-15, post-freeze)

An independent AST-based re-audit of commit `e96b250` (TypeScript compiler API over all 24
`"use server"` modules) superseded the counts this spec was written from. The frozen baseline
`.specs/evaluations/_ac-baseline.md` carries the corrected numbers; the ACs above are left as
written so the pre and post grades stay comparable.

**Corrected counts.** Neither 54 nor 53 was right. Of 254 exported server actions, 194 are gated
and **60 are ungated**; 3 of those are pre-auth by design (`signin/actions.ts`, `reset_pw/actions.ts`),
leaving 57, of which **47 perform writes**. AC8's threshold is therefore `>= 47`, not `>= 54`.

Per-file ungated counts, writers in parentheses: `docs` 17 (15) · `ideas-refiner` 19 (17) ·
`projects` 11 (8) · `sops` 5 (5) · `internal-projects` 2 (0) · `invoices` 2 (2) · `settings` 1 (0).
Chat, all nine marketing modules, okrs, feedback, profile, prompts and users have **zero**.

**Two modules already pass.** `internal-projects` and `settings` have no ungated *writers* — their
ungated functions are read-only — so AC5 and AC7 were already met before any work started.

**Why the earlier numbers were wrong.** A regex heuristic that treats a column-zero `}` as the end
of a function body truncates bodies at multi-line return-type annotations (`}): Promise<`), which
both over- and under-counts. Enumerate server actions with an AST walk, not a line-based grep.

**`marketing/**` is correctly gated and stays out of scope.** Each of the nine marketing modules
holds a private `getAdminClient` helper that calls `auth.getUser()`, returns `Not authenticated`,
then checks `profiles.type` against a staff list. It is a real gate despite the name. Those nine
near-identical copies are duplication worth consolidating one day, but no AC here sanctions it and
a gate-consolidation pass must not wander into that directory.

**Mass-assignment is 7 sites, not 1 — and 4 evade this spec's own check.** AC1 of the allow-list
story greps for `.update(data)`, which finds only three of them:

| # | Site | Pattern |
|---|---|---|
| 1 | `ideas-refiner/actions.ts:369` `saveIcpProfile` | `.update(data)` |
| 2 | `ideas-refiner/actions.ts:447` `saveStrategicFramework` | `.update(data)` |
| 3 | `ideas-refiner/actions.ts:481` `saveOptimizationSuggestion` | `.update(data)` |
| 4 | `docs/actions.ts:331` `updateAgreement` | `Object.entries(patch)` copy-all — writes `authorized_users` and `required_signers` |
| 5 | `docs/actions.ts:709` `updateDailyFeedback` | `Object.entries` copy-all |
| 6 | `invoices/actions.ts:65` `updateInvoice` | `Object.entries` copy-all |
| 7 | `projects/actions.ts:120` `updateTask` | rest-spread through an intermediate object |

Sites 4 to 7 launder the payload through `Object.entries` or a rest spread, so an implementation
that fixes only the three literal `.update(data)` calls satisfies AC1 while leaving four holes
open. Site 4 is the most serious: it can write the authorization column itself. A further 14
sites are mass-assignable but already gated (`chat:1756`, `chat:1810`, `ideas-refiner:78`,
`ideas-refiner:408`, `internal-projects:112/236/334`, `invoices:45`, `okrs:65/133/213`,
`projects:33/50/94`) — lower severity, same fix.

Declared TypeScript parameter types are erased at runtime, so `data: SomeInterface` is no
protection. A server action is a public HTTP endpoint; the allow-list has to exist in the code.

**Sequencing.** `src/lib/auth/current-user.ts` (the request-scoped `cache()` lookup) landed on
2026-09-15 and must be the gate mechanism for this work. Adding 47 independent `auth.getUser()`
calls instead would add a Supabase round-trip per action and undo the `auth-roundtrips` gains.

**AC9 is non-discriminating as written**: its grep matches the page gate `requirePageAccess`, so it
reads at least 1 even with zero action gates present. Judge it by reading the call path.
