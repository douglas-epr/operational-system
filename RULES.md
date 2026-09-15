# RULES — Move37 Operational System

> These rules are **non-negotiable**. Every pull request, every commit, every AI-assisted change must comply with all rules on this page. No exceptions. When in doubt, choose the stricter interpretation.

---

## Table of Contents

1. [Spec & Codebase-First Development](#1-spec--codebase-first-development)
2. [Database & Migrations](#2-database--migrations)
3. [Row Level Security (RLS)](#3-row-level-security-rls)
4. [TypeScript Discipline](#4-typescript-discipline)
5. [Server Actions](#5-server-actions)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [UI & Styling](#7-ui--styling)
8. [AI Integration](#8-ai-integration)
9. [Code Hygiene](#9-code-hygiene)
10. [Changelog & Documentation](#10-changelog--documentation)
11. [Quick Reference: DO / DON'T](#11-quick-reference-do--dont)

---

## 1. Spec & Codebase-First Development

**Rule:** Read the existing implementation and the relevant `.specs/` notes before writing a single line of feature code. The running code is the source of truth.

| What you are building | Where to look first |
|---|---|
| A new table or column | `supabase/migrations/` + `src/lib/supabase/types.ts` |
| An enum / status value | `supabase/migrations/` (the `os_*` / `mkt_*` `CREATE TYPE` blocks) |
| A page or route | the sibling `src/app/*/page.tsx` |
| A reusable component | `src/components/ui/` + `src/components/layout/` |
| Data-mutating logic | the feature's `src/app/*/actions.ts` |
| An external API call | `src/lib/api/*` |
| Project goals / architecture | `.specs/project/` + `.specs/codebase/` + `architecture.md` |

**Why:** The app is a mature, type-safe Next.js + Supabase codebase with well-established patterns. New work must fit those patterns. Match what the neighbouring feature does rather than inventing a parallel approach.

> The operational core was originally ported from a legacy Bubble.io app. That migration is **complete**; the Bubble export has been removed and is no longer a reference. Do not reintroduce it.

**Greenfield domains.** The **Market Validation Engine** (`/marketing`, `/m`, `mkt_*` tables, `src/lib/marketing/`) is a net-new domain — its design notes live in `docs/marketing/`. New net-new domains must document their own design notes there before/while building.

---

## 2. Database & Migrations

### 2.1 Append-only migrations

- Every schema change lives in a new numbered SQL file: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
- **Never edit an existing migration file.** Treat applied migrations as immutable history.
- If a previous migration was wrong, write a new migration that corrects it.

### 2.2 Naming conventions

| Object | Convention | Example |
|---|---|---|
| Migration file | `YYYYMMDDHHMMSS_short_description.sql` | `20260501000001_profile_coworker_visibility.sql` |
| Table | `snake_case`, singular where possible | `project_task`, `idea_styles` |
| Column | `snake_case` | `created_by`, `authorized_users` |
| PostgreSQL enum | `os_` prefix (operational) / `mkt_` prefix (marketing) | `os_task_type`, `os_user_type` |
| RLS policy | `"table: actor action"` | `"task: developer insert"` |
| RLS helper function | `public.verb_noun()` | `public.get_user_type()`, `public.is_admin_or_manager()` |

### 2.3 Status/type values → PostgreSQL enums

- Every fixed set of status/type values **must** be a `CREATE TYPE … AS ENUM` in a migration.
- Never hardcode status/type strings in application code. Always reference the enum.

```sql
-- Correct
CREATE TYPE public.os_task_type AS ENUM (
  'developer_tasks',
  'client_requests',
  'qa_requests'
);

-- Wrong — never do this
type: "developer_tasks"  -- raw string in application code
```

### 2.4 After every migration

1. Either run `npx supabase gen types typescript --project-id <ref> > src/lib/supabase/types.ts`
2. Or manually add the new columns to `src/lib/supabase/types.ts` (Row / Insert / Update interface).
3. Update any feature interfaces in `src/types/` that depend on the changed table.

---

## 3. Row Level Security (RLS)

**Rule:** Every table must have RLS enabled. A table without RLS is a bug, not a shortcut.

### 3.1 Enable RLS on every table

```sql
ALTER TABLE public.my_table ENABLE ROW LEVEL SECURITY;
```

### 3.2 Standard three-tier model

Apply this template unless the feature's access model requires different rules:

```sql
-- Tier 1: Admin / Manager — unrestricted
CREATE POLICY "my_table: admin/manager all" ON public.my_table FOR ALL
  USING (public.is_admin_or_manager());

-- Tier 2: Creator — full access on own rows
CREATE POLICY "my_table: creator all" ON public.my_table FOR ALL
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Tier 3: Project member — read-only
CREATE POLICY "my_table: project member read" ON public.my_table FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project p
      WHERE p.id = project_id
        AND auth.uid() = ANY(p.authorized_users)
    )
  );
```

### 3.3 Available RLS helper functions

```sql
public.get_user_type()        -- TEXT: current user's profiles.type
public.is_admin_or_manager()  -- BOOL: true for 'admin' | 'manager'
public.is_staff_role()        -- BOOL: true for 'admin' | 'manager' | 'operational'
public.is_operational_user()  -- BOOL: true for 'developer' | 'client' | 'qa' (project-member tier — name is historical)
auth.uid()                    -- UUID: current authenticated user
```

### 3.4 project_task access model

| Role | Operation | Condition |
|---|---|---|
| admin / manager | ALL | always |
| developer | INSERT | `created_by = auth.uid()` + project member |
| developer | UPDATE | project member |
| developer | DELETE | project member |
| client | INSERT | `type = 'client_requests'` + `created_by = auth.uid()` + project member |
| client | UPDATE | `type = 'client_requests'` + project member |
| client | DELETE | `type = 'client_requests'` + `created_by = auth.uid()` |
| qa | INSERT | `type = 'qa_requests'` + `created_by = auth.uid()` + project member |
| qa | UPDATE | `type = 'qa_requests'` + project member |
| qa | DELETE | `type = 'qa_requests'` + `created_by = auth.uid()` |

### 3.5 RLS and column-level restrictions

Supabase RLS is row-level only. Column-level restrictions (e.g. never expose `profiles.signature` to other users) must be enforced in the application layer — select only the columns you need, never `SELECT *` on sensitive tables.

### 3.6 Indexes on every foreign key

Every foreign-key column gets a B-tree index **in the same migration that creates the column**. Postgres indexes the referenced primary key, never the referencing side, so an unindexed FK turns every parent-scoped read and every `ON DELETE` check into a sequential scan.

```sql
-- Correct — column and its index ship together
ALTER TABLE public.mkt_signal ADD COLUMN validation_id UUID REFERENCES public.mkt_validation(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS mkt_signal_validation_id_idx ON public.mkt_signal (validation_id);
```

The same applies to any column used in an RLS policy predicate or as a hot filter (`created_by`, `project_id`, `idea_id`, `status`). Naming: `<table>_<column>_idx`.

---

## 4. TypeScript Discipline

### 4.1 Types must match the database

- Feature interfaces in `src/types/<feature>.ts` must stay in sync with both `src/lib/supabase/types.ts` and the actual select queries.
- If a column is added to the DB, add it to `types.ts` and the relevant feature interface before writing application code that uses it.

### 4.2 No `any`

- TypeScript is set to `strict` mode. Never use `any` to silence a type error.
- If the type is genuinely unknown, use `unknown` and narrow it.

### 4.3 No type assertions to escape errors

```typescript
// Wrong — masks real bugs
const task = data as Task;

// Correct — validate the shape
if (!data || typeof data.id !== "string") throw new Error("Invalid task");
```

### 4.4 Enums in TypeScript

Mirror DB enums as TypeScript `const` objects (not TS `enum` keyword, which causes build issues with some bundlers):

```typescript
// Correct
export const TaskType = {
  DeveloperTasks: "developer_tasks",
  ClientRequests: "client_requests",
  QaRequests: "qa_requests",
} as const;
export type TaskType = typeof TaskType[keyof typeof TaskType];
```

---

## 5. Server Actions

**Rule:** All data mutations happen in `"use server"` functions. Never mutate from a client component.

### 5.1 Standard action template

```typescript
"use server";

export async function doSomething(data: InputType): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("table")
    .insert({ ...data, created_by: user.id });

  if (error) return { error: error.message };

  revalidatePath("/affected-page");
  return {};
}
```

### 5.2 Action rules

| Rule | Rationale |
|---|---|
| Always call `supabase.auth.getUser()` — never trust client-provided user IDs | Server-side verification prevents privilege escalation |
| Always set `created_by: user.id` on INSERT when the column exists | RLS "creator" policies depend on this being correct |
| Return `{ error?: string }` — never throw | Callers check the returned error; thrown errors leak stack traces to the client |
| Call `revalidatePath()` after every mutation | Server-rendered pages must refresh after data changes |
| Co-locate `actions.ts` with the feature page | `src/app/feature/actions.ts` — no centralised god file |
| Never put business logic in route handlers | Use server actions for mutations; route handlers only for webhooks/streaming |

---

## 6. Authentication & Authorization

### 6.1 Page access gate

Every server component page starts with:

```typescript
const { supabase, userId, role } = await requirePageAccess(["admin", "manager"]);
```

`requirePageAccess` (in `src/lib/auth/page-gate.ts`):
- Unauthenticated → redirect to `/signin`
- Wrong role → redirect to the role's default home page via `ROLE_FALLBACK`
- Returns `{ supabase, userId, role }` for reuse in the same server component

### 6.2 Middleware

`src/proxy.ts` runs on every request:
1. Refreshes the Supabase session cookie
2. Redirects unauthenticated users to `/signin`
3. Hard-clamps `referrer` users to an allow-list of prefixes (`/projects`, `/feedback`, `/profile`, `/signin`, `/reset_pw`, `/auth`, `/api`); anything else redirects to `/projects`

**Never** replicate these checks inside page components — middleware handles them first.

### 6.3 Client components

**Never** do auth checking in client components. All auth is server-side only.

### 6.4 Role hierarchy

```
admin / manager      → full platform access
operational          → internal tools only
developer            → assigned projects + all task types
client               → assigned projects + client_requests only
qa                   → assigned projects + qa_requests only
referrer             → /projects, /feedback, /profile only (middleware-clamped)
lead                 → /ideas-refiner + /invoices + personal settings only
```

### 6.5 API route authentication

Route handlers under `src/app/api/` sit **outside** the page gate and outside the middleware's authenticated zone. Every one of them authenticates itself and **fails closed in production**:

| Route class | Required check |
|---|---|
| Cron workers (`/api/mkt/cron/*`) | `Authorization: Bearer <CRON_SECRET>`, compared with `crypto.timingSafeEqual` — never `===` |
| Inbound webhooks (Cal.com, Tally, Brevo) | HMAC signature over the raw request body against the provider's shared secret |
| Service-to-service | A service token verified server-side |

Rules:

- A missing or malformed secret is a **401/403, never a pass-through**. Never let a route run unauthenticated because the env var is unset — that is an open endpoint, not a graceful degradation.
- Public, deliberately anonymous inputs (`/api/m/*` landing capture) must **validate every field** before it touches the database and must be **rate limited**. They write through the service-role client, so a missing validation is a direct write primitive.
- Never log a secret, a signature, or a raw request body containing PII.

---

## 7. UI & Styling

### 7.1 Always use PageShell

```tsx
return (
  <PageShell profile={profile}>
    <PageHeader title="Feature Name" subtitle="N items" compact />
    {/* page content */}
  </PageShell>
);
```

Never build one-off sidebar/main layouts. `PageShell` is the single layout contract.

### 7.2 Design tokens — never raw hex

Use CSS custom property classes exclusively. Never put hex codes or hardcoded colour values in JSX.

| Class | Use |
|---|---|
| `bg-base` | Page background |
| `bg-surface` | Card, panel, sidebar |
| `bg-elevated` | Modal, popover, dropdown |
| `bg-muted` | Disabled, placeholder |
| `text-text-primary` | Main body text |
| `text-text-secondary` | Labels, captions |
| `text-text-muted` | Placeholders, hints |
| `border-border` | Standard divider / border |
| `bg-accent` / `text-accent` | Brand blue CTAs |

```tsx
// Correct
<div className="bg-surface border border-border rounded-lg p-4">

// Wrong — never do this
<div style={{ backgroundColor: "#1e1e2e", border: "1px solid #3b3b52" }}>
```

### 7.3 Icons

Import all icons from `@/components/ui/icons`. Never write inline `<svg>` elements inside component files.

```tsx
// Correct
import { PlusIcon, TrashIcon } from "@/components/ui/icons";

// Wrong
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">...</svg>
```

### 7.4 Rich text

Use `TipTap` via the shared `RichTextEditor` component. Never use `contentEditable` for user-authored content.

**Every `dangerouslySetInnerHTML` goes through `sanitizeHtml`** (`src/lib/sanitize.ts`) — no exceptions, and no "this HTML came from our own AI so it's fine". AI output, TipTap output, and stored rich-HTML columns are all untrusted sinks. Sanitize on the server where the value is read, so a new client renderer cannot forget.

```tsx
// Correct
<div dangerouslySetInnerHTML={{ __html: sanitizeHtml(idea.prd.description) }} />

// Wrong — never do this
<div dangerouslySetInnerHTML={{ __html: idea.prd.description }} />
```

### 7.5 Client component boundaries

Keep client components as leaf nodes. Server components fetch data; client components handle interactivity. Prop-drill data down rather than re-fetching in client components.

---

## 8. AI Integration

**Rule:** Never hardcode an AI key or a model slug. Always use `resolveAiConfig`.

### 8.1 Standard AI call pattern

```typescript
const aiConfig = await resolveAiConfig(supabase, user.id);
if (!aiConfig) return { error: "No AI service configured." };

const result = await generateAiJsonResponse<MyOutputType>({
  service: aiConfig.service,
  apiKey: aiConfig.apiKey,
  model: aiConfig.model,
  prompt,
});
```

### 8.2 Config resolution order

1. Platform `OPENROUTER_API_KEY` environment variable — one key, shared by every user
2. `null` → surface "No AI service configured." to the user

That is the entire chain. Since 2026-08-14 there are **no per-user provider keys**, no `agency_ai_settings` tier, no `os_ai_service` enum, and no referrer/lead carve-out (the legacy columns and enum were dropped in `20260814140000_drop_legacy_user_ai_keys.sql`). Never reintroduce a second key tier without a migration and a doc update.

`resolveImageKeys()` is the one exception: image generation still calls OpenAI/Gemini directly and reads `GEMINI_API_KEY` / `OPENAI_API_KEY` from the environment. It is for **images only** — never route text or JSON through it.

### 8.3 Model selection

Users pick a model, not a provider. The selected OpenRouter slug lives in `user_ai_settings.openrouter_model`; `resolveAiConfig` falls back to `DEFAULT_OPENROUTER_MODEL` when it is missing or invalid.

- **Never hardcode a model slug** anywhere except `DEFAULT_OPENROUTER_MODEL` in `src/types/settings.ts`. Always pass `aiConfig.model` through.
- New models are added to the `OPENROUTER_MODELS` catalogue in `src/types/settings.ts` — verify the slug against `https://openrouter.ai/api/v1/models` first.
- `service` is always `"openrouter"`. Do not branch on it.

### 8.4 Prompts in the database

AI prompts are stored in the `prompt` table and editable by admins at `/prompts`. Every AI action file must also define a `FALLBACK_*` constant used when no database prompt exists for that step. The fallback is the floor — the DB prompt is the ceiling.

### 8.5 Stale-write guard (Ideas Refiner)

Inside any multi-step AI generation function, call `isRequestActive(supabase, ideaId, requestId)` before every database write to prevent stale responses from overwriting newer data when the user cancels and re-runs a step. Always check the write `error` too — a swallowed insert error on a missing column reads as a silent 4-minute timeout with no data. Large rich-HTML steps (e.g. the single-document PRD, Database, Visual Styles) must pass `maxTokens: 16384` (the 8,192 default truncates the JSON and fails the parse).

---

## 9. Code Hygiene

### 9.1 No orphan code

Every file must trace to a real feature, page, workflow, or data type in the app. If you cannot point to where it is used, the file does not belong in the codebase. Delete dead code immediately — do not leave it commented out.

### 9.2 Co-location

```
src/app/feature/
  page.tsx          ← server component, data fetching
  actions.ts        ← server actions for this feature only
  _components/      ← client components for this feature
    FeatureWidget.tsx
```

Shared types live in `src/types/<feature>.ts`. Shared data fetchers live in `src/lib/data/`.

### 9.3 No client-side data mutation

If a component needs to change data, it calls a server action. Never call `supabase.from(...).insert()` from a client component.

### 9.4 Error handling

- Server actions return `{ error?: string }` — never throw.
- Client components display the returned error via toast or inline message.
- Never swallow errors silently (`catch (e) {}`).

### 9.5 Polling / real-time

- Use per-block refresh ticks in the Chat feature — not a single global tick. A global tick re-fetches all lists every time any conversation is selected.
- Use the `hasFetched` ref pattern: show a loading spinner only on the first fetch; subsequent polls are silent background refreshes.
- Use `useRef` to hold callback references inside polling `useEffect` to avoid stale closures without adding the callback to the deps array (which would cause infinite re-subscription).

---

## 10. Changelog & Documentation

### 10.1 Changelog entry required after every session

Update `docs/changelog.md` at the end of every coding session. Format:

```markdown
## [YYYY-MM-DD] — Short title

- **Feature/Fix:** What was built or fixed and why.
- **Migration:** Name of any new migration file.
- **Files touched:** List of changed source files.
```

No changelog entry = the session is not complete.

### 10.2 Project status

Keep `docs/project_status.md` current. Mark features as `complete`, `in-progress`, or `not started`. The status file is the single source of truth for build completion.

### 10.3 Architecture and rules

- `README.md` — Getting started, tech stack, project structure, deployment. Update when any of these change.
- `architecture.md` — System architecture, request lifecycle, data flows. Update when the architecture changes.
- `CLAUDE.md` — AI assistant working instructions, coding patterns with code examples. Update when new patterns are established.
- `RULES.md` (this file) — Enforcement-focused, non-negotiable rules. Update only when a new rule is ratified or an existing rule is tightened.
- `database.md` — Narrative schema reference. Update with every migration.
- `design-system.md` — Design tokens, typography, component contracts. Update when a token or contract changes.
- `CHALLENGES.md` — Dated self-learning log. Append a section at the end of every session that hit friction.
- `hooks.example.md` — Optional, not-enabled Claude Code hook recipes. Update when a recipe stops matching the current hooks schema.

### 10.4 A changelog entry is not enough on its own

Every changelog entry must ship with matching updates to whichever of these the change touched. A changelog entry with stale companions is an incomplete session:

| If the change… | Also update |
|---|---|
| made an architectural or tooling decision | `.specs/project/STATE.md` — record the decision and its date |
| added a migration | `docs/project_status.md` — bump the migration count and the latest-migration timestamp |
| changed the stack, structure, conventions, integrations or testing story | the affected file(s) in `.specs/codebase/` (`STACK.md`, `STRUCTURE.md`, `CONVENTIONS.md`, `INTEGRATIONS.md`, `ARCHITECTURE.md`, `TESTING.md`) |
| changed the schema | `database.md` |
| changed tokens or component contracts | `design-system.md` |
| hit recurring friction worth remembering | `CHALLENGES.md` (append a dated section) |

Use the `move37-docs-sync` agent for this pass rather than doing it by hand.

---

## 11. Quick Reference: DO / DON'T

| DO | DON'T |
|---|---|
| Study the existing code + `.specs/` before coding | Invent a parallel pattern the codebase already solves |
| Create new numbered migration files | Edit existing migration files |
| Enable RLS on every table | Ship a table without RLS |
| Use `public.get_user_type()` in RLS policies | Check roles in application code as primary gate |
| Set `created_by: user.id` on every INSERT | Trust a client-provided user ID |
| Return `{ error?: string }` from server actions | Throw errors from server actions |
| Use `requirePageAccess()` at the top of every page | Do auth checking in client components |
| Use design token classes (`bg-surface`, `text-accent`) | Use raw hex values or hardcoded colours in JSX |
| Import icons from `@/components/ui/icons` | Write inline `<svg>` in component files |
| Use `PageShell` for every page layout | Build one-off sidebar/main layouts |
| Use `resolveAiConfig` for AI calls | Hardcode AI provider keys or model strings |
| Guard Ideas Refiner AI writes with `isRequestActive` + check the write error | Write AI output to DB without a stale-request check |
| Update `docs/changelog.md` after every session | Leave a session with no changelog entry |
| Keep `src/types/` in sync with the DB schema | Let TypeScript types drift from the database |
| Use per-block polling ticks in Chat | Use a single global polling tick for all chat blocks |
| Co-locate `actions.ts` with the feature page | Centralise all mutations in one god actions file |
| Use `unknown` + type narrowing for uncertain types | Use `any` to silence TypeScript errors |
| Index every foreign-key column in the same migration | Add an FK column and leave it unindexed |
| Authenticate every `/api/*` route and fail closed | Let a route run because its secret env var is unset |
| Compare bearer secrets with `crypto.timingSafeEqual` | Compare secrets with `===` |
| Validate and rate-limit public `/api/m/*` input | Trust anonymous input because RLS is bypassed anyway |
| Pass every `dangerouslySetInnerHTML` value through `sanitizeHtml` | Render stored or AI-generated HTML raw |
| Pass `aiConfig.model` through from `resolveAiConfig` | Hardcode a model slug outside `DEFAULT_OPENROUTER_MODEL` |
| Update `.specs/project/STATE.md`, `docs/project_status.md` and `.specs/codebase/*` alongside the changelog | Ship a changelog entry with stale companion docs |

---

*Last updated: 2026-09-15*
