-- Marketing funnel query indexes
--
-- The /marketing portfolio + per-idea dashboards filter mkt_event / mkt_signal
-- by (idea_id, type) on every load, and the signals page scans mkt_event by
-- (idea_id, session_id). Postgres does NOT auto-index foreign keys, so these
-- were sequential scans. These composite indexes back the hot funnel queries
-- and the RLS `EXISTS (… WHERE idea_id = …)` subqueries.
--
-- NOTE: applied as plain CREATE INDEX inside the migration transaction. When
-- applying to a large, live production table instead, run the equivalent
-- CREATE INDEX CONCURRENTLY statements outside a transaction to avoid locking.

CREATE INDEX IF NOT EXISTS mkt_event_idea_type_idx
  ON public.mkt_event (idea_id, type);

CREATE INDEX IF NOT EXISTS mkt_event_idea_session_idx
  ON public.mkt_event (idea_id, session_id);

CREATE INDEX IF NOT EXISTS mkt_signal_idea_type_idx
  ON public.mkt_signal (idea_id, type);

NOTIFY pgrst, 'reload schema';
