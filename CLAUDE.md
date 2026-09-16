# Project Memory — Move37 Operational System

## Project Goal

Move37 Operational System is a modern, type-safe Next.js + Supabase platform for running the studio's internal operations — projects, chat, OKRs, SOPs, invoices, AI idea development, and market validation. The app is the product; **the codebase and the `.specs/` workspace are the source of truth.** Build features to fit the patterns already established in the code, not against an external specification.

> **History:** the operational core was ported from a legacy Bubble.io app; that migration is complete and the Bubble export is no longer a source of truth — do not reintroduce it.

---

## Operating Rules

These rules govern how you (Claude) work in this project. Follow them every session.

### Deployment & Commit Guardrails

Never take an irreversible or externally-visible action unless I explicitly say so in that message:

- Never commit or push to GitHub unless I explicitly say so.
- Never apply migrations to the **hosted** Supabase project (`supabase db push`) unless I explicitly say so — the local stack (`npm run db:reset`) is always fair game.
- Never deploy to Vercel unless I explicitly say so. Remember a push to `master` **is** a production deploy.

`.claude/settings.json` denies `git push`, `vercel deploy`, `vercel --prod` and `supabase db push` as a backstop, but the rule stands regardless of tooling.

Prepare the change, show me what would happen, and wait. "I fixed it" is not permission to ship it.

### Be a Critical Advisor

Be a critical advisor, not an assistant who agrees with me. Prioritize accuracy over validation.

- When you spot flaws in my reasoning, point them out clearly and explain why.
- If there is uncertainty, say so explicitly and state your level of confidence.
- Do not invent information to fill gaps.
- Disagree when there are grounds to — but don't manufacture artificial objections.
- Go straight to the point and lead with the most important information, even if it's uncomfortable.

### Finalize Session

When you finish and there is nothing pending and nothing left to do, put this at the very end of your response:

═══ ✅ SESSION FINALIZED ═══

(This tells me I can archive the session — nothing more to do there.)

### Pending Actions

Everything that depends on a decision from me goes at the end, in a separate block:

═══ ⚠️ PENDING: <confirmation / decision / choice, with your recommendation in one line> ═══

(This lets me glance at it and know exactly what I need to do to move forward.)

### Don't Ask Me to Do Grunt Work

Never ask me to run terminal commands or manipulate files directly if it's something you can do yourself. Do it.

### Highly Technical Decisions

Every time you need to make a technical decision (stack, libraries, code patterns, security, maintainability), give me the pros and cons of each option, plus your recommendation based on technical criteria — DRY and clean code.

### Context Management (to save tokens)

When starting multi-step tasks, document everything in `.md` files so I can compact the conversation and start new sessions without losing context. Specs belong in `.specs/features/<slug>/spec.md`.

Whenever the conversation context is no longer needed, suggest that I compact or start a new session to save tokens.

Tell me whether the next step needs **Opus**, or whether it can be **Sonnet** (clear plan) or **Haiku** (purely mechanical).

### Self-Learning

At the end of every session, capture the challenges and friction points you ran into that might recur.

- If it can be fixed, fix it.
- If it can't be fixed, record it in `CHALLENGES.md` (append a new dated section; never edit past entries).
- If the learning relates to a Skill, modify the skill instead of recording it.

Read `CHALLENGES.md` at the start of every new session.

### Stack Context

Before applying any coding principle, read `.agents/stack-context.md`. It records the language, framework, test/lint/format commands, CI gates, and this project's conventions. If it is missing or older than 30 days, regenerate it with the `detect-stack` skill. For framework API details it does not cover, use context7 MCP or web search. Do not guess.

### Code Quality Routing

Every code decision has an owning skill. Invoke it instead of improvising, and name it when you present the decision.

| Decision | Skill |
|---|---|
| Duplicated knowledge, single source of truth | `dry` |
| Complexity, readability, nesting depth | `kiss` |
| Speculative features, premature abstraction | `yagni` |
| Module boundaries, interfaces, dependency injection | `solid` |
| Layer boundaries, fat handlers, policy vs mechanism | `separation-of-concerns` |
| Coupling, chained access, wrapping external SDKs | `law-of-demeter` |
| Project structure, naming patterns, defaults over config | `convention-over-configuration` |
| Incremental cleanup of files you touch | `boy-scout-rule` |
| Guard pass on generated or changed code | `clean-code-guard` |
| UX of a flow, screen, or journey | `dont-make-me-think` |
| XP, levels, streaks, quests, reward economies | `gamification` |
| Long repetitive run with a measurable target | `loop-goal` |

### Clean Code Guard Pass

Run `clean-code-guard` over every file you generate, edit, or refactor, before presenting or committing it, and keep running it on every later change in the same session. Close each batch with its one-line report: `clean-code-guard: <N> fixed, <M> flagged for author`, or `clean-code-guard: clean`.

Its floor is not negotiable, even while stripping speculation and dead code:

- Validation and sanitization at every trust boundary.
- Error handling that prevents data loss.
- Security measures: authorization, output escaping, parameterized queries, secret handling.
- Behavior I explicitly asked for.

Removing one of those is a behavior change, not a cleanup. Keep it, or flag it and ask.

Refactors preserve observable behavior. A bug fix found during a refactor is a separate change: flag it and ask before bundling it in.

### UX Work

UX changes are journey-level, not screen-level. Run `dont-make-me-think`: audit to a friction map, rebuild the journey on paper as a blueprint, present the blueprint and stop. No UI code until I approve it. Engagement mechanics (XP, levels, streaks, quests, leaderboards) only when the surface actually calls for them, designed through `gamification`, never bolted on.

### Long Iterative Runs

When a task has to converge to a measurable target over many passes, use `loop-goal` to generate the `/loop` prompt instead of hand-driving the iterations. Goal must be measurable, verification independent of whoever produced the work, and the stopping conditions explicit: win, give-up, and ceiling.

---

## Knowledge Base Mapping

| Domain | Source of Truth |
|---|---|
| **DB** — tables, types, RLS | `supabase/migrations/` (applied schema) · `src/lib/supabase/types.ts` (generated types) |
| **DB** — narrative schema reference | `database.md` |
| **APIs** — external integrations | `src/lib/api/*` (the client modules themselves) |
| **UI** — pages & layout | `src/app/*/page.tsx` + `src/components/layout/` |
| **Components** — reusable elements | `src/components/ui/` · `src/components/layout/` |
| **Design tokens, typography, component contracts** | `design-system.md` |
| **Logic** — server-side workflows | `src/app/*/actions.ts` (`"use server"` functions) |
| **Architecture** — request lifecycle, security layers | `architecture.md` |
| **Non-negotiable rules** | `RULES.md` |
| **Project & codebase specs** | `.specs/project/` · `.specs/codebase/` |
| **Feature specs & acceptance criteria** | `.specs/features/<slug>/spec.md` |
| **Spec-conformance evaluations** | `.specs/evaluations/` |
| **Session friction log (read at session start)** | `CHALLENGES.md` |
| **Stack, commands, CI gates** | `.agents/stack-context.md` |
| **Project subagents** | `.claude/agents/` |
| **Marketing engine design notes** | `docs/marketing/` |
| **Build status** | `docs/project_status.md` |
| **Change log** | `docs/changelog.md` (2026-07 onward) · `docs/changelog-archive/2026-H1.md` |
| **Token-saving CLI reference** | `docs/rtk.md` |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.3.5, App Router, Turbopack |
| Language | TypeScript 5 (strict) |
| Database | Supabase — PostgreSQL 15, RLS on every table |
| Auth | Supabase Auth (email/password + magic link) |
| Styling | Tailwind CSS v4, CSS custom properties |
| Rich Text | TipTap v3 |
| Charts | Recharts v3 |
| AI | OpenRouter (platform key) for text/JSON · OpenAI gpt-image-1 / Gemini for images |
| Integrations | Brevo (email) · Apify (sourcing) · Buffer/Postiz (social) · Pexels (images) |
| Export | jsPDF + html2canvas · html-docx-js (vendored at `public/vendor/html-docx.js`, loaded on demand) · sanitize-html (jsdom-free HTML sanitisation) |
| Deployment | Cloudflare Workers via `@opennextjs/cloudflare` 1.20.6 + `wrangler` 4.x; dev port 4000 |
| Crons | Cloudflare Cron Triggers in `wrangler.jsonc` (hourly, no frequency floor, free) |

---

## Mandatory Coding Rules

These rules are non-negotiable. Follow them on every change. See `RULES.md` for the full policy.

1. **Study the existing code before coding.** Read the relevant feature in `src/app/` and the matching `.specs/` notes before implementing. Match established patterns; never invent a parallel way of doing something the codebase already solves.

2. **RLS on every table — no exceptions.** Every table needs a Supabase RLS policy. A table without RLS is a bug. Use `public.get_user_type()`, `public.is_admin_or_manager()`, and `auth.uid()` in policies.

3. **Append-only migrations.** Create a new numbered SQL file in `supabase/migrations/` for every schema change. Never edit an existing migration.

4. **Changelog discipline.** Update `docs/changelog.md` at the end of every session. Format: `## [YYYY-MM-DD] — Short title` then bullet points for what changed.

5. **Status/type values → PostgreSQL enums.** Define every status/type set as `CREATE TYPE … AS ENUM` (`os_*` operational, `mkt_*` marketing) — never hardcode status strings in application code.

6. **Mutations → Server Actions.** Implement all data-mutating logic as Next.js `"use server"` functions in `actions.ts` files co-located with the feature page. Never mutate data from client components.

7. **No orphan code.** Every new file must trace to a real feature, page, or data type that exists in the app. Delete dead code immediately.

8. **TypeScript types must match the DB.** After each migration, either regenerate `src/lib/supabase/types.ts` or manually update it. Feature interfaces in `src/types/` must stay in sync with both the DB types and the select queries.

---

## Auth & Access Pattern

Every server component page starts with:

```typescript
const { supabase, userId, role } = await requirePageAccess(["admin", "manager"]);
```

`requirePageAccess` (in `src/lib/auth/page-gate.ts`) handles:
- Unauthenticated → redirect `/signin`
- Wrong role → redirect to role's home page via `ROLE_FALLBACK`
- Returns `{ supabase, userId, role }` for reuse in the same server component

Middleware (`src/proxy.ts`) runs on every request to:
1. Refresh the Supabase session cookie
2. Redirect unauthenticated users to `/signin` (public zone: `/signin`, `/reset_pw`, `/m/*`, `/api/*`)
3. Hard-clamp `referrer` users to `/projects`, `/feedback`, `/profile` (allow-list); else redirect to `/projects`

**Never** do auth checking in client components. All auth is server-side.

---

## Database Patterns

### RLS helper functions

```sql
public.get_user_type()           -- current user's profiles.type
public.is_admin_or_manager()     -- true for admin | manager
public.is_staff_role()           -- true for admin | manager | operational
public.is_operational_user()     -- true for developer | client | qa (project-member tier; name is historical)
auth.uid()                       -- current user's UUID
```

### Standard three-tier RLS model

```sql
-- Tier 1: Admin/manager — full access
CREATE POLICY "table: admin/manager all" ON public.table FOR ALL
  USING (public.is_admin_or_manager());

-- Tier 2: Creator — full access on own rows
CREATE POLICY "table: creator all" ON public.table FOR ALL
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Tier 3: Project member — read-only
CREATE POLICY "table: project member read" ON public.table FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project p
      WHERE p.id = project_id AND auth.uid() = ANY(p.authorized_users)
    )
  );
```

### project_task access model

- `admin / manager` → ALL on all tasks
- `developer` → INSERT/UPDATE/DELETE any task in authorized projects
- `client` → INSERT/UPDATE `client_requests`; DELETE only own (`created_by = auth.uid()`)
- `qa` → INSERT/UPDATE `qa_requests`; DELETE only own (`created_by = auth.uid()`)
- All INSERT policies require `created_by = auth.uid()` in `WITH CHECK`
- App layer: always set `created_by: user.id` on task inserts in server actions

---

## Server Actions Pattern

```typescript
"use server";

export async function doSomething(data: Input): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("table").insert({ ...data, created_by: user.id });
  if (error) return { error: error.message };

  revalidatePath("/page");
  return {};
}
```

Key rules:
- Always call `supabase.auth.getUser()` — never trust client-provided user IDs
- Always set `created_by: user.id` on insert when the column exists
- Return `{ error?: string }` — never throw; callers check the returned error
- Call `revalidatePath()` after mutations so server-rendered pages refresh

---

## AI Integration Pattern

All text/JSON generation goes through **OpenRouter** on a single platform-owned key. Always use `resolveAiConfig` — never hardcode a provider key or a model slug:

```typescript
const aiConfig = await resolveAiConfig(supabase, user.id);
if (!aiConfig) return { error: "No AI service configured." };

const res = await generateAiJsonResponse<MyOutputType>({
  service: aiConfig.service,
  apiKey: aiConfig.apiKey,
  model: aiConfig.model,
  prompt,
});
```

- **Key resolution** (`src/lib/api/ai-config.ts`): platform `OPENROUTER_API_KEY` env var → `null`. That is the whole chain. Since 2026-08-14 there are **no per-user provider keys**, no `agency_ai_settings` tier, no `os_ai_service` enum, and no referrer/lead personal-key carve-out.
- **Model resolution**: `user_ai_settings.openrouter_model`, falling back to `DEFAULT_OPENROUTER_MODEL` (`openai/gpt-4.1`). Users pick from `OPENROUTER_MODELS` in `/settings`. `service` is always `"openrouter"`.
- **Dispatch**: `src/lib/api/ai-dispatcher.ts` → `src/lib/api/openrouter.ts` (raw `fetch`, no AI SDK dependency).
- **Images** are the one exception — they still call the providers directly. `resolveImageKeys()` reads `GEMINI_API_KEY` / `OPENAI_API_KEY` and dispatches to `src/lib/api/gemini.ts` / `src/lib/api/openai.ts`.
- Multi-field rich-HTML generations must pass `maxTokens: 16384` (the 8,192 default truncates the JSON and fails the parse).

---

## UI Patterns

### Page shell

```tsx
return (
  <PageShell profile={profile}>
    <PageHeader title="Feature" subtitle="N items" compact />
    {/* content */}
  </PageShell>
);
```

Never build one-off sidebar/main layouts — always use `PageShell`.

### Design token classes (never use raw hex in JSX)

| Class | Meaning |
|---|---|
| `bg-base` | Page background |
| `bg-surface` | Card/panel |
| `bg-elevated` | Modal/popover |
| `bg-muted` | Muted/disabled |
| `text-text-primary/secondary/muted` | Text hierarchy |
| `border-border` | Standard border |
| `bg-accent` / `text-accent` | Brand blue |

### Icon usage

Import from `@/components/ui/icons` — never write inline `<svg>` in component files.

---

## Feature-specific Notes

### Projects / Tasks

- `project.authorized_users: UUID[]` — membership: `auth.uid() = ANY(p.authorized_users)`
- Task hierarchy: `level_1` = milestone, `level_2` = task, `level_3/4` = subtasks
- Delete button visibility: `userType === "admin" || userType === "manager" || task.created_by === currentUserId`

### Chat

- `ChatBlock` types: `projects`, `internal_projects`, `private`, `chatbot`
- Use **per-block** refresh ticks, not a global tick (avoids re-fetching all lists on conversation select)
- Use `hasFetched` ref pattern: show loading spinner only on first fetch, not on background polls
- Tab panels (`ProjectTabsPanel`, `InternalProjectTabsPanel`) poll every 2s — guard with an in-flight `loadingRef` (skip overlapping polls) and only poll while the tab is visible, or the server-action queue floods and user saves are starved
- Emoji reactions use Supabase Realtime (not polling)

### Ideas Refiner

- **15 steps** (canonical order in `IDEA_BLOCKS_ORDERED`, `src/types/idea-refiner.ts`): ideas → structure_align → refining_icp → product_definition_flows → location_legislation → **benchmarking** → **market_opportunity** → strategic_frameworks → risk_and_validation → **report** → prd → database → visual_styles → milestones_and_tasks → playbook. (Benchmarking is step 6 and Market Opportunity step 7 — benchmarking's competitive/pricing signals feed the sizing & unit economics. `IDEA_BLOCKS_ORDERED` is the source of truth; the `IdeaBlock` type-union order is NOT the step order.)
- **Report is a pre-build go/no-go gate** (step 10, before PRD/Database/Visual/Milestones). It scores ONLY discovery evidence (steps 1–9) via a two-gate Skeptic↔Advocate debate + Reframer/Scorer synthesis. Verdict buckets: `build` (≥75) | `refine` (≥60) | `kill` (<60). It also emits a 10-section investor-grade **Build Brief**. The Devil's-Advocate debate now lives in **Risk & Validation** (step 9), not Report.
- **PRD is one comprehensive document** (collapsed 2026-07-02): `idea_prd` stores a single rich-HTML `description` column (the 10 per-section columns — `app_overview`, `objectives`, `priority_personas`, `essential_features`, `user_flow`, `features_per_page`, `non_functional_reqs`, `out_of_scope`, `success_indicators`, `phasing_notes` — were dropped and backfilled into `description`). The PRD prompt emits 10 numbered sections including **per-feature "Tools used in this area"**, Connected Platform Integrations, and a **phased delivery plan** with tools per phase. Downstream steps (Database, Visual Styles, Milestones, Playbook, chatbots) read `idea_prd.description`; `PrdOutput` is `{ description }`.
- Guard stale AI writes with `isRequestActive(supabase, ideaId, requestId)` before every DB write inside a generation function — **and always check the write `error`** (a swallowed insert error on a missing column reads as a silent 4-min timeout)
- `buildProjectFromIdea` inherits the idea's `authorized_users` and links the project via `idea.project_id`
- `idea_styles` JSONB columns: `color_tokens`, `typography`, `spacing`, `border_radius`, `shadows`
- `idea_styles` narrative columns: `brand_voice`, `iconography_style`, `motion_principles` (plus legacy `logo_branding`, `color_palette`, `product_feeling`)

### Market Validation Engine (greenfield)

- Per-**idea** validation workspace (migrated from project-level): `/marketing/[ideaId]/{positioning,sourcing,outreach,interviews,content,landing,signals,traffic}`
- Public landing pages at `/m/[slug]` — anonymous, written via the **service-role** client; no anon RLS exposed
- Cron workers at `/api/mkt/cron/*` (guarded by `CRON_SECRET`) send due outreach (Brevo) and publish scheduled content (Buffer/Postiz)
- Lead sourcing via Apify actors (Google Maps, B2B leads, 6-platform social discovery)
- Signals scoring is weighted by commitment level with Wilson-CI conversion and ICP-fit split

### Invoices & Work Feedback

- "Daily feedback" → **Work Feedback**: `project_work_feedback` / `internal_project_work_feedback` with `start_date`, `end_date`, `total_time`, `emails[]` (the internal tab key/URL stays `daily_feedback`)
- Invoices: `currency`, `account_details` (merged SWIFT/IBAN), work period, `total_time`, `emails[]`; **AI Fill** sums `total_time` deterministically and AI-summarizes `current_work` into the service description; client-side PDF (hex styles, not Tailwind `oklch()`, so html2canvas can parse) emailed via Brevo

---

## Where to Look (Quick Links)

| Topic | Location |
|---|---|
| Database tables, columns & enums | `supabase/migrations/` · `src/lib/supabase/types.ts` · `database.md` |
| External API integrations | `src/lib/api/` (openrouter, ai-config, ai-dispatcher, openai, gemini, brevo, apify, buffer, postiz, image-search) |
| Page layouts & access gating | `src/app/*/page.tsx` · `src/lib/auth/page-gate.ts` |
| Server-side workflows | `src/app/*/actions.ts` |
| Reusable components | `src/components/ui/` · `src/components/layout/` |
| Design tokens & component contracts | `design-system.md` |
| Project goals, roadmap, state | `.specs/project/` |
| Codebase conventions & architecture | `.specs/codebase/` · `architecture.md` |
| Feature specs & acceptance criteria | `.specs/features/<slug>/spec.md` |
| Spec-conformance evaluations | `.specs/evaluations/` |
| Session friction log | `CHALLENGES.md` |
| Stack, commands, CI gates | `.agents/stack-context.md` |
| Project subagents | `.claude/agents/` |
| Optional Claude Code hooks (not enabled) | `hooks.example.md` |
| Marketing engine design notes | `docs/marketing/` |
| RTK command reference | `docs/rtk.md` |

---

## Project agents

Six project-scoped subagents live in `.claude/agents/`. Delegate to the owning agent rather than improvising:

| Agent | Owns |
|---|---|
| `move37-migration-author` | Append-only Supabase migrations: enums, RLS enablement + three-tier policies, `SECURITY DEFINER` hygiene, an index on every new FK, and keeping `src/lib/supabase/types.ts` in sync. Local stack only — refuses production apply. |
| `move37-server-action-author` | The `"use server"` mutation layer: auth via `supabase.auth.getUser()`, `created_by: user.id`, `{ error?: string }` returns, `revalidatePath()`, column allow-lists, and the `resolveAiConfig` + `isRequestActive` AI call path. |
| `move37-ui-builder` | Pages and components: `PageShell` + `PageHeader`, design-token classes only, icons from `@/components/ui/icons`, `next/dynamic` for heavy libraries, sanitized HTML sinks, route-level `loading.tsx` / `error.tsx`. |
| `move37-spec-conformance-reviewer` | Read-only grading of a diff against `.specs/features/<slug>/spec.md` acceptance criteria — MET/UNMET with `file:line` evidence, weighted P0/P1/P2. |
| `move37-security-reviewer` | Read-only security review of the real attack surface: RLS coverage, `SECURITY DEFINER` search_path, service-role usage, unauthenticated `/api/*` routes, the anonymous `/m/[slug]` pages, HTML sinks, secrets, `next.config.ts` headers. |
| `move37-docs-sync` | Keeping `CLAUDE.md`, `README.md`, `RULES.md`, `architecture.md`, `database.md`, `design-system.md`, `docs/project_status.md` and `docs/changelog.md` consistent with the code after a change. |

---

## RTK

Prefix every shell command with `rtk` (`rtk git status`, `rtk npm run build`, `rtk grep …`) — it filters output for 60–90% token savings and passes through unchanged when no filter matches, so it is always safe. Use it inside `&&` chains too.

Filters are trusted per-repo via `rtk trust`; if you see "Filters NOT applied", run it.

Full command reference: `docs/rtk.md`. Global reference: `~/.claude/RTK.md`.
