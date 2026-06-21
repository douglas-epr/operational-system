# Architecture — Move37 Operational System

Last updated: 2026-06-21

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
4. **Clamps `referrer` users** to `REFERRER_ALLOW_PREFIXES` (`/projects`, `/feedback`, `/profile`, `/signin`, `/reset_pw`, `/auth`, `/api`) — any other path redirects to `/projects`.
5. Leaves the public `/m/[slug]` landing zone open so anonymous prospects can load published landing pages.

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
referrer     → /projects
lead         → /ideas-refiner
```

### RLS helper functions

Defined in the baseline schema migration and usable in all policies:

```sql
public.get_user_type()        -- TEXT  — current user's profiles.type
public.is_admin_or_manager()  -- BOOL  — admin | manager
public.is_staff_role()        -- BOOL  — admin | manager | operational
public.is_operational_user()  -- BOOL  — developer | client | qa (project-member tier; name is historical)
auth.uid()                    -- UUID  — Supabase built-in
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

- 28 migrations in `supabase/migrations/`, from `20260101000000_production_baseline.sql` onward, named `YYYYMMDDNNNNNN_description.sql`
- **Append-only** — existing migration files are never edited
- Migrations are idempotent (`IF NOT EXISTS` guards) and end with `NOTIFY pgrst, 'reload schema';` to hot-reload PostgREST
- The local dev stack runs Supabase at `127.0.0.1:54321`; apply with `npm run db:reset` / `supabase migration up`

### Core tables (by domain)

**Projects & internal**

| Table | Purpose |
|---|---|
| `profiles` | One row per auth user — `type`, `first_name`, `last_name`, `picture`, `signature`, etc. |
| `project` | Client projects. `authorized_users: UUID[]` controls membership |
| `project_task` | All task types (`developer_tasks`, `client_requests`, `qa_requests`, `stages_checking`, `internal_checklist`). Hierarchical via `parent_task_id`, level 1–4 |
| `project_task_comment` | Task comments with `viewed_by: UUID[]` for unread tracking |
| `project_file` / `project_link` / `project_video` | Project resources (each has a `description`) |
| `project_work_feedback` | Work-period feedback (renamed from `project_daily_feedback`); `start_date`, `end_date`, `total_time`, `emails[]` |
| `internal_project` + `internal_project_*` | Internal company projects, assignees, resources, work-feedback |
| `invoice` | Invoices: `currency`, `account_details`, work period, `total_time`, `emails[]` |

**Ideas Refiner** (`idea` + 17 sub-tables)

| Table | Purpose |
|---|---|
| `idea` | Refiner ideas; `created_by`, `authorized_users: UUID[]`, optional `project_id` |
| `idea_structure_and_align`, `idea_icp`, `idea_product_definition_and_flows` | Discovery steps |
| `idea_location_legislation`, `idea_market_opportunity` | Regulatory + TAM/SAM/SOM & unit economics |
| `idea_benchmarking`, `idea_risk_and_validation` | Competitor analysis + risk register / demand evidence / debate |
| `idea_report` | Go/no-go report: scores, alignment, debate, Build Brief HTML |
| `idea_prd`, `idea_database`, `idea_styles`, `idea_milestones_and_tasks` | Build-phase artifacts |
| `idea_chatbot`, `idea_chatbot_devil_advocate` | Per-idea chatbots |
| `idea_playbook_version` (+ comments) | Build playbook versioning |

**Marketing Validation Engine** (`mkt_*`, ~17 tables)

| Table | Purpose |
|---|---|
| `mkt_validation` | Per-idea funnel mode, status, decision contract, positioning, booking URL |
| `mkt_prospect`, `mkt_source_run` | Sourced leads + Apify run state |
| `mkt_campaign`, `mkt_sequence_step`, `mkt_outreach`, `mkt_suppression` | Email outreach engine |
| `mkt_content`, `mkt_landing` | Scheduled social content + landing page config |
| `mkt_signal`, `mkt_event` | Captured demand signals + page events |
| `mkt_interview`, `mkt_ad_campaign`, `mkt_decision_log`, `mkt_research_cache` | Interview intelligence, paid traffic, decisions |
| `mkt_seo_keyword`, `mkt_seo_rank_history` | SEO keyword rank tracking |

**Shared / AI**

| Table | Purpose |
|---|---|
| `prompt` | AI prompt templates editable by admins/managers |
| `user_ai_settings` | Per-user AI provider keys and model overrides |
| `agency` | Single-row agency config (its AI half — `agency_ai_settings` — was dropped 2026-06-14) |
| `feedback` | Feedback wall entries; visibility scoped by `get_user_type()` |
| `sop` / `sop_version` | Documents / SOPs with versioning |

> **Dropped 2026-06-14:** `talent*`, `client`, `company`, and related enums (the talent-pool / leads / recommended-projects features were removed).

### Key JSONB columns

| Table.Column | TypeScript Type | Structure |
|---|---|---|
| `idea_styles.color_tokens` | `ColorToken[]` | `{name, hex, role, shades: [{hex, label}]}` |
| `idea_styles.typography` | `TypographySystem` | `{heading_font, body_font, mono_font, scale: [{name, size_px, weight, line_height}]}` |
| `idea_styles.spacing` | `SpacingSystem` | `{unit_px, scale: number[]}` |
| `idea_styles.border_radius` | `BorderRadiusSystem` | `{sm, md, lg, xl, full}` |
| `idea_styles.shadows` | `ShadowToken[]` | `{name, css_value, usage}` |

### Enums (`os_*` operational, `mkt_*` marketing)

| Enum | Values |
|---|---|
| `os_user_type` | admin, manager, operational, developer, client, qa, referrer, lead |
| `os_task_type` | internal_checklist, stages_checking, developer_tasks, client_requests, qa_requests |
| `os_task_status` | not_started, in_progress, ready_for_qa, done, blocked |
| `os_project_status` | prospecting, not_started, in_progress, done, blocked, archived, lost_deal |
| `os_ai_service` | gemini, claude, openai |
| `os_idea_block` | ideas, structure_align, refining_icp, product_definition_flows, location_legislation, market_opportunity, benchmarking, strategic_frameworks, risk_and_validation, report, prd, database, visual_styles, milestones_and_tasks, playbook |
| `mkt_funnel_mode` | b2b_outreach, consumer_capture, hybrid |
| `mkt_validation_status` | validating, killed, doubling_down |
| `mkt_channel` | email, linkedin, google_maps, instagram, facebook, reddit, x, social_discovery |
| `mkt_signal_type` | quiz, waitlist, preorder |
| `mkt_outreach_status` | queued, sent, opened, replied, bounced, unsub |
| `mkt_content_status` | draft, scheduled, posted, failed |

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

### Ideas Refiner

The canonical step order lives in `IDEA_BLOCKS_ORDERED` (`src/types/idea-refiner.ts`) — 15 steps:

```
1  Ideas                        9  Risk & Validation (Devil's-Advocate debate)
2  Structure & Align           10  Report  ← go/no-go gate (before any build step)
3  Refining ICP                11  PRD
4  Product Definition & Flows  12  Database
5  Location & Legislation      13  Design System (visual_styles)
6  Market Opportunity          14  Project Milestones & Tasks
7  Benchmarking                15  Playbook
8  Strategic Frameworks
```

```
/ideas-refiner
  page.tsx (RSC)
    → <IdeasRefinerShell> (client component)
        → <IdeasGrid> + one step component per block above
        → idea chatbot + Devil's-Advocate chatbot panels
  actions.ts
    → triggerAiGeneration(ideaId, step) / generate<Step>Content()
    → save<Step>(), buildProjectFromIdea()
```

**Report is a pre-build gate** (step 10, before PRD/Database/Visual/Milestones). It scores ONLY discovery evidence (steps 1–9) via a two-gate Skeptic↔Advocate debate, then a Reframer + Scorer synthesis. Verdict buckets: `build` (≥75) | `refine` (≥60) | `kill` (<60). It also emits a 10-section investor-grade **Build Brief**.

AI generation flow (every step):
1. Set `idea.current_blocks_updating = step` and `current_ai_request_id = crypto.randomUUID()`
2. Build prompt from DB `prompt` row (or the action's `FALLBACK_*` constant)
3. `generateAiJsonResponse<T>()` / `generateAiTextResponse()` — dispatches to OpenAI / Gemini / Claude via `resolveAiConfig`. Multi-field rich-HTML steps pass `maxTokens: 16384`
4. Before each DB write, call `isRequestActive(supabase, ideaId, requestId)` — skip if a newer request superseded this one (and always check the write `error`)
5. Write to the `idea_*` sub-table; clear `current_blocks_updating`
6. The client overlay clears via a Realtime update on the `idea` row (or a stuck-timer fallback)

### Marketing Validation Engine

A greenfield demand-validation pipeline attached to any `idea` (not a Bubble port). Admin/manager only; the public capture zone is anonymous.

```
/marketing                      → portfolio of ideas with validation + funnel rollup
/marketing/[ideaId]             → per-idea dashboard (funnel + decision contract)
/marketing/[ideaId]/positioning → brand DNA, decision contract, funnel mode
                /sourcing       → Apify runs → mkt_prospect (Google Maps / B2B / social discovery)
                /outreach       → Brevo email sequences (+ /[campaignId] editor)
                /interviews     → Mom-Test interview analysis + synthesis
                /content        → Buffer/Postiz multi-channel scheduler
                /landing        → HTML landing builder → publishes to /m/[slug]
                /signals        → weighted demand scoring, ICP split, Wilson-CI conversion
                /traffic        → ad campaigns (UTM) + SEO keyword rank tracker

/m/[slug]                       → public SSR landing (service-role); CaptureForm + ViewBeacon
/api/m/*, /api/webhooks/*, /api/mkt/cron/*  → capture, brevo/cal.com/tally webhooks, cron workers
```

Background workers (`/api/mkt/cron/*`, guarded by `CRON_SECRET`) process due outreach steps and publish scheduled content. Public landing reads/writes use the **service-role** client server-side — no anon RLS is exposed.

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
  2. referrer/lead → personal key only (no env fallback)
  3. Other roles:
     a. Personal key present → personal config
     b. OPENAI_API_KEY / GEMINI_API_KEY env → env fallback
     c. null → no AI available
```

> There is no agency-key tier — `agency_ai_settings` was dropped on 2026-06-14. `resolveImageKeys()` follows the same personal→env order for Gemini/OpenAI image generation.

### Prompt management

- DB table `prompt` stores templates by `block` slug and `type`
- Admins edit prompts at `/prompts`
- Each action file has a hardcoded `FALLBACK_*` constant used when no DB prompt exists
- Prompts use `{{variable}}` placeholders replaced by `renderPrompt(template, vars)`

---

## Real-time & Polling

The app uses a **hybrid** model — Supabase Realtime for a few high-value signals, interval polling elsewhere:

**Realtime subscriptions**
- Emoji reactions (added to the Realtime publication in `20260618000000_emoji_realtime_publication.sql`)
- Ideas Refiner generation completion — the client overlay watches the `idea` row and clears when `current_blocks_updating` is nulled server-side (a long AI call resolves via Realtime, not a client timeout)

**Interval polling** via `setInterval` in client components:

| Component | Poll interval | Pattern |
|---|---|---|
| Chat list (`ProjectsList`, etc.) | 30s | Per-block refresh tick; `hasFetched` ref for silent refresh |
| Chat tab panels (`ProjectTabsPanel`, `InternalProjectTabsPanel`) | 2s | In-flight `loadingRef` guard (skip overlapping polls); only while tab is visible |
| Task kanban wrappers (chat) | 2s | `hasFetched` ref; emit `onCounts(blue, red)` after each load |
| Conversation mark-viewed | On select | Bumps only the active block's tick (not all blocks) |

> The 2s tab-panel polls previously fanned out 5 server actions per tick with no overlap guard, flooding the server-action queue and starving user saves (fixed 2026-06-20 with `loadingRef` + visibility gating).

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

Four public Supabase Storage buckets (created in `20260619000000_storage_buckets.sql` and `20260621000000_chat_file_storage_buckets.sql`):

| Bucket | Max size | Contents |
|---|---|---|
| `avatars` | 5 MB | User profile pictures (images only) |
| `user-signatures` | 2 MB | Digital signature images (path-scoped to `users/{userId}/*`) |
| `project-files` | 50 MB | Project / internal-project Files-tab attachments (any type) |
| `chat-attachments` | 25 MB | Inline chat message attachments (any type) |

Buckets allow public read via direct URL but require authentication for upload/update/delete. File URLs are stored as `TEXT` in the relevant tables.

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
│   │   ├── ai-config.ts        # resolveAiConfig / resolveImageKeys — provider resolution
│   │   ├── ai-dispatcher.ts    # generateAiJsonResponse / generateAiTextResponse
│   │   ├── claude.ts           # Anthropic Claude client (retry + backoff)
│   │   ├── gemini.ts           # Google Gemini client (text + image)
│   │   ├── openai.ts           # OpenAI Responses API (text + gpt-image-1)
│   │   ├── json-converters.ts  # AI output type interfaces + parse helpers
│   │   ├── brevo.ts            # Transactional/bulk email (+ attachments)
│   │   ├── apify.ts            # Lead-sourcing actors (Google Maps / B2B / social)
│   │   ├── buffer.ts           # Buffer social scheduling + analytics
│   │   ├── postiz.ts           # Postiz social scheduling
│   │   └── image-search.ts     # Pexels stock-image search
│   ├── auth/
│   │   └── page-gate.ts        # requirePageAccess + ROLE_FALLBACK
│   ├── data/
│   │   └── ideaPicker.ts       # Shared idea data fetchers
│   ├── marketing/             # Validation-engine domain logic (sourcing, outreach, public, admin)
│   ├── notifications/        # Work-feedback / invoice email builders
│   └── supabase/
│       ├── client.ts           # Browser Supabase client
│       ├── server.ts           # Server client + createServiceClient() (service-role)
│       └── types.ts            # Generated + manually maintained DB types
├── types/
│   ├── projects.ts             # Task, Project, UserType, TabKey, ...
│   ├── chat.ts                 # ChatBlock, ChatTab, conversation types
│   ├── idea-refiner.ts         # IdeaBlock (15), IdeaStyles, design token interfaces
│   ├── marketing.ts            # mkt_* enums, validation/contract/funnel types
│   ├── docs.ts                 # Invoice, PlaybookVersion, ProjectFile/Link/Video
│   ├── internal-projects.ts    # InternalProject, InternalTask, time tracking
│   ├── okrs.ts · sops.ts · feedback.ts · settings.ts
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

### AI generation (Ideas Refiner step)

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
