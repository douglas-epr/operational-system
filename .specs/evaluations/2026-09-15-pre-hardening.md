# Pre-hardening conformance report — Move37 hardening pass

| Field | Value |
|---|---|
| Date | 2026-09-15 |
| Graded commit | `e96b250` (`e96b2508b3fff83909443689b139c8f98d05774a`), branch `master` — this **is** `HEAD` |
| Baseline (frozen checklist) | `.specs/evaluations/_ac-baseline.md`, frozen 2026-09-15, read verbatim |
| Prior gate capture (same commit) | `.specs/evaluations/_baseline-2026-09-15.md` |
| Specs graded | `security-p0`, `server-action-guards`, `auth-roundtrips`, `db-indexes`, `bundle-and-boundaries` (261 ACs, 32 stories) |
| Grader | move37-spec-conformance-reviewer (read-only over the subject) |
| **Final** | **0.13** — band **Inadequate** |

## Purpose and reading instruction

This is the deliberate **"before" picture**. The five specs describe work that had **not started**
at `e96b250`; four sibling agents began implementing it after this commit. A low `Final` is the
**expected and correct** result — its only job is to make the post-hardening run comparable
against an identical frozen checklist. Every UNMET below that reads as "not implemented" is
UNMET **because the work is still in flight**, not because it was attempted and failed. The
sections that matter for the after-comparison are the per-story `Story_score` column and the
Baseline-gap list.

## How the subject was read (important)

The working tree at grading time carried **178** uncommitted/staged entries from four sibling
agents implementing the hardening concurrently, including a modified `.env.example`. Reading the
working tree would therefore have graded a **different, partially-hardened** state.

Every fact in this report was read from the **committed** `e96b250` state only, via
`git archive e96b250` extracted into an out-of-tree scratchpad (byte-identical to
`git show e96b250:PATH` for every file). No file under `src/`, `supabase/`, `docs/`,
`.specs/features/` or any config was read from, or written to, the live working tree. The tree was
not stashed, checked out, reset or otherwise disturbed.

## Diff surface

The graded surface is the **whole repository at `e96b250`**, because the specs assert the
*absence* of work rather than the content of a change: there is no base..head pair to diff
(`e96b250` is both the base and the head of the before-state). Recorded for completeness:

- `git diff --name-only e96b250..e96b250` returns empty.
- `git status --porcelain` returns **178** entries — the sibling agents' in-flight work, **not graded**.

Files actually inspected at `e96b250` (evidence surface):

`next.config.ts` · `vercel.json` · `package.json` · `package-lock.json` · `.env.example` ·
`architecture.md` · `src/proxy.ts` · `src/lib/sanitize.ts` · `src/lib/supabase/server.ts` ·
`src/lib/supabase/client.ts` · `src/lib/auth/page-gate.ts` · `src/lib/auth/secretCompare.ts` ·
`src/lib/marketing/outreach.ts` · `src/lib/marketing/public.ts` ·
`src/app/api/webhooks/brevo|calcom|tally/route.ts` ·
`src/app/api/m/event/route.ts` · `src/app/api/m/unsubscribe/route.ts` ·
`src/app/api/m/[slug]/capture/route.ts` · `src/app/api/mkt/cron/*/route.ts` ·
`src/app/m/[slug]/page.tsx` · `src/components/theme/ThemeScript.tsx` ·
`src/app/invoices/_components/InvoicePreview.tsx` ·
all 24 `"use server"` action modules under `src/app/**/actions.ts` plus `seo-actions.ts` ·
`src/app/okrs/page.tsx` · `src/app/internal-projects/page.tsx` · `src/app/users/page.tsx` ·
`src/app/chat/_components/ConversationsSidebar.tsx` ·
`src/app/chat/_components/ProjectTabsPanel.tsx` ·
`src/app/chat/_components/InternalProjectTabsPanel.tsx` ·
`src/app/chat/_components/tabs/InternalProjectTasksTab.tsx` ·
`src/app/chat/_components/tabs/TaskRequestsKanbanWrapper.tsx` ·
`src/app/ideas-refiner/_components/RichTextEditor.tsx` ·
`src/app/ideas-refiner/_lib/loadIdeaFull.ts` ·
`src/app/dashboard/_components/DashboardOverview.tsx` ·
`src/app/marketing/[ideaId]/traffic/_components/BlendedIntelligence.tsx` ·
`src/app/marketing/[ideaId]/_components/DashboardCharts.tsx` ·
`src/app/okrs/_components/KeyResultsTracker.tsx` ·
`supabase/migrations/20260101000000_production_baseline.sql` and the `supabase/migrations/` listing.

## Ensemble (k = 3)

The checklist was walked three times: pass 1 by regex/line heuristic, pass 2 by TypeScript-AST
walk (authoritative for the server-action classification), pass 3 by targeted end-to-end reads of
the specific code paths. Majority verdict taken per check.

**Checks where the three passes disagreed** (majority kept, cause recorded):

| Check | Disagreement | Resolution |
|---|---|---|
| B1-AC1..AC7 (per-module ungated counts) | Pass 1 over-counted (docs 26, chat 10, projects 12) because a column-0 closing-brace heuristic truncated function bodies at multi-line return-type annotations. | Pass 2/3 (AST) authoritative. Chat is fully gated (0 ungated); see the Task-1 table. |
| B1-AC9 | Pass 1 scored MET on the AC literal grep (it matches `requirePageAccess`); passes 2/3 scored UNMET after reading the path. | **UNMET** for the shared-helper sub-check. Symbol-name credit refused (Core rule 3). Baseline gap 3. |
| A2-AC7, A5-AC6, B2-AC7, B2-AC8, D1-AC4..AC6, D1-AC14 | Passes split on whether "DB/HTTP round-trip not performed" is UNMET or unscored. | **UNMET with a recorded search** — the behaviour is provably absent from the static path, so the missing round-trip does not change the verdict. |
| E1-AC6, E2-AC11 | Passes split on vacuous-true greps over a non-existent directory and a name-colliding component. | E1-AC6 **MET** (literal grep returns 28); E2-AC11 **UNMET** (`src/components/charts` does not exist, so the check is not evaluable). Baseline gaps 11 and 9. |

## Per-AC results

`I` = I-checks MET/total. `T` = 0/1 for **every** AC — no test runner configured (frozen
convention 3); not repeated per row. "in flight" = UNMET because the hardening had not started.
Evidence paths are all read at `e96b250`.

### Spec A — security-p0 (P0 stories A1-A5, P1 stories A6-A8, P2 A9)

| AC | predicate | pri | I | evidence | note |
|---|---|---|---|---|---|
| A1-AC1 | reads `BREVO_WEBHOOK_SECRET` | P0 | 0/1 | `api/webhooks/brevo/route.ts` count 0 | in flight |
| A1-AC2 | uses `secretEquals` | P0 | 0/1 | same file count 0; helper only at `lib/auth/secretCompare.ts` | in flight |
| A1-AC3 | no-token POST 401 | P0 | 0/1 | `brevo/route.ts:22-77` writes unconditionally | S1 live |
| A1-AC4 | wrong-token POST 401 | P0 | 0/1 | same | S1 live |
| A1-AC5 | correct-token POST 2xx | P0 | 0/1 | no secret-gated accept path | in flight |
| A1-AC6 | fail closed; no DB write before check | P0 | 0/2 | no check exists | in flight |
| A1-AC7 | `.env.example` declares it | P0 | 0/1 | count 0 | in flight |
| A2-AC1 | `isomorphic-dompurify` dep | P0 | 0/1 | `package.json` absent | in flight |
| A2-AC2 | `sanitize.ts` imports it | P0 | 0/1 | `lib/sanitize.ts:1` imports type from `dompurify` | in flight |
| A2-AC3 | no `typeof window` branch | P0 | 0/1 | `lib/sanitize.ts:27` count 1 | **S2 no-op live** |
| A2-AC4 | server path strips scripts | P0 | 0/1 | `lib/sanitize.ts:27` returns input unchanged | S2 live |
| A2-AC5 | allows `table` and `mark` | P0 | **1/2** | table MET `lib/sanitize.ts:9`; mark count 0 | partial |
| A2-AC6 | `style` in allowed attrs | P0 | 0/1 | `lib/sanitize.ts:13` href/target/rel/class only | in flight |
| A2-AC7 | h2 count preserved on a real row | P0 | 0/1 | DB round-trip not performed | gap 12 |
| A3-AC1 | zero unsanitized sinks | P0 | 0/1 | repo count **31** | **S3 live** |
| A3-AC2 | ThemeScript sole exception, const, no interpolation | P0 | **2/2** | `components/theme/ThemeScript.tsx:39` (1 site); `:17-36` const template, no interpolation | MET at base |
| A3-AC3 | docs sinks 0 | P0 | 0/1 | count **8** | in flight |
| A3-AC4 | ideas-refiner sinks 0 | P0 | 0/1 | count **18** | in flight |
| A3-AC5 | chat sinks 0 | P0 | 0/1 | count **4** | in flight |
| A3-AC6 | InvoicePreview uses `sanitizeHtml` | P0 | **1/1** | `invoices/_components/InvoicePreview.tsx` count 2 | MET at base |
| A3-AC7 | no `oklch` in InvoicePreview | P0 | **1/1** | same file count 0 | MET at base |
| A4-AC1 | `allow-same-origin` gone | P0 | 0/1 | `app/m/[slug]/page.tsx:94-98` — 2 occurrences | **S4 live** |
| A4-AC2 | `allow-scripts` present | P0 | **1/1** | `app/m/[slug]/page.tsx` count 1 | MET at base |
| A4-AC3 | event route accepts null origin | P0 | 0/1 | `api/m/event/route.ts` no CORS handling | in flight |
| A4-AC4 | capture route accepts null origin | P0 | 0/1 | same | in flight |
| A4-AC5 | OPTIONS handler, POST/OPTIONS only | P0 | 0/1 | OPTIONS count 0 across `src/app/api` | in flight |
| A4-AC6 | no credentialed wildcard CORS | P0 | **1/1** | `Access-Control` count 0 across `src/app/api` | MET (vacuous) |
| A4-AC7 | exactly 2 files set ACAO | P0 | 0/1 | count 0 | in flight |
| A5-AC1 | reads `UNSUBSCRIBE_SIGNING_SECRET` | P0 | 0/1 | `lib/marketing/outreach.ts` count 0 | in flight |
| A5-AC2 | service-role key count 0 | P0 | 0/1 | `lib/marketing/outreach.ts:56-57` count 2 | **S5 live** |
| A5-AC3 | `CRON_SECRET` fallback documented | P0 | **1/1** | `lib/marketing/outreach.ts:56` | MET at base |
| A5-AC4 | fails closed, never empty HMAC key | P0 | **1/1** | `outreach.ts:57` throws; `:63` signs only via `secret()` | MET at base |
| A5-AC5 | `.env.example` declares it | P0 | 0/1 | count 0 | in flight |
| A5-AC6 | valid sig 200, tampered 400/403 | P0 | 0/2 | `api/m/unsubscribe/route.ts:20,31` verifies under the OLD secret | in flight |
| A6-AC1 | `lib/rate-limit.ts` exists | P1 | 0/1 | missing | **S6 live** |
| A6-AC2 | no dependency added | P1 | **1/1** | `git diff --stat e96b250 -- package.json` empty | MET (VACUOUS) |
| A6-AC3 | capture route limited | P1 | 0/1 | count 0 | in flight |
| A6-AC4 | event route limited | P1 | 0/1 | count 0 | in flight |
| A6-AC5 | all webhook routes limited | P1 | 0/1 | 0 of 3 (brevo/calcom/tally) | in flight |
| A6-AC6 | 429 on flood | P1 | 0/1 | no limiter | in flight |
| A6-AC7 | `Retry-After` on 429 | P1 | 0/1 | no limiter | in flight |
| A6-AC8 | WAF rules + 3 paths documented | P1 | 0/2 | "Vercel Firewall" count 0 in `architecture.md` | in flight |
| A7-AC1 | `server.ts` line 1 is the guard | P1 | 0/1 | `lib/supabase/server.ts:1` is a `@supabase/ssr` import | **S7 live** |
| A7-AC2 | public + server first lines identical | P1 | 0/1 | corrected `lib/marketing/public.ts:1` is a comment opener | gap 1 |
| A7-AC3 | `npm run build` exits 0 | P1 | **1/1** | `_baseline-2026-09-15.md` same commit: exit 0, 41 routes | MET at base |
| A7-AC4 | no client import of the factory | P1 | **1/1** | cross-grep returns 0 | MET at base |
| A8-AC1 | HSTS on an app route | P1 | 0/1 | `next.config.ts:17-26` 4 headers, no HSTS | **S8 live** |
| A8-AC2 | `max-age=31536000` | P1 | 0/1 | same | in flight |
| A8-AC3 | `includeSubDomains` | P1 | 0/1 | same | in flight |
| A8-AC4 | report-only CSP sent | P1 | 0/1 | `next.config.ts:13-15` CSP deferred in a comment | in flight |
| A8-AC5 | enforcing CSP NOT set | P1 | **1/1** | `next.config.ts:17-26` sets no CSP | MET (vacuous) |
| A8-AC6 | HSTS on the `/m` tree | P1 | 0/1 | no HSTS anywhere | in flight |
| A8-AC7 | 3 existing headers preserved | P1 | **3/3** | `next.config.ts:21` nosniff, `:22` SAMEORIGIN, `:23` referrer-policy | MET at base |
| A8-AC8 | zero enforced CSP blocks | P1 | 0/1 | report-only not live | in flight |
| A9-AC1..3 | P2 CSP report endpoint | P2 | 0/3 | `src/app/api/csp-report/` absent | **w=0** |

### Spec B — server-action-guards (P0 B1-B2, P1 B3-B4, P2 B5)

| AC | predicate | pri | I | evidence | note |
|---|---|---|---|---|---|
| B1-AC1 | docs ungated-write count 0 | P0 | 0/1 | **15** ungated writers (17 ungated total) | in flight |
| B1-AC2 | ideas-refiner 0 | P0 | 0/1 | **17** ungated writers (19 total) | in flight |
| B1-AC3 | projects 0 | P0 | 0/1 | **8** ungated writers (11 total) | in flight |
| B1-AC4 | sops 0 | P0 | 0/1 | **5** ungated writers (5 total) | in flight |
| B1-AC5 | internal-projects 0 | P0 | **1/1** | 0 ungated writers; its 2 ungated fns (`:369`, `:464`) are read-only | **MET at base** |
| B1-AC6 | invoices 0 | P0 | 0/1 | **2** (`invoices/actions.ts:65`, `:82`) | in flight |
| B1-AC7 | settings 0 | P0 | **1/1** | 0 ungated writers; its 1 ungated fn (`:69 getAgency`) is read-only | **MET at base** |
| B1-AC8 | added gate calls >= 47 (corrected) | P0 | 0/1 | 0 added at base | threshold corrected, convention 8 |
| B1-AC9 | one shared action gate per module | P0 | **1/2** | (a) UNMET: no shared action gate. `lib/auth/page-gate.ts:83` is a *page* gate; module-private helpers at `chat/actions.ts:53`, `docs/actions.ts:18`, `internal-projects/actions.ts:19`, `okrs/actions.ts:15`, `users/actions.ts:9`, plus **9** copies of `getAdminClient`. (b) MET: none defines two. | gap 3 |
| B1-AC10 | "Not authenticated" >= 7 | P0 | **1/1** | count **59** in `src/app` | MET (non-discriminating) |
| B1-AC11 | no added `throw new Error` | P0 | **1/1** | 0 added at base | MET (VACUOUS) |
| B1-AC12 | redirect + action refusal | P0 | **1/2** | (a) MET `src/proxy.ts:75-77`; (b) UNMET — an ungated action yields an RLS error or a silent no-op | partial |
| B1-AC13 | all staff mutations still work | P0 | 0/1 | manual walk not performed | non-discriminating |
| B2-AC1 | `.update(data)` count 0 | P0 | 0/1 | `ideas-refiner/actions.ts` count **5** | **S10 live** |
| B2-AC2 | `export function pick` in `src/lib` | P0 | 0/1 | count 0; `src/lib/pick.ts` missing | in flight |
| B2-AC3 | Record-count equals pick-count | P0 | 0/1 | **48** vs **0** | in flight |
| B2-AC4 | named allow-list constants | P0 | 0/1 | `_COLUMNS =` / `_ALLOWED =` count 0 | in flight |
| B2-AC5 | `created_by` only in inserts | P0 | 0/1 | UNMET: `ideas-refiner/actions.ts:3682` and `:3880` write `created_by: null`; `:172` destructures it; 8 select lists name it | in flight |
| B2-AC6 | no FK in an allow-list | P0 | **1/1** | no allow-list constants exist | MET (VACUOUS) |
| B2-AC7 | unknown key dropped | P0 | 0/1 | `ideas-refiner/actions.ts:374` forwards `data` verbatim to Postgres | **S10 live** |
| B2-AC8 | crafted `created_by` ignored | P0 | 0/1 | `saveIcpProfile` `:369-378` would write it | **S10 live** |
| B2-AC9 | no legitimate field lost | P0 | 0/1 | manual round-trip not performed | non-discriminating |
| B3-AC1 | `crons` array present | P1 | 0/1 | `vercel.json` holds only `$schema` | **S11 live** |
| B3-AC2 | 3 entries and 3 route dirs | P1 | **1/2** | (a) UNMET no array; (b) MET — `api/mkt/cron/{process-content,process-outreach,sync-sourcing}` | partial |
| B3-AC3 | each path resolves | P1 | 0/1 | no entries | in flight |
| B3-AC4 | each has a 5-field schedule | P1 | 0/1 | no entries | `[ASSUMED]` schedules |
| B3-AC5 | valid JSON, `$schema` kept | P1 | **1/1** | `vercel.json` parses, `$schema` present | MET at base |
| B3-AC6 | 3 routes secret-guarded | P1 | **1/1** | 3 of 3, e.g. `process-outreach/route.ts:16` | MET at base |
| B3-AC7 | comment matches the entry | P1 | 0/1 | `process-outreach/route.ts:3` claims "Schedule is configured in vercel.json" — it is not | comment is false |
| B4-AC1 | code-only env diff 0 | P1 | 0/1 | **7** missing: BREVO_TEMPLATE_MAGIC_LINK, BREVO_TEMPLATE_PASSWORD_RESET, BUFFER_API_KEY, BUFFER_ORG_ID, CALCOM_WEBHOOK_SECRET, TALLY_WEBHOOK_SECRET, VERCEL_URL | **S12 live** |
| B4-AC2 | example-only env diff 0 | P1 | 0/1 | **4** stale: APOLLO_API_KEY, POSTIZ_CLIENT_ID, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET | S12 live |
| B4-AC3 | CALCOM_WEBHOOK_SECRET | P1 | 0/1 | count 0 | in flight |
| B4-AC4 | TALLY_WEBHOOK_SECRET | P1 | 0/1 | count 0 | in flight |
| B4-AC5 | BREVO_TEMPLATE_MAGIC_LINK | P1 | 0/1 | count 0 | in flight |
| B4-AC6 | BREVO_TEMPLATE_PASSWORD_RESET | P1 | 0/1 | count 0 | in flight |
| B4-AC7 | BUFFER_API_KEY | P1 | 0/1 | count 0 | in flight |
| B4-AC8 | BUFFER_ORG_ID | P1 | 0/1 | count 0 | in flight |
| B4-AC9 | APOLLO_API_KEY gone | P1 | 0/1 | count 1 | in flight |
| B4-AC10 | POSTIZ_CLIENT_ID gone | P1 | 0/1 | count 1 | in flight |
| B4-AC11 | no STRIPE_ | P1 | 0/1 | count 2 | in flight |
| B4-AC12 | `:4000` present, zero `3000` | P1 | 0/2 | `.env.example` has `NEXT_PUBLIC_APP_URL=http://localhost:3000`; `3000` count 1 | in flight |
| B4-AC13 | all values are placeholders | P1 | 0/1 | UNMET as written and unsatisfiable: the file uses `your-` while the AC excludes only `your_`, and `BREVO_FROM_NAME=Move37` is a real value | gap 4 |
| B5-AC1..3 | P2 origin check | P2 | 0/3 | `allowedOrigins` count 0 in `next.config.ts` | **w=0** |

### Spec C — auth-roundtrips (P0 C1-C3, P1 C4-C5, P2 C6)

**C1 and C2 score high at base** — the middleware already satisfies most of the *behavioural*
ACs (the referrer clamp, the public zone, the single `profiles` query, the signed-out redirect).
What is missing is the two *optimisations* the spec asks for (matcher narrowing, pathname guard).
This is the most useful number in the whole report: C1/C2 are where a regression would show.

| AC | predicate | pri | I | evidence | note |
|---|---|---|---|---|---|
| C1-AC1 | matcher excludes `/api` | P0 | 0/1 | `src/proxy.ts:108` excludes only `_next/static`, `_next/image`, `favicon.ico`, image extensions | **P1b live** |
| C1-AC2 | matcher excludes `/m` | P0 | 0/1 | same | P1b live |
| C1-AC3 | static exclusions retained | P0 | **3/3** | `src/proxy.ts:108` contains all three tokens | MET at base |
| C1-AC4 | 0 invocations on `/api/m/event` | P0 | 0/1 | matcher matches `/api/*`; instrumented run not performed | P1b live |
| C1-AC5 | 0 invocations on `/m/<slug>` | P0 | 0/1 | matcher matches `/m/*` | P1b live |
| C1-AC6 | exactly 1 invocation on `/projects` | P0 | **1/1** | `src/proxy.ts:108` matches `/projects` once | MET at base |
| C1-AC7 | public zone open without a session | P0 | **3/3** | `src/proxy.ts:58-65` — `isPublicRoute` covers `/m`, `/m/*`, `/signin`, `/reset_pw` | MET at base |
| C1-AC8 | signed out, `/projects` lands on `/signin` | P0 | **1/1** | `src/proxy.ts:75-77` | MET at base |
| C1-AC9 | no temp instrumentation in `proxy.ts` | P0 | **1/1** | `console.count`/`console.time` count 0 | MET at base |
| C2-AC1 | `profiles` query behind a truthy `user` | P0 | **1/1** | `src/proxy.ts:80-82` — inside `if (user) {` | MET at base |
| C2-AC2 | additionally guarded on pathname | P0 | 0/1 | `src/proxy.ts:80-95` — the pathname test happens **after** the query (`:87-89`), not before | **P1c live** |
| C2-AC3 | exactly one `profiles` query | P0 | **1/1** | `src/proxy.ts` count 1 | MET at base |
| C2-AC4 | unauthenticated issues 0 `profiles` | P0 | **1/1** | guarded by `if (user)` at `src/proxy.ts:80` | MET at base |
| C2-AC5 | signed-in inside allow-list issues 0 | P0 | 0/1 | query is unconditional for any signed-in user | **P1c live** |
| C2-AC6 | signed-in outside allow-list issues 1 | P0 | **1/1** | unconditional single query | MET at base |
| C2-AC7 | referrer clamped off `/chat` | P0 | **1/1** | `src/proxy.ts:86-95` redirects to `/projects` | MET at base |
| C2-AC8 | referrer allowed on the 3 paths | P0 | **3/3** | `src/proxy.ts:13-22` `REFERRER_ALLOW_PREFIXES` lists `/projects`, `/feedback`, `/profile` | MET at base |
| C2-AC9 | admin not clamped on `/chat` | P0 | **1/1** | clamp fires only when `profile?.type === "referrer"` (`src/proxy.ts:86`) | MET at base |
| C2-AC10 | session cookie still refreshed | P0 | **1/1** | `src/proxy.ts:28-47` cookie `setAll` writes onto `supabaseResponse` | MET at base |
| C3-AC1 | `lib/auth/current-user.ts` exists | P0 | 0/1 | **missing** | **P2 live** |
| C3-AC2 | imports react + `cache(` | P0 | 0/2 | file missing | P2 live |
| C3-AC3 | first line is the server-only guard | P0 | 0/1 | file missing | P2 live |
| C3-AC4 | returns `userId` and `role` | P0 | 0/2 | file missing | P2 live |
| C3-AC5 | `page-gate.ts` consumes it, 0 direct getUser | P0 | 0/2 | `current-user` count 0; `auth.getUser()` count **1** | P2 live |
| C3-AC6 | `requireChatUser` consumes it, 0 direct getUser | P0 | 0/2 | `chat/actions.ts` `current-user` count 0; `auth.getUser()` count **1** (`:53-69`) | P2 live |
| C3-AC7 | every other gate consumes it | P0 | 0/1 | none do | P2 live |
| C3-AC8 | 0 direct getUser in gate code | P0 | 0/1 | **51** across `src/lib/auth` + `src/app/*/actions.ts` | **P2b live** |
| C3-AC9 | measured de-duplication | P0 | 0/1 | no post number exists | P2 live |
| C3-AC10 | `requirePageAccess` byte-identical | P0 | 0/1 | per-role verification not performed | non-discriminating |
| C3-AC11 | `cache()` does not leak cross-request | P0 | 0/1 | no `cache()` exists | P2 live |
| C4-AC1 | sidebar reads visibility | P1 | 0/1 | `chat/_components/ConversationsSidebar.tsx` count 0 | **P3e live** |
| C4-AC2 | tick returns early when hidden | P1 | 0/1 | `ConversationsSidebar.tsx:119` bare `setInterval`, no guard | P3e live |
| C4-AC3 | listener removed on unmount | P1 | 0/1 | no listener | P3e live |
| C4-AC4 | 0 requests when backgrounded | P1 | 0/1 | no guard | P3e live |
| C4-AC5 | refresh within one interval on focus | P1 | 0/1 | no visibility handling | P3e live |
| C4-AC6 | in-flight guard retained | P1 | 0/1 | `loadingRef`/`inFlight` count **0** — the guard the spec calls "existing" is absent | gap 6 |
| C5-AC1 | ProjectTabsPanel 5000 / no 2000 | P1 | 0/2 | `5000` count 0, `2000` count 1 | **P3a live** |
| C5-AC2 | InternalProjectTabsPanel | P1 | 0/2 | `5000` 0, `2000` 1 | P3b live |
| C5-AC3 | InternalProjectTasksTab | P1 | 0/2 | `5000` 0, `2000` 1 | P3c live |
| C5-AC4 | TaskRequestsKanbanWrapper (corrected path) | P1 | 0/2 | `chat/_components/tabs/TaskRequestsKanbanWrapper.tsx`: `5000` 0, `2000` 1 | gap 5 |
| C5-AC5 | `POLL_INTERVAL_MS` >= 5 uses | P1 | 0/1 | count **0** | in flight |
| C5-AC6 | all four have `loadingRef` (==4) | P1 | 0/1 | only **2** of 4 (ProjectTabsPanel 4, InternalProjectTabsPanel 4; TasksTab 0, KanbanWrapper 0) | gap 6 |
| C5-AC7 | all four visible-tab gated | P1 | 0/1 | not verified for all four; two lack any in-flight guard | gap 6 |
| C5-AC8 | `hasFetched` pattern preserved | P1 | 0/1 | `hasFetched` count **0** in all four files | gap 6 |
| C5-AC9 | `channel(` count unchanged | P1 | **1/1** | `src/app/chat` count 4, unchanged at base | MET (VACUOUS) |
| C5-AC10 | measured ~60% request drop | P1 | 0/1 | no post number | in flight |
| C6-AC1..3 | P2 backoff | P2 | 0/3 | `backoff` count 0 in `src/app/chat` | **w=0** |

### Spec D — db-indexes (P0 D1-D2, P1 D3-D4, P2 D5)

Index counts below are read statically from
`supabase/migrations/20260101000000_production_baseline.sql` (69 `CREATE INDEX`, **zero**
`IF NOT EXISTS`, **zero** `DROP INDEX`), counting only indexes whose **sole** column is the named
one. No live-database query was run: the graded commit is not the deployed schema, and
`npm run db:reset` is a mutating command outside a read-only grader's bounds.

| AC | predicate | pri | I | evidence | note |
|---|---|---|---|---|---|
| D1-AC1 | one `*_fk_indexes.sql`, sorting last | P0 | 0/2 | `supabase/migrations/` — count 0; latest is `20260814140000_drop_legacy_user_ai_keys.sql` | **P4 live** |
| D1-AC2 | no existing migration edited | P0 | **1/1** | clean at `e96b250` | MET (VACUOUS) |
| D1-AC3 | all creates idempotent | P0 | 0/1 | no new migration | in flight |
| D1-AC4 | `npm run db:reset` exits 0 | P0 | 0/1 | not run (mutating; out of read-only bounds) | see note above |
| D1-AC5 | re-apply is a no-op | P0 | 0/1 | not run | same |
| D1-AC6 | zero un-indexed FK columns | P0 | 0/1 | 5 of 8 audited FK columns have **no** sole-column index at all | P4 live |
| D1-AC7 | `(idea_id)` >= 17 | P0 | 0/1 | **5** | P4a live |
| D1-AC8 | `(internal_project_id)` >= 7 | P0 | 0/1 | **1** | P4c live |
| D1-AC9 | `(project_id)` +>= 4 | P0 | 0/1 | 16 present, **0** delta | P4d live |
| D1-AC10 | `(landing_id)` >= 3 | P0 | 0/1 | **0** | P4b live |
| D1-AC11 | `(task_id)` >= 3 | P0 | 0/1 | **0** | P4e live |
| D1-AC12 | `(campaign_id)` and `(prospect_id)` >= 1 | P0 | 0/2 | **0** and **0** | P4f live |
| D1-AC13 | `(created_by)` covers Tier-2 policies | P0 | 0/1 | only **1** `(created_by)` index (`idx_project_invoice_created_by`) against many Tier-2 tables | P4g live |
| D1-AC14 | 3 EXPLAIN plans show Index Scan | P0 | 0/3 | no live DB; no indexes exist to be used | in flight |
| D1-AC15 | names match `idx_<table>_<column>` | P0 | 0/1 | no new migration | in flight |
| D1-AC16 | tsc 0 and `types.ts` clean | P0 | **2/2** | `_baseline-2026-09-15.md`: `npx tsc --noEmit` exit 0, 0 errors; `types.ts` clean at commit | MET at base |
| D2-AC1 | 5 `DROP INDEX IF EXISTS` | P0 | 0/1 | no new migration | **P5 live** |
| D2-AC2 | no bare `DROP INDEX` | P0 | 0/1 | no new migration | in flight |
| D2-AC3 | each dropped name starts `idx_` | P0 | 0/1 | no drops; and see gap 8 — one pair has neither name prefixed `idx_` | gap 8 |
| D2-AC4 | zero duplicate pairs remain | P0 | 0/1 | 5 pairs live, e.g. baseline `:3394 idea_project_id_idx` vs `:3398 idx_idea_project_id` (both `idea(project_id)`) | **P5 live** |
| D2-AC5 | p/u constraint count unchanged | P0 | **1/1** | no schema change at base | MET (VACUOUS) |
| D2-AC6 | policy count unchanged | P0 | **1/1** | no schema change at base | MET (VACUOUS) |
| D2-AC7 | `db:reset` exits 0 with drops | P0 | 0/1 | not run | in flight |
| D2-AC8 | net index count -5 | P0 | 0/1 | 0 delta | in flight |
| D3-AC1 | okrs page no wildcard select | P1 | 0/1 | `src/app/okrs/page.tsx` count **3** | **P6a live** |
| D3-AC2 | okrs names columns | P1 | 0/1 | wildcard selects present | P6a live |
| D3-AC3 | okrs has `.limit(` | P1 | 0/1 | count **0** | P6a live |
| D3-AC4 | internal-projects no wildcard | P1 | 0/1 | count **4** | P6b live |
| D3-AC5 | internal-projects names columns | P1 | 0/1 | wildcard selects present | P6b live |
| D3-AC6 | internal-projects has `.limit(` | P1 | 0/1 | count **0** | P6b live |
| D3-AC7 | users page no wildcard | P1 | **1/1** | `src/app/users/page.tsx` count **0** | **MET at base** (contradicts the spec's P6c finding) |
| D3-AC8 | users names columns | P1 | **1/1** | `src/app/users/page.tsx:17` and `:24` name explicit column lists | **MET at base** |
| D3-AC9 | users has `.limit(` | P1 | 0/1 | count **0** | in flight |
| D3-AC10 | no visual regression | P1 | 0/1 | manual walk not performed | non-discriminating |
| D3-AC11 | tsc 0 and no added `as any` | P1 | **2/2** | tsc exit 0 (same-commit capture); 0 added at base | MET at base |
| D4-AC1 | okrs orders descending | P1 | 0/1 | `src/app/okrs/actions.ts:46` selects `order` for the whole table; `ascending: false` count 0 | **P6d live** |
| D4-AC2 | okrs `.limit(1)` | P1 | 0/1 | absent | P6d live |
| D4-AC3 | okrs no JS max | P1 | 0/1 | `okrs/actions.ts:47` and `:112` use `Math.max(...)`; count **2** | P6d live |
| D4-AC4 | internal-projects orders descending | P1 | 0/1 | `internal-projects/actions.ts:65-67` selects `order` for the whole table; count 0 | **P6e live** |
| D4-AC5 | internal-projects `.limit(1)` | P1 | 0/1 | absent | P6e live |
| D4-AC6 | internal-projects no JS max | P1 | 0/1 | count **2** | P6e live |
| D4-AC7 | empty-table base value | P1 | 0/1 | DB round-trip not performed | in flight |
| D4-AC8 | 3 OKRs strictly increasing | P1 | 0/1 | not performed | in flight |
| D4-AC9 | 3 internal projects strictly increasing | P1 | 0/1 | not performed | in flight |
| D5-AC1..6 | P2 wildcard-select reduction | P2 | 0/6 | `ideas-refiner/actions.ts` **12**, `_lib/loadIdeaFull.ts` **9**, repo-wide **64**; `_SELECT =` count 0 | **w=0** |

### Spec E — bundle-and-boundaries (P0 E1-E3, P1 E4-E6, P2 E7)

| AC | predicate | pri | I | evidence | note |
|---|---|---|---|---|---|
| E1-AC1 | `components/editor/RichTextEditor.lazy.tsx` exists | P0 | 0/1 | **missing**; `src/components/editor/` does not exist | **P7a live** |
| E1-AC2 | uses `next/dynamic` | P0 | 0/1 | file missing | P7a live |
| E1-AC3 | `ssr: false` | P0 | 0/1 | file missing | P7a live |
| E1-AC4 | `loading:` fn + token classes | P0 | 0/2 | file missing | P7a live |
| E1-AC5 | no TipTap import outside `components/editor/` | P0 | 0/1 | **1**: `src/app/ideas-refiner/_components/RichTextEditor.tsx` | P7a live (and gap 10 — it is 1 file, not 16) |
| E1-AC6 | >= 16 wrapper consumers | P0 | **1/1** | literal grep returns **28** files under `src/app` | **MET (non-discriminating, gap 11)** |
| E1-AC7 | `/projects` first-load JS lower | P0 | 0/1 | **unmeasurable** — `_baseline-2026-09-15.md` records that Next 16/Turbopack emits no First Load JS column | gap 9 |
| E1-AC8 | `/chat` lower | P0 | 0/1 | unmeasurable | gap 9 |
| E1-AC9 | `/prompts` lower | P0 | 0/1 | unmeasurable | gap 9 |
| E1-AC10 | editors still work (manual) | P0 | 0/1 | manual walk not performed | non-discriminating |
| E1-AC11 | invoice PDF hex styles **and** PRD export works | P0 | **1/2** | (a) MET — `InvoicePreview.tsx` `oklch` count 0; (b) UNMET — export not exercised | partial |
| E1-AC12 | unsanitized sinks remain 0 | P0 | 0/1 | count **31** (cross-references A3-AC1) | S3 live |
| E2-AC1 | `components/charts/*.lazy.tsx` >= 1 | P0 | 0/1 | **0**; `src/components/charts/` does not exist | **P7b-d live** |
| E2-AC2 | each wrapper `next/dynamic` + `ssr: false` | P0 | 0/2 | no wrappers | P7b-d live |
| E2-AC3 | token-styled sized placeholder | P0 | 0/1 | no wrappers | P7b-d live |
| E2-AC4 | no Recharts import outside `components/charts/` | P0 | 0/1 | **4**: `app/dashboard/_components/DashboardOverview.tsx`, `app/marketing/[ideaId]/traffic/_components/BlendedIntelligence.tsx`, `app/marketing/[ideaId]/_components/DashboardCharts.tsx`, `app/okrs/_components/KeyResultsTracker.tsx` | P7b-d live; gap 10 (4 consumers, spec lists 3, and 2 paths are wrong) |
| E2-AC5 | `DashboardOverview` consumes a wrapper | P0 | 0/1 | imports `recharts` directly | P7b live |
| E2-AC6 | `BlendedIntelligence` (corrected path) | P0 | 0/1 | imports `recharts` directly | P7c live; gap 10 |
| E2-AC7 | `DashboardCharts` (corrected path) | P0 | 0/1 | imports `recharts` directly | P7d live; gap 10 |
| E2-AC8 | `/dashboard` first-load JS lower | P0 | 0/1 | unmeasurable | gap 9 |
| E2-AC9 | no route increases; shared chunk down | P0 | 0/2 | unmeasurable | gap 9 |
| E2-AC10 | charts still render (manual) | P0 | 0/1 | not performed | non-discriminating |
| E2-AC11 | no `oklch` in `components/charts` | P0 | 0/1 | directory absent; check not evaluable | gap 9 |
| E3-AC1 | `src/app/loading.tsx` | P0 | 0/1 | **missing** | **P8a live** |
| E3-AC2 | `src/app/error.tsx` + `"use client"` | P0 | 0/2 | **missing** | P8b live |
| E3-AC3 | `reset` prop wired to a button | P0 | 0/1 | file missing | P8b live |
| E3-AC4 | `global-error.tsx` client with own html/body | P0 | 0/3 | **missing** | P8c live |
| E3-AC5 | `src/app/not-found.tsx` | P0 | 0/1 | **missing** | P8d live |
| E3-AC6 | no raw hex in the four | P0 | 0/1 | all four files absent; not evaluable | P8 live |
| E3-AC7 | token classes in each | P0 | 0/1 | files absent | P8 live |
| E3-AC8 | no inline svg | P0 | 0/1 | files absent | P8 live |
| E3-AC9 | 404 status **and** Move37 copy | P0 | 0/2 | no server run; and no `not-found.tsx` exists, so the copy cannot be present | P8d live |
| E3-AC10 | error boundary renders with retry | P0 | 0/1 | no boundary exists | P8b live |
| E3-AC11 | no stack/secret leak in prod | P0 | 0/1 | no boundary exists | P8 live |
| E3-AC12 | boundary pages do not attempt auth | P0 | 0/1 | files absent; not evaluable | P8 live |
| E4-AC1 | `ideas-refiner/loading.tsx` | P1 | 0/1 | **missing** | P8 live |
| E4-AC2 | `chat/loading.tsx` | P1 | 0/1 | **missing** | P8 live |
| E4-AC3 | `marketing/[ideaId]/loading.tsx` | P1 | 0/1 | **missing** | P8 live |
| E4-AC4 | `dashboard/loading.tsx` | P1 | 0/1 | **missing** | P8 live |
| E4-AC5 | tokens only | P1 | 0/1 | files absent | P8 live |
| E4-AC6 | each inside the app shell | P1 | 0/1 | files absent | P8 live |
| E4-AC7 | >= 2 skeleton blocks each | P1 | 0/1 | files absent | P8 live |
| E4-AC8 | `/ideas-refiner` skeleton on Slow 4G | P1 | 0/1 | no boundary | P8 live |
| E4-AC9 | same for the other three routes | P1 | 0/3 | no boundaries | P8 live |
| E4-AC10 | build table lists all four, no boundary warning | P1 | **1/1** | `_baseline-2026-09-15.md` route table lists `/ideas-refiner`, `/chat`, `/marketing/[ideaId]`, `/dashboard`; build exit 0, no warnings | MET (non-discriminating) |
| E5-AC1 | `removeConsole` configured | P1 | 0/1 | `next.config.ts` count **0** | **P9a live** |
| E5-AC2 | `exclude: ["error"]` | P1 | 0/1 | absent | P9a live |
| E5-AC3 | plain object, no NODE_ENV ternary | P1 | 0/1 | setting absent | P9a live |
| E5-AC4 | build exits 0 with the setting | P1 | 0/1 | setting absent, so the compound predicate fails | P9a live |
| E5-AC5 | dev logging unaffected | P1 | 0/1 | not verified | in flight |
| E5-AC6 | no `console.log` in `src` | P1 | **1/1** | count **0** across `src` | **MET at base** |
| E6-AC1 | `@types/dompurify` gone from package.json | P1 | 0/1 | `dependencies["@types/dompurify"] = "^3.0.5"` | **P10 live** |
| E6-AC2 | lockfile clean | P1 | 0/1 | `package-lock.json` count **3** | P10 live |
| E6-AC3 | tsc exits 0 | P1 | **1/1** | same-commit capture: exit 0, 0 errors | MET at base |
| E6-AC4 | no ts-ignore in `sanitize.ts` | P1 | **1/1** | count **0** | MET at base |
| E6-AC5 | tsc 0 after **both** changes | P1 | 0/1 | the `isomorphic-dompurify` swap has not happened; compound predicate unsatisfied | in flight |
| E7-AC1..4 | P2 images config | P2 | 0/4 | `next/image` uses 1; remote `src="https://..."` count **0** (so the correct outcome is no `images` key, which holds); precondition results not yet recorded in `.specs/evaluations/` | **w=0** |

---

# Appendix 1 — Definitive server-action gate audit at `e96b250` (resolves the 54-vs-53 discrepancy)

Method: TypeScript AST walk (`typescript@5.9.3` `createSourceFile`) over every `"use server"`
module under `src/app/**/actions.ts` plus `src/app/marketing/[ideaId]/traffic/seo-actions.ts`
(24 files, all confirmed to carry the `"use server"` directive). Every top-level
`export async function` is enumerated with its declaration line. **GATED** = its own body calls
`supabase.auth.getUser()` or a module auth helper (`requireChatUser`, `requireInternalStaff`,
`getUserIdOrError`, `requireAdmin`, `getAdminClient`), **or** it delegates one level to a
same-module function that does. Exact spans were taken from the AST, not from a brace/line
heuristic — the heuristic is what produced the audit's wrong numbers (it truncated bodies at
column-0 `}` inside multi-line return-type annotations).

`getAdminClient` was verified to be a real gate, not a name match: each of its 9 copies calls
`supabase.auth.getUser()`, returns `{ error: "Not authenticated." }` when there is no user, then
reads `profiles.type` and returns `{ error: "Forbidden." }` unless the caller is staff
(e.g. `src/app/marketing/[ideaId]/content/actions.ts:38-52`). This is why the marketing modules
contribute **zero** ungated actions and are absent from the audit's per-module list.

## Headline numbers

| figure | value |
|---|---|
| exported async server actions | **254** across 24 files |
| GATED | **194** |
| UNGATED (repo-wide) | **60** |
| UNGATED, excluding 3 by-design pre-auth actions | **57** |
| UNGATED **writers** (insert/update/upsert/delete) | **47** |
| UNGATED read-only | **10** |

The audit's "54" and its 53-sum breakdown are **both wrong**. The reconciliation:

- the breakdown under-counted `ideas-refiner` (18 vs **19**) and `projects` (7 vs **11**), and
  over-counted `internal-projects` (3 vs **2** — `updateInternalProjectSector` at
  `internal-projects/actions.ts:285` delegates to the gated `updateInternalProject`, so it is GATED
  under the one-level-delegation rule);
- `docs` (17), `sops` (5), `invoices` (2) and `settings` (1) match exactly;
- the audit omitted the 3 pre-auth actions in `signin`/`reset_pw` (correctly — they cannot be gated);
- nothing accounts for the unattributed 54th action: there is no 54. The defensible targets are
  **57** (all in-scope ungated) or **47** (ungated mutators only). AC8 is frozen at **>= 47**.

## Per-file summary

| file | exported async | GATED | UNGATED | UNGATED writers |
|---|---|---|---|---|
| `src/app/chat/actions.ts` | 55 | 55 | — | — |
| `src/app/docs/actions.ts` | 33 | 16 | 17 | 15 |
| `src/app/feedback/actions.ts` | 3 | 3 | — | — |
| `src/app/ideas-refiner/actions.ts` | 33 | 14 | 19 | 17 |
| `src/app/internal-projects/actions.ts` | 16 | 14 | 2 | — |
| `src/app/invoices/actions.ts` | 4 | 2 | 2 | 2 |
| `src/app/marketing/[ideaId]/content/actions.ts` | 11 | 11 | — | — |
| `src/app/marketing/[ideaId]/interviews/actions.ts` | 4 | 4 | — | — |
| `src/app/marketing/[ideaId]/landing/actions.ts` | 4 | 4 | — | — |
| `src/app/marketing/[ideaId]/outreach/actions.ts` | 14 | 14 | — | — |
| `src/app/marketing/[ideaId]/positioning/actions.ts` | 3 | 3 | — | — |
| `src/app/marketing/[ideaId]/sourcing/actions.ts` | 8 | 8 | — | — |
| `src/app/marketing/[ideaId]/traffic/actions.ts` | 5 | 5 | — | — |
| `src/app/marketing/[ideaId]/traffic/seo-actions.ts` | 5 | 5 | — | — |
| `src/app/marketing/actions.ts` | 1 | 1 | — | — |
| `src/app/okrs/actions.ts` | 9 | 9 | — | — |
| `src/app/profile/actions.ts` | 1 | 1 | — | — |
| `src/app/projects/actions.ts` | 19 | 8 | 11 | 8 |
| `src/app/prompts/actions.ts` | 4 | 4 | — | — |
| `src/app/reset_pw/actions.ts` | 1 | 0 | 1 | — |
| `src/app/settings/actions.ts` | 6 | 5 | 1 | — |
| `src/app/signin/actions.ts` | 2 | 0 | 2 | — |
| `src/app/sops/actions.ts` | 9 | 4 | 5 | 5 |
| `src/app/users/actions.ts` | 4 | 4 | — | — |
| **TOTAL** | **254** | **194** | **60** | **47** |

## The authoritative UNGATED list (60)

`W` = performs a write. Rows 58-60 are the by-design pre-auth actions, excluded from the S9 target.

| # | file:line | function | W | signature |
|---|---|---|---|---|
| 1 | `src/app/docs/actions.ts:44` | `deletePlaybookVersion` | yes | `(versionId: string)` |
| 2 | `src/app/docs/actions.ts:192` | `editPlaybookCommentReply` | yes | `(id: string; patch: { message?: string; attachments?: DocsAttachment[] })` |
| 3 | `src/app/docs/actions.ts:210` | `deletePlaybookCommentReply` | yes | `(id: string)` |
| 4 | `src/app/docs/actions.ts:224` | `markPlaybookCommentsViewed` | no | `(playbookId: string)` |
| 5 | `src/app/docs/actions.ts:233` | `markPlaybookCommentRepliesViewed` | no | `(commentId: string)` |
| 6 | `src/app/docs/actions.ts:269` | `updateAgreementTemplate` | yes | `(id: string; patch: { name?: string; content?: string })` |
| 7 | `src/app/docs/actions.ts:286` | `deleteAgreementTemplate` | yes | `(id: string)` |
| 8 | `src/app/docs/actions.ts:331` | `updateAgreement` | yes | `(id: string; patch: { name?: string; type?: string / null; content?: string; google_docs_url?: string / null; status?: OsAgreementStatus; authorized_us)` |
| 9 | `src/app/docs/actions.ts:357` | `deleteAgreement` | yes | `(id: string)` |
| 10 | `src/app/docs/actions.ts:461` | `updateProjectFile` | yes | `(id: string; patch: { name?: string; description?: string / null; attachments?: DocsAttachment[] })` |
| 11 | `src/app/docs/actions.ts:479` | `deleteProjectFile` | yes | `(id: string)` |
| 12 | `src/app/docs/actions.ts:516` | `updateProjectLink` | yes | `(id: string; patch: { name?: string; description?: string / null; url?: string })` |
| 13 | `src/app/docs/actions.ts:534` | `deleteProjectLink` | yes | `(id: string)` |
| 14 | `src/app/docs/actions.ts:571` | `updateProjectVideo` | yes | `(id: string; patch: { name?: string; description?: string / null; url?: string })` |
| 15 | `src/app/docs/actions.ts:589` | `deleteProjectVideo` | yes | `(id: string)` |
| 16 | `src/app/docs/actions.ts:709` | `updateDailyFeedback` | yes | `(id: string; patch: { start_date?: string / null; end_date?: string / null; total_time?: number / null; current_state?: string / null; current_work?: s)` |
| 17 | `src/app/docs/actions.ts:758` | `deleteDailyFeedback` | yes | `(id: string)` |
| 18 | `src/app/ideas-refiner/actions.ts:327` | `saveStructureAlign` | yes | `(ideaId: string; data: { core_problem: string; target_audience: string; success_metrics: string })` |
| 19 | `src/app/ideas-refiner/actions.ts:369` | `saveIcpProfile` | yes | `(icpId: string; data: Record<string, unknown>)` |
| 20 | `src/app/ideas-refiner/actions.ts:381` | `createIcp` | yes | `(ideaId: string; data: { name: string; description?: string })` |
| 21 | `src/app/ideas-refiner/actions.ts:397` | `deleteIcp` | yes | `(icpId: string)` |
| 22 | `src/app/ideas-refiner/actions.ts:447` | `saveStrategicFramework` | yes | `(icpId: string; data: Record<string, unknown>)` |
| 23 | `src/app/ideas-refiner/actions.ts:459` | `createOptimizationSuggestion` | yes | `(ideaId: string; icpId: string; data: { name: string; description?: string })` |
| 24 | `src/app/ideas-refiner/actions.ts:481` | `saveOptimizationSuggestion` | yes | `(id: string; data: { name?: string; description?: string })` |
| 25 | `src/app/ideas-refiner/actions.ts:496` | `deleteOptimizationSuggestion` | yes | `(id: string)` |
| 26 | `src/app/ideas-refiner/actions.ts:512` | `saveRiskAndValidation` | yes | `(ideaId: string; data: { risk_register?: unknown; validation_test?: unknown; why_we_win?: unknown; demand_evidence?: unknown; })` |
| 27 | `src/app/ideas-refiner/actions.ts:548` | `saveBenchmarking` | yes | `(ideaId: string; data: { overview?: string; comparison?: string; possible_business_models?: string; takeaways?: string })` |
| 28 | `src/app/ideas-refiner/actions.ts:579` | `savePrd` | yes | `(ideaId: string; data: { description?: string; })` |
| 29 | `src/app/ideas-refiner/actions.ts:612` | `saveDatabase` | yes | `(ideaId: string; data: { tables_schema?: string; relationships?: string; notes?: string })` |
| 30 | `src/app/ideas-refiner/actions.ts:643` | `saveStyles` | yes | `(ideaId: string; data: { logo_branding?: string; color_palette?: string; product_feeling?: string; primary_color?: string; secondary_color?: string; ac)` |
| 31 | `src/app/ideas-refiner/actions.ts:783` | `saveMilestonesAndTasks` | yes | `(ideaId: string; data: { content?: string })` |
| 32 | `src/app/ideas-refiner/actions.ts:814` | `saveReport` | yes | `(ideaId: string; data: { headline?: string; summary?: string; next_steps?: string; playbook_title?: string; playbook_subtitle?: string; playbook_html?:)` |
| 33 | `src/app/ideas-refiner/actions.ts:3544` | `loadChatHistory` | no | `(ideaId: string)` |
| 34 | `src/app/ideas-refiner/actions.ts:3776` | `loadDevilAdvocateChatHistory` | no | `(ideaId: string)` |
| 35 | `src/app/ideas-refiner/actions.ts:4258` | `saveLocationLegislation` | yes | `(ideaId: string; data: { regulatory_bodies?: string; key_legislation?: string; licensing_requirements?: string; data_privacy_rules?: string; compliance)` |
| 36 | `src/app/ideas-refiner/actions.ts:4297` | `saveMarketOpportunity` | yes | `(ideaId: string; data: { tam_description?: string; tam_estimate?: string; sam_description?: string; sam_estimate?: string; som_description?: string; so)` |
| 37 | `src/app/internal-projects/actions.ts:369` | `getInternalTaskComments` | no | `(internalTaskId: string)` |
| 38 | `src/app/internal-projects/actions.ts:464` | `markInternalTaskCommentsViewed` | no | `(internalTaskId: string)` |
| 39 | `src/app/invoices/actions.ts:65` | `updateInvoice` | yes | `(id: string; patch: Partial<InvoicePayload>)` |
| 40 | `src/app/invoices/actions.ts:82` | `deleteInvoice` | yes | `(id: string)` |
| 41 | `src/app/projects/actions.ts:120` | `updateTask` | yes | `(id: string; data: Partial<TaskInput>)` |
| 42 | `src/app/projects/actions.ts:150` | `deleteTask` | yes | `(id: string)` |
| 43 | `src/app/projects/actions.ts:213` | `recalculateAggregates` | yes | `(projectId: string)` |
| 44 | `src/app/projects/actions.ts:372` | `recalculateRealTime` | yes | `(projectId: string)` |
| 45 | `src/app/projects/actions.ts:511` | `updateProjectAggregateEstimate` | yes | `(projectId: string; field: ProjectAggregateEstField; value: number / null)` |
| 46 | `src/app/projects/actions.ts:578` | `deleteTimeEntry` | yes | `(id: string; projectId: string)` |
| 47 | `src/app/projects/actions.ts:587` | `getTaskComments` | no | `(taskId: string)` |
| 48 | `src/app/projects/actions.ts:623` | `updateTaskComment` | yes | `(id: string; message: string; attachments: import("@/types/projects").TaskCommentAttachment[])` |
| 49 | `src/app/projects/actions.ts:642` | `markTaskCommentsViewed` | no | `(taskId: string)` |
| 50 | `src/app/projects/actions.ts:650` | `deleteTaskComment` | yes | `(id: string)` |
| 51 | `src/app/projects/actions.ts:670` | `getTaskTimeEntries` | no | `(taskId: string)` |
| 52 | `src/app/settings/actions.ts:69` | `getAgency` | no | `()` |
| 53 | `src/app/sops/actions.ts:124` | `renameVersion` | yes | `(versionId: string; name: string)` |
| 54 | `src/app/sops/actions.ts:137` | `deleteVersion` | yes | `(versionId: string)` |
| 55 | `src/app/sops/actions.ts:147` | `updateVersion` | yes | `(versionId: string; content: string)` |
| 56 | `src/app/sops/actions.ts:164` | `createTag` | yes | `(name: string)` |
| 57 | `src/app/sops/actions.ts:178` | `deleteTag` | yes | `(id: string)` |
| 58 | `src/app/reset_pw/actions.ts:6` | `updatePassword` | no | `(_prevState: { error?: string } / null; formData: FormData)` |
| 59 | `src/app/signin/actions.ts:8` | `signIn` | no | `(_prevState: { error?: string } / null; formData: FormData)` |
| 60 | `src/app/signin/actions.ts:36` | `sendPasswordReset` | no | `(_prevState: { error?: string; success?: boolean } / null; formData: FormData)` |

## The GATED list (194) — gate mechanism per function

| file:line | function | gate |
|---|---|---|
| `src/app/chat/actions.ts:153` | `listProjectConversations` | direct:requireChatUser |
| `src/app/chat/actions.ts:197` | `listInternalProjectConversations` | direct:requireChatUser |
| `src/app/chat/actions.ts:237` | `listPrivateConversations` | direct:requireChatUser |
| `src/app/chat/actions.ts:322` | `listSelectablePrivatePeers` | direct:requireChatUser |
| `src/app/chat/actions.ts:374` | `searchUsersForPrivate` | direct:requireChatUser |
| `src/app/chat/actions.ts:406` | `createPrivateConversation` | direct:requireChatUser |
| `src/app/chat/actions.ts:456` | `updatePrivateConversation` | direct:requireChatUser |
| `src/app/chat/actions.ts:492` | `deletePrivateConversation` | direct:requireChatUser |
| `src/app/chat/actions.ts:544` | `markConversationViewed` | direct:requireChatUser |
| `src/app/chat/actions.ts:568` | `markThreadViewed` | direct:requireChatUser |
| `src/app/chat/actions.ts:591` | `getProjectChatTabCounts` | direct:requireChatUser |
| `src/app/chat/actions.ts:642` | `getMessages` | direct:requireChatUser |
| `src/app/chat/actions.ts:724` | `getThreadMessages` | direct:requireChatUser |
| `src/app/chat/actions.ts:743` | `sendMessage` | direct:requireChatUser |
| `src/app/chat/actions.ts:787` | `replyInThread` | direct:requireChatUser |
| `src/app/chat/actions.ts:825` | `editMessage` | direct:requireChatUser |
| `src/app/chat/actions.ts:849` | `deleteMessage` | direct:requireChatUser |
| `src/app/chat/actions.ts:879` | `getConversationHeader` | direct:requireChatUser |
| `src/app/chat/actions.ts:947` | `listChatbotSessions` | direct:requireChatUser |
| `src/app/chat/actions.ts:975` | `createChatbotSession` | direct:requireChatUser |
| `src/app/chat/actions.ts:988` | `renameChatbotSession` | direct:requireChatUser |
| `src/app/chat/actions.ts:1000` | `deleteChatbotSession` | direct:requireChatUser |
| `src/app/chat/actions.ts:1009` | `getChatbotMessages` | direct:requireChatUser |
| `src/app/chat/actions.ts:1025` | `sendChatbotMessage` | direct:requireChatUser |
| `src/app/chat/actions.ts:1097` | `getConversationMembers` | direct:requireChatUser |
| `src/app/chat/actions.ts:1162` | `addConversationMember` | delegate:mutateConversationMember()[requireChatUser] |
| `src/app/chat/actions.ts:1170` | `removeConversationMember` | delegate:mutateConversationMember()[requireChatUser] |
| `src/app/chat/actions.ts:1186` | `getProjectFiles` | direct:requireChatUser |
| `src/app/chat/actions.ts:1202` | `getProjectLinks` | direct:requireChatUser |
| `src/app/chat/actions.ts:1213` | `getProjectVideos` | direct:requireChatUser |
| `src/app/chat/actions.ts:1224` | `getProjectDailyFeedbacks` | direct:requireChatUser |
| `src/app/chat/actions.ts:1250` | `getProjectTabBundle` | direct:requireChatUser |
| `src/app/chat/actions.ts:1332` | `getInternalProjectTaskBundle` | direct:requireChatUser |
| `src/app/chat/actions.ts:1399` | `getProjectForTabs` | direct:requireChatUser |
| `src/app/chat/actions.ts:1459` | `getProjectChatbotMessages` | direct:requireChatUser |
| `src/app/chat/actions.ts:1477` | `sendProjectChatbotMessage` | direct:requireChatUser |
| `src/app/chat/actions.ts:1525` | `getInternalProjectMeta` | direct:requireChatUser |
| `src/app/chat/actions.ts:1544` | `getInternalProjectFiles` | direct:requireChatUser |
| `src/app/chat/actions.ts:1559` | `createInternalProjectFile` | direct:requireChatUser |
| `src/app/chat/actions.ts:1576` | `updateInternalProjectFile` | direct:requireChatUser |
| `src/app/chat/actions.ts:1592` | `deleteInternalProjectFile` | direct:requireChatUser |
| `src/app/chat/actions.ts:1602` | `getInternalProjectLinks` | direct:requireChatUser |
| `src/app/chat/actions.ts:1614` | `createInternalProjectLink` | direct:requireChatUser |
| `src/app/chat/actions.ts:1631` | `updateInternalProjectLink` | direct:requireChatUser |
| `src/app/chat/actions.ts:1647` | `deleteInternalProjectLink` | direct:requireChatUser |
| `src/app/chat/actions.ts:1657` | `getInternalProjectVideos` | direct:requireChatUser |
| `src/app/chat/actions.ts:1669` | `createInternalProjectVideo` | direct:requireChatUser |
| `src/app/chat/actions.ts:1686` | `updateInternalProjectVideo` | direct:requireChatUser |
| `src/app/chat/actions.ts:1702` | `deleteInternalProjectVideo` | direct:requireChatUser |
| `src/app/chat/actions.ts:1712` | `getInternalProjectDailyFeedbacks` | direct:requireChatUser |
| `src/app/chat/actions.ts:1756` | `createInternalProjectDailyFeedback` | direct:requireChatUser |
| `src/app/chat/actions.ts:1810` | `updateInternalProjectDailyFeedback` | direct:requireChatUser |
| `src/app/chat/actions.ts:1856` | `deleteInternalProjectDailyFeedback` | direct:requireChatUser |
| `src/app/chat/actions.ts:1874` | `getReactions` | direct:requireChatUser |
| `src/app/chat/actions.ts:1931` | `toggleEmoji` | direct:requireChatUser |
| `src/app/docs/actions.ts:27` | `savePlaybookVersion` | direct:getUserIdOrError |
| `src/app/docs/actions.ts:54` | `createIdeaPlaybookVersion` | direct:getUserIdOrError |
| `src/app/docs/actions.ts:90` | `addPlaybookComment` | direct:getUserIdOrError |
| `src/app/docs/actions.ts:115` | `editPlaybookComment` | direct:getUserIdOrError |
| `src/app/docs/actions.ts:134` | `deletePlaybookComment` | direct:getUserIdOrError |
| `src/app/docs/actions.ts:147` | `setPlaybookCommentStatus` | direct:getUserIdOrError |
| `src/app/docs/actions.ts:165` | `addPlaybookCommentReply` | direct:getUserIdOrError |
| `src/app/docs/actions.ts:246` | `createAgreementTemplate` | direct:getUserIdOrError |
| `src/app/docs/actions.ts:296` | `createAgreement` | direct:getUserIdOrError |
| `src/app/docs/actions.ts:374` | `signAgreement` | direct:getUserIdOrError |
| `src/app/docs/actions.ts:434` | `createProjectFile` | direct:getUserIdOrError |
| `src/app/docs/actions.ts:489` | `createProjectLink` | direct:getUserIdOrError |
| `src/app/docs/actions.ts:544` | `createProjectVideo` | direct:getUserIdOrError |
| `src/app/docs/actions.ts:640` | `createDailyFeedback` | direct:getUserIdOrError |
| `src/app/docs/actions.ts:1047` | `buildPlaybookFromIdea` | direct:auth.getUser |
| `src/app/docs/actions.ts:1116` | `listIdeasForPlaybookPicker` | direct:auth.getUser |
| `src/app/feedback/actions.ts:12` | `createFeedback` | direct:auth.getUser |
| `src/app/feedback/actions.ts:46` | `updateFeedback` | direct:auth.getUser |
| `src/app/feedback/actions.ts:66` | `deleteFeedback` | direct:auth.getUser |
| `src/app/ideas-refiner/actions.ts:45` | `createIdea` | direct:auth.getUser |
| `src/app/ideas-refiner/actions.ts:78` | `updateIdea` | direct:auth.getUser |
| `src/app/ideas-refiner/actions.ts:96` | `duplicateIdea` | direct:auth.getUser |
| `src/app/ideas-refiner/actions.ts:222` | `deleteIdea` | direct:auth.getUser |
| `src/app/ideas-refiner/actions.ts:238` | `buildProjectFromIdea` | direct:auth.getUser |
| `src/app/ideas-refiner/actions.ts:292` | `clearAiWorking` | direct:auth.getUser |
| `src/app/ideas-refiner/actions.ts:408` | `saveProductDefinition` | direct:auth.getUser |
| `src/app/ideas-refiner/actions.ts:688` | `saveIdeaLogo` | direct:auth.getUser |
| `src/app/ideas-refiner/actions.ts:710` | `generateIdeaLogos` | direct:auth.getUser |
| `src/app/ideas-refiner/actions.ts:1219` | `triggerAiGeneration` | direct:auth.getUser |
| `src/app/ideas-refiner/actions.ts:3591` | `sendChatMessage` | direct:auth.getUser |
| `src/app/ideas-refiner/actions.ts:3793` | `sendDevilAdvocateChatMessage` | direct:auth.getUser |
| `src/app/ideas-refiner/actions.ts:3904` | `generateIdeaBrief` | direct:auth.getUser |
| `src/app/ideas-refiner/actions.ts:4024` | `assembleIdeaBrief` | direct:auth.getUser |
| `src/app/internal-projects/actions.ts:58` | `createInternalProject` | direct:requireInternalStaff |
| `src/app/internal-projects/actions.ts:112` | `updateInternalProject` | direct:requireInternalStaff |
| `src/app/internal-projects/actions.ts:146` | `deleteInternalProject` | direct:requireInternalStaff |
| `src/app/internal-projects/actions.ts:164` | `setInternalProjectAssignees` | direct:requireInternalStaff |
| `src/app/internal-projects/actions.ts:196` | `createInternalTask` | direct:requireInternalStaff |
| `src/app/internal-projects/actions.ts:236` | `updateInternalTask` | direct:requireInternalStaff |
| `src/app/internal-projects/actions.ts:268` | `deleteInternalTask` | direct:requireInternalStaff |
| `src/app/internal-projects/actions.ts:285` | `updateInternalProjectSector` | delegate:updateInternalProject()[requireInternalStaff] |
| `src/app/internal-projects/actions.ts:304` | `createInternalTaskTimeTrack` | direct:requireInternalStaff |
| `src/app/internal-projects/actions.ts:334` | `updateInternalTaskTimeTrack` | direct:requireInternalStaff |
| `src/app/internal-projects/actions.ts:351` | `deleteInternalTaskTimeTrack` | direct:requireInternalStaff |
| `src/app/internal-projects/actions.ts:385` | `createInternalTaskComment` | direct:requireInternalStaff |
| `src/app/internal-projects/actions.ts:411` | `updateInternalTaskComment` | direct:requireInternalStaff |
| `src/app/internal-projects/actions.ts:433` | `deleteInternalTaskComment` | direct:requireInternalStaff |
| `src/app/invoices/actions.ts:45` | `createInvoice` | direct:auth.getUser |
| `src/app/invoices/actions.ts:109` | `aiFillInvoiceFromFeedback` | direct:auth.getUser |
| `src/app/marketing/[ideaId]/content/actions.ts:61` | `getChannels` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/content/actions.ts:75` | `listContent` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/content/actions.ts:98` | `uploadMedia` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/content/actions.ts:134` | `fetchAnalytics` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/content/actions.ts:167` | `saveContent` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/content/actions.ts:213` | `rescheduleContent` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/content/actions.ts:230` | `deleteContent` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/content/actions.ts:373` | `refreshResearchCache` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/content/actions.ts:492` | `generateContentDraft` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/content/actions.ts:668` | `publishNow` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/content/actions.ts:733` | `scheduleWithBuffer` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/interviews/actions.ts:63` | `saveInterview` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/interviews/actions.ts:102` | `deleteInterview` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/interviews/actions.ts:122` | `analyzeInterview` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/interviews/actions.ts:198` | `synthesizeInterviews` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/landing/actions.ts:85` | `getLanding` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/landing/actions.ts:112` | `saveLanding` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/landing/actions.ts:244` | `generateLandingPage` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/landing/actions.ts:466` | `setLandingPublished` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/outreach/actions.ts:48` | `listProspects` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/outreach/actions.ts:69` | `addProspect` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/outreach/actions.ts:103` | `importProspects` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/outreach/actions.ts:135` | `deleteProspect` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/outreach/actions.ts:153` | `listCampaigns` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/outreach/actions.ts:164` | `createCampaign` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/outreach/actions.ts:189` | `setCampaignStatus` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/outreach/actions.ts:209` | `listSteps` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/outreach/actions.ts:231` | `saveStep` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/outreach/actions.ts:269` | `deleteStep` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/outreach/actions.ts:288` | `listOutreach` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/outreach/actions.ts:306` | `enrollProspects` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/outreach/actions.ts:363` | `runOutreachNow` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/outreach/actions.ts:376` | `markReplied` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/positioning/actions.ts:47` | `savePositioning` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/positioning/actions.ts:117` | `suggestDecisionContract` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/positioning/actions.ts:190` | `aiAutoFill` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/sourcing/actions.ts:71` | `listSourceRuns` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/sourcing/actions.ts:84` | `startGoogleMapsSourcing` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/sourcing/actions.ts:129` | `startLeadsSourcing` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/sourcing/actions.ts:183` | `syncSourcingRun` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/sourcing/actions.ts:208` | `startSocialDiscovery` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/sourcing/actions.ts:357` | `aiFillSourcingForm` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/sourcing/actions.ts:474` | `getProspectsForRun` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/sourcing/actions.ts:493` | `deleteProspectFromRun` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/traffic/actions.ts:49` | `listAdCampaigns` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/traffic/actions.ts:119` | `saveAdCampaign` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/traffic/actions.ts:175` | `deleteAdCampaign` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/traffic/actions.ts:206` | `generateAdCreative` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/traffic/actions.ts:308` | `getTrafficOverview` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/traffic/seo-actions.ts:39` | `listSeoKeywords` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/traffic/seo-actions.ts:57` | `addSeoKeyword` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/traffic/seo-actions.ts:86` | `removeSeoKeyword` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/traffic/seo-actions.ts:172` | `refreshSeoRanks` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/[ideaId]/traffic/seo-actions.ts:224` | `suggestSeoKeywords` | delegate:getAdminClient()[auth.getUser] |
| `src/app/marketing/actions.ts:36` | `listIdeasWithValidation` | delegate:getAdminClient()[auth.getUser] |
| `src/app/okrs/actions.ts:39` | `createGoal` | direct:requireInternalStaff |
| `src/app/okrs/actions.ts:65` | `updateGoal` | direct:requireInternalStaff |
| `src/app/okrs/actions.ts:85` | `deleteGoal` | direct:requireInternalStaff |
| `src/app/okrs/actions.ts:98` | `createKeyResult` | direct:requireInternalStaff |
| `src/app/okrs/actions.ts:133` | `updateKeyResult` | direct:requireInternalStaff |
| `src/app/okrs/actions.ts:164` | `deleteKeyResult` | direct:requireInternalStaff |
| `src/app/okrs/actions.ts:180` | `createTrackEntry` | direct:requireInternalStaff |
| `src/app/okrs/actions.ts:213` | `updateTrackEntry` | direct:requireInternalStaff |
| `src/app/okrs/actions.ts:235` | `deleteTrackEntry` | direct:requireInternalStaff |
| `src/app/profile/actions.ts:6` | `updateProfile` | direct:auth.getUser |
| `src/app/projects/actions.ts:33` | `createProject` | direct:auth.getUser |
| `src/app/projects/actions.ts:50` | `updateProject` | direct:auth.getUser |
| `src/app/projects/actions.ts:63` | `deleteProject` | direct:auth.getUser |
| `src/app/projects/actions.ts:94` | `createTask` | direct:auth.getUser |
| `src/app/projects/actions.ts:543` | `upsertTimeEntry` | direct:auth.getUser |
| `src/app/projects/actions.ts:598` | `createTaskComment` | direct:auth.getUser |
| `src/app/projects/actions.ts:722` | `listIdeasForDeveloperTasksPicker` | direct:auth.getUser |
| `src/app/projects/actions.ts:795` | `importTasksFromIdea` | direct:auth.getUser |
| `src/app/prompts/actions.ts:35` | `getPromptGroups` | direct:auth.getUser |
| `src/app/prompts/actions.ts:96` | `updatePromptName` | direct:auth.getUser |
| `src/app/prompts/actions.ts:127` | `updatePromptDescription` | direct:auth.getUser |
| `src/app/prompts/actions.ts:158` | `updatePromptGroupName` | direct:auth.getUser |
| `src/app/settings/actions.ts:22` | `saveTheme` | direct:auth.getUser |
| `src/app/settings/actions.ts:39` | `saveAiSettings` | direct:auth.getUser |
| `src/app/settings/actions.ts:85` | `saveAgencyInfo` | direct:auth.getUser |
| `src/app/settings/actions.ts:142` | `updateAccountEmail` | direct:auth.getUser |
| `src/app/settings/actions.ts:205` | `updateAccountPassword` | direct:auth.getUser |
| `src/app/sops/actions.ts:8` | `createSop` | direct:auth.getUser |
| `src/app/sops/actions.ts:49` | `updateSop` | direct:auth.getUser |
| `src/app/sops/actions.ts:78` | `deleteSop` | direct:auth.getUser |
| `src/app/sops/actions.ts:90` | `saveAsNewVersion` | direct:auth.getUser |
| `src/app/users/actions.ts:28` | `createUser` | direct:requireAdmin |
| `src/app/users/actions.ts:75` | `updateUser` | direct:requireAdmin |
| `src/app/users/actions.ts:107` | `deleteUser` | direct:requireAdmin |
| `src/app/users/actions.ts:121` | `resendInvitation` | direct:requireAdmin |

---

# Appendix 2 — Mass-assignment sites at `e96b250` (authoritative S10 input)

Detected by AST taint-walk: a **parameter object** reaching `.update()` / `.insert()` /
`.upsert()` with **no key allow-list**. Four equivalent patterns were all treated as mass
assignment, because TypeScript types are erased at runtime and a server action is a public HTTP
endpoint — a declared `Partial<Pick<...>>` constrains nothing at the wire:

- **P1** `.update(param)` — the parameter passed straight through.
- **P2** `.update({ ...param })` / `.insert({ ...param })` — spread of the parameter, or of a rest-destructure of it.
- **P3** `Object.entries(param)` copy-all loop into the update payload, with no key filter.
- **P4** parameter to a local object to the write (taint chained through an intermediate variable).

## Ungated **and** mass-assignable (7) — the highest-risk set

| # | site | pattern | declared param type |
|---|---|---|---|
| 1 | `src/app/ideas-refiner/actions.ts:369` `saveIcpProfile` | P1 `.update(data)` at `:374` | `Record<string, unknown>` — the spec named example |
| 2 | `src/app/ideas-refiner/actions.ts:447` `saveStrategicFramework` | P1 `.update(data)` at `:452` | `Record<string, unknown>` |
| 3 | `src/app/ideas-refiner/actions.ts:481` `saveOptimizationSuggestion` | P1 `.update(data)` at `:486` | 2-field object (erased at runtime) |
| 4 | `src/app/docs/actions.ts:331` `updateAgreement` | P3 copy-all at `:345` | 7-field patch — **includes `authorized_users` and `required_signers`** |
| 5 | `src/app/docs/actions.ts:709` `updateDailyFeedback` | P3 copy-all at `:724` | 8-field patch (erased) |
| 6 | `src/app/invoices/actions.ts:65` `updateInvoice` | P3 copy-all at `:71` | `Partial<InvoicePayload>` (erased) |
| 7 | `src/app/projects/actions.ts:120` `updateTask` | P4 `data` to rest `taskData` to `updatePayload` at `:133` | `Partial<TaskInput>` (erased) |

Sites 4-7 are **not** caught by the spec own check (`grep` for `.update(data)`), because they
launder the payload through `Object.entries` or an intermediate object. Any S10 implementation
that only fixes the three `.update(data)` sites will satisfy B2-AC1 while leaving four
mass-assignment holes open. **This is the single most important finding in this report.**

## Gated but still mass-assignable (14) — defense-in-depth gap, outside B2 ACs

`src/app/chat/actions.ts:1756` `createInternalProjectDailyFeedback` (P2) ·
`src/app/chat/actions.ts:1810` `updateInternalProjectDailyFeedback` (P4) ·
`src/app/ideas-refiner/actions.ts:78` `updateIdea` (P1, `Record<string, unknown>`) ·
`src/app/ideas-refiner/actions.ts:408` `saveProductDefinition` (P1 and P2) ·
`src/app/internal-projects/actions.ts:112` `updateInternalProject` (P1) ·
`src/app/internal-projects/actions.ts:236` `updateInternalTask` (P1) ·
`src/app/internal-projects/actions.ts:334` `updateInternalTaskTimeTrack` (P1) ·
`src/app/invoices/actions.ts:45` `createInvoice` (P4) ·
`src/app/okrs/actions.ts:65` `updateGoal` (P2) ·
`src/app/okrs/actions.ts:133` `updateKeyResult` (P2) ·
`src/app/okrs/actions.ts:213` `updateTrackEntry` (P1) ·
`src/app/projects/actions.ts:33` `createProject` (P2) ·
`src/app/projects/actions.ts:50` `updateProject` (P1) ·
`src/app/projects/actions.ts:94` `createTask` (P2).

`ideas-refiner/actions.ts:78 updateIdea` deserves particular attention: it is gated *and* takes a
bare `Record<string, unknown>` into `.update(data)` on the `idea` table.

**Total mass-assignment sites repo-wide: 21.**

---

# UNMET detail — the search performed before each zero

Per Core rule 2, every UNMET records the search actually run. All searches were executed against
the extracted `e96b250` tree, never the working tree.

| UNMET group | search performed | what is actually missing |
|---|---|---|
| A1 (all 8) | read `src/app/api/webhooks/brevo/route.ts` top to bottom; grepped `BREVO_WEBHOOK_SECRET`, `secretEquals`, `token` in the file and in `.env.example`; listed `src/app/api/webhooks/*/` | no authentication of any kind; the service-role writes at `:22-77` are reachable by any anonymous POST |
| A2-AC1..AC4, AC6 | read all 30 lines of `src/lib/sanitize.ts`; checked `package.json` dependencies and devDependencies | `dompurify` is still browser-only and `sanitizeHtml` is an **identity function on the server** (`:27`); allow-list lacks `mark` and `style` |
| A3-AC1, AC3-AC5 | `grep -rn "dangerouslySetInnerHTML" src`, filtered by `sanitizeHtml` and `ThemeScript`, then per directory | 31 unsanitized sinks remain (docs 8, ideas-refiner 18, chat 4, rest elsewhere) |
| A4-AC1, AC3-AC5, AC7 | grepped `allow-same-origin` and `allow-scripts` in `src/app/m`; grepped `OPTIONS` and `Access-Control` in `src/app/api`; enumerated `src/app/api/m/*/route.ts` | the sandbox still grants `allow-scripts` and `allow-same-origin` together; no CORS/OPTIONS handling on either public writer |
| A5-AC1, AC2, AC5, AC6 | read `src/lib/marketing/outreach.ts:13-70`; grepped the three secret names; read `src/app/api/m/unsubscribe/route.ts` | the HMAC key is still `CRON_SECRET` falling back to `SUPABASE_SERVICE_ROLE_KEY` (`:56`); no dedicated signing secret |
| A6 (8 of 9) | `test -f src/lib/rate-limit.ts`; grepped `rate-limit` in both `/api/m` routes and all 3 webhook routes; grepped `Vercel Firewall`, `rate`, `throttle` in `architecture.md` | no limiter module, no call sites, no documented WAF compensation; `src/lib/marketing/public.ts:68` still carries the "currently unthrottled" comment |
| A7-AC1, AC2 | `ls -la src/lib/supabase/`; read the first 12 lines of `server.ts`; grepped `server-only` across `src/lib` | `server.ts` has no guard. Nine other modules do (`lib/api/apify.ts:10`, `lib/api/buffer.ts:17`, `lib/api/postiz.ts:12`, `lib/auth/secretCompare.ts:1`, `lib/marketing/admin.ts:7`, `content.ts:8`, `outreach.ts:13`, `public.ts:11`, `sourcing.ts:8`) — the convention exists, the factory is the omission |
| A8 (6 of 10) | read all of `next.config.ts` | only 4 headers set; CSP deferred in a comment at `:13-15`; no HSTS |
| B1 (7 modules + AC8, AC9a, AC12b, AC13) | AST walk of all 24 action modules (Appendix 1); grepped `requireActionUser` repo-wide (**0**) and `export async function require` in `src/lib/auth` plus `src/app/*/actions.ts` (**1**, the page gate) | 47 ungated mutating actions; no shared action-gate helper; 9 duplicated `getAdminClient` copies instead of one |
| B2 (8 of 9) | AST taint-walk (Appendix 2); grepped `export function pick` in `src/lib`, `_COLUMNS =`, `_ALLOWED =`, `Record<string, unknown>` | no picker, no allow-list constants; 7 ungated + 14 gated mass-assignment sites |
| B3-AC1, AC3, AC4, AC7 | `cat vercel.json`; `ls -d src/app/api/mkt/cron/*/`; read `process-outreach/route.ts:1-20` | `vercel.json` holds only `$schema`; the route comment asserting a schedule is false |
| B4 (all 14) | two-way `comm` of `process.env.X` names in `src` against `^X=` keys in `.env.example`; per-variable greps; full read of `.env.example` | 7 read-but-undeclared, 4 declared-but-unread, port still 3000 |
| C1-AC1, AC2, AC4, AC5 | read `src/proxy.ts:100-110` (matcher) and `:58-77` (public zone) | the matcher excludes only static assets; `/api/*` and `/m/*` still pay for a `getUser()` |
| C2-AC2, AC5 | read `src/proxy.ts:74-100` end to end | the `profiles` query at `:81-85` runs for **every** signed-in request; the pathname test is at `:87-89`, **after** the query |
| C3 (all 15) | `test -f src/lib/auth/current-user.ts`; grepped `current-user`, `cache(`, `auth.getUser()` across `src/lib/auth` and `src/app/*/actions.ts` | no request-scoped helper; **51** direct `auth.getUser()` calls in gate code |
| C4 (all 6) | read `ConversationsSidebar.tsx` around `:119`; grepped `visibilityState`, `visibilitychange`, `loadingRef`, `inFlight` | a bare `setInterval` with **neither** a visibility gate **nor** an in-flight guard |
| C5 (13 of 14) | grepped `2000`, `5000`, `loadingRef`, `hasFetched`, `POLL_INTERVAL_MS` in each of the four poll files (corrected path for the fourth) | all four still at 2000 ms; no shared constant; `loadingRef` in only 2 of 4; `hasFetched` in **none** |
| D1 (18 of 21), D2 (6 of 8) | `ls supabase/migrations`; counted `CREATE INDEX` (69), `CREATE INDEX IF NOT EXISTS` (0), `DROP INDEX` (0) and sole-column index definitions per FK column in the baseline migration | no `_fk_indexes` migration; `landing_id`, `task_id`, `campaign_id`, `prospect_id` have **zero** sole-column indexes; the 5 duplicate pairs are all present |
| D3 (8 of 12), D4 (all 9) | grepped wildcard selects and `.limit(` in the three pages; read `okrs/actions.ts:44-55` and `internal-projects/actions.ts:58-75` | okrs 3 and internal-projects 4 wildcard selects; no `.limit(` on any of the three pages; both next-order computations fetch the whole table and `Math.max` in JS |
| E1 (12 of 14), E2 (13 of 13) | `ls src/components/`; grepped `@tiptap/` and Recharts imports repo-wide | neither `src/components/editor/` nor `src/components/charts/` exists; 1 direct TipTap importer and **4** direct Recharts importers |
| E3 (all 16), E4 (11 of 12) | `test -f` on all 8 boundary files; grepped `Suspense` across `src` | **zero** boundary files and **zero** `Suspense` in the whole tree, exactly as the spec evidence states |
| E5 (5 of 6), E6 (3 of 5) | grepped `removeConsole` and `images:` in `next.config.ts`; checked `@types/dompurify` in `package.json` (present, `^3.0.5`) and `package-lock.json` (3 hits) | no compiler config; the deprecated stub is still a production dependency |

---

# Roll-up (computed, not hand-calculated)

Per Reproducibility rule 4, `Sum(w)`, every `Story_score`, `Final` and `Adjusted Final` are derived
by executing the script below. `Sum(w)` is computed **inside** the script from the same priority
table printed in the baseline; no denominator is typed in as a literal. `T` is fixed at `0/1` for
every AC by frozen convention 3 (no test runner configured), so `AC_score = 0.6 * I` throughout.

## Script (`rollup.js`)

```javascript
// Move37 pre-hardening roll-up. Input: frozen weight table + per-AC I-check (met,total).
// T-checks: 0/1 for every AC (no test runner configured) => T = 0 everywhere.
const PRIORITY_WEIGHT = { P0: 3, P1: 2, P2: 0 };

// story: [spec, priority, [ [acId, Imet, Itotal], ... ]]
const stories = {
  A1: ["security-p0","P0",[["AC1",0,1],["AC2",0,1],["AC3",0,1],["AC4",0,1],["AC5",0,1],["AC6",0,2],["AC7",0,1]]],
  A2: ["security-p0","P0",[["AC1",0,1],["AC2",0,1],["AC3",0,1],["AC4",0,1],["AC5",1,2],["AC6",0,1],["AC7",0,1]]],
  A3: ["security-p0","P0",[["AC1",0,1],["AC2",2,2],["AC3",0,1],["AC4",0,1],["AC5",0,1],["AC6",1,1],["AC7",1,1]]],
  A4: ["security-p0","P0",[["AC1",0,1],["AC2",1,1],["AC3",0,1],["AC4",0,1],["AC5",0,1],["AC6",1,1],["AC7",0,1]]],
  A5: ["security-p0","P0",[["AC1",0,1],["AC2",0,1],["AC3",1,1],["AC4",1,1],["AC5",0,1],["AC6",0,2]]],
  A6: ["security-p0","P1",[["AC1",0,1],["AC2",1,1],["AC3",0,1],["AC4",0,1],["AC5",0,1],["AC6",0,1],["AC7",0,1],["AC8",0,2]]],
  A7: ["security-p0","P1",[["AC1",0,1],["AC2",0,1],["AC3",1,1],["AC4",1,1]]],
  A8: ["security-p0","P1",[["AC1",0,1],["AC2",0,1],["AC3",0,1],["AC4",0,1],["AC5",1,1],["AC6",0,1],["AC7",3,3],["AC8",0,1]]],
  A9: ["security-p0","P2",[["AC1",0,1],["AC2",0,1],["AC3",0,1]]],

  B1: ["server-action-guards","P0",[["AC1",0,1],["AC2",0,1],["AC3",0,1],["AC4",0,1],["AC5",1,1],["AC6",0,1],["AC7",1,1],["AC8",0,1],["AC9",1,2],["AC10",1,1],["AC11",1,1],["AC12",1,2],["AC13",0,1]]],
  B2: ["server-action-guards","P0",[["AC1",0,1],["AC2",0,1],["AC3",0,1],["AC4",0,1],["AC5",0,1],["AC6",1,1],["AC7",0,1],["AC8",0,1],["AC9",0,1]]],
  B3: ["server-action-guards","P1",[["AC1",0,1],["AC2",1,2],["AC3",0,1],["AC4",0,1],["AC5",1,1],["AC6",1,1],["AC7",0,1]]],
  B4: ["server-action-guards","P1",[["AC1",0,1],["AC2",0,1],["AC3",0,1],["AC4",0,1],["AC5",0,1],["AC6",0,1],["AC7",0,1],["AC8",0,1],["AC9",0,1],["AC10",0,1],["AC11",0,1],["AC12",0,2],["AC13",0,1]]],
  B5: ["server-action-guards","P2",[["AC1",0,1],["AC2",0,1],["AC3",0,1]]],

  C1: ["auth-roundtrips","P0",[["AC1",0,1],["AC2",0,1],["AC3",3,3],["AC4",0,1],["AC5",0,1],["AC6",1,1],["AC7",3,3],["AC8",1,1],["AC9",1,1]]],
  C2: ["auth-roundtrips","P0",[["AC1",1,1],["AC2",0,1],["AC3",1,1],["AC4",1,1],["AC5",0,1],["AC6",1,1],["AC7",1,1],["AC8",3,3],["AC9",1,1],["AC10",1,1]]],
  C3: ["auth-roundtrips","P0",[["AC1",0,1],["AC2",0,2],["AC3",0,1],["AC4",0,2],["AC5",0,2],["AC6",0,2],["AC7",0,1],["AC8",0,1],["AC9",0,1],["AC10",0,1],["AC11",0,1]]],
  C4: ["auth-roundtrips","P1",[["AC1",0,1],["AC2",0,1],["AC3",0,1],["AC4",0,1],["AC5",0,1],["AC6",0,1]]],
  C5: ["auth-roundtrips","P1",[["AC1",0,2],["AC2",0,2],["AC3",0,2],["AC4",0,2],["AC5",0,1],["AC6",0,1],["AC7",0,1],["AC8",0,1],["AC9",1,1],["AC10",0,1]]],
  C6: ["auth-roundtrips","P2",[["AC1",0,1],["AC2",0,1],["AC3",0,1]]],

  D1: ["db-indexes","P0",[["AC1",0,2],["AC2",1,1],["AC3",0,1],["AC4",0,1],["AC5",0,1],["AC6",0,1],["AC7",0,1],["AC8",0,1],["AC9",0,1],["AC10",0,1],["AC11",0,1],["AC12",0,2],["AC13",0,1],["AC14",0,3],["AC15",0,1],["AC16",2,2]]],
  D2: ["db-indexes","P0",[["AC1",0,1],["AC2",0,1],["AC3",0,1],["AC4",0,1],["AC5",1,1],["AC6",1,1],["AC7",0,1],["AC8",0,1]]],
  D3: ["db-indexes","P1",[["AC1",0,1],["AC2",0,1],["AC3",0,1],["AC4",0,1],["AC5",0,1],["AC6",0,1],["AC7",1,1],["AC8",1,1],["AC9",0,1],["AC10",0,1],["AC11",2,2]]],
  D4: ["db-indexes","P1",[["AC1",0,1],["AC2",0,1],["AC3",0,1],["AC4",0,1],["AC5",0,1],["AC6",0,1],["AC7",0,1],["AC8",0,1],["AC9",0,1]]],
  D5: ["db-indexes","P2",[["AC1",0,1],["AC2",0,1],["AC3",0,1],["AC4",0,1],["AC5",0,1],["AC6",0,1]]],

  E1: ["bundle-and-boundaries","P0",[["AC1",0,1],["AC2",0,1],["AC3",0,1],["AC4",0,2],["AC5",0,1],["AC6",1,1],["AC7",0,1],["AC8",0,1],["AC9",0,1],["AC10",0,1],["AC11",1,2],["AC12",0,1]]],
  E2: ["bundle-and-boundaries","P0",[["AC1",0,1],["AC2",0,2],["AC3",0,1],["AC4",0,1],["AC5",0,1],["AC6",0,1],["AC7",0,1],["AC8",0,1],["AC9",0,2],["AC10",0,1],["AC11",0,1]]],
  E3: ["bundle-and-boundaries","P0",[["AC1",0,1],["AC2",0,2],["AC3",0,1],["AC4",0,3],["AC5",0,1],["AC6",0,1],["AC7",0,1],["AC8",0,1],["AC9",0,2],["AC10",0,1],["AC11",0,1],["AC12",0,1]]],
  E4: ["bundle-and-boundaries","P1",[["AC1",0,1],["AC2",0,1],["AC3",0,1],["AC4",0,1],["AC5",0,1],["AC6",0,1],["AC7",0,1],["AC8",0,1],["AC9",0,3],["AC10",1,1]]],
  E5: ["bundle-and-boundaries","P1",[["AC1",0,1],["AC2",0,1],["AC3",0,1],["AC4",0,1],["AC5",0,1],["AC6",1,1]]],
  E6: ["bundle-and-boundaries","P1",[["AC1",0,1],["AC2",0,1],["AC3",1,1],["AC4",1,1],["AC5",0,1]]],
  E7: ["bundle-and-boundaries","P2",[["AC1",0,1],["AC2",0,1],["AC3",0,1],["AC4",0,1]]],
};

const T_MET = 0, T_TOTAL = 1;   // convention: every AC has 1 T-check, always UNMET
let sumW = 0, sumWS = 0;
let acN = 0, iMetAll = 0, iTotAll = 0;
const rows = [];
for (const [sid, [spec, pri, acs]] of Object.entries(stories)) {
  const w = PRIORITY_WEIGHT[pri];
  let acScores = [], sm = 0, st = 0;
  for (const [ac, m, t] of acs) {
    const I = m / t, T = T_MET / T_TOTAL;
    acScores.push(0.6 * I + 0.4 * T);
    sm += m; st += t; acN++;
  }
  const storyScore = acScores.reduce((a, b) => a + b, 0) / acScores.length;
  rows.push({ sid, spec, pri, w, acs: acs.length, iMet: sm, iTot: st,
              I: sm / st, storyScore });
  if (w > 0) { iMetAll += sm; iTotAll += st; }
  sumW += w; sumWS += w * storyScore;
}
const Final = sumWS / sumW;
const band = f => f >= 0.90 ? "Spec-complete" : f >= 0.75 ? "Strong (minor gaps)"
             : f >= 0.60 ? "Partial (meaningful gaps)" : f >= 0.40 ? "Weak" : "Inadequate";

console.log("| story | spec | pri | w | ACs | I met/total | I | Story_score |");
console.log("|---|---|---|---|---|---|---|---|");
for (const r of rows) console.log(`| ${r.sid} | ${r.spec} | ${r.pri} | ${r.w} | ${r.acs} | ${r.iMet}/${r.iTot} | ${r.I.toFixed(4)} | ${r.storyScore.toFixed(2)} |`);
console.log("");
console.log("stories total        :", rows.length, "| scored (w>0):", rows.filter(r=>r.w>0).length);
console.log("ACs total            :", acN, "| scored:", rows.filter(r=>r.w>0).reduce((a,r)=>a+r.acs,0));
console.log("I-checks (scored)    :", iMetAll, "MET /", iTotAll, "=", (iMetAll/iTotAll).toFixed(4));
console.log("T-checks (scored)    : 0 MET /", rows.filter(r=>r.w>0).reduce((a,r)=>a+r.acs,0), "  (no test runner configured)");
console.log("Sum(w) [derived]     :", sumW);
console.log("Sum(w * Story_score) :", sumWS.toFixed(6));
console.log("FINAL                :", Final.toFixed(2), "->", band(Number(Final.toFixed(2))));
console.log("Adjusted Final (G red x0.5):", (Final*0.5).toFixed(2), "->", band(Number((Final*0.5).toFixed(2))));
console.log("");
console.log("Per-spec weighted sub-scores:");
const specs = [...new Set(rows.map(r=>r.spec))];
for (const s of specs) {
  const rs = rows.filter(r=>r.spec===s);
  const w = rs.reduce((a,r)=>a+r.w,0), ws = rs.reduce((a,r)=>a+r.w*r.storyScore,0);
  console.log("  " + s.padEnd(24) + " Sum(w)=" + String(w).padStart(3) + "  score=" + (ws/w).toFixed(2));
}
```

## Pasted output

```
| story | spec | pri | w | ACs | I met/total | I | Story_score |
|---|---|---|---|---|---|---|---|
| A1 | security-p0 | P0 | 3 | 7 | 0/8 | 0.0000 | 0.00 |
| A2 | security-p0 | P0 | 3 | 7 | 1/8 | 0.1250 | 0.04 |
| A3 | security-p0 | P0 | 3 | 7 | 4/8 | 0.5000 | 0.26 |
| A4 | security-p0 | P0 | 3 | 7 | 2/7 | 0.2857 | 0.17 |
| A5 | security-p0 | P0 | 3 | 6 | 2/7 | 0.2857 | 0.20 |
| A6 | security-p0 | P1 | 2 | 8 | 1/9 | 0.1111 | 0.07 |
| A7 | security-p0 | P1 | 2 | 4 | 2/4 | 0.5000 | 0.30 |
| A8 | security-p0 | P1 | 2 | 8 | 4/10 | 0.4000 | 0.15 |
| A9 | security-p0 | P2 | 0 | 3 | 0/3 | 0.0000 | 0.00 |
| B1 | server-action-guards | P0 | 3 | 13 | 6/15 | 0.4000 | 0.23 |
| B2 | server-action-guards | P0 | 3 | 9 | 1/9 | 0.1111 | 0.07 |
| B3 | server-action-guards | P1 | 2 | 7 | 3/8 | 0.3750 | 0.21 |
| B4 | server-action-guards | P1 | 2 | 13 | 0/14 | 0.0000 | 0.00 |
| B5 | server-action-guards | P2 | 0 | 3 | 0/3 | 0.0000 | 0.00 |
| C1 | auth-roundtrips | P0 | 3 | 9 | 9/13 | 0.6923 | 0.33 |
| C2 | auth-roundtrips | P0 | 3 | 10 | 10/12 | 0.8333 | 0.48 |
| C3 | auth-roundtrips | P0 | 3 | 11 | 0/15 | 0.0000 | 0.00 |
| C4 | auth-roundtrips | P1 | 2 | 6 | 0/6 | 0.0000 | 0.00 |
| C5 | auth-roundtrips | P1 | 2 | 10 | 1/14 | 0.0714 | 0.06 |
| C6 | auth-roundtrips | P2 | 0 | 3 | 0/3 | 0.0000 | 0.00 |
| D1 | db-indexes | P0 | 3 | 16 | 3/21 | 0.1429 | 0.07 |
| D2 | db-indexes | P0 | 3 | 8 | 2/8 | 0.2500 | 0.15 |
| D3 | db-indexes | P1 | 2 | 11 | 4/12 | 0.3333 | 0.16 |
| D4 | db-indexes | P1 | 2 | 9 | 0/9 | 0.0000 | 0.00 |
| D5 | db-indexes | P2 | 0 | 6 | 0/6 | 0.0000 | 0.00 |
| E1 | bundle-and-boundaries | P0 | 3 | 12 | 2/14 | 0.1429 | 0.07 |
| E2 | bundle-and-boundaries | P0 | 3 | 11 | 0/13 | 0.0000 | 0.00 |
| E3 | bundle-and-boundaries | P0 | 3 | 12 | 0/16 | 0.0000 | 0.00 |
| E4 | bundle-and-boundaries | P1 | 2 | 10 | 1/12 | 0.0833 | 0.06 |
| E5 | bundle-and-boundaries | P1 | 2 | 6 | 1/6 | 0.1667 | 0.10 |
| E6 | bundle-and-boundaries | P1 | 2 | 5 | 2/5 | 0.4000 | 0.24 |
| E7 | bundle-and-boundaries | P2 | 0 | 4 | 0/4 | 0.0000 | 0.00 |

stories total        : 32 | scored (w>0): 27
ACs total            : 261 | scored: 242
I-checks (scored)    : 61 MET / 283 = 0.2155
T-checks (scored)    : 0 MET / 242   (no test runner configured)
Sum(w) [derived]     : 69
Sum(w * Story_score) : 8.972438
FINAL                : 0.13 -> Inadequate
Adjusted Final (G red x0.5): 0.07 -> Inadequate

Per-spec weighted sub-scores:
  security-p0              Sum(w)= 21  score=0.15
  server-action-guards     Sum(w)= 10  score=0.13
  auth-roundtrips          Sum(w)= 13  score=0.20
  db-indexes               Sum(w)= 10  score=0.10
  bundle-and-boundaries    Sum(w)= 15  score=0.07
```

## Headline

| metric | value |
|---|---|
| I-checks MET (scored stories) | **61 / 283 = 0.2155** |
| T-checks MET (scored stories) | **0 / 242** — no test runner configured |
| `Sum(w)` (derived) | **69** |
| **Final** | **0.13** |
| **Band** | **Inadequate** |
| Adjusted Final (if a gate were red) | 0.07 — **not applied**, see Engineering gates |

Per-spec weighted sub-scores: `auth-roundtrips` **0.20** · `security-p0` **0.15** ·
`server-action-guards` **0.13** · `db-indexes` **0.10** · `bundle-and-boundaries` **0.07**.

The spread is the informative part. `auth-roundtrips` scores highest not because any of its work
was done, but because its two P0 middleware stories assert *behaviour that already exists*
(the referrer clamp, the public zone, the single `profiles` query, the signed-out redirect) —
so C1 (0.33) and C2 (0.48) are effectively **regression tripwires**, not build targets. If a
post-hardening run shows C1 or C2 **falling**, the matcher-narrowing or pathname-guard work
broke auth semantics, which the spec forbids. `bundle-and-boundaries` scores lowest because
nothing in it exists at base and five of its ACs are structurally unmeasurable (gap 9).

# Engineering gates `G`

The three gates were **not re-run** for this report, and the reason is methodological, not a
probe failure: the working tree carries 178 in-flight modifications from four sibling agents, so
any command run now measures a **different state** than `e96b250`. Running `npm run build` would
have produced a number that does not belong to the graded commit — and running it while four
agents write to the same tree risks corrupting their work.

The gates were instead **inherited verbatim** from `.specs/evaluations/_baseline-2026-09-15.md`,
which records an actual execution of all three commands **against this exact commit**
(`git rev-parse --short HEAD` = `e96b250`, recorded in that file):

| gate | command | result at `e96b250` | source |
|---|---|---|---|
| build | `npm run build` (`next build`, Next 16.1.6, Turbopack) | **PASS** — exit 0, 41 routes, ~52 s | `_baseline-2026-09-15.md` |
| typecheck | `npx tsc --noEmit` | **PASS** — exit 0, 0 errors | `_baseline-2026-09-15.md` |
| lint | `npm run lint` (ESLint 9 flat config) | **FAIL** — exit 1, 82 problems (46 errors, 36 warnings) | `_baseline-2026-09-15.md` |
| unit | — | **not-run** — no test runner configured (no `test` script in `package.json`; no vitest/jest/playwright dependency) | `package.json` |
| e2e | — | **not-run** — same | `package.json` |

**Pinned build gate:** `npm run build` exiting `0`. That command, and nothing else, decides the
`build` verdict in every run of this baseline.

**`Adjusted Final` is NOT applied.** The lint failure is a **pre-existing, unrelated** condition
in code none of these five specs touches: the dominant rule is
`react-hooks/set-state-in-effect` (React Compiler's stricter effect-body check) spread across
chat panes, `SidebarContext`, multi-selects and ideas-refiner components, plus one
`@typescript-eslint/no-require-imports` on `scripts/unwrap-types.js`. Per the skill's
documented-non-graded-NOTE rule, this is recorded as a **known note**, not a `✗` against this
change — and the pinned build gate is green. A red lint gate is **never** fixed by the grader:
`_ac-baseline.md` carries no AC requiring lint to be clean, and no I-check anywhere in this
report was awarded or withheld on lint.

> **Warning for the post-hardening run:** lint being red at base means a post run cannot use
> "lint is red" as evidence of regression. Compare the **problem count** (82) and the **rule
> mix**, not the exit code. One AC does interact with lint: `src/lib/sanitize.ts:26` carries an
> `eslint-disable-next-line @typescript-eslint/no-require-imports`, which the
> `isomorphic-dompurify` swap (A2-AC2) should remove — expect 82 to move.

# E / S / R / D dimensions

These are reported beside `Final` and never folded into it.

**Elicitation `E` — n/a for this run.** `E` grades an SDD-derived `spec.md`/`tasks.md` against a
separate ground-truth PRD. Here the five `spec.md` files **are** the ground truth (there is no
upstream PRD other than the approved plan `1-please-update-all-wondrous-pixel.md`, which the
specs cite as their own source), and no `tasks.md` exists. Grading the specs against themselves
would be circular. Recorded as `n/a — the spec is the PRD`. The substantive elicitation findings
are instead reported as **Baseline gaps** (13 items), which is where they are actionable.

**Scope Adherence `S` — `pass` (trivially).** Traceability was checked against all five
out-of-scope lists. At `e96b250` **no behaviour from any of the five specs was built**, so there
is nothing to trace and nothing can have drifted.

- *PRD-boundary:* nothing on any out-of-scope list has shipped. Specifically verified absent:
  an enforcing `Content-Security-Policy` header (security-p0 out-of-scope) — `next.config.ts`
  sets none; any distributed rate-limit store (`@upstash/ratelimit`, Redis) — absent from
  `package.json`; any RLS policy change or `SECURITY DEFINER` `search_path` edit — no new
  migration exists at all; `CREATE INDEX CONCURRENTLY` — no new migration; any `Suspense`
  in-page streaming — `grep -rn "Suspense" src` returns 0; a JWT custom claim / Supabase Auth
  Hook — absent; `next/image` `remotePatterns` — `images:` count 0 in `next.config.ts`, which is
  the *correct* outcome given 0 remote image sources.
- *Rogue build:* none — nothing was built.
- *Plan drift:* none — no plan artifact sanctioned anything that is half-built.

`S = pass` here is **not** a quality signal; it is the arithmetic consequence of a zero baseline.
`S` becomes meaningful only in the post-hardening run.

**Robustness `R` = 0.** No tests exist to inventory (no test runner). Defensive quality that
*does* exist at base but earns no `Final` credit, recorded so a post run can confirm it was not
lost: `timingSafeEqual`-based `secretEquals` (`src/lib/auth/secretCompare.ts`); fail-closed
`CRON_SECRET` bearer checks on all 3 cron routes; fail-closed HMAC signing
(`src/lib/marketing/outreach.ts:57`); `import "server-only"` on 9 modules; `isRequestActive`
stale-write guards (23 call sites in `ideas-refiner/actions.ts`); RLS on 85/85 live tables and
`search_path` pinned on all 32 `SECURITY DEFINER` functions (both asserted by the specs as
already-compliant and explicitly out of scope).

**Test Distribution `D` — empty.**

| tier | count | % of suite |
|---|---|---|
| Necessary (P0 primary path) | 0 | — |
| Secondary (important) | 0 | — |
| Nice-to-have | 0 | — |
| **total feature tests** | **0** | — |

Shape read: **no suite at all.** Every P0 primary path across all 15 P0 stories is unverified by
any automated test, and will remain so after the hardening unless a runner is introduced — which
is not in any of the five specs. This is the structural ceiling on the score: with `T = 0`
everywhere, the **maximum achievable `Final` for these five specs is 0.60**, reached only when
every single I-check is MET. A post-hardening run scoring 0.60 is therefore a *perfect* result
under this baseline, not a 60% one. Record that prominently when the post run is read.

# Scope findings

**Behaviour built that no AC sanctioned:** none — nothing from these specs was built at `e96b250`.

**Anything on an out-of-scope list that shipped anyway:** none. See the `S` section for the
per-item verification.

**Two observations that are neither, recorded because they will surface during implementation:**

1. **The nine `getAdminClient` copies.** `src/app/marketing/**` contains **9** near-identical
   private copies of the same 15-line auth+role gate (e.g.
   `marketing/[ideaId]/content/actions.ts:38-52`, `marketing/actions.ts:16-31`,
   `marketing/[ideaId]/traffic/seo-actions.ts:9-23`). They are *correct* — which is why all 58
   marketing actions score GATED — but they are exactly the "N copies of the same five lines"
   that B1-AC9 forbids. The marketing module is explicitly **out of scope** for
   `server-action-guards`, so consolidating them is **not** sanctioned by any AC. Flagged, not
   scored; do not let a gate-consolidation pass wander into `src/app/marketing/`.
2. **`ideas-refiner/actions.ts:78 updateIdea`** is gated but takes a bare
   `Record<string, unknown>` into `.update(data)` on the `idea` table. B2-AC1's grep
   (`.update(data)`) **will** match it, so an implementer following the letter of AC1 will fix it
   — correctly — even though the S10 story text frames the problem around the ungated `save*`
   family. No scope conflict; noted so it is not mistaken for scope creep in the post run.

# Baseline gaps

All 13 are enumerated with recommended sharpened wording in the "Baseline gaps recorded at
freeze" section of `.specs/evaluations/_ac-baseline.md`. The ones that **cannot be made binary**
as written, and therefore matter most:

| # | AC | why it is not binary / not satisfiable | recommended wording |
|---|---|---|---|
| 1 | A7-AC2 | compares against `src/lib/supabase/public.ts`, which **does not exist** at this commit | require each file's first line to equal the literal `import "server-only";`, naming `src/lib/marketing/public.ts` |
| 4 | B4-AC13 | the negative lookahead excludes `your_` but the file uses `your-`, and `BREVO_FROM_NAME=Move37` is a legitimate literal — the AC fails on a *correctly* sanitised file | allow `your[-_]` and whitelist known-safe literals such as `Move37` |
| 9 | E1-AC7/AC8/AC9, E2-AC8/AC9 | "first-load JS strictly lower than baseline" has **no pre-number**: Next 16 + Turbopack emits no First Load JS or shared-chunk column (stated in `_baseline-2026-09-15.md`). These 5 I-checks can never be MET with the current toolchain. | replace with a chunk-membership assertion against the `.next` build manifest: TipTap and Recharts must not appear in the shared/framework chunk |
| 3 | B1-AC9 | its grep matches the *page* gate `requirePageAccess`, so it reads >= 1 even with zero action gates | name `requireActionUser` explicitly and require each of the seven modules to import it |
| 8 | D2-AC3 | assumes the redundant twin of every duplicate pair is the `idx_`-prefixed one; at least one pair (`internal_key_result_goal_idx` / `internal_key_result_internal_goal_id_idx`, baseline migration `:3474`/`:3478`) has **neither** name prefixed `idx_` | require each drop to carry a one-line comment naming its surviving sibling, instead of constraining the name prefix |
| 11 | E1-AC6 | its grep already returns 28 at base, because the non-lazy `RichTextEditor` shares the name | grep only for `RichTextEditor.lazy` |
| 12 | A2-AC7 | a no-op sanitizer trivially preserves the `<h2>` count, so the AC does not discriminate | add "and the same input with an injected script tag loses the script" |
| 13 | A6-AC2, B1-AC11, B2-AC6, C5-AC9, D1-AC2, D2-AC5, D2-AC6 | delta / no-regression assertions that are **literally true at any clean base commit**, so they award 7 free I-checks in the pre run and cannot regress | restate each against an absolute state rather than against a `git diff` |

Additionally, four **spec evidence errors** were found (recorded as gaps 5, 6, 7, 10 in the
baseline): the `TaskRequestsKanbanWrapper` path; the claim that all four tab polls already hold
`loadingRef` and `hasFetched` (they do not — `loadingRef` in 2 of 4, `hasFetched` in 0 of 4);
the claim that `users/page.tsx` issues a wildcard select (it does not); and the TipTap "16 files"
figure plus two wrong Recharts paths and one unlisted fourth Recharts consumer. None of these
changes any AC's binary form, so all were kept as written with the corrected target recorded.

# Assumptions

1. **Judge is not the author.** This grader wrote no code under evaluation and made no edit to
   `src/`, `supabase/`, `docs/`, any `spec.md`, or any config. Only two files were written:
   `.specs/evaluations/_ac-baseline.md` and this report. Self-preference bias therefore does not
   apply; borderline checks were nonetheless resolved toward UNMET (see the k=3 table).
2. **No `ASSUMED` priorities.** All 32 stories carry an explicit `P0`/`P1`/`P2` label in their
   spec headings, so no weight was inferred anywhere.
3. **`ASSUMED` values carried from the specs**, tagged identically in the baseline so a later
   decision cannot silently move the score: poll interval 5000 ms (C5); rate-limit thresholds
   30/60 s and 120/60 s (A6); the three cron schedules (B3); `.limit()` = 200 rows (D3);
   `BREVO_WEBHOOK_SECRET` query-token transport (A1); CSP `style-src 'self' 'unsafe-inline'`
   (A8); one chart wrapper per family (E2). None of these changes a verdict in this run: every
   AC that depends on one is UNMET on the prior question of whether the artifact exists at all.
4. **Gates inherited, not re-run.** Justified in the Engineering gates section. If a fresh
   execution against `e96b250` is required, it must be done on a clean worktree
   (`git worktree add`) once the sibling agents have committed — never by disturbing the shared tree.
5. **Static evidence substituted for runtime probes.** Roughly 40 ACs are phrased as `curl` or
   DB round-trips against a running dev server or local Supabase. No server was started and
   `npm run db:reset` was not run (a mutating command, outside a read-only grader's bounds). In
   every such case the verdict was decided by reading the code path end to end, and the
   substitution is recorded in that row's evidence cell. This never turned an UNMET into a MET:
   the seven statically-MET checks of this kind (A4-AC6, A8-AC5, C1-AC6, C1-AC7, C2-AC4, C2-AC6,
   C2-AC9) are all *absence* or *single-path* propositions provable from the source alone.
6. **AC text is referenced, not reproduced verbatim, in the baseline tables** — each AC carries
   its `spec.md:LINE` plus its normative predicate. The spec files remain canonical and unedited.
7. **`e96b250` is treated as both base and head.** There is no diff to scope, because the specs
   assert the absence of work. Consequence: every `[VACUOUS-AT-BASE]` delta-AC is literally true
   and awards a free I-check. Seven such checks are MET; they are **11 %** of the 61 MET
   I-checks. Excluding them gives a "true" pre-hardening `I` of **54/283 = 0.19** and a `Final`
   near **0.12**. The reported **0.13** is the literal, reproducible number and is what the post
   run must be compared against.
8. **Story E2 was scored against corrected paths** for `BlendedIntelligence` and
   `DashboardCharts`. Had the spec's literal paths been used both ACs would still be UNMET (no
   file exists there), so the correction does not move the score.
9. **I-check counts are frozen, not re-derived.** The 302 total (283 scored) comes from
   `_ac-baseline.md` and was verified by the roll-up script, not by hand. My first hand-summed
   total was wrong (320) and was corrected in the baseline **before** any scoring — recorded here
   because a hand-summed denominator is precisely the failure mode the skill warns about.

# Fix list

**Weighted gain** = the exact `Final` increase from taking that story's `I` to 1.00, computed by
the same script (`w * (0.6 - Story_score) / 69`). The 21 gains sum to **0.4700**, i.e. exactly
`0.60 - 0.13` — the arithmetic check that the list is complete and non-overlapping.

> **Read the order twice.** The table is ranked by *score* impact, which is **not** risk order.
> Items 3, 5, 9, 11 and 12 (sanitizer, webhook auth, mass assignment, iframe sandbox, signing
> secret) are where the base commit is **exploitable today** by an unauthenticated caller. Do
> those first; the score will follow.

| # | item | story | agent | gain |
|---|---|---|---|---|
| 1 | Write `supabase/migrations/2026091500xxxx_fk_indexes.sql`: `CREATE INDEX IF NOT EXISTS` for every FK column the AC6 audit query returns (17 `idea_id`, 7 `internal_project_id`, 3 `landing_id`, 3 `task_id`, `campaign_id`, `prospect_id`, `created_by` on every Tier-2 table), plus 5 `DROP INDEX IF EXISTS`. Resolve each duplicate pair to **names** first — gap 8, one pair has no `idx_` twin. Naming `idx_<table>_<column>`. Append-only, one file. | D1, D2 | `move37-migration-author` | **+0.042** |
| 2 | Add the 8 App Router boundary files: `src/app/loading.tsx`, `error.tsx`, `global-error.tsx`, `not-found.tsx`, plus `loading.tsx` under `ideas-refiner`, `chat`, `marketing/[ideaId]`, `dashboard`. Tokens only, no raw hex, no inline svg (import from `@/components/ui/icons`), `PageShell` for the segment skeletons, **no auth call** in any of them, `global-error` carries its own html/body. | E3, E4 | `move37-ui-builder` | **+0.042** |
| 3 | Swap `dompurify` for `isomorphic-dompurify` in `src/lib/sanitize.ts`, delete the `typeof window` no-op at `:27`, extend the allow-list with `mark` and a constrained `style` attribute, then route **all 31** unsanitized `dangerouslySetInnerHTML` sites through `sanitizeHtml` (docs 8, ideas-refiner 18, chat 4, remainder). `ThemeScript.tsx:39` is the one sanctioned exception and already qualifies. Drop the now-dead eslint-disable at `:26`. | A2, A3 | `move37-security-reviewer` | **+0.039** |
| 4 | Bound the three page queries (explicit columns plus `.limit(`) and push `max(order)` into Postgres at `okrs/actions.ts:46` and `internal-projects/actions.ts:65`. `users/page.tsx` already names its columns and needs only `.limit(`. | D3, D4 | `move37-server-action-author` | **+0.030** |
| 5 | Authenticate `/api/webhooks/brevo` with `BREVO_WEBHOOK_SECRET` via `secretEquals`, failing closed **before** the first Supabase call at `:22`; add the var to `.env.example`. Confirm the `[ASSUMED]` query-token transport against the Brevo plan. | A1 | `move37-security-reviewer` | **+0.026** |
| 6 | Create `src/lib/auth/current-user.ts` (`import "server-only";` plus React `cache()`), have `page-gate.ts` and all 6 module gates consume it, and eliminate the **51** direct `auth.getUser()` calls from gate code. **Land before item 16**, or the 47 new gates each add a round-trip. | C3 | `move37-server-action-author` | **+0.026** |
| 7 | Lazy-load Recharts behind `src/components/charts/*.lazy.tsx` (`ssr: false`, sized token placeholder) for **4** consumers — including the unlisted `src/app/okrs/_components/KeyResultsTracker.tsx`. E2-AC8/AC9 remain unmeasurable (gap 9). | E2 | `move37-ui-builder` | **+0.026** |
| 8 | Add `compiler.removeConsole` with `exclude: ["error"]` to `next.config.ts`, and drop `@types/dompurify` from `package.json` and `package-lock.json`. Sequence the E6 half **after** item 3, since E6-AC5 needs `tsc` green with `isomorphic-dompurify` in place. | E5, E6 | `move37-ui-builder` | **+0.025** |
| 9 | Create `src/lib/pick.ts` and apply a named module-level column allow-list to **all 7** ungated mass-assignment sites in Appendix 2 — not just the three `.update(data)` ones. Sites 4-7 launder the payload through `Object.entries` or an intermediate object and will **pass B2-AC1 while remaining exploitable**. `created_by`, `idea_id`, `project_id`, `id` must be absent from every allow-list. Fix `updateIdea` at `:78` in the same pass. | B2 | `move37-server-action-author` | **+0.023** |
| 10 | Lazy-load TipTap behind `src/components/editor/RichTextEditor.lazy.tsx`; the only direct importer is `src/app/ideas-refiner/_components/RichTextEditor.tsx`. AC7-AC9 remain unmeasurable (gap 9). | E1 | `move37-ui-builder` | **+0.023** |
| 11 | Remove `allow-same-origin` from `src/app/m/[slug]/page.tsx:94-98` (keep `allow-scripts`); add explicit POST plus OPTIONS CORS for a null origin on `/api/m/event` and `/api/m/[slug]/capture`, methods POST/OPTIONS only, **no** credentialed wildcard. Confirm no landing template uses `localStorage` first (spec Open question 5). | A4 | `move37-security-reviewer` | **+0.019** |
| 12 | Introduce `UNSUBSCRIBE_SIGNING_SECRET` in `src/lib/marketing/outreach.ts` (fallback `CRON_SECRET` only), remove both `SUPABASE_SERVICE_ROLE_KEY` references at `:56-57`, keep the fail-closed throw at `:57`, add the var to `.env.example`. | A5 | `move37-security-reviewer` | **+0.017** |
| 13 | Reconcile `.env.example`: add the 7 read-but-undeclared vars (including `VERCEL_URL`), delete the 4 stale ones, move `NEXT_PUBLIC_APP_URL` to port 4000. B4-AC13 is unsatisfiable as written — gap 4. | B4 | `move37-security-reviewer` | **+0.017** |
| 14 | Add a visibility gate plus listener cleanup to `ConversationsSidebar.tsx:119`, and give it the in-flight guard it currently lacks entirely (the spec calls it "existing"; it is not — gap 6). | C4 | `move37-ui-builder` | **+0.017** |
| 15 | Narrow the `src/proxy.ts` matcher to exclude `/api` and `/m` (keep the 3 static tokens) and move the pathname test **before** the `profiles` query at `:81`. **Regression risk is highest here** — C1 (0.33) and C2 (0.48) are the tripwires; any drop means auth semantics changed, which the spec forbids. | C1, C2 | `move37-security-reviewer` | **+0.017** |
| 16 | Create `src/lib/auth/require-action-user.ts` (one shared gate returning `{ supabase, userId, role }` or `{ error }`) and gate the **47 ungated writers** in Appendix 1 — docs 15, ideas-refiner 17, projects 8, sops 5, invoices 2. `internal-projects` and `settings` already pass. Do **not** touch `src/app/marketing/**` (out of scope; Scope finding 1). Never throw across the boundary. | B1 | `move37-server-action-author` | **+0.016** |
| 17 | Move all four tab polls to a shared `POLL_INTERVAL_MS = 5000`; **add** `loadingRef` to `InternalProjectTasksTab.tsx` and `tabs/TaskRequestsKanbanWrapper.tsx`, and `hasFetched` to all four — the spec calls these "existing" but they are not (gap 6). Confirm the `[ASSUMED]` 5000 ms first. | C5 | `move37-ui-builder` | **+0.016** |
| 18 | Add `src/lib/rate-limit.ts` (in-memory sliding window, no new dependency), apply it to both `/api/m` writers and all 3 webhook routes, return `429` with `Retry-After`, and document the Vercel Firewall compensation plus the per-instance caveat in `architecture.md`. Confirm the `[ASSUMED]` thresholds first. | A6 | `move37-security-reviewer` | **+0.015** |
| 19 | Add `Strict-Transport-Security` (`max-age=31536000; includeSubDomains`, no `preload`) and `Content-Security-Policy-Report-Only` to `next.config.ts`, **preserving** the 4 existing headers at `:21-24`. Do not set the enforcing header. | A8 | `move37-security-reviewer` | **+0.013** |
| 20 | Add a `crons` array to `vercel.json` with one 5-field-schedule entry per `/api/mkt/cron/*` route, and make the `process-outreach/route.ts:3` comment true. Confirm the `[ASSUMED]` schedules and the Vercel plan cron-frequency cap first. | B3 | `move37-migration-author` | **+0.011** |
| 21 | Add `import "server-only";` as line 1 of `src/lib/supabase/server.ts`, matching the 9 modules that already carry it. One line; also satisfies A7-AC2 under the corrected path. | A7 | `move37-security-reviewer` | **+0.009** |

**Sequencing constraints** — violating these makes ACs unachievable or the score non-comparable:

- item **6 before item 16** (cached identity before 47 new gates, or each gate adds a round-trip).
- item **3 before item 8**'s E6 half (E6-AC5 needs `tsc` green with `isomorphic-dompurify`).
- item **1**'s duplicate-pair *name* resolution before writing its `DROP` statements.
- gap 9's five ACs (E1-AC7/8/9, E2-AC8/9) need the **measurement method changed** in the baseline
  before any run can score them; until then they are a permanent `-5` I-checks on spec E.

**Ceiling reminder:** with `T = 0` for all 242 scored ACs, the maximum `Final` achievable under
this frozen baseline is **0.60**. A post-hardening `Final` of 0.60 is a *perfect* result, not a
partial one. Introducing a test runner is the only way to raise that ceiling, and it is not in
any of the five specs.

---

*Report by `move37-spec-conformance-reviewer`. No file under evaluation was read from the working
tree or modified. Files written by this run: `.specs/evaluations/_ac-baseline.md` and
`.specs/evaluations/2026-09-15-pre-hardening.md`.*
