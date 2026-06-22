# PROJECT — Move37 Operational System

_Spec-driven workspace initialized 2026-06-21 (brownfield)._

## Vision

A role-gated internal operations platform for the Move37 studio. It is a modern, type-safe
A modern Next.js + Supabase platform for running the studio's internal operations, extended
with a greenfield demand-validation product (the Market Validation Engine). The codebase and
this `.specs/` workspace are the source of truth. (The operational core was originally ported
from a legacy Bubble.io app; that migration is complete and the Bubble export is no longer kept.)

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
- No agency-level AI key tier (removed); AI keys are per-user with an env fallback.
- The talent-pool / leads / recommended-projects features were removed and are not coming back.

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
