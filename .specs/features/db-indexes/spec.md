# Spec: DB Indexes & Query Shape — FK coverage, duplicate removal, bounded selects

Status: implemented 2026-09-15 (local only; production apply and deploy pending)

Source: approved plan `1-please-update-all-wondrous-pixel.md`, Phase 4b "Performance — P0" (items P4–P6).

## Objective

The Move37 OS schema is FK-rich and RLS-heavy, and Postgres does **not** index foreign-key columns
automatically. Roughly forty child tables are filtered by a parent ID (`idea_id`, `internal_project_id`,
`project_id`, `landing_id`, `task_id`, `campaign_id`, `prospect_id`) with no index on that column, so
every Ideas Refiner step load, project board, and marketing screen sequential-scans its child tables —
and the Tier-2 creator RLS policies (`created_by = auth.uid()`) scan too. Five index **pairs** are exact
duplicates, costing write throughput and memory for nothing. On the app side, three pages `select("*")`
unbounded, and two actions pull an entire table into Node just to compute `max(order)`.

Success = an index on every FK column the audit listed, the redundant twin of each duplicate pair
dropped, explicit column lists and `.limit()` on the three named pages, `max(order)` computed in
Postgres, and the two heaviest `select("*")` files reduced.

Append-only: one new migration file. Nothing existing is edited.

## Evidence

| # | Finding | Evidence (file:line) |
|---|---|---|
| P4a | No index on `idea_id` across **17** child tables | `supabase/migrations/20260101000000_production_baseline.sql` (no `ON ... (idea_id)` index for these tables) |
| P4b | No index on `landing_id` across **3** tables | same baseline |
| P4c | No index on `internal_project_id` across **7** tables | same baseline |
| P4d | No index on `project_id` across **4** tables | same baseline |
| P4e | No index on `task_id` across **3** tables | same baseline |
| P4f | No index on `campaign_id` / `prospect_id` on the marketing outreach tables | same baseline |
| P4g | No index on `created_by` on tables whose Tier-2 RLS policy filters `created_by = auth.uid()` | RLS policy shape in CLAUDE.md "Standard three-tier RLS model" vs baseline index list |
| P5 | Five duplicate index pairs — the same column set indexed twice under two names | `20260101000000_production_baseline.sql` lines `3394`/`3398`, `3618`/`3450`, `3626`/`3454`, `3582`/`3442`, `3474`/`3478` |
| P6a | `okrs/page.tsx` issues an unbounded `select("*")` | `src/app/okrs/page.tsx:26-39` |
| P6b | `internal-projects/page.tsx` issues an unbounded `select("*")` | `src/app/internal-projects/page.tsx:35-76` |
| P6c | `users/page.tsx` issues an unbounded `select("*")` | `src/app/users/page.tsx:22-29` |
| P6d | `max(order)` computed in JS after fetching every row | `src/app/okrs/actions.ts:46` |
| P6e | `max(order)` computed in JS after fetching every row | `src/app/internal-projects/actions.ts:65-67` |
| P6f | 64 `select("*")` calls repo-wide; the two heaviest files are `ideas-refiner/actions.ts` (12) and `loadIdeaFull.ts` (9) | `src/app/ideas-refiner/actions.ts`, `src/app/ideas-refiner/_lib/loadIdeaFull.ts` |

Already verified **compliant**, so not in scope for change: RLS enabled on 85/85 live tables; all 32
`SECURITY DEFINER` functions pin `search_path`; the three-tier policy shape is correct.

## Stories

### P0 — Index every foreign-key column the audit listed (P4)

As a user of any list screen, I want child-row lookups to use an index instead of a sequential scan, so
Ideas Refiner steps, project boards and marketing screens stay fast as data grows.

**Acceptance criteria**

- AC1: A single new migration file exists, named for the change and dated after the current latest. `ls supabase/migrations | grep -c "_fk_indexes.sql$"` returns `1`, and that filename sorts after `20260814140000_drop_legacy_user_ai_keys.sql`.
- AC2: No existing migration was edited. `git status --porcelain supabase/migrations | grep -vc "^?? \|^A " ` returns `0` (only an added file).
- AC3: Every statement is idempotent. In the new file, `grep -c "CREATE INDEX IF NOT EXISTS" <file>` equals `grep -c "^CREATE INDEX" <file>`, i.e. there is no bare `CREATE INDEX`.
- AC4: The migration applies cleanly to a fresh local database. `npm run db:reset` exits `0`.
- AC5: Re-applying is a no-op. Running the migration's SQL a second time against local Supabase exits `0` with no error.
- AC6: **Zero** un-indexed FK columns remain. This audit query returns `0` rows against local Supabase after apply:
  ```sql
  SELECT c.conrelid::regclass AS tbl, a.attname
  FROM pg_constraint c
  JOIN unnest(c.conkey) WITH ORDINALITY k(attnum, ord) ON TRUE
  JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
  WHERE c.contype = 'f'
    AND c.connamespace = 'public'::regnamespace
    AND NOT EXISTS (
      SELECT 1 FROM pg_index i
      WHERE i.indrelid = c.conrelid AND i.indkey[0] = a.attnum
    );
  ```
- AC7: All 17 `idea_id` columns are covered. `SELECT count(*) FROM pg_indexes WHERE schemaname='public' AND indexdef LIKE '%(idea_id)%'` returns `>= 17`.
- AC8: All 7 `internal_project_id` columns are covered — the same query with `(internal_project_id)` returns `>= 7`.
- AC9: All 4 `project_id` columns named by the audit are covered — `(project_id)` count increases by `>= 4` versus the pre-change baseline.
- AC10: All 3 `landing_id` columns are covered — `(landing_id)` returns `>= 3`.
- AC11: All 3 `task_id` columns are covered — `(task_id)` returns `>= 3`.
- AC12: `campaign_id` and `prospect_id` are each covered — both `LIKE '%(campaign_id)%'` and `LIKE '%(prospect_id)%'` return `>= 1`.
- AC13: Every table with a `created_by = auth.uid()` Tier-2 policy has a `created_by` index. The count of `(created_by)` indexes is `>=` the count of tables whose policy definition (`pg_policies.qual`) contains `created_by = auth.uid()`.
- AC14: Measured improvement: `EXPLAIN (ANALYZE)` on the three representative queries — an idea's children by `idea_id`, tasks by `project_id`, outreach by `campaign_id` — shows `Index Scan` (or `Bitmap Index Scan`) where the pre-change plan recorded in `.specs/evaluations/` showed `Seq Scan`, for all three.
- AC15: Index names follow the observed convention. Every index created in the migration matches `^idx_<table>_<column>$` (checked by reading the file).
- AC16: `src/lib/supabase/types.ts` needs no change (indexes are not part of the generated types) — `npx tsc --noEmit` exits `0` and `git status --porcelain src/lib/supabase/types.ts` is empty.

### P0 — Drop the redundant twin of each duplicate index pair (P5)

As the platform owner, I want each column set indexed once, so inserts and updates do not maintain two
identical B-trees and shared buffers are not wasted.

**Acceptance criteria**

- AC1: The same new `_fk_indexes` migration contains the drops. `grep -c "DROP INDEX IF EXISTS" <migration>` returns `5`.
- AC2: Every drop is idempotent — all five use `IF EXISTS`; `grep -c "^DROP INDEX " <migration>` (without `IF EXISTS`) returns `0`.
- AC3: Exactly the `idx_*` twin of each pair is dropped; the non-`idx_` sibling (the constraint-backed or originally named index) survives. Verify by reading the file: each dropped name starts with `idx_`.
- AC4: **Zero** duplicate index pairs remain. This query returns `0` rows against local Supabase after apply:
  ```sql
  SELECT indrelid::regclass, indkey, count(*)
  FROM pg_index i
  JOIN pg_class c ON c.oid = i.indexrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
  GROUP BY 1, 2 HAVING count(*) > 1;
  ```
- AC5: No unique constraint or primary key was dropped. `SELECT count(*) FROM pg_constraint WHERE contype IN ('p','u') AND connamespace='public'::regnamespace` is unchanged before and after.
- AC6: No index that any RLS policy depends on for correctness was removed — RLS is logic, not index-dependent, so `SELECT count(*) FROM pg_policies WHERE schemaname='public'` is unchanged (expected: 0 delta).
- AC7: `npm run db:reset` exits `0` with the drops in place.
- AC8: Net index count drops by exactly 5 relative to the same schema with only the creates applied.

### P1 — Bound the three unbounded page queries (P6a–P6c)

As a user of the OKRs, Internal Projects and Users pages, I want the server to fetch only the columns and
rows the page renders, so page weight and query time do not grow with the whole table.

**Acceptance criteria**

- AC1: `src/app/okrs/page.tsx` has no `select("*")`. `grep -c 'select("\*")' src/app/okrs/page.tsx` returns `0`.
- AC2: `src/app/okrs/page.tsx` names its columns explicitly — the `select(` argument is a comma-separated column string (verified by reading), and every column it names is actually referenced in the page or a child prop.
- AC3: `src/app/okrs/page.tsx` bounds its rows. `grep -c "\.limit(" src/app/okrs/page.tsx` returns `>= 1`.
- AC4: `src/app/internal-projects/page.tsx` has no `select("*")` — count returns `0`.
- AC5: `src/app/internal-projects/page.tsx` names its columns explicitly.
- AC6: `src/app/internal-projects/page.tsx` bounds its rows — `.limit(` count `>= 1`.
- AC7: `src/app/users/page.tsx` has no `select("*")` — count returns `0`.
- AC8: `src/app/users/page.tsx` names its columns explicitly.
- AC9: `src/app/users/page.tsx` bounds its rows — `.limit(` count `>= 1`.
- AC10: No page regressed visually or functionally — manual walk of `/okrs`, `/internal-projects` and `/users` renders every field that rendered before, with no `undefined` in the UI.
- AC11: The `src/types/` interfaces for these three features still match the narrowed selects — `npx tsc --noEmit` exits `0` with no `as any` added. `git diff -U0 -- src | grep -c "^+.*as any"` returns `0`.

### P1 — Compute `max(order)` in Postgres (P6d–P6e)

As a user creating an OKR or an internal project, I want the next `order` value computed by the database,
so the app does not download every row to find one number.

**Acceptance criteria**

- AC1: `src/app/okrs/actions.ts` orders and limits instead of scanning in JS. `grep -n 'order("order"' src/app/okrs/actions.ts` returns at least 1 line containing `ascending: false`.
- AC2: `src/app/okrs/actions.ts` takes only one row. The same statement chain contains `.limit(1)`.
- AC3: `src/app/okrs/actions.ts` no longer reduces/sorts in JS to find the max. `grep -cE "Math\.max|\.reduce\(" src/app/okrs/actions.ts` returns `0`.
- AC4: `src/app/internal-projects/actions.ts` orders descending with `ascending: false` — at least 1 line.
- AC5: `src/app/internal-projects/actions.ts` contains `.limit(1)` on that chain.
- AC6: `src/app/internal-projects/actions.ts` no longer reduces/sorts in JS — `grep -cE "Math\.max|\.reduce\(" ` returns `0`.
- AC7: The empty-table case is handled — creating the first OKR in an empty table succeeds and stores `order = 0` (or the module's documented base), not `NaN` or `null` (DB round-trip check).
- AC8: Ordering is preserved — creating three OKRs in sequence yields strictly increasing `order` values (DB round-trip check).
- AC9: The same holds for internal projects — three creations yield strictly increasing `order`.

### P2 — Reduce `select("*")` in the two heaviest Ideas Refiner files (P6f)

As a developer, I want the Ideas Refiner data layer to name its columns, so a schema addition does not
silently widen every payload. 64 `select("*")` calls exist repo-wide; this story triages the top two files
only. Absence is **not** a defect for this pass.

**Acceptance criteria**

- AC1: `src/app/ideas-refiner/actions.ts` `select("*")` count drops from 12 to `<= 4`. `grep -c 'select("\*")' src/app/ideas-refiner/actions.ts` returns `<= 4`.
- AC2: `src/app/ideas-refiner/_lib/loadIdeaFull.ts` `select("*")` count drops from 9 to `<= 3` — same check on that file.
- AC3: Each narrowed select's column list is a shared named constant where the same entity is read more than once (no copy-pasted column strings). `grep -n "_SELECT\s*=" src/app/ideas-refiner` returns `>= 1`.
- AC4: `npx tsc --noEmit` exits `0` with no `as any` added for these files.
- AC5: A full 15-step Ideas Refiner walk on a test idea renders every step's content with no missing field (manual UAT — the canonical `IDEA_BLOCKS_ORDERED` sequence).
- AC6: Stale-write guards are untouched — `grep -c "isRequestActive" src/app/ideas-refiner/actions.ts` is unchanged relative to HEAD.

## Out of scope

- `CREATE INDEX CONCURRENTLY` — **impossible** inside a migration transaction. Plain `CREATE INDEX
  IF NOT EXISTS` is used. The production-apply note (take a lock window, or apply concurrently by hand
  outside the migration runner) belongs in `database.md`, not here.
- **Applying this migration to production Supabase.** Local (`npm run db:reset`) only. Production apply
  is PENDING for the owner.
- Editing any existing migration (append-only rule 3).
- Any schema change other than indexes — no new tables, columns, enums, constraints or RLS policies.
- Regenerating `src/lib/supabase/types.ts` (indexes are not typed).
- The remaining ~50 `select("*")` call sites outside the two named files.
- Partial, covering, or expression indexes, and any `pg_stat_statements` / autovacuum tuning.
- Auth round-trip reduction, middleware scope, polling → `.specs/features/auth-roundtrips/spec.md`.
- Bundle splitting and streaming boundaries → `.specs/features/bundle-and-boundaries/spec.md`.
- Pushing or deploying.

## Files touched

| File | Change |
|---|---|
| `supabase/migrations/2026091500xxxx_fk_indexes.sql` | **new** — `CREATE INDEX IF NOT EXISTS` for every audited FK column and every Tier-2 `created_by`; `DROP INDEX IF EXISTS` for the five `idx_*` duplicate twins |
| `src/app/okrs/page.tsx` | explicit column list + `.limit()` |
| `src/app/internal-projects/page.tsx` | explicit column list + `.limit()` |
| `src/app/users/page.tsx` | explicit column list + `.limit()` |
| `src/app/okrs/actions.ts` | `order("order", { ascending: false }).limit(1)` for next-order |
| `src/app/internal-projects/actions.ts` | same |
| `src/app/ideas-refiner/actions.ts` | narrow the heaviest `select("*")` calls (P2) |
| `src/app/ideas-refiner/_lib/loadIdeaFull.ts` | same (P2) |
| `src/types/*` | narrow feature interfaces to match the new selects, if needed |
| `database.md` | index inventory + the CONCURRENTLY production-apply note |
| `.specs/evaluations/` | `EXPLAIN (ANALYZE)` before/after for the three representative queries |

## Verification

Gate (must pass, per `.specs/codebase/TESTING.md` — there is no test runner):

```bash
npm run build && npm run lint && npx tsc --noEmit
```

Per-spec checks:

```bash
# P4/P5 — migration applies from scratch, idempotently
npm run db:reset

# P4 — zero un-indexed FK columns (expect 0 rows); see AC6 query
# P5 — zero duplicate index pairs (expect 0 rows); see AC4 query

# P6 — no unbounded selects on the three pages
grep -c 'select("\*")' src/app/okrs/page.tsx src/app/internal-projects/page.tsx src/app/users/page.tsx
grep -c "\.limit(" src/app/okrs/page.tsx src/app/internal-projects/page.tsx src/app/users/page.tsx

# P6 — max(order) pushed into Postgres
grep -nE 'order\("order".*ascending: false' src/app/okrs/actions.ts src/app/internal-projects/actions.ts
grep -cE "Math\.max|\.reduce\(" src/app/okrs/actions.ts src/app/internal-projects/actions.ts

# P2 — select("*") reduction in the two heaviest files
grep -c 'select("\*")' src/app/ideas-refiner/actions.ts src/app/ideas-refiner/_lib/loadIdeaFull.ts
```

Measurement, recorded before and after in `.specs/evaluations/`:

- `EXPLAIN (ANALYZE)` on an idea's children by `idea_id`, tasks by `project_id`, outreach by `campaign_id`.
- Total `public` index count (should be `+N − 5`).
- Row/byte payload for `/okrs`, `/internal-projects`, `/users` (DevTools RSC payload size).

Manual walk: `/okrs`, `/internal-projects`, `/users` render fully; creating an OKR and an internal
project assigns the right `order`; a full 15-step Ideas Refiner pass on a test idea shows no missing field.

## Boundaries

**Always**

- Append-only migrations: one new numbered file; never edit an existing one.
- `IF NOT EXISTS` / `IF EXISTS` on every DDL statement in the migration.
- Follow the observed index naming convention `idx_<table>_<column>`.
- Verify against local Supabase with `npm run db:reset` before declaring done.
- Keep `src/types/` interfaces in sync with the narrowed select queries.
- Add a `docs/changelog.md` entry at the end of the session.

**Ask first**

- Dropping any index not in the five audited duplicate pairs.
- Any schema change beyond indexes (column, table, enum, constraint, policy).
- Adding partial / covering / expression indexes.
- Choosing the `.limit()` values for the three pages (see Open questions).
- Regenerating `src/lib/supabase/types.ts`.

**Never**

- `git commit`.
- `git push`.
- Apply a migration to **production** Supabase.
- Deploy to Vercel.

## Open questions

1. `.limit()` values for `/okrs`, `/internal-projects` and `/users` are **ASSUMED** at 200 rows each,
   with no pagination UI added. Confirm the number, or confirm that pagination is a separate feature.
2. The exact table names behind the audited FK counts (17 × `idea_id`, 7 × `internal_project_id`, etc.)
   are not enumerated in the plan. AC6's audit query makes the requirement binary without them, but the
   migration author must re-run the query to generate the list — the query, not a hand-written list, is
   the source of truth.
3. The five duplicate pairs are identified by **line numbers** in the baseline migration, not by index
   name. The author must resolve each pair to its two index names and confirm the surviving one is the
   non-`idx_` sibling before writing the `DROP`.
4. Whether any of the five duplicates is actually a `UNIQUE` index whose twin is a plain index — if so,
   the plain one is the correct drop regardless of name prefix. AC3 assumes the `idx_*` twin is the
   redundant one; verify per pair.
5. Production apply strategy: with the table sizes involved, does a plain `CREATE INDEX` lock window fit
   in a maintenance slot, or must the owner run the indexes `CONCURRENTLY` by hand and then mark the
   migration applied? Decide before production apply is authorized.

---

## Audit corrections (2026-09-15, post-freeze)

- **`users/page.tsx` never used `select("*")`.** P6c claimed it did; it already named its columns
  (lines 17 and 24). It was genuinely unbounded, which the `.limit()` work fixed, but the
  `select("*")` part of the finding was wrong. D3-AC7 and D3-AC8 were met at base.
- **Only 4 duplicate index pairs exist, not 5.** The `project_qa_time_track` pair is moot: that
  table was dropped in `20260614000000_access_and_cleanup.sql`, so both its indexes were already
  gone.
- **AC3's `idx_`-prefix assumption does not hold for every pair.** The pair
  `internal_key_result_goal_idx` / `internal_key_result_internal_goal_id_idx` has neither name
  prefixed, so "drop the `idx_` twin" is not a decision procedure. The implementation kept the name
  that spells out the full column and dropped the abbreviated one.
- **Table list corrections applied during implementation**: `project_qa_time_track`,
  `conversation_project_internal_message_thread` and `conversation_project_internal_message` were
  dropped in earlier migrations; `internal_project_daily_feedback` is now
  `internal_project_work_feedback`; the `project_playbook_*` tables are now `idea_playbook_*` and key
  on `idea_id` rather than `project_id`. Schema audit lists must be derived from the cumulative
  migration history, not from the baseline file alone.
