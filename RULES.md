# RULES — Move37 Operational System

> These rules are **non-negotiable**. Every pull request, every commit, every AI-assisted change must comply with all rules on this page. No exceptions. When in doubt, choose the stricter interpretation.

---

## Table of Contents

1. [Reference-First Development](#1-reference-first-development)
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

## 1. Reference-First Development

**Rule:** Read the relevant section of `docs/reference_docs/` before writing a single line of feature code.

| What you are building | Where to look first |
|---|---|
| A new table or column | `docs/reference_docs/tabelas.md` |
| An enum / status value | `docs/reference_docs/option-sets.md` |
| A page or route | `docs/reference_docs/paginas.md` |
| A reusable component | `docs/reference_docs/elementos-reutilizaveis.md` |
| Data-mutating logic | `docs/reference_docs/backend-workflows.md` |
| An external API call | `docs/reference_docs/api-connectors.md` |
| Anything above | `docs/reference_docs/blurapps-41815--2--documentacao-completa-2026-03-04.md` (master export) |

**Why:** The codebase is a direct port of the studio's Bubble.io application. Behaviour that is not documented in the reference docs does not belong in this codebase.

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
| PostgreSQL enum | `os_` prefix (mirrors Bubble Option Set naming) | `os_task_type`, `os_user_type` |
| RLS policy | `"table: actor action"` | `"task: developer insert"` |
| RLS helper function | `public.verb_noun()` | `public.get_user_type()`, `public.is_admin_or_manager()` |

### 2.3 Option Sets → PostgreSQL enums

- All Bubble Option Sets **must** become `CREATE TYPE … AS ENUM` in a migration.
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

Apply this template unless the Bubble reference doc specifies different access rules:

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
public.is_operational_user()  -- BOOL: true for 'operational'
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
3. Hard-clamps `referrer` users to `/recommended-projects`

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
referrer             → /recommended-projects only (middleware-clamped)
lead                 → sandbox-planner + personal settings only
```

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

Use `TipTap` via the shared `RichTextEditor` component. Never use `contentEditable` or `dangerouslySetInnerHTML` directly for user-authored content.

### 7.5 Client component boundaries

Keep client components as leaf nodes. Server components fetch data; client components handle interactivity. Prop-drill data down rather than re-fetching in client components.

---

## 8. AI Integration

**Rule:** Never hardcode AI provider keys. Always use `resolveAiConfig`.

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

1. Personal key (user opted out of agency settings)
2. Agency-level key (read via service-role client — key never reaches browser)
3. `OPENAI_API_KEY` environment variable fallback
4. `null` → surface "Configure AI in Settings" message to user

### 8.3 Referrer / Lead users

`referrer` and `lead` role users are restricted to personal keys only — they must never trigger agency-paid LLM calls. Enforce this in `resolveAiConfig`.

### 8.4 Prompts in the database

AI prompts are stored in the `prompt` table and editable by admins at `/prompts`. Every AI action file must also define a `FALLBACK_*` constant used when no database prompt exists for that step. The fallback is the floor — the DB prompt is the ceiling.

### 8.5 Stale-write guard (Sandbox Planner)

Inside any multi-step AI generation function, call `isRequestActive(supabase, ideaId, requestId)` before every database write to prevent stale responses from overwriting newer data when the user cancels and re-runs a step.

---

## 9. Code Hygiene

### 9.1 No orphan code

Every file must trace to a documented Bubble element, page, workflow, or data type. If you cannot point to the reference doc entry, the file does not belong in the codebase. Delete dead code immediately — do not leave it commented out.

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

---

## 11. Quick Reference: DO / DON'T

| DO | DON'T |
|---|---|
| Read reference docs before coding | Invent behaviour not in the reference docs |
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
| Guard Sandbox Planner AI writes with `isRequestActive` | Write AI output to DB without stale-request check |
| Update `docs/changelog.md` after every session | Leave a session with no changelog entry |
| Keep `src/types/` in sync with the DB schema | Let TypeScript types drift from the database |
| Use per-block polling ticks in Chat | Use a single global polling tick for all chat blocks |
| Co-locate `actions.ts` with the feature page | Centralise all mutations in one god actions file |
| Use `unknown` + type narrowing for uncertain types | Use `any` to silence TypeScript errors |

---

*Last updated: 2026-05-01*
