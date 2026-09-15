# Design system

Move37 Operational System is token-first: every color, radius, shadow, and
type size comes from a CSS custom property defined once in
`src/app/globals.css` and registered into Tailwind v4 via `@theme inline`.
Dark and light are two value-sets for the same variables, switched by
`class="light"` / default-dark on `<html>` — never by separate component
code paths. **Never put a raw hex code, `rgb()`, or inline color style in
JSX.** Use the semantic token classes below. The one deliberate exception is
the PDF/print rasterization surfaces in [Charts, PDF & DOCX](#charts-pdf--docx).

Generated from current code — `globals.css`, `src/components/ui/*`,
`src/components/layout/*`, `src/components/theme/*`,
`src/components/editor/*` — not an external spec. For enforcement rules
(not inventory), see `RULES.md` §7 "UI & Styling" and CLAUDE.md's "UI
Patterns" section. If code and this file disagree, the code wins.

---

## Tokens

Raw CSS custom properties live on `:root` in `globals.css`, with light
overrides under `:root.light` (radius/shadow-shape/layout/animation are
theme-agnostic, not overridden). `@theme inline` re-exposes them as
Tailwind color tokens, which is what makes `bg-surface` / `text-text-primary`
resolve.

**Backgrounds**

| Class | Variable | Dark | Light | Usage |
|---|---|---|---|---|
| `bg-base` | `--bg-base` | `#0b0b0e` | `#f7f7fa` | Page background (`PageShell` main column) |
| `bg-surface` | `--bg-surface` | `#131318` | `#ffffff` | Card/panel/sidebar |
| `bg-elevated` | `--bg-elevated` | `#1a1a20` | `#ffffff` | Modal, popover, dropdown, inputs |
| `bg-sidebar` | `--bg-sidebar` | `#0d0d11` | `#f1f1f4` | Sidebar chrome |
| `bg-muted` | `--bg-muted` | `#232329` | `#ececf0` | Disabled, badges, skeleton base |
| `bg-hover` | `--bg-hover` | `#2a2a31` | `#e2e2e8` | Row/menu hover |
| `bg-overlay` | literal | `rgba(0,0,0,.6)` | same | Modal/drawer backdrop |

**Accent**

| Class | Variable | Value | Usage |
|---|---|---|---|
| `bg-accent`/`text-accent` | `--accent` | `#3b82f6` both themes | Primary CTA, active nav, links |
| `bg-accent-hover` | `--accent-hover` | `#2563eb` | Primary button hover |
| `bg-accent-active` | `--accent-active` | `#1d4ed8` | Primary button pressed |
| `bg-accent-subtle` | `--accent-subtle` | `rgba(59,130,246,.12/.10)` | Selected row, accent badge |
| `bg-accent-soft` | `--accent-soft` | `rgba(59,130,246,.06)` | Light accent wash |
| ring only | `--accent-ring` | `rgba(59,130,246,.35/.30)` | Input focus `box-shadow` |

**Text / Borders**

| Class | Variable | Dark | Light | Usage |
|---|---|---|---|---|
| `text-text-primary` | `--text-primary` | `#f4f4f5` | `#0e0e12` | Body/heading text |
| `text-text-secondary` | `--text-secondary` | `#b4b4bc` | `#43434c` | Labels, secondary copy |
| `text-text-muted` | `--text-muted` | `#6b6b75` | `#71717a` | Placeholders, hints |
| `text-text-inverted` | `--text-inverted` | `#0b0b0e` | `#ffffff` | Text on solid accent chip |
| `text-text-link` | `--text-link` | `#60a5fa` | `#1d4ed8` | Links in rich text/chat markdown |
| `border-border` | `--border` | `#2a2a31` | `#e1e1e6` | Standard divider/card/input border |
| `border-border-subtle` | `--border-subtle` | `#1f1f25` | `#ececf0` | Hairline dividers |
| `border-border-strong` | `--border-strong` | `#3a3a42` | `#c8c8d0` | Hover border emphasis |
| `border-border-focus` | `--border-focus` | `#3b82f6` both | Focused input, `:focus-visible` outline |

**Semantic:** `--success`/`--warning`/`--danger`/`--info`, each with a
`-soft` (translucent badge background) and `-strong` (readable text on
soft), exposed via `@theme` as `bg-success`/`text-success` etc. Status pills
(`status-not-started`, `-in-progress`, `-ready-qa`, `-done`, `-blocked`,
`-archived`, `-prospecting`, `-lost-deal`) have their own `--status-*-bg`/
`-text` pairs, consumed only through `StatusBadge` — see
[Component inventory](#component-inventory).

**Typography** — fonts loaded via `next/font`, exposed as `--font-inter` /
`--font-manrope` / `--font-geist-mono`:

| Token | Stack | Used for |
|---|---|---|
| `--font-sans` | Inter, system-ui, sans-serif | Body text (default) |
| `--font-display` | Manrope, Inter, sans-serif | Headings, KPI values |
| `--font-mono` | Geist Mono, ui-monospace, monospace | Code |

Progressive scale (custom utility classes in `globals.css`, not Tailwind's
default scale — 32→24→18→16→14, VibeUX 1.8): `.text-display` 32/700,
`.text-heading-1` 24/700, `.text-heading-2` 18/600 (all display font),
`.text-heading-3` 16/600, `.text-heading-4` 14/600, `.text-body` 14/400,
`.text-body-sm` 13/400, `.text-caption` 12/400 muted, `.text-label` 11/600
uppercase muted (sans font). Base body size 14px, line-height 1.5;
tabular numbers via `.tabular-nums`.

**Radius / shadow / layout / animation**

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 4px | Focus ring corner, small chips |
| `--radius` | 8px | Default — buttons, inputs, cards-sm |
| `--radius-lg` | 12px | Cards, KPI cards, drawers |
| `--radius-pill` | 9999px | Badges, status pills |
| `--shadow-xs`…`-lg` | 5 steps, 5–12% opacity | `-xs` buttons/cards, `-sm` hover, modals use inline `0 24px 48px rgba(0,0,0,.35)` |
| `--sidebar-width` | 60px / 232px | Set at runtime by `SidebarContext` |
| `--header-height` | 56px | Reserved, unused |
| `--ease`, `--ease-out`, `--duration` (180ms) | cubic-bezier | Hover/focus/collapse transitions |

Radius, shadow shape, layout, and animation tokens are identical across
themes — only color/elevation values change.

---

## Theme

- **Pre-paint (no FOUC):** `src/components/theme/ThemeScript.tsx` injects an
  inline `<script>` in `<head>` that runs before hydration: reads
  `localStorage["move37-theme"]` (`"light"|"dark"`), falls back to
  `prefers-color-scheme`, sets `document.documentElement.classList` and
  `style.colorScheme`.
- **Runtime state:** `src/components/theme/ThemeProvider.tsx` exposes
  `useTheme()` → `{ theme, resolvedTheme, setTheme }`, used by the
  Light/Dark toggle in the Sidebar profile popover; persists to the same
  `move37-theme` key. Only `"light"|"dark"` at runtime — `ThemeScript` is
  the only place reading `prefers-color-scheme`.
- **CSS mechanism:** dark values on bare `:root`; light overrides under
  `:root.light` in `globals.css`.
- **Adding a token:** define the variable under both `:root` and
  `:root.light`, then register it in `@theme inline` if it needs a utility
  class (e.g. `--color-foo: var(--foo)` → `bg-foo`/`text-foo`). Never
  hardcode a value at the call site.

---

## Layout shell

Every page starts from `PageShell` (`src/components/layout/PageShell.tsx`).
Never hand-build a sidebar/main layout — `RULES.md` §7.1.

```tsx
<PageShell profile={profile}>
  <PageHeader title="Projects" subtitle="22 active" actions={<Button>New</Button>} />
  {/* page content */}
</PageShell>
```

| Component | Prop | Purpose |
|---|---|---|
| `PageShell` | `profile: UserProfile \| null` | Passed to `Sidebar` for avatar/name/role nav filtering |
| | `fullBleed?` | Main column `overflow-hidden` instead of scrollable (chat-style pages) |
| | `flush?` | Disables default `px-8 py-7` inner padding |
| `PageHeader` | `title` (required), `subtitle?`, `eyebrow?` | Title block; eyebrow is a small uppercase label above title |
| | `actions?`, `compact?` | Right-aligned button row; `compact` tightens bottom margin when a toolbar follows |

`PageShell` wraps children in `SidebarProvider` and renders `<Sidebar>` plus
a `<main>` whose left margin follows the `--sidebar-width` CSS variable
(60px collapsed / 232px pinned).

**Sidebar state** (`SidebarContext.tsx`): `pinned` (toggle click, persisted
to `localStorage["move37:sidebar-pinned"]`, reflows main column) vs.
`hovered` (transient overlay, no reflow); `expanded = pinned || hovered`.
Access via `useSidebar()`.

**Role-aware nav** (`Sidebar.tsx`): `NAV_ITEMS` is `{label, href, icon,
roles, group}[]`, filtered per `SidebarRole` (`admin | manager |
operational | developer | client | qa | referrer | lead`), grouped into
`workspace | collaboration | operations | administration`. `referrer` gets
a hardcoded 2-item nav (`/projects`, `/feedback`) instead — mirrors the
middleware clamp (`RULES.md` §6.2). Nav icons come from
`@/components/ui/icons`.

---

## Component inventory

### `src/components/ui/*`

| Component | File | Key props | Notes |
|---|---|---|---|
| `Avatar`/`AvatarStack` | `Avatar.tsx` | `name`, `src`, `size` (xs–xl), `variant`, `interactive` | Image → initials → em dash; stack shows `+N` overflow |
| `Badge` | `Badge.tsx` | `variant` (default/success/warning/danger/info/accent), `size`, `leadingIcon` | Wraps `.badge` utility classes |
| `Button` | `Button.tsx` | `variant` (primary/secondary/tertiary/destructive/destructive-outline), `size` (sm/md/lg), `leadingIcon`, `loading`, `fullWidth` | `loading` swaps icon for spinner + disables |
| `Card`/`CardHeader`/`CardBody`/`CardFooter` | `Card.tsx` | `size` (sm/md/lg/compact), `interactive`, `as` | `interactive` adds hover border/shadow |
| `ConfirmDialog` | `ConfirmDialog.tsx` | `open`, `onConfirm`, `title`, `body`, `destructive`, `loading` | Built on `Modal`; manages own pending spinner if uncontrolled |
| `DataTable<T>` | `DataTable.tsx` | `rows`, `columns` (key/header/cell/width/align), `getRowKey`, `onRowClick`, `emptyState`, `dense` | Generic table (`/users`, `/leads`, `/feedback`, `/prompts`) |
| `Drawer` | `Drawer.tsx` | `open`, `onClose`, `side`, `width`, `title`, `zIndex` (50/60/70) | Slide-in panel; Escape-to-close + scroll lock |
| `EmptyState` | `EmptyState.tsx` | `icon`, `title`, `body`, `action`, `size` | Replaces plain "No items found" text |
| `IconButton` | `IconButton.tsx` | `icon`, `aria-label` (required), `size`, `tone` (neutral/danger/accent), `variant` (ghost/solid) | Canonical square icon-only button |
| `Input` | `Input.tsx` | `label`, `helpText`, `error`, `leadingIcon`, `trailingIcon` | 40px canonical text input, wraps `.input` |
| `KpiCard` | `KpiCard.tsx` | `label`, `value`, `delta` (`{value,positive}`), `meta` | Dashboard metric card; Tailwind-utility-first by design |
| `Modal`/`ModalBody`/`ModalFooter` | `Modal.tsx` | `open`, `onClose`, `title`, `size` (sm–2xl), `zIndex`, `disableBackdropClose` | Canonical overlay; old `projects/_components/modals/Modal.tsx` re-exports this |
| `NotificationDot` | `NotificationDot.tsx` | `count`, `max` (99), `dotOnly` | Renders nothing when `count <= 0` |
| `Select` | `Select.tsx` | `label`, `options` (`{value,label}[]`), `error`, `placeholder` | Styled native `<select>`, matches `Input` |
| `Skeleton`/`SkeletonLines` | `Skeleton.tsx` | `variant` (text/rect/avatar/circle), `w`, `h`, `size` | Shimmering loading placeholder |
| `StatusBadge` | `StatusBadge.tsx` | `status` (`StatusKind`), `label?` | Maps `os_task_status`/`os_project_status` to `.status-*` pill + label |
| `Tabs` | `Tabs.tsx` | `tabs` (id/label/count/unread/href/disabled), `activeId`, `onChange`, `fill` | 2px accent underline; tabs may be links or buttons |
| `Textarea` | `Textarea.tsx` | `label`, `minRows`, `error` | Shares `.input` styling |
| `Toolbar` | `Toolbar.tsx` | `search` (`{value,onChange,placeholder}`), `filters`, `action`, `countLabel` | Search+filters+CTA row for list/grid pages |
| `UserMultiSelect` | `UserMultiSelect.tsx` | `label`, `value` (id[]), `onChange`, `options`, `max` | Avatar-chip people picker; replaces three legacy pickers |

All re-exported from `src/components/ui/index.ts` — import as
`import { Button, Modal } from "@/components/ui"`. Icons are intentionally
excluded from that barrel; see [Icons](#icons).

### Other component folders

| File | Purpose |
|---|---|
| `layout/PageShell.tsx` | Outer chrome: sidebar + main column — see [Layout shell](#layout-shell) |
| `layout/PageHeader.tsx` | Title/subtitle/actions row, first child of `PageShell` |
| `layout/Sidebar.tsx` | Role-filtered nav, profile popover, theme toggle, collapse/pin |
| `layout/SidebarContext.tsx` | `pinned`/`hovered`/`expanded` state + `--sidebar-width` sync |
| `editor/RichTextEditor.tsx` | Shared TipTap editor (SOPs, Docs Playbook, Chat) — see [Rich text](#rich-text) |
| `theme/ThemeScript.tsx` | Pre-hydration inline script setting the theme class before paint |
| `theme/ThemeProvider.tsx` | Client context (`useTheme`) for the runtime toggle |

---

## Icons

All icons are re-exported (aliased to semantic names) from
`src/components/ui/icons.ts`, itself re-exporting `lucide-react`. **Never
import `lucide-react` directly, and never write an inline `<svg>`**
(`RULES.md` §7.3; CLAUDE.md UI Patterns).

```tsx
// Correct
import { EditIcon, DeleteIcon } from "@/components/ui/icons";
// Wrong
import { Pencil } from "lucide-react";
```

Icons are grouped by concept (row actions, add/remove/close/confirm,
search/filter, navigation, files, communication, people, time, status,
theme toggle, sidebar collapse, auth). `ICON_SIZE` constant (`xs:12, sm:14,
md:16, lg:20, xl:24`) is exported for call sites overriding the default
16px sizing.

**To add an icon:** add one aliased re-export in `icons.ts` (e.g. `Rocket
as RocketIcon`) — resist adding a second icon for an existing concept.

Note: both `RichTextEditor`s' own toolbars still draw formatting-button
glyphs as inline `<svg>` — these predate the icon-catalog rule and are
internal to the editor toolbar; not a precedent for new component code.

---

## Rich text

**Two separate TipTap wrappers** exist — do not consolidate without a
deliberate migration; they serve different call sites.

**`src/components/editor/RichTextEditor.tsx`** — forward-ref, named export,
imperative handle (`getHTML`/`setContent`/`getEditor`). Extensions:
`StarterKit`, `Underline`, `TextStyle`, `Color`, `Highlight` (multicolor),
`Subscript`, `Superscript`, `TextAlign`, `CharacterCount`, `Link`, `Image`,
`Table`/`TableRow`/`TableHeader`/`TableCell` (resizable), plus caller
`extraExtensions`. Has built-in title bar + word-count footer + full
toolbar. Callers: `src/app/sops/_components/SopEditor.tsx`,
`src/app/docs/_components/PlaybookEditor.tsx`,
`src/app/chat/_components/{Project,InternalProject}TabsPanel.tsx`
(imported from `@/components/editor/RichTextEditor`).

**`src/app/ideas-refiner/_components/RichTextEditor.tsx`** — default
export, simpler props (`content`, `onChange`, `editable`, `placeholder`,
`minHeight`), no imperative handle/chrome. Extensions: `StarterKit`,
`Underline`, `Link` (autolink), `TextAlign`, `TextStyle`, `Color`,
`Highlight`, `Image` (`allowBase64: false`), `Placeholder`, `Table` family.
Uses Tailwind Typography (`prose prose-sm prose-invert`) instead of
`.tiptap-content`. Callers: every Ideas Refiner step component (imported as
`./RichTextEditor`), plus `src/app/prompts/_components/PromptsShell.tsx` and
`src/app/projects/_components/modals/{Task,Project}Modal.tsx` (via the
absolute path `@/app/ideas-refiner/_components/RichTextEditor`).

**Storage & sanitization:** both editors emit an HTML string via
`onChange`; callers persist it directly to the relevant column (HTML, not
Markdown or TipTap JSON). Every place rendering stored/AI HTML via
`dangerouslySetInnerHTML` must pass it through `sanitizeHtml()`
(`src/lib/sanitize.ts`) first — `RULES.md` §7.4 forbids `contentEditable`
or raw injection otherwise. `sanitizeHtml` wraps DOMPurify with an
allow-list (`SAFE_TAGS`: p, br, hr, strong, b, em, i, u, s, ul, ol, li,
h1–h6, a, code, pre, blockquote, span, div, table family; `SAFE_ATTRS`:
href, target, rel, class).

**Current limitation:** `sanitizeHtml` **no-ops during SSR** (`typeof
window === "undefined"` returns the input unmodified; DOMPurify is
lazy-`require`d client-only). Server-rendered HTML is unsanitized at that
stage today, relying on the content being trusted server/LLM output until
client re-render sanitizes it. Being hardened in the 2026-09-15 pass — do
not depend on the current SSR no-op when writing new code.

---

## Charts, PDF & DOCX

**Recharts** is used directly (plain `import ... from "recharts"`, no
`next/dynamic` wrapper today) in `DashboardOverview.tsx` (dashboard),
`marketing/[ideaId]/_components/DashboardCharts.tsx`,
`marketing/[ideaId]/traffic/_components/BlendedIntelligence.tsx`, and
`okrs/_components/KeyResultsTracker.tsx`.

**Expectation for new work:** Recharts, TipTap, `jspdf`, `html2canvas`, and
`html-docx-js` are heavy client-only libraries. `exportPdf.ts` (below)
models the right pattern — `await import(...)` inside the async handler,
not a top-level import, so bundles stay out of the initial load and never
touch SSR. Prefer that pattern (or `next/dynamic({ ssr: false })` for a
component) over a static top-level import.

**PDF export** — `src/app/ideas-refiner/_lib/exportPdf.ts`
(`exportElementToPdf`) walks the rendered DOM block-by-block
(`collectTopLevelBlocks`), rasterizes each with `html2canvas`, and places it
on an A4 `jsPDF` page, starting a new page rather than bisecting a
paragraph/row/heading. A block taller than one page is sliced at a detected
near-white pixel band.

**Hex-only rule:** `html2canvas` cannot parse Tailwind v4's `oklch()`
output, so any surface rasterized for PDF/DOCX must use literal hex/`rgb()`
styling, never `bg-*`/`text-*` token classes. Called out explicitly in
`ReportPreviewModal.tsx` and `PrdPreviewModal.tsx` ("inline hex … no
oklch"), `PlaybookEditor.tsx`/`DocumentPreviewModal.tsx` (Docs print
surface), and `InvoicePreview.tsx` (renders on plain `bg-white
text-neutral-900`, using `window.print()` rather than the
html2canvas/jsPDF pipeline). New printable surfaces must render in their
own isolated hex-styled container, not inside a token-styled page.

**DOCX export** — `html-docx-js` (typed via `src/types/html-docx-js.d.ts`)
converts the same sanitized, hex-styled HTML directly to a `.docx` Blob;
see the Report/PRD/Playbook preview modals for the build-string →
`html-docx-js` → client download pattern.

---

## Accessibility & states

- **Focus rings:** global `:focus-visible` gives every focusable element a
  2px `var(--border-focus)` outline, 2px offset, 4px radius. Inputs also
  get `box-shadow: 0 0 0 3px var(--accent-ring)` on `:focus`.
- **Disabled:** `.btn:disabled` → opacity 0.5 + `cursor: not-allowed`,
  mirrored on `IconButton` and toolbar buttons via the native `disabled`
  attribute. `IconButton`'s `aria-label` is a required prop, not optional.
- **Loading:** `Button`'s `loading` prop swaps the leading icon for an
  `animate-spin` spinner and forces `disabled`. `ConfirmDialog` manages its
  own pending state around `onConfirm` when uncontrolled. `Skeleton`/
  `SkeletonLines` replace "Loading…" text with a shimmering block.
- **Toasts:** `sonner` handles transient success/error notifications;
  server actions return `{ error?: string }`, surfaced via a toast or the
  `error` prop on `Input`/`Textarea`/`Select` — never a thrown exception
  (`RULES.md` §5.2, §9.4).
- **Empty states:** `EmptyState` (icon + title + body + action) replaces
  bare "No results" text; `DataTable`'s `emptyState` prop slots one in.

---

## Checklist for new UI

- [ ] Page starts with `<PageShell profile={profile}>` + `<PageHeader>` —
      never a hand-rolled sidebar/main layout.
- [ ] Every color in JSX is a token class — no raw hex/`rgb()`/`oklch()`,
      except inside a dedicated PDF/print rasterization surface.
- [ ] Icons import from `@/components/ui/icons` — never `lucide-react`
      directly, never an inline `<svg>`.
- [ ] Reusable primitives come from `@/components/ui` before writing a new
      one-off component.
- [ ] Rich text uses the correct shared editor for the context
      (`@/components/editor/RichTextEditor` for docs/SOPs/chat vs.
      `@/app/ideas-refiner/_components/RichTextEditor` for Ideas
      Refiner/Projects/Prompts) — never `contentEditable` or a new editor.
- [ ] HTML rendered via `dangerouslySetInnerHTML` is passed through
      `sanitizeHtml()` first, with awareness it currently no-ops on SSR.
- [ ] New chart/PDF/DOCX code lazy-loads its library (dynamic `import()` or
      `next/dynamic({ ssr: false })`) rather than a static top-level import.
- [ ] Interactive elements keep the default `:focus-visible` styling and
      icon-only buttons carry an `aria-label`.
- [ ] Empty/loading/disabled states use `EmptyState`, `Skeleton`, and the
      `disabled`/`loading` props rather than ad hoc text or opacity hacks.
- [ ] A new token is added to both `:root` and `:root.light` in
      `globals.css` (and `@theme inline` if it needs a utility class).
- [ ] Cross-check `RULES.md` §7 and CLAUDE.md's "UI Patterns" section
      before inventing a new pattern.
