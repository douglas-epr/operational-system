# Changelog

All notable changes to this project are documented here.
Format: `[YYYY-MM-DD] — Description`

## [2026-06-22] — Feat: Dashboard "Team workload" chart + first Supabase view

- **New Supabase view** `public.dashboard_member_project_hours` (migration `20260622195655_…`): unions both work-feedback tables into a per-`(member, month, project)` hours rollup, joining in member + project/internal-project names. Created `WITH (security_invoker = true)` so the underlying tables' RLS applies to the querying user (views bypass RLS by default in PG15+); `GRANT SELECT … TO authenticated` only (never anon). Verified clean by `supabase db advisors` (no `security_definer_view` flag) and a live PostgREST smoke test. This is the project's first view — establishes the `security_invoker` pattern for future dashboard views.
- **`dashboard/_lib/queries.ts`**: added `MemberProjectHoursRow` type, `loadMemberProjectHours()` loader (last 6 months, coerces numeric → number, builds `YYYY-MM` buckets), and wired it into `DashboardMetrics` + `loadAllDashboardMetrics`.
- **`dashboard/_components/TeamWorkloadChart.tsx`** (new client component): a month selector + a per-team-member breakdown. Each member shows a compact 100%-stacked bar **and an explicit per-project list below it** (project name · hours · **% of that member's logged hours**), so the split is readable without hovering. Internal projects tagged `int`; stable per-project colors across members/months; members who logged feedback but no `total_time` show a "no hours recorded" note instead of a misleading sliver. Month-summary strip shows members / projects / total hours.
- **`dashboard/_components/DashboardOverview.tsx`**: rendered the new chart as a full-width Row 5.
- **`src/lib/supabase/types.ts`**: registered the view under `public.Views` to keep generated types in sync.

## [2026-06-22] — Fix: debate 504 timeout — reduce round cap from 10 to 6

- **Confirmed via live Playwright test**: clicking Regenerate on Risk & Validation ran ~330 s then returned **HTTP 504** (Vercel Gateway Timeout). The `maxDuration = 800` page export was silently clamped to the project's 300 s ceiling (Fluid Compute not enabled), and the debate was hitting the 10-round cap on **both** gates without converging = up to 40 sequential AI calls × ~8 s = ~330 s.
- **Fix**: Lowered `MAX_ROUNDS_PER_GATE` from 10 → 6, and lowered the minimum-rounds-before-convergence from 5 → 3 (in both the Skeptic and Advocate fallback prompts + the round-depth escalation mandate, compressed from 5 tiers/10 rounds to 4 tiers/6 rounds). Worst case is now 24 debate calls (~190 s); typical convergence at 3–4 rounds (~100 s) — comfortably under the 300 s ceiling with margin.
- **Recommended follow-up**: Enable **Fluid Compute** on the Vercel project to allow `maxDuration` up to 800 s, which would permit restoring the deeper 10-round debate if desired.

## [2026-06-22] — Fix: Risk & Validation / Report debate pipeline timeout

- **Root cause identified**: Ideas with a large description (e.g. "Lola" stores a full 50 KB Build Brief HTML document in the `description` field). After HTML-stripping, this becomes ~15,000 tokens included in every single debate round prompt. With 21+ minimum API calls at 15–30 s each, the Vercel function consistently exceeded the 300 s default timeout and was silently killed — leaving `current_blocks_updating` stuck and no data written.
- **Fix 1 — `actions.ts`**: Cap `idea.description` at 2,000 characters before building the `sourceBlock` in both `generateRiskAndValidation` and `generateReport`. The structured evidence fields (core_problem, ICPs, benchmarking, etc.) carry the debate substance; the full spec doc is not needed per round.
- **Fix 2 — `page.tsx`**: Export `maxDuration = 800` from the ideas-refiner page so Vercel allocates the maximum function ceiling the plan allows for the debate pipeline.
- **Rungate error propagation** (`a89fe55`): AI errors inside debate rounds now propagate up to `triggerAiGeneration` and appear as a toast instead of running silently to the end.

## [2026-06-22] — Fix: Risk & Validation "AI is working" stuck forever

- **Root cause**: The Devil's Advocate debate pipeline runs up to 40 sequential AI calls, easily exceeding Vercel Pro's ~800 s function ceiling. When Vercel kills the serverless function, no server-side try/catch runs, so `current_blocks_updating` stays set in the DB forever. On the client, `triggerRegenerate` in `useRegenerate.ts` had no try/catch either — a thrown network error left `isRegenerating = true` permanently. The only auto-recovery was a 45-minute stuck-state timer in `AiLoadingOverlay`, far too long.
- **Fix 1 — `useRegenerate.ts`**: Wrapped `runAiWithTimeout` in try/catch. If the server action throws (network drop, Vercel timeout), `setIsRegenerating(false)`, `clearAiWorking(ideaId)`, and `router.refresh()` are always called.
- **Fix 2 — `AiLoadingOverlay.tsx`**: Reduced `DEBATE_STUCK_TIMEOUT_MS` from 2,700,000 ms (45 min) to 900,000 ms (15 min) — auto-recovers within ~2 min of Vercel killing the function. Added `router.refresh()` to `handleDismiss` so the page re-reads DB state even if Realtime missed the event. Added a "Taking too long? Cancel and retry" button that appears after 3 min for `risk_and_validation` and `report` steps, giving users immediate manual escape.
- **DB cleanup**: Cleared stale `current_ai_request_id` on the affected production idea (`Lola`, `f3e68278-…`).

## [2026-06-22] — Ideas Refiner: recalibrate Claude Code milestone time estimates to 80–160h

- The Milestones & Tasks step produced unrealistic timelines: the prompt suppressed estimates ("minutes not hours", "do NOT inflate", 1–8h per area), so plans came out inconsistent and far from a real Claude Code build. Researched real-world Claude Code project timelines (Anthropic's own Claude Cowork ≈1.5 weeks; multi-tenant SaaS builds ≈weeks) — a complete, production-grade app is ~2–4 focused weeks (≈80–160h) for one developer.
- Rewrote the Claude Code milestones prompt: removed the suppression language, added an explicit **GRAND-TOTAL TARGET** band (Simple ≈80h / Moderate ≈120h / Complex ≈160h) as the primary rule, raised per-area anchors to full-lifecycle values (scaffold 8–12h, DB+RLS 12–18h, auth 8–14h, pages 6–26h, deploy 10–16h), and added a "Project Total" summary line. Buffer is one consolidated "General Tasks — 4–6h" line per milestone.
- Updated both `FALLBACK_MILESTONES` (`ideas-refiner/actions.ts`) and the DB-stored Claude Code prompt. Migration `20260701000000_milestones_claude_code_prompt_recalibrate.sql` upserts prompt `c1d2e3f4-0001-…` — seeds it in production (which had no row, was using the fallback) and overwrites the stale local copy. Applied to production and local.
- Live-tested (idea "Clearday"): old plan totalled 190h with a split 3-row buffer; regenerated plan totals **118 hours (~3 weeks)** across 7 milestones, each with a single "General Tasks" buffer — in band, no console errors.

## [2026-06-22] — Fix: missing Brief preview/download button on Report step

- The Build Brief card only rendered its action button when `report.brief_generated_at` was already set, so an idea whose brief had never been generated had no way to preview or download it. The button is now always shown — `assembleIdeaBrief` builds the brief on-demand from the discovery steps (only the Go/No-Go Report needs to exist). Label adapts: "Generate, Preview & Download Brief" when none exists yet, "Preview & Download Brief" otherwise. Opens `BriefPreviewModal` (PDF + DOCX export). `ReportStep.tsx`.

## [2026-06-21] — Ideas Refiner: move Benchmarking before Market Opportunity; feed competitive data into sizing

- **Flow reorder**: Benchmarking is now step 6 and Market Opportunity step 7 (was the reverse). `IDEA_BLOCKS_ORDERED` + `IDEA_BLOCK_STEPS` in `src/types/idea-refiner.ts`; unlock chain in `computeUnlockedSteps` (`SandboxPlannerShell.tsx`) rewired to `location_legislation → benchmarking → market_opportunity → strategic_frameworks`, with backward-compat OR-guards for existing ideas.
- **Data flow**: `generateMarketOpportunity` now receives the benchmarking row (overview, comparison of similar apps, possible business models, takeaways) and passes it into the prompt. The model anchors `price_point`, `billing_model`, `cac_estimate`, and `ltv_estimate` to the competitive comparables (e.g. competitors' free/freemium tiers) rather than guessing. `triggerAiGeneration` broadened to fetch benchmarking for the `market_opportunity` step; `FALLBACK_MARKET_OPPORTUNITY` updated.
- **Migration** `20260630000000_market_opportunity_prompt_add_benchmarking.sql` — adds the four benchmarking inputs + "anchor pricing to comparables" guidance to the DB-stored prompt `bb000002`. Applied to production (via CLI) and local Docker DB.
- **Live-tested** on localhost:4000 (idea "VirtueBud"): tab order + "Step 6/Step 7" labels correct; Benchmarking renders its 9-competitor table; Market Opportunity generated fresh with all 14 fields populated, adopting a "freemium + free initial conversation" billing model that mirrors the benchmarked competitive set.

## [2026-06-21] — Fix: AI not filling Price Point / Billing Model / CAC / LTV in Market Opportunity step

- **Root cause**: Migration `20260623000000_idea_market_pricing.sql` added four new columns (`price_point`, `billing_model`, `cac_estimate`, `ltv_estimate`) to `idea_market_opportunity`, but the DB-stored AI prompt (`bb000002-0000-4000-8000-000000000001`) was never updated to request those fields. The AI used the DB prompt, omitted the new keys, and the columns stayed `null`.
- **Fix**: New migration `20260629000000_market_opportunity_prompt_add_pricing.sql` — appends the four "Offer & Pricing" output keys to the market opportunity prompt in the `prompt` table. Applied to production via Supabase MCP.

## [2026-06-21] — Remove Bubble/BlurApps references; reframe codebase + .specs/ as source of truth

- Deleted `docs/reference_docs/` (7 Bubble export files + 2 screenshots, ~15k lines) — the migration is complete and the export is no longer maintained.
- Deleted `docs/architecture.md` — stale duplicate; superseded by root `architecture.md`.
- Deleted `.env.local.clean` — tracked file contained live secrets for the old Blur Studio Supabase project (`hddwpacyhuvijefswtqp`). Credentials rotated separately.
- `CLAUDE.md`: rewrote Project Goal, Knowledge Base Mapping, and Mandatory Coding Rules to point at `supabase/migrations/`, `src/`, and `.specs/` instead of the Bubble export.
- `RULES.md`: renamed "Reference-First Development" → "Spec & Codebase-First Development"; updated all lookup table entries and DON'T/DO examples.
- `README.md`: removed "replicating the legacy Bubble.io application" framing; updated project-structure tree.
- `architecture.md`: removed "(not a Bubble port)" annotation; updated one stale comment.
- `.env.example`: removed "Source: docs/reference_docs/api-connectors.md" comments; updated model names.
- `scripts/unwrap-types.js`: updated hardcoded project path from `blur-studio-internal-tools` to `move37-operational-system`.
- `scripts/seed-users.mjs`: removed `cdn.bubble.io` avatar URLs (nulled out).
- `src/lib/api/{openai,gemini,brevo,json-converters}.ts`: stripped all file-header comments referencing the Bubble connector or `reference_docs/`.
- `src/types/{leads,idea-refiner,okrs,marketing}.ts`: removed Bubble data-type and option-set docblock references.
- `src/app/{dashboard,chat/_chatbot/tools,feedback/page,feedback/_components/StarRow,ideas-refiner/page,ideas-refiner/actions,signin/page}.tsx/ts`: removed inline comments citing `reference_docs/` pages or Bubble data types.
- `.specs/project/PROJECT.md`, `.specs/project/ROADMAP.md`, `.specs/codebase/CONCERNS.md`, `.specs/codebase/STRUCTURE.md`, `docs/marketing/README.md`: reworded to reflect codebase-as-spec.

## [2026-06-21] — Full security, code-quality, and performance audit (skills: /tlc-spec-driven, /code-quality-reviewer, /code-review, /performance-optimization, /security-review, /security-best-practices, /supabase, /supabase-postgres-best-practices)

### CRITICAL security fix
- **Privilege escalation via `profiles.type` self-promotion** (`profiles: update own` policy had no `WITH CHECK`; any authenticated user could `PATCH {type:"admin"}`). Fixed with a `BEFORE UPDATE` trigger (`profiles_guard_type_change`) that blocks type changes from regular users; added `WITH CHECK (id = auth.uid())` to the policy. Migration: `20260628000000_security_profiles_type_guard.sql`.
- **`is_staff_role()` SECURITY DEFINER** missing `SET search_path` — pinned to `'public'` in the same migration.

### HIGH security fixes
- **Webhooks failed open**: Tally and Cal.com handlers returned `true` when `WEBHOOK_SECRET` env var was unset. Now fail closed in production. UUID validation + 32KB size cap added to the Tally `mkt_signal` IDOR sink.
- **Timing-leak secret comparisons**: All 5 cron + webhook routes switched to `timingSafeEqual` via new `src/lib/auth/secretCompare.ts` helper (was plain `===`).
- **Hardcoded `"dev"` HMAC fallback** in `marketing/outreach.ts` removed (unsubscribe tokens were forgeable in local/staging environments).
- **Unbounded public write payloads** in `marketing/public.ts` (`recordSignal`/`recordEvent`): field caps, UTM allowlist, 8KB quiz payload cap added.
- **XSS via unsanitized AI HTML**: ideas-refiner chatbots (`IdeaChatbot`, `IdeaDevilAdvocateChatbot`) rendered `m.message` raw in `dangerouslySetInnerHTML`. Wrapped with `sanitizeHtml`.
- **Security headers** added to `next.config.ts`: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`.

### Code quality fixes
- `projects/actions.ts`: `createProject` now unions creator into `authorized_users` (was possible to lock yourself out of your own project); added `WITH CHECK` to the insert guard.
- `signin/actions.ts`: removed dead `/referrer-dashboard` redirect route (dropped table).
- `api/ai-config.ts`: removed dead `import { createServiceClient }` stub.
- `api/json-converters.ts`: deleted dead `verifyTalent`/`verifyClient` stubs (talent tables dropped).
- All AI provider helpers (`openai.ts`, `gemini.ts`, `claude.ts`): missing-key changed from `throw` to `return { returned_an_error: true }` — consistent with all other error paths, never crashes server actions.
- `api/gemini.ts`: API key moved from query string (`?key=`) to `x-goog-api-key` header (credential exposure fix).
- `ideas-refiner/actions.ts`: 11 AI generate* functions now capture write errors and early-return; `triggerAiGeneration` completion block skips `current_block_ended` when a generation error occurred (prevents false "step completed" state).
- `invoices/actions.ts`: `sendInvoiceEmail` error check now correctly catches resolved-with-error responses (not just Promise rejections); `maxTokens` raised to 16384 for AI fill.

### Performance fixes
- `chat/_components/tabs/TaskRequestsKanbanWrapper.tsx` + `InternalProjectTasksTab.tsx`: added in-flight `inFlight` guard + `document.visibilityState` check to 2s poll loops (prevents server-action queue flood).
- `marketing/admin.ts` (`getIdeaContext`): sequential DB fetches replaced with `Promise.all`.
- `feedback/page.tsx`: `profiles` select drops unused `signature` column.
- `okrs/_components/KeyResultModal.tsx`: `KeyResultsTracker` lazy-loaded with `dynamic(..., { ssr: false })`.
- New migration `20260627000000_mkt_funnel_indexes.sql`: indexes on `mkt_event(idea_id, type)`, `mkt_event(idea_id, session_id)`, `mkt_signal(idea_id, type)`.

### Documentation sync (`/tlc-spec-driven`)
- `README.md`, `architecture.md`, `RULES.md`, `CLAUDE.md`, `docs/project_status.md` updated to reflect current app state (15-step Ideas Refiner canonical order, 2-tier AI config, dropped talent/agency tables, marketing domain, is_staff_role, correct RLS helpers, port 4000, 28+ migrations).
- `.specs/` workspace created: `project/PROJECT.md`, `ROADMAP.md`, `STATE.md`; `codebase/STACK.md`, `ARCHITECTURE.md`, `CONVENTIONS.md`, `STRUCTURE.md`, `TESTING.md`, `INTEGRATIONS.md`, `CONCERNS.md`.

### Pending (requires explicit authorization or larger migration scope)
- RLS `(select auth.uid())` wrapper pass (409 calls unwrapped — 5-100× perf).
- Next.js 16.2.x upgrade (CVE in middleware/proxy-bypass, ws high).
- Rate limiting on `/api/m/event`, `/api/m/[slug]/capture`, webhooks.
- Full CSP with per-request nonces.
- Brevo webhook HMAC signature verification.


## [2026-06-20] — Chat tabs: stop server-action polling flood (slow UI + lost saves)

- **Symptom**: On `/chat` Files/Links/Videos/Work-Feedback tabs (both `internal_projects` and `projects`), the page became very slow and feedback often failed to save. Network trace showed a continuous flood of POSTs to the page route (server actions), some aborting.
- **Root cause** (`InternalProjectTabsPanel.tsx`, `ProjectTabsPanel.tsx`): each panel polls every 2s via `setInterval`, and every cycle fans out to **5 server actions** (`Promise.all`). Server actions share one client-side queue; with no overlap guard, once a cycle ran longer than 2s (cold Vercel functions) the next tick enqueued another batch, piling up unbounded and starving the user's *save* action → "slow" + "not saving".
- **Fix**: added an in-flight `loadingRef` guard so a new poll is skipped while the previous one is still running (caps concurrency at one batch), and the interval now only fires while `document.visibilityState === "visible"` (no background-tab flooding). No change to the data shape, server actions, or DB.
- TypeScript clean. No DB migration needed.

## [2026-06-20] — Work Feedback: fix email notifications not being delivered

- **Root cause**: `DailyFeedbackFormModal.tsx` never collected email recipients from the user, so `createDailyFeedback()` received `emails: undefined`, and `sendFeedbackEmails()` exited early (empty recipient list). The Brevo integration, `project_work_feedback.emails` column, `ProjectDailyFeedback` type, and both server actions were already complete and correct.
- **Fix** (`DailyFeedbackFormModal.tsx`): Added `emails` state (pre-populated from `feedback?.emails ?? []` on edit), imported the existing `EmailMultiInput` chip component, and rendered a **Notify by email** field above the modal footer. Both `createDailyFeedback` and `updateDailyFeedback` calls now pass `emails`.
- **Logging** (`feedbackEmail.ts`): The `Promise.allSettled` results are now inspected — rejected individual sends log `[feedbackEmail] Failed to send to <address> <reason>` via `console.error`. An outer catch logs unexpected errors. The save is still never broken by delivery failures.
- TypeScript clean. No DB migration needed. All work local-only (no commit / no prod Supabase push / no Vercel deploy).

## [2026-06-19] — Ideas Refiner: drop misleading timeout alert; clear loading overlay on AI error

- **No more timeout alert** (`useAiWithTimeout.ts`): The client-side 4-minute timeout no longer shows the "AI response timed out / took longer than 4 minutes" toast, and no longer surfaces a timeout as an error. A slow call usually means the server-side generation is still running (it resolves later via Realtime), so the alert was misleading. On timeout the helper now resolves with a non-error marker (`{ _timedOut: true }`) — the loading overlay keeps tracking real server state. Removed `showTimeoutToast` and the now-dead `TIMEOUT_TOAST_ID`. An alert (`showErrorToast`) now appears ONLY when the AI API genuinely returns an error.
- **Overlay clears on AI error** (`useRegenerate.ts`): When a step's generation returns a genuine error, the hook now force-clears the loading overlay — it calls `clearAiWorking(ideaId)` and `router.refresh()` so `isAiWorking` recomputes to `false` even if the server's own flag-clear or the Realtime event lagged. Previously the "AI is working…" spinner could linger after an error. Removed the stale timeout-toast dismiss.
- **Live test**: Forced a deterministic OpenAI error (temporarily set a bogus model, then restored `gpt-4.1-mini`). Regenerating Location & Legislation showed the "AI generation failed" alert and the "AI is working…" overlay disappeared immediately; existing step data was preserved (error path does not overwrite). TypeScript clean. All work local-only (no commit / no prod Supabase push / no Vercel deploy).

## [2026-06-19] — Build Project from idea: inherit authorized_users; fix dropped-stage link bug

- **`buildProjectFromIdea`** (`ideas-refiner/actions.ts`): The new project now inherits the idea's `authorized_users` (unioned with the creator so the builder keeps access), so the same people who could see the idea can see the project. Selects `authorized_users` from the idea and sets it on the project insert.
- **Bug fix (same function)**: The idea-link update referenced the `stage` column, which was dropped in migration `20260617000000_drop_idea_stage` — so the `update({ stage, project_id })` failed on the non-existent column, leaving the project orphaned (idea never linked) and returning an error. Removed the dropped `stage` field; the update now sets only `project_id` and the cast hack (`supabase as any`) is gone.
- **Live test**: Built a project from a seeded idea (members A+B). New project got `authorized_users = {A, B, creator}` and the idea correctly linked via `project_id`. TypeScript clean. All work local-only (no commit / no prod Supabase push / no Vercel deploy).

## [2026-06-19] — Email notifications on work feedback & invoices; descriptions on files/links/videos

Three additions across the chat tab panels and the invoices page. DB migration `20260619000020` (additive `ADD COLUMN IF NOT EXISTS`) applied to **prod** (`bcarzmfdamsozmfjgnpv`, explicitly authorized). Apply to the local dev stack with `supabase migration up` before testing against local.

- **Work-feedback email notifications** (Feature 1 — `project_work_feedback.emails[]`, `internal_project_work_feedback.emails[]`): the New/Edit work-feedback modals (chat Projects + Internal Projects) gain a "Notify by email" multi-email chip input (`EmailMultiInput`). Default `rich@move37.fun` when creating, empty when editing. On save, each recipient is emailed the same HTML the entry posts to the project/internal chat (`buildFeedbackMessage`), via Brevo `sendRawEmail`. Best-effort — a delivery failure never fails the save. The submitted list is persisted to the new `emails[]` column. (`docs/actions.ts`, `chat/actions.ts`, `lib/notifications/feedbackEmail.ts`.)
- **Invoice email with PDF** (Feature 2 — `invoice.emails[]`): the New/Edit invoice modal gains a "Send by email" multi-email input (default `rich@move37.fun` on create, empty on edit). On save, the invoice is rendered to a PDF **client-side** (inline-hex-styled doc → html2canvas → jsPDF, in `_lib/invoiceDocument.ts` + `_lib/invoicePdf.ts`; hex styles avoid Tailwind v4 `oklch()` which html2canvas can't parse), then `sendInvoiceEmail` attaches it to a Brevo email. `sendRawEmail` extended with attachment support.
- **Descriptions on files / links / videos** (Feature 3 — `description` on `project_file`/`project_link`/`project_video` + internal equivalents): the New/Edit file/link/video modals (chat Projects + Internal Projects) gain an optional Description textarea; the value shows on each card. Shared `createProjectFile`/`updateProjectLink`/etc. and the internal chat actions + select queries now carry `description`.
- **Security**: AI/rich-text HTML re-sanitized (script/iframe/on*/js:/data: stripped) both server-side at write and client-side before the offscreen PDF render.
- Code is local-only (no git push / no Vercel deploy). Only the additive DB migration was applied to prod, as authorized.

## [2026-06-19] — Ideas Refiner: debate quality, editable experiments, verdict consistency, brief & description polish

Improvements to the Risk & Validation and Report steps, grounded in the Devil's Advocate methodology.

- **Debate prompts** (`FALLBACK_SKEPTIC` / `FALLBACK_ADVOCATE`): Added topic-discipline + new-insight rules (stay anchored to the idea's core intent, surface novel reframes the evidence supports, never drift), an explicit wrong-problem test (steer the agreed problem to the real bottleneck even when uncomfortable), and an honesty-over-comfort mandate (the agreed problem/solution is the truth, not the founder's original wish). Live regen produced a sharper, on-topic agreed problem.
- **Editable Validation Experiments** (`RiskAndValidationStep.tsx` + `saveRiskAndValidation`): The "Validation Experiments (cheapest → strongest)" cards are now fully editable (method, why, budget/sample, pass threshold, kill criterion). Edits merge back into `demand_evidence.experiments` on Save and feed the next Report score. `saveRiskAndValidation` now accepts `demand_evidence`. Verified: edit → Save → DB persist.
- **Go/No-Go recommendation consistency** (`generateReport` + `FALLBACK_SCORER_HTML`): FIXED the reported bug where the Final Recommendation said "Refine" when the score was a Kill. Root cause — the recommendation and playbook HTML were generated *before* the authoritative score. Moved score reconciliation above the playbook generation, inject the authoritative verdict (`final_score`/`threshold_bucket`/`verdict_verb`/`verdict_line`) into the playbook prompt, reconcile the stored `recommendation` to lead with the verdict, and added a hard "do not contradict the verdict" rule to the scorer-HTML prompt. Verified live: score 56 → bucket=kill → recommendation, playbook §11, score badge, and brief subtitle ALL say "KILL — do not build."
- **Revised Idea Description scores higher** (`FALLBACK_REFRAMER_DOC`): Rewrote with a prime directive to raise the re-score via (1) alignment — adopt the agreed framing so reframe distance stays "minor" (avoids the 0.55 multiplier collapse) and (2) completeness — 15 Brief-grade sections (target customer, market & unit economics, competitive landscape, demand evidence & validation plan, regulatory, moat, etc.) carrying forward all source evidence. Verified: 15 sections, "minor reframe · 0.88" multiplier.
- **Brief table padding** (`assembleIdeaBrief`): The validation-steps and risk-register tables used cramped `padding:6px 0` (zero edge padding); standardized all cells to `padding:8px 12px` with `vertical-align:top`. Verified: assembled brief has 98 padded cells, 0 cramped; tables render cleanly.
- **Report uses Risk & Validation data**: Confirmed `generateReport` feeds risk_register, validation_test, why_we_win, full demand_evidence, and the debate transcript/agreed framing into the scorer via `buildRiskBlock`/`buildDemandBlock`.
- TypeScript clean. All work local-only (no commit / no prod Supabase push / no Vercel deploy).

## [2026-06-19] — "Daily Feedback" → "Work Feedback": date ranges, total hours, invoice AI Fill

Feedback is no longer daily — users pick a Start/End date and log total hours worked for the interval. Invoices gain the same work-period fields and an AI-assisted fill from feedback.

- **Table rename** (`20260626000000_rename_work_feedback_and_invoice_fields.sql`): `project_daily_feedback` → `project_work_feedback`, `internal_project_daily_feedback` → `internal_project_work_feedback` (RLS policies renamed to match). Added `start_date`, `end_date`, `total_time` to both. Applied to **prod** (`bcarzmfdamsozmfjgnpv`, authorized) and the **local** dev DB (the app runs against local Supabase at `127.0.0.1:54321`). The legacy NOT NULL `date` column now mirrors `start_date` for ordering/back-compat.
- **Tab + label rename** (display only — internal tab key/URL stays `daily_feedback`): `TAB_LABELS` and `DOCS_TAB_LABELS` now show "Work Feedback". Modal titles → "New/Edit work feedback".
- **Work-period UI** (`ProjectTabsPanel.tsx`, `InternalProjectTabsPanel.tsx`, `DailyFeedbackFormModal.tsx`): single Date field replaced by Start date / End date / **Total time worked (h)**. The four rich-text editors are now `autoHeight` (expand as you type, capped with scroll). Cards show "Start → End · Nh".
- **Server actions** (`docs/actions.ts`, `chat/actions.ts`): create/update now take `start_date`/`end_date`/`total_time`; the synced chat message header reads "📋 Work Feedback – {period}" with a total-hours line.
- **Invoice form** (`InvoiceFormModal.tsx`): merged SWIFT/BIC + IBAN into one multiline **"Account details (SWIFT / BIC, IBAN, Wise Code, etc.)"** field; added a Work period section (Start/End dates + Total time worked) and an **"AI Fill"** button. Invoice gains `account_details`, `start_date`, `end_date`, `total_time` columns (legacy `swift_code`/`iban_code` kept, backfilled into `account_details`, no longer edited). `InvoicePreview` renders `account_details` (legacy fallback) + work period/hours.
- **AI Fill** (`aiFillInvoiceFromFeedback` in `invoices/actions.ts`): sums `total_time` (deterministic) from the user's `project_work_feedback` + `internal_project_work_feedback` within the date range, and AI-summarizes the `today_work` content into the Service description. (Spec referenced a non-existent `service_description` column on feedback; confirmed with user → uses `today_work`.)
- **Live tested**: Projects + Internal Projects feedback create (period + hours render); invoice form layout; AI Fill populated Total time `12.5` and a clean AI service-description summary from a feedback entry. `rtk tsc` clean. Test rows/messages cleaned up afterward.

## [2026-06-18] — Ideas Refiner: Visual Styles logo optional, General Tasks buffer, Risk & Validation UX cleanup

Three UX/prompt improvements across the wizard's later steps.

- **Visual Styles — logo optional** (`VisualStylesStep.tsx`): Removed the guard that forced users to upload a logo before generating the design system. `handleRegenerate` now always proceeds to AI generation. The `FALLBACK_VISUAL_STYLES` prompt already handles the no-logo case ("derive a coherent palette from the idea's domain, persona psychology, and emotional tone"), so no prompt change was needed.
- **Milestones — General Tasks buffer + Claude Code speed** (DB prompt `c1d2e3f4…` "Project Milestones & Tasks (Claude Code) Prompt" + `FALLBACK_MILESTONES`): The authoritative prompt lives in the DB (`getPromptTemplate` overrides the code fallback), so **both** were updated. Merged the three per-milestone buffer tasks ("Client Requests (Developer) 4h", "QA Requests (Developer) 6h", "QA Requests (QA Tester) 6h" = 16h) into a single **"General Tasks — 4h"** covering bugs, client requests, QA fixes, and minor improvements — matches the Projects page which shows only "General Tasks Total". Rewrote the speed guidance with a CRITICAL section: Claude Code is ~3–5× faster than hand-coding and ~8–10× faster than no-code/Bubble, with tight realistic anchors (scaffold 2–3h, schema+RLS 2–4h, simple CRUD page 1–2h, complex page 4–8h). Local DB only.
- **Risk & Validation — remove duplicate Generate button** (`RiskAndValidationStep.tsx`): Removed the inline "Generate" button from the empty state (redundant with the "Regenerate" button in the action bar). Empty state now reads "Click **Regenerate** at the top to run the Devil's Advocate debate and create your risk register."
- **Visual Styles — logo optional** (`VisualStylesStep.tsx`): Removed the guard forcing a logo upload before generating; `handleRegenerate` always proceeds. The prompt already derives a palette from idea/persona context when no logo exists.

### Critical fixes uncovered during live testing
- **Missing `demand_evidence` column** (`20260619000003_idea_demand_evidence.sql`): This migration existed in the repo but was **never applied to the local DB**. Since `generateRiskAndValidation`'s upsert payload includes `demand_evidence`, the insert failed on a non-existent column — and the code wasn't checking the write error, so it silently returned success, cleared the `current_blocks_updating` flag, and wrote no row (manifesting as a 4-minute timeout with no data). Applied the migration locally (adds the column + updates the `bb000003` risk_and_validation prompt to the demand-validation version).
- **Upsert error checking** (`generateRiskAndValidation`): Insert/update now return `{ error }` on failure instead of silently swallowing DB errors.
- **`debate_context` injection** (`generateRiskAndValidation`): The step now builds a debate-context string from the live transcript and passes it (plus `recommendation`/`final_score`/`threshold_bucket` placeholders, since the Report runs *after* this step) into the demand-evidence prompt.
- **Extended timeouts for `risk_and_validation`** (`useRegenerate.ts` toast timeout + `AiLoadingOverlay.tsx` stuck timeout): both raised to 45 min, matching what Report used to have — the debate moved to this step, so the long timeout moved with it. A worst-case run is up to 40 debate calls + synthesis.
- **Live test (full generation)**: Clicked Regenerate on Risk & Validation → debate ran (40 turns, impasse at the 10-round cap), row written with `agreed_problem`, `risk_register`, and `demand_evidence`; UI renders The Debate transcript, Debate Outcome, and Demand Validation (correctly graded **UNPROVEN / low confidence**). Clicked Regenerate on Report → read the debate from `riskRow` (no re-run, ~100s), scored **66/100 → Needs Refinement**, and rendered the score gauge, area breakdown, The Debate section, and revised description. TypeScript clean throughout.

## [2026-06-18] — Ideas Refiner: Move Devil's Advocate debate from Report → Risk & Validation (fixes circular dependency)

Broke the backwards dependency: Risk & Validation (step 9) no longer requires Report (step 10) to exist first.

- **DB** — Migration `20260618000001_idea_risk_and_validation_debate.sql` adds `debate_transcript jsonb`, `debate_meta jsonb`, `agreed_problem text`, `agreed_solution text` to `idea_risk_and_validation` (applied to local DB only).
- **Types** — Added the 4 new fields to `IdeaRiskAndValidation` (`src/types/idea-refiner.ts`), reusing the existing `IdeaReportDebateTurn` interface.
- **`actions.ts`** — `generateRiskAndValidation` rewritten: (1) builds full `sourceBlock` from discovery data, (2) runs the 2-gate Devil's Advocate ↔ Advocate debate loop (copy of the `runGate` logic from `generateReport`), (3) feeds `agreed_problem`/`agreed_solution` from the debate into the risk/validation AI call, (4) upserts the full payload including debate columns. Dispatch condition extended to also fetch prior-step data for `"risk_and_validation"`. `generateReport` stripped of the debate phase — it now reads `agreed_problem`, `agreed_solution`, `debate_transcript`, `debate_meta` directly from the `risk_and_validation` row passed as `riskRow`; returns an error if `agreed_problem` is null. The `idea_report` payload still copies the debate data so `ReportStep.tsx` display is unchanged.
- **`RiskAndValidationStep.tsx`** — Removed the prerequisite gate that blocked the Generate button when `report` was null. Empty state always shows Generate. Filled state now renders "The Debate" collapsible section (transcript + impasse note) and "Debate Outcome" (agreed problem + solution) above Demand Validation.
- **`ReportStep.tsx`** — Added secondary prerequisite guard: if `!report && !riskAndValidation?.agreed_problem`, renders "Complete the Risk & Validation step first" (the wizard's built-in step-gate already redirects before this is reached, but guard is present for direct URL access).
- **Live test** — Risk & Validation tab: shows "No data yet / Click Generate" with unlocked Generate button. Report tab URL redirected by wizard to Risk & Validation (first incomplete step). TypeScript clean.

## [2026-06-18] — Ideas Refiner PRD: Personas relabel, per-persona flow, Features per Page, full-context prompt

Reworked the PRD step (tab `prd`) for build-ready, technically precise output.

- **DB** — New migration `20260625000000_idea_prd_features_per_page.sql` adds `idea_prd.features_per_page text` (applied to local DB).
- **Types** — Added `features_per_page` to `IdeaPrd` (`src/types/idea-refiner.ts`) and `PrdOutput` (`src/lib/api/json-converters.ts`).
- **`PrdStep.tsx`** — Relabelled the `priority_personas` section "Users Type" → **"Personas"** and `user_flow` "Core User Flow" → **"Core Users flow"**; inserted a new **"Features per Page"** section directly below Core Users flow. All sections are driven by the `PRD_SECTIONS` array, so rendering, PDF/DOCX export, preview, and the default-expanded set update automatically. Added `features_per_page` to state init, prop-sync effect, and the `isEmpty` check.
- **`actions.ts`** — `savePrd` accepts `features_per_page`. The prior-step fetch block (benchmarking/location/market/risk) now also runs for `step === "prd"`. `generatePrdContent` now receives full ICP rows + benchmarking/location/market/risk and fetches the report's agreed problem/solution, threading them all into the prompt via `renderPrompt` (reusing `buildIcpsBlock`/`buildLocationBlock`/`buildMarketBlock`/`buildRiskBlock`). Writes `features_per_page` to `idea_prd`.
- **Prompt** — Rewrote `FALLBACK_PRD` as an expert-PM author: enforces Personas = technical product roles (NOT marketing ICPs), one labelled `user_flow` per persona, and a page-by-page `features_per_page` block (purpose, personas, features, flow steps served). Updated the local `prompt` row `5041e57c-…` to match. Production prompt row NOT touched.
- **Live test** — Regenerated for idea `bd63c9dd…`: Personas = Client/Admin/Content Operator (technical roles); Core Users flow has one flow per persona; Features per Page lists pages (with routes) each mapping personas + features + flow steps; Non-Functional Requirements reflect Location & Legislation (ICO/GDPR/FCA). Save persisted the new field. `tsc --noEmit` clean, no timeout toast.

## [2026-06-13] — Ideas Refiner: Report score formula change + hide zero-penalty section

Changed the final score formula from an alignment multiplier to a weighted average, and hid the "Automatic Penalties Applied" section when no penalty points were triggered.

- **`actions.ts`** — Changed `finalScore` computation from `round(completeness × (alignmentScore / 100)) − penaltyTotal` to `round(completeness × 0.75 + alignmentScore × 0.25) − penaltyTotal`. The old multiplicative formula collapsed scores severely when alignment was low (e.g. completeness=65, alignment=63 → 41). The new weighted average treats completeness (75%) and alignment (25%) as balanced inputs.
- **`ReportStep.tsx`** — Added `penaltyTotal` local variable (`penalties.reduce((s, p) => s + Math.abs(p.points), 0)`). Updated the score math display line to read "Completeness N × 75% + Alignment M × 25% − P penalties = F". Wrapped the "Automatic Penalties Applied" block in `{penaltyTotal > 0 && (...)}` — hidden when all AI-returned penalty rows have 0 pts (total is zero), rather than checking `penalties.length` which would still show an empty red box.
- **Supabase backfill** — Updated all existing `idea_report` rows via CTE UPDATE using the new formula. VirtueBud: `final_score` changed from 41 → 65, `threshold_bucket` from `kill` → `refine`. Math: `round(65×0.75 + 63×0.25) = round(64.5) = 65`.
- **Live test** — Report page shows "Completeness 65 × 75% + Alignment 63 × 25% − 0 penalties = 65"; penalties section not visible (VirtueBud has zero penalty points).

## [2026-06-12] — Ideas Refiner: Strategic Frameworks per-ICP loop + timeout fixes

Refactored Strategic Frameworks AI generation to a sequential per-ICP loop and fixed client/overlay timeouts so a 5-ICP run no longer triggers false alarms.

- **`actions.ts`** — Rewrote `generateStrategicFrameworks` from a single multi-ICP call (exceeds 16,384-token ceiling for 3+ ICPs) to a sequential per-ICP loop: one `generateAiJsonResponse<SingleIcpFrameworkOutput>` call per ICP, each well within the ceiling. Loop iterates `targetIcps` (filtered by `icpId` if supplied, otherwise all ICPs). `isRequestActive` guard between iterations allows a newer run to supersede a running one.
- **`json-converters.ts`** — Added `SingleIcpFrameworkOutput` type (flat single-ICP response shape, extends `StrategicICP`).
- **`StrategicFrameworksStep.tsx`** — Fixed `handleRegenerate`: removed `selectedIcpId ?? undefined` arg to `triggerAiGeneration` so all ICPs are regenerated, not just the currently-visible one.
- **Supabase `prompt` table** — Updated Strategic Frameworks prompt row (`48f29e59-...`) to per-ICP format using `{{icp_name}}`, `{{icp_description}}`, `{{icp_day_in_life}}`, `{{icp_pain_points}}` variables; output is a single flat JSON object.
- **`useRegenerate.ts`** — Extended 10-minute timeout to `strategic_frameworks` (was report-only); 5 ICPs at ~36s each = ~3-5 min, well within the 4-min default but borderline with slower models.
- **`AiLoadingOverlay.tsx`** — Added `STRATEGIC_FRAMEWORKS_STUCK_TIMEOUT_MS = 600_000`; `stuck-state` timer now uses 10 min for `strategic_frameworks` (was 4.5 min default). The 270s stuck timer fires `clearAiWorking()` which nulls `current_ai_request_id`, making `isRequestActive` return `false` for remaining ICPs — a premature clear cancels unfinished ICPs.
- **Live test** — All 5/5 ICPs populated (scores 85, 82, 84, 88, 90/100). Page loads without overlay after generation.

## [2026-06-12] — Ideas Refiner: maxTokens fixes (Benchmarking, Product Definition, Go-to-Market)

Fixed silent AI generation failures across multiple steps caused by the default 8,192-token ceiling being insufficient for large multi-field rich HTML responses.

- **`actions.ts`** — Added `maxTokens: 16384` to `generateBenchmarking`, `generateDatabaseContent`, `generateVisualStylesContent`, and `generateMilestonesContent`. `generateProductDefinition` was already fixed in the prior session.
- **`loadIdeaFull.ts`** — Added `go_to_market` to the explicit `.select(...)` column list for `idea_product_definition_and_flows`; the column existed in the DB but was silently omitted from every server-side load.
- **Supabase `prompt` table** — Updated the `product_definition_flows` prompt row (UUID `965408c8-9910-4caf-81b9-376e44410691`) to include the full `"Go-to-Market"` key with a detailed 5-point GTM strategy prompt, so the DB row no longer overrides the updated code fallback with a stale version.
- **Root cause pattern** — Any `generateAiJsonResponse` call that produces multi-field rich HTML output silently fails when the response exceeds 8,192 tokens: `JSON.parse` throws → `returned_an_error: true` → function returns early → DB not written → overlay clears via stuck timer → empty page. Fix: always pass `maxTokens: 16384` for multi-field rich HTML generation steps.
- **Live test** — Benchmarking page for idea `f301da01` verified: all 4 fields written (overview 1.8k, comparison 9.5k, business_models 16.8k, takeaways 11.4k chars), Strategic Frameworks tab unlocked after completion.

## [2026-06-12] — Ideas Refiner: Devil's Advocate AI-vs-AI debate pipeline (Report Step 7)

Replaced the single-shot report generation with a full two-gate AI-vs-AI debate pipeline. The Skeptic and Founder's Advocate argue in bounded rounds (≤5/gate), converge on an agreed problem bottleneck and solution, then two synthesis calls (Reframer + Scorer) produce the final report with alignment scoring.

- **DB migration** (`20260611120000_report_devils_advocate.sql`) — Added 8 columns to `idea_report`: `agreed_problem`, `agreed_solution`, `recommendation`, `revised_description`, `completeness_score`, `alignment` (JSONB), `debate_transcript` (JSONB), `debate_meta` (JSONB). Seeded 4 editable prompt rows (Skeptic, Advocate, Reframer, Scorer) in the `prompt` table.
- **DB migration** (`20260612000000_fix_threshold_bucket_constraint.sql`) — Expanded `threshold_bucket` constraint to allow both old (`ready`, `risk`) and new (`build`, `refine`, `kill`) values.
- **Types** (`src/types/idea-refiner.ts`) — Added `IdeaReportAlignment` and `IdeaReportDebateTurn` interfaces; extended `IdeaReport` with all 8 new nullable fields.
- **Server action** (`src/app/ideas-refiner/actions.ts`) — Rewrote `generateReport`: 2-gate debate loop (Skeptic + Advocate, up to `MAX_ROUNDS_PER_GATE=5` each), early-exit on convergence, `isRequestActive` stale-write guard between gates. Reframer step split into JSON meta call + plain-text HTML doc call (`generateAiTextResponse`, 16384 tokens) to avoid JSON-in-JSON encoding problems. Scorer split into meta call (8192 tokens, all fields except `playbook_html`) + HTML call. Score composition: `completeness × (alignment/100) − penalties`. Strips markdown code fences from `revised_description` before storing.
- **UI** (`src/app/ideas-refiner/_components/ReportStep.tsx`) — Added: (1) "The Debate" collapsible with gate labels, role chips (Skeptic/Advocate), round number, argument content, proposed statements, impasse note; (2) Debate Consensus cards (Agreed Problem, Agreed Solution, Recommendation); (3) Alignment to Correct Framing block (problem-fit %, solution-fit %, reframe-distance pill, alignment score, verdict, rationales); (4) score math line under the donut (`completeness × alignment% − penalties = final`); (5) Revised Idea Description read-only HTML card.
- **`sanitizeJsonText` state machine** — Applied to all three AI providers (`claude.ts`, `openai.ts`, `gemini.ts`): escapes bare `\n`/`\r`/`\t` inside JSON string values using a character-by-character `inString`/`wasEscaped` state machine.
- **Client timeout** — Report step uses `timeoutMs: 600_000` (10 min) in `useRegenerate` to cover the full debate loop.
- **Live test** — Verified on VibeCheck AI idea: all 6 UI sections render, score math checks out (48 × 55% − 0 = 26, Kill verdict), 5-round impasse on both gates, full Revised Idea Description (11-section Quality Bar document).

## [2026-06-10] — Marketing: P1 integrations (Interview Intelligence, booking webhook, Tally survey, traffic tab)

Continued implementing the signal-accuracy improvement plan. All P0 items were already live (migration, types, signals page, TrafficShell, ad campaigns). This session completes the P1 layer.

- **InterviewsShell.tsx** (new) — Full Interview Intelligence client component: add-interview form (name, role, segment, source, date, consent, transcript), per-interview Mom Test analysis panel (pains + severity + quotes, past behaviors highlighted green, hypothetical praise flagged amber, commitment signals, objections), cross-interview synthesis panel (themes, pivot indicators, segment contrast, contradictions, AI recommendation, saturation indicator). Connects to pre-existing `analyzeInterview` / `synthesizeInterviews` server actions.
- **MarketingProjectNav.tsx** — Added "Interviews" (B2B group) and "Traffic" tabs to the 9-tab funnel nav.
- **`meeting_booked` event type** — Added to `ALLOWED_EVENT_TYPES` in `public.ts`; the intent gradient now covers the full lifecycle from view → click → scroll → pricing_click → meeting_booked.
- **`{{booking_link}}` in outreach templates** — Added `booking_link` to `prospectVars()` and a `bookingUrlCache` + `getBookingUrl()` helper in `processDueOutreach`; the cache fetches `mkt_validation.booking_url` once per idea per cron run.
- **`window.__MKT_BOOKING_URL__` injection** — `getPublishedLanding` now also fetches `mkt_validation.booking_url` (parallel `Promise.all` with the idea fetch); `injectContract` injects it into the iframe contract when present; generated page code can use `window.__MKT_BOOKING_URL__` to power a post-capture "Book a call" CTA.
- **`/api/webhooks/calcom`** (new) — BOOKING_CREATED → fires `mkt_event type='meeting_booked'` for the funnel + creates `mkt_interview` stub with participant name/email/date and `source='booking'`. Signature verification via `CALCOM_WEBHOOK_SECRET` (skipped in dev). Booking URL must include `?ideaId=<uuid>` — Cal.com passes URL query params into `payload.metadata`.
- **`/api/webhooks/tally`** (new) — FORM_RESPONSE → reads `signalId` from hidden field, updates `mkt_signal.survey_answers` with all non-hidden field answers. Signature verification via `TALLY_WEBHOOK_SECRET`.
- **TypeScript** — `tsc --noEmit` = 0 errors across all new/changed files.

## [2026-06-10] — Marketing: signal-accuracy report & improvement roadmap

Full audit of the validation funnel (Set positioning → … → Watch signals) against the goal of accurate keep/pivot/kill decisions, grounded in live data (VirtueBud: 23 sessions, 1 signal, 106 prospects, 0 sends).

- **Report** — `docs/marketing/signal-accuracy-report.md`. Core finding: the funnel measures activity, not evidence (binary step completion, no ICP scoring, no UTM attribution, free-form quiz answers, dormant preorder/outreach channels, manual unstructured decision).
- **Roadmap** — P0: Decision Contract with pre-registered thresholds, structured quiz schema, auto-UTM, outreach tooling split (cold via dedicated sender; Brevo nurture-only), Stripe Payment Link preorders, weighted/ICP-split/n-gated scoring. P1: Interview Intelligence (`mkt_interview` + Mom Test analyst + cross-interview synthesizer), Cal.com booking webhook, Tally post-capture micro-survey, PostHog session recordings. P2: A/B variants, decision panel + `mkt_decision_log` + pivot taxonomy, Idea Refiner feedback loop.
- **New funnel shape** — adds Define hypothesis (step 0), Drive paid traffic (2.7, `mkt_ad_campaign` + cost-per-ICP-capture), Interviews (2.5), post-capture micro-survey (6.5), recurring Decision review (7).
- No code changes in this session; report + roadmap only.

## [2026-06-10] — Marketing: fix all [ideaId] pages (Turbopack stale cache bug)

The entire marketing workspace (`/marketing/[ideaId]` and all 6 sub-tabs) was returning 404 due to a Turbopack dev-server cache conflict on Windows: renaming the route folder from `[projectId]` to `[ideaId]` did not update Turbopack's in-memory route registry because Windows file watchers do not reliably fire on bracket-named directories. Both `[projectId]` and `[ideaId]` were registered as competing dynamic segments, causing every URL like `/marketing/<uuid>` to 404.

- **Root cause** — `.next/dev/server/app-paths-manifest.json` contained both `/marketing/[projectId]/page` (stale, source deleted) and `/marketing/[ideaId]/page` (new); Turbopack could not resolve the ambiguity.
- **Fix** — Triggered a Turbopack dev-server restart via a no-op `next.config.ts` comment edit; on restart Turbopack rescanned source files, dropped all stale `[projectId]` entries, and registered only `[ideaId]` routes.
- **Verified live** — All 7 pages load correctly: Dashboard, Positioning, Sourcing, Outreach, Content, Landing, Signals.

## [2026-06-10] — Marketing: migrate all mkt_* tables from project_id → idea_id

All 12 marketing tables now reference `idea` directly instead of `project`, reflecting the move from project-level to idea-level validation workspaces.

- **DB** — Migration `20260610000000_mkt_idea_id_migration.sql` (retrospective): adds `idea_id uuid NOT NULL REFERENCES idea(id) ON DELETE CASCADE` to all 12 `mkt_*` tables, backfills from `project_id` (latest idea per project), drops `project_id`, recreates RLS policies with `idea → project` join, rebuilds the `mkt_suppression` unique index on `(idea_id, lower(email))`. Schema was applied directly to hosted DB on 2026-06-10 via MCP; migration file documents and replays the change with full IF NOT EXISTS guards.
- **Routes** — Renamed `src/app/marketing/[projectId]/` → `src/app/marketing/[ideaId]/`; eliminated Next.js routing conflict.
- **Components** — All 6 client components (`LandingBuilder`, `PositioningEditor`, `SourcingShell`, `ContentStudio`, `OutreachShell`, `CampaignDetail`) renamed `projectId` → `ideaId` throughout.
- **Lib** — `src/lib/marketing/outreach.ts`: all `projectId`/`project_id` → `ideaId`/`idea_id`; HMAC token seed updated. API routes `api/m/unsubscribe` and `api/webhooks/brevo` updated to match.
- **Deleted** — `ValidationSettings.tsx` (orphan; called non-existent `updateValidation`).
- **TypeScript** — `tsc --noEmit` = 0 errors.

## [2026-06-08] — Idea Refiner: Report becomes a pre-build Devil's Advocate go/no-go gate

Moved the Report step from last (Step 11) to Step 7 — immediately after Strategic Frameworks and before PRD. Rationale: PRD → Database → Visual Styles → Project Milestones only make sense once the team has decided to build. Report is now the explicit "should we build this at all?" gate, so it scores only discovery-phase evidence.

- **Order** — `src/types/idea-refiner.ts`: reordered `IDEA_BLOCKS_ORDERED` (report → index 6) and renumbered `IDEA_BLOCK_STEPS` (report 7, prd 8, database 9, visual_styles 10, milestones 11). New report subtitle: "Go/no-go verdict before committing to the build."
- **Unlock chain** — `SandboxPlannerShell.tsx` `computeUnlockedSteps`: Report unlocks after Strategic Frameworks; PRD unlocks after Report has content; Milestones is now terminal.
- **Rubric redesign** — `actions.ts` `generateReport`: now reads ONLY discovery evidence (idea, structure, ICPs incl. strategic-frameworks value-props, product definition, benchmarking). Dropped all PRD/Database/Visual/Milestones fetches and template vars. New 6 areas: problem_reality (25), customer_clarity (15), competitive_honesty (15), strategic_positioning (20), demand_evidence (15), assumption_risk (10). New pre-build penalties (no competitors, no measurable metrics, single-ICP, vague audience, unvalidated assumption). Built on the Critical Thought Partner / Devil's Advocate methodology: epistemic labels, anti-sycophancy ("Yes, but"), strongest counter-argument, kill-criteria.
- **Verdict** — buckets changed `ready/refine/risk` → `build` (≥75) | `refine` (≥60) | `kill` (<60). Updated `IdeaReport`/`ReportOutput` types and `ReportStep.tsx` UI (Go/No-Go Report header, Verdict Guide, "Proceed to Build (PRD)" CTA). Legacy buckets still render on old rows.
- **Prompt** — Migration `20260608000000_report_prompt_devils_advocate.sql` rewrites the Report prompt (id `e1f6cb88…`). NOTE: `getPromptTemplate` runs `stripHtml` on stored prompts, so the prompt describes output structure in words ("h2 element", "p element") rather than literal tags, which were being silently deleted before reaching the model.

## [2026-06-06] — Prompt group cleanup + Idea Refiner rename

- **DB** — Migration `add_marketing_post_creation_group`: Created `Marketing - Post Creation` prompt group; moved 5 pipeline prompts from `Marketing` group and renamed with step numbers (`1. Social Post Strategist` … `5. Social Post Publisher`); deleted duplicate `Social Post Copywriter (Squad)` and `Social Post Reviewer (Squad)`.
- **Content** — `src/app/marketing/[projectId]/content/actions.ts`: Updated all prompt name references in the OpenSquad pipeline to match new numbered names.
- **Idea Refiner** — Renamed `src/app/sandbox-planner/` → `src/app/idea-refiner/`; renamed `src/types/sandbox-planner.ts` → `src/types/idea-refiner.ts`; updated all internal imports, route strings (`/idea-refiner`), and the `lead` ROLE_FALLBACK in `src/lib/auth/page-gate.ts`.
- **Sidebar** — Renamed "Sandbox Planner" → "Idea Refiner"; moved from COLLABORATION group to OPERATIONS group above Marketing.
- **CLAUDE.md** — Updated `### Sandbox Planner` section heading to `### Idea Refiner`.

## [2026-06-05] — Social Discovery Pipeline (multi-platform Apify orchestration)

6-platform email discovery pipeline that searches creator bios and posts on LinkedIn, Instagram, Facebook, YouTube, Twitter/X, and TikTok, then extracts emails through a 3-stage async state machine.

- **DB** — Migration `20260606000000_add_social_discovery_channel.sql`: `ALTER TYPE mkt_channel ADD VALUE IF NOT EXISTS 'social_discovery'`. Updated `MktChannel` type and `CHANNEL_LABELS` in `src/types/marketing.ts`.
- **`src/lib/api/apify.ts`** — `buildLocationKeywords` helper (location injected into search terms for actors without native location support); `SocialPlatform`/`DiscoveryMode`/`SocialActorRun`/`NormalizedSocialProfile` types; 14 actor fire functions (6 Path A bio, 6 Path B content, LinkedIn enrichment, website email extraction); 7 result normalisers (one per platform, handles both path outputs).
- **`src/app/marketing/[projectId]/sourcing/actions.ts`** — `startSocialDiscovery` action: reads `mkt_validation.reference_sources` for Stage 0 priority seeds, fires Stage 0 + Stage 1 actors in parallel, writes full pipeline state as JSONB to `mkt_source_run.query`.
- **`src/lib/marketing/sourcing.ts`** — `importOne()` now dispatches on `channel === 'social_discovery'` before the single-run path. Full 4-stage state machine: `advanceFromStage1` (polls all Stage 0+1 actors, extracts LinkedIn/website URLs, fires Stage 2 if needed), `advanceFromStage2` (LinkedIn enrichment polling), `advanceFromStage3` (website email extraction), `importSocialProfiles` (imports sorted priority-first, tagged `social_discovery_<platform>`).
- **`SourcingShell.tsx`** — Social Discovery section below the existing two-column layout: 6 platform checkboxes (2×3 grid), Bio/Posts/Both discovery mode toggle, keywords textarea, location input with native/injected tooltip, max-per-platform slider (10–100), submit button, stage label in run cards (`social` badge, stage 1/3 → 2/3 → 3/3 → Done).
- **ContentStudio.tsx** — `AI_STAGES` labels updated to match actual 3-agent OpenSquad pipeline ("Strategist analysing…" / "Copywriter writing…" / "Reviewer checking…").
- **Verified:** `tsc` 0 errors; migration applied to remote DB.

## [2026-06-03] — Sourcing: B2B people search via Apify (Apollo-alternative)

Replaces the paused Apollo card with a working people-search source — bypasses the gated Apollo free-plan API by using an Apollo-alternative actor on Apify (`code_crafter/leads-finder`, 250M+ contact DB, ~$1/1k). Reuses the existing start→poll→import pipeline.

- **`src/lib/api/apify.ts`** — `LEADS_ACTOR`, `buildLeadsInput` (job titles, seniority, location, company keywords, fetch_count, email_status=validated), `mapLeadToProspect` (mapped against the actor's real output schema: full_name/email/job_title/company_name/company_website/linkedin). Added `title` to `NormalizedProspect`.
- **`src/lib/marketing/sourcing.ts`** — importer now branches on `run.channel`: `google_maps` → place mapper (`apify_google_maps`), else → people mapper (`apify_leads`); writes `title`. Source-run selects include `channel`.
- **`src/app/marketing/[projectId]/sourcing/actions.ts`** — `startLeadsSourcing` (tags run `channel='linkedin'`, no migration needed). Detects the actor's one-time "full-permission" approval 403 and returns a friendly message + approval link.
- **`SourcingShell.tsx`** — paused Apollo card replaced with a real **People search** form (titles/keywords/location/seniority/max); runs list labels people-search runs.
- **Importer hardening (`sourcing.ts`)** — skips actor `{error}`/identity-less records and marks such runs `failed` (never creates blank prospects).
- **Verified end-to-end in browser:** after approving the actor, a run started → polled → Sync → imported through the real pipeline. Discovered `code_crafter/leads-finder` **blocks API runs on the Apify free plan** (returns an `{error}` record; runs only via Apify's UI on free tier). Google Maps (standard actor) is unaffected and works on free-plan API. **Decision:** people-search works as-built once on a **paid Apify plan** (no code change); Google Maps + manual/CSV cover the free tier.

## [2026-06-02] — Marketing Validation Engine — UX pass (clarity)

Driven through the full pipeline live (Playwright) on the VirtueBud project; fixed clarity issues found.

- **Stale copy fixed** — dashboard hint and Outreach prospects note no longer claim sourcing/outreach/content are "future phases" (they're built).
- **Funnel-ordered nav** — `MarketingProjectNav` reordered to Dashboard · Sourcing · Outreach · Content · Landing · Signals; now takes `funnelMode`.
- **Mode-tailored workspace** — in Consumer Capture mode the B2B tabs (Sourcing, Outreach) are dimmed + tagged "B2B"; the dashboard hides the Outreach funnel and omits B2B steps from the getting-started guide. All 6 project pages pass `funnelMode`.
- **Getting-started guide** — new `PipelineGuide` on the dashboard: numbered steps with done/next state + links, tailored to funnel mode (`getOnboardingExtras` adds published-landing + content-count checks).
- **Visual funnel** — new `FunnelView` replaces the flat KPI grids with proportional bars + stage-to-stage conversion %.
- **Verified:** `tsc` 0 errors; confirmed live in-browser (capture → signal flowed; AI draft generated a real post from positioning).

## [2026-06-02] — Marketing Validation Engine — Phase 2 (Sourcing, Apify)

Lead sourcing into `mkt_prospect` via the Apify Google Maps scraper (`compass/crawler-google-places`, id `nwua9Gu5YrADL7ZDj`; input schema introspected live). Async pattern (start run → poll → import) so long scrapes don't hit serverless limits.

- **`src/lib/api/apify.ts`** — `startActorRun`, `getRun`, `getDatasetItems`, `buildGoogleMapsInput` (searchStringsArray/locationQuery/maxCrawledPlacesPerSearch/scrapeContacts/website), `mapPlaceToProspect` (place → company/email/phone/website/linkedin + raw enrichment).
- **`src/lib/marketing/sourcing.ts`** — `importSourceRun` (manual) + `importDueSourceRuns` (cron): poll Apify run, on SUCCEEDED ingest dataset into `mkt_prospect` deduped by project+email.
- **`src/app/marketing/[projectId]/sourcing/`** — `SourcingShell.tsx` (Google Maps form: terms/location/max/enrich, runs table with status + Sync) + `actions.ts` (`listSourceRuns`, `startGoogleMapsSourcing`, `syncSourcingRun`). Apollo shown as **paused** (free-plan 403).
- **`/api/mkt/cron/sync-sourcing`** — auto-imports finished runs (every 5 min in `vercel.json`). Sourcing tab promoted to ready.
- **Verified:** `tsc` 0 errors; `npm run build` ✓ (all marketing + cron routes present); `mkt_source_run` DB round-trip (running → done + result_count). Did **not** run a live scrape (it spends Apify credits) — start/poll/import paths build against the introspected schema.

**All six phases (0–5) of the Marketing Validation Engine are now built.**

## [2026-06-02] — Marketing Validation Engine — Phase 4 (Content studio, Postiz)

Calendar-first (Buffer-style) social scheduler. Switched provider Ayrshare → **Postiz** (cheaper). Postiz REST verified live: base `https://api.postiz.com/public/v1`, auth header is the **raw API key** in `Authorization` (no Bearer).

- **`src/lib/api/postiz.ts`** — `listChannels()` (GET /integrations) + `schedulePost()` (POST /posts; per-channel `settings.__type`).
- **`src/app/marketing/[projectId]/content/`** — `ContentStudio.tsx` (month calendar with **drag-to-reschedule**, drafts tray, composer drawer with channel chips, **AI drafting** off project positioning, schedule/publish-now) + `actions.ts` (`getChannels`, `listContent`, `saveContent`, `rescheduleContent`, `deleteContent`, `generateContentDraft`, `publishNow`).
- **`src/lib/marketing/content.ts`** + **`/api/mkt/cron/process-content`** — worker publishes due scheduled posts via Postiz, stores ids in `external_post_ids`. Added to `vercel.json` crons (every 15 min).
- **Content** tab promoted to ready in the project nav.
- **Verified:** `tsc` 0 errors; `npm run build` ✓; Postiz `/integrations` live = `200 []` (auth good, no channels connected yet); `mkt_content` DB round-trip (schedule → posted + `external_post_ids` → cleanup).
- **Note:** posting needs at least one channel connected in the Postiz dashboard. Apollo REST key is valid (`auth/health` 200) but **search is gated on Apollo's free plan (403)** — Apollo auto-sourcing in Phase 2 needs a paid plan; Apify + manual/CSV are unaffected.

## [2026-06-02] — Marketing Validation Engine — Phase 5 (Validation dashboard)

Makes the capture (Phase 1) + outreach (Phase 3) data actionable. No external keys needed.

- **`src/lib/marketing/admin.ts`** — `getPortfolioMetricsMap(projectIds)` rolls up funnel metrics across projects (accurate count queries per project).
- **`/marketing`** — portfolio summary strip (views / captures / prospects / replies across all validating projects) + per-card mini-stats. `MktProjectListItem` gained an optional `metrics` field.
- **`/marketing/[projectId]`** — `ValidationSettings` card: funnel mode, the **kill / double-down decision** (`mkt_validation.status`), and positioning (which feeds AI-personalised outreach), saved via `updateValidation`.
- **Verified:** `tsc` 0 errors; `npm run build` ✓.

## [2026-06-02] — Marketing Validation Engine — Phase 3 (Outreach engine)

Built before Phase 2 (sourcing) so it's usable now — Brevo was already wired and needs no new keys. Includes a manual/CSV prospect entry so sequences can run today; Apollo/Apify auto-sourcing (Phase 2) will fill the same `mkt_prospect` table later.

- **Core (`src/lib/marketing/outreach.ts`):** `renderTemplate` (`{{first_name}}` etc.), `prospectVars`, signed `unsubscribeToken`/`verifyUnsubscribeToken`/`unsubscribeUrl` (HMAC), suppression check, and `processDueOutreach()` — the worker that sends due steps via Brevo, honours suppression + paused campaigns, optionally AI-personalises the `{{ai_opening}}` line (via `resolveAiConfig` on the campaign's `created_by`), then schedules the next step.
- **Brevo (`src/lib/api/brevo.ts`):** added `sendRawEmail()` (subject + HTML, env `BREVO_FROM_*` fallback, reply-to + tags).
- **Actions (`outreach/actions.ts`):** prospects (`listProspects`, `addProspect`, `importProspects`, `deleteProspect`), campaigns (`listCampaigns`, `createCampaign`, `setCampaignStatus`), steps (`listSteps`, `saveStep`, `deleteStep`), `enrollProspects`, `listOutreach`, `markReplied`, and admin `runOutreachNow` (trigger the worker immediately).
- **UI:** `/marketing/[projectId]/outreach` (campaigns + prospects with CSV import) and `/outreach/[campaignId]` (sequence editor, prospect enrollment, send-status table, pause/resume, run-now). Outreach tab promoted to ready in the project nav.
- **API routes:** `GET/POST /api/mkt/cron/process-outreach` (CRON_SECRET-guarded), `POST /api/webhooks/brevo` (opened/bounced/unsubscribed → outreach + suppression), `GET /api/m/unsubscribe` (signed one-click unsubscribe + halts queued steps). `vercel.json` cron every 15 min.
- **Env:** added `CRON_SECRET`; documented Apollo/Apify/Ayrshare/Stripe keys for later phases.
- **Verified:** `tsc` 0 errors; `npm run build` ✓; live DB round-trip across `mkt_prospect`/`mkt_campaign`/`mkt_sequence_step`/`mkt_outreach`/`mkt_suppression` incl. status transition + case-insensitive dedupe, then cleanup.

## [2026-06-02] — Marketing Validation Engine — Phase 1 (Landing + staged capture)

The highest-leverage slice: any project can now collect real demand signals. Pre-order is stubbed (Stripe deferred per decision); quiz + waitlist are live.

- **Public zone (anonymous, service-role writes):**
  - `src/app/m/[slug]/page.tsx` — SSR landing page (hero + sections), `noindex`, served via the `/m` middleware allowlist.
  - `src/app/m/[slug]/_components/CaptureForm.tsx` — staged capture widget (quiz/waitlist; pre-order shows a disabled "coming soon"). UTM passthrough.
  - `src/app/m/[slug]/_components/ViewBeacon.tsx` — one-shot view event with per-tab session id.
  - `src/app/api/m/[slug]/capture/route.ts` + `src/app/api/m/event/route.ts` — public POST endpoints.
  - `src/lib/marketing/public.ts` — `getPublishedLanding`, `recordSignal` (validates stage enabled; hard-rejects unpaid `preorder`), `recordEvent`. All via service-role client.
- **Admin zone (admin/manager):**
  - `src/app/marketing/[projectId]/page.tsx` — per-project dashboard (capture funnel + outreach KPIs).
  - `src/app/marketing/[projectId]/landing/` — builder (`LandingBuilder.tsx`) + actions (`getLanding`, `saveLanding`, `setLandingPublished`); hero, capture stages, content sections (text/features/faq/quiz), publish + public URL/preview.
  - `src/app/marketing/[projectId]/signals/` — signals table with search/filter/CSV export.
  - `src/app/marketing/[projectId]/_components/MarketingProjectNav.tsx` — pipeline sub-nav (later tabs marked "soon").
  - `src/lib/marketing/admin.ts` — `getProjectContext`, `getFunnelMetrics`.
  - `src/lib/marketing/slug.ts` — shared `slugify` (extracted so it isn't a `"use server"` export).
- **Verified:** `tsc` 0 errors; `npm run build` ✓ (all `/m` + `/marketing` + `/api/m` routes present); live DB round-trip (landing → signal → event → read-back → cleanup) against the applied schema.

## [2026-06-01] — Marketing Validation Engine — Phase 0 (Foundations)

**New domain (not a Bubble replication).** A generic, project-agnostic demand-validation pipeline (Source → Outreach → Content → Capture → Measure) that attaches to any `public.project`. Documented in `docs/marketing/README.md`.

- **Migration `20260601000000_marketing_validation_engine.sql`** — 6 enums (`mkt_funnel_mode`, `mkt_validation_status`, `mkt_channel`, `mkt_outreach_status`, `mkt_signal_type`, `mkt_content_status`) + 11 tables (`mkt_validation`, `mkt_prospect`, `mkt_source_run`, `mkt_campaign`, `mkt_sequence_step`, `mkt_outreach`, `mkt_content`, `mkt_landing`, `mkt_signal`, `mkt_event`, `mkt_suppression`). Every table FK'd to `public.project(id) ON DELETE CASCADE`; RLS on all (admin/manager full + project-member full); `updated_at` triggers; dedupe + due-work indexes.
- **`src/types/marketing.ts`** — enums, labels, row interfaces, and composite view types.
- **`/marketing` admin zone** — `page.tsx` (gated admin/manager), `actions.ts` (`listProjectsWithValidation`, `getValidation`, `enableValidation`, `updateValidation`), `_components/MarketingShell.tsx` (project list + enable-validation).
- **Sidebar** — added "Marketing" nav (Operations group, admin/manager) + `MegaphoneIcon`/`RocketIcon`/`GlobeIcon` to the icon catalog.
- **Middleware (`src/proxy.ts`)** — added `/m` public-zone allowlist so landing pages render for anonymous prospects while `/marketing` stays gated.
- Public capture/landing reads will use the service-role client server-side — no anon RLS policies exposed.

## [2026-05-04] — Delete version button on SOPs and Docs/Playbook

**SOPs page (`SopEditor.tsx`, `sops/actions.ts`, `types/sops.ts`, `sops/page.tsx`)**
- Added `deleteVersion` server action that removes a `sop_version` row by ID.
- Added `created_by` field to `SopVersion` type; updated versions select query to fetch it.
- Added trash icon button to the editor toolbar (between version selector and "Update current version"). Visible only to admins, managers, and the version creator.
- Clicking trash opens an inline confirmation modal ("Delete version? ... This cannot be undone."); on confirm, the version is deleted and the editor switches to the next available version.

**Docs/Playbook page (`PlaybookEditor.tsx`, `docs/actions.ts`, `PlaybookTab.tsx`)**
- Added `deletePlaybookVersion` server action.
- Added `isAdminOrManager` prop to `PlaybookEditor`; passed from `PlaybookTab`.
- `canDeleteVersion` computed as `isAdminOrManager || version.created_by === currentUserId`.
- Same trash icon + confirmation modal pattern as SOPs, placed right before "Update current version" in the toolbar.

## [2026-05-04] — Import Tasks: hours unit fix + milestone prefix strip

**`src/app/projects/actions.ts`**
- Bug: AI prompt instructs hours→minutes conversion (`"4h" → 240`), but `project_task.estimated_time` stores hours. Imported tasks displayed values 60× too large (e.g. 240 instead of 4 in the EST. (H) column). Fixed by dividing `estimated_time_minutes` by 60 when writing milestone and task rows.
- Bug: AI-parsed milestone names included a leading `"Milestone N:"` prefix copied from the source HTML, but the table renderer auto-prepends `Milestone {idx}:`, producing `"Milestone 1: Milestone 1: Core Infrastructure…"`. Added `stripMilestonePrefix()` to remove the leading prefix before insert.

## [2026-05-04] — Platform-aware Milestones, Import Task Aggregates, Named Prompts

**Milestones platform picker (`MilestonesAndTasksStep.tsx`, `sandbox-planner/actions.ts`)**
- Clicking "Regenerate" now opens an inline modal asking whether the project targets **Bubble** or **Claude Code** — each uses a separate DB prompt with platform-appropriate time estimates.
- Updated DB prompt `9bfb8337-25ca-4259-a6e9-da15cb3bea55` → "Project Milestones & Tasks (Bubble) Prompt" with Bubble.io time guidance and 3 standard tasks appended to every milestone: Client Requests (Developer) 4h, QA Requests (Developer) 6h, QA Requests (QA Tester) 6h.
- Inserted new DB prompt `c1d2e3f4-0001-4000-8000-000000000001` → "Project Milestones & Tasks (Claude Code) Prompt" for TypeScript/Next.js AI-assisted stacks.
- `triggerAiGeneration` accepts an optional 4th `platform` param; auto-trigger defaults to `"bubble"`.

**Import tasks → project aggregate fields (`src/app/projects/actions.ts`)**
- `importTasksFromIdea` now correctly populates `project.client_developer_estimated_time`, `project.qa_developer_estimated_time`, and `project.qa_tester_estimated_time` (stored in hours) by summing matched special tasks after the insert loop.
- `ParsedTask` gained a `task_type` field (`client_requests | qa_developer | qa_tester | developer_tasks`); new prompt `c1d2e3f4-0002-4000-8000-000000000001` ("Create Milestones & Tasks from an idea into a Project") returns this field. Name-based fallback included for robustness.
- Added `resolveTaskDbType()` to map `task_type` / task name to DB `type` column values (`client_requests`, `qa_requests`, `developer_tasks`).
- `IMPORT_TASKS_PROMPT_ID` updated to `c1d2e3f4-0002-4000-8000-000000000001`.

**Playbook prompt rename (`src/app/docs/actions.ts`)**
- Inserted DB prompt `c1d2e3f4-0003-4000-8000-000000000001` → "Create Playbook from an idea into a Project".
- `PLAYBOOK_PROMPT_ID` updated to `c1d2e3f4-0003-4000-8000-000000000001`.

## [2026-05-04] — Prompt DB for Import Tasks & Create Playbook, Gemini AI fallback fix

**"Create Milestones and tasks into a project" prompt (Supabase + `src/app/projects/actions.ts`)**
- Inserted new row in `prompt` table (UUID `b2c3d4e5-0001-4000-8000-000000000001`) under group "SandBox Planner".
- `importTasksFromIdea` now fetches the prompt text from DB via `getImportTasksPrompt()` with fallback to hardcoded constant if DB is unreachable.
- Admins and managers can now edit this prompt live via the Prompts page.

**"Create Playbook" prompt + AI generation (`src/app/docs/actions.ts`, `src/lib/api/ai-dispatcher.ts`)**
- Inserted new row in `prompt` table (UUID `b2c3d4e5-0002-4000-8000-000000000001`) under group "SandBox Planner".
- `buildPlaybookFromIdea` now calls AI (via `generateAiTextResponse`) with the DB prompt + compiled idea HTML to produce a polished playbook. Falls back to raw HTML compilation if no AI config is available.
- Added `generateAiTextResponse` to `ai-dispatcher.ts` routing to each provider's text generation function.

**Claude "credit balance too low" fix**
- Root cause: user `douglas.epr@hotmail.com` had `use_agency_settings = true`, forcing all AI calls through the agency's Claude key (which has no credits), ignoring their own valid Gemini key.
- Fix: set `use_agency_settings = false` for that user so their personal Gemini config is used.

## [2026-05-04] — Sidebar groups, Sandbox Planner UX, AI gate fix, Theme persistence, SOP creator access

**Sidebar reorganization (`src/components/layout/Sidebar.tsx`)**
- Split sidebar nav into 4 labeled groups: Workspace, Collaboration, Operations, Administration.
- Labels appear in expanded mode; dividers in collapsed mode. Groups are dynamically rendered from a `GROUPS` config array.

**Sandbox Planner UX (`IdeasGrid.tsx`, `CreateIdeaModal.tsx`, `SandboxPlannerShell.tsx`, `sandbox-planner/page.tsx`)**
- Cards are now fully clickable (no separate "See Refinement" button).
- Edit/delete icons hidden until hover; "General Ideas" filter now correctly excludes ideas with a `project_id`.
- Edit modal locks inputs/hides Save for users who are not admin, manager, or idea creator.
- AI gate no longer shows the "Configure AI" popup when `use_agency_settings = true` and the agency has a valid key configured.

**Theme persistence (`ThemePicker.tsx`, `settings/actions.ts`, `settings/page.tsx`, `SettingsShell.tsx`, `ThemeProvider.tsx`)**
- Removed "System" option — theme is now Light or Dark only.
- New `saveTheme` server action updates `profiles.theme` (enum: `light | dark`) on every toggle.
- Settings page reads `profile.theme` from DB on load and seeds `ThemePicker` for cross-device sync.
- Migration `20260504000001_profile_theme_and_sop_created_by.sql` adds the `theme` column + enum.

**SOP creator access (`sops/actions.ts`, `sops/page.tsx`, `SopList.tsx`, `SopModal.tsx`, `types/sops.ts`)**
- `createSop` now sets `created_by: user.id`; initial `sop_version` also sets `created_by`.
- `SopWithTags` type includes `created_by`.
- Edit/delete icons hidden from users who are neither admin/manager nor the SOP creator.
- SOP modal hides "Authorized User Types" and "Authorized Users" sections for non-admin/manager users.
- RLS policy "sop: creator manage own" (applied in migration above) grants full CRUD to creators.

**Sidebar Workspace label (`Sidebar.tsx`)**
- Added "WORKSPACE" section label so all 4 groups (Workspace, Collaboration, Operations, Administration) are labeled consistently in expanded mode.

**Visual Styles error toast bug (Sandbox Planner)**
- Root cause: Turbopack was serving a stale `[app-client]` bundle that had old module-export snapshots. The auto-trigger in `useAutoTriggerAi` relies on `{ silent: true }` to suppress error toasts on background AI calls; a stale bundle could serve the hook without that flag, causing error toasts to fire on every page load.
- Fix: cleared the `.next` cache directory and restarted the dev server to force a clean recompile. The `saveTheme` Turbopack export error was the same root cause.

---

## [2026-05-03] — Playbook resolved-comment paint() fix (root cause)

**Bug:** Resolved comments still showed the yellow highlight on the playbook even when "Hide resolved comments" was active. Confirmed in DB that the spans had the correct `data-comment-id` pointing to a `status='solved'` row, but the spans never had `data-status="solved"` painted onto them — so the CSS rule that hides solved highlights never matched.

**Root cause:** The `paint()` `useLayoutEffect` early-returned when `editorRef.current.getEditor()` returned null, and never ran again. TipTap's `useEditor` is configured with `immediatelyRender: false` in `RichTextEditor.tsx`, so the editor instance is null on the first render and only becomes available asynchronously. The effect's deps `[allComments, activeVersion.id]` don't change after that, so we never re-attempted the attach — `paint()` was never called and no `data-status` attribute was ever stamped.

**Fix:** `PlaybookEditor.tsx` `useLayoutEffect` now polls on `requestAnimationFrame` until the editor is non-null, then runs the initial `paint()` and registers the `transaction` listener. Cleanup correctly cancels the poll, the painted-frame, and detaches the listener.

**Build:** `npm run build` passes (after clearing `.next` to dodge a Windows file-lock from the running dev server).

---

## [2026-05-03] — Agreement preview + auto-complete, Visual Styles prompt fix, playbook resolved-comment hardening

**Agreement eye-icon → Preview modal with signatures (`AgreementsTab.tsx`, `DocumentPreviewModal.tsx`)**
- The eye/view button on each agreement row now opens the lightweight `DocumentPreviewModal` directly instead of the heavier `AgreementDrawer` details panel.
- Extended `DocumentPreviewModal` with an optional `signatures` prop. When provided, it renders a printable Signatures section (one card per required signer with avatar, signature image / "Awaiting signature" placeholder, signed-at timestamp) below the document body.
- The Signatures section is included in BOTH the on-screen preview and the PDF / DOCX exports (the helper builds the same HTML used in the preview surface and appends it to the html2canvas-captured node + the html-docx-js export string).
- `AgreementsTab` keeps the pencil icon → `AgreementFormModal` (edit) flow unchanged.

**Auto-complete agreement when all signers have signed (`supabase/migrations/20260503000001_agreement_auto_complete_trigger.sql`, applied)**
- New `BEFORE INSERT OR UPDATE` trigger on `project_agreement_version` that flips `status` to `completed` whenever the row is in `ready_to_sign` AND every UUID in `required_signers` is contained in `signed_by` — independent of how the row was updated. Until now the auto-complete logic lived only inside the `sign_agreement` RPC, so any other update path (admin tool, direct SQL, future migrations) left the status stuck.
- Includes a one-shot backfill so existing rows that already meet the invariant are flipped to `completed`.

**Visual Styles AI prompt — DB record refreshed**
- The DB row for prompt id `26989cc8-37f7-4df3-a994-57930a6d20ea` (`Visual Styles Prompt` in `prompt_group="SandBox Planner"`) was the OLD short version (945 chars) that did not instruct the LLM to fill `brand_voice`, `iconography_style`, or `motion_principles`. Updated in-place via `mcp__supabase__execute_sql` to the full 2868-char prompt that requires every design-system field.
- `compileIdeaToPlaybookHtml` in `docs/actions.ts` (used by the "Build from Sandbox idea" button on the Playbook tab) now surfaces all the new style fields: Brand Voice, Iconography Style, Motion Principles, plus structured Color System (quick palette + color tokens), Typography scale, Spacing, Border Radius, and Shadows tables.

**Playbook resolved-comments toggle hardening (`PlaybookEditor.tsx`, `CommentMarkExtension.ts`)**
- `paint()` is now in `useLayoutEffect` (was `useEffect`) so `data-status` lands on every comment span before the browser commits the first frame — eliminates the brief flash where solved comments showed their pending highlight on initial mount.
- The CommentMark click handler now JS-checks both `data-status="solved"` on the span AND `data-hide-resolved="true"` on the wrapper before dispatching the click event, so resolved comments cannot trigger the thread panel even if CSS `pointer-events: none` is overridden.
- Default `showResolved = false` is preserved (was already correct in `PlaybookTab.tsx`).

**Build:** `npm run build` passes with 0 errors. Migration applied to live DB.

---

## [2026-05-03] — Read-only project modal, Main Tasks rename + unread badges, Theme moved to Settings, instant email change

**Project modal read-only for non-admin/manager (`src/app/projects/_components/modals/ProjectModal.tsx`)**
- New optional `userType` prop. Computed `canEdit = userType === "admin" || userType === "manager"`.
- All inputs (Name / Status / Authorized Users / Program / Stage / Estimated Time / Real Time / Estimated Dates / Toggles / Description) become disabled / read-only when `!canEdit`.
- The four financial fields are hidden entirely from non-admin/manager: **Total Price ($)**, **Recommended by**, **Dev or Agency Owner who recommended this project**, **Commission (%)** — plus the Client + Commission branch.
- Save button hidden in the footer; Close remains so the user can dismiss the modal.
- Threaded `userType` through both call sites: `ProjectsList.tsx` and `ProjectDetail.tsx`.

**Main Tasks tab rename + unread bubbles (`src/types/projects.ts`, `ProjectDetail.tsx`, `tabs/DeveloperTasks.tsx`)**
- Renamed `TAB_LABELS.developer` from "Developer Tasks" → **"Main Tasks"**.
- `ProjectDetail` now sums the unread comments on `developer_tasks` rows and surfaces the count as the red badge next to the Main Tasks tab.
- `DeveloperTasks` accepts `unreadByTaskId` and renders a per-row red bubble next to every milestone name and every task name. Collapsed nodes show the rolled-up subtree count (`unreadAggregate(taskId)` walks `byParent` recursively); expanded nodes show only their own unread, since their children render their own badges.

**Theme moved from sidebar to settings (`src/app/settings/_components/ThemePicker.tsx` new, `Sidebar.tsx`, `SettingsShell.tsx`)**
- New `ThemePicker` client component (Light / Dark / System segmented control with a description tooltip).
- Removed the Theme block from the Sidebar's user menu popover (the popover now contains only Profile + Sign out).
- Added a "Theme" section to `SettingsShell` between Account and the Agency editors.

**Instant email change (`src/app/settings/actions.ts`, `_components/AccountSecurityForm.tsx`)**
- Replaced the "send confirmation link" flow with a 3-input form: **new email**, **current password**, **confirm current password**.
- Server action `updateAccountEmail(newEmail, currentPassword, confirmCurrentPassword)`:
  1. Validates email format and password fields match.
  2. Re-authenticates with `auth.signInWithPassword` to prove identity.
  3. Calls `auth.admin.updateUserById(user.id, { email, email_confirm: true })` via the **service-role client** so the change is committed immediately, no confirmation link to the new address.
  4. Mirrors the new email to `profiles.email`.
- Form shows a "Passwords don't match" inline check + show/hide toggle on the password fields.

**Build:** `npm run build` passes with 0 errors.

---

## [2026-05-02] — Hover sidebar, mark-viewed RPCs, chat-tab pre-fetch, Slack-style chat

**🔴 Mark-viewed RPCs (`supabase/migrations/20260502000001_chat_mark_viewed_rpcs.sql`, applied)**
- Created the 8 chat `mark_*_messages_viewed` / `mark_*_thread_viewed` `SECURITY DEFINER` SQL functions that the chat actions have been calling for weeks. Until today **none of these existed in the database** — every `markConversationViewed` and `markThreadViewed` call was silently failing with "function does not exist", so `viewed_by[]` was never being updated and the unread count never decreased ("12 instead of 10" bug).
- `markConversationViewed` and `markThreadViewed` in `src/app/chat/actions.ts` now `console.error` on RPC failure so future regressions surface in server logs.

**🟠 Tab badges on conversation load (`src/app/chat/actions.ts` + `ConversationPane.tsx`)**
- New server action `getProjectChatTabCounts(projectId)` returns the four numbers the Client Requests / QA Requests tabs need (open + unread for each) in a single call.
- `ConversationPane` pre-fetches these the moment a conversation loads, so the blue + red bubbles render on the first paint instead of only after the user clicks the tabs. The kanban-wrapper polling (every 2s) continues to refresh the same state.

**🟠 Hover-to-expand sidebar (`src/components/layout/SidebarContext.tsx`, `Sidebar.tsx`, `PageShell.tsx`)**
- `SidebarContext` now models two independent states — `pinned` (user clicked the toggle, layout reserves 232px) and `hovered` (transient mouse-over, sidebar widens as an OVERLAY without shifting main content). Every page starts collapsed; user pin choice persists in `localStorage` (`move37:sidebar-pinned`).
- 150ms close delay on `mouseleave` so the sidebar doesn't snap shut when the cursor crosses a sub-element.
- Removed the now-redundant `defaultSidebarCollapsed` prop from `PageShell` + `chat/page.tsx` + `sandbox-planner/page.tsx`.

**🟡 Slack-style chat redesign**
- `MessageList` computes a `grouped` flag for each message (same author + within 5 min of previous). Grouped follow-ups render compactly: no avatar, no name/timestamp, just the body — the timestamp surfaces on hover in the left rail.
- `MessageItem` gets a hover toolbar pinned in the top-right (Reply / Edit / Delete) using canonical icons, a Slack-style thread chip (`MessageIcon` + count + unread pill), and tightened typography (13.5px name, 14px body, 11px meta).
- `MessageComposer` is now a single rounded card around the textarea + action row; circular send button switches to `bg-accent` when there's something to send. All inline `<svg>` replaced with `AttachmentIcon` / `SendIcon` / `CloseIcon`.
- `ConversationsSidebar` density tightened: 28px row height, 13px text, filled-accent active state with white text, 10.5px section labels, canonical block icons (`BriefcaseIcon`, `LockIcon`, `FolderIcon`, `UserIcon`, `SparkleIcon`).
- All four list components (`ProjectsList`, `ProjectsInternalList`, `InternalProjectsList`, `PrivateList`, `ChatbotList`) updated to the new dense-row pattern with the active state bleeding through to the row's icon/avatar.
- `ConversationPane` header slimmed to 48px (`h-12`), title in `font-display`.

**Migration applied to live DB:** `chat_mark_viewed_rpcs` (Supabase MCP `apply_migration`).
**Build:** `npm run build` passes with 0 errors.

---

## [2026-05-01] — UI/UX polish + collapsible sidebar + unread-count fix + account security

**Stages Checking redesign (`src/app/projects/_components/tabs/StagesChecking.tsx`)**
- Replaced hand-rolled hex pills with a refined editorial timeline view that uses design-token classes (`status-badge`, `text-text-*`, `bg-surface`, `border-border`).
- Added a slim progress rail showing `done / total` and a percentage, plus a per-row index, semantic timeline dots (success / accent / danger / muted), and contextual hover states.

**Tab badge alignment (`ProjectDetail.tsx` + `chat/_components/TabMenu.tsx`)**
- Replaced the absolute-positioned blue badge (top-right) + stacked red badge (below text) with an inline cluster: label first, then the open count (info-blue) + unread count (danger-red) side-by-side. Badges no longer overlap adjacent labels.
- Both badges use design tokens (`bg-info`, `bg-danger`) and have hover tooltips ("3 open" / "3 unread").

**Collapsible sidebar (`src/components/layout/SidebarContext.tsx` + `Sidebar.tsx` + `PageShell.tsx`)**
- New `SidebarProvider` + `useSidebar()` hook drives a `--sidebar-width` CSS variable (60px collapsed / 232px expanded). User preference persists in `localStorage` and survives reloads.
- New toggle button in the sidebar header (`PanelLeftClose` / `PanelLeftOpen`). Collapsed state hides labels, the "Settings" group label, and the user-row name/role; only icons + avatar remain. Tooltips fall back to the label.
- `defaultSidebarCollapsed` prop on `PageShell`; set on `/chat` and `/sandbox-planner` so those second-column-heavy pages start in icon-only mode.

**Unread count formula (`src/app/chat/actions.ts` `unreadByScope`)**
- For `projects` and `projects_internal` blocks, the chat list bubble now also counts unread `project_task_comment` rows whose task type is `client_requests` or `qa_requests` on the same project.
- Single extra SELECT with an inner join filter on `project_task.type`; no app-layer N+1.

**Account security on Settings (`src/app/settings/_components/AccountSecurityForm.tsx` + `actions.ts`)**
- New "Account" section at the top of the Settings page with two sub-forms:
  - **Email** — calls `supabase.auth.updateUser({ email })`; mirrors to `profiles.email`. Supabase sends a confirmation link to the new address before the change takes effect.
  - **Password** — re-authenticates with the user's current password before calling `auth.updateUser({ password })`. Min length 8, plus a "passwords don't match" inline check and a show/hide toggle.

**Build:** `npm run build` passes with 0 errors.

---

## [2026-05-01] — Security hardening: auth gaps and data-leak fixes

**Vulnerabilities fixed (full security audit conducted):**

- **CRITICAL `src/app/prompts/actions.ts`** — `getPromptGroups()` now enforces admin/manager role check before using the service-role Supabase client. Previously any authenticated user could call this action and bypass RLS to read (and via other functions, modify) the entire AI prompt library.
- **HIGH `src/app/chat/actions.ts`** — Removed `signature` field from the bulk profiles select in `loadChatContext`. Signatures (handwritten/base64) were being returned to all chat participants including `client` and `qa` roles. Now only `id, first_name, last_name, picture, type` are returned — matching the documented app intent in `CLAUDE.md`.
- **MEDIUM `src/app/projects/actions.ts`** — Added `auth.getUser()` guard to `createProject`, `updateProject`, `deleteProject`. RLS already blocked unauthorized operations but the app layer now returns `"Not authenticated"` early.
- **MEDIUM `src/app/sandbox-planner/actions.ts`** — Added `auth.getUser()` guard to `updateIdea`, `deleteIdea`, `clearAiWorking`.
- **MEDIUM `src/app/sops/actions.ts`** — Added `auth.getUser()` guard to `createSop`, `updateSop`, `deleteSop`.
- **MEDIUM `src/app/feedback/actions.ts`** — Added `auth.getUser()` guard to `updateFeedback`, `deleteFeedback`.
- **MEDIUM `src/app/docs/actions.ts`** — Added `getUserIdOrError()` auth guard to `savePlaybookVersion`, `editPlaybookComment`, `deletePlaybookComment`, `setPlaybookCommentStatus`.

**False positives ruled out during audit:**
- Gemini URL-based API key: Google's REST API requires this; URL is constructed server-side and never reaches the browser.
- `.env.local` in git: confirmed not committed (`git log` returned empty).
- CSRF: Next.js Server Actions enforce same-origin via `Origin` header.

**Build:** `npm run build` passes with 0 errors.

---

## [2026-05-01] — RLS hardening, tab badge UX, and Design System expansion

**RLS migrations (5 applied):**
- `20260501000001` — `profiles`: project co-member read policy (developers/QA/clients can see co-project member profiles; `signature` never exposed via app layer)
- `20260501000002` — `project_task`: developer INSERT/UPDATE/DELETE; client INSERT/UPDATE `client_requests` + DELETE own; QA INSERT/UPDATE `qa_requests` + DELETE own
- `20260501000003` — `idea_styles`: replaced open `FOR ALL USING (true)` with admin/manager ALL + creator ALL + project-member read-only
- `20260501000004` — `feedback`: changed from any-auth read-all to role-based (admin/manager/operational see all; others see own)
- `20260501000005` — `idea_styles`: added 13 new columns for full design system (color tokens, typography, spacing, border radius, shadows, narrative fields)

**Task ownership & CRUD:**
- `projects/actions.ts` `createTask` now sets `created_by: user.id` on every insert
- `TasksKanban.tsx`: delete button only shown for admin/manager or task owner (`created_by === currentUserId`)
- `Task` type and `project_task` page query now include `created_by`
- `supabase/types.ts`: added `internal_project_assignees` table type (was missing, caused TS error)

**Tab badge redesign (Projects + Chat pages):**
- Status count bubble changed from `bg-red-500` → `bg-blue-500` (blue = actionable items)
- New red badge below each tab text showing unread `project_task_comment` count per tab type
- `ProjectDetail.tsx`: `clientUnread`/`qaUnread` computed from `unreadByTaskId + tasks`; tab buttons now flex-col to stack label + red badge
- `TabMenu.tsx`: accepts `tabBlueBadge` and `tabRedBadge` props; renders blue absolute top-right badge + red below-text badge
- `ConversationPane.tsx`: adds badge state with `useCallback`-stable `onCounts` callbacks passed to `ClientRequestsTab`/`QARequestsTab`
- `TaskRequestsKanbanWrapper.tsx` + `QARequestsTab.tsx`: compute and emit `(blue, red)` counts on every data load via `onCounts` ref

**Design System expansion (`idea_styles`):**
- `src/types/sandbox-planner.ts`: new sub-interfaces `ColorToken`, `TypographySystem`, `SpacingSystem`, `BorderRadiusSystem`, `ShadowToken`; `IdeaStyles` updated with all 13 new fields
- `src/lib/api/json-converters.ts`: `VisualStylesOutput` expanded with full design system fields
- `sandbox-planner/actions.ts`: `saveStyles` accepts all new fields; `generateVisualStylesContent` maps full payload; `FALLBACK_VISUAL_STYLES` prompt instructs AI to return complete design system JSON
- `VisualStylesStep.tsx`: complete redesign with 6 structured sections: Brand Identity, Color System (pickers + token grid + narrative), Typography (font preview + scale table), Spacing & Layout (visual bars + border radius previews), Elevation (shadow cards), Motion & Iconography
- `AiLoadingOverlay.tsx`: `visual_styles` step labels updated to match new sections

## [2026-04-30] — Icon migration: all hand-rolled SVGs replaced with canonical catalog icons

**Icon sweep (Phase D.2–D.7):**
- `InternalProjectsList`, `InternalProjectKanban`, `InternalProjectModal`, `InternalTaskModal`, `InternalTaskChat`, `AssigneePicker` — all inline `<svg>` replaced with `SearchIcon`, `AddIcon`, `EditIcon`, `DeleteIcon`, `ChevronDownIcon`, `ChevronRightIcon`, `CloseIcon`, `CheckIcon`, `AttachmentIcon`, `SendIcon`, `FileIcon` from `@/components/ui/icons`.
- `UsersList` — search, add-user, empty-state, and delete SVGs replaced.
- `LeadsShell` — search, add-lead, edit, delete, email, and LinkedIn link SVGs replaced.
- `OkrsShell` — expand chevron replaced with `ChevronRightIcon`.
- `GoalModal`, `KeyResultModal` — close and status-dropdown chevrons replaced.
- `KeyResultsTracker` — checkmark and delete SVGs replaced.
- `SopList` — add, filter, edit, delete SVGs replaced.
- `SopEditor` — version dropdown chevron and save/update SVGs replaced.
- `sops/page.tsx` — empty-state SVG replaced with `DocumentIcon`.
- `TalentPoolShell` — search, add, sliders SVGs replaced.
- `TalentRow` — share, edit, delete SVGs replaced.
- `SkillRowsEditor` — delete and dropdown chevron SVGs replaced; check mark replaced.
- `MultiChipSelect` — dropdown chevron SVG replaced.
- `TypeaheadPicker` — clear and check SVGs replaced.
- `RecommendedProjectsShell` — search and image-placeholder SVGs replaced.
- Zero new TypeScript errors introduced.

## [2026-04-30] — App-wide UI/UX standardization (design system rollout)

**Foundation (Steps 0–2):**
- `globals.css` rewritten with design tokens (`--accent`, `--bg-base`, `--sidebar-width: 232px`, etc.), CSS utilities (`.btn`, `.input`, `.card`, `.badge`, `.kpi`, `.skeleton`, `.fade-up`), progressive type scale, and soft shadow tokens. No gradients anywhere.
- `layout.tsx` now loads Inter (body) + Manrope (display) via `next/font`.
- `src/components/ui/` library created with 14 primitives: `icons.ts` (lucide-react catalog), `Avatar`/`AvatarStack`, `Button`, `IconButton`, `Input`, `Textarea`, `Select`, `Badge`, `StatusBadge`, `NotificationDot`, `Card`/`CardHeader`/`CardBody`, `EmptyState`, `Skeleton`, `Modal`/`Drawer`/`ConfirmDialog`, `Tabs`, `UserMultiSelect`, `Toolbar`, `DataTable`, `KpiCard`, plus barrel `index.ts`.
- `PageShell` + `PageHeader` layout primitives replace the hand-rolled `<Sidebar>+<main className="ml-[220px]">` boilerplate on every page.
- `Sidebar` refactored: lucide icons (no hand-rolled SVGs), nav grouped into "operational" / "settings" sections, 2 px accent left-edge bar on active item, `Avatar` primitive for user row.

**Page migrations (Step 3):**
- **Dashboard** — `PieChart` (projects by status) replaced with horizontal `BarChart` (VibeUX 6.3: no pie charts). `AreaChart` with `linearGradient` fills replaced with `LineChart` (VibeUX 1.6: no gradients). Local `KpiCard` replaced with canonical import. `PageShell` wrapper.
- **Projects** — toolbar `Input`/`Select`/`Button` primitives; `IconButton(EditIcon)`/`IconButton(DeleteIcon)` replace inline SVG edit/delete buttons; `EmptyState` replaces custom empty; `UserMultiSelect` replaces `UserPicker` in `ProjectModal`; `PageShell` + `PageHeader`.
- **OKRs** — `IconButton(EditIcon)`/`IconButton(DeleteIcon)` replace 4 bespoke SVG pencil/trash buttons (goal + KR rows). This is the exact inconsistency shown in the user's screenshot.
- **SOPs** — `UserMultiSelect` replaces `AvatarMultiPicker` in `SopModal`. `PageShell fullBleed` wrapper.
- **Internal Projects** — `UserMultiSelect` replaces `AssigneePicker` in both `InternalProjectModal` and `InternalTaskModal`. `PageShell` wrapper.
- All 16 pages migrated from `<div h-screen><Sidebar/><main ml-[220px]>` → `<PageShell profile={...}>`.

**Sweep (Step 4):**
- Zero direct `lucide-react` imports outside `src/components/ui/icons.ts`.
- Zero `Sidebar` imports in `src/app/` pages (all use `PageShell`).
- Zero hardcoded `ml-[220px]` in `src/app/` — all use CSS variable `--sidebar-width` via `PageShell`.

## [2026-04-30] — Supabase standardization (Part 2 of huge refactor)

48 schema items applied across 7 numbered batches (B1, B3-B12). Each
batch shipped its own migration + cascading code sweep + types regen.

**B1 — Drop `audit_log`** (item 1). Table removed; the chatbot's
fallback "tables you can query" list dropped the dead reference.

**B9 — ~28 additive `created_by`/`updated_at` columns** (items 5, 6,
16-27, 29, 30, 31, 32, 33, 35, 36, 37, 40, 41, 42, 43, 44, 46-48).
Single migration adds the columns idempotently, attaches the existing
`set_updated_at()` trigger to every new `updated_at`, and reuses the
`profiles(id)` FK pattern for `created_by` columns. No code changes —
existing INSERT statements get the new columns via DEFAULT.

**B4 — RLS tightening on talent / client / agreement_template family**
(items 4, 5, 6, 47, 48). `agreement_template`, `client`, `talent` are
now admin/manager/operational only (talent + client lost their
"own-row read" / blanket-admin-only redundant policies);
`client_who_referred_this_talent` and `talent_referred_by` gain a new
"code-present read" policy that exposes individual rows when
`code IS NOT NULL` so the referral magic-link flow keeps working
without leaking the rest of the table.

**B3 — `private_chatbot{,_message}` admin/manager/operational only**
(items 35, 36). New `is_staff_role()` SECURITY DEFINER helper. New
RLS policies replace the old "owner-only" ones with "staff role AND
own". Sidebar's `visibleBlocks(userType)` hides the ChatBot section
for client/qa/developer/referrer/lead.

**B12a — `feedback.project_id` optional** (item 10). Already nullable
in DB; UI now offers a "— No project —" option in `FeedbackFormModal`
and the submit gate switched from "project required" to "rating or
comment required".

**B11 — `sop.tags[]` array migration** (items 43, 45). New
`UUID[] NOT NULL DEFAULT '{}'` column on `sop`; data backfilled from
the legacy `sop_tags` join table; `sop_tags` dropped. `createSop` /
`updateSop` write the array directly; `sops/page.tsx` hydrates the
UUID[] into `{id, name}[]` for the existing UI.

**B10 — `task.assignees[]` array migration** (items 10, 28, 31, 34).
New `UUID[] NOT NULL DEFAULT '{}'` column on `task`; data backfilled
from `task_assignees`; join table dropped. `internal_task` already
had the array column. The `task` page-level fetcher hydrates the
UUID[] into the legacy `task_assignees: [{user_id, profiles}]` shape
client-side via a single profiles JOIN, so existing UI components
keep working unchanged.

**B5 — `user_ai_settings.user_id → owner_id`** (item 3). Column
renamed; RLS policy rewritten to use the new column. Sweep across
`src/app/settings/{page,actions}.ts`, `src/lib/api/ai-config.ts`,
`src/app/sandbox-planner/page.tsx`.

**B8 — Column renames across chat / task / time-track / chatbot
tables** (items 7-15, 29, 30, 32, 33, 38, 39, 42).
- `owner_id → created_by` on every chat message + thread + comment +
  chatbot table (13 tables).
- `owner_id → assignee_id` on `time_track` + `internal_task_time_track`.
- `owner_user_id → assignee_id` on `qa_time_track`.
- `edited_at → updated_at` on every chat message + thread + comment
  table (10 tables) + trigger attached.
- Dropped `is_daily_feedback` from the 4 message tables — daily
  feedback flows through `project_daily_feedback` now.
- Code sweep: `src/types/{chat,projects,internal-projects}.ts`,
  `src/app/{chat,projects,internal-projects}/**`,
  `src/app/chat/_components/**`, `src/app/chat/_chatbot/**`. The
  `PROFILE_SELECT` constant in `chat/actions.ts` switched from
  `profiles!owner_id` to `profiles!created_by` (PostgREST FK alias
  follows the column rename automatically).

**B7 — Task family table renames** (items 28, 29, 30, 31, 32, 33, 42).
- `task → project_task`
- `task_comment → project_task_comment`
- `time_track → project_task_time_track`
- `qa_time_track → project_qa_time_track`
- `internal_task → internal_project_task`
- `internal_task_comment → internal_project_task_comment`
- `internal_task_time_track → internal_project_task_time_track`
Code sweep done via a node script that handles the dependency order
(longer names first so `internal_task_time_track` doesn't get partially
rewritten). 9 files changed.

**B6 — Chat conversation table renames** (items 7, 8, 9, 10, 13, 14, 15).
- `external_conversation_project_message[_thread] → conversation_project_external_message[_thread]`
- `internal_conversation_project_message[_thread] → conversation_project_internal_message[_thread]`
- `private_conversation* → conversation_private*` (3 tables).
- New `updated_at` column on `conversation_private` (item 13).
- Realtime publication entries dropped under the old names + re-added
  under the new ones (Postgres doesn't support `ALTER PUBLICATION ...
  IF EXISTS`, so each is wrapped in a DO block that swallows
  `undefined_object`).
- `BLOCK_TABLES` in `src/types/chat.ts` updated; `chat/actions.ts`
  rewrites every direct `.from('private_conversation*')` reference.

**B12b + B2 — Prompt + AI keys server-only** (items 2, 40).
`run.ts::loadDbSystemPrompt` and `runProjectBot.ts::loadDbSystemPrompt`
now use `createServiceClient()` so the prompt loads consistently for
every signed-in user (including non-admins whose RLS would otherwise
block the read), but the raw text never crosses the browser boundary —
only the model's reply does. Existing audit confirms `prompt`/
`prompt_group` RLS is admin/manager-only and `agency_ai_settings` keys
are read server-side via service-role inside `resolveAiConfig`.

### Files
- 7 new SQL migrations under `supabase/migrations/20260430*_b{1,3,4,5,6,7,8,9,10,11,12a}_*.sql` (some merged — see `mcp__supabase__list_migrations` for the canonical list).
- `src/types/{chat,projects,internal-projects,settings}.ts` — type renames.
- `src/lib/supabase/types.ts` — regenerated three times.
- `src/lib/api/ai-config.ts` — `user_id → owner_id` filter rename.
- `src/app/chat/actions.ts` — most extensive: `BLOCK_TABLES` follow,
  `PROFILE_SELECT` rewrite, every chat/chatbot insert+select rewritten.
- `src/app/chat/_chatbot/{run,runProjectBot,tools}.ts` — service-role
  prompt loader; updated select strings; legacy `task_assignees`
  → `assignees @>` query for "list_my_tasks".
- `src/app/chat/_components/{MessageItem,MessageList,ThreadPanel,useRealtimeMessages}.tsx`
  — column-rename follow.
- `src/app/projects/{page,actions}.tsx` — task array hydration; QA +
  task_comment + time_track column renames.
- `src/app/projects/_components/modals/{TaskChat,QATimeTrackerModal,WorkingHoursModal}.tsx`
  — column rename follow.
- `src/app/internal-projects/{page,actions}.ts` + `_components/{InternalTaskChat,InternalTaskModal}.tsx` — same.
- `src/app/feedback/_components/FeedbackFormModal.tsx` — project optional.
- `src/app/sops/{page,actions}.ts` — `tags[]` array migration.
- `src/app/sandbox-planner/page.tsx`, `src/app/settings/{page,actions}.ts`
  — `user_ai_settings.owner_id` rename.
- `src/types/chat.ts::visibleBlocks` — chatbot section hidden for
  client/qa/developer/referrer/lead.

### Verification
- All 7 migrations applied via `mcp__supabase__apply_migration`.
- `information_schema.columns` probe confirms 44 `created_by` + 48
  `updated_at` columns across the schema, no surviving `owner_id` /
  `edited_at` / `owner_user_id` / `is_daily_feedback` columns on the
  renamed tables, and all 7 chat tables + 7 task tables under their
  new names.
- `npx tsc --noEmit` clean for every touched area; only 11 pre-existing
  errors remain (2 runtime-string `.from(table)` calls in
  `chat/actions.ts` + 9 references to a non-existent
  `internal_project_assignees` table in `internal-projects/{actions,page}.tsx`,
  unrelated to Part 2).
- Dev server (`localhost:3000`) hot-reloaded every edit; `/chat`,
  `/dashboard`, `/prompts`, `/settings` continue to serve 200s.

### What's NOT in Part 2 (deferred / spec ambiguous)
- **Item 28 / 31 — assignees[] CRUD UI** on the project + internal-project
  task modals. The DB column + write path are in place; the modal
  pickers still use the legacy `task_assignees` shape via the
  hydration. Building the new picker UI is an isolated UI change.
- **Item 30 / 33 / 42 — admin-overridable assignee on time-track
  inserts.** The DB columns are renamed (`assignee_id`); the UI still
  defaults the field to the current user. Admin/manager override
  picker isn't built yet.
- **Item 6 / 48 — "code-present" exposure for the linked client/talent.**
  RLS now opens the row when `code IS NOT NULL` for any authed user,
  but identifying "the right client" via `auth.uid()` requires a
  link table the schema doesn't have. The current rule is the
  permissive interpretation; a stricter version can land later when
  the identity link is decided.

## [2026-04-30] — Page-level access gates + sidebar visibility (Part 1 of huge refactor)

This is **Part 1 of a 60-item refactor** the user batched together. Part 2
(48 schema standardization items: `audit_log` drop, 8 table renames, ~25
new `created_by`/`updated_at` columns, ~10 field renames `owner_id` →
`created_by`, AI-key isolation server-side, `task_assignees` /
`sop_tags` join-table → array column migration, etc.) is queued for
follow-up turns since it'd realistically be 4–8h of focused work and
touches every server action in the repo.

**What landed today: every page-level role gate + sidebar visibility.**

### New shared helper

- NEW `src/lib/auth/page-gate.ts` exports `requirePageAccess(allowed)` and
  `redirectForRole(role)`. Single source of truth for "if a {role} hits a
  page they're not allowed on, where do they go?". Every gated page
  imports the helper instead of duplicating the auth + redirect chain.
  Three call shapes:
    - `requirePageAccess(["admin","manager"])` — allowlist
    - `requirePageAccess({ denyRoles: ["referrer"] })` — blocklist (for
      `/settings`)
    - `requirePageAccess({ allowAll: true })` — auth-only (for
      `/feedback`)
  Role → fallback page mapping mirrors the user's spec exactly:
    admin/manager → /dashboard,
    operational  → /internal-projects,
    developer/client/qa → /projects,
    referrer → /recommended-projects,
    lead → /sandbox-planner.

### Per-page gate fixes

| Page | Before | After |
|---|---|---|
| `/dashboard` | redirected non-admin/manager to `/sandbox-planner` regardless of role | role-specific redirects via the helper |
| `/sops` | NO server-side role gate (relied on RLS) | admin/manager/operational/developer/qa/client allowlist |
| `/okrs` | redirected to `/dashboard` | role-specific redirects |
| `/internal-projects` | redirected to `/dashboard` | role-specific redirects |
| `/recommended-projects` | missing `operational`; redirected to `/` | full allowlist + role-specific redirects |
| `/projects` | NO role gate; missing referrer/lead redirects | role-specific redirects |
| `/chat` | redirected to `/` | role-specific redirects via helper, defensive `CHAT_ALLOWED_ROLES` re-check kept |
| `/docs` | NO server-side role gate | admin/manager/operational/developer/qa/client allowlist |
| `/talent-pool` | redirected to `/` | role-specific redirects |
| `/leads` | redirected to `/dashboard` | role-specific redirects |
| `/users` | redirected to `/projects` | role-specific redirects (admin/manager only) |
| `/sandbox-planner` | NO role gate | admin/manager/operational/developer/client/lead allowlist |
| `/prompts` | redirected to `/projects` | role-specific redirects |
| `/settings` | NO referrer block | `denyRoles: ["referrer"]` + role-specific redirect |
| `/feedback` | unchanged behaviour | now uses `requirePageAccess({ allowAll: true })` for consistency |

### Sidebar — allowlist-driven

`src/components/layout/Sidebar.tsx` was using ad-hoc `if (item.href === …)`
filters that drifted from the page-gate spec. Rewrote `NAV_ITEMS` so each
entry carries an explicit `roles: SidebarRole[]` allowlist — the filter
becomes a single `roles.includes(role)`. Referrers still get the
condensed two-item nav (Dashboard pointing at `/recommended-projects` +
Feedback). `Prompts` and `Settings` were promoted from the old
`ADMIN_NAV_ITEMS` / `TRAILING_NAV_ITEMS` arrays into the main list with
their own role lists so the visibility rules live in one place.

### Verification

- `npx tsc --noEmit` shows zero new TS errors in any of the 14 touched
  pages, the sidebar, or the new helper. (The 6 lingering errors are
  pre-existing: `chat/actions.ts` runtime-string `.from()` pattern, and
  `internal-projects/{actions,page}.tsx` referencing the
  `internal_project_assignees` table that doesn't exist in the schema.
  Both pre-date this PR.)
- Dev server (`localhost:3000`) hot-reloaded all 14 page edits + the
  sidebar; `/dashboard`, `/chat`, `/prompts` continue to serve 200s.

### Part 2 — flagged for follow-up

The user's same message also asked for the 48-item Supabase
standardization pass. Those changes split cleanly into batches that
each take ~1h:

  - Drop `audit_log`, `task_assignees`, `sop_tags`
  - Move agency AI calls fully server-side, hide keys from non-admin
    frontends
  - `private_chatbot{,_message}` admin/manager/operational restriction +
    UI gating
  - Visibility tightening on `talent`, `client`,
    `talent_referred_by`, `client_who_referred_this_talent`,
    `agreement_template`
  - `user_ai_settings.user_id` → `owner_id`
  - 8 table renames (`external_/internal_conversation_project_message`
    [+ thread] → `conversation_project_external_/internal_message`,
    `private_conversation` family → `conversation_private`,
    `task` → `project_task`, `task_comment` → `project_task_comment`,
    `time_track` → `project_task_time_track`, `qa_time_track` →
    `project_qa_time_track`, `internal_task*` → `internal_project_task*`)
  - ~10 field renames (`owner_id` → `created_by`,
    `edited_at` → `updated_at`)
  - ~25 new `created_by` / `updated_at` columns
  - `assignees[]` array column on `project_task` + `internal_project_task`
    (replaces the dropped `task_assignees` join table) with full CRUD UI
  - `tags[]` array on `sop` (replaces `sop_tags`)
  - `feedback.project` made optional
  - Various assignee-field renames (`owner_user_id` → `assignee_id`)
    with admin/manager-only override editing
  - Backend prompt resolution (`prompt.description` never reaches the
    browser)

Each batch is a one-migration-plus-cascading-code-edits pass. I'll pick
them up in the next turn.

## [2026-04-29] — Agency record + agency-wide AI keys + Project chatbot prompt

Four coordinated changes that together let an agency pay for / share LLM
keys instead of asking every collaborator to bring their own:

**1. New `agency` table.** Singleton row holding `name`, `website`,
`created_by`, `created_at`, `updated_at`. RLS allows any authenticated
user to read (so the UI can show the agency name) but only `admin`
profiles can write. New "Agency" section under `/settings`, admin-only,
upserts via `saveAgencyInfo`.

**2. New `agency_ai_settings` table.** Same shape as `user_ai_settings`
minus the user FK — keyed on `agency_id`. RLS allows read+write only
for `admin` and `manager`; non-admins never see the keys client-side.
New "Agency AI Configuration" section under `/settings`, admin/manager-
only, reuses the generic `AiSettingsForm` via a thin
`AgencyAiSettingsForm` wrapper.

**3. New AI-key resolution chain in `src/lib/api/ai-config.ts`.**
`user_ai_settings` gains a `use_agency_settings BOOLEAN NOT NULL DEFAULT
TRUE` column. `resolveAiConfig` now:
- For `referrer` / `lead` profiles → personal-only path; if their keys
  aren't set the call returns `null` (no agency, no env fallback). The
  migration also forces the column FALSE for those rows so client-side
  reads + server-side resolution agree.
- For everyone else → if `use_agency_settings = FALSE` AND personal
  keys are set, use personal; otherwise read `agency_ai_settings` via
  `createServiceClient()` (RLS bypass — keys never reach the browser);
  otherwise fall back to `OPENAI_API_KEY` env. The user-facing toggle
  lives in `AiSettingsForm` ("Use my agency's AI keys"); the form
  collapses into a read-only summary built from a sanitized
  `getAgencyAiSettingsSummary()` action when ON. The form is also
  reused by the agency editor with `allowAgencyToggle={false}`.
- `saveAiSettings` server-clamps `use_agency_settings = false` for
  referrer/lead via the new `clampUseAgencyForRole` helper, so a
  crafted client request can't bypass the UI gate.

**4. New "Project chatbot prompt" row.** Until now, both the global
ChatBot and the per-project chatbot loaded the same `Chatbot prompt`
row under `prompt_group { name='Chat' }`. Migration seeds a second row,
`Project chatbot prompt`, with project-scoped guidance that mentions
the `create_client_request_task` / `create_qa_request_task` tools.
`runProjectBot.ts::loadDbSystemPrompt` now reads this row instead of
the global one. The existing admin/manager-gated `/prompts` page is the
edit surface — no UI change.

### Files
- NEW `supabase/migrations/20260429100000_agency_and_agency_ai_settings.sql`
- NEW `supabase/migrations/20260429110000_user_ai_settings_use_agency_toggle.sql`
- NEW `supabase/migrations/20260429120000_project_chatbot_prompt_seed.sql`
- NEW `src/app/settings/_components/AgencyForm.tsx`
- NEW `src/app/settings/_components/AgencyAiSettingsForm.tsx`
- MODIFIED `src/lib/api/ai-config.ts` — three-stage resolution + role
  gate + `clampUseAgencyForRole` helper.
- MODIFIED `src/app/settings/actions.ts` — `saveAiSettings` carries the
  toggle (and clamps for referrer/lead); new `getAgency`,
  `saveAgencyInfo`, `getAgencyAiSettings`, `saveAgencyAiSettings`,
  `getAgencyAiSettingsSummary`.
- MODIFIED `src/app/settings/page.tsx` — fetches profile + agency +
  per-user settings + agency-AI summary in parallel; passes role into
  `SettingsShell`.
- MODIFIED `src/app/settings/_components/SettingsShell.tsx` — three
  sections (Agency / Agency AI / your AI), each role-gated.
- MODIFIED `src/components/features/AiSettingsForm.tsx` — new agency
  toggle, read-only preview block, `allowAgencyToggle` +
  `agencySummary` props.
- MODIFIED `src/types/settings.ts` — `useAgencySettings` on the
  client/payload types; new `Agency`, `SaveAgencyInfoPayload`,
  `SaveAgencyAiSettingsPayload`, `AgencyAiSettingsSummary` types.
- MODIFIED `src/app/chat/_chatbot/runProjectBot.ts` — load
  `'Project chatbot prompt'` instead of `'Chatbot prompt'`.
- MODIFIED `src/app/sandbox-planner/page.tsx` — pass
  `useAgencySettings: true` default through the masked client settings.
- MODIFIED `src/lib/supabase/types.ts` — regenerated; surfaces `agency`,
  `agency_ai_settings`, and `user_ai_settings.use_agency_settings`.

### Verification
- All three migrations apply cleanly via `mcp__supabase__apply_migration`.
- `SELECT 1 FROM agency, agency_ai_settings, prompt p JOIN prompt_group
  g ON g.id=p."group" WHERE g.name='Chat' AND p.name='Project chatbot
  prompt'` confirms the new tables and seed row.
- Existing pre-toggle users have `use_agency_settings = FALSE` after
  the backfill (so they don't suddenly switch to agency keys); referrer
  / lead rows are forced FALSE.
- `npx tsc --noEmit` clean for every touched area
  (`src/{app/(settings|chat/_chatbot|sandbox-planner|projects)|lib/api/ai-config|types/settings|components/features/AiSettingsForm}`).
- Dev server (`localhost:3000`) hot-reloaded every edit; `/dashboard`,
  `/chat`, `/prompts`, `/settings` continue to serve 200s.

## [2026-04-29] — `/dashboard` redesign + SOP modal polish

Two manager-facing fixes:

**`/dashboard` — mission-control redesign.** The first cut shipped
yesterday but (a) skipped the global Sidebar shell, so the page floated
without nav, and (b) was too flat for a "company health" landing.
Today's pass:

- Wraps every `/dashboard` view (root + the three drill-downs) in the
  same `<Sidebar profile={profile} /><main ml-[220px]>` shell that
  `/projects/page.tsx` uses.
- Rebuilds the root view as a four-row "mission control" layout:
  1. **KPI strip (4 cols)** — Revenue (current month) · Profit · Active
     projects · KR achievement % — each with a delta line vs last
     month and a subtle indigo/emerald gradient bar at the top.
  2. **Revenue trend (8 cols) + Project status donut (4 cols)** — the
     trend is a 6-month area chart with stacked Revenue/Profit gradient
     fills via recharts; the donut renders project counts by status
     with a centered "Active = N" label and a 7-row legend underneath.
  3. **Recent KRs (6 cols) + Internal projects status grid (6 cols)** —
     KR list shows the 5 most-recently-updated KRs with status pill +
     achieved dot + current value; IP grid renders 6 status cells with
     count + share bar.
  4. **Active projects · hours estimated vs real** — horizontal grouped
     bar chart, top 8 by burn ratio, with a custom tooltip that
     highlights over-budget burn in rose vs emerald.
- Header replaces the cold "Dashboard / Company-wide health" with a
  time-of-day greeting ("Good afternoon, Douglas") + today's date and
  a green "Live · refreshes on reload" pill.
- Empty states now read like sentences ("No invoices recorded for May
  yet") instead of just "0".
- New server fetchers in `_lib/queries.ts`:
  `loadRevenueTrend()` (six-month bucketed revenue+profit),
  `loadActiveHours()` (estimated vs real hours per active project,
  sorted by burn), `loadKrHighlights()` (top-5 most recent KRs).

**SOP edit modal — UX tidy-up.**
- The "Didn't find the tag? Create one now" link now sits **below**
  the existing tag pills (was above). Less visual noise; users only
  reach for it after scanning the actual options.
- "Authorized Users" is now the avatar-circle multipicker pattern used
  in `/internal-projects` — clickable avatars (× on hover to remove),
  dashed "+" disc to open a dropdown panel listing every user with
  their avatar + name. Replaces the previous text-pill row + bare
  `<select>` dropdown.
- New shared component `src/components/AvatarMultiPicker.tsx` so
  future modals get the same UX for free.

### Files
- MODIFIED `src/app/dashboard/page.tsx` (Sidebar wrapper + viewerName
  prop pass-through).
- MODIFIED `src/app/dashboard/_lib/queries.ts` (new fetchers +
  `DashboardMetrics` shape extended with `revenue_trend`,
  `active_hours`, `kr_highlights`).
- REWROTE `src/app/dashboard/_components/DashboardOverview.tsx`
  (mission-control layout with recharts: AreaChart, PieChart, BarChart).
- NEW `src/components/AvatarMultiPicker.tsx`.
- MODIFIED `src/app/sops/_components/SopModal.tsx` (tag link below
  pills; uses AvatarMultiPicker).

### Verification
- `npx tsc --noEmit` clean for `src/app/dashboard/**`,
  `src/app/sops/**`, and `src/components/AvatarMultiPicker.tsx`.
- Dev server (`localhost:3000`) hot-reloaded each change without
  compile errors. `GET /dashboard` and `GET /sops` both 200 (auth
  redirect to /signin for the unauthenticated curl probe, expected).
- Recharts (`recharts@^3.8.1`) was already a dependency — no new
  packages installed.

## [2026-04-28] — `/dashboard` page: company-wide overview for admin/manager

Replaces the placeholder redirect at `/dashboard` with a real four-tile
overview + three drill-down sub-views, following the Bubble docs
("Página dashboard" with `?view=` switching, paginas.md / `os_tab` enum).

**Root view (`/dashboard`)** — four tiles, two laid out per row on
medium and four-wide on extra-large screens:

- **Finance · &lt;current month&gt;** — sum of `project_invoice.service_price`
  for the current month is shown as Revenue; sum of `project.profit`
  across the projects invoiced this month is shown as Profit; Costs is
  derived as `Revenue − Profit` (no dedicated cost ledger exists in the
  schema). Each row carries a ▲/▼ delta vs the previous month.
- **Key Results** — total achieved vs not-achieved with an emerald/rose
  divided bar + percentage achieved. Tile is clickable.
- **Projects** — counter per `os_project_status` value (Prospecting,
  Not Started, In Progress, Done, Blocked, Archived, Lost Deal) each
  with a relative-share progress bar. Clickable.
- **Internal Projects** — counter per `os_internal_project_status`
  value (Not Started, In Progress, Ready for QA, Done, Blocked,
  Archived). Clickable.

**Sub-views (each loaded via `?view=…`)**:
- `?view=key-results` — KR card grid, status filter dropdown +
  "Achieved only" toggle. Clicking a card opens the existing
  `KeyResultModal` from `/okrs` (no rebuild). The page-level fetcher
  hands it the goals + tracks bundle the modal expects.
- `?view=projects` — project card grid, status filter (defaults to
  "In Progress" to match the user's reference screenshot). Clicking a
  card opens the existing `ProjectModal` from `/projects`.
- `?view=internal-projects` — IP card grid, same shape. Clicking a
  card opens the existing `InternalProjectModal` (in `edit` mode).
  Assignees are intentionally rendered as empty for now — the
  `internal_project_assignees` join table referenced by the existing
  `/internal-projects` page does not yet exist in the live schema (the
  same source of long-standing TS errors there); the modal accepts an
  empty initial list and the cards just don't show avatars.

**Permissions** — both layers gated to admin/manager:
- Server: `dashboard/page.tsx` redirects referrers → `/recommended-projects`
  and everyone else → `/sandbox-planner`.
- Client: `Sidebar.tsx` filter now hides the "Dashboard" entry from
  every role except admin/manager.

### Files
- REPLACED `src/app/dashboard/page.tsx` (was a redirect placeholder; now
  branches on `?view=` and dispatches to one of four client views).
- NEW `src/app/dashboard/_lib/queries.ts` (the four group fetchers
  + the `loadAllDashboardMetrics` aggregate).
- NEW `src/app/dashboard/_lib/constants.ts` (status enum literals +
  display labels + tailwind pill classes).
- NEW `src/app/dashboard/_components/DashboardOverview.tsx` (root four-
  tile layout).
- NEW `src/app/dashboard/_components/KeyResultsView.tsx` (KR card grid
  with KeyResultModal mount).
- NEW `src/app/dashboard/_components/ProjectsView.tsx` (project card
  grid with ProjectModal mount).
- NEW `src/app/dashboard/_components/InternalProjectsView.tsx` (IP card
  grid with InternalProjectModal mount).
- MODIFIED `src/components/layout/Sidebar.tsx` (Dashboard entry now
  admin/manager only).

### Verification
- `npx tsc --noEmit` clean for `src/app/dashboard/**` and the touched
  sidebar.
- Dev server (`localhost:3000`) hot-reloaded without compile errors.
  `GET /dashboard` returns 200 (signin redirect for the unauth curl
  probe, expected).
- No DB migration needed — every column referenced by the new fetchers
  was confirmed present via `information_schema.columns`. Manager RLS
  bypass (`is_admin_or_manager()` + `internal_*: staff all` policies)
  already grants reads for the four source tables.

## [2026-04-28] — `/chat`: unread badges, Internal Projects Tasks tab

Three things shipped:

1. **Unread message badges across the chat hub.** New `viewed_by UUID[]`
   column on every chat message + thread table (8 tables total) plus
   matching GIN indexes. A row is "unread" iff caller is NOT in
   `viewed_by` AND is NOT the owner — same model as `task_comment`.
   - List rows show a red bubble with the per-conversation count
     (top-level + thread, summed). Bubble uses the new shared
     `<UnreadBadge>` component.
   - Block headers (Projects / Projects Internal / Internal Projects /
     Private Conversations) show the sum of all conversation unreads
     in that block.
   - Top-level messages with unread thread replies show a small red
     bubble next to the "X replies" link near the message timestamp.
   - Counts come from the existing list actions (`listProjectConversations`,
     etc.) which now compute unread inline via a single `unreadByScope`
     helper.
   - `getMessages` returns a `thread_unread_count` per top-level row.
   - **Mark-viewed split**: opening a conversation only marks
     **top-level** messages viewed (`mark_*_messages_viewed` RPCs);
     thread replies stay unread until the user opens that thread, at
     which point `markThreadViewed` runs the corresponding
     `mark_*_thread_viewed` RPC. After the thread opens, ConversationPane
     bumps a refresh key so the parent message's badge drops without
     a manual reload.
   - `ConversationsSidebar` awaits the mark RPC before bumping its
     refresh tick so the list re-fetches with the post-mark state in
     a single tick (previously raced).
   - Polls every 20 s so newly-arriving unread eventually surfaces in
     the badge.

2. **Tasks tab on the Internal Projects chat block.** Internal Projects
   now exposes Messages + Tasks. The Tasks tab embeds the existing
   `InternalProjectKanban` from `/internal-projects?project=<id>`
   inside the chat layout. New server action
   `getInternalProjectTaskBundle` does a one-shot fetch of project +
   tasks + assignees + time tracks + key results + visible profiles,
   and the new `<InternalProjectTasksTab>` wraps it with a 2 s poll
   (mirrors the Client/QA Request wrappers).

3. **Client / QA Requests tab kanbans on chat already showed the
   task-comment unread bubbles** via the existing `unreadByTaskId`
   plumb through `getProjectTabBundle` → `<TasksKanban>`. No changes
   needed beyond the previous turn's wiring.

**Migrations** (applied via MCP):
- `chat_viewed_by_unread_tracking` — adds the column, GIN indexes, and
  the four `mark_*_messages_viewed(scope_id)` RPCs.
- `chat_viewed_by_split_top_and_thread` — narrows the conversation-level
  RPCs to top-level only and adds four `mark_*_thread_viewed(parent_id)`
  RPCs.

**Files touched**: `src/types/chat.ts`,
`src/app/chat/_components/{ConversationsSidebar,ConversationPane,TabMenu,MessageItem,MessageList,ThreadPanel}.tsx`,
`src/app/chat/_components/lists/{ProjectsList,ProjectsInternalList,InternalProjectsList,PrivateList}.tsx`,
`src/app/chat/_components/UnreadBadge.tsx` (new),
`src/app/chat/_components/tabs/InternalProjectTasksTab.tsx` (new),
`src/app/chat/actions.ts`, `src/app/chat/page.tsx`,
`src/app/chat/_components/useChatUrlState.ts`.

**Reused without edits**:
`src/app/internal-projects/_components/InternalProjectKanban.tsx`,
`src/app/projects/_components/tabs/TasksKanban.tsx`.

## [2026-04-28] — Idea-picker UX: `/docs` Build-from-idea + `/projects` Import-tasks-from-idea

Two manager-facing features that share an "ideas connected to this
project, with an unassigned-fallback" picker.

**Feature 1 — `/docs?project=…&tab=playbook`.** The two existing
"Build from Sandbox idea" / "Build from idea" buttons used to require a
pre-linked idea (the empty-state CTA was hidden if `linkedIdeaId` was
null and the toolbar refused any non-matching `idea.project_id`). They
now open `BuildFromIdeaModal`, which lists ideas with
`idea.project_id = <current project>` first, falling back to ideas with
`idea.project_id IS NULL` when none are linked. Picking an unassigned
idea + Confirm auto-links it (`UPDATE idea SET project_id = <project>`)
before compiling the playbook from `idea_prd` / `idea_database` /
`idea_styles` / `idea_milestones_and_tasks` via the existing
`compileIdeaToPlaybookHtml` helper.

**Feature 2 — `/projects?project=…&tab=developer`.** New
"Import tasks from idea" button next to "Add milestone". Same
linked-first / unassigned-fallback picker, then a confirm step that
spells out exactly what's about to happen ("we'll AI-parse and
*append* — existing milestones won't be modified"). Confirm calls
`importTasksFromIdea(projectId, ideaId)`, which:
1. Auth-gates to admin/manager.
2. Pulls `idea_milestones_and_tasks.content` (the rich HTML the Sandbox
   Planner generates).
3. Resolves the caller's AI provider via the new shared
   `resolveAiConfig` helper.
4. Sends the HTML to `generateAiJsonResponse<ParsedImport>(...)` with a
   strict JSON-only prompt; expects
   `{ milestones: [{ name, estimated_time_minutes, tasks: [...] }] }`.
5. Computes `MAX("order")` so milestones append below existing ones.
6. Inserts one `task` per milestone (`level_1`, `type=developer_tasks`,
   `parent_task_id=null`) capturing each new id, then one `task` per
   child (`level_2`, `parent_task_id=<milestone>`).
7. Calls `recalculateAggregates(projectId)` and
   `revalidatePath('/projects')`. Returns `{ created: { milestones, tasks } }`
   so the modal can show a precise toast.

**Shared infrastructure** (extracted instead of duplicating):
- `src/lib/api/ai-config.ts::resolveAiConfig()` — single source of truth
  for picking a provider + key + model. Replaced the three previously-
  duplicated copies in `sandbox-planner/actions.ts`,
  `chat/_chatbot/run.ts`, and the new `chat/_chatbot/runProjectBot.ts`.
  Accepts `any` for the supabase param so callers using both the typed
  `Database`-generic client and the un-typed service-role client work.
- `src/lib/data/ideaPicker.ts::listIdeasForProjectPicker()` — returns
  `{ linked, unassigned }` with `has_prd` / `has_milestones` readiness
  flags so each modal can disable un-importable rows. Both the docs and
  projects server actions wrap this; downstream consumers don't care
  which feature is asking.

### Files
- NEW `src/lib/api/ai-config.ts`
- NEW `src/lib/data/ideaPicker.ts`
- NEW `src/app/docs/_components/modals/BuildFromIdeaModal.tsx`
- NEW `src/app/projects/_components/modals/ImportTasksFromIdeaModal.tsx`
- MODIFIED `src/app/docs/actions.ts` — `buildPlaybookFromIdea` accepts
  unassigned ideas and auto-links; new `listIdeasForPlaybookPicker`
  server action.
- MODIFIED `src/app/projects/actions.ts` — new `importTasksFromIdea`
  + `listIdeasForDeveloperTasksPicker` server actions.
- MODIFIED `src/app/docs/_components/PlaybookTab.tsx` — empty state and
  toolbar both open the new modal; the `BuildFromIdeaButton` no longer
  needs a pre-known `ideaId`.
- MODIFIED `src/app/docs/_components/PlaybookEditor.tsx` — drop the
  hand-rolled `handleBuildFromIdea` + `buildingFromIdea` state; just
  render `<BuildFromIdeaButton variant="toolbar" />`.
- MODIFIED `src/app/projects/_components/tabs/DeveloperTasks.tsx` — new
  "Import tasks from idea" button (admin/manager only) next to
  "Add milestone".
- MODIFIED `src/app/sandbox-planner/actions.ts`,
  `src/app/chat/_chatbot/{run.ts,runProjectBot.ts}` — drop local
  `resolveAiConfig` copies, import from the shared module.
- MODIFIED `src/lib/supabase/types.ts` — regenerated; surfaced the
  `external_conversation_authorized_users` /
  `internal_conversation_authorized_users` columns that an earlier
  generation had truncated.

### Verification
- `npx tsc --noEmit` clean for `src/app/{chat,docs,projects,sandbox-planner}/**`
  and `src/lib/{api,data}/**`.
- Dev server (`localhost:3000`) hot-reloaded all edits without compile
  errors. `GET /projects?project=…&tab=developer` returns 200 (auth-
  gated to /signin for unauthenticated curl, expected).
- No DB migration needed — `idea.project_id` was already nullable with
  an FK to `project(id)` and `is_admin_or_manager()` already grants
  read on every idea.

## [2026-04-28] — `/chat`: threads fix, project tabs (Client/QA Requests + Chatbot), role-gated user picker

Four shipped together:

1. **Threads — replies now appear after Send.** Two compounding bugs:
   - `ThreadPanel` was calling `MessageComposer` with a
     `parentMessageId` but never passing `onLocalThreadInsert`, so the
     optimistic-insert path the composer already supports never fired.
   - **Root cause**: `replyInThread` and `getThreadMessages` in
     `actions.ts` were selecting `author_type` on the thread tables —
     a column that doesn't exist there (only top-level message tables
     have it). PostgREST rejected the `INSERT … RETURNING` so the row
     was never persisted and the action returned an error toast that
     wasn't visible inside the closed thread drawer. Removed
     `author_type` from the thread `SELECT`s and synthesized `'user'`
     in TS to keep the `ChatThreadMessage` shape stable.
   With both fixed: type a reply → Send → row immediately shows in the
   drawer, persists to the corresponding `*_message_thread` table, and
   the parent's "X replies" counter ticks up.
   Also fixed `useChatUrlState.VALID_TABS` (was missing the new tabs,
   causing every URL with `tab=client_requests` etc. to silently fall
   back to `messages`).
2. **New Conversation user picker is two-pane and role-gated.** Replaced
   the single typeahead with an "Available / Selected" split. Right pane
   shows the running selection with Remove buttons + an optional group
   title field that appears at 2+ selections. New server action
   `listSelectablePrivatePeers` enforces the rule: admin / manager /
   operational see every staff + client + qa profile; everyone else
   only sees users they share a project with via
   `external_conversation_authorized_users` /
   `internal_conversation_authorized_users`. 1:1 dedupe still applies on
   single-pick.
3. **Three new tabs on Projects + Projects Internal blocks.**
   - **Client Requests** — kanban + cards identical to
     `/projects?project=<id>&tab=client_requests`. Visible to admin /
     manager / operational / developer / client.
   - **QA Requests** — same kanban + the "Track QA Time" button +
     `QATimeTrackerModal`. Visible to admin / manager / operational /
     developer / qa.
   - **Chatbot** — per-project shared LLM conversation backed by two new
     tables `project_chatbot_message` (Projects block) and
     `project_internal_chatbot_message` (Projects Internal block). Both
     keyed by `project_id` only — every authorized member sees the same
     conversation. Two new tools added to the chatbot:
     `create_client_request_task` and `create_qa_request_task` insert
     into `task` with `type='client_requests' | 'qa_requests'`,
     `level='level_1'`, `status='not_started'` and the next free
     `order`. New `runProjectChatbotTurn` reuses the existing tool /
     envelope machinery from `_chatbot/run.ts` but writes to the
     project tables and bakes `project_id` into the system prompt so
     the model auto-fills it on tool calls.
   - Tab list is now driven by `tabsForBlock(block, userType)` in
     `TabMenu`. RLS on the new chatbot tables uses the existing
     `*_conversation_authorized_users` arrays + admin/manager bypass.

**Migration**: `20260428000000+_project_chatbot_message.sql` (applied via
MCP) — two tables, GIN indexes, realtime publication, RLS policies,
`updated_at` trigger.

**Files touched**: `src/types/chat.ts`, `src/app/chat/page.tsx`,
`src/app/chat/_components/{ThreadPanel,TabMenu,ConversationPane}.tsx`,
`src/app/chat/_components/modals/UserPickerModal.tsx`,
`src/app/chat/_components/tabs/{ClientRequestsTab,QARequestsTab,ProjectChatbotTab,TaskRequestsKanbanWrapper}.tsx`,
`src/app/chat/_chatbot/{tools,runProjectBot}.ts`,
`src/app/chat/actions.ts`.

**Reused without edits**: `src/app/projects/_components/tabs/TasksKanban.tsx`
(drop-in for both Client/QA tabs), `TaskModal`, `QATimeTrackerModal`,
`MessageComposer`'s `onLocalThreadInsert` prop.

## [2026-04-28] — `/chat` send finally works + group private chats (fourth pass)

The third pass added `owner_id → profiles` FKs gated on `IF NOT EXISTS`.
Live testing this afternoon revealed the guard was the *bug*: the original
chat schema migration had already created `*_owner_id_fkey` constraints
pointing at **`auth.users(id)`**, not `profiles(id)`. The new migration
matched the existing constraint name, the `IF NOT EXISTS` clause skipped
the add, and the FK target was never corrected. PostgREST therefore still
couldn't resolve the `profiles:profiles!owner_id(...)` embed used by
`sendMessage`/`replyInThread`, and every Send click failed.

Fix: `20260428110000_chat_repoint_owner_fks_and_group_pc.sql` `DROP …
CONSTRAINT IF EXISTS` then `ADD CONSTRAINT … REFERENCES public.profiles(id)`
on every chat message + thread table. Verified by impersonating the
manager via `SET LOCAL role TO 'authenticated'` + `request.jwt.claim.sub`
and INSERTing a probe row into `external_conversation_project_message` for
a project the manager wasn't a member of — RLS + the new admin/manager
bypass + the new FK all worked together.

**Group private conversations.** The same migration adds an optional
`title` column to `private_conversation` and the code:
- `createPrivateConversation(peer | peer[], { title })` now accepts an
  array of peer ids. 1:1 chats still dedupe; groups always create fresh.
- `UserPickerModal` is rebuilt as a multi-select with a "Create group"
  CTA + optional title field. Clicking a single person still opens a 1:1
  immediately; picking 2+ enables the group flow.
- `listPrivateConversations` and `getConversationHeader` now hydrate a
  `group_label` ("Ann, Bob + 2 more") and surface `title` so the sidebar
  + conversation header render groups correctly.
- `PrivateList` renders a 👥 avatar + group name when participants > 2.

**Chatbot was already fixed.** Inspecting `private_chatbot_message` showed
the bot's most recent answer to "Summarize VirtueBud idea" (18:06 UTC)
correctly used `query_db` against the `idea` table and produced a real
summary — the user was looking at a stale earlier reply. No code change
needed.

### Files
- NEW `supabase/migrations/20260428110000_chat_repoint_owner_fks_and_group_pc.sql`
- MODIFIED `src/app/chat/actions.ts` (createPrivateConversation accepts
  array + options.title; getConversationHeader handles groups;
  listPrivateConversations hydrates group_label)
- MODIFIED `src/app/chat/_components/modals/UserPickerModal.tsx` (multi-
  select + group title)
- MODIFIED `src/app/chat/_components/lists/PrivateList.tsx` (group avatar
  + group label rendering)
- MODIFIED `src/types/chat.ts` (`PrivateConversationRow.title`,
  `group_label`)
- MODIFIED `src/lib/supabase/types.ts` (regenerated)

### Verification
- `pg_constraint` shows every `*_owner_id_fkey` now reads
  `FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE`.
- Impersonated SQL INSERT as the manager into a non-member project's
  external conversation succeeded.
- `npx tsc --noEmit` clean for `src/app/chat/**`.

## [2026-04-28] — `/chat` send fix + chatbot full-DB access (third pass)

The first live test on `localhost:3000` after the local-dev fix surfaced
two more bugs that yesterday's empty-table state had hidden.

**Bug A — every "Send" button silently failed.** Yesterday's optimistic-UI
refactor changed `sendMessage` / `replyInThread` to return the inserted row
joined with the author profile via the PostgREST embed
`profiles:profiles!owner_id(...)`. That join requires a real foreign key
from each message table's `owner_id` to `profiles.id` — and **no such FK
existed on any of the 8 chat message + thread tables**. PostgREST refused
the embed, the action returned an error, and the toast briefly flashed
"Could not find a relationship between …". Empty tables had masked it.
Migration `20260428100000_chat_rls_and_owner_fks.sql` adds the FK on:
- `external_conversation_project_message[_thread]`
- `internal_conversation_project_message[_thread]`
- `conversation_internal_project_message[_thread]`
- `private_conversation_message[_thread]`

(`private_chatbot_message` has no `owner_id` and was excluded.)

**Bug B — admin/manager could see every project but couldn't read or
write messages on the ones where they weren't a member.** The earlier
listing fix relaxed `project` SELECT but the message tables still gated
SELECT/INSERT on
`auth.uid() IN unnest(*_authorized_users)` with no role bypass. Now every
project message + thread policy reads
`is_admin_or_manager() OR auth.uid() IN unnest(...)`, matching the
project-listing model. `conversation_internal_project_message[_thread]`
was already role-gated and didn't need patching. Private DM tables stay
strict — admins do **not** auto-bypass user-to-user privacy.

**Chatbot — full-DB access + schema discovery.** The bot was refusing to
summarize the "VirtueBud" idea because its prompt didn't mention the
`idea` table family. Three changes:
- The seeded `prompt_group:Chat / prompt:Chatbot prompt` row is rewritten
  to enumerate the available domains (ideas, tasks, talent, OKRs, leads,
  SOPs, recommended projects, …) and explicitly tell the bot to call
  `list_db_tables` + `describe_db_table` before refusing.
- Two new tools in `src/app/chat/_chatbot/tools.ts`: `list_db_tables`
  (returns every public-schema table name) and `describe_db_table`
  (returns column name + type for one table). Both are backed by new
  `SECURITY DEFINER` SQL helpers `public.public_table_list()` and
  `public.public_table_columns(p_table)` so non-elevated users can
  introspect the schema even though they can't read `information_schema`
  directly.
- The role-aware client model from yesterday already lets admin/manager
  call `query_db` against any public table via the service-role client;
  no new bypass needed for `idea`, `idea_icp`, `idea_prd`, etc.

### Files
- NEW `supabase/migrations/20260428100000_chat_rls_and_owner_fks.sql`
- NEW `supabase/migrations/<auto>_chat_introspection_rpcs.sql` (applied
  inline; not on disk)
- MODIFIED `src/app/chat/_chatbot/tools.ts` (adds `list_db_tables` /
  `describe_db_table` tool entries + handlers)
- MODIFIED `src/lib/supabase/types.ts` (regenerated)

### Verification
- `pg_constraint` shows 8 new `*_owner_id_fkey` rows on the message +
  thread tables.
- `pg_policies` shows the four project-message + four project-message-thread
  policies (SELECT + INSERT) with `is_admin_or_manager()` bypass.
- `public.public_table_list()` returns 60+ public tables including
  `idea`, `idea_prd`, `idea_icp`, `talent`, etc.
- `public.idea` contains the "VirtueBud" row the user asked about — the
  bot will now find it via `query_db { table:'idea',
  filters:[{column:'name',op:'ilike',value:'%VirtueBud%'}] }`.
- `npx tsc --noEmit` is clean for `src/app/chat/**` and `_chatbot/**`.

## [2026-04-28] — Local dev fix: `localhost:3000` now serves the app

The dev server was effectively broken on the manager's Windows/OneDrive
box. Two issues, fixed together so `npm run dev` boots cleanly:

- **`package.json` `dev` script** ran `next build && next start --port 30003`
  (production mode at the wrong port). Changed to
  `next dev --port 3000 --turbopack`. The old behaviour is preserved as
  `dev:prod` in case anyone relied on it.
- **Tailwind v4 was scanning files outside the project.** `globals.css`
  had `@import "tailwindcss" source("../")` which made Tailwind treat
  `C:\Users\dougl\OneDrive\Área de Trabalho` as the source root — that
  dir has no `node_modules` (so the PostCSS plugin couldn't resolve the
  `tailwindcss` package, hanging every page request) and is full of
  `.lnk`/`.zip`/`.png` binaries (so the scanner crashed with
  `RangeError: Invalid code point …` inside `markUsedVariable`).
  Fixed by switching to `@import "tailwindcss" source(none)` plus
  explicit `@source "./"`, `@source "../components"`, `@source "../lib"`
  pins. Verified: `GET /` → 307 → `/signin` → 200 OK with the rendered
  Move37 sign-in page.

## [2026-04-28] — `/chat` bug-fix + UX rework pass

Six fixes layered onto the previous day's `/chat` MVP after the first round
of manager testing surfaced bugs and UX issues.

**1. Slack-style sectioned conversation list.** Replaced the two-column
"icon sidebar + conversation list" layout with a single sidebar where each
visible block is a collapsible section header with its conversations
rendered immediately below. Filter input now uses a new `.input-field--search`
class so the search icon no longer collides with the placeholder.
- DELETED `src/app/chat/_components/{BlockSidebar,ConversationListColumn}.tsx`
- NEW `src/app/chat/_components/ConversationsSidebar.tsx`
- MODIFIED `src/app/chat/_components/ChatShell.tsx` (drops the icon column)
- MODIFIED `src/app/chat/_components/useChatUrlState.ts` (adds `setBlockAndConversation`)
- MODIFIED `src/app/globals.css` (adds `.input-field--search` padding)

**2. Manager (admin/manager) sees all projects + admin CRUD on members.**
- `listProjectConversations` and `listProjectsInternalConversations` now
  skip the client-side `.includes(userId)` filter for admin/manager — RLS
  already does the right thing via `is_admin_or_manager()`.
- `fill_project_conversation_users` trigger is now **INSERT-only** (was
  `INSERT OR UPDATE OF authorized_users`, which clobbered manual member
  edits).
- New `getConversationMembers / addConversationMember / removeConversationMember`
  server actions, all gated on admin/manager.
- New `ConversationMembersModal` with a current-members list + typeahead
  add, opened from a gear button in `ConversationPane`'s header (only
  rendered for project blocks + admin/manager).

**3. Sent message now appears.** Two layered fixes:
- ALTER PUBLICATION supabase_realtime ADD TABLE on all 9 message-bearing
  tables (`{external,internal,private,chatbot}_*_message` + `_thread`).
  None of them were in the publication before, so realtime never delivered.
- Optimistic insert: `MessageList` now `forwardRef`s a
  `MessageListHandle = { insertLocal }` to its parent, and `MessageComposer`
  calls `onLocalInsert(row)` after a successful send. The realtime handler
  de-dupes by id, so the realtime echo (when it arrives) is a no-op.

**4. Files / Links / Videos / Daily Feedback tabs only on Projects blocks,
reusing the docs tab components.** `TabMenu` is now block-aware via a new
`tabsForBlock(block)` helper — only `projects` and `projects_internal` get
the full 5-tab set. When the active tab isn't `messages`, ConversationPane
mounts the new `ProjectTabsPanel` which fetches data via new server
actions (`getProjectFiles / getProjectLinks / getProjectVideos /
getProjectDailyFeedbacks / getProjectForTabs`) and renders the existing
`/docs/_components/{Files,Links,Videos,DailyFeedback}Tab.tsx` — pixel
identical to /projects. Polls every 2s because the docs tabs use
`router.refresh()` which doesn't retrigger client-side useEffects in the
chat shell.

**5. Removed "Send as daily feedback" checkbox.** Daily feedback now lives
in the dedicated tab and feeds from `project_daily_feedback`, not chat
messages. `MessageComposer` lost the `dailyFeedback` state, the
`allowDailyFeedback` prop, and the JSX block. `sendMessage` server action
no longer accepts `isDailyFeedback`; it always inserts with `false`.

**6. DB-driven chatbot prompt + admin/manager generic SQL tool.**
- New `prompt_group { name='Chat' }` + `prompt { name='Chatbot prompt' }`
  rows seeded in the migration. `_chatbot/run.ts` loads from the DB at
  turn time (`loadDbSystemPrompt`); falls back to its hardcoded
  `SYSTEM_PROMPT_HEADER` if the row is missing.
- New `query_db` and `count_db` tools in `_chatbot/tools.ts`. For
  admin/manager users they instantiate `createServiceClient()` (RLS bypass)
  so the bot can answer "list every project"; for everyone else they reuse
  the user's RLS-clamped client. Whitelisted to the public schema only —
  table strings starting with `auth.`, `storage.`, `pg_`, or containing
  `;`/`--`/`.` are rejected.
- `runTool` signature gained a fourth `userType` arg threaded through from
  `runChatbotTurn`.

### Files
- NEW `supabase/migrations/20260428000000_chat_fixes.sql` (publication +
  trigger + prompt seed)
- NEW `src/app/chat/_components/ConversationsSidebar.tsx`
- NEW `src/app/chat/_components/ProjectTabsPanel.tsx`
- NEW `src/app/chat/_components/modals/ConversationMembersModal.tsx`
- MODIFIED `src/app/chat/actions.ts` (admin/manager listing fix; member
  CRUD; project-tab data fetchers; `sendMessage`/`replyInThread` return
  full row for optimistic UI; drop `isDailyFeedback`)
- MODIFIED `src/app/chat/_chatbot/{run.ts,tools.ts}` (DB prompt loader;
  `query_db`/`count_db`; role-aware client)
- MODIFIED `src/app/chat/_components/{ChatShell,ConversationPane,TabMenu,
  MessageList,MessageComposer,ThreadPanel,useChatUrlState}.tsx`
- MODIFIED `src/app/globals.css` (`.input-field--search`)
- DELETED `src/app/chat/_components/{BlockSidebar,ConversationListColumn}.tsx`

### Verification
- `pg_publication_tables` → all 9 message tables now in `supabase_realtime`.
- `information_schema.triggers` → `project_fill_conversation_users` event =
  `INSERT` only.
- `prompt_group { name='Chat' }` joins to `prompt { name='Chatbot prompt' }`
  with the new system text.
- `npx tsc --noEmit` is clean for `src/app/chat/**` (8 unrelated
  pre-existing errors remain in `src/app/internal-projects/**` referencing
  a missing `internal_project_assignees` table).

## [2026-04-27] — `/chat` page (Slack-style messaging hub)

Brand-new feature — not in the original Bubble export. Internal real-time
messaging hub with five "blocks" (conversation flavors), each rendered in
a 3-column Slack-like layout: icon sidebar (col 1, ~64px) | conversation
list (col 2, ~280px) | active conversation with tab menu Messages / Files
/ Links / Videos / Daily Feedback (col 3). Threads are flat (one level,
opened in a right-side drawer). Realtime via Supabase channels.

- **Migration `20260427160000_chat.sql`:**
  - New enum `os_message_author_type` (`user` | `chatbot`).
  - Two new columns on `project`:
    `external_conversation_authorized_users UUID[]` and
    `internal_conversation_authorized_users UUID[]`, both with GIN
    indexes. Populated automatically via the
    `fill_project_conversation_users` BEFORE INSERT/UPDATE trigger,
    which derives them from `project.authorized_users` filtered by
    `profiles.type` (the external mirror admits clients; the internal
    mirror is staff-only).
  - **8 message tables** (top-level + thread sibling for each of 4
    conversation flavors):
    - `external_conversation_project_message[_thread]` —
      project-scoped channel that includes the client.
    - `internal_conversation_project_message[_thread]` — same
      project, staff-only side channel.
    - `conversation_internal_project_message[_thread]` —
      `internal_project`-scoped channel (the company's own
      initiatives). RLS gates by
      `get_user_type() IN ('admin','manager','operational')`.
    - `private_conversation_message[_thread]` — 1:1 messages.
  - Common columns on every message table:
    `id`, `owner_id`, `author_type`, `message`, `attachments JSONB`,
    `links TEXT[]`, `is_daily_feedback`, `edited_at`, `created_at`,
    plus the appropriate scope FK (`project_id` /
    `internal_project_id` / `conversation_id`). Thread tables add
    `parent_id` FK to their parent.
  - **3 chat-only tables:**
    - `private_conversation (id, participant_user_ids UUID[],
      created_by, created_at)` — owns 1:1 channels. GIN index on
      participants. RLS: `auth.uid() = ANY(participant_user_ids)`.
    - `private_chatbot (id, owner_id, title, prompt_group_id,
      created_at, updated_at)` — one row per AI session per user.
    - `private_chatbot_message (id, chatbot_id, author_type,
      message, tool_calls JSONB, created_at)` — chatbot turns,
      with a tool-call trace.
  - **RLS** on every table mirrors the source-of-truth scope:
    project-mirror columns drive the external/internal project
    chats, `private_conversation.participant_user_ids` drives 1:1,
    `owner_id` drives chatbot rows. Thread tables EXIST-check
    against their parent's policy.
  - **Storage bucket `chat-attachments`** (public read, authenticated
    write/update, owner-only delete — same shape as
    `task-comment-attachments`).
  - **Seed**: `prompt_group { name:'ChatBot Default',
    step:'chatbot' }` + a default chatbot system prompt row.
- **Types.** `src/types/chat.ts` defines `ChatBlock`, `ChatTab`,
  `AuthorType`, `ChatMessage`, `ChatThreadMessage`,
  `PrivateConversation`, `ChatbotConversation`, `ChatbotMessageRow`,
  plus the `BLOCK_TABLES` router that maps each block to its
  physical message + thread + scope-FK names. Generated
  `src/lib/supabase/types.ts` regenerated to include all 11 new
  tables.
- **Server actions** `src/app/chat/actions.ts`:
  - Listing: `listProjectConversations`, `listProjectsInternalConversations`,
    `listInternalProjectConversations`, `listPrivateConversations`,
    `listChatbotConversations`, `searchUsersForPrivate`.
  - Messages: `getMessages` (tab-aware), `getThreadMessages`,
    `sendMessage`, `replyInThread`, `editMessage`, `deleteMessage`
    (also cleans up orphan storage objects, mirroring
    `deleteTaskComment`).
  - `getConversationHeader` resolves a per-block title + picture.
  - `createPrivateConversation(peerUserId)` is idempotent — finds
    an existing channel with the same participant pair, or inserts a
    new one.
  - Chatbot lifecycle: `createChatbotSession`, `renameChatbotSession`,
    `deleteChatbotSession`, `getChatbotMessages`,
    `sendChatbotMessage` (delegates to `runChatbotTurn`).
  - Top-level role gate: only
    `admin / manager / operational / developer / client / qa` may
    enter; `referrer` and `lead` are bounced. RLS does the primary
    auth — server actions add defense-in-depth.
  - Dynamic table routing uses an `as never` cast to satisfy
    supabase-js' literal-type narrowing (same trick used in
    `src/app/sandbox-planner/actions.ts`).
- **Chatbot runtime** `src/app/chat/_chatbot/run.ts` +
  `src/app/chat/_chatbot/tools.ts`:
  - Reuses the existing `generateAiJsonResponse()` dispatcher
    (OpenAI / Gemini / Claude per `user_ai_settings`) — no new
    SDK dependency.
  - System prompt is loaded from
    `prompt_group.step = 'chatbot'`'s `prompt.prompt_1`, prepended
    with a tool catalog and a JSON-envelope output contract:
    `{ "tool": <name>, "args": {...} }` to call a tool, or
    `{ "reply": <text> }` to finish the turn.
  - **MCP-style tool layer** — fixed JSON tool list:
    `list_my_projects`, `get_project_status`, `list_my_tasks`,
    `get_task`, `list_my_internal_projects`, `who_is`. Each tool
    runs through the calling user's Supabase client, so RLS
    automatically clamps every result to what the asking user is
    allowed to see (clients can't peek at staff data).
  - Up to 6 tool hops per turn, then a graceful "ran out of steps"
    fallback. The full tool trace is persisted on
    `private_chatbot_message.tool_calls`.
  - Missing-API-key fallback: inserts a chatbot message
    `"Chatbot is not configured…"` so the UI still works.
- **Page + components:**
  - `src/app/chat/page.tsx` — server component, role-gated,
    parses `?block&conversation&tab&thread` from the URL and hands
    initial values to `<ChatShell />`.
  - `src/app/chat/_components/ChatShell.tsx` — orchestrates the
    3 columns. URL is the source of truth (mirrors
    `DocsShell.tsx`).
  - `BlockSidebar.tsx` — 5 icon buttons. `visibleBlocksFor(userType)`
    filters: `client` / `qa` see Projects + Private + Chatbot;
    `developer` adds Internal Projects; staff (`admin` / `manager`
    / `operational`) see all 5.
  - `ConversationListColumn.tsx` swaps inner list per block.
    `lists/{ProjectsList, ProjectsInternalList, InternalProjectsList,
    PrivateList, ChatbotList}.tsx`.
  - `ConversationPane.tsx` — header + `TabMenu.tsx` (URL-driven
    `?tab=`) + `MessageList.tsx` + `MessageComposer.tsx`. Optional
    right-side `ThreadPanel.tsx` when `?thread=<id>` is set.
  - `MessageList.tsx` uses the `useRealtimeMessages` hook to
    subscribe to a Supabase channel filtered on the matching
    table + scope FK; tab-aware filtering of incoming inserts.
  - `MessageItem.tsx` auto-links URLs in the body and renders
    image / video attachments inline.
  - `MessageComposer.tsx` uploads to the `chat-attachments` bucket
    via `supabase.storage` (same flow as `task-comment-attachments`).
  - `ChatbotPane.tsx` — replaces `ConversationPane` when
    `block="chatbot"`, with a stripped-down message stream + composer.
  - `modals/UserPickerModal.tsx` — typeahead user picker for
    starting a new private conversation.
  - Hooks: `useChatUrlState.ts` (URL parser/writer),
    `useRealtimeMessages.ts` (per-conversation Supabase channel).
- **Sidebar.** `src/components/layout/Sidebar.tsx` adds a `Chat`
  nav entry (with new `IconChatBubble` SVG) between Projects and
  Docs. The proxy already excludes referrers, so no proxy change
  was needed.

## [2026-04-27] — Recommended Projects + referrer dashboard

Implements the Bubble pages **`recommended-projects`** (`paginas.md`
L2319) and **`referrer-dashboard`** (`paginas.md` L2962) — a single
internal page (admin / manager) that shows every project recommended
by a Dev / Agency Owner or Client, plus a locked-down referrer view of
the same page where each referrer sees only their own projects and
earnings.

- **Schema.** Migration `recommended_projects_recommended_by_and_client_fk`:
  - New enum `os_recommended_by` (`dev_agency_owner` | `client`) and
    new column `project.recommended_by` (`os_recommended_by NULL`) so
    we can branch the UI on the recommender's type.
  - Repointed FK `project.client_who_recommended_id` from the
    talent-side join table `client_who_referred_this_talent` to the
    actual `client` table. Verified via SQL that 0 rows had this set
    before the swap, so the fix is non-destructive.
  - The existing RLS policy `"project: referrer read own"` (initial
    schema migration L1277) already clamps the result set to
    `project.referrer_id = auth.uid()` for `referrer`-type users — no
    new policy needed.
- **Types.** `src/types/projects.ts` adds `RecommendedBy` +
  `RECOMMENDED_BY_LABELS`, and extends `Project` with
  `recommended_by`, `client_who_recommended_id`, `referrer_id`.
- **Server actions.** `src/app/projects/actions.ts`:
  - Extended `ProjectInput` with the four recommender FKs +
    `recommended_by` so `ProjectModal` can persist the choice.
  - New `searchClients(query)` and `getClientById(id)` for the new
    "Client who recommended this project" typeahead.
- **Project popup.** `src/app/projects/_components/modals/ProjectModal.tsx`:
  - New "Recommended by" dropdown with options `Dev./Agency Owner`
    and `Client`. Branches the form:
    - `Dev./Agency Owner` → existing talent typeahead +
      Commission (%) input.
    - `Client` → new client typeahead (mirrors the talent picker,
      with avatar fallback) + Commission (%) input.
  - Switching the dropdown clears the other branch's selection so
    only one of `talent_who_recommended_id` /
    `client_who_recommended_id` is ever non-null.
- **New page.** `src/app/recommended-projects/page.tsx` — server
  component, gated to `admin` / `manager` / `referrer`. Fetches
  projects (RLS auto-filters for referrers), talents, and clients,
  then renders `RecommendedProjectsShell` inside the standard
  Sidebar layout.
- **Shell.** `src/app/recommended-projects/_components/RecommendedProjectsShell.tsx`:
  - Search + filter row (name, Dev/Agency Owner, Agency placeholder,
    Client, Status).
  - 3 KPI cards — `Move37` (Revenue + Profit), `Devs/Agency
    Owners + Clients` (provider revenue), `Projects` (count).
    For referrer users the middle card becomes `Your Earnings` and
    the table drops the `Provider Revenue` / `Profit` columns,
    showing the referrer's own commission as `Revenue` instead.
  - Project table with status chips (color-coded per
    `STATUS_COLORS`) linking through to `/projects?project=<id>`.
- **Sidebar.** `src/components/layout/Sidebar.tsx`:
  - `/recommended-projects` is now gated to `admin` / `manager` /
    `referrer`.
  - When `profile.type === 'referrer'`, the entire nav collapses to
    a single `Dashboard` entry pointing at `/recommended-projects`
    (plus the `Settings` trailing item) — matches screenshot 5 of
    the user's brief.
- **Middleware.** New `src/middleware.ts` — refreshes the Supabase
  session cookie and redirects any `referrer`-type user away from
  pages outside the allowlist (`/recommended-projects`, `/profile`,
  `/signin`, `/reset_pw`, `/talent-profile`, `/auth`) to
  `/recommended-projects`. The `/dashboard` placeholder also routes
  referrers to `/recommended-projects` directly to skip a hop.

## [2026-04-27] — Leads page

- **Bubble reference.** Implements the `leads` page in
  `docs/reference_docs/paginas.md §leads` backed by the existing
  `client` Data Type (`tabelas.md §client`). Restricted to admin /
  manager / operational users (Bubble workflow bTSKm0).
- **Schema.** No migration needed — the `client` table already
  exists with the required fields (`name`, `email`, `phone`,
  `linkedin`, `picture`, `country`) and the `client: staff all` RLS
  policy. Avatar uploads reuse the public `talent-avatars` bucket.
- **Types.** New `src/types/leads.ts` adds `Lead` and `LeadInput`.
- **Server actions.** New `src/app/leads/actions.ts` —
  `listLeads`, `createLead`, `updateLead`, `deleteLead`. All gate on
  staff role and `revalidatePath('/leads')`.
- **UI.**
  - `src/app/leads/page.tsx` — server component, role gate +
    initial fetch.
  - `src/app/leads/_components/LeadsShell.tsx` — search by name,
    country dropdown filter, "+ New Lead" button, card grid with
    avatar/initials, edit + trash icons, email + LinkedIn quick
    links, and an inline confirm-delete modal.
  - `src/app/leads/_components/LeadModal.tsx` — shared
    create/edit modal (avatar upload + Full Name, Country, Email,
    Phone, LinkedIn).
- **Sidebar.** `/leads` joins `/okrs`, `/internal-projects`,
  `/talent-pool` in the staff-only nav filter so clients, QAs,
  developers, and referrers no longer see the link.

## [2026-04-27] — Talent Pool follow-up: enum expansion + skill-picker UX

Round of fixes after live testing of `/talent-pool` and the public
`/talent-profile?code=…` flow.

- **Enum expansion.** Migration
  `talent_pool_expand_tool_and_language_enums` (applied via
  `mcp__supabase__apply_migration` using `ALTER TYPE … ADD VALUE
  IF NOT EXISTS`, idempotent and outside any transaction):
  - `os_tool` grew from 16 values to **79**, organised into nine
    categories — AI coding (Claude Code, Cursor, Antigravity, GitHub
    Copilot, Windsurf, Codeium, Aider, Devin, v0, Bolt, Tempo),
    no-code/low-code (Bubble, Webflow, Framer, FlutterFlow, Lovable,
    Replit, WeWeb, Adalo, Plasmic, Retool, Glide, Softr, Draftbit,
    Wix, Squarespace, Shopify), automation (n8n, Make, Zapier),
    backend/data (Supabase, Xano, Firebase, Hasura, Postgres, MongoDB,
    MySQL, Redis, PlanetScale, Neon, Airtable), design (Figma Design,
    Figma Make, Sketch, Adobe XD, Photoshop, Illustrator, After
    Effects, Premiere, Miro), DevOps/hosting (Vercel, Netlify, GitHub,
    GitLab, Docker, Kubernetes, AWS, GCP, Azure, Cloudflare),
    productivity (Notion, Slack, Linear, Jira, Asana, Monday.com,
    Trello, ClickUp, Loom), AI APIs (OpenAI, Anthropic API, LangChain,
    Pinecone), and payments/comms/analytics (Stripe, Twilio, SendGrid,
    Segment, Mixpanel, Amplitude, PostHog).
  - `os_programming_language` grew from 15 values to **44**, adding
    Go, Rust, Java, Scala, Elixir, Erlang, Haskell, Clojure, F#,
    OCaml, Julia, R, MATLAB, Lua, Perl, Bash, Shell, PowerShell,
    Objective-C, Groovy, Assembly, Solidity, GraphQL, NoSQL,
    HTML/CSS, VBA, Crystal, Nim, Zig, D, Fortran, COBOL.
  - Regenerated `src/lib/supabase/types.ts` from the live schema.
  - Updated `src/types/talent.ts` with `TOOL_LABELS` (79 entries) and
    `PROGRAMMING_LANGUAGE_LABELS` (44 entries), category-grouped with
    inline comments.
- **`SkillRowsEditor` rewrite (`src/app/talent-pool/_components/`).**
  Replaced the native `<select>` for the item slot — which collapsed
  in narrow modal columns and could not show a "currently selected"
  state — with a custom searchable `ItemPicker` component:
  - Row layout switched from flex to CSS grid:
    `grid-cols-[minmax(0,1fr)_92px_36px]` guarantees that the
    item picker, score select, and trash icon get fixed columns
    even when nested inside the talent modal's two-column grid.
  - Picker trigger renders the selected label (or placeholder) +
    chevron; clicking opens a dropdown anchored to the trigger
    width, with an autofocused search input and a 56-row-tall
    scrollable list.
  - Selected option is highlighted (`bg-accent/15 text-accent`)
    with a checkmark SVG, matching the rest of the design system.
  - Click-outside closes; the search query resets when the picker
    closes.
  - Verified live at the dev server: tool dropdown 696 px wide
    with all 79 entries; language dropdown 696 px wide with all
    44 entries; selecting an option shows it in the trigger and
    re-opening highlights it with a checkmark.
- **`TypeaheadPicker` cleanup (`src/app/talent-pool/_components/`).**
  Removed the duplicate "selected pill" that rendered below the
  input after picking a company. The selection is now indicated
  only by the input value and an inline ✕ clear button positioned
  inside the right edge of the input. Simpler, no double display.
- **Public flow verified.** Generated a share link for talent
  "Harish Malli", visited `/talent-profile?code=…` in the dev
  preview, confirmed the form pre-fills (name, email, level,
  authority level, current company), edited LinkedIn, clicked
  Save — checked Postgres and `talent.linkedin` + `talent.updated_at`
  reflected the change. Visiting with an invalid code renders the
  "Link unavailable / This link has expired or is invalid" card,
  no form, no auth required.

---

## [2026-04-26] — Talent Pool page + 4-hour share-link self-edit

- **Schema.** Migration
  `20260426000010_talent_pool_share_and_operational_rls.sql`:
  - Adds `talent.code_expires_at TIMESTAMPTZ` and
    `talent.updated_at TIMESTAMPTZ` (auto-set via trigger), plus a
    partial index on `(code) WHERE code IS NOT NULL AND code_expires_at IS NOT NULL`.
  - Adds an additive `"<table>: staff all"` RLS policy across
    `talent`, `talent_tool`, `talent_programming_language`,
    `talent_referred_by`, `client_who_referred_this_talent`,
    `company`, and `client` to include the `operational` user type
    alongside the existing admin/manager grant (matches the page
    restriction in `paginas.md`).
  - Two SECURITY DEFINER RPCs callable by anon + authenticated:
    `get_talent_by_code(p_code)` and
    `update_talent_by_code(p_code, p_payload)` — both validate
    `code_expires_at > NOW()` inside the function so anon callers
    cannot read or modify anything outside the share-link surface.
  - New public storage bucket `talent-avatars` with staff-write
    + public-read policies.
- **Types.** `src/types/talent.ts` adds `Tool`, `ProgrammingLanguage`,
  `TOOL_LABELS`, `PROGRAMMING_LANGUAGE_LABELS`, `COUNTRIES`,
  `TalentSkill`, `TalentLanguage`, `TalentRow`, `TalentInput`,
  `RecommenderInput`, `ClientInput`, `CompanyInput`, plus public
  shape types for `Company` and `ClientProfile`. Re-exports
  `TalentLevel` / `TalentAuthorityLevel` from `@/types/projects`.
- **Server actions** (`src/app/talent-pool/actions.ts`,
  staff-gated to admin/manager/operational): `createTalent`,
  `updateTalent`, `deleteTalent`, `searchTalents`,
  `searchClientsAction`, `searchCompaniesAction`,
  `createCompanyAction`, `createClientProfile`, `createRecommender`,
  `generateShareLink` (4-hour code via `crypto.randomUUID()`). All
  mutations `revalidatePath("/talent-pool")`.
- **Public server actions** (`src/app/talent-profile/actions.ts`):
  `getTalentByCode`, `updateTalentByCode`,
  `uploadTalentAvatarByCode` — service-role wrappers around the two
  SECURITY DEFINER RPCs and the `talent-avatars` bucket.
- **UI** (`src/app/talent-pool/`):
  - `page.tsx` — server component; gates by user type, hydrates
    talents + tools + languages + recommender ids + client-referrer
    ids in parallel.
  - `TalentPoolShell.tsx` — search bar + settings toggle +
    collapsible `FilterRow` (Level / Authority Level / Tools /
    Programming Languages / Recommended-by-Levels / Countries /
    Current Companies) + + New Talent button + modal stack.
  - `TalentRow.tsx` — avatar / name & role / level chips / tools /
    languages / recommended-by avatars / share + edit + delete
    icons.
  - Shared inputs: `TypeaheadPicker`, `TypeaheadMultiPicker`,
    `MultiChipSelect`, `SkillRowsEditor`, `AvatarUpload`.
  - Modals (`_components/modals/`): `TalentFormModal` (z=50),
    `CompanyFormModal` (z=60/70), `RecommenderFormModal` (z=60),
    `ClientFormModal` (z=60), `ShareLinkModal`. The base
    `Modal` (`src/app/projects/_components/modals/Modal.tsx`) gains
    an optional `zIndex?: 50 | 60 | 70` prop for the nested-modal
    pattern (Talent → Recommender → Company).
- **Public self-edit** (`src/app/talent-profile/`):
  - `page.tsx` — no auth; reads `?code=`, calls `getTalentByCode`,
    renders either an "expired" card or the form. Standalone header
    (no Sidebar).
  - `TalentSelfEditForm.tsx` — same body shape as the staff
    `TalentFormModal` minus the recommender / client-referrer joins
    (those stay staff-only). Avatar uploads route through
    `uploadTalentAvatarByCode` so anon callers never touch the
    bucket directly.
- **Sidebar.** `/talent-pool` added to the staff-only `internalOnly`
  list — visible only to admin / manager / operational, mirrors the
  page-level redirect.

## [2026-04-26] — Internal Projects round 2 (modal save flow, chat, polish)

- **Schema.** Migration `internal_task_comment` adds the
  `internal_task_comment` table (mirroring `task_comment`: `message`,
  `attachments jsonb`, `edited_at`, `viewed_by uuid[]`, FK to
  `internal_task` + `internal_project`) with staff RLS
  (`get_user_type() IN ('admin','manager','operational')`), a public
  storage bucket `internal-task-comment-attachments` with the
  matching read/upload/update/delete policies, and a
  `mark_internal_task_comments_viewed(uuid)` SECURITY DEFINER RPC
  mirroring `mark_task_comments_viewed`.
- **Types.** `src/types/internal-projects.ts` adds
  `InternalTaskCommentAttachment` and `InternalTaskComment`.
- **Server actions.** `src/app/internal-projects/actions.ts` —
  `getInternalTaskComments`, `createInternalTaskComment`,
  `updateInternalTaskComment`, `deleteInternalTaskComment`,
  `markInternalTaskCommentsViewed` (all revalidate
  `/internal-projects`).
- **UI.**
  - `InternalProjectsList.tsx` — Start Date / End Date columns now
    render the **estimated** date on the top line and the real date
    in muted parens below (was reversed).
  - `InternalProjectKanban.tsx` — "+ Add task" no longer instantly
    inserts a row; it opens `InternalTaskModal` in create mode with
    the column's status preselected. Card body click is inert; only
    the pencil icon opens the modal in edit mode.
  - `InternalTaskModal.tsx` — full refactor: dropped the per-field
    `persist()` + `useTransition` auto-save in favor of local state
    + a footer **Save** button. Save runs in a transition: in create
    mode it calls `createInternalTask` then patches the rest of the
    fields, then diffs the local time-tracker entries against
    `props.timeTracks` to issue create/update/delete RPCs in one
    pass. The time-tracker header now shares the same
    `grid-cols-[1.4fr_1fr_1fr_0.8fr_1.6fr_36px]` template as its
    rows so headers line up over their cells. New chat slot:
    placeholder "Save the task first to start chatting." in create
    mode, `<InternalTaskChat>` once the task exists.
  - `InternalTaskChat.tsx` *(new)* — chat panel mirroring
    `TaskChat.tsx`: messages, edit, delete, image inline preview,
    file attachments to `internal-task-comment-attachments`,
    "viewed by" tracking via the new RPC.

## [2026-04-26] — Internal Projects rework (modals, time tracking, schema cleanup)

- **Schema.** Migration `internal_projects_schema_rework` drops the
  `internal_task_assignees` pivot table (and its RLS policy), adds
  `internal_task.assignees uuid[]` (default `{}`) so a task's
  assignees live inline, and renames `internal_time_track` →
  `internal_task_time_track` (RLS policy renamed to match). Migration
  `internal_project_kr_links` adds
  `internal_project.internal_key_result_ids uuid[]` to back the new
  "Key Results Impacted by This Project" multi-select.
- **Types.** `src/types/internal-projects.ts` drops
  `InternalTaskAssignee`, adds `InternalTask.assignees: string[]`,
  `InternalProject.internal_key_result_ids`, plus new
  `InternalTaskTimeTrack` and `InternalKeyResultRef` types.
- **Server actions.** `src/app/internal-projects/actions.ts` —
  `createInternalProject` now takes the full create-modal payload
  (status, sector, dates, times, description, assignees, KR ids);
  `updateInternalTask` accepts `assignees`; new
  `createInternalTaskTimeTrack` / `updateInternalTaskTimeTrack` /
  `deleteInternalTaskTimeTrack` provide the time-tracker CRUD. The
  legacy `setInternalTaskAssignees` pivot helper was removed.
- **UI.**
  - `InternalProjectsList.tsx` — toolbar restyled to match
    `/projects` (raw Tailwind classes instead of `.input-field` so the
    selects stop expanding to 100% width); rows are now hover-only
    edit/delete (pencil + trash) with a confirm-delete modal; the
    project name is the click target that opens the kanban.
  - `InternalProjectModal.tsx` — new shared create/edit project modal
    with name, status pill, sector, assignees picker, estimated/real
    times, four date pickers (real + estimated start/end), KR
    multi-select, and a TipTap rich-text description.
  - `InternalProjectKanban.tsx` — cards redesigned to match
    `tabs/TasksKanban.tsx` (`client_requests` style): column accent
    border, hover-revealed pencil + trash, drop-target indicators
    between cards, click-to-edit. Confirm-delete modal for tasks.
  - `InternalTaskModal.tsx` — full redesign: auto-saving fields, real
    + estimated start/end dates, an inline time-tracker table
    (Date / Start / End / Spent / Owner with row-level delete and
    "Add row"), TipTap rich-text description, single Close button.
    `Real Time (h)` is now derived from the sum of `time_spent_h`
    rows.
- **Page query.** `internal-projects/page.tsx` no longer reads from
  `internal_task_assignees` (gone) and now also fetches
  `internal_task_time_track` rows for the open project plus the
  internal key results list for both modals.

## [2026-04-25] — Internal Projects page (list + kanban)

- **Bubble reference.** Mirrors the `internal-projects` page in
  `docs/reference_docs/paginas.md §internal-projects` and the
  `internal_project` / `internal_task` data types in `tabelas.md`.
  Restricted to admin/manager/operational users per Bubble workflow
  bTYoP.
- **Migration.** `supabase/migrations/20260426000002_internal_projects_rls_staff.sql`
  replaces the old `is_admin_or_manager()` RLS policies on
  `internal_project`, `internal_project_assignees`, `internal_task`,
  `internal_task_assignees`, and `internal_time_track` with policies
  that match the page gate
  (`get_user_type() IN ('admin','manager','operational')`).
- **Types.** `src/types/internal-projects.ts` exports the row shapes,
  status/sector enums (`os_internal_project_status`,
  `os_internal_task_status`, `os_company_sector`), and Tailwind pill
  classes for both project and task statuses.
- **Server actions.** `src/app/internal-projects/actions.ts` provides
  CRUD for projects and tasks plus pivot-based assignee setters
  (`setInternalProjectAssignees`, `setInternalTaskAssignees`). Every
  action gates on `requireInternalStaff()` and revalidates
  `/internal-projects`.
- **UI.** New `/internal-projects` route:
  - `page.tsx` — server component; gates by profile type, then either
    fetches the project list (root URL) or the project + tasks +
    assignees for kanban view (`?project=<id>`).
  - `_components/InternalProjectsList.tsx` — search, status & sector
    filters, "+ New Project" button, inline-editable rows with status
    pill dropdown, sector dropdown, dual real/estimated date display,
    real-time numeric input, multi-select assignee picker, and
    open/delete actions.
  - `_components/InternalProjectKanban.tsx` — four-column kanban
    (Not Started / In Progress / Done / Blocked) matching
    `os_internal_task_status`. Drag-and-drop moves tasks between
    columns; cards have inline rename, assignee avatars, and an
    "open" arrow to launch the edit modal.
  - `_components/InternalTaskModal.tsx` — full task editor (name,
    status, assignees, estimated dates, estimated/real time,
    description).
  - `_components/AssigneePicker.tsx` — reusable multi-select avatar
    stack.
- **Sidebar gate.** `Sidebar.tsx` now hides the existing "Internal
  Projects" nav entry from non-internal users (same gating as OKRs).

## [2026-04-24e] — Feedback page: wall of company-experience feedback

- **Bubble reference.** Mirrors the `feedback` page and `feedback` data
  type in `docs/reference_docs/paginas.md §feedback` and
  `tabelas.md §feedback`. Any authenticated user (primarily clients,
  developers and QA) can file a rated comment about a project.
- **Migration.** `supabase/migrations/20260424000001_feedback_creator_and_rls.sql`
  adds `created_by` + `updated_at` to `public.feedback` with an
  `updated_at` trigger, and replaces the original RLS (admin/manager-all
  + operational-insert) with the Bubble semantics now exposed in the UI:
  admin/manager → full access, any authed user → read, creator → insert
  (must set `created_by = auth.uid()`), update and delete their own row.
- **Types + actions.** `src/types/feedback.ts` exports the `Feedback` row
  and the `FeedbackInput` write shape. `src/app/feedback/actions.ts`
  provides `createFeedback` (server-stamps `created_by` + the signed-in
  user's `profiles.type` into `user_type` so the user-type filter works),
  plus `updateFeedback` and `deleteFeedback` — RLS enforces the
  creator-only gates, not client-side logic.
- **UI.** New `/feedback` route:
  - `page.tsx` — server component; loads the signed-in profile, the
    visible projects list (admin/manager see all, everyone else sees
    projects whose `authorized_users` contains them) and the full
    feedback wall, then delegates to `FeedbackShell`.
  - `_components/FeedbackShell.tsx` — header with search-by-author,
    user-type dropdown filter, "+ New Feedback" button; stats strip with
    a live Average Rating (computed over the filtered view) and count;
    responsive card grid; delete-confirm + edit-by-click wired to
    `deleteFeedback` / the form modal. Creator-or-admin-or-manager sees
    the delete icon and can open the card into edit mode.
  - `_components/FeedbackCard.tsx` — avatar + name, stars, project name,
    comment, and a delete button gated on `canEdit`.
  - `_components/StarRow.tsx` — reusable 1-5 star component (read-only
    or interactive); the fifth star renders the "happy-face" variant
    when the rating is 5, matching the Bubble design.
  - `_components/FeedbackFormModal.tsx` — create/edit form with project
    dropdown, interactive stars, and comment textarea; calls the server
    actions and `router.refresh()` on success.
- **Sidebar.** Added "Feedback" nav entry (filled-star icon) in
  `src/components/layout/Sidebar.tsx`, right after Sandbox Planner,
  visible to every role since any authed user can post feedback.

## [2026-04-24d] — OKRs page: manage Objectives and Key Results

- **New domain.** Replicates Bubble's internal OKR tracker (tables
  `internal_goal`, `internal_key_result`, `internal_key_result_track` in
  `docs/reference_docs/tabelas.md`, option sets `os_internal_goals_status`
  and `os_internal_key_result_status` in `option-sets.md`, and page
  access workflow `bTYoP` in `paginas.md:1386-1537`).
- **Migration.**
  `supabase/migrations/20260426000000_internal_okrs.sql` creates two
  Postgres enums (`internal_goal_status`, `internal_key_result_status`),
  three tables, foreign-key chains with `ON DELETE CASCADE`, and RLS
  policies gated on `get_user_type() IN ('admin','manager','operational')`
  — clients / developers / designers / qa / referrer / lead cannot see
  or mutate any OKR data.
- **Types + actions.** `src/types/okrs.ts` exports types, status enum
  arrays, human labels, and Tailwind pill classes.
  `src/app/okrs/actions.ts` provides `createGoal` / `updateGoal` /
  `deleteGoal`, `createKeyResult` / `updateKeyResult` / `deleteKeyResult`,
  and `createTrackEntry` / `updateTrackEntry` / `deleteTrackEntry` — each
  re-asserts the internal-staff gate server-side, not just at the RLS
  layer.
- **UI.** New `/okrs` route:
  - `page.tsx` — server page; redirects non-internal profiles to
    `/dashboard` and fetches all goals, key results, and tracker entries.
  - `_components/OkrsShell.tsx` — hierarchical table with expand/collapse
    chevrons, goal rows styled in an indigo tint, filter chips across
    goal + KR statuses (defaults to highlighting Not Started / In
    Progress to match the reference screenshot), and inline
    "+ Add key result" / "+ Add goal" affordances.
  - `_components/GoalModal.tsx` — name, status pill dropdown, rich-text
    description (`@/components/editor/RichTextEditor`).
  - `_components/KeyResultModal.tsx` — name, goal select, start/end
    dates (`@/components/DatePicker`), status pill, current target
    value, achieved Yes/No, embedded tracker, and rich-text description.
  - `_components/KeyResultsTracker.tsx` — toggle between an editable
    table of samples and a responsive line chart (recharts) plotting
    Current Value vs Target Value over time.
- **Dependency.** Added `recharts` (peer of React 19) for the tracker
  chart view.
- **Sidebar.** `Sidebar.tsx` filters the OKRs nav entry out for any
  profile type outside `{admin, manager, operational}`, mirroring the
  page-level redirect so the link doesn't dead-end.
- `npx tsc --noEmit` clean.

## [2026-04-24c] — Fix playbook page freezing on eye-toggle / comment click

- **Root cause.** The MutationObserver introduced yesterday to re-stamp
  `data-status` on comment-highlight spans watched the editor DOM with
  `subtree: true`, `childList: true`, and `attributes: true`. Every
  `paint()` call issued `setAttribute` on every comment span, which
  queued its own attribute-mutation records that re-entered the observer
  callback. Combined with ProseMirror's own DOM churn on click /
  selection change, the observer could fire enough times in a single
  frame to stall the main thread — the page appeared to freeze whenever
  the user clicked the hide-resolved eye toggle or a highlighted comment
  span.
- **Fix.** Removed the MutationObserver from `PlaybookEditor.tsx`
  entirely. `paint()` now runs on mount and on every TipTap
  `transaction` event (doc edit, selection change, view update),
  batched through `requestAnimationFrame` so multiple transactions in
  the same frame collapse into a single repaint. PM strips `data-status`
  when it redraws a span, but the next transaction after the redraw
  re-stamps it on the following animation frame — the user can't
  perceive the single-frame gap.
- Also dropped the now-unused `data-hidden` attribute plumbing. Hiding
  solved highlights is driven purely by the container-level CSS keyed
  off `data-hide-resolved="true"` + `data-status="solved"`, so the eye
  toggle no longer requires any repaint at all and cannot deadlock the
  editor.
- `npx tsc --noEmit` clean.

## [2026-04-25b] — Follow-up polish: resolved-comment hiding, agreement paper editor, stamped-signature cleanup

- **Hide-resolved-comments now actually hides.** The on-disk playbook HTML
  stores `data-status="pending"` on every comment span, but
  `project_playbook_comment.status` in the database is the source of
  truth and changes over time. Previously `CommentMarkExtension` kept
  `commentStatus` as a managed TipTap mark attribute, so ProseMirror
  re-rendered `data-status="pending"` every view update — silently
  clobbering the `paint()` pass that stamps `data-status="solved"` /
  `data-hidden="true"` from the live comment list. The hide rule never
  matched.
  - `CommentMarkExtension.ts` drops the `commentStatus` attribute entirely.
    Now only `commentId` is a managed mark attribute; `data-status` and
    `data-hidden` are DOM-only and ProseMirror no longer touches them.
  - `PlaybookEditor.tsx` hardens `paint()` with a `MutationObserver` that
    re-stamps any comment span whose attributes get out of sync with the
    desired state (covers the rare case where ProseMirror's view swap
    drops the DOM attrs entirely).
  - Added a container-level belt-and-suspenders CSS rule keyed off a new
    `data-hide-resolved="true"` attribute on the editor wrapper. It
    directly neutralizes the yellow background + bottom-border + pointer
    events on any span with `data-status="solved"` whenever the wrapper
    is in hide-mode — so even a single-frame attribute flicker doesn't
    leak a highlight.
- **Edit-agreement popup now renders on white paper.**
  `AgreementFormModal.tsx` wraps the right-hand `RichTextEditor` in a
  new `.agreement-paper-editor` container and ships a scoped
  `<style>` block forcing `#ffffff` background + `#111827` text on
  `.tiptap-content` and `.ProseMirror` within. Headings, paragraphs,
  list items, table cells, blockquotes, inline code, and anchor colours
  all get light-mode overrides so the editing surface visually matches
  the preview drawer and the exported PDF/DOCX.
- **Big stamped signature block removed from the drawer view.**
  `AgreementDrawer.tsx` introduces a `stripStampedSignatureBlocks(html)`
  helper that strips every `<div data-signature-block …>…</div>` the
  `signAgreement` action appends to `agreement.content`. That stripped
  `displayContent` is now what the drawer renders, what the Preview
  modal receives, and what the PDF / DOCX exporters feed `html2canvas`
  and `html-docx-js`. The database row itself is untouched — the
  Signatures card below the prose still parses `data-signed-at`
  timestamps out of the stored content for each signer's "Signed
  <date>" line, so the audit trail is preserved while the giant
  duplicate signature stops appearing next to the small per-signer
  card.
- **Invoice privacy contract reconfirmed.** With yesterday's migrations
  already in place, the combined policy set matches the revised spec:
  admin/manager ALL, any member of `project.authorized_users` INSERT
  (with `created_by = auth.uid()`), and creator-only SELECT / UPDATE /
  DELETE for everyone else. `InvoicesTab.tsx` mirrors this with
  `canCreate = isAdminOrManager || project.authorized_users.includes(...)`
  and per-row `canEdit = isAdminOrManager || i.created_by === currentUserId`.
- `npx tsc --noEmit` clean; `npx next build` (Next.js 16.1.6 + Turbopack)
  compiled in 11.5 s with 15/15 static pages generated.

## [2026-04-25] — Docs paper preview + exports; agreement drawer tightened; invoice-create for project members

- **Reusable paper-preview modal for Docs.** New
  `src/app/docs/_components/DocumentPreviewModal.tsx` renders a rich-text
  HTML string on a white A4-style paper surface (Georgia serif, hex
  colours only so `html2canvas` can rasterize it) inside the shared
  `Modal` shell, with top-right "Download PDF" and "Download DOCX"
  buttons. Uses `exportElementToPdf` (paginated A4 via `html2canvas` +
  `jsPDF`) and `html-docx-js/dist/html-docx` for the DOCX path. A scoped
  `.docs-preview-content` stylesheet zeroes out the yellow playbook
  comment-highlight styling so the paper copy stays clean.
- **Playbook preview + exports.**
  `src/app/docs/_components/PlaybookEditor.tsx` gains three toolbar
  buttons — Preview (white), PDF (red-600), DOCX (blue-600) — modelled
  on the Sandbox Planner PRD step. The PDF handler builds an off-screen
  white-bg div from `activeVersion.content`, strips any
  `span[data-comment-id]` highlights, and delegates to
  `exportElementToPdf`; the DOCX handler wraps the same HTML in a
  standalone document and hands it to `html-docx-js`. The editor also
  carries a `playbookTitle`/`playbookSlug` pair so the filename tracks
  the version name.
- **Resolved-comment eye icon now reflects state, not action.**
  Flipped the SVG branches in `PlaybookEditor.tsx` so
  `showResolved=true` renders an open eye ("resolved are currently
  visible") and `showResolved=false` renders the slashed eye
  ("resolved are currently hidden"). The underlying
  `.comment-highlight[data-hidden="true"]` CSS in `globals.css` (which
  already correctly transparents the background and removes
  pointer-events) was not touched — the bug was a semantic mismatch
  between icon and state.
- **Agreement drawer — privacy + paper UX.**
  `src/app/docs/_components/modals/AgreementDrawer.tsx`:
  - The 300px sidebar (Status / Template / Google Docs / Authorized
    users / Required signers / Signed) is now wrapped in
    `{isAdminOrManager && (…)}` so non-admin viewers see only the
    document body.
  - The content column renders on `#ffffff` with `#111827` text via
    inline styles and a scoped `.agreement-paper-content` stylesheet,
    giving it the look of real paper. The Signatures block beneath the
    prose was re-skinned (gray-50 card backgrounds, gray-300 borders,
    gray-500 muted text) so it reads well on white.
  - The drawer header gained the same Preview / PDF / DOCX toolbar as
    the playbook, powered by `DocumentPreviewModal` and the same
    off-screen PDF / html-docx handlers.
- **Invoice-create returns to project members.** Per the revised spec
  any user in `project.authorized_users` may create an invoice; admins
  and managers additionally see every invoice on the project while
  every other user sees only the invoices they themselves created.
  - Migration
    `supabase/migrations/20260425000000_project_invoice_member_insert.sql`
    restores the `project_invoice: authorized user insert` policy with
    `created_by = auth.uid() AND EXISTS(… p.authorized_users)`. The
    creator-only SELECT added on 2026-04-24 stays, as does the
    admin/manager ALL policy.
  - `src/app/docs/_components/InvoicesTab.tsx` reverts the
    admin-only `canCreate` to
    `isAdminOrManager || project.authorized_users.includes(currentUserId)`.
- `npx tsc --noEmit` clean; `npx next build` (Next.js 16.1.6 +
  Turbopack) passes with 15/15 static pages generated.

## [2026-04-24] — Docs privacy rules realigned + playbook comment fix + inline Signatures block

- **RLS rewrite across all seven Docs tabs** to match the new privacy
  contract.
  (migration `supabase/migrations/20260424000000_docs_privacy_rules.sql`)
  - `project_playbook_version`: SELECT now checks
    `project.authorized_users` via `EXISTS` against the parent project row,
    instead of the version's own (unused) `authorized_users` column.
    This unblocks project members from seeing the playbook.
  - `project_agreement_version`: dropped the `get_user_type() = 'client'`
    gate so any user listed in an agreement's `authorized_users` can
    SELECT it regardless of their profile type. Added a `signer update`
    policy so a required signer can persist the signature-block append
    that `signAgreement` writes into `content`.
  - `project_file` / `project_link` / `project_video` /
    `project_daily_feedback`: dropped the "authorized user insert"
    policies. Only admin/manager may create; owner still UPDATE + DELETE;
    project members still SELECT.
  - `project_invoice`: replaced project-wide SELECT with creator-only
    SELECT and dropped authorized-user INSERT. Admin/manager keep ALL.
- **Playbook comments for non-admin members**: `PlaybookTab` now computes
  `canComment = isAdminOrManager || project.authorized_users.includes(…)`
  and threads it into `PlaybookEditor`, which has a new `canComment` prop
  independent from `editable`. The floating "Add comment" bubble and
  compose popover fire whenever `canComment` is true, while the
  "Update / Save as new version / Build from idea" toolbar stays gated
  on `editable`. When `!editable`, `submitComment` skips the
  `savePlaybookVersion` persistence step (project members can't UPDATE
  the version under the new RLS) — the comment itself is still saved to
  `project_playbook_comment`.
  (`src/app/docs/_components/PlaybookTab.tsx`,
  `src/app/docs/_components/PlaybookEditor.tsx`)
- **Inline Signatures block on agreements**: `AgreementDrawer` renders a
  new Signatures section below the agreement body whenever
  `required_signers.length > 0`. Each required signer gets a two-column
  card showing its role label (CLIENT / SERVICE PROVIDER / SIGNER N
  based on position), profile name, and one of: the stored signature
  image + "Signed <timestamp>" (parsed from the `data-signed-at` audit
  block that `signAgreement` appends to `content`); a "Sign here" CTA
  for the current user if they're a required signer and haven't signed
  yet; an "Upload signature to sign" link if they have no signature on
  file; or an "Awaiting signature" placeholder otherwise. The existing
  footer sign button remains as a secondary affordance.
  (`src/app/docs/_components/modals/AgreementDrawer.tsx`)
- **Tightened `+ New` buttons** on Files / Links / Videos / Daily
  Feedback / Invoices tabs to `isAdminOrManager` only, so non-admin
  project members can still see the rows but can't create new ones —
  matching the new privacy contract.
  (`FilesTab.tsx`, `LinksTab.tsx`, `VideosTab.tsx`, `DailyFeedbackTab.tsx`,
  `InvoicesTab.tsx`)

## [2026-04-23] — Sandbox edit, Files thumbnails, Docs › Invoices tab

- **Sandbox Planner — edit idea**: idea cards on `/sandbox-planner` now carry
  an edit (pencil) icon next to the delete/trash button. Clicking it opens
  the existing `CreateIdeaModal`, which has been extended to accept an
  optional `idea` prop; when present the modal switches to edit mode
  (prefilled name/description/project) and calls the `updateIdea` server
  action instead of `createIdea`.
  (`src/app/sandbox-planner/_components/IdeasGrid.tsx`,
  `src/app/sandbox-planner/_components/CreateIdeaModal.tsx`)
- **Docs › Files — visual attachments**: file rows on
  `/docs?project=[id]&tab=files` now render each attachment as a visual
  tile — thumbnail for image mime-types, colored extension badge
  (PDF / DOC / XLS / PPT / ZIP / VID / AUD / …) for everything else — in
  place of the plain-text filename links that shipped previously. The row
  itself shows the record name, file-count, owner and updated date above
  the attachment grid.
  (new `src/app/docs/_components/AttachmentTile.tsx`,
  `src/app/docs/_components/FilesTab.tsx`)
- **Docs › Invoices tab**: delivers the previously-stubbed Invoices tab at
  `/docs?project=[id]&tab=invoices`. Full CRUD with a printable invoice
  preview that uses the browser print-to-PDF dialog.
  - New table `public.project_invoice` with fields `id, project_id,
    created_by, authorized_users, code, company_or_user_name,
    document_number, address, phone, email, client_name, service_price,
    due_date, service_title, service_description, swift_code, iban_code,
    created_at, updated_at` plus RLS mirroring the other Docs tabs
    (admin/manager full; project.authorized_users SELECT + INSERT where
    `created_by = auth.uid()`; row owner UPDATE + DELETE) and a
    `BEFORE UPDATE` trigger to keep `updated_at` fresh.
    (migration `20260423100000_project_invoice.sql`)
  - Three new server actions — `createProjectInvoice`,
    `updateProjectInvoice`, `deleteProjectInvoice` — plus an `InvoicePayload`
    shared type used by the modal form.
    (`src/app/docs/actions.ts`)
  - UI: card grid of invoices with quick-actions, plus an
    `InvoiceFormModal` covering all fields (issuer, client, service,
    payment) and a print-styled `InvoicePreview` matching the purple
    invoice reference (INVOICE header, From / Invoice To, Issue Date,
    Due Date, Amount Payable, service line, SWIFT / IBAN block). The
    `ComingSoonPanel` fallback in `DocsShell` is removed — all seven tabs
    now have a concrete implementation.
    (`src/app/docs/_components/InvoicesTab.tsx`,
    `src/app/docs/_components/modals/InvoiceFormModal.tsx`,
    `src/app/docs/_components/InvoicePreview.tsx`,
    `src/app/docs/_components/DocsShell.tsx`,
    `src/app/docs/page.tsx`,
    `src/types/docs.ts`,
    `src/lib/supabase/types.ts`)

## [2026-04-23] — Docs: Playbook-from-Idea, resolvable comments, in-drawer Sign UX

- **Build playbook from Sandbox idea**: new `buildPlaybookFromIdea(projectId, ideaId)`
  server action compiles the linked idea's PRD / Database / Visual Styles /
  Milestones sections into a fresh `project_playbook_version`. Surfaces as a
  "Build from Sandbox idea" button in the playbook empty state and a compact
  "Build from idea" button in the editor toolbar. Invisible when no idea is
  linked to the current project.
  (`src/app/docs/actions.ts`, `src/app/docs/page.tsx`,
  `src/app/docs/_components/DocsShell.tsx`,
  `src/app/docs/_components/PlaybookTab.tsx`,
  `src/app/docs/_components/PlaybookEditor.tsx`,
  reusing `src/app/sandbox-planner/_lib/loadIdeaFull.ts`)
- **Resolvable playbook comments**: new enum
  `public.os_playbook_comment_status` (`pending` | `solved`) and a matching
  `status` column on `project_playbook_comment`
  (migration `20260423000000_docs_playbook_comment_status.sql`). Admin,
  manager, and the comment creator can toggle status via a checkmark in the
  thread panel header; a "Resolved" pill marks solved threads. Solved
  comments are hidden by default in the editor; a toolbar eye-toggle reveals
  them Google-Docs-style with a dimmed dotted underline.
  (`src/app/docs/_components/CommentThreadPanel.tsx`,
  `src/app/docs/_components/CommentMarkExtension.ts`,
  `src/app/docs/_components/PlaybookTab.tsx`,
  `src/app/docs/_components/PlaybookEditor.tsx`,
  `src/app/globals.css`, new
  `setPlaybookCommentStatus` action in `src/app/docs/actions.ts`)
- **Discoverable agreement signing**: `AgreementDrawer` footer now surfaces
  the sign flow directly — a primary "Sign with my signature" button when
  the current user can sign, an "Upload signature to sign" link to `/profile`
  when `profile.signature` is empty, a "Signed · awaiting others" pill after
  signing, and a "Completed" pill once all required signers have signed.
  The existing `sign_agreement` RPC + signature stamp in `signAgreement`
  action are unchanged.
  (`src/app/docs/_components/modals/AgreementDrawer.tsx`,
  `src/app/docs/_components/AgreementsTab.tsx`)
- **Creator override for agreement edit/delete**: `AgreementRow` and
  `AgreementDrawer` now expose Edit (and row-level Delete) to the
  agreement's `created_by` in addition to admin/manager — the RPC already
  allows this; only the UI gate was restrictive.
  (`src/app/docs/_components/AgreementRow.tsx`,
  `src/app/docs/_components/modals/AgreementDrawer.tsx`)

## [2026-04-23] — Docs page: Files / Links / Videos / Daily Feedback tabs

- **Files tab (`/docs?tab=files`)**: table of project files with full CRUD.
  Rows carry multiple uploads stored in a new public `project-files`
  storage bucket (50 MB per file). Name + attachment list rendered in a
  single modal; inline download links on each row.
  (`src/app/docs/_components/FilesTab.tsx`,
  `src/app/docs/_components/modals/FileFormModal.tsx`)
- **Links tab (`/docs?tab=links`)**: CRUD for project URL links (name +
  URL). (`src/app/docs/_components/LinksTab.tsx`,
  `src/app/docs/_components/modals/LinkFormModal.tsx`)
- **Videos tab (`/docs?tab=videos`)**: CRUD for project video URLs
  (name + URL) — same shape as Links, but persisted separately.
  (`src/app/docs/_components/VideosTab.tsx`,
  `src/app/docs/_components/modals/VideoFormModal.tsx`)
- **Daily Feedback tab (`/docs?tab=daily_feedback`)**: card list grouped
  by date (newest first). Each entry has four rich-text fields (Today,
  Tomorrow, Blockers, Video & Links) edited via TipTap in a modal with
  a `DatePicker` for the entry date.
  (`src/app/docs/_components/DailyFeedbackTab.tsx`,
  `src/app/docs/_components/modals/DailyFeedbackFormModal.tsx`)
- **Access rules (all four tabs)**: admin/manager plus members of
  `project.authorized_users` can view + create. Only admin/manager and
  the record's own creator can update/delete. Enforced via Row Level
  Security — the old row-level `authorized_users` read policies were
  replaced with project-scoped `EXISTS` checks matching the
  `task_comment` pattern.
- **Server actions**: 12 new actions appended to
  `src/app/docs/actions.ts` — `createProjectFile / updateProjectFile /
  deleteProjectFile`, same for Link / Video, plus
  `createDailyFeedback / updateDailyFeedback / deleteDailyFeedback`.
  Each create stamps `created_by = auth.uid()` and revalidates `/docs`.
- **Shell wiring**: `src/app/docs/_components/DocsShell.tsx` now routes
  all seven tabs (only Invoices remains as a "Coming soon" stub); the
  new tab data is fetched in parallel in
  `src/app/docs/page.tsx`.
- **Schema**: migration
  `supabase/migrations/20260423000000_docs_project_tabs.sql`
  adds `attachments JSONB` to `project_file`, normalises
  `project_video.updated_at` to NOT NULL, creates the `project-files`
  storage bucket with owner-scoped write policies, and re-creates RLS
  policies on all four tables to match the new access model.

## [2026-04-22] — Docs page: Playbook + Agreements

- **New route `/docs?project=<id>&tab=<tab>`**: role-filtered project list
  on the left (admin/manager see all; others only projects whose
  `authorized_users` contains their id). Right panel exposes the
  Playbook | Agreements | Files | Links | Videos | Daily Feedback |
  Invoices tab strip. Only Playbook and Agreements ship this round — the
  other five render a "Coming soon" placeholder.
  (`src/app/docs/page.tsx`, `src/app/docs/_components/DocsShell.tsx`)
- **Playbook tab**: TipTap rich-text editor with version picker and
  admin/manager controls for "Update current version" and
  "Save as new version". Authorized project users can anchor comments
  to a text selection (Google-Docs-style) — the selection is persisted
  via a custom `playbookComment` TipTap Mark. Clicking a highlighted
  span opens a right-side thread drawer with replies, file attachments
  (stored in `project-playbook-attachments` bucket), edit/delete, and
  unread-badge bookkeeping via `mark_playbook_comments_viewed` /
  `mark_playbook_comment_replies_viewed` RPCs.
  (`src/app/docs/_components/PlaybookTab.tsx`,
  `src/app/docs/_components/PlaybookEditor.tsx`,
  `src/app/docs/_components/CommentThreadPanel.tsx`,
  `src/app/docs/_components/CommentMarkExtension.ts`)
- **Agreements tab**: agreements grouped by linked template (or
  "No template"), each with an aggregated status badge. Admin/manager
  can create/edit/delete agreements and templates. Each row shows the
  signer avatar stack + `signedCount / requiredCount`. Authorized users
  in `ready_to_sign` agreements see a "Sign" button that confirms their
  signature image before calling the `sign_agreement` RPC. The RPC
  appends the current user to `signed_by` and flips status to
  `completed` once `required_signers ⊆ signed_by`. A signature HTML
  block (image + name + timestamp) is appended to the agreement content
  on every sign. (`src/app/docs/_components/AgreementsTab.tsx`,
  `src/app/docs/_components/AgreementRow.tsx`,
  `src/app/docs/_components/modals/*`)
- **Shared rich-text editor**: extracted TipTap setup + toolbar into
  `src/components/editor/RichTextEditor.tsx` with an imperative
  `RichTextEditorHandle` (`getHTML`, `setContent`, `getEditor`) plus
  `extraExtensions`, `onSelectionChange`, and `toolbarRight` slots.
  `SopEditor` refactored to consume it — its version picker + save
  buttons moved into the `toolbarRight` slot.
  (`src/components/editor/RichTextEditor.tsx`,
  `src/app/sops/_components/SopEditor.tsx`)
- **Signature editor on `/profile`**: new `SignatureEditor` with
  Upload and Draw tabs. Upload accepts PNG/JPG; Draw is a 400×150
  pointer-driven canvas with Clear + Save. Both flows upload to the
  `user-signatures` storage bucket and save the public URL to
  `profiles.signature`, which `SignAgreementModal` previews before
  signing. `updateProfile` action accepts the new optional `signature`
  field. (`src/app/profile/_components/SignatureEditor.tsx`,
  `src/app/profile/_components/ProfileForm.tsx`,
  `src/app/profile/actions.ts`, `src/app/profile/page.tsx`)
- **Schema**: migration
  `20260422100000_docs_playbook_comments_and_agreement_signing.sql`
  adds `signed_by UUID[]`, `required_signers UUID[]`, `authorized_users
  UUID[]`, `google_docs_url`, `updated_at` to
  `project_agreement_version` (and makes `type` nullable);
  `google_docs_url` + `updated_at` to `project_playbook_version`;
  `signature` column to `profiles`; creates
  `project_playbook_comment` + `project_playbook_comment_reply` tables
  with JSONB attachments, `viewed_by UUID[]`, owner/admin RLS, and
  project-authorized-user SELECT/INSERT policies. Adds public
  `project-playbook-attachments` + `user-signatures` storage buckets
  with authenticated-insert + owner-UPDATE/DELETE policies. Adds
  SECURITY DEFINER functions `mark_playbook_comments_viewed`,
  `mark_playbook_comment_replies_viewed`, `sign_agreement`. Supabase
  types regenerated.

## [2026-04-21] — Projects list popup flip + DeveloperTasks assignee filter

- **Authorized Users popover**: the inline user-picker on the Projects list
  now measures available viewport space on open and flips above the trigger
  when there is not enough room below, so it no longer gets cut off on the
  last row. (`src/app/projects/_components/ProjectsList.tsx`)
- **DeveloperTasks inline Assignees**: the `+` dropdown on milestone/task
  rows now only lists users in `project.authorized_users`, matching the
  behavior already in `TaskModal`. (`src/app/projects/_components/tabs/DeveloperTasks.tsx`)

## [2026-04-21] — UserPicker + chat attachments

- **UserPicker**: new reusable component at `src/components/UserPicker.tsx`
  shows selected users as an avatar row with per-avatar hover-remove, plus
  a `+` button that opens a dropdown listing unselected profiles (avatar
  + name). Wired into the Project modal's Authorized Users field and the
  Task modal's Assignees field. Task assignees are restricted to the
  user IDs in `project.authorized_users` (threaded via new
  `authorizedUserIds` props on `TaskModal` and `TasksKanban`).
- **Task chat overhaul**: new `TaskChat` component supports file
  attachments (upload to Supabase Storage bucket
  `task-comment-attachments`, images render inline, other files show as
  download chips), message edit (inline textarea with attachment
  add/remove), and message delete (also cleans up uploaded files). Own
  messages expose pencil/trash icons on hover; edited messages show an
  `· edited` indicator. New server actions `updateTaskComment`,
  `deleteTaskComment`; `createTaskComment` now accepts an attachments
  array.
- **Schema**: migration `20260422000000_task_comment_attachments.sql`
  adds `task_comment.attachments JSONB NOT NULL DEFAULT '[]'` and
  `edited_at TIMESTAMPTZ`, creates the public
  `task-comment-attachments` storage bucket, and scopes storage RLS to
  authenticated upload + owner update/delete. Existing `task_comment`
  owner-ALL RLS already covers the new UPDATE/DELETE paths.

## [2026-04-21] — Project/task date + aggregate polish

- **Task modal**: on edit, fetches its own `time_track` entries via
  `getTaskTimeEntries` so the Time Tracker section shows saved rows
  (previously rendered empty because no caller passed `timeEntries`).
- **QA Time Tracker modal**: removed the duplicate inner close button
  that overlapped the `Modal`-provided X.
- **Project Totals (Developer tab)**: added a "Project" row (editable
  Est, read-only Real) and made Est editable on
  `Client Requests (Developer)`, `QA Requests (Developer)`,
  `QA Requests (QA Tester)`. New generic server action
  `updateProjectAggregateEstimate`; `updateProjectQaTesterEstimatedTime`
  now delegates to it. `recalculateAggregates` no longer overwrites the
  aggregate estimate columns from task sums — they are user-entered,
  matching the existing `qa_tester_estimated_time` behavior. When
  `change_automatically_project_estimated_time` is on,
  `project.estimated_time = milestones_sum + 3 aggregate columns`.
- **Real dates auto-computed**: `ProjectModal` and `TaskModal` now render
  Start/End Date (Real) as `readOnly` DatePickers. `recalculateRealTime`
  now writes `project.start_date_real` / `end_date_real` from min/max
  `time_track` + `qa_time_track` `start_date`, and each `task`'s real
  dates from the subtree (own + descendant time_track) instead of only
  own entries.
- **Estimated date bounds**: `DatePicker` gained `minDate` / `maxDate`
  props that disable out-of-range days. Project and task modals, and the
  inline date cells in `DeveloperTasks`, now enforce
  `start_date_estimated ≤ end_date_estimated`.

## [2026-04-21] — Drop real-time automation flags

- **Schema**: new migration `20260421000002_drop_real_time_auto_flags.sql`
  removes `project.change_automatically_milestone_real_time` and
  `project.change_automatically_project_real_time`. Real-time values always
  reflect current `time_track` / `qa_time_track` state, so the toggles were
  redundant.
- **`recalculateRealTime`**: no longer reads or gates on those flags. It
  unconditionally recomputes milestone `real_time` and writes the five
  project-level real-time fields (`real_time`, `client_developer_real_time`,
  `qa_developer_real_time`, `qa_tester_real_time`).
- **`ProjectModal`**: removed the two toggle rows, state, and the two
  fields from `ProjectInput`. Form payload is now four automation flags
  instead of six.
- **Types**: `Project` interface and `src/lib/supabase/types.ts`
  (`project` Row / Insert / Update) no longer expose the two columns.

## [2026-04-21] — Projects: time-tracking aggregates move to project level

- **Schema**: dropped `client_milestone_total` and `qa_milestone_total`. Added
  six aggregate columns on `project`:
  `client_developer_estimated_time`, `client_developer_real_time`,
  `qa_developer_estimated_time`, `qa_developer_real_time`,
  `qa_tester_estimated_time`, `qa_tester_real_time`. Two new migrations:
  - `20260421000000_project_time_aggregates_add.sql` — additive + backfills
    the 6 columns from the existing milestone-total rows (sum per project).
  - `20260421000001_project_time_aggregates_drop.sql` — drops the two legacy
    tables. Run **after** the app is deployed.
- **Aggregation**: `recalculateAggregates` now computes `client_developer_*`
  and `qa_developer_*` from `task.estimated_time` grouped by
  `task.type = client_requests | qa_requests`, gated by
  `project.change_automatically_project_estimated_time`. Milestones no longer
  fold client/qa children into their own `estimated_time`; `project.estimated_time`
  instead sums the dev-only milestone rollups + the 4 project-level
  dev/tester estimates. `recalculateRealTime` writes
  `client_developer_real_time`, `qa_developer_real_time`, and
  `qa_tester_real_time` every call (not gated).
- **New server action**: `updateProjectQaTesterEstimatedTime(projectId, value)`
  handles the one remaining user-editable field at project level and cascades
  a recalc so `project.estimated_time` stays consistent.
- **Deleted**: `updateClientMilestoneTotal`, `updateQAMilestoneTotal`,
  `recalculateMilestoneEstFromTotals`, and the `ClientMilestoneTotal` /
  `QAMilestoneTotal` TypeScript interfaces.
- **UI (`projects?tab=developer`)**: the three per-milestone aggregate rows
  (`Client Requests (Developer)`, `QA Requests (Developer)`,
  `QA Requests (QA Tester)`) are gone. A single "Project Totals" block now
  renders once at the bottom of the milestone list. Five numbers are
  read-only; only `QA Requests (QA Tester)` estimated time is editable by
  admins/managers and persists via the new server action.
- **Task modal**: `Milestone` label renamed to `Milestone (optional)` on the
  `client_requests` / `qa_requests` create forms, with a new leading
  `No milestone` option so tasks can be created with no parent milestone.

## [2026-04-20] — UI polish + AI model list refresh + Claude reliability fix

- **Sidebar**: `Settings` moved to the bottom of the nav list (after
  `Prompts` for admins/managers). New `TRAILING_NAV_ITEMS` array renders
  unconditionally last so the order is consistent for every role.
- **Chatbot bubble icon**: Replaced the previous speech-bubble-with-tail SVG
  with a clean rounded speech-bubble and three dots — no decorative tail or
  chevron, matching the request.
- **AI model catalogue refreshed** (`src/types/settings.ts`) to the April 2026
  lineup — OpenAI (`gpt-5`, `gpt-5-mini`, `gpt-5-nano`, `gpt-4.1*`, `gpt-4o*`,
  `o4-mini`, `o3*`, `o1`), Gemini (`gemini-2.5-*`, `gemini-3-*`), and Claude
  (`claude-haiku-4-5`, `claude-sonnet-4-5/4-6`, `claude-opus-4-5/4-6` +
  dated IDs). Fast tiers (mini/flash/haiku) sit at the top of each list
  because Sandbox Planner prompts benefit more from low latency than flagship
  reasoning depth.
- **Claude reliability fix**: `claude-sonnet-4-6` (and other short aliases)
  intermittently took a long time or returned transient errors. Root causes
  and fixes:
  1. Short aliases sometimes 404 or time-out against Anthropic's Messages API
     when a versioned ID is expected. Added `CLAUDE_MODEL_ALIASES` that
     resolves `claude-sonnet-4-6` → `claude-sonnet-4-5-20250929` (and peers)
     before the fetch. Already-versioned IDs pass through unchanged.
  2. No retry on transient 429 (rate-limit), 529 (overloaded — common on
     flagship Sonnet during peak hours), 503 / 5xx, or network flakes. Added
     3-retry exponential backoff (1.2s → 2.4s → 4.8s) that honours any
     `Retry-After` header from Anthropic. Timeouts are NOT retried to stay
     inside the 240s client budget.
  3. 529 "overloaded" now surfaces a user-friendly message instead of the
     raw provider string, so the toast says *"Claude is temporarily
     overloaded… try again in a moment"* rather than a cryptic error.
  4. Reduced default `max_tokens` from 16384 → 8192 — Sandbox Planner JSON
     outputs have always fit inside 8K, and the higher cap was extending
     latency on Sonnet without upside.
  - File: `src/lib/api/claude.ts`.
- **Product Definition step**: `Regenerate` and `Save` are now on the same
  right-aligned action row. Previously the Regenerate button sat inside the
  right column and Save sat below on a full-width row, which looked
  visually orphaned.
- **Auto-trigger coverage audited**: All 10 refinement steps already invoke
  `useAutoTriggerAi(idea.id, <step>, isEmpty, isAiWorking)` — confirmed for
  `structure_align`, `refining_icp`, `product_definition_flows`,
  `benchmarking`, `strategic_frameworks`, `prd`, `database`, `visual_styles`,
  `milestones_and_tasks`, and `report`. First visit to an empty step
  auto-kicks AI generation with a 1s delay so the Supabase Realtime channel
  is subscribed first.

## [2026-04-19] — Sandbox Planner: Idea Chatbot (floating chat widget)

- **New**: A floating chat bubble appears bottom-right on every refinement tab
  (`structure_align`, `refining_icp`, `product_definition_flows`, `benchmarking`,
  `strategic_frameworks`, `prd`, `database`, `visual_styles`,
  `milestones_and_tasks`, `report`). Clicking opens a panel that talks to an AI
  co-pilot grounded in the full idea context (structure & align, ICPs,
  optimization suggestions, product definition, benchmarking, PRD, database,
  styles, milestones, report) — reassembled from the DB on every message so
  answers are always fresh.
- **DB**: `supabase/migrations/20260421000000_idea_chatbot.sql` creates enum
  `os_idea_chatbot_message_type` (`'user' | 'chatbot'`), table
  `public.idea_chatbot` (id, idea_id FK, created_by, type, message, created_at,
  updated_at) with `(idea_id, created_at)` index, `set_updated_at` trigger, RLS
  enabled, and adds the table to `supabase_realtime` so collaborators on the
  same idea see replies appear live.
- **Prompt**: Seeded `public.prompt` id `a1b2c3d4-0000-4000-8000-000000000001`
  ("Idea Chatbot Prompt") with strict grounding rules — the bot must quote
  source fragments, say "not defined yet" for empty fields, return HTML-only
  replies (`<p>`, `<ul>`, `<li>`, `<strong>`, `<em>`, `<code>`), and never
  invent facts. Editable via `/prompts` like the other 10 sandbox-planner
  prompts; server falls back to `FALLBACK_IDEA_CHATBOT` if the row is missing.
- **Refactor**: Extracted the 10-query `IdeaFull` loader from
  `sandbox-planner/page.tsx` into `_lib/loadIdeaFull.ts` so both the initial
  server render and the chatbot's per-message context rebuild read the exact
  same canonical shape.
- **Server actions** (`src/app/sandbox-planner/actions.ts`): `loadChatHistory`
  (chronological messages for an idea) and `sendChatMessage` (auth → persist
  user msg → rebuild `IdeaFull` → render prompt via `buildIdeaContextVars` +
  chat history window → call `generateAiJsonResponse<{ reply: string }>` via
  the user's configured AI provider → sanitize HTML (strip `<script>` and
  `javascript:` URLs) → persist chatbot reply → return both rows).
- **UI** (`_components/IdeaChatbot.tsx`): Round bubble toggles a 380×560
  floating panel with optimistic sends, `useTransition`-driven typing dots,
  Escape-to-close, auto-scroll, and a realtime subscription to `idea_chatbot`
  inserts (de-duped by row id) so a message sent in another tab/browser
  appears live. Mounted in `SandboxPlannerShell` guarded by
  `activeTab !== 'ideas'`.
- Files: `supabase/migrations/20260421000000_idea_chatbot.sql`,
  `src/types/sandbox-planner.ts`, `src/app/sandbox-planner/page.tsx`,
  `src/app/sandbox-planner/actions.ts`,
  `src/app/sandbox-planner/_lib/loadIdeaFull.ts` (new),
  `src/app/sandbox-planner/_components/IdeaChatbot.tsx` (new),
  `src/app/sandbox-planner/_components/SandboxPlannerShell.tsx`.

## [2026-04-19] — Sandbox Planner: tab gating no longer regresses on upstream regeneration

- **Bug**: After regenerating Refining ICP on an idea that already had a full PRD
  / Database / Styles / Milestones / Report, the PRD tab (and everything
  downstream) became locked. Root cause: `computeUnlockedSteps()` in
  `SandboxPlannerShell.tsx` was purely upstream-driven — PRD unlocks only when
  any ICP has `value_proposition_icp_pains` or `jtbd`. Regenerating Refining ICP
  writes fresh ICP rows with those strategic fields empty until the user re-runs
  Strategic Frameworks, which collapsed the gate to `false` even though the
  downstream `idea_prd` row was fully populated.
- **Fix**: Each downstream step now also unlocks if **its own** data already
  exists (`prd`, `database`, `visual_styles`, `milestones_and_tasks`, `report`
  all get the "OR own data exists" escape hatch). Regenerating an upstream step
  can no longer hide completed work; the tab stays accessible as long as its
  table row still has content.
- Files: `src/app/sandbox-planner/_components/SandboxPlannerShell.tsx`.

## [2026-04-19] — Sandbox Planner: DB prompt sync (Refining ICP / Benchmarking / Strategic Frameworks)

- **Refining ICP**: DB prompt updated to require `our_solution_value` and
  `how_problems_are_solved_currently` / `how_problems_could_be_solved`. The live
  DB row was still on an older schema missing these fields, so "Our Solution
  Value" was rendering empty after AI generation.
- **Benchmarking**: DB prompt updated to require `possible_business_models` as a
  4–6 item `<ul>` with rationale per model. Previously omitted from the DB row,
  which left that section empty in the UI.
- **Strategic Frameworks**: DB prompt was instructing the AI to emit **BBCode**
  (`[list][*]…[/list]`, `[b]`, `[br]`) — the rich-text editor expects HTML, so
  the raw bracket syntax leaked through as plain text. Switched the prompt to
  require HTML (`<ul><li>`, `<p>`, `<strong>`) with an explicit "Do NOT use
  BBCode or Markdown" clause. Existing rows with legacy BBCode will re-emit as
  HTML on next Regenerate.
- Applied via `supabase/migrations/20260420100000_sync_sandbox_prompts.sql` —
  UPDATE by id so rows remain editable from the `/prompts` page.


## [2026-04-19] — Sandbox Planner: Report rigor + Next Steps UI polish

- **Report prompt rewritten** (`src/app/sandbox-planner/actions.ts`): `FALLBACK_REPORT`
  now enforces a per-area scoring rubric (5 bands 0–100), an evidence-quoting rule
  (each `description` must cite a ≤ 12-word fragment from the source in single-quotes),
  and 5 explicit penalty triggers: no real competitors (-10), alpha-API dependency (-5),
  no measurable success metrics (-8), single-ICP dependency (-5), no MVP scope cut (-5).
- **Richer ICP context for scoring**: `buildIcpsBlock` now serialises 7 additional
  strategic fields (subtitle, firmographics, psychographics, value_proposition_*)
  so the Strategic Positioning area has the data needed for an accurate grade.
- **Prompt seeded in Supabase** (`supabase/migrations/20260420000000_seed_report_prompt.sql`):
  the Report prompt now lives in `public.prompt` under the SandBox Planner group and is
  editable from the /prompts UI without redeploy.
- **Next Steps card uniformised** (`src/app/sandbox-planner/_components/ReportStep.tsx`):
  all four CTAs (Schedule Follow-Up, Refine Validation, Download Playbook PDF,
  Initiate Sandbox Review) now share `CTA_BASE/PRIMARY/SECONDARY/OUTLINE/PRIMARY_DISABLED`
  constants — identical padding, radius, font. Defence-in-depth CSS hides any rogue
  `<button>`/`<a.btn>`/`<ul>`/`<ol>` the AI might still inject in the `next_steps` HTML.


---

## [2026-04-19] — Sandbox Planner: Report step + per-block PDF exporter

Two related improvements to the Sandbox Planner export + final-step experience.

### 1. Per-block PDF exporter — fixes mid-row text cuts on `?tab=prd`
**Root cause**: `PrdPreviewModal.tsx` and `PrdStep.tsx` both rendered the preview surface to a single tall `html2canvas` canvas and sliced it across A4 pages by raw Y-offset. With no element awareness, any paragraph, list item, table row, or heading sitting on a page boundary was bisected mid-character.

**Fix**: New shared helper `src/app/sandbox-planner/_lib/exportPdf.ts` (`exportElementToPdf`) walks the preview surface block-by-block (`h1-h6, p, ul, ol, blockquote, table, hr, img, figure, pre, .keep-together, .prd-section, .report-section`), renders each block to its own scale-2 canvas, and places it on the PDF, starting a new page when the next block wouldn't fit. Blocks that are themselves taller than a usable A4 page are sliced at the closest horizontal near-white band (≥ 4 px tall, scanned upward from the page break). `PrdPreviewModal` and `PrdStep` now both delegate to this helper — no block is ever bisected. `break-inside: avoid` CSS hints added to prose, list items, table rows, and blockquotes.

### 2. New step 11 — Report

- **Migration** `20260419000000_idea_report.sql`: adds `'report'` to enum `os_idea_block`, creates `idea_report` (idea_id UNIQUE, `final_score`, `threshold_bucket` ∈ {ready/refine/risk}, `headline`, `summary`, `area_scores` JSONB, `penalties` JSONB, `next_steps`, `playbook_title/subtitle/html`, timestamps), enables RLS with a permissive `FOR ALL` policy matching sibling tables, attaches the shared `set_updated_at` trigger, and seeds the Report prompt row (`e1f6cb88-…`) linked to the `SandBox Planner` prompt_group.
- **Types** (`src/types/sandbox-planner.ts`): `IdeaBlock` extended with `"report"`; step 11 label + subtitle; new `IdeaReport`, `IdeaReportArea`, `IdeaReportPenalty` interfaces; `IdeaFull.report`.
- **AI prompt** (DB-seeded + `FALLBACK_REPORT`): 6-area weighted rubric totalling 100% — Customer/Problem/Reality 25%, Competitive/Alternative 15%, Strategic Positioning 20%, Market Validation 10%, Business/Execution 15%, MVP Scope/Risk 15%. Each area returns `raw_score_pct`, `weighted_points = round(raw * weight / 100)`, `status` (strong ≥ 80 / average 60–79 / weak < 60), and a one-sentence justification. Five automatic penalties (competitors count < 2, alpha/beta API dependency, missing success metrics, single-ICP, empty out-of-scope). `final_score = clamp(0, 100, Σ weighted − Σ |penalties|)`; threshold bucket derived server-side. Playbook HTML must cover 11 required sections.
- **Server action** (`actions.ts`): `PROMPT_ID_BY_STEP.report`, `FALLBACK_REPORT`, `generateReport()` (loads structure/ICPs/suggestions/product-def/benchmarking/PRD/database/styles/milestones in parallel inside `triggerAiGeneration`, strips HTML per field, reconciles area scores + penalties server-side, clamps `final_score`, rederives threshold, upserts `idea_report`), `saveReport()` for manual headline/summary edits, and new `case "report":` in the switch.
- **Page fetch**: `sandbox-planner/page.tsx` adds a parallel `idea_report` fetch and wires it into `ideaFull.report`.
- **UI** (`ReportStep.tsx`): two-column dashboard — donut SVG score, colour-coded threshold badge ("Ready for Sandbox" / "Needs Refinement" / "High Risk"), editable headline + summary with Save, "Weighted Score Summary" card listing all 6 areas with status pills and raw-score numbers, "Automatic Penalties Applied" card, right-rail Next Steps card + Threshold Guide + Founders Program promo, and a "Move37 Playbook" preview card with a **Live Preview** button.
- **Modal** (`ReportPreviewModal.tsx`): printable playbook surface with cover donut + inline hex styling (no oklch, html2canvas-safe), toolbar with PDF + DOCX export. PDF uses the new shared `exportElementToPdf` helper; DOCX uses the existing `html-docx-js` path.
- **Auto-trigger**: `useAutoTriggerAi(idea.id, "report", report.final_score == null, isAiWorking)` — first visit auto-fires generation.
- **Ancillary**: `AiLoadingOverlay.STEP_FIELDS.report` wired, Supabase TypeScript types regenerated, `next.config.ts` pins `turbopack.root` to the project directory.

---

## [2026-04-18] — Sandbox Planner: idea list polish, VP-map round-trip, scoring rubric, table renames

Five related improvements to the Sandbox Planner:

### 1. Idea list (step 1)
- Each idea card now renders its description as **formatted HTML** (bold, bullets, etc.) via the `prose` typography plugin instead of raw tags.
- Card shows **"Created by {first_name} {last_name}"** below the description — derived from a new `creator:created_by(first_name, last_name)` join on the ideas list query.
- Cards have a **trash icon** in the top-right corner. Clicking it opens a confirm dialog (reuses `ConfirmDeleteModal` with new `kind: "idea"`) and, on confirm, calls the existing `deleteIdea` server action. All child tables cascade via their existing `ON DELETE CASCADE` FKs.

### 2. Refining ICP (step 3) — `our_solution_value` round-trip
Root cause: `page.tsx` was explicitly selecting columns from `idea_icp` and had omitted `our_solution_value` (plus `value_proposition_value_map_solutions`, `value_proposition_value_map_gain_creators`, `score_rationale`). The AI wrote the field successfully, but the page never read it back. **Fixed** the SELECT and reinforced the prompt to mark the field REQUIRED.

### 3. Benchmarking (step 5) — `possible_business_models`
Prompt reinforced to require **exactly 4–6** models with `<ul><li>` structure and a "do not leave this field empty" directive.

### 4. Strategic Frameworks (step 6)
- **VP map fields** (`value_proposition_value_map_solutions`, `value_proposition_value_map_gain_creators`) now round-trip correctly thanks to the expanded `idea_icp` SELECT in `page.tsx`.
- **Scoring rubric**: prompt rewritten from "give a differentiated score" to a structured **score_breakdown** with five 0–20 sub-scores (pain severity, pain frequency, willingness to pay, market reachability, solution fit) summing to the `score`. The AI also emits a new **`score_rationale`** field (2–3 HTML sentences) that's persisted to a new `idea_icp.score_rationale` column and rendered beneath the Fit badge.
- **`picture`**: AI is now instructed to emit a deterministic dicebear avatar URL per ICP (`https://api.dicebear.com/7.x/personas/svg?seed=<archetype_title>`), and the architect card exposes an editable text input so users can override it.
- **Optimization Suggestions**: prompt hardened to require **exactly 3–5** objects with "REQUIRED — never omit or return empty" directives.
- **`architect_subtitle`**: prompt marked REQUIRED (4–10 word tagline).

### 5. Table renames
- `idea_block_product_definition_and_flows` → `idea_product_definition_and_flows`
- `idea_block_structure_and_align` → `idea_structure_and_align`
- Policies renamed for consistency (RLS attachment survives table rename automatically).

### Files touched
- **Migration**: `supabase/migrations/20260418000000_sandbox_planner_updates.sql` — adds `idea_icp.score_rationale` column, renames both tables, renames 6 policies, `NOTIFY pgrst`.
- **Schema types**: `src/lib/supabase/types.ts` — regenerated via `mcp__supabase__generate_typescript_types` to reflect the renamed tables and new column.
- **Server**: `src/app/sandbox-planner/page.tsx` (creator join, expanded `idea_icp` SELECT including the 4 previously-missing columns, renamed table refs), `src/app/sandbox-planner/actions.ts` (prompt reinforcements for Refining ICP / Benchmarking / Strategic Frameworks; `picture` + `score_rationale` added to the `.update()` payload; renamed table refs).
- **Client**: `src/app/sandbox-planner/_components/IdeasGrid.tsx` (HTML description, creator line, trash button, delete-confirm wiring), `src/app/sandbox-planner/_components/StrategicFrameworksStep.tsx` (added `picture` to edit state + save payload, rendering `score_rationale` under the Fit badge, new avatar-URL input).
- **Shared**: `src/app/projects/_components/modals/ConfirmDeleteModal.tsx` (extended `kind` to include `"idea"` with specific copy), `src/types/sandbox-planner.ts` (added `creator_name` on `Idea`, `score_rationale` on `IdeaIcp`, updated comment references).

---

## [2026-04-16] — Sandbox Planner: PRD preview + PDF/DOCX export

- New **"Preview & Export"** button on the PRD step (step 7) that opens a full-document modal showing every section (App Overview → Phasing Notes) as a single continuous, print-ready document.
- Modal has two export actions:
  - **Download PDF** — client-side render via `html2canvas` → `jspdf`, A4 portrait, tiled across pages. Filename `{idea-slug}-prd.pdf`.
  - **Download DOCX** — client-side conversion via `html-docx-js`. Filename `{idea-slug}-prd.docx`.
- New files:
  - `src/app/sandbox-planner/_components/PrdPreviewModal.tsx` — modal + export logic (both libraries dynamically imported to keep the main bundle small)
  - `src/types/html-docx-js.d.ts` — ambient type declaration for the untyped `html-docx-js/dist/html-docx` browser bundle
- New dependencies: `jspdf`, `html2canvas`, `html-docx-js`.
- The preview surface uses inline hex-color styles (no oklch) so `html2canvas` can rasterize it reliably — Tailwind v4's default oklch palette breaks html2canvas otherwise.

---

## [2026-04-16] — Sandbox Planner: AI timeout + model-switch race fix

Two related bugs reported:
1. AI generation would hang for long periods and then return nothing.
2. After switching AI model mid-generation, the stale (old-model) response would arrive and overwrite the fresh one the user just triggered.

### Root causes
- Server-side `fetch` calls to OpenAI/Claude/Gemini had **no `AbortSignal`** — when the provider hung, the server held the request open indefinitely even after the client's 120 s `useAiWithTimeout` bailed.
- No request-identity tracking — a slow stale run from a previous `triggerAiGeneration` invocation had no way to know a newer run had taken over, so it would happily overwrite the new data.

### Fixes

**1. Server-side fetch timeout (110 s) on all AI providers**
- `src/lib/api/openai.ts`, `src/lib/api/claude.ts`, `src/lib/api/gemini.ts`: wrapped `fetch` in `try/catch` with `AbortSignal.timeout(110_000)`. On abort returns `status_code: 504` with a clear "request timed out after 110s" message. 110 s chosen to be slightly under the client's 120 s timeout so the server returns a clean error before the client gives up.

**2. Request-id race-prevention**
- New Supabase column: `idea.current_ai_request_id uuid` (migration `20260416000003_add_idea_current_ai_request_id.sql`)
- `triggerAiGeneration` now mints a fresh `crypto.randomUUID()` at the start and writes it alongside `current_blocks_updating`
- New helper `isRequestActive(supabase, ideaId, requestId)` re-reads the column and returns `true` only if this run still owns it
- All 9 generator helpers (`generateStructureAlign`, `generateRefiningIcp`, `generateProductDefinition`, `generateStrategicFrameworks`, `generateBenchmarking`, `generatePrdContent`, `generateDatabaseContent`, `generateVisualStylesContent`, `generateMilestonesContent`) now take `requestId` and guard every DB write with `isRequestActive` — stale runs silently skip their writes
- The success/error clears in `triggerAiGeneration` are likewise guarded so a stale run can never clear a newer run's `current_blocks_updating` flag
- `clearAiWorking` also nulls `current_ai_request_id`

### Behavior after fix
- A hung provider returns a 504 within ~110 s instead of hanging forever
- After the user switches models mid-run, the old run's response is dropped on the floor on arrival and cannot overwrite the new response

---

## [2026-04-16] — Sandbox Planner: 6 bug fixes + feature improvements

### Issue 1 — Stuck loading overlay fix
- Added `clearAiWorking(ideaId)` server action that clears `current_blocks_updating = null`
- `AiLoadingOverlay` now accepts `ideaId` prop and arms a 155-second internal timer; if still stuck after 155 s, calls `clearAiWorking`, shows a toast, and renders an error panel with a "Dismiss" button
- All 9 step components updated to pass `ideaId` to `<AiLoadingOverlay>`

### Issue 2 — Refining ICP: Description relocation + Our Solution Value
- **Description field moved** from the Create/Edit ICP modal to the main page right column (above "Day in the Life"), editable via `RichTextEditor` and saved with the other ICP fields
- **New "Our Solution Value" section** added below "How could be solved" — AI-generated and manually editable; describes the specific value the product brings to that ICP tied to their pain points
- New Supabase column: `idea_icp.our_solution_value text`
- Updated `FALLBACK_REFINING_ICP` prompt and `generateRefiningIcp` mapping
- `AiLoadingOverlay` STEP_FIELDS updated to include "Our Solution Value" for `refining_icp`

### Issue 3 — Toast "Go to Settings" → inline AI config modal
- Created `aiConfigModalStore.ts` (module-level callback bridge)
- Created `AiConfigModal.tsx` (wraps `AiSettingsForm` in a full-screen modal)
- `SandboxPlannerShell` registers the modal open callback and renders `<AiConfigModal>`
- `useAiWithTimeout.ts` now calls `openAiConfigModal()` instead of `window.location.href = "/settings"` in both the timeout and error toasts

### Issue 4 — Strategic Frameworks: editable fields + optimization fix + differentiated score
- **Editable fields**: VP, JTBD Synthesis, and NABC Pitch sections replaced with `RichTextEditor` — a "Save Frameworks" button persists edits via the existing `saveStrategicFramework` action
- **Optimization Suggestions fix**: Clarified `FALLBACK_STRATEGIC_FRAMEWORKS` prompt — `optimization_suggestions` now listed explicitly as a per-ICP field (not a root-level "Also include"), preventing AI from misplacing it
- **Differentiated ICP fit score**: Prompt now asks AI to generate `score: 0–100` per ICP based on pain-point alignment, urgency, and market size; saved to `idea_icp.score`; displayed as "Fit XX/100" badge on the IcpArchitectCard (color-coded green/yellow/red)
- Completion badges in `IcpPillSelector` now show the AI-generated score (when available) instead of field-fill count

### Issue 5 — Benchmarking: Possible Business Models + step reorder
- **New "Possible Business Models" section** added before "Key Takeaways"; AI-generated and manually editable
- New Supabase column: `idea_benchmarking.possible_business_models text`
- Updated `FALLBACK_BENCHMARKING` prompt, `generateBenchmarking`, and `saveBenchmarking` action
- `AiLoadingOverlay` STEP_FIELDS updated for `benchmarking`
- **Step reorder**: Benchmarking is now step 5, Strategic Frameworks is step 6 (was reversed)
  - `IDEA_BLOCKS_ORDERED` and `IDEA_BLOCK_STEPS` updated in `sandbox-planner.ts`
  - `computeUnlockedSteps()` chain: Product Definition → Benchmarking → Strategic Frameworks → PRD

### Issue 6 — Auto-trigger Realtime race condition fix
- `useAutoTriggerAi` now delays the trigger by 1 second (`setTimeout(fn, 1000)`) to ensure the Supabase Realtime channel is subscribed before AI starts setting `current_blocks_updating`

---

## [2026-04-16] — E2E test pass: all 10 Sandbox Planner steps verified (post-bugfix run)

Full flow re-tested with idea "E2E Test — AI Recipe App" after implementing all 6 bug fixes:

| Step | Result | Notes |
|------|--------|-------|
| Ideas | ✅ Pass | Idea selected from list |
| Structure & Align | ✅ Pass | Auto-trigger fired, content saved |
| Refining ICP | ✅ Pass | 3 ICPs, pill switching, Description on main page, Our Solution Value visible |
| Product Definition & Flows | ✅ Pass | Product Summary + Feature List, no User Flows section (removed) |
| Benchmarking | ✅ Pass (step 5) | Now correctly before Strategic Frameworks; Possible Business Models field populated |
| Strategic Frameworks | ✅ Pass (step 6) | VP 2×2 grid, ICP Architect editable, NABC 2×2 layout; all 3 ICPs at 8/8 completion |
| PRD | ✅ Pass | 9 sections, rich HTML, properly formatted |
| Database | ✅ Pass | Multi-table schema with Relationships and Migration Notes |
| Visual Styles | ✅ Pass | Logo & Branding, Color Palette, Product Feeling — all in proper HTML |
| Project Milestones & Tasks | ✅ Pass | Multiple milestones with task tables, time estimates, exit criteria |

**Issues confirmed fixed:**
- Loading overlay no longer permanently stuck (155s timer + clearAiWorking works)
- Benchmarking now at step 5, Strategic Frameworks at step 6 (reorder working)
- Possible Business Models field generated and saved (was empty string bug — fixed with `|| null`)
- Auto-trigger fires after 1s delay (Realtime race condition resolved)
- AiLoadingOverlay shows correct step-specific field names per step
- `Go to Settings` in timeout toast now opens inline AiConfigModal (not page redirect)

**Known issues remaining:**
- Gemini 2.5 Flash rate limits hit on every 2nd–3rd step transition when running rapid E2E; requires ~30s wait then Regenerate click. Workaround: switch to Claude or wait between steps.
- Stray "AI response timed out" toasts appear when navigating away from a step while a fire-and-forget timer is still running (e.g. previous step's `runAiWithTimeout` timer fires after navigation). Root cause: the 120s timer is not tied to component lifecycle — it fires regardless of which page the user is on. Fix needed: cancel the timer on component unmount.
- Gemini 2.5 Flash produces BBCode format (`[b]text[/b]`, `[list][*]item`) in some Strategic Frameworks fields instead of HTML. TipTap renders these as literal text. Fix needed: update prompts to explicitly show HTML tag examples (`<b>`, `<ul>`, `<li>`).
- Strategic Frameworks VP: "Value Map Solutions" field occasionally not populated by AI (JSON likely truncated). Fix needed: investigate prompt structure and token budget.

---

## [2026-04-15] — E2E test pass: all 10 Sandbox Planner steps verified

Full flow tested with idea "TaskFlow AI — Smart Task Delegation Platform":

| Step | Result | Notes |
|------|--------|-------|
| Structure & Align | ✅ Pass | Auto-trigger, content saved |
| Refining ICP | ✅ Pass | Pill switching, ICP content sync |
| Product Definition & Flows | ✅ Pass | Summary + Feature List |
| Strategic Frameworks | ✅ Pass (timeout toast shown) | Claude too slow; toast "Switch to Gemini 2.5 Flash" fired at 120s — server finished eventually |
| Benchmarking | ✅ Pass | HTML comparison table rendered |
| PRD | ✅ Pass | 9 sections, no JSON parse errors |
| Database | ✅ Pass | 15+ tables, Relationships, Important Notes |
| Visual Styles | ✅ Pass | Logo & Branding, Color Palette (hex table), Product Feeling |
| Project Milestones & Tasks | ✅ Pass | 6 milestones, task tables with Estimated Time + DoD |

**Known limitation discovered**: Supabase Realtime `router.refresh()` may miss events when the auto-trigger fires immediately on component mount before the channel finishes connecting. Loading overlay does not appear; content is present in DB and loads correctly on next navigation/reload. Workaround: a page reload always shows data. Fix: delay auto-trigger by a short interval or poll `current_blocks_updating` after mount.

**AI model recommendation confirmed**: Claude Sonnet 4.6 times out on large generations (Strategic Frameworks, Database schema). Gemini 2.5 Flash completes Visual Styles in ~10s and Milestones in ~30s. The 120s timeout toast correctly directs users to Settings → AI Configuration.

---

## [2026-04-15] — Fix: AI JSON parse failures + RichTextEditor sync + 120s timeout toast

- **`src/app/sandbox-planner/actions.ts`** — wrapped all 8 `renderPrompt()` context variables that contain HTML (e.g. `core_problem`, `target_audience`, `product_overview`, `features`, `essential_features`, ICP `description`/`day_in_life`/`pain_points`) with `stripHtml()` so the LLM receives clean text, eliminating the root cause of JSON parse failures
- **`src/lib/api/claude.ts` / `openai.ts` / `gemini.ts`** — added `sanitizeJsonText()` helper in all three providers; strips markdown code fences (` ```json…``` `) and extracts the first `{…}` block before calling `JSON.parse()`; increased Claude default `maxTokens` from 4096 → 16384 to support large multi-ICP generations
- **`src/app/sandbox-planner/_hooks/useAiWithTimeout.ts`** (new) — `runAiWithTimeout<T>()` wraps any server-action call with a 120-second `Promise.race()` client-side timeout; on timeout shows a sonner error toast "AI response timed out — Try switching to a faster AI model (e.g. Gemini 2.5 Flash)" with a "Go to Settings" action button; non-timeout errors also show a toast
- **`src/app/sandbox-planner/_hooks/useAutoTriggerAi.ts`** — all auto-trigger calls now use `runAiWithTimeout` (previously fired raw with `void`, ignoring errors and hangs indefinitely)
- **`src/app/layout.tsx`** — added `<Toaster>` (sonner, bottom-right, dark theme, richColors, closeButton) to root layout so toasts render app-wide
- **`src/app/sandbox-planner/_components/RichTextEditor.tsx`** — added `useEffect` to call `editor.commands.setContent(content)` when the `content` prop changes externally (e.g. switching ICP pill); TipTap's `useEditor` only uses `content` as the initial value — this fix makes the editor reactive
- **`src/app/sandbox-planner/_components/RefiningIcpStep.tsx` / `ProductDefinitionStep.tsx` / `StructureAlignStep.tsx`** — readonly context panels ("Original Idea", "Finalized Core Problem") switched from `<p className="whitespace-pre-wrap">` to `dangerouslySetInnerHTML` with `tiptap-content` class so HTML stored by RichTextEditor renders as prose, not raw tags
- Applied `runAiWithTimeout` to all 9 step components' manual Regenerate handlers (previously only some steps were covered)
- TypeScript: 0 errors. Build: ✓

---

## [2026-04-15] — Fix: rebuilt production server to expose all 10 Sandbox Planner steps

- App was running a stale `next build` that referenced a missing JS chunk (`29188786e4d54c12.js`), causing a blank "Application error" screen on the sandbox-planner page
- Ran `npx next build` (rebuilt in 3.2s), killed the old server process (PID 54812), and restarted with `npx next start --port 30003`
- All 10 breadcrumb menu tabs (Ideas → Project Milestones & Tasks) are now correctly visible

---

## [2026-04-15] — Feature: 5 new Sandbox Planner steps (Benchmarking → Milestones & Tasks)

- **Supabase migration** — extended `os_idea_block` enum with 5 new values; created 5 new tables with RLS: `idea_benchmarking` (3 sections), `idea_prd` (9 sections), `idea_database` (3 sections), `idea_styles` (3 sections), `idea_milestones_and_tasks` (1 section); seeded 5 prompt rows in `prompt` table
- **`src/types/sandbox-planner.ts`** — extended `IdeaBlock` union (steps 6–10), added labels, `IDEA_BLOCK_STEPS` entries, `IDEA_BLOCKS_ORDERED` entries, 5 new interfaces (`IdeaBenchmarking`, `IdeaPrd`, `IdeaDatabase`, `IdeaStyles`, `IdeaMilestonesAndTasks`), extended `IdeaFull`
- **`src/lib/api/json-converters.ts`** — added 5 output interfaces (`BenchmarkingOutput`, `PrdOutput`, `DatabaseOutput`, `VisualStylesOutput`, `MilestonesAndTasksOutput`)
- **`src/app/sandbox-planner/actions.ts`** — added 5 CRUD upsert functions, 5 AI generate functions with fallback prompts, updated `PROMPT_ID_BY_STEP` with real UUIDs, extended `triggerAiGeneration` switch with 5 new cases
- **`src/app/sandbox-planner/page.tsx`** — added 5 parallel Supabase queries in `Promise.all`, extended `ideaFull` construction
- **`src/app/sandbox-planner/_components/SandboxPlannerShell.tsx`** — added 5 imports, extended `computeUnlockedSteps` with sequential unlock gates, added 5 conditional renders, updated step count to "of 10"
- **`src/app/sandbox-planner/_components/AiLoadingOverlay.tsx`** — added 5 entries to `STEP_FIELDS`
- **New step components**: `BenchmarkingStep.tsx`, `PrdStep.tsx` (9-section accordion), `DatabaseStep.tsx`, `VisualStylesStep.tsx`, `MilestonesAndTasksStep.tsx` — all follow RichTextEditor + save + AI regenerate pattern
- TypeScript: 0 errors. Build: ✓

---

## [2026-03-28] — Feature: ICP CRUD, User Type redesign, modal backdrop fix

- `IcpPillSelector.tsx` — redesigned to horizontal scrollable container (gray pill-shaped background, white active pill); optional `onAdd`, `onEdit`, `onDelete` props show `+ Add ICP` button and per-ICP pencil/trash icons
- `RefiningIcpStep.tsx` — added `+ Add ICP` button, Edit ICP (pencil icon) and Delete ICP (trash icon) per pill; shared `IcpModal` handles both create and edit; uses existing `createIcp` + `saveIcpProfile` + `deleteIcp` server actions
- `ProductDefinitionStep.tsx` — user type pills redesigned to match ICP selector style (gray container, white active, pencil + trash icons); added Edit User Type modal (same design as Create); modal can update name and description; fixed modal backdrop from `bg-black/60 backdrop-blur-sm` → `bg-black/75` (solid dark overlay)
- TypeScript: 0 errors

---

## [2026-03-28] — Improvement: Upgrade AI prompt descriptions from CSV export

- Updated all 4 `prompt.description` values in Supabase with richer, structured prompts from the CSV export — each now uses `<OBJECTIVE>`, `<CONTEXT>`, `<LIMITATIONS>`, `<STYLE>`, `<INSTRUCTIONS>` sections; `{{variable}}` placeholders retained; output JSON structure preserved
- Fixed `getPromptTemplate()` in `src/app/sandbox-planner/actions.ts` — remote DB has no `type` column; switched to ID-based lookup via `PROMPT_ID_BY_STEP` map; prompts now actually read from DB instead of always falling back to hardcoded strings
- Added migration `20260328100000_add_prompt_type_column.sql` for future type column addition
- TypeScript: 0 errors

---

## [2026-03-28] — Refactor: Restructure prompt tables + redesign Prompts page

- **Migration `20260327100000`**: `prompt_group` — dropped `step` column; `prompt` — added `description` (copied from `prompt_1`), dropped `prompt_1`/`prompt_2`/`prompt_3`, made `group` FK NOT NULL with constraint; data: consolidated 4 prompt_group rows → single "SandBox Planner" row (id=9), all 4 prompts linked to it
- Updated `src/app/prompts/actions.ts` — new data model: `PromptGroupRow` now contains `prompts[]` array (group → many prompts); replaced `updatePrompt(id, prompt_1)` with `updatePromptName(id, name)` + `updatePromptDescription(id, description)`; removed `step` from types; prompts fetched grouped by `group` FK
- Rewrote `src/app/prompts/_components/PromptsShell.tsx` — one card per group showing editable group name; inside the card, each prompt is rendered as a sub-card with editable `name` input and editable `description` textarea; single "Save Prompt" button per prompt saves both fields in parallel
- Updated `src/app/sandbox-planner/actions.ts` — `getPromptTemplate()` now reads `description` column instead of `prompt_1`
- TypeScript: 0 errors

---

## [2026-03-27] — Feature: Prompts DB, Prompts page, breadcrumb nav, step gating, improved AI overlay

- **Migration `20260327000000`**: Added `step` + `updated_at` columns to existing `prompt_group` table; added `prompt_1`, `prompt_2`, `prompt_3`, `name`, `updated_at` columns to `prompt` table; seeded 4 prompt groups and 4 prompt templates with `{{variable}}` placeholder syntax; made `prompt.group` nullable to fix schema drift; RLS + triggers applied
- Updated `src/app/sandbox-planner/actions.ts` — added `getPromptTemplate(step)` helper (reads from `prompt` table via service client bypassing RLS) and `renderPrompt(template, vars)` helper; all 4 generate functions now read prompt from DB with hardcoded fallback constants (`FALLBACK_*`)
- Created `src/app/prompts/page.tsx` — server component; admin/manager guard (redirects to `/projects` otherwise); fetches prompt groups + prompts; renders Sidebar + PromptsShell
- Created `src/app/prompts/actions.ts` — `getPromptGroups()` (parallel fetch groups + prompts, merged in TS), `updatePrompt(id, prompt_1)`, `updatePromptGroupName(id, name)` — all guarded by admin/manager check
- Created `src/app/prompts/_components/PromptsShell.tsx` — accordion cards per group; editable group name + large textarea for prompt_1; variable hints per step; Save buttons with success feedback
- Updated `src/components/layout/Sidebar.tsx` — added `ADMIN_NAV_ITEMS` with conditional Prompts link (visible only to admin/manager); added `IconPrompt` SVG
- Rewrote `src/app/sandbox-planner/_components/SandboxPlannerShell.tsx` — breadcrumb nav with `›` separators replacing pill tabs; active step = white pill, locked = dimmed+disabled; `computeUnlockedSteps(ideaFull)` derives unlock state from data presence (no new DB columns); auto-navigates away from locked step
- Updated `src/app/sandbox-planner/_components/AiLoadingOverlay.tsx` — circle enlarged from `w-16` to `w-24`; sparkle/star SVG icon replacing lightning bolt; text enlarged to `text-xl`; container min-height increased to `min-h-96`
- Updated `src/app/sandbox-planner/_components/RefiningIcpStep.tsx` — added `canSave` guard (both fields + ICP selected); added `useEffect` to sync `selectedIcpId` when `icps` prop changes after AI regeneration
- Updated `src/app/sandbox-planner/_components/ProductDefinitionStep.tsx` — added `canSave` guard (summary + features both non-empty)
- TypeScript: 0 errors

---

## [2026-03-26] — Feature: Settings page, AI multi-provider dispatch, project filtering, AI settings gate

- **Migration `20260326000000`**: Redesigned idea access control — dropped per-table `authorized_users` columns, access now derived from `idea.project.authorized_users` via RLS joins
- **Migration `20260326100000`**: Created `user_ai_settings` table (per-user AI config with RLS, one row per user)
- Created `src/types/settings.ts` — types for AI settings (`AiService`, `UserAiSettingsClient`, `SaveAiSettingsPayload`, model defaults)
- Created `src/lib/api/claude.ts` — Anthropic Claude Messages API client (`generateClaudeResponse`, `generateClaudeJsonResponse`)
- Created `src/lib/api/ai-dispatcher.ts` — thin routing layer (`generateAiJsonResponse`) dispatching to OpenAI, Gemini, or Claude
- Modified `src/lib/api/openai.ts` and `src/lib/api/gemini.ts` — added optional `apiKey` param (fallback to env var)
- Created `src/components/features/AiSettingsForm.tsx` — reusable AI settings form (service selector, per-service API key + model fields)
- Created `src/app/settings/page.tsx` — Settings page server component (auth, profile + AI settings fetch, key masking)
- Created `src/app/settings/actions.ts` — `saveAiSettings` upsert + `getAiSettingsForGeneration` server actions
- Created `src/app/settings/_components/SettingsShell.tsx` — Settings page client wrapper
- Updated `src/components/layout/Sidebar.tsx` — added Settings nav item with gear icon
- Updated `src/app/sandbox-planner/page.tsx` — added `?project=` URL param, AI settings fetch, `hasAiConfigured` computation
- Updated `src/app/sandbox-planner/_components/SandboxPlannerShell.tsx` — passes project filter + AI settings props, preserves `?project=` in navigation
- Rewrote `src/app/sandbox-planner/_components/IdeasGrid.tsx` — URL-based project filtering (all projects in sidebar), AI settings gate on "See Refinement"
- Updated `src/app/sandbox-planner/_components/CreateIdeaModal.tsx` — accepts `defaultProjectId` prop, syncs from URL
- Created `src/app/sandbox-planner/_components/AiSettingsModal.tsx` — popup modal wrapping AiSettingsForm for inline AI configuration
- Updated `src/app/sandbox-planner/actions.ts` — uses `resolveAiConfig` + `generateAiJsonResponse` dispatcher instead of hardcoded OpenAI
- TypeScript: 0 errors

---

## [2026-03-24] — Build: Sandbox Planner page (5-step AI wizard)

- Created `src/lib/utils.ts` — `cn()` utility (clsx + tailwind-merge)
- Created `src/types/sandbox-planner.ts` — types, enums, labels for all idea entities (`Idea`, `IdeaIcp`, `IdeaUserType`, `IdeaOptimizationSuggestion`, `IdeaBlockProductDefinition`, `IdeaBlockStructureAlign`, `IdeaFull`)
- Updated `src/components/layout/Sidebar.tsx` — added "Sandbox Planner" nav item with lightbulb icon
- Created `src/app/sandbox-planner/page.tsx` — server component with auth, parallel data fetching, full idea hydration
- Created `src/app/sandbox-planner/actions.ts` — 15 server actions (CRUD for ideas, ICPs, user types, optimization suggestions + AI generation triggers using OpenAI gpt-4.1)
- Created `src/app/sandbox-planner/_components/`:
  - `SandboxPlannerShell.tsx` — client shell with tab navigation, URL-synced state, Supabase realtime subscription for AI polling
  - `IdeasGrid.tsx` — Step 1: idea cards grid with project filter sidebar, empty state
  - `CreateIdeaModal.tsx` — create idea form (name*, description*, project dropdown) with early validation and submit state
  - `StructureAlignStep.tsx` — Step 2: editable Core Problem, Target Audience, Success Metrics with AI regeneration
  - `AiLoadingOverlay.tsx` — AI spinner overlay with animated icon and auto-dismissing success banner
  - `IcpPillSelector.tsx` — selectable ICP persona pills with optional completion badges
  - `RefiningIcpStep.tsx` — Step 3: per-ICP Day in Life + Pain Points editing with instructions panel
  - `RichTextEditor.tsx` — TipTap wrapper with formatting toolbar (Bold, Italic, Underline, Headings, Lists, Code)
  - `ProductDefinitionStep.tsx` — Step 4: rich text product summary, features display, user type flow pills
  - `StrategicFrameworksStep.tsx` — Step 5: Value Proposition, JTBD, ICP Architect, NABC Pitch cards + optimization suggestions
- TypeScript: 0 errors

---

## [2026-03-14] — Fix: Date picker, kanban ordering, cascade updates, performance, project popup

- **DatePicker**: Added Delete/Backspace keyboard shortcut to clear selected date value
- **Developer Tasks dates**: Start/End Date inputs now use calendar DatePicker with auto-binding to database
- **Kanban drag-and-drop**: Fixed card ordering using fractional values (NUMERIC column) — cards now correctly stay between, at first, or at last position using formulas: between=(above+below)/2, first=first_order-1, last=last_order+1. Fixed stale drop target via ref-based tracking
- **Estimated time cascade**: When client/qa milestone totals are updated, milestone.estimated_time now includes dev tasks + client_total + qa_dev_total + qa_qa_total. Cascades to project.estimated_time when automation flags are TRUE
- **Real time cascade**: time_track updates cascade through task → client/qa_milestone_total → milestone → project, respecting new automation flags (change_automatically_milestone_real_time, change_automatically_project_real_time)
- **qa_time_track cascade**: qa_time_track.time_spent_h updates cascade to qa_milestone_total.qa_real_time_h → milestone.real_time → project.real_time
- **Performance**: Task deletion and creation optimized with parallel batch operations instead of sequential queries
- **Project popup**: Project name in breadcrumb is now clickable to open the ProjectModal
- **DB migration**: `task.order` changed from INTEGER to NUMERIC; added `change_automatically_milestone_real_time` and `change_automatically_project_real_time` columns to project table

---

## [2026-03-05] — Build Step 6: Projects CRUD modals + actions

- Added `ProjectProgram`, `TimeTrack`, `QATimeTrack` types + time helpers to `src/types/projects.ts`
- Created `src/app/projects/actions.ts` — server actions for project, task, time_track, qa_time_track CRUD
- Created modal components in `src/app/projects/_components/modals/`:
  - `Modal.tsx` — base wrapper (Escape, scroll lock, backdrop click)
  - `ConfirmDeleteModal.tsx` — delete confirmation for project or task
  - `ProjectModal.tsx` — create/edit project (all fields + authorized users picker + 4 auto-sync toggles)
  - `TaskModal.tsx` — create/edit task + inline time tracker (date, start/end time dropdowns, auto-calc hours)
  - `WorkingHoursModal.tsx` — project time entries grouped by day, client-side fetch, delete
  - `QATimeTrackerModal.tsx` — QA time entries grouped by milestone, add/delete rows
- Added `.input-field` utility class to `globals.css`
- Wired all buttons in `ProjectsList`, `DeveloperTasks`, `TasksKanban`, `ProjectDetail`
- All tab components receive `profiles` prop from page for user pickers
- TypeScript: 0 errors

---

## [2026-03-05] — Build Step 5: Projects page

- Created `src/types/projects.ts`:
  - TypeScript interfaces: `Project`, `Task`, `TaskAssignee`, `UserProfile`
  - Enums: `ProjectStatus`, `TaskStatus`, `TaskType`, `TaskLevel`, `UserType`, `ProjectStage`
  - Constants: `STAGE_LABELS`, `STAGE_ORDER`, `TAB_LABELS`
  - Helpers: `getProgressBadge`, `getVisibleTabs`
- Created `src/components/layout/Sidebar.tsx`:
  - Client Component with `usePathname` active state
  - 10 nav items with inline SVG icons
  - User avatar (picture or initials) at bottom with name + role
- Created `src/app/projects/_components/tabs/StagesChecking.tsx`:
  - Renders all 18 `STAGE_ORDER` stages in order
  - Maps `stages_checking` tasks to stages by name match
  - Falls back to `inferStatus` for stages without tasks
  - `StatusIcon` (checkmark / dot / X / circle)
- Created `src/app/projects/_components/tabs/DeveloperTasks.tsx`:
  - `MilestoneRow` (level_1, expandable) → `TaskRow` (recursive, depth padding)
  - Grid: Name | Status | Start | End | Est(h) | Real(h) | Assignees | Actions
  - Shared cells: `StatusBadge`, `DateCell`, `NumCell`, `Assignees`, `RowActions`
- Created `src/app/projects/_components/tabs/TasksKanban.tsx`:
  - 5-column Kanban (not_started → in_progress → ready_for_qa → done → blocked)
  - Horizontally scrollable, color-coded column top borders
  - `KanbanCard` with assignee avatars + estimated time footer
  - "Track QA Time" button visible for `qa_requests` tab when canEdit
- Created `src/app/projects/_components/ProjectsList.tsx`:
  - Search input + Status filter dropdown
  - Table: # | Name | Status | Start | End | Est(h) | Real(h) | Progress | Users | Actions
  - Progress badge with green/yellow/red color from `getProgressBadge`
  - "+ New Project" button for admin/manager
- Created `src/app/projects/_components/ProjectDetail.tsx`:
  - Breadcrumb (Projects > name) + progress badge
  - "See Working Hours" button
  - Tab bar (role-filtered via `getVisibleTabs`)
  - Renders active tab component
- Created `src/app/projects/page.tsx`:
  - Server Component: fetches user profile + projects list OR project detail + tasks
  - Routes: `/projects` → list; `/projects?project=<id>` → detail; `?tab=<key>` → initial tab
  - Supabase queries with nested `task_assignees(user_id, profiles(...))` select
- TypeScript: 0 errors

---

## [2026-03-05] — Build Step 4: signin page + Auth infrastructure

- Installed `@supabase/ssr` for Next.js 15 App Router session cookie management
- Created `src/lib/supabase/server.ts`:
  - `createClient()` — async server-side client (Server Components, Server Actions)
  - `createServiceClient()` — service-role client (bypasses RLS, admin use only)
- Updated `src/lib/supabase/client.ts` — switched to `createBrowserClient` from `@supabase/ssr` for cookie-based session persistence in Client Components
- Created `src/middleware.ts`:
  - Refreshes Supabase session tokens on every request
  - Redirects unauthenticated users to `/signin`
  - Redirects authenticated users away from `/signin` and `/reset_pw`
- Created `src/app/signin/actions.ts`:
  - `signIn` Server Action — email/password login → routes referrer → `/referrer-dashboard`, others → `/projects`
  - `sendPasswordReset` Server Action — sends Supabase password reset email with `/reset_pw` redirect
- Created `src/app/signin/page.tsx`:
  - 3 view states (mirrors Bubble `custom.view_`): `signin`, `reset_password`, `email_sent`
  - Split screen layout: left (light grey + white card), right (indigo branding panel)
  - All forms use `useActionState` for progressive enhancement
  - Logo mark + "Move37" in top-left corner
- TypeScript: 0 errors

---

## [2026-03-05] — Build Step 3: API Integrations

- Analyzed `docs/reference_docs/api-connectors.md` (3 connector groups: Brevo, OpenAI, Gemini + Bubble legacy)
- Created `src/lib/api/brevo.ts`:
  - 7 typed email functions: `sendInstructorBookingEmail` (templateId 10), `sendBulkEmailViaTemplate`, `sendAccountDetailsEmail` (templateId 6), `sendPasswordResetEmail`, `sendMagicLinkEmail`, `sendBlankTemplateEmail`, `sendParentPackageBookingEmail`
  - Auth via `BREVO_API_KEY` header; shared `sendEmail` helper handles errors uniformly
- Created `src/lib/api/openai.ts`:
  - `generateOpenAIResponse` — wraps POST `/v1/responses` (Responses API format)
  - `generateOpenAIJsonResponse<T>` — convenience wrapper that parses JSON from output
- Created `src/lib/api/gemini.ts`:
  - `generateGeminiContent` — wraps `generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
  - `generateGeminiJsonResponse<T>` — sets `response_mime_type: application/json` and parses output
  - Default model: `gemini-2.5-flash`
- Created `src/lib/api/json-converters.ts`:
  - Replaces all Bubble `convert_json_text_into_json_object` calls with local typed JSON parsers
  - `convertStructureAlignJson`, `convertRefiningIcpJson`, `convertStrategicFrameworksJson`, `convertProductDefinitionJson`
  - `verifyTalent` / `verifyClient` stubbed (TODO: Supabase queries) replacing Bubble self-API calls
- TypeScript: 0 errors

---

## [2026-03-05] — Build Step 2: Design System

- Updated reference docs (`paginas.md`, `elementos-reutilizaveis.md`) with fresh Bubble exports
- Created `docs/architecture.md` with full Design System documentation:
  - Color palette (8 background tokens, accent, text hierarchy, borders, 8 status semantic colors)
  - Typography scale mapping Bubble named styles (`Text_heading_3_` → `.text-heading-3`, etc.)
  - Component pattern library (Button, Input, Card, Sidebar, Tab bar, Modal, Status badge, Empty state)
  - Reusable component inventory mapping Bubble elements to planned Next.js components
- Updated `src/app/globals.css` (Tailwind v4, CSS `@theme {}` tokens):
  - All design tokens as CSS custom properties
  - Status badge utility classes (`.status-not-started`, `.status-done`, etc.)
  - Typography helper classes
  - Layout shell classes (`.sidebar`, `.page-shell`)
  - Custom scrollbar styling
- Updated `src/app/layout.tsx`: title → "Move37", `<html class="dark">` set

---

## [2026-03-04] — Build Step 1: Database & Privacy

- Analyzed `docs/reference_docs/tabelas.md` (30 data types) and `docs/reference_docs/option-sets.md` (30+ option sets)
- Generated `supabase/migrations/20260304000000_initial_schema.sql` (1 540 lines):
  - **24 PostgreSQL enums** from Bubble Option Sets (os_user_type, os_task_status, os_project_status, os_project_stage, etc.)
  - **39 tables** in correct dependency order (profiles → company/client → sop → project → task → idea…)
  - **3 helper functions** (`get_user_type`, `is_admin_or_manager`, `is_operational_user`) using SECURITY DEFINER
  - **2 triggers** (auto-create profile on sign-up, auto-update `updated_at`)
  - **22 performance indexes** (GIN on UUID[] arrays, FK indexes)
  - **RLS enabled** on all 39 tables
  - **70+ RLS policies** mapping every Bubble Privacy Rule:
    - everyone → default deny
    - admin/manager → full access
    - authorized_users[] → read access for operational users
    - referrer → read own referred projects only
    - created_by → owner full access (idea tables)
    - os_user_type[] arrays → type-based SOP access

---

## [2026-03-04] — Project Setup

- Initialized Next.js 15 app (TypeScript, ESLint, Tailwind CSS, App Router, `src/` directory)
- Created `docs/reference_docs/` and secured Bubble export as source of truth
- Split consolidated documentation into 6 reference files:
  - `tabelas.md` — Data types & privacy rules
  - `option-sets.md` — Enum/option sets
  - `api-connectors.md` — External API integrations (Brevo, OpenAI, Gemini)
  - `paginas.md` — UI pages & workflows
  - `elementos-reutilizaveis.md` — Reusable components
  - `backend-workflows.md` — Server-side workflows
- Created `claude.md` (project memory)
- Initialized git repository
- Created `.gitignore` (env files, Next.js build artifacts)
- Created `.env.example` with placeholders for Supabase, Brevo, OpenAI, Gemini
- Created `docs/changelog.md` and `docs/project_status.md`
