-- Retrospective migration: migrate all mkt_* tables from project_id → idea_id.
-- Applied directly to hosted DB via MCP on 2026-06-10; this file documents the
-- schema state and backfills a fresh DB. All statements use IF NOT EXISTS /
-- IF EXISTS guards so replay against the already-migrated DB is a safe no-op.

-- ── 1. Add idea_id to all 12 tables ──────────────────────────────────────────

ALTER TABLE public.mkt_validation    ADD COLUMN IF NOT EXISTS idea_id uuid REFERENCES public.idea(id) ON DELETE CASCADE;
ALTER TABLE public.mkt_prospect      ADD COLUMN IF NOT EXISTS idea_id uuid REFERENCES public.idea(id) ON DELETE CASCADE;
ALTER TABLE public.mkt_source_run    ADD COLUMN IF NOT EXISTS idea_id uuid REFERENCES public.idea(id) ON DELETE CASCADE;
ALTER TABLE public.mkt_campaign      ADD COLUMN IF NOT EXISTS idea_id uuid REFERENCES public.idea(id) ON DELETE CASCADE;
ALTER TABLE public.mkt_sequence_step ADD COLUMN IF NOT EXISTS idea_id uuid REFERENCES public.idea(id) ON DELETE CASCADE;
ALTER TABLE public.mkt_outreach      ADD COLUMN IF NOT EXISTS idea_id uuid REFERENCES public.idea(id) ON DELETE CASCADE;
ALTER TABLE public.mkt_content       ADD COLUMN IF NOT EXISTS idea_id uuid REFERENCES public.idea(id) ON DELETE CASCADE;
ALTER TABLE public.mkt_landing       ADD COLUMN IF NOT EXISTS idea_id uuid REFERENCES public.idea(id) ON DELETE CASCADE;
ALTER TABLE public.mkt_signal        ADD COLUMN IF NOT EXISTS idea_id uuid REFERENCES public.idea(id) ON DELETE CASCADE;
ALTER TABLE public.mkt_event         ADD COLUMN IF NOT EXISTS idea_id uuid REFERENCES public.idea(id) ON DELETE CASCADE;
ALTER TABLE public.mkt_suppression   ADD COLUMN IF NOT EXISTS idea_id uuid REFERENCES public.idea(id) ON DELETE CASCADE;
ALTER TABLE public.mkt_research_cache ADD COLUMN IF NOT EXISTS idea_id uuid REFERENCES public.idea(id) ON DELETE CASCADE;

-- ── 2. Backfill idea_id from project_id (only runs if project_id still exists) ─

DO $$
DECLARE tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'mkt_validation','mkt_prospect','mkt_source_run','mkt_campaign',
    'mkt_sequence_step','mkt_outreach','mkt_content','mkt_landing',
    'mkt_signal','mkt_event','mkt_suppression','mkt_research_cache'
  ]) LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'project_id'
    ) THEN
      EXECUTE format(
        'UPDATE public.%I t
         SET idea_id = (
           SELECT i.id FROM public.idea i
           WHERE i.project_id = t.project_id
           ORDER BY i.created_at DESC LIMIT 1
         )
         WHERE t.idea_id IS NULL',
        tbl
      );
    END IF;
  END LOOP;
END $$;

-- ── 3. Enforce NOT NULL now that backfill is complete ─────────────────────────

ALTER TABLE public.mkt_validation    ALTER COLUMN idea_id SET NOT NULL;
ALTER TABLE public.mkt_prospect      ALTER COLUMN idea_id SET NOT NULL;
ALTER TABLE public.mkt_source_run    ALTER COLUMN idea_id SET NOT NULL;
ALTER TABLE public.mkt_campaign      ALTER COLUMN idea_id SET NOT NULL;
ALTER TABLE public.mkt_sequence_step ALTER COLUMN idea_id SET NOT NULL;
ALTER TABLE public.mkt_outreach      ALTER COLUMN idea_id SET NOT NULL;
ALTER TABLE public.mkt_content       ALTER COLUMN idea_id SET NOT NULL;
ALTER TABLE public.mkt_landing       ALTER COLUMN idea_id SET NOT NULL;
ALTER TABLE public.mkt_signal        ALTER COLUMN idea_id SET NOT NULL;
ALTER TABLE public.mkt_event         ALTER COLUMN idea_id SET NOT NULL;
ALTER TABLE public.mkt_suppression   ALTER COLUMN idea_id SET NOT NULL;
ALTER TABLE public.mkt_research_cache ALTER COLUMN idea_id SET NOT NULL;

-- ── 4. Drop old project_id column from all 12 tables ─────────────────────────

ALTER TABLE public.mkt_validation    DROP COLUMN IF EXISTS project_id;
ALTER TABLE public.mkt_prospect      DROP COLUMN IF EXISTS project_id;
ALTER TABLE public.mkt_source_run    DROP COLUMN IF EXISTS project_id;
ALTER TABLE public.mkt_campaign      DROP COLUMN IF EXISTS project_id;
ALTER TABLE public.mkt_sequence_step DROP COLUMN IF EXISTS project_id;
ALTER TABLE public.mkt_outreach      DROP COLUMN IF EXISTS project_id;
ALTER TABLE public.mkt_content       DROP COLUMN IF EXISTS project_id;
ALTER TABLE public.mkt_landing       DROP COLUMN IF EXISTS project_id;
ALTER TABLE public.mkt_signal        DROP COLUMN IF EXISTS project_id;
ALTER TABLE public.mkt_event         DROP COLUMN IF EXISTS project_id;
ALTER TABLE public.mkt_suppression   DROP COLUMN IF EXISTS project_id;
ALTER TABLE public.mkt_research_cache DROP COLUMN IF EXISTS project_id;

-- ── 5. Recreate RLS policies with idea → project join ─────────────────────────
-- Pattern: admin/manager gets full access; project member gets access via
-- idea.project_id → project.authorized_users.

DO $$
DECLARE tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'mkt_validation','mkt_prospect','mkt_source_run','mkt_campaign',
    'mkt_sequence_step','mkt_outreach','mkt_content','mkt_landing',
    'mkt_signal','mkt_event','mkt_suppression','mkt_research_cache'
  ]) LOOP
    -- Drop old project-based member policy if it exists
    EXECUTE format('DROP POLICY IF EXISTS "%s: project member read" ON public.%I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "%s: project member all"  ON public.%I', tbl, tbl);

    -- Admin/manager: full access (idempotent create)
    EXECUTE format('DROP POLICY IF EXISTS "%s: admin/manager all" ON public.%I', tbl, tbl);
    EXECUTE format(
      'CREATE POLICY "%s: admin/manager all" ON public.%I FOR ALL USING (public.is_admin_or_manager())',
      tbl, tbl
    );

    -- Project member: access via idea → project join
    EXECUTE format(
      $policy$
      CREATE POLICY "%s: project member all" ON public.%I FOR ALL
        USING (
          EXISTS (
            SELECT 1 FROM public.idea i
            JOIN public.project p ON p.id = i.project_id
            WHERE i.id = %I.idea_id
              AND auth.uid() = ANY(p.authorized_users)
          )
        )
      $policy$,
      tbl, tbl, tbl
    );
  END LOOP;
END $$;

-- ── 6. Recreate unique index on mkt_suppression ───────────────────────────────
-- Original index was on (project_id, lower(email)); update to (idea_id, lower(email)).

DROP INDEX IF EXISTS public.mkt_suppression_project_email_uniq;
CREATE UNIQUE INDEX IF NOT EXISTS mkt_suppression_idea_email_uniq
  ON public.mkt_suppression (idea_id, lower(email));

-- ── 7. Recreate mkt_validation unique constraint ──────────────────────────────
-- One validation config per idea.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'mkt_validation'
      AND constraint_type = 'UNIQUE'
      AND constraint_name LIKE '%idea_id%'
  ) THEN
    ALTER TABLE public.mkt_validation ADD CONSTRAINT mkt_validation_idea_id_key UNIQUE (idea_id);
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
