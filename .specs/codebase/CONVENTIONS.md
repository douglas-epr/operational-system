# CONVENTIONS

_Brownfield analysis — 2026-06-21. Enforced rules in root `RULES.md`._

## Naming

| Object | Convention | Example |
|---|---|---|
| Migration file | `YYYYMMDDHHMMSS_description.sql` | `20260626000000_rename_work_feedback_and_invoice_fields.sql` |
| Table | `snake_case`, singular | `project_task`, `idea_styles`, `mkt_validation` |
| Column | `snake_case` | `created_by`, `authorized_users` |
| Enum | `os_` (operational) / `mkt_` (marketing) prefix | `os_task_type`, `mkt_channel` |
| RLS policy | `"table: actor action"` | `"task: client insert"` |
| RLS helper | `public.verb_noun()` | `public.is_admin_or_manager()` |
| TS interface/type/component | `PascalCase` | `IdeaReport`, `PageShell` |
| Variable/function | `camelCase` | `resolveAiConfig` |
| Hook | `use` prefix | `useRegenerate` |
| Constant | `UPPER_SNAKE_CASE` | `ROLE_FALLBACK`, `FALLBACK_PRD` |

## File organisation

- **Co-location**: each feature lives under `src/app/<feature>/` with `page.tsx` (RSC),
  `actions.ts` (`"use server"`), and `_components/` (client UI). No central god actions file.
- Shared types in `src/types/<feature>.ts`; shared fetchers in `src/lib/data/`;
  domain logic in `src/lib/<domain>/`; external clients in `src/lib/api/`.
- Prefer many small files (200–400 lines; 800 max).

## TypeScript

- `strict` mode. No `any` — use `unknown` + narrowing. Avoid `as` assertions to silence errors.
- Mirror DB enums as `const` objects, not the TS `enum` keyword.
- Feature interfaces must stay in sync with `src/lib/supabase/types.ts` and the actual select columns.

## Server Actions

- Always `supabase.auth.getUser()` — never trust client IDs.
- Always set `created_by: user.id` on insert when the column exists.
- Return `{ error?: string }` — never throw. Callers surface errors via toast/inline.
- `revalidatePath()` after every mutation. Never mutate from client components.

## RLS

- Enable on every table. Standard three-tier model: admin/manager all · creator all · project-member read.
- Use helper functions in policies; never use raw role strings as the primary gate.
- Column-level secrets (e.g. `profiles.signature`) — never `SELECT *`; select only needed columns.

## UI

- Always wrap pages in `PageShell` + `PageHeader`. Never one-off layouts.
- Design-token classes only (`bg-surface`, `text-text-primary`, `border-border`, `text-accent`) — no raw hex in JSX.
- Icons from `@/components/ui/icons` — never inline `<svg>`.
- Rich text via the shared TipTap editor — never raw `contentEditable`/`dangerouslySetInnerHTML` for user content.
- Sanitise AI/user HTML (DOMPurify; strip script/iframe/on*/js:/data:) both at write and before PDF render.

## AI

- Always `resolveAiConfig` — never hardcode keys/models.
- Guard multi-step generation with `isRequestActive` before every write **and** check the write error.
- Pass `maxTokens: 16384` for multi-field rich-HTML steps.
- DB prompt is the ceiling, the `FALLBACK_*` constant is the floor.
