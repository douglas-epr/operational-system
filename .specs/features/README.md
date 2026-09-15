# Feature Specs — index

One folder per feature, each holding `spec.md`. Specs use P0/P1/P2 stories with numbered, binary
acceptance criteria and an explicit out-of-scope list, so `.specs/evaluations/_ac-baseline.md` can
freeze them into an I/T checklist for `spec-driven-eval`.

| Folder | Feature | Status | Scope |
|---|---|---|---|
| `prd-single-document/` | PRD as a single comprehensive document | shipped 2026-07-02 | `idea_prd.description` collapse; 10 per-section columns dropped and backfilled |
| `security-p0/` | Public surface hardening (S1–S8) | draft 2026-09-15 | Brevo webhook secret, server-safe sanitizer + 22 raw HTML sinks, `/m` iframe sandbox + `Origin: null` CORS, unsubscribe signing secret, in-memory rate limiter + Vercel WAF docs, `server-only` guard, HSTS + CSP-Report-Only |
| `server-action-guards/` | Server action authorization & env reconciliation (S9–S12) | draft 2026-09-15 | Auth gate on the 54 ungated actions, column allow-lists for `Record<string, unknown>` updates, `vercel.json` crons, `.env.example` sync |
| `auth-roundtrips/` | Auth round-trip reduction (P1–P3) | draft 2026-09-15 | Middleware matcher excludes `/api` + `/m`, conditional `profiles` query, React `cache()` current-user helper, poll visibility gate + 5000 ms interval |
| `db-indexes/` | DB indexes & query shape (P4–P6) | draft 2026-09-15 | `fk_indexes` migration, 5 duplicate index pairs dropped, explicit columns + limits on 3 pages, `max(order)` in Postgres, `select("*")` triage |
| `bundle-and-boundaries/` | Bundle & route boundaries (P7–P10) | draft 2026-09-15 | `next/dynamic` for TipTap + Recharts, app-level loading/error/global-error/not-found + 4 segment loading states, `compiler.removeConsole`, drop `@types/dompurify` |

Status values: `draft <date>` (written, not implemented) · `approved <date>` · `shipped <date>`.

Verification gate for every spec (there is no test runner — see `.specs/codebase/TESTING.md`):

```bash
npm run build && npm run lint && npx tsc --noEmit
```

Boundaries common to all drafts — **never** commit, push, apply a production Supabase migration, or
deploy. Source for the five 2026-09-15 drafts: approved plan
`~/.claude/plans/1-please-update-all-wondrous-pixel.md`, Phase 4b evidence table + "User decisions".
