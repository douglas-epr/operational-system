# Architecture — Blur Studio Internal Tools

Last updated: 2026-05-01

---

## Table of Contents

- [System Overview](#system-overview)
- [Request Lifecycle](#request-lifecycle)
- [Authentication & Authorization](#authentication--authorization)
- [Database Architecture](#database-architecture)
- [Feature Architecture by Domain](#feature-architecture-by-domain)
- [AI Subsystem](#ai-subsystem)
- [Real-time & Polling](#real-time--polling)
- [Frontend Patterns](#frontend-patterns)
- [File & Storage](#file--storage)
- [Directory Map](#directory-map)
- [Key Data Flows](#key-data-flows)

---

## System Overview

```
Browser
  │
  ├─→ Vercel Edge (proxy.ts)          # Session refresh + referrer clamping
  │
  ├─→ Next.js App Router (RSC)        # Server components + server actions
  │         │
  │         ├─→ Supabase JS (server)  # Row-scoped queries via anon key
  │         └─→ Supabase JS (service) # Elevated reads (AI config, agency keys)
  │
  └─→ Supabase                        # PostgreSQL 15 + Auth + Storage
            ├─→ RLS policies          # Row-level security on every table
            └─→ Storage buckets       # File attachments, avatars
```

**No separate backend.** All server logic runs as Next.js Server Actions or Server Components. There is no standalone API layer.

---

## Request Lifecycle

### 1. Edge / Middleware (`src/proxy.ts`)

Every HTTP request passes through the Next.js proxy before reaching any page:

1. Calls `supabase.auth.getUser()` to refresh the session cookie — required by Supabase SSR.
2. Redirects unauthenticated requests to `/signin` (except `/signin`, `/reset_pw`, `/_next/*`, `/api/*`).
3. Redirects already-authenticated requests from `/signin` to `/projects`.
4. **Clamps `referrer` users** to `REFERRER_ALLOW_PREFIXES` — any other path redirects to `/recommended-projects`.

### 2. Server Component (page.tsx)

Every gated page calls `requirePageAccess(allowedRoles)` at the top of the server component:

```typescript
const { supabase, userId, role } = await requirePageAccess(["admin", "manager"]);
```

This single call handles unauthenticated → `/signin` and wrong-role → role fallback page, then returns a ready-to-use Supabase client.

### 3. Data Fetching

Server components fetch all initial data in parallel using `Promise.all`. Data is passed as props to client components. Client components never call Supabase directly for initial render — they receive data from the server.

### 4. Mutations (Server Actions)

All mutations run in `"use server"` action files (`actions.ts`). Actions:
1. Call `supabase.auth.getUser()` — never trust client-provided IDs
2. Execute the mutation
3. Call `revalidatePath()` to invalidate the server component's cache
4. Return `{ error?: string }` — never throw

### 5. Background Polling

Some client components (chat lists, kanban wrappers) poll via `setInterval` on a Server Action. The `hasFetched` ref pattern ensures the loading spinner shows only on the **first** fetch — background polls are silent.

---

## Authentication & Authorization

### Three-layer security model

| Layer | File | Responsibility |
|---|---|---|
| **Edge middleware** | `src/proxy.ts` | Session refresh, public-route guard, referrer clamp |
| **Page gate** | `src/lib/auth/page-gate.ts` | Role allowlist/blocklist per page, role-based redirect |
| **Database RLS** | `supabase/migrations/` | Row-level visibility per table per operation |

No two layers duplicate the same check — each layer has a distinct job. RLS is the last and hardest boundary: even if middleware or page-gate logic has a bug, the database will not return unauthorised data.

### Role → Home page mapping (`ROLE_FALLBACK`)

```
admin        → /dashboard
manager      → /dashboard
operational  → /internal-projects
developer    → /projects
client       → /projects
qa           → /projects
referrer     → /recommended-projects
lead         → /sandbox-planner
```

### RLS helper functions

Defined in the initial schema migration and usable in all policies:

```sql
public.get_user_type()        -- RETURNS TEXT — current user's profiles.type
public.is_admin_or_manager()  -- RETURNS BOOLEAN
public.is_operational_user()  -- RETURNS BOOLEAN
auth.uid()                    -- RETURNS UUID — Supabase built-in
```

### Standard three-tier RLS model

Used on most project-scoped tables (`idea_styles`, `idea_icp`, `idea_block_*`, etc.):

```
Tier 1 — Admin/manager: FOR ALL USING (is_admin_or_manager())
Tier 2 — Creator:       FOR ALL USING/WITH CHECK (created_by = auth.uid())
Tier 3 — Project member: FOR SELECT USING (auth.uid() = ANY(project.authorized_users))
```

### project_task specific RLS

The `project_task` table has an expanded model to support self-service by clients and QA:

- `developer` → INSERT/UPDATE/DELETE any task in `project.authorized_users` projects
- `client` → INSERT/UPDATE `type = 'client_requests'`; DELETE only own (`created_by = auth.uid()`)
- `qa` → INSERT/UPDATE `type = 'qa_requests'`; DELETE only own
- INSERT always enforces `created_by = auth.uid()` in `WITH CHECK`

---

## Database Architecture

### Migration strategy

- 45+ migrations in `supabase/migrations/`, named `YYYYMMDDNNNNNN_description.sql`
- **Append-only** — existing migration files are never edited
- Each migration ends with `NOTIFY pgrst, 'reload schema';` to hot-reload PostgREST

### Core tables

| Table | Purpose |
|---|---|
| `profiles` | One row per auth user — extends Supabase `auth.users` with `type`, `first_name`, `last_name`, `picture`, `signature`, etc. |
| `project` | Client projects. `authorized_users: UUID[]` controls membership |
| `project_task` | All task types (`developer_tasks`, `client_requests`, `qa_requests`, `stages_checking`, `internal_checklist`). Hierarchical via `parent_task_id`, level 1–4 |
| `project_task_comment` | Task comments with `viewed_by: UUID[]` for unread tracking |
| `idea` | Sandbox planner ideas. `created_by` links to creator, `project_id` optionally links to a project |
| `idea_styles` | Design system per idea — legacy rich-text fields + 13 structured JSONB/TEXT columns |
| `prompt` | AI prompt templates editable by admins |
| `agency` | Single-row agency config |
| `agency_ai_settings` | Agency-level AI provider keys (read via service-role only) |
| `user_ai_settings` | Per-user AI provider keys and model overrides |
| `feedback` | Feedback entries; visibility scoped by `get_user_type()` |
| `internal_project` | Internal company projects |
| `talent` | Talent pool entries with skills, levels, and share tokens |

### Key JSONB columns

| Table.Column | TypeScript Type | Structure |
|---|---|---|
| `idea_styles.color_tokens` | `ColorToken[]` | `{name, hex, role, shades: [{hex, label}]}` |
| `idea_styles.typography` | `TypographySystem` | `{heading_font, body_font, mono_font, scale: [{name, size_px, weight, line_height}]}` |
| `idea_styles.spacing` | `SpacingSystem` | `{unit_px, scale: number[]}` |
| `idea_styles.border_radius` | `BorderRadiusSystem` | `{sm, md, lg, xl, full}` |
| `idea_styles.shadows` | `ShadowToken[]` | `{name, css_value, usage}` |

### Enums (PostgreSQL `os_*` types)

| Enum | Values |
|---|---|
| `os_user_type` | admin, manager, operational, developer, client, qa, referrer, lead |
| `os_task_type` | internal_checklist, stages_checking, developer_tasks, client_requests, qa_requests |
| `os_task_status` | not_started, in_progress, ready_for_qa, done, blocked |
| `os_project_status` | prospecting, not_started, in_progress, done, blocked, archived, lost_deal |
| `os_idea_block` | ideas, structure_align, refining_icp, product_definition_flows, benchmarking, strategic_frameworks, prd, database, visual_styles, milestones_and_tasks, report |

---

## Feature Architecture by Domain

### Projects

```
/projects
  page.tsx (RSC)
    → requirePageAccess([...all roles...])
    → Promise.all([project, tasks, unreadComments])
    → <ProjectDetail>  (client component)
        → <TabMenu> (stages | developer | client_requests | qa_requests)
        → <StagesChecking>
        → <DeveloperTasks>
        → <TasksKanban type="client_requests">
        → <TasksKanban type="qa_requests">
  actions.ts
    → createTask, updateTask, deleteTask, createProject, ...
```

- `project.authorized_users: UUID[]` is the membership list
- Tasks are fetched flat and hydrated with `task_assignees` via a separate profiles query
- Unread comment count: `project_task_comment` rows not in `viewed_by` per task
- Tab badges: blue = actionable count (not_started / ready_for_qa); red = unread comment count

### Chat

```
/chat
  page.tsx (RSC)
    → <ChatShell> (client component)
        → <ConversationsSidebar>     # Per-block refresh tick state
            → <ProjectsList>         # hasFetched ref pattern
            → <InternalProjectsList>
            → <PrivateList>
        → <ConversationPane>
            → <TabMenu>              # tabBlueBadge + tabRedBadge props
            → <MessageList>
            → <MessageComposer>
            → <ClientRequestsTab>    # onCounts callback → ConversationPane
            → <QARequestsTab>        # onCounts callback → ConversationPane
            → <ThreadPanel>
```

- 5 conversation blocks: `projects`, `projects_internal`, `internal_projects`, `private`, `chatbot`
- Per-block refresh ticks avoid re-fetching all lists on conversation select
- Tab badge counts flow: `TaskRequestsKanbanWrapper`/`QARequestsTab` → `onCounts(blue, red)` → `ConversationPane` state → `TabMenu` props

### Sandbox Planner

```
/sandbox-planner
  page.tsx (RSC)
    → <SandboxPlannerShell> (client component)
        → <IdeasGrid>
        → <StructureAlignStep>
        → <RefiningIcpStep>
        → <ProductDefinitionStep>
        → <BenchmarkingStep>
        → <StrategicFrameworksStep>
        → <PrdStep>
        → <DatabaseStep>
        → <VisualStylesStep>        # 6-section design system UI
        → <MilestonesAndTasksStep>
        → <ReportStep>
  actions.ts
    → triggerAiGeneration(ideaId, step)
    → generateVisualStylesContent()
    → saveStyles(), saveStructureAlign(), ...
```

AI generation flow:
1. Set `idea.current_blocks_updating = step`
2. Record `requestId = crypto.randomUUID()` in `idea.current_ai_request_id`
3. Build prompt from DB template (or fallback constant)
4. Call `generateAiJsonResponse<T>()` — dispatches to OpenAI / Gemini / Claude based on `resolveAiConfig`
5. Before each DB write, call `isRequestActive(supabase, ideaId, requestId)` — skip if a newer request has taken over
6. Write to the `idea_*` sub-table
7. Clear `current_blocks_updating`

### Dashboard

```
/dashboard?view=...
  → DashboardOverview (root)    -- KPI strip + recharts
  → KeyResultsView              -- key results grid
  → ProjectsView                -- project cards
  → InternalProjectsView        -- internal project cards
```

All data fetched in `loadAllDashboardMetrics()` — a single server-side call that returns KPIs, OKRs, projects, and time metrics in one round-trip.

---

## AI Subsystem

### Provider dispatch (`src/lib/api/ai-dispatcher.ts`)

```
generateAiJsonResponse<T>({ service, apiKey, model, prompt })
  ├─→ callOpenAI()    (src/lib/api/openai.ts)
  ├─→ callGemini()    (src/lib/api/gemini.ts)
  └─→ callClaude()    (src/lib/api/claude.ts)
```

All three functions return `ConvertResult<T>` with `{ data?, returned_an_error, error? }`.

### Config resolution (`src/lib/api/ai-config.ts`)

```
resolveAiConfig(supabase, userId)
  1. Read user_ai_settings + profiles.type
  2. referrer/lead → personal config only (no agency, no env fallback)
  3. Other roles:
     a. use_agency_settings=false + personal keys present → personal
     b. Agency keys (service-role read) → agency config
     c. OPENAI_API_KEY env → env fallback
     d. null → no AI available
```

### Prompt management

- DB table `prompt` stores templates by `block` slug and `type`
- Admins edit prompts at `/prompts`
- Each action file has a hardcoded `FALLBACK_*` constant used when no DB prompt exists
- Prompts use `{{variable}}` placeholders replaced by `renderPrompt(template, vars)`

---

## Real-time & Polling

The app does not use Supabase Realtime subscriptions. Instead, it uses **interval polling** via `setInterval` in client components:

| Component | Poll interval | Pattern |
|---|---|---|
| Chat list (`ProjectsList`, etc.) | 30s | Per-block refresh tick; `hasFetched` ref for silent refresh |
| Task kanban wrappers (chat) | 2s | `hasFetched` ref; emit `onCounts(blue, red)` after each load |
| Conversation mark-viewed | On select | Bumps only the active block's tick (not all blocks) |

**Per-block refresh tick pattern** (prevents over-fetching in chat):

```typescript
const [refreshTickByBlock, setRefreshTickByBlock] = useState<Record<ChatBlock, number>>({ ... });

// On conversation select: only bump the active block
setRefreshTickByBlock(prev => ({ ...prev, [activeBlock]: prev[activeBlock] + 1 }));

// On timer: bump all blocks
setRefreshTickByBlock(prev => ({
  projects: prev.projects + 1,
  // ...all blocks
}));
```

**`hasFetched` ref pattern** (prevents loading flash on poll):

```typescript
const hasFetched = useRef(false);
useEffect(() => {
  if (!hasFetched.current) setLoading(true);  // only show spinner once
  void fetchData().then(data => {
    hasFetched.current = true;
    setData(data);
    setLoading(false);
  });
}, [refreshTick]);
```

---

## Frontend Patterns

### Component types

| Type | Location | Characteristics |
|---|---|---|
| **Page RSC** | `app/feature/page.tsx` | Server-only, no hooks, fetches data, gates access |
| **Shell / orchestrator** | `_components/FeatureShell.tsx` | `"use client"`, manages local UI state, receives data as props |
| **Leaf / display** | `_components/FeatureCard.tsx` | Stateless or minimal state, purely presentational |
| **Modal** | `_components/modals/FeatureModal.tsx` | `"use client"`, controlled open/close from parent |
| **Server action** | `actions.ts` | `"use server"`, always co-located with its feature page |

### Data flow

```
RSC page.tsx → fetches all initial data
     ↓
Client Shell (props) → holds UI state (activeTab, modal open, etc.)
     ↓
Leaf components (props) → display only
     ↓
User action → calls Server Action → revalidatePath → RSC re-renders
```

### Optimistic updates (kanban drag-and-drop)

In `TasksKanban.tsx`, drag-and-drop uses optimistic local state:

```typescript
setLocalTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
startTransition(async () => {
  await updateTask(taskId, { status: newStatus });
  router.refresh();  // sync server state
});
```

### Badge count flow (Projects + Chat)

```
TasksKanban / TaskRequestsKanbanWrapper
  → computes (blue: actionable count, red: unread comment count)
  → calls onCounts(blue, red)
        ↓
ConversationPane / ProjectDetail
  → tabBlueBadge state, tabRedBadge state
        ↓
TabMenu
  → renders blue badge (top-right, absolute) + red badge (below label, flex-col)
```

---

## File & Storage

Supabase Storage is used for:
- Task comment attachments (uploaded via the chat comment composer)
- User profile pictures
- Talent profile pictures
- Document files (project docs tabs)

File URLs are stored as `TEXT` in the relevant tables. The Supabase Storage bucket policies mirror the table RLS — only authorized users can access files for their projects.

---

## Directory Map

```
src/
├── app/
│   ├── [feature]/
│   │   ├── page.tsx            # RSC — data fetch + access gate
│   │   ├── actions.ts          # "use server" mutations
│   │   ├── _components/        # Client UI for this feature
│   │   │   ├── FeatureShell.tsx
│   │   │   ├── tabs/           # Tab content components
│   │   │   └── modals/         # Modal components
│   │   ├── _hooks/             # Custom React hooks (feature-specific)
│   │   └── _lib/               # Feature-specific utilities / queries
│   └── layout.tsx              # Root layout (font loading, toast provider)
├── components/
│   ├── layout/
│   │   ├── PageShell.tsx       # Sidebar + main wrapper (used by every page)
│   │   ├── PageHeader.tsx      # Standardised page title bar
│   │   └── Sidebar.tsx         # Navigation + user menu
│   └── ui/
│       ├── icons.tsx            # All SVG icons as named exports
│       └── ...                  # Shared primitives
├── lib/
│   ├── api/
│   │   ├── ai-config.ts        # resolveAiConfig — provider resolution
│   │   ├── ai-dispatcher.ts    # generateAiJsonResponse — routes to provider
│   │   ├── claude.ts           # Anthropic Claude API client
│   │   ├── gemini.ts           # Google Gemini API client
│   │   ├── openai.ts           # OpenAI API client
│   │   ├── json-converters.ts  # Output type interfaces + parseJson helpers
│   │   └── brevo.ts            # Transactional email via Brevo
│   ├── auth/
│   │   └── page-gate.ts        # requirePageAccess + ROLE_FALLBACK
│   ├── data/
│   │   └── ideaPicker.ts       # Shared idea data fetchers
│   └── supabase/
│       ├── client.ts           # Browser Supabase client
│       ├── server.ts           # Server Supabase client (+ service client)
│       └── types.ts            # Generated + manually maintained DB types
├── types/
│   ├── projects.ts             # Task, Project, UserType, TabKey, ...
│   ├── chat.ts                 # ChatBlock, ChatTab, conversation types
│   ├── sandbox-planner.ts      # IdeaBlock, IdeaStyles, design token interfaces
│   ├── settings.ts             # AiService
│   ├── feedback.ts
│   ├── leads.ts
│   ├── talent.ts
│   └── ...
└── proxy.ts                    # Next.js 16 session middleware
```

---

## Key Data Flows

### Creating a task (client user)

```
1. Client clicks "Add task" in client_requests kanban
2. TaskModal submits → calls createTask(data) server action
3. createTask:
   a. supabase.auth.getUser() → user.id
   b. supabase.from("project_task").insert({ ...data, created_by: user.id })
   c. RLS policy "task: client insert" checks:
      - get_user_type() = 'client'
      - type = 'client_requests'
      - created_by = auth.uid()
      - EXISTS (project.authorized_users includes auth.uid())
   d. revalidatePath("/projects")
4. RSC re-fetches tasks → UI updates
```

### AI generation (Sandbox Planner step)

```
1. User clicks "Generate" on a step
2. triggerAiGeneration(ideaId, "visual_styles") is called
3. Action:
   a. requestId = crypto.randomUUID()
   b. Update idea: current_blocks_updating = "visual_styles", current_ai_request_id = requestId
   c. Load prompt from DB (or fallback constant)
   d. resolveAiConfig(supabase, userId) → { service, apiKey, model }
   e. generateAiJsonResponse<VisualStylesOutput>({ ...aiConfig, prompt })
   f. isRequestActive(supabase, ideaId, requestId) — bail if newer request took over
   g. Upsert idea_styles with all new fields
   h. Clear current_blocks_updating = null
4. Client component sees isAiWorking = false → renders VisualStylesStep
```

### Unread comment badge computation

```
Server (page.tsx):
  project_task_comment rows
    .where(created_by ≠ currentUserId)
    .map(row → row not in row.viewed_by → increment unreadByTaskId[row.task_id])

Client (ProjectDetail.tsx):
  clientUnread = tasks.filter(client_requests).sum(unreadByTaskId[t.id])
  qaUnread     = tasks.filter(qa_requests).sum(unreadByTaskId[t.id])

  → passed as tabRedBadge to tab buttons
  → shown as red bubble below tab label text
```
