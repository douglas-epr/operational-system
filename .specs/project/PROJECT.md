# PROJECT — Move37 Operational System

_Spec-driven workspace initialized 2026-06-21 (brownfield)._

## Vision

A role-gated internal operations platform for the Move37 studio. It is a modern, type-safe
Next.js + Supabase platform for running the studio's internal operations, extended
with a greenfield demand-validation product (the Market Validation Engine). The codebase and
this `.specs/` workspace are the source of truth.

## Goals

1. **Solid operational core** — projects, tasks, chat, OKRs, SOPs, invoices, ideas — built to
   the patterns established in the existing codebase.
2. **Type safety & RLS everywhere** — strict TypeScript, RLS on every table, server-only mutations.
3. **AI-assisted idea development** — the 15-step Ideas Refiner takes a raw idea through
   discovery → a Devil's-Advocate go/no-go report → PRD/DB/design/build playbook.
4. **Demand validation** — the Market Validation Engine validates an idea before build via
   sourcing, outreach, landing capture, signals scoring, and traffic/SEO.

## Non-Goals

- No standalone backend service — all server logic is Next.js Server Actions / Route Handlers.
- No per-user AI keys (removed 2026-08-14); every text/JSON generation runs through OpenRouter on
  one platform-owned `OPENROUTER_API_KEY` — the only user setting left is which model to use.
- The talent-pool / leads / recommended-projects features were removed and are not coming back.

## Measurable Goals

- **Performance:** first-load JS < 200 KB gzipped on `/projects` and `/chat`; ≤ 1 auth round-trip
  (`getUser()` + profile lookup) per page render — see `.specs/features/auth-roundtrips/`.
- **Security:** 0 unauthenticated write routes (all webhooks/cron verified; see `.specs/features/security-p0/`).
- **Security:** 0 unsanitized HTML sinks (`dangerouslySetInnerHTML` sites all pass through a
  server-safe sanitizer) — see `.specs/features/security-p0/`.

## Domains

| Domain | Source of truth |
|---|---|
| Projects, tasks, chat, OKRs, SOPs, invoices, internal projects, ideas | the codebase + `.specs/` |
| Market Validation Engine (`/marketing`, `/m`, `mkt_*`) | `docs/marketing/` (greenfield design notes) |

## Stakeholders

- **Studio team** (admin/manager/operational/developer/qa) — primary operators
- **Clients** — scoped project + client-request access
- **Leads / referrers** — restricted entry points (Ideas Refiner / project recommendations)

## Key References

- Root docs: `README.md`, `architecture.md`, `RULES.md`, `CLAUDE.md`
- Status & history: `docs/project_status.md`, `docs/changelog.md`
- Brownfield analysis: `.specs/codebase/`
