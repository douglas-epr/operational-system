# ROADMAP — Move37 Operational System

_Snapshot 2026-06-21. Status mirrors `docs/project_status.md`._

## Shipped

| Milestone | Status |
|---|---|
| Platform foundation (Next 16, Supabase, RLS, 35 migrations, Vercel) | ✅ |
| Auth + 8-role access model (middleware + page gate + RLS) | ✅ |
| Core pages (dashboard, projects, chat, internal-projects, okrs, sops, feedback, users, prompts, settings, profile) | ✅ |
| Invoices (rich-text, AI fill, PDF + email) | ✅ |
| Ideas Refiner — 15 steps incl. Risk & Validation debate + go/no-go Report + Build Brief + single-document PRD (per-feature tooling + phased plan) | ✅ |
| Market Validation Engine — Phases 0–5 + interview intelligence + traffic/SEO | ✅ |
| Integrations: OpenAI/Gemini/Claude, Brevo, Apify, Buffer/Postiz, Pexels | ✅ |
| Storage buckets (avatars, signatures, project-files, chat-attachments) | ✅ |

## In Progress / Next

| Item | Status | Notes |
|---|---|---|
| Stripe pre-order capture | 🟡 | Quiz + waitlist live; preorder stubbed (deferred per decision) |
| A/B landing variants + decision-log pivot taxonomy (P2) | 🟡 | Partial |
| Test suite (unit / integration / E2E) | ⬜ | No automated test runner configured yet — see `.specs/codebase/TESTING.md` |
| Vercel cron scheduling | ⬜ | Cron worker endpoints exist; Hobby-plan cron config removed — needs paid plan or external scheduler |

## Guiding Constraints

- Append-only migrations; RLS on every new table.
- Build to the patterns already in the codebase; greenfield marketing features document in `docs/marketing/`.
- Update `docs/changelog.md` every session.
