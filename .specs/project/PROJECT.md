# PROJECT — Move37 Operational System

_Spec-driven workspace initialized 2026-06-21 (brownfield)._

## Vision

A role-gated internal operations platform for the Move37 studio. It is a modern, type-safe
Next.js + Supabase rebuild of the studio's legacy Bubble.io application, extended with a
greenfield demand-validation product (the Market Validation Engine).

## Goals

1. **Faithful port** of the Bubble operational core — projects, tasks, chat, OKRs, SOPs,
   invoices, ideas — with every ported feature traceable to `docs/reference_docs/`.
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

| Domain | Bubble port? | Source of truth |
|---|---|---|
| Projects, tasks, chat, OKRs, SOPs, invoices, internal projects, ideas | Yes | `docs/reference_docs/` |
| Market Validation Engine (`/marketing`, `/m`, `mkt_*`) | No (greenfield) | `docs/marketing/` |

## Stakeholders

- **Studio team** (admin/manager/operational/developer/qa) — primary operators
- **Clients** — scoped project + client-request access
- **Leads / referrers** — restricted entry points (Ideas Refiner / project recommendations)

## Key References

- Root docs: `README.md`, `architecture.md`, `RULES.md`, `CLAUDE.md`
- Status & history: `docs/project_status.md`, `docs/changelog.md`
- Brownfield analysis: `.specs/codebase/`
