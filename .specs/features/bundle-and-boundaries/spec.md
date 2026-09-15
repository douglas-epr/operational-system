# Spec: Bundle & Boundaries — lazy heavy clients, route-segment states, build hygiene

Status: implemented 2026-09-15 (local only; production apply and deploy pending)

Source: approved plan `1-please-update-all-wondrous-pixel.md`, Phase 4b "Performance — P1" (items P7–P10).

## Objective

Two large client libraries are statically imported into first-load JavaScript across most of the app:
TipTap (16 client files, including both chat tab panels and every Ideas Refiner step that edits rich
text) and Recharts (3 dashboard components). Both are only needed once a user actually opens an editor
or a chart, so they belong behind `next/dynamic`. Separately the App Router has **no** boundary files at
all — zero `loading.tsx`, `error.tsx`, `global-error.tsx`, `not-found.tsx` and zero `Suspense` — so a slow
Ideas Refiner or chat segment shows a blank screen and an unhandled server error shows Next's default
page rather than the Move37 shell. Finally `next.config.ts` ships `console.*` to production and
`@types/dompurify` (a deprecated stub, DOMPurify has shipped its own types since v3) sits in production
dependencies.

Success = TipTap and Recharts out of the initial chunk for every route that does not render them
immediately, a Move37-styled loading/error/404 state at the app root and on the four heaviest segments,
`console.*` stripped in production except `console.error`, and the dead type stub gone — with first-load
JS measured before and after from the `next build` route table.

## Evidence

| # | Finding | Evidence (file:line) |
|---|---|---|
| P7a | TipTap editor statically imported in **16** client files | `src/app/ideas-refiner/_components/*Step.tsx`, `src/app/projects/_components/ProjectModal.tsx`, `src/app/projects/_components/TaskModal.tsx`, `src/app/prompts/_components/PromptsShell.tsx`, `src/app/chat/_components/ProjectTabsPanel.tsx`, `src/app/chat/_components/InternalProjectTabsPanel.tsx` |
| P7b | Recharts statically imported in `DashboardOverview` | `src/app/dashboard/_components/DashboardOverview.tsx:47` |
| P7c | Recharts statically imported in `BlendedIntelligence` | `src/app/dashboard/_components/BlendedIntelligence.tsx:11` |
| P7d | Recharts statically imported in `DashboardCharts` | `src/app/dashboard/_components/DashboardCharts.tsx:16` |
| P8a | Zero `loading.tsx` in the app tree | `find src/app -name loading.tsx` → 0 results |
| P8b | Zero `error.tsx` in the app tree | `find src/app -name error.tsx` → 0 results |
| P8c | Zero `global-error.tsx` | `find src/app -name global-error.tsx` → 0 results |
| P8d | Zero `not-found.tsx` | `find src/app -name not-found.tsx` → 0 results |
| P8e | Zero `Suspense` boundaries anywhere in `src/` | `grep -rn "Suspense" src` → 0 results |
| P9a | `next.config.ts` has no `compiler.removeConsole`, so `console.*` ships to production | `next.config.ts` (no `compiler` key) |
| P9b | `next.config.ts` has no `images` configuration | `next.config.ts` (no `images` key) |
| P10 | `@types/dompurify ^3.0.5` is in **production** `dependencies` and is a deprecated stub (DOMPurify ≥ 3 ships its own types) | `package.json` `dependencies` |

## Stories

### P0 — Lazy-load the TipTap editor (P7a)

As a user opening any page that *might* contain a rich-text editor, I want TipTap downloaded only when an
editor actually mounts, so the first load of Projects, Chat, Prompts and Ideas Refiner does not carry an
editor I may never open.

**Acceptance criteria**

- AC1: A single lazy wrapper exists. `test -f src/components/editor/RichTextEditor.lazy.tsx` exits `0`.
- AC2: The wrapper uses `next/dynamic`. `grep -n "next/dynamic" src/components/editor/RichTextEditor.lazy.tsx` returns at least 1 line.
- AC3: It disables SSR (TipTap needs the DOM). The `dynamic(...)` options object contains `ssr: false`.
- AC4: It supplies a styled placeholder. The options object contains a `loading:` function, and that placeholder uses design tokens — `grep -cE "bg-surface|bg-muted|border-border" src/components/editor/RichTextEditor.lazy.tsx` returns `>= 1`.
- AC5: No component outside the wrapper imports TipTap directly. `grep -rln "@tiptap/" src --include=*.tsx | grep -v "components/editor/" | wc -l` returns `0`.
- AC6: All 16 former call sites now import the wrapper. `grep -rln "RichTextEditor.lazy\|RichTextEditor\"" src/app | wc -l` returns `>= 16`.
- AC7: TipTap leaves the shared chunk. In the `next build` route table, first-load JS for `/projects` decreases relative to the pre-change figure recorded in `.specs/evaluations/_baseline-2026-09-15.md`.
- AC8: The same holds for `/chat` — first-load JS strictly lower than baseline.
- AC9: The same holds for `/prompts` — first-load JS strictly lower than baseline.
- AC10: Editors still work — manual walk: open the Projects task modal, an Ideas Refiner step editor, the Prompts shell and a chat tab panel; type, save, reopen, and the content round-trips.
- AC11: Rich-HTML export paths are unaffected — the invoice PDF still renders (hex styles, no `oklch()`) and the PRD DOCX/PDF export still produces a file.
- AC12: Sanitization still applies to editor output (cross-check with `.specs/features/security-p0/spec.md` AC S3-1): `grep -rn "dangerouslySetInnerHTML" src | grep -vc "sanitizeHtml" | grep -v ThemeScript` remains `0`.

### P0 — Lazy-load Recharts (P7b–P7d)

As a user of any non-dashboard page, I want Recharts absent from my bundle entirely, and as a dashboard
user I want it fetched alongside the chart it draws.

**Acceptance criteria**

- AC1: Lazy chart wrappers exist under one directory. `ls src/components/charts/*.lazy.tsx | wc -l` returns `>= 1`.
- AC2: Each wrapper uses `next/dynamic` with `ssr: false`. For every file matched by AC1, `grep -c "next/dynamic" <file>` returns `>= 1` and `grep -c "ssr: false" <file>` returns `>= 1`.
- AC3: Each wrapper supplies a token-styled `loading:` placeholder sized to the chart's box, so there is no layout shift on swap.
- AC4: No component outside `src/components/charts/` imports Recharts. `grep -rln "from \"recharts\"" src | grep -v "components/charts/" | wc -l` returns `0`.
- AC5: `DashboardOverview` consumes a wrapper — `grep -n "components/charts" src/app/dashboard/_components/DashboardOverview.tsx` returns at least 1 line.
- AC6: `BlendedIntelligence` consumes a wrapper — same check on that file.
- AC7: `DashboardCharts` consumes a wrapper — same check on that file.
- AC8: `/dashboard` first-load JS decreases relative to the baseline figure.
- AC9: Recharts is not present in the shared chunk: in the `next build` output, no route other than the dashboard routes shows a first-load JS increase, and the shared chunk size decreases.
- AC10: Charts still render — manual walk of `/dashboard` shows every chart drawing with real data, axes, tooltips and legend intact.
- AC11: Chart colours still come from design tokens / hex, not raw `oklch()` (so any future html2canvas export keeps working): `grep -rc "oklch" src/components/charts | grep -vc ":0" ` returns `0`.

### P0 — App-level loading, error, global-error and not-found (P8a–P8d)

As any user, I want a Move37-shell skeleton while a route loads and a Move37-styled error or 404 page
when something goes wrong, so the app never shows a blank screen or Next's default error page.

**Acceptance criteria**

- AC1: `src/app/loading.tsx` exists. `test -f src/app/loading.tsx` exits `0`.
- AC2: `src/app/error.tsx` exists and is a client component — `head -n 1 src/app/error.tsx` contains `"use client"`.
- AC3: `src/app/error.tsx` exposes a retry affordance — it accepts the `reset` prop and calls it from a button (verified by reading).
- AC4: `src/app/global-error.tsx` exists and is a client component with its own `<html>`/`<body>` wrapper (required by Next, since it replaces the root layout).
- AC5: `src/app/not-found.tsx` exists. `test -f src/app/not-found.tsx` exits `0`.
- AC6: All four use design tokens, never raw hex. `grep -rcE "#[0-9a-fA-F]{3,6}" src/app/loading.tsx src/app/error.tsx src/app/global-error.tsx src/app/not-found.tsx | grep -vc ":0"` returns `0`.
- AC7: All four use token classes. Each of the four contains at least one of `bg-base`, `bg-surface`, `text-text-primary`, `text-text-muted`, `border-border`.
- AC8: Icons come from the shared module, never inline SVG. `grep -rc "<svg" src/app/loading.tsx src/app/error.tsx src/app/global-error.tsx src/app/not-found.tsx | grep -vc ":0"` returns `0`.
- AC9: The 404 renders. `curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/definitely-not-a-route` prints `404`, and the body contains the Move37 not-found copy (`curl -s ... | grep -ci "not found"` returns `>= 1`).
- AC10: The error boundary renders rather than crashing — temporarily throwing in one page component shows the styled error page with a working retry button (manual check; the temporary throw is removed afterwards).
- AC11: No secret or stack trace leaks into the error page in production mode — `npm run dev:prod` then triggering the boundary shows a generic message and `curl -s <route> | grep -ci "at Object\.\|/src/"` returns `0`.
- AC12: Error pages do **not** attempt auth. `grep -rc "requirePageAccess\|getUser" src/app/error.tsx src/app/global-error.tsx src/app/not-found.tsx | grep -vc ":0"` returns `0`.

### P1 — Segment loading states for the four heaviest routes (P8a)

As a user opening Ideas Refiner, Chat, a marketing workspace or the Dashboard, I want an immediate
skeleton for that segment, so the slowest screens in the app feel responsive.

**Acceptance criteria**

- AC1: `src/app/ideas-refiner/loading.tsx` exists.
- AC2: `src/app/chat/loading.tsx` exists.
- AC3: `src/app/marketing/[ideaId]/loading.tsx` exists.
- AC4: `src/app/dashboard/loading.tsx` exists.
- AC5: Each of the four uses design tokens only — the combined `grep -rcE "#[0-9a-fA-F]{3,6}"` over the four files returns `0` non-zero counts.
- AC6: Each of the four renders inside the app shell so the sidebar does not flash — each either renders `PageShell` or is structured to sit inside the layout that does (verified by reading).
- AC7: Each skeleton approximates the real layout (a header block plus content blocks), not a bare spinner — verified by reading; each file contains `>= 2` skeleton block elements.
- AC8: Observed behaviour: navigating to `/ideas-refiner` on a throttled connection (DevTools "Slow 4G") shows the skeleton before content, with no blank frame.
- AC9: The same holds for `/chat`, `/marketing/<ideaId>` and `/dashboard`.
- AC10: `npm run build` route table still lists all four routes with no new build warning about a missing boundary.

### P1 — Strip `console.*` from production, keep `console.error` (P9a)

As the platform owner, I want debug logging compiled out of production builds while genuine errors
survive, so the client bundle is smaller and nothing intentional is lost.

**Acceptance criteria**

- AC1: `next.config.ts` configures the compiler. `grep -n "removeConsole" next.config.ts` returns at least 1 line.
- AC2: `console.error` is excluded from removal. The same config contains `exclude: ["error"]`.
- AC3: The setting is a plain object, not gated on `NODE_ENV` in config (Next applies `removeConsole` to production builds only) — verified by reading; there is no `process.env.NODE_ENV` ternary around it.
- AC4: `npm run build` exits `0` with the setting in place.
- AC5: Dev logging is unaffected — `npm run dev` still prints `console.warn` / `console.info` from a temporarily instrumented component.
- AC6: The repo has no `console.log` to remove in the first place (already verified in the audit) — `grep -rc "console\.log" src | grep -vc ":0"` returns `0`.

### P1 — Remove the deprecated `@types/dompurify` stub (P10)

As a developer, I want no deprecated type stub in production dependencies, so `tsc` resolves DOMPurify's
own bundled types and `npm ls` stays honest.

**Acceptance criteria**

- AC1: The stub is gone from `package.json`. `node -e "const p=require('./package.json');process.exit((p.dependencies['@types/dompurify']||p.devDependencies?.['@types/dompurify'])?1:0)"` exits `0`.
- AC2: The lockfile agrees. `grep -c "@types/dompurify" package-lock.json` returns `0`.
- AC3: Types still resolve. `npx tsc --noEmit` exits `0`.
- AC4: `src/lib/sanitize.ts` type-checks against the real package types with no `@ts-ignore` / `@ts-expect-error` added. `grep -c "ts-ignore\|ts-expect-error" src/lib/sanitize.ts` returns `0`.
- AC5: This is compatible with the `isomorphic-dompurify` swap in `.specs/features/security-p0/spec.md` — after both changes, `npx tsc --noEmit` still exits `0`.

### P2 — `images` configuration, only if remote images exist (P9b)

As a developer, I want `next/image` remote patterns configured **only if** the app actually loads remote
images, so we do not add speculative configuration (YAGNI). Absence is **not** a defect.

**Acceptance criteria**

- AC1: The precondition is checked and recorded first. `grep -rn "next/image" src | wc -l` and `grep -rnE 'src=\{?"https?://' src | wc -l` are both run, and their results are written into `.specs/evaluations/`.
- AC2: If the second count is `0`, `next.config.ts` has **no** `images` key. `grep -c "images:" next.config.ts` returns `0` — and this is the correct outcome.
- AC3: If the second count is `> 0`, `next.config.ts` declares `images.remotePatterns` listing exactly the hostnames found (e.g. Pexels, Supabase Storage), with no wildcard `hostname: "**"`.
- AC4: In either branch, `npm run build` exits `0`.

## Out of scope

- Converting any server component to a client component, or vice versa, to enable lazy loading.
- Streaming the chat message list or task board with `Suspense` inside a page (this spec adds route
  **segment** boundaries only; in-page streaming is a separate feature).
- Replacing TipTap or Recharts with lighter libraries.
- Adding a bundle analyzer, Lighthouse CI, or any performance-budget enforcement in CI (the budget is
  recorded in `.specs/codebase/TESTING.md`, not enforced).
- Route-level caching / `revalidate` changes, PPR, or the Next 16 cache-components features.
- Image optimization work beyond the conditional `remotePatterns` in the P2 story.
- Removing any other dependency (`@types/dompurify` only).
- Adding `isomorphic-dompurify` — that belongs to `.specs/features/security-p0/spec.md`; this spec only
  requires the two changes stay type-compatible.
- Security headers, CSP, rate limiting → `.specs/features/security-p0/spec.md`.
- Database indexes and query shape → `.specs/features/db-indexes/spec.md`.
- Auth round-trips and polling → `.specs/features/auth-roundtrips/spec.md`.
- Pushing or deploying.

## Files touched

| File | Change |
|---|---|
| `src/components/editor/RichTextEditor.lazy.tsx` | **new** — `next/dynamic` wrapper, `ssr: false`, token-styled placeholder |
| `src/components/charts/*.lazy.tsx` | **new** — one `next/dynamic` wrapper per chart family consumed by the dashboard |
| 16 TipTap call sites | swap the static import for the lazy wrapper (`ideas-refiner/_components/*Step.tsx`, `ProjectModal`, `TaskModal`, `PromptsShell`, both chat tab panels) |
| `src/app/dashboard/_components/DashboardOverview.tsx` | consume the lazy chart wrapper |
| `src/app/dashboard/_components/BlendedIntelligence.tsx` | same |
| `src/app/dashboard/_components/DashboardCharts.tsx` | same |
| `src/app/loading.tsx` | **new** |
| `src/app/error.tsx` | **new** (client) |
| `src/app/global-error.tsx` | **new** (client, own `<html>`/`<body>`) |
| `src/app/not-found.tsx` | **new** |
| `src/app/ideas-refiner/loading.tsx` | **new** |
| `src/app/chat/loading.tsx` | **new** |
| `src/app/marketing/[ideaId]/loading.tsx` | **new** |
| `src/app/dashboard/loading.tsx` | **new** |
| `next.config.ts` | `compiler.removeConsole = { exclude: ["error"] }`; `images.remotePatterns` only if P2's precondition holds |
| `package.json` / `package-lock.json` | remove `@types/dompurify` |
| `.specs/evaluations/` | `next build` route table before/after |

## Verification

Gate (must pass, per `.specs/codebase/TESTING.md` — there is no test runner):

```bash
npm run build && npm run lint && npx tsc --noEmit
```

Per-spec checks:

```bash
# P7 — heavy libs isolated behind wrappers
grep -rln "@tiptap/" src --include=*.tsx | grep -v "components/editor/"
grep -rln 'from "recharts"' src | grep -v "components/charts/"

# P8 — boundary files present
ls src/app/loading.tsx src/app/error.tsx src/app/global-error.tsx src/app/not-found.tsx
ls src/app/ideas-refiner/loading.tsx src/app/chat/loading.tsx src/app/marketing/\[ideaId\]/loading.tsx src/app/dashboard/loading.tsx
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4000/definitely-not-a-route   # expect 404

# P8 — tokens only, no inline svg, no raw hex in the boundary files
grep -rnE "#[0-9a-fA-F]{3,6}|<svg" src/app/loading.tsx src/app/error.tsx src/app/global-error.tsx src/app/not-found.tsx

# P9 — console stripping configured
grep -n "removeConsole" -A2 next.config.ts

# P10 — stub gone
grep -c "@types/dompurify" package.json package-lock.json
```

Measurement, recorded before and after in `.specs/evaluations/`:

- `next build` route table: first-load JS per route and the shared-chunk figure. Targets: `/projects`,
  `/chat`, `/prompts`, `/dashboard`, `/ideas-refiner` all strictly lower than
  `_baseline-2026-09-15.md`; the working budget from the plan is **first-load JS < 200 KB gz** on
  `/projects` and `/chat`.
- Whether TipTap and Recharts appear in the shared chunk (before: yes; after: no).

Manual walk on a throttled connection: `/projects` (task modal editor), `/chat` (tab panel editor),
`/prompts`, `/ideas-refiner` (one step editor), `/dashboard` (all charts), plus a deliberate 404 and a
deliberate thrown error.

## Boundaries

**Always**

- Use `PageShell` / `PageHeader`; never hand-roll a sidebar or main layout in a boundary file.
- Use design-token classes (`bg-base`, `bg-surface`, `bg-elevated`, `bg-muted`, `text-text-*`,
  `border-border`, `bg-accent`); never raw hex in JSX.
- Import icons from `@/components/ui/icons`; never write inline `<svg>` in a component.
- Give every `next/dynamic` call an explicit `loading:` placeholder sized to prevent layout shift.
- Measure first-load JS from `next build` before and after, and record both in `.specs/evaluations/`.
- Remove any temporary instrumentation (deliberate throws, `console.time`) before declaring done.
- Add a `docs/changelog.md` entry at the end of the session.

**Ask first**

- Replacing or upgrading TipTap or Recharts.
- Adding in-page `Suspense` streaming (this spec is segment boundaries only).
- Adding an `images` config when no remote image source is found (YAGNI — default is to skip).
- Adding a bundle analyzer or any CI performance gate.
- Removing any dependency other than `@types/dompurify`.
- Changing `PageShell` or the token set.

**Never**

- `git commit`.
- `git push`.
- Apply a migration to **production** Supabase.
- Deploy to Vercel.

## Open questions

1. Chart wrapper granularity is **ASSUMED**: one wrapper per chart family consumed by the dashboard
   (`*.lazy.tsx`). A single barrel wrapper would be simpler but re-couples all charts into one chunk —
   confirm the preference.
2. Does any Ideas Refiner step render its editor immediately on mount (in which case `ssr: false` +
   dynamic adds a visible flash rather than a saving)? If so, that step may want eager loading; needs a
   per-step check.
3. The `< 200 KB gz` first-load budget for `/projects` and `/chat` comes from the plan. Confirm it is the
   target to hold, and whether it belongs in `.specs/codebase/TESTING.md` as a recorded (unenforced)
   budget.
4. `global-error.tsx` cannot use the app shell (it replaces the root layout). Confirm the minimal
   token-styled standalone design is acceptable, and what copy it should carry.
5. Whether remote images exist at all is unresolved until the P2 precondition grep is run — Pexels image
   search is an integration, so remote URLs may be stored and rendered via plain `<img>` rather than
   `next/image`. If they are plain `<img>`, the correct outcome is **no** `images` config.

---

## Audit corrections (2026-09-15, post-freeze)

Evidence errors found by the independent re-audit of `e96b250`. ACs left as written to keep the
pre and post grades comparable.

- **TipTap direct-import count.** Only **one** file imports `@tiptap/*` directly
  (`src/app/ideas-refiner/_components/RichTextEditor.tsx`), not 16. The 16 figure counted files
  importing the *wrapper component*, which is a different thing. The lazy-loading work was still
  correct — it moved those 15 wrapper importers behind `next/dynamic` — but the spec's framing
  overstated the dependency surface.
- **Recharts consumers.** There is an unlisted fourth consumer,
  `src/app/okrs/_components/KeyResultsTracker.tsx`. It already reaches Recharts through
  `next/dynamic` in `KeyResultModal.tsx`, so it needed no change, but it belongs in the inventory.
- **Component paths.** `BlendedIntelligence` and `DashboardCharts` live under
  `src/app/marketing/[ideaId]/`, not `src/app/dashboard/`.
- **First-load-JS acceptance criteria are unmeasurable with this toolchain.** Five ACs
  (E1-AC7, E1-AC8, E1-AC9, E2-AC8, E2-AC9) require first-load JS to be strictly lower than a
  baseline number. Next 16 with Turbopack emits no First Load JS or shared-chunk column in its
  build output, so no such baseline number exists and these five can never be scored MET as
  written. Replace them with an assertion over `.next` build-manifest chunk membership — that the
  editor and chart chunks are absent from the initial chunk list for a given route — before any
  future run tries to grade them.
- **E1-AC6 is non-discriminating**: its grep already returned 28 matches at base because the
  non-lazy `RichTextEditor` shares the name.
