# Project Memory — Blur Studio Internal Tools

## Project Goal

Replicate the studio's legacy Bubble.io application (documented in `docs/reference_docs/`) as a modern, type-safe Next.js + Supabase web app. Every feature must trace back to a documented Bubble element, page, workflow, or data type.

---

## Knowledge Base Mapping

| Domain | Source of Truth |
|---|---|
| **DB** — tables, types, privacy rules | `docs/reference_docs/tabelas.md` · `docs/reference_docs/option-sets.md` |
| **APIs** — external integrations | `docs/reference_docs/api-connectors.md` |
| **UI** — pages & layout | `docs/reference_docs/paginas.md` |
| **Components** — reusable elements | `docs/reference_docs/elementos-reutilizaveis.md` |
| **Logic** — server-side workflows | `docs/reference_docs/backend-workflows.md` |
| **Master export** | `docs/reference_docs/blurapps-41815--2--documentacao-completa-2026-03-04.md` (7,567 lines) |
| **Build status** | `docs/project_status.md` |
| **Change log** | `docs/changelog.md` |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.1.6, App Router, Turbopack |
| Language | TypeScript 5 (strict) |
| Database | Supabase — PostgreSQL 15, RLS on every table |
| Auth | Supabase Auth (email/password + magic link) |
| Styling | Tailwind CSS v4, CSS custom properties |
| Rich Text | TipTap v3 |
| Charts | Recharts v3 |
| AI | OpenAI GPT-4.1 · Gemini 2.5 Flash · Claude Sonnet |
| Deployment | Vercel (auto-deploy on push to `master`) |

---

## Mandatory Coding Rules

These rules are non-negotiable. Follow them on every change. See `RULES.md` for the full policy.

1. **Consult the reference docs before coding.** Read the relevant section of `docs/reference_docs/` before implementing any feature. Never invent behaviour that isn't documented there.

2. **RLS on every table — no exceptions.** Map every Bubble Privacy Rule from `tabelas.md` to a Supabase RLS policy. A table without RLS is a bug. Use `public.get_user_type()`, `public.is_admin_or_manager()`, and `auth.uid()` in policies.

3. **Append-only migrations.** Create a new numbered SQL file in `supabase/migrations/` for every schema change. Never edit an existing migration.

4. **Changelog discipline.** Update `docs/changelog.md` at the end of every session. Format: `## [YYYY-MM-DD] — Short title` then bullet points for what changed.

5. **Option Sets → PostgreSQL enums.** Convert all Bubble Option Sets to `CREATE TYPE … AS ENUM` — never hardcode status strings in application code.

6. **Bubble Backend Workflows → Server Actions.** Implement all data-mutating logic as Next.js `"use server"` functions in `actions.ts` files co-located with the feature page. Never mutate data from client components.

7. **No orphan code.** Every new file must trace to a Bubble element, page, workflow, or data type. Delete dead code immediately.

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
2. Redirect unauthenticated users to `/signin`
3. Hard-clamp `referrer` users to `/recommended-projects`

**Never** do auth checking in client components. All auth is server-side.

---

## Database Patterns

### RLS helper functions

```sql
public.get_user_type()           -- current user's profiles.type
public.is_admin_or_manager()     -- true for admin | manager
public.is_operational_user()     -- true for operational
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

Always use `resolveAiConfig` — never hardcode provider keys:

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

Resolution order: personal key → agency key (service-role read) → `OPENAI_API_KEY` env → `null`.

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

- Block types: `projects`, `projects_internal`, `internal_projects`, `private`, `chatbot`
- Use **per-block** refresh ticks, not a global tick (avoids re-fetching all lists on conversation select)
- Use `hasFetched` ref pattern: show loading spinner only on first fetch, not on background polls

### Sandbox Planner

- 11 steps: ideas → structure_align → refining_icp → product_definition_flows → benchmarking → strategic_frameworks → prd → database → visual_styles → milestones_and_tasks → report
- Guard stale AI writes with `isRequestActive(supabase, ideaId, requestId)` before every DB write inside a generation function
- `idea_styles` JSONB columns: `color_tokens`, `typography`, `spacing`, `border_radius`, `shadows`
- `idea_styles` narrative columns: `brand_voice`, `iconography_style`, `motion_principles` (plus legacy `logo_branding`, `color_palette`, `product_feeling`)

---

## Reference Docs Quick Links

| Topic | File |
|---|---|
| Database tables & columns | `docs/reference_docs/tabelas.md` |
| Bubble Option Sets (enums) | `docs/reference_docs/option-sets.md` |
| API connector calls | `docs/reference_docs/api-connectors.md` |
| Page layouts & logic | `docs/reference_docs/paginas.md` |
| Backend workflows | `docs/reference_docs/backend-workflows.md` |
| Master Bubble export | `docs/reference_docs/blurapps-41815--2--documentacao-completa-2026-03-04.md` |
