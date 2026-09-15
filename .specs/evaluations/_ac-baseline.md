# Frozen AC baseline — Move37 hardening pass (5 specs, 261 ACs)

**Frozen:** 2026-09-15 · **Frozen by:** move37-spec-conformance-reviewer · **Method:** `~/.agents/skills/spec-driven-eval/SKILL.md` (Reproducibility rule 1, baseline-freeze).

This file is the **contract** for every run that grades these five specs. It is read verbatim by
the pre-hardening run (`2026-09-15-pre-hardening.md`) and by every post-hardening run.
**Never re-derive it, never re-split or merge a check, never reword an I-check to make a score work out.**

## Specs covered

| Spec id | Folder | ACs | Stories (P0 / P1 / P2) |
|---|---|---|---|
| A | `.specs/features/security-p0/spec.md` | 57 | 5 / 3 / 1 |
| B | `.specs/features/server-action-guards/spec.md` | 45 | 2 / 2 / 1 |
| C | `.specs/features/auth-roundtrips/spec.md` | 49 | 3 / 2 / 1 |
| D | `.specs/features/db-indexes/spec.md` | 50 | 2 / 2 / 1 |
| E | `.specs/features/bundle-and-boundaries/spec.md` | 60 | 3 / 3 / 1 |
| | **total** | **261** | **15 / 12 / 5** |

Domains and measurable goals cross-checked against `.specs/project/PROJECT.md`.

## Frozen conventions (apply to every run)

1. **Weights.** `P0 = 3`, `P1 = 2`, `P2 / out-of-scope = 0`. Taken from each story's explicit
   label in its spec. No story in these five specs is unlabeled, so there is **no `ASSUMED`
   priority** anywhere in this baseline.
2. **Scoring.** `AC_score = 0.6*I + 0.4*T`; `Story_score = mean(AC_score)`;
   `Final = Sum(w_s * Story_score) / Sum(w_s)`. Round once, to 2 dp, at the end.
3. **T-checks — global convention.** This repo has **no test runner** (verified against
   `package.json`: no `test` script, no vitest/jest/playwright dependency; `.specs/codebase/TESTING.md`
   states the same). Every AC therefore carries **exactly one T-check**, and **every T-check is
   scored UNMET in every run with the note "no test runner configured"**. This is recorded once
   here and is not repeated per AC. Consequence: `T = 0` for every AC, so
   `AC_score = 0.6 * I` throughout, in both the pre- and post-hardening runs. The available
   engineering gates (`npm run build`, `npm run lint`, `npx tsc --noEmit`) are reported under
   `G`, never as T-credit.
4. **I-check decomposition rule used here.** Most ACs in these specs are already written as a
   single binary command/predicate → **1 I-check**. Conjunctions are split: an AC naming N
   distinct files, headers, fields, env vars or entities yields **N I-checks**, each verified
   against the real artifact. The per-AC I-check count below is frozen.
5. **AC text.** Each AC is identified by `spec.md:LINE` and reproduced as its **normative
   predicate** (the AC minus surrounding prose). The spec file is the canonical wording and is
   never edited by a grading run.
6. **Non-discriminating ACs.** Several ACs are *no-regression* or *delta* assertions that are
   trivially true at a clean base commit (e.g. "`git diff` shows no added X", "count is
   unchanged relative to HEAD", "no existing migration was edited"). These are flagged
   `[VACUOUS-AT-BASE]`. They are scored literally (MET when literally true) so the number stays
   reproducible, and are listed under Baseline gaps with sharpened wording recommended.
7. **ASSUMED tags carried from the specs** (these must be re-tagged identically in every run, so
   a later decision does not silently move the score):
   - `[ASSUMED]` poll interval 5000 ms — spec C, story C5 (auth-roundtrips:118).
   - `[ASSUMED]` rate-limit thresholds 30 req/60 s (`/api/m/*`), 120 req/60 s (`/api/webhooks/*`)
     — spec A, story A6 (security-p0:287-288).
   - `[ASSUMED]` cron schedules for the three `/api/mkt/cron/*` routes — spec B, story B3
     (server-action-guards:222-225). B3-AC4 only requires a valid 5-field schedule, so the
     tag does not change the check.
   - `[ASSUMED]` `.limit()` values = 200 rows for `/okrs`, `/internal-projects`, `/users`
     — spec D, story D3 (db-indexes:256-257). D3-AC3/AC6/AC9 only require `.limit(` to exist.
   - `[ASSUMED]` `BREVO_WEBHOOK_SECRET` transport = query token — spec A, story A1
     (security-p0:281-283).
   - `[ASSUMED]` CSP `style-src 'self' 'unsafe-inline'` — spec A, story A8 (security-p0:285-286).
   - `[ASSUMED]` chart-wrapper granularity (one `*.lazy.tsx` per chart family) — spec E, story E2
     (bundle-and-boundaries:273-275).
8. **Correction to B1-AC8 (frozen).** The spec's S9 finding states "54 ungated server actions"
   while its own per-module breakdown (17+18+7+5+3+2+1) sums to **53**; the spec's Open question 1
   asks for the audit to be re-run before freezing. It was re-run for this freeze with an AST
   walk of every `"use server"` file at commit `e96b250` (see the pre-hardening report for the
   full function-level table). Definitive figures:
   - **254** exported `async` server actions across **24** files.
   - **194 GATED** / **60 UNGATED** (GATED = own body calls `supabase.auth.getUser()` or a module
     auth helper `requireChatUser` / `requireInternalStaff` / `getUserIdOrError` / `requireAdmin` /
     `getAdminClient`, or delegates one level to a function that does).
   - Of the 60: **57** sit in the seven modules the story targets; **3** are pre-auth actions
     (`signin/actions.ts` `signIn`, `sendPasswordReset`; `reset_pw/actions.ts` `updatePassword`)
     that cannot be gated by design and are **excluded**.
   - Of the 57: **47 perform a write** (`insert`/`update`/`upsert`/`delete`); 10 are read-only.
   - Per-module **ungated-writer** counts (the predicate AC1-AC7 actually test):
     docs **15**, ideas-refiner **17**, projects **8**, sops **5**, internal-projects **0**,
     invoices **2**, settings **0**.
   - Per-module **ungated (all)** counts: docs 17, ideas-refiner 19, projects 11, sops 5,
     internal-projects 2, invoices 2, settings 1.
   **AC8's threshold is corrected from `>= 54` to `>= 47`** — the exact number of ungated
   *mutating* actions, matching the story title and AC1-AC7's own writer predicate. The 57 (all
   ungated in-scope actions) and 60 (repo-wide) supersets are recorded here so a later run can
   score either reading without re-deriving anything.
   Note also that **internal-projects and settings already satisfy their ACs at the base commit**
   (ungated-writer count is already 0) — their ungated actions are read-only.

---

# Spec A — security-p0 (57 ACs, 9 stories)

## A1 · P0 (w=3) — Authenticate the Brevo webhook (S1) · spec:44

| AC | line | normative predicate | I-checks (frozen) |
|---|---|---|---|
| A1-AC1 | 52 | route reads the secret from env: `grep -n "BREVO_WEBHOOK_SECRET" src/app/api/webhooks/brevo/route.ts` >= 1 line | 1: route references `BREVO_WEBHOOK_SECRET` |
| A1-AC2 | 53 | comparison is constant-time: `grep -n "secretEquals" ...brevo/route.ts` >= 1 line | 1: route calls `secretEquals` |
| A1-AC3 | 54 | POST with no token prints `401` | 1: no-token POST is refused with 401 |
| A1-AC4 | 55 | POST with wrong token prints `401` | 1: wrong-token POST is refused with 401 |
| A1-AC5 | 56 | POST with correct token prints `200` or `204` | 1: token equal to `BREVO_WEBHOOK_SECRET` is accepted 2xx |
| A1-AC6 | 57 | fails closed when env var missing, and no `.insert(`/`.upsert(` before the secret check | **2**: (a) missing-secret branch returns 4xx/5xx; (b) first Supabase `await` appears after the check |
| A1-AC7 | 58 | `grep -c "^BREVO_WEBHOOK_SECRET=" .env.example` == 1 | 1: `.env.example` declares the var |

I-total **8** · T-total 7 (all UNMET by convention 3)

## A2 · P0 (w=3) — Make `sanitizeHtml` server-safe (S2) · spec:60

| AC | line | normative predicate | I-checks |
|---|---|---|---|
| A2-AC1 | 67 | `isomorphic-dompurify` is a production dependency | 1 |
| A2-AC2 | 68 | `src/lib/sanitize.ts` imports it | 1 |
| A2-AC3 | 69 | `grep -c "typeof window" src/lib/sanitize.ts` == 0 | 1 |
| A2-AC4 | 70 | server path strips scripts: output contains `<p>a</p>` and no `<script` | 1 |
| A2-AC5 | 71 | allow-list admits the TipTap tag set: `table` >= 1 line **and** `mark` >= 1 line | **2**: (a) `table` allowed; (b) `mark` allowed |
| A2-AC6 | 72 | `style` appears >= 1 line inside the allowed-attributes configuration | 1 |
| A2-AC7 | 73 | round-trip of a real `idea_prd.description` row leaves the `<h2>` count unchanged | 1 |

I-total **8**

## A3 · P0 (w=3) — Route every raw HTML render through `sanitizeHtml` (S3) · spec:75

| AC | line | normative predicate | I-checks |
|---|---|---|---|
| A3-AC1 | 83 | `grep -rn "dangerouslySetInnerHTML" src \| grep -v sanitizeHtml \| grep -v ThemeScript` == 0 lines | 1 |
| A3-AC2 | 84 | ThemeScript is the only exception: count == 1 **and** the injected value is a module-level `const` with no runtime interpolation | **2**: (a) count == 1; (b) value is a module-level const, no interpolation |
| A3-AC3 | 85 | `src/app/docs` unsanitized count == 0 | 1 |
| A3-AC4 | 86 | `src/app/ideas-refiner` unsanitized count == 0 | 1 |
| A3-AC5 | 87 | `src/app/chat` unsanitized count == 0 | 1 |
| A3-AC6 | 88 | `grep -n "sanitizeHtml" src/app/invoices/_components/InvoicePreview.tsx` >= 1 line | 1 |
| A3-AC7 | 89 | `grep -c "oklch" src/app/invoices/_components/InvoicePreview.tsx` == 0 | 1 |

I-total **8**

## A4 · P0 (w=3) — Remove the iframe same-origin escape, admit `Origin: null` (S4) · spec:91

| AC | line | normative predicate | I-checks |
|---|---|---|---|
| A4-AC1 | 99 | `grep -rn "allow-same-origin" src/app/m` == 0 lines | 1 |
| A4-AC2 | 100 | `grep -n "allow-scripts" src/app/m/[slug]/page.tsx` >= 1 line | 1 |
| A4-AC3 | 101 | `POST /api/m/event` with `Origin: null` prints `200` or `204` | 1 |
| A4-AC4 | 102 | `POST /api/m/[slug]/capture` with `Origin: null` prints `200` or `204` | 1 |
| A4-AC5 | 103 | both routes export `OPTIONS`; `Access-Control-Allow-Methods` lists only POST/OPTIONS | 1 |
| A4-AC6 | 104 | `access-control-allow-credentials: true` count == 0 | 1 |
| A4-AC7 | 105 | `grep -rln "Access-Control-Allow-Origin" src/app/api \| wc -l` == 2 | 1 |

I-total **7**

## A5 · P0 (w=3) — Dedicated unsubscribe signing secret (S5) · spec:107

| AC | line | normative predicate | I-checks |
|---|---|---|---|
| A5-AC1 | 115 | `outreach.ts` reads `UNSUBSCRIBE_SIGNING_SECRET` | 1 |
| A5-AC2 | 116 | `grep -c "SUPABASE_SERVICE_ROLE_KEY" src/lib/marketing/outreach.ts` == 0 | 1 |
| A5-AC3 | 117 | the documented fallback is `CRON_SECRET` only (>= 1 line) | 1 |
| A5-AC4 | 118 | with neither variable set, signing fails closed — never `createHmac` with `""` | 1 |
| A5-AC5 | 119 | `grep -c "^UNSUBSCRIBE_SIGNING_SECRET=" .env.example` == 1 | 1 |
| A5-AC6 | 120 | a freshly signed link returns `200`; one tampered signature char returns `400`/`403` | **2**: (a) valid signature verifies 200; (b) tampered signature refused 400/403 |

I-total **7**

## A6 · P1 (w=2) — Throttle every public writer (S6) · spec:122 · `[ASSUMED]` thresholds

| AC | line | normative predicate | I-checks |
|---|---|---|---|
| A6-AC1 | 133 | `test -f src/lib/rate-limit.ts` exits 0 | 1 |
| A6-AC2 | 134 | no dependency added under `dependencies` for this story `[VACUOUS-AT-BASE]` | 1 |
| A6-AC3 | 135 | `rate-limit` referenced in `src/app/api/m/[slug]/capture/route.ts` | 1 |
| A6-AC4 | 136 | `rate-limit` referenced in `src/app/api/m/event/route.ts` | 1 |
| A6-AC5 | 137 | count of webhook route files referencing `rate-limit` == number of webhook dirs | 1 |
| A6-AC6 | 138 | exceeding the limit yields >= 1 HTTP `429` | 1 |
| A6-AC7 | 139 | the `429` response carries `Retry-After` | 1 |
| A6-AC8 | 140 | `grep -n "Vercel Firewall" architecture.md` >= 1 line **and** that section names the three protected paths | **2**: (a) "Vercel Firewall" documented; (b) the three protected paths named |

I-total **9**

## A7 · P1 (w=2) — `server-only` guard on the Supabase server factory (S7) · spec:142

| AC | line | normative predicate | I-checks |
|---|---|---|---|
| A7-AC1 | 149 | `head -n 1 src/lib/supabase/server.ts` == `import "server-only";` | 1 |
| A7-AC2 | 150 | `head -n 1` of the public client module and of `server.ts` are identical strings. **Path correction (frozen): the spec cites `src/lib/supabase/public.ts`, which does not exist at the base commit; the real module is `src/lib/marketing/public.ts`.** Score against the corrected path. | 1 |
| A7-AC3 | 151 | `npm run build` exits 0 with the guard in place | 1 |
| A7-AC4 | 152 | no `"use client"` file imports `lib/supabase/server` (count == 0) | 1 |

I-total **4**

## A8 · P1 (w=2) — HSTS plus observable CSP (S8) · spec:154 · `[ASSUMED]` `style-src`

| AC | line | normative predicate | I-checks |
|---|---|---|---|
| A8-AC1 | 162 | `strict-transport-security` header returned on an app route | 1 |
| A8-AC2 | 163 | the HSTS value contains `max-age=31536000` | 1 |
| A8-AC3 | 164 | the HSTS value contains `includeSubDomains` | 1 |
| A8-AC4 | 165 | `content-security-policy-report-only` header returned | 1 |
| A8-AC5 | 166 | the enforcing `content-security-policy:` header is **not** set (0 lines) | 1 |
| A8-AC6 | 167 | HSTS also returned on `/m/<test-slug>` (count == 1) | 1 |
| A8-AC7 | 168 | existing headers preserved: `x-content-type-options`, `x-frame-options` (or CSP `frame-ancestors`), `referrer-policy` | **3**: one per header |
| A8-AC8 | 169 | with report-only live, a walk of `/projects`, `/chat`, `/ideas-refiner`, `/m/<slug>` produces zero **enforced** blocks | 1 |

I-total **10**

## A9 · P2 (w=0) — Collect CSP violation reports · spec:171 — NOT SCORED

| AC | line | predicate | I-checks |
|---|---|---|---|
| A9-AC1 | 178 | report-only header names `report-uri` or `report-to` | 1 |
| A9-AC2 | 179 | `POST /api/csp-report` prints `204` | 1 |
| A9-AC3 | 180 | `rate-limit` referenced in `src/app/api/csp-report/route.ts` | 1 |

I-total 3 · **w=0, excluded from `Final`; reported as roadmap readiness only.**

---

# Spec B — server-action-guards (45 ACs, 5 stories)

## B1 · P0 (w=3) — Gate every ungated mutating server action (S9) · spec:36

Frozen predicate for AC1-AC7: *"the module's ungated-write count is 0"*, where an **ungated
writer** is an exported `async function` whose body performs `.insert(`/`.update(`/`.upsert(`/
`.delete(` and which neither calls a gate itself nor delegates one level to a function that does.

| AC | line | normative predicate | I-checks |
|---|---|---|---|
| B1-AC1 | 44 | `src/app/docs/actions.ts` ungated-write count == 0 | 1 |
| B1-AC2 | 45 | `src/app/ideas-refiner/actions.ts` ungated-write count == 0 | 1 |
| B1-AC3 | 46 | `src/app/projects/actions.ts` ungated-write count == 0 | 1 |
| B1-AC4 | 47 | `src/app/sops/actions.ts` ungated-write count == 0 | 1 |
| B1-AC5 | 48 | `src/app/internal-projects/actions.ts` ungated-write count == 0 | 1 |
| B1-AC6 | 49 | `src/app/invoices/actions.ts` ungated-write count == 0 | 1 |
| B1-AC7 | 50 | `src/app/settings/actions.ts` ungated-write count == 0 | 1 |
| B1-AC8 | 51 | added gate calls across `src/app/**/actions.ts` **>= 47** (corrected from `>= 54`; see convention 8) | 1 |
| B1-AC9 | 52 | the gate is a single shared helper per module: >= 1 shared **action** gate helper exists, **and** no module defines more than one | **2**: (a) a shared action-gate helper exists (a page gate such as `requirePageAccess` does **not** satisfy this — read the path, do not credit the name); (b) no module defines more than one |
| B1-AC10 | 53 | `grep -rn "Not authenticated" src/app \| wc -l` >= 7 | 1 |
| B1-AC11 | 54 | added `throw new Error` in `src/app/**/actions.ts` == 0 `[VACUOUS-AT-BASE]` | 1 |
| B1-AC12 | 55 | signed out, `/projects` redirects to `/signin` **and** a direct action POST returns a body containing `Not authenticated` | **2**: (a) redirect holds; (b) direct action POST refuses with `Not authenticated` |
| B1-AC13 | 56 | signed-in staff can still perform every previously-working mutation across the 7 modules (manual walk, no new error toast) | 1 |

I-total **15**

## B2 · P0 (w=3) — Column allow-lists for `Record<string, unknown>` updates (S10) · spec:58

| AC | line | normative predicate | I-checks |
|---|---|---|---|
| B2-AC1 | 66 | `grep -n "\.update(data)" src/app/ideas-refiner/actions.ts` == 0 lines | 1 |
| B2-AC2 | 67 | `grep -rn "export function pick" src/lib \| wc -l` >= 1 | 1 |
| B2-AC3 | 68 | `Record<string, unknown>` count == number of `pick(` call sites in the same file | 1 |
| B2-AC4 | 69 | a named module-level allow-list constant (`_COLUMNS =` / `_ALLOWED =`) exists, >= 1 per guarded entity | 1 |
| B2-AC5 | 70 | `created_by` appears only inside `.insert({ ... created_by: user.id })`, never inside an allow-list constant | 1 |
| B2-AC6 | 71 | no allow-list constant contains `idea_id`, `project_id` or `id` `[VACUOUS-AT-BASE]` | 1 |
| B2-AC7 | 72 | an unknown key is dropped, not rejected: saving with `{"evil":1}` succeeds and no such column appears (DB round-trip) | 1 |
| B2-AC8 | 73 | a crafted `created_by` in the payload does **not** change the row (DB round-trip) | 1 |
| B2-AC9 | 74 | no legitimate field is lost — full ICP profile round-trips through the UI (manual) | 1 |

I-total **9**

Frozen **mass-assignment site list** (authoritative input for S10; established at `e96b250`
by AST taint-walk — parameter object reaching `.update`/`.insert`/`.upsert` with no key allow-list):

*Ungated + mass-assignable (7):*
`docs/actions.ts:331 updateAgreement` (`Object.entries(patch)` copy-all, L345) ·
`docs/actions.ts:709 updateDailyFeedback` (copy-all, L724) ·
`ideas-refiner/actions.ts:369 saveIcpProfile` (`.update(data)` L374, `Record<string, unknown>`) ·
`ideas-refiner/actions.ts:447 saveStrategicFramework` (`.update(data)` L452, `Record<string, unknown>`) ·
`ideas-refiner/actions.ts:481 saveOptimizationSuggestion` (`.update(data)` L486) ·
`invoices/actions.ts:65 updateInvoice` (copy-all, L71) ·
`projects/actions.ts:120 updateTask` (`data` -> rest `taskData` -> `updatePayload`, L133).

*Gated but still mass-assignable (14, defense-in-depth gap outside this story's ACs):*
`chat/actions.ts:1756 createInternalProjectDailyFeedback` · `chat/actions.ts:1810 updateInternalProjectDailyFeedback` ·
`ideas-refiner/actions.ts:78 updateIdea` (`Record<string, unknown>`) · `ideas-refiner/actions.ts:408 saveProductDefinition` ·
`internal-projects/actions.ts:112 updateInternalProject` · `:236 updateInternalTask` · `:334 updateInternalTaskTimeTrack` ·
`invoices/actions.ts:45 createInvoice` · `okrs/actions.ts:65 updateGoal` · `:133 updateKeyResult` · `:213 updateTrackEntry` ·
`projects/actions.ts:33 createProject` · `:50 updateProject` · `:94 createTask`.

## B3 · P1 (w=2) — Declare the marketing crons in `vercel.json` (S11) · spec:76 · `[ASSUMED]` schedules

| AC | line | normative predicate | I-checks |
|---|---|---|---|
| B3-AC1 | 84 | `vercel.json` has a `crons` array | 1 |
| B3-AC2 | 85 | `crons.length === 3` **and** `ls -d src/app/api/mkt/cron/*/ \| wc -l` == 3 | **2**: (a) 3 entries; (b) 3 cron route dirs |
| B3-AC3 | 86 | every `crons[i].path` resolves to `src/app${path}/route.ts` | 1 |
| B3-AC4 | 87 | every entry has a non-empty 5-field `schedule` string | 1 |
| B3-AC5 | 88 | the file is valid JSON and keeps `$schema` | 1 |
| B3-AC6 | 89 | all 3 cron routes still reference `CRON_SECRET` | 1 |
| B3-AC7 | 90 | the route comment describes a schedule matching the `vercel.json` entry for the same path | 1 |

I-total **8**

## B4 · P1 (w=2) — Reconcile `.env.example` with the code (S12) · spec:92

| AC | line | normative predicate | I-checks |
|---|---|---|---|
| B4-AC1 | 100 | every `process.env.X` read in `src/` (minus `NODE_ENV`, `NEXT_RUNTIME`) appears as `X=` in `.env.example` (code-only diff == 0 lines) | 1 |
| B4-AC2 | 101 | `.env.example` declares no variable the code never reads (example-only diff == 0 lines) | 1 |
| B4-AC3 | 102 | `CALCOM_WEBHOOK_SECRET` present | 1 |
| B4-AC4 | 103 | `TALLY_WEBHOOK_SECRET` present | 1 |
| B4-AC5 | 104 | `BREVO_TEMPLATE_MAGIC_LINK` present | 1 |
| B4-AC6 | 105 | `BREVO_TEMPLATE_PASSWORD_RESET` present | 1 |
| B4-AC7 | 106 | `BUFFER_API_KEY` present | 1 |
| B4-AC8 | 107 | `BUFFER_ORG_ID` present | 1 |
| B4-AC9 | 108 | `APOLLO_API_KEY` gone (count 0) | 1 |
| B4-AC10 | 109 | `POSTIZ_CLIENT_ID` gone (count 0) | 1 |
| B4-AC11 | 110 | no `^STRIPE_` variable remains (count 0) | 1 |
| B4-AC12 | 111 | `NEXT_PUBLIC_APP_URL` contains `:4000` **and** `grep -c "3000" .env.example` == 0 | **2**: (a) `:4000`; (b) zero `3000` occurrences |
| B4-AC13 | 112 | every value is a placeholder (the spec's negative-lookahead grep returns 0) | 1 |

I-total **14**

## B5 · P2 (w=0) — Origin / Fetch-Metadata check on server actions · spec:114 — NOT SCORED

| AC | line | predicate | I-checks |
|---|---|---|---|
| B5-AC1 | 121 | `allowedOrigins` declared in `next.config.ts` | 1 |
| B5-AC2 | 122 | POST with a foreign `Origin` is refused 4xx | 1 |
| B5-AC3 | 123 | the same POST with the correct `Origin` succeeds | 1 |

I-total 3 · **w=0.**

---

# Spec C — auth-roundtrips (49 ACs, 6 stories)

## C1 · P0 (w=3) — Narrow the middleware matcher (P1b) · spec:44

| AC | line | normative predicate | I-checks |
|---|---|---|---|
| C1-AC1 | 52 | `api` appears inside the matcher's negative-lookahead group | 1 |
| C1-AC2 | 53 | `m` (public landing prefix) appears in the same exclusion group | 1 |
| C1-AC3 | 54 | the exclusion group still contains `_next/static`, `_next/image`, `favicon.ico` | **3**: one per token |
| C1-AC4 | 55 | `curl /api/m/event` produces 0 middleware invocations | 1 |
| C1-AC5 | 56 | `curl /m/<test-slug>` produces 0 middleware invocations | 1 |
| C1-AC6 | 57 | `curl /projects` produces exactly 1 middleware invocation | 1 |
| C1-AC7 | 58 | public zone still works without a session: `/m/<slug>` prints 200, **and** `/signin` and `/reset_pw` remain reachable | **3**: one per path |
| C1-AC8 | 59 | signed out, `-L /projects` still lands on `/signin` | 1 |
| C1-AC9 | 60 | `grep -rc "console.count\|console.time" src/proxy.ts` == 0 | 1 |

I-total **13**

## C2 · P0 (w=3) — Query `profiles` only when the clamp can apply (P1c) · spec:62

| AC | line | normative predicate | I-checks |
|---|---|---|---|
| C2-AC1 | 69 | the `profiles` query sits inside a branch guarded by a truthy `user` | 1 |
| C2-AC2 | 70 | the query is **additionally** guarded by a pathname test against `REFERRER_ALLOW_PREFIXES` (or its complement) *before* the query | 1 |
| C2-AC3 | 71 | `grep -c 'from("profiles")' src/proxy.ts` == 1 | 1 |
| C2-AC4 | 72 | an unauthenticated matched request issues 0 `profiles` queries | 1 |
| C2-AC5 | 73 | a signed-in request **inside** the allow-list issues 0 `profiles` queries | 1 |
| C2-AC6 | 74 | a signed-in request **outside** the allow-list issues exactly 1 `profiles` query | 1 |
| C2-AC7 | 75 | a `referrer` requesting `/chat` is still redirected to `/projects` | 1 |
| C2-AC8 | 76 | a `referrer` still gets 200 on `/projects`, `/feedback`, `/profile` | **3**: one per path |
| C2-AC9 | 77 | an `admin` is not clamped: `/chat` returns 200 | 1 |
| C2-AC10 | 78 | the Supabase session cookie is still refreshed on every matched request | 1 |

I-total **12**

## C3 · P0 (w=3) — One identity lookup per request via React `cache()` (P2) · spec:80

| AC | line | normative predicate | I-checks |
|---|---|---|---|
| C3-AC1 | 87 | `test -f src/lib/auth/current-user.ts` exits 0 | 1 |
| C3-AC2 | 88 | it imports `from "react"` **and** calls `cache(` | **2** |
| C3-AC3 | 89 | `head -n 1` == `import "server-only";` | 1 |
| C3-AC4 | 90 | it returns `userId` **and** `role` | **2** |
| C3-AC5 | 91 | `page-gate.ts` references `current-user` **and** its `auth.getUser()` count == 0 | **2** |
| C3-AC6 | 92 | `chat/actions.ts` references `current-user` **and** its `auth.getUser()` count == 0 | **2** |
| C3-AC7 | 93 | every other `require*` gate file also consumes `current-user` (count equality) | 1 |
| C3-AC8 | 94 | `auth.getUser()` in `src/lib/auth` + `src/app/*/actions.ts`, excluding `current-user.ts`, == 0 | 1 |
| C3-AC9 | 95 | measured de-duplication: post round-trip count strictly lower than the recorded pre-change baseline | 1 |
| C3-AC10 | 96 | `requirePageAccess` behaviour byte-identical — `ROLE_FALLBACK` routes all 8 roles to the same destinations | 1 |
| C3-AC11 | 97 | `cache()` does not leak across requests (two-browser parallel check) | 1 |

I-total **15**

## C4 · P1 (w=2) — Sidebar poll respects document visibility (P3e) · spec:99

| AC | line | normative predicate | I-checks |
|---|---|---|---|
| C4-AC1 | 106 | `visibilityState\|visibilitychange` >= 1 line in `ConversationsSidebar.tsx` | 1 |
| C4-AC2 | 107 | the tick callback returns early on `document.hidden` (or the interval is cleared) | 1 |
| C4-AC3 | 108 | the effect cleanup calls `removeEventListener("visibilitychange", ...)` | 1 |
| C4-AC4 | 109 | 0 requests to the sidebar action over 60 s backgrounded | 1 |
| C4-AC5 | 110 | a request appears within 20 s of re-focus | 1 |
| C4-AC6 | 111 | the existing in-flight guard is retained: `loadingRef\|inFlight` >= 1 line | 1 |

I-total **6**

## C5 · P1 (w=2) — Raise the four tab polls to 5000 ms, keeping their guards (P3a-P3d) · spec:113 · `[ASSUMED]` 5000 ms

**Path correction (frozen):** the spec cites `src/app/projects/_components/TaskRequestsKanbanWrapper.tsx`,
which does not exist at the base commit. The real file is
`src/app/chat/_components/tabs/TaskRequestsKanbanWrapper.tsx`. AC4 and AC6 score against the corrected path.

| AC | line | normative predicate | I-checks |
|---|---|---|---|
| C5-AC1 | 122 | `ProjectTabsPanel.tsx`: `5000` >= 1 line **and** `2000` count == 0 | **2** |
| C5-AC2 | 123 | `InternalProjectTabsPanel.tsx`: same two checks | **2** |
| C5-AC3 | 124 | `InternalProjectTasksTab.tsx`: same two checks | **2** |
| C5-AC4 | 125 | `TaskRequestsKanbanWrapper.tsx` (corrected path): same two checks | **2** |
| C5-AC5 | 126 | `grep -rn "POLL_INTERVAL_MS" src/app src/lib \| wc -l` >= 5 | 1 |
| C5-AC6 | 127 | all four files contain `loadingRef` (count == 4) | 1 |
| C5-AC7 | 128 | all four still poll only while their tab is visible (existing guard not removed) | 1 |
| C5-AC8 | 129 | the `hasFetched` ref pattern is preserved (spinner on first fetch only) | 1 |
| C5-AC9 | 130 | `grep -rn "channel(" src/app/chat \| wc -l` unchanged relative to HEAD `[VACUOUS-AT-BASE]` | 1 |
| C5-AC10 | 131 | measured: server-action requests over 60 s drop ~60 % vs the recorded pre-change baseline | 1 |

I-total **14**

## C6 · P2 (w=0) — Backoff when nothing changed · spec:133 — NOT SCORED

| AC | line | predicate | I-checks |
|---|---|---|---|
| C6-AC1 | 140 | `grep -rn "backoff" src/app/chat \| wc -l` >= 1 | 1 |
| C6-AC2 | 141 | the interval resets on any change or user interaction | 1 |
| C6-AC3 | 142 | a named maximum constant exists and is `<= 30000` | 1 |

I-total 3 · **w=0.**

---

# Spec D — db-indexes (50 ACs, 5 stories)

## D1 · P0 (w=3) — Index every foreign-key column the audit listed (P4) · spec:47

| AC | line | normative predicate | I-checks |
|---|---|---|---|
| D1-AC1 | 54 | exactly one `*_fk_indexes.sql` migration exists **and** its filename sorts after `20260814140000_drop_legacy_user_ai_keys.sql` | **2** |
| D1-AC2 | 55 | no existing migration was edited (porcelain shows only an added file) `[VACUOUS-AT-BASE]` | 1 |
| D1-AC3 | 56 | every create is idempotent: `CREATE INDEX IF NOT EXISTS` count == `^CREATE INDEX` count (no bare create) | 1 |
| D1-AC4 | 57 | `npm run db:reset` exits 0 | 1 |
| D1-AC5 | 58 | re-applying the migration SQL is a no-op (exits 0, no error) | 1 |
| D1-AC6 | 59 | the un-indexed-FK audit query returns 0 rows against local Supabase | 1 |
| D1-AC7 | 72 | `(idea_id)` index count >= 17 | 1 |
| D1-AC8 | 73 | `(internal_project_id)` index count >= 7 | 1 |
| D1-AC9 | 74 | `(project_id)` index count increases by >= 4 vs the pre-change baseline | 1 |
| D1-AC10 | 75 | `(landing_id)` index count >= 3 | 1 |
| D1-AC11 | 76 | `(task_id)` index count >= 3 | 1 |
| D1-AC12 | 77 | `(campaign_id)` >= 1 **and** `(prospect_id)` >= 1 | **2** |
| D1-AC13 | 78 | `(created_by)` index count >= count of tables whose `pg_policies.qual` contains `created_by = auth.uid()` | 1 |
| D1-AC14 | 79 | `EXPLAIN (ANALYZE)` shows Index/Bitmap Index Scan (was Seq Scan) for: idea children by `idea_id`, tasks by `project_id`, outreach by `campaign_id` | **3**: one per query |
| D1-AC15 | 80 | every index created matches `^idx_<table>_<column>$` | 1 |
| D1-AC16 | 81 | `npx tsc --noEmit` exits 0 **and** `git status --porcelain src/lib/supabase/types.ts` is empty | **2** |

I-total **21**

## D2 · P0 (w=3) — Drop the redundant twin of each duplicate index pair (P5) · spec:83

| AC | line | normative predicate | I-checks |
|---|---|---|---|
| D2-AC1 | 90 | the same `_fk_indexes` migration contains 5 `DROP INDEX IF EXISTS` | 1 |
| D2-AC2 | 91 | no bare `^DROP INDEX ` without `IF EXISTS` (count 0) | 1 |
| D2-AC3 | 92 | every dropped name starts with `idx_`; the non-`idx_` sibling survives | 1 |
| D2-AC4 | 93 | the duplicate-pair query returns 0 rows against local Supabase | 1 |
| D2-AC5 | 102 | `pg_constraint` p/u count unchanged before and after `[VACUOUS-AT-BASE]` | 1 |
| D2-AC6 | 103 | `pg_policies` count unchanged (0 delta) `[VACUOUS-AT-BASE]` | 1 |
| D2-AC7 | 104 | `npm run db:reset` exits 0 with the drops in place | 1 |
| D2-AC8 | 105 | net index count drops by exactly 5 relative to creates-only | 1 |

I-total **8**

## D3 · P1 (w=2) — Bound the three unbounded page queries (P6a-P6c) · spec:107 · `[ASSUMED]` limit 200

**Evidence correction (frozen):** the spec's P6c finding claims `src/app/users/page.tsx:22-29`
issues `select("*")`. At the base commit it already names its columns explicitly
(`users/page.tsx:17,24`), so AC7 and AC8 are satisfied at base. Recorded, not reworded.

| AC | line | normative predicate | I-checks |
|---|---|---|---|
| D3-AC1 | 114 | `okrs/page.tsx` `select("*")` count == 0 | 1 |
| D3-AC2 | 115 | `okrs/page.tsx` names its columns explicitly, all of them actually used | 1 |
| D3-AC3 | 116 | `okrs/page.tsx` `.limit(` count >= 1 | 1 |
| D3-AC4 | 117 | `internal-projects/page.tsx` `select("*")` count == 0 | 1 |
| D3-AC5 | 118 | `internal-projects/page.tsx` names its columns explicitly | 1 |
| D3-AC6 | 119 | `internal-projects/page.tsx` `.limit(` count >= 1 | 1 |
| D3-AC7 | 120 | `users/page.tsx` `select("*")` count == 0 | 1 |
| D3-AC8 | 121 | `users/page.tsx` names its columns explicitly | 1 |
| D3-AC9 | 122 | `users/page.tsx` `.limit(` count >= 1 | 1 |
| D3-AC10 | 123 | manual walk of the three pages renders every previously-rendered field, no `undefined` | 1 |
| D3-AC11 | 124 | `npx tsc --noEmit` exits 0 **and** added `as any` count == 0 | **2** |

I-total **12**

## D4 · P1 (w=2) — Compute `max(order)` in Postgres (P6d-P6e) · spec:126

| AC | line | normative predicate | I-checks |
|---|---|---|---|
| D4-AC1 | 133 | `okrs/actions.ts` has `order("order"` with `ascending: false` >= 1 line | 1 |
| D4-AC2 | 134 | the same chain contains `.limit(1)` | 1 |
| D4-AC3 | 135 | `okrs/actions.ts` `Math.max\|.reduce(` count == 0 | 1 |
| D4-AC4 | 136 | `internal-projects/actions.ts` orders descending with `ascending: false` | 1 |
| D4-AC5 | 137 | `internal-projects/actions.ts` chain contains `.limit(1)` | 1 |
| D4-AC6 | 138 | `internal-projects/actions.ts` `Math.max\|.reduce(` count == 0 | 1 |
| D4-AC7 | 139 | the empty-table case stores `order = 0` (or the documented base), not `NaN`/`null` (DB round-trip) | 1 |
| D4-AC8 | 140 | three sequential OKR creations yield strictly increasing `order` (DB round-trip) | 1 |
| D4-AC9 | 141 | three sequential internal-project creations yield strictly increasing `order` | 1 |

I-total **9**

## D5 · P2 (w=0) — Reduce `select("*")` in the two heaviest Ideas Refiner files (P6f) · spec:143 — NOT SCORED

| AC | line | predicate | I-checks |
|---|---|---|---|
| D5-AC1 | 151 | `ideas-refiner/actions.ts` `select("*")` count <= 4 | 1 |
| D5-AC2 | 152 | `_lib/loadIdeaFull.ts` `select("*")` count <= 3 | 1 |
| D5-AC3 | 153 | `grep -n "_SELECT\s*=" src/app/ideas-refiner` >= 1 | 1 |
| D5-AC4 | 154 | `npx tsc --noEmit` exits 0, no `as any` added for these files | 1 |
| D5-AC5 | 155 | a full 15-step Ideas Refiner walk shows no missing field | 1 |
| D5-AC6 | 156 | `isRequestActive` count unchanged relative to HEAD | 1 |

I-total 6 · **w=0.**

---

# Spec E — bundle-and-boundaries (60 ACs, 7 stories)

## E1 · P0 (w=3) — Lazy-load the TipTap editor (P7a) · spec:43

| AC | line | normative predicate | I-checks |
|---|---|---|---|
| E1-AC1 | 51 | `test -f src/components/editor/RichTextEditor.lazy.tsx` exits 0 | 1 |
| E1-AC2 | 52 | the wrapper references `next/dynamic` | 1 |
| E1-AC3 | 53 | the `dynamic(...)` options object contains `ssr: false` | 1 |
| E1-AC4 | 54 | the options object contains a `loading:` function **and** the placeholder uses design tokens (`bg-surface`/`bg-muted`/`border-border` >= 1) | **2** |
| E1-AC5 | 55 | no `.tsx` outside `components/editor/` imports `@tiptap/` (count 0) | 1 |
| E1-AC6 | 56 | the wrapper-consumer grep returns >= 16 files under `src/app` | 1 |
| E1-AC7 | 57 | `/projects` first-load JS strictly lower than `_baseline-2026-09-15.md` | 1 |
| E1-AC8 | 58 | `/chat` first-load JS strictly lower than baseline | 1 |
| E1-AC9 | 59 | `/prompts` first-load JS strictly lower than baseline | 1 |
| E1-AC10 | 60 | editors still work: task modal, an Ideas Refiner step, Prompts shell, a chat tab panel all round-trip content (manual) | 1 |
| E1-AC11 | 61 | the invoice PDF still renders with hex styles (no `oklch()`) **and** the PRD DOCX/PDF export still produces a file | **2** |
| E1-AC12 | 62 | unsanitized `dangerouslySetInnerHTML` count remains 0 | 1 |

I-total **14**

## E2 · P0 (w=3) — Lazy-load Recharts (P7b-P7d) · spec:64 · `[ASSUMED]` wrapper granularity

**Path correction (frozen):** the spec's P7c/P7d evidence cites
`src/app/dashboard/_components/BlendedIntelligence.tsx` and `.../DashboardCharts.tsx`. At the base
commit these live at `src/app/marketing/[ideaId]/traffic/_components/BlendedIntelligence.tsx` and
`src/app/marketing/[ideaId]/_components/DashboardCharts.tsx`. AC6/AC7 score against the corrected
paths. There is also a **fourth** unlisted Recharts consumer,
`src/app/okrs/_components/KeyResultsTracker.tsx`, which AC4's repo-wide grep already covers.

| AC | line | normative predicate | I-checks |
|---|---|---|---|
| E2-AC1 | 71 | `ls src/components/charts/*.lazy.tsx` count >= 1 | 1 |
| E2-AC2 | 72 | every wrapper has `next/dynamic` >= 1 **and** `ssr: false` >= 1 | **2** |
| E2-AC3 | 73 | each wrapper supplies a token-styled `loading:` placeholder sized to the chart box | 1 |
| E2-AC4 | 74 | no file outside `components/charts/` imports from `recharts` (count 0) | 1 |
| E2-AC5 | 75 | `DashboardOverview.tsx` references `components/charts` | 1 |
| E2-AC6 | 76 | `BlendedIntelligence.tsx` (corrected path) references `components/charts` | 1 |
| E2-AC7 | 77 | `DashboardCharts.tsx` (corrected path) references `components/charts` | 1 |
| E2-AC8 | 78 | `/dashboard` first-load JS decreases vs baseline | 1 |
| E2-AC9 | 79 | no non-dashboard route shows a first-load JS increase **and** the shared chunk size decreases | **2** |
| E2-AC10 | 80 | charts still render with data, axes, tooltips, legend (manual `/dashboard` walk) | 1 |
| E2-AC11 | 81 | chart colours are tokens/hex, not raw `oklch()` (count 0 in `src/components/charts`) | 1 |

I-total **13**

## E3 · P0 (w=3) — App-level loading, error, global-error and not-found (P8a-P8d) · spec:83

| AC | line | normative predicate | I-checks |
|---|---|---|---|
| E3-AC1 | 90 | `src/app/loading.tsx` exists | 1 |
| E3-AC2 | 91 | `src/app/error.tsx` exists **and** its first line contains `"use client"` | **2** |
| E3-AC3 | 92 | `error.tsx` accepts the `reset` prop and calls it from a button | 1 |
| E3-AC4 | 93 | `src/app/global-error.tsx` exists, **is** a client component, **and** carries its own html/body wrapper | **3** |
| E3-AC5 | 94 | `src/app/not-found.tsx` exists | 1 |
| E3-AC6 | 95 | none of the four contains raw hex | 1 |
| E3-AC7 | 96 | each of the four contains >= 1 token class (`bg-base`/`bg-surface`/`text-text-primary`/`text-text-muted`/`border-border`) | 1 |
| E3-AC8 | 97 | none of the four contains an inline svg element | 1 |
| E3-AC9 | 98 | `/definitely-not-a-route` prints `404` **and** the body contains the Move37 not-found copy | **2** |
| E3-AC10 | 99 | a temporary throw in a page shows the styled error page with a working retry button (manual; throw removed after) | 1 |
| E3-AC11 | 100 | in production mode no stack trace / secret leaks into the error page | 1 |
| E3-AC12 | 101 | error/not-found pages do **not** attempt auth (`requirePageAccess`/`getUser` count 0) | 1 |

I-total **16**

## E4 · P1 (w=2) — Segment loading states for the four heaviest routes (P8a) · spec:103

| AC | line | normative predicate | I-checks |
|---|---|---|---|
| E4-AC1 | 110 | `src/app/ideas-refiner/loading.tsx` exists | 1 |
| E4-AC2 | 111 | `src/app/chat/loading.tsx` exists | 1 |
| E4-AC3 | 112 | `src/app/marketing/[ideaId]/loading.tsx` exists | 1 |
| E4-AC4 | 113 | `src/app/dashboard/loading.tsx` exists | 1 |
| E4-AC5 | 114 | none of the four contains raw hex | 1 |
| E4-AC6 | 115 | each of the four renders inside the app shell (`PageShell`, or structured to sit inside the layout that does) | 1 |
| E4-AC7 | 116 | each file contains >= 2 skeleton block elements (not a bare spinner) | 1 |
| E4-AC8 | 117 | `/ideas-refiner` on Slow 4G shows the skeleton before content, no blank frame | 1 |
| E4-AC9 | 118 | the same holds for `/chat`, `/marketing/<ideaId>`, `/dashboard` | **3**: one per route |
| E4-AC10 | 119 | the `npm run build` route table still lists all four routes with no new missing-boundary warning | 1 |

I-total **12**

## E5 · P1 (w=2) — Strip `console.*` from production, keep `console.error` (P9a) · spec:121

| AC | line | normative predicate | I-checks |
|---|---|---|---|
| E5-AC1 | 128 | `grep -n "removeConsole" next.config.ts` >= 1 line | 1 |
| E5-AC2 | 129 | the same config contains `exclude: ["error"]` | 1 |
| E5-AC3 | 130 | the setting is a plain object with no `process.env.NODE_ENV` ternary around it | 1 |
| E5-AC4 | 131 | `npm run build` exits 0 with the setting in place | 1 |
| E5-AC5 | 132 | dev logging unaffected — `npm run dev` still prints `console.warn`/`console.info` | 1 |
| E5-AC6 | 133 | the repo has no `console.log` in `src` (count 0) | 1 |

I-total **6**

## E6 · P1 (w=2) — Remove the deprecated `@types/dompurify` stub (P10) · spec:135

| AC | line | normative predicate | I-checks |
|---|---|---|---|
| E6-AC1 | 142 | `@types/dompurify` absent from both `dependencies` and `devDependencies` | 1 |
| E6-AC2 | 143 | `grep -c "@types/dompurify" package-lock.json` == 0 | 1 |
| E6-AC3 | 144 | `npx tsc --noEmit` exits 0 | 1 |
| E6-AC4 | 145 | no `ts-ignore` / `ts-expect-error` in `src/lib/sanitize.ts` (count 0) | 1 |
| E6-AC5 | 146 | after **both** this change and the `isomorphic-dompurify` swap, `npx tsc --noEmit` still exits 0 | 1 |

I-total **5**

## E7 · P2 (w=0) — `images` configuration, only if remote images exist (P9b) · spec:148 — NOT SCORED

| AC | line | predicate | I-checks |
|---|---|---|---|
| E7-AC1 | 155 | both precondition greps are run and their results written into `.specs/evaluations/` | 1 |
| E7-AC2 | 156 | if the remote-image count is 0, `next.config.ts` has no `images` key (count 0) | 1 |
| E7-AC3 | 157 | if the count is > 0, `images.remotePatterns` lists exactly those hostnames, no wildcard hostname | 1 |
| E7-AC4 | 158 | in either branch `npm run build` exits 0 | 1 |

I-total 4 · **w=0.**

---

# Frozen I-check totals

| Story | Spec | Priority | w | ACs | I-checks |
|---|---|---|---|---|---|
| A1 Brevo webhook | security-p0 | P0 | 3 | 7 | 8 |
| A2 sanitizeHtml server-safe | security-p0 | P0 | 3 | 7 | 8 |
| A3 route raw HTML | security-p0 | P0 | 3 | 7 | 8 |
| A4 iframe / Origin null | security-p0 | P0 | 3 | 7 | 7 |
| A5 unsubscribe secret | security-p0 | P0 | 3 | 6 | 7 |
| A6 throttle public writers | security-p0 | P1 | 2 | 8 | 9 |
| A7 server-only guard | security-p0 | P1 | 2 | 4 | 4 |
| A8 HSTS + report-only CSP | security-p0 | P1 | 2 | 8 | 10 |
| A9 CSP reports | security-p0 | P2 | 0 | 3 | 3 |
| B1 gate ungated actions | server-action-guards | P0 | 3 | 13 | 15 |
| B2 column allow-lists | server-action-guards | P0 | 3 | 9 | 9 |
| B3 vercel crons | server-action-guards | P1 | 2 | 7 | 8 |
| B4 env.example reconcile | server-action-guards | P1 | 2 | 13 | 14 |
| B5 origin check | server-action-guards | P2 | 0 | 3 | 3 |
| C1 narrow matcher | auth-roundtrips | P0 | 3 | 9 | 13 |
| C2 guarded profiles query | auth-roundtrips | P0 | 3 | 10 | 12 |
| C3 cache() current-user | auth-roundtrips | P0 | 3 | 11 | 15 |
| C4 sidebar visibility | auth-roundtrips | P1 | 2 | 6 | 6 |
| C5 polls to 5000 ms | auth-roundtrips | P1 | 2 | 10 | 14 |
| C6 backoff | auth-roundtrips | P2 | 0 | 3 | 3 |
| D1 FK indexes | db-indexes | P0 | 3 | 16 | 21 |
| D2 drop duplicate indexes | db-indexes | P0 | 3 | 8 | 8 |
| D3 bound page queries | db-indexes | P1 | 2 | 11 | 12 |
| D4 max(order) in Postgres | db-indexes | P1 | 2 | 9 | 9 |
| D5 reduce wildcard selects | db-indexes | P2 | 0 | 6 | 6 |
| E1 lazy TipTap | bundle-and-boundaries | P0 | 3 | 12 | 14 |
| E2 lazy Recharts | bundle-and-boundaries | P0 | 3 | 11 | 13 |
| E3 app-level boundaries | bundle-and-boundaries | P0 | 3 | 12 | 16 |
| E4 segment loading states | bundle-and-boundaries | P1 | 2 | 10 | 12 |
| E5 removeConsole | bundle-and-boundaries | P1 | 2 | 6 | 6 |
| E6 drop dompurify types stub | bundle-and-boundaries | P1 | 2 | 5 | 5 |
| E7 images config | bundle-and-boundaries | P2 | 0 | 4 | 4 |
| | | | | **261** | **302** |

Scored (w>0): **27 stories**, **242 ACs**, **283 I-checks**. Excluded (P2, w=0): 5 stories,
19 ACs, 19 I-checks. (Column sums verified by the roll-up script, not by hand.) `Sum(w)` is derived **inside the roll-up script** from this table, never
typed in as a literal.

# Baseline gaps recorded at freeze (do not fix by editing the specs)

1. **security-p0 S6/S7 evidence path** — cites `src/lib/supabase/public.ts`, which does not
   exist at `e96b250`. Real module: `src/lib/marketing/public.ts`. A7-AC2 is unscorable as
   written; corrected path frozen above. *Recommended sharpening:* "the first line of
   `src/lib/supabase/server.ts` and of `src/lib/marketing/public.ts` each equal
   `import "server-only";`" — equality to a literal, not to each other.
2. **server-action-guards S9 count** — "54" vs a 53-sum breakdown. Resolved to 60 / 57 / 47
   (convention 8). AC8 threshold corrected to `>= 47`.
3. **server-action-guards B1-AC9 grep** — `grep "export async function require"` matches the
   *page* gate `requirePageAccess` and therefore returns >= 1 even with zero action gates.
   *Recommended sharpening:* name the helper explicitly (`requireActionUser`) and require each of
   the seven modules to import it.
4. **server-action-guards B4-AC13 placeholder regex** — the negative lookahead excludes `your_`
   but this repo's `.env.example` uses `your-` (hyphen), and `BREVO_FROM_NAME=Move37` is a real
   non-placeholder value. The AC fails even on a correctly-sanitised file.
   *Recommended sharpening:* allow `your[-_]` and whitelist known-safe literals.
5. **auth-roundtrips P3d path** — `TaskRequestsKanbanWrapper.tsx` is under
   `src/app/chat/_components/tabs/`, not `src/app/projects/_components/`. Corrected above.
6. **auth-roundtrips "already compliant" claim is wrong in two places** — the spec states all four
   tab polls "already hold an in-flight `loadingRef` guard" and that the `hasFetched` pattern is in
   place. At `e96b250`: `loadingRef` is present in `ProjectTabsPanel.tsx` and
   `InternalProjectTabsPanel.tsx` only (absent in `InternalProjectTasksTab.tsx` and
   `TaskRequestsKanbanWrapper.tsx`), and `hasFetched` appears in **none** of the four. C4-AC6,
   C5-AC6 and C5-AC8 are therefore *additions*, not preservations. Kept as written; flagged.
7. **db-indexes P6c evidence** — `users/page.tsx` already names its columns at base; D3-AC7/AC8
   are satisfied at the base commit.
8. **db-indexes D2-AC3 assumption** — at least one duplicate pair
   (`internal_key_result_goal_idx` / `internal_key_result_internal_goal_id_idx`, baseline
   migration L3474/L3478) has **neither** name starting with `idx_`, so "each dropped name starts
   with `idx_`" cannot hold for all five. Matches the spec's own Open questions 3-4.
   *Recommended sharpening:* "each dropped index is the redundant twin, with a one-line comment in
   the migration naming its surviving sibling."
9. **bundle-and-boundaries E1-AC7/AC8/AC9 and E2-AC8/AC9 are unmeasurable** — the recorded
   baseline (`_baseline-2026-09-15.md`) states Next 16 + Turbopack **emits no First Load JS or
   shared-chunk figures**, so "strictly lower than baseline" has no pre-number to compare against.
   These five ACs can never be MET with the current toolchain. *Recommended sharpening:* replace
   with a chunk-membership check against the `.next` build manifest (TipTap/Recharts must not
   appear in the shared/framework chunk).
10. **bundle-and-boundaries P7a/P7c/P7d paths and counts** — TipTap is imported directly in
    **one** file (`src/app/ideas-refiner/_components/RichTextEditor.tsx`), not 16; the 16 figure
    counts *consumers of that wrapper*. `BlendedIntelligence` / `DashboardCharts` live under
    `src/app/marketing/[ideaId]/`, and a fourth Recharts consumer
    (`src/app/okrs/_components/KeyResultsTracker.tsx`) is unlisted. Corrected above.
11. **bundle-and-boundaries E1-AC6 is non-discriminating** — its grep already returns 28 at base
    because the *non-lazy* component shares the name.
    *Recommended sharpening:* grep only for `RichTextEditor.lazy`.
12. **security-p0 A2-AC7 is non-discriminating** — a no-op sanitizer trivially preserves the
    `<h2>` count. *Recommended sharpening:* add "and the same input with an injected script tag
    loses the script".
13. **`[VACUOUS-AT-BASE]` ACs** (A6-AC2, B1-AC11, B2-AC6, C5-AC9, D1-AC2, D2-AC5, D2-AC6) are
    delta / no-regression assertions that are literally true at any clean base commit. They are
    scored literally for reproducibility. *Recommended sharpening:* restate each against an
    absolute state rather than against a diff.

# Change log for this file

- **2026-09-15** — created and frozen. Corrections applied at freeze: B1-AC8 threshold
  `>= 54` to `>= 47`; A7-AC2, C5-AC4, C5-AC6, E2-AC6, E2-AC7 path corrections. No AC was
  removed, merged or re-split. Any future change to this file invalidates comparability with
  `2026-09-15-pre-hardening.md` and must be recorded here.
