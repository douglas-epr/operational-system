# Feature Spec — PRD as a Single Comprehensive Document

_Status: ✅ Shipped & verified (local) 2026-06-23 · migration dated 20260702000000._
_Methodology: spec-driven-development + tlc-spec-driven. Retroactive record of a completed, approved change._

## Objective

Replace the fragmented 10-column PRD (which produced thin, inconsistent documents) with **one
comprehensive, build-ready PRD** stored as a single rich-HTML `idea_prd.description`. The generated PRD
must match the quality of a best-in-class external reference PRD — notably **per-feature "Tools used in
this area"**, **Connected Platform Integrations**, and a **phased delivery plan with tools per phase** —
and must be grounded in the founder's `idea.description`.

User-facing scope: `/ideas-refiner?...&tab=prd` (generation + edit + export) and `&tab=playbook`
(assembly must embed the new PRD).

## Requirements (traceable)

| ID | Requirement | Status |
|---|---|---|
| PRD-1 | `idea_prd` exposes a single `description` text column; the 10 per-section columns are dropped | ✅ |
| PRD-2 | Existing PRDs are not lost — backfill each old section (wrapped in `<h2>`) into `description` before dropping | ✅ |
| PRD-3 | PRD prompt emits `{ "description": "<full html>" }` across 10 numbered sections | ✅ |
| PRD-4 | Each MVP feature area includes a "Tools used in this area" list; each delivery phase lists its tools | ✅ |
| PRD-5 | PRD is grounded in `idea.description` (every named tool/repo/platform carried through) | ✅ |
| PRD-6 | PRD UI is a single rich-text editor; Preview/PDF/DOCX export the one document | ✅ |
| PRD-7 | Build-phase gate (`SandboxPlannerShell`) keys off `prd.description` | ✅ |
| PRD-8 | Downstream consumers read `idea_prd.description`: Database, Visual Styles, Milestones, Playbook assembler, logo generation, docs-feature playbook compiler, both chatbots | ✅ |
| PRD-9 | DB-stored prompts keep working — legacy placeholders resolve to the full PRD (primary) or a pointer (secondary); no DB prompt bodies rewritten except `prd` | ✅ |
| PRD-10 | Types updated: `IdeaPrd`, generated `idea_prd` Row/Insert/Update, `PrdOutput = { description }`; `tsc` clean | ✅ |

## Tech / files touched

- **Migration:** `supabase/migrations/20260702000000_idea_prd_single_description.sql` (add+backfill+drop, re-seed `prd` prompt `5041e57c…`).
- **AI/actions:** `src/app/ideas-refiner/actions.ts` (`FALLBACK_PRD`, `generatePrdContent`, `savePrd`, database/visual/milestones generators, `assemblePlaybookVersion`, logo gen, `buildIdeaContextVars`, `FALLBACK_DATABASE/VISUAL_STYLES/MILESTONES`).
- **Types:** `src/types/idea-refiner.ts` (`IdeaPrd`), `src/lib/supabase/types.ts`, `src/lib/api/json-converters.ts` (`PrdOutput`).
- **UI:** `src/app/ideas-refiner/_components/PrdStep.tsx`, `AiLoadingOverlay.tsx`, `SandboxPlannerShell.tsx`.
- **Docs feature:** `src/app/docs/actions.ts` (playbook compiler).

## Success Criteria (verified)

- Live regen on idea `2b58e58c-…` produced a ~29.5k-char PRD: §1 Project Name → §10 phased plan, with
  per-feature "Tools Used" (OpenShorts, Gemini API, YOLOv8+MediaPipe, faster-whisper, yt-dlp, ChatGPT) and
  per-phase "Main Tools" — all grounded in the idea's stack. ✅
- Playbook regen produced Build Guide v2 embedding the new PRD (Project Name + Tools Used) + Visual Styles +
  Database + 10 milestones. ✅
- `tsc --noEmit` clean. ✅

## Boundaries

- **Always:** append-only migrations; re-seed DB `prompt` rows + matching `FALLBACK_*` together; check write `error` + `isRequestActive`; `maxTokens: 16384` for the PRD.
- **Ask first:** pushing this migration to production Supabase / Vercel (local-first per STATE.md preferences).
- **Never:** reintroduce per-section PRD columns; rewrite unrelated DB prompt bodies.

## Notes / follow-ups

- Local only so far. Production rollout = apply the migration to `bcarzmfdamsozmfjgnpv` + deploy (deferred until authorized).
- See `docs/changelog.md` (2026-06-23 entry) and `[[STATE]]` decision for the durable record.
