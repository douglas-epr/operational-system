# STATE — Move37 Operational System

_Persistent memory: decisions, blockers, lessons, todos, deferred ideas._
_Initialized 2026-06-21 from git history + changelog._

## Decisions

- **2026-06-14 — Removed talent/leads domain.** Dropped `talent*`, `client`, `company` tables and
  the `/talent-pool`, `/talent-profile`, `/leads`, `/recommended-projects` pages. Referrer home → `/projects`.
- **2026-06-14 — Removed agency AI key tier.** Dropped `agency_ai_settings`. AI resolution is now
  personal key → `OPENAI_API_KEY`/`GEMINI_API_KEY` env → null. `referrer`/`lead` are personal-only.
- **Marketing validation is per-idea, not per-project** (migrated 2026-06-10). All `mkt_*` tables FK to `idea`.
- **Devil's-Advocate debate lives in Risk & Validation (step 9), not Report (step 10).** Report reads the
  debate output; this broke a circular dependency.
- **Report is a pre-build go/no-go gate** (step 10, before PRD). Scores only discovery evidence (steps 1–9).
- **Social provider: Buffer + Postiz** (Postiz replaced Ayrshare for cost). Apify used for sourcing.
- **Rebrand: Blur Studio → Move37** (full migration). Route renamed `sandbox-planner` → `ideas-refiner`.

## Lessons

- **Always check the write error after AI generation.** A swallowed insert error on a missing column
  manifests as a silent ~4-minute timeout with no data (e.g. the un-applied `idea_demand_evidence` migration).
- **Pass `maxTokens: 16384` for multi-field rich-HTML AI steps.** The 8,192 default truncates JSON → parse fails → empty page.
- **Chat tab panels must guard overlapping polls** (`loadingRef`) and only poll while visible — a 2s
  interval fanning out 5 server actions floods the queue and starves user saves.
- **`getPromptTemplate` runs `stripHtml`** on stored prompts — describe output structure in words, not literal tags.
- **html2canvas can't parse Tailwind v4 `oklch()`** — use inline hex styles for client-side PDF rendering.
- **Windows + Turbopack** can hold stale bracket-route entries; a config no-op edit forces a rescan.

## Blockers / Watch-outs

- **Vercel cron** removed for Hobby-plan compatibility; the marketing cron worker endpoints
  (`/api/mkt/cron/*`) need a paid plan or an external scheduler to fire automatically.
- **Apify B2B people-search** (`code_crafter/leads-finder`) is blocked on the Apify free plan; needs a paid plan.
- **No automated test suite** — verification is manual/live (Playwright ad-hoc) + `tsc --noEmit`.

## Deferred Ideas

- Stripe pre-order capture (quiz + waitlist live; preorder stubbed).
- A/B landing variants + `mkt_decision_log` pivot taxonomy (P2).
- PostHog session recordings on landing pages.

## Preferences

- Changelog entry required every session (`docs/changelog.md`).
- Commands prefixed with `rtk` for token savings (see `CLAUDE.md`).
- Local-first: most sessions are local-only (no prod Supabase push / no Vercel deploy) unless explicitly authorized.
