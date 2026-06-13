-- OKRs: internal_goal / internal_key_result / internal_key_result_track
-- Maps Bubble tables internal_goal, internal_key_result, internal_key_result_track
-- and option sets os_internal_goals_status, os_internal_key_result_status.
-- Privacy Rule: only admin/manager/operational profile types have access.

-- ── Enums ─────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.internal_goal_status AS ENUM
    ('prospecting','not_started','in_progress','done','archived','blocked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.internal_key_result_status AS ENUM
    ('not_started','in_progress','ready_for_qa','done','blocked','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Tables ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.internal_goal (
  id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text         NOT NULL,
  "order"     int          NOT NULL DEFAULT 0,
  description text         NOT NULL DEFAULT ''::text,
  status      public.internal_goal_status NOT NULL DEFAULT 'not_started',
  created_by  uuid         REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.internal_key_result (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_goal_id            uuid NOT NULL REFERENCES public.internal_goal(id) ON DELETE CASCADE,
  name                        text NOT NULL,
  "order"                     int  NOT NULL DEFAULT 0,
  start_date                  date,
  end_date                    date,
  status                      public.internal_key_result_status NOT NULL DEFAULT 'not_started',
  current_key_result_value    numeric,
  achieved                    boolean NOT NULL DEFAULT false,
  description                 text NOT NULL DEFAULT ''::text,
  created_by                  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS internal_key_result_goal_idx
  ON public.internal_key_result(internal_goal_id);

CREATE TABLE IF NOT EXISTS public.internal_key_result_track (
  id                                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_goal_id                  uuid NOT NULL REFERENCES public.internal_goal(id) ON DELETE CASCADE,
  internal_key_result_id            uuid NOT NULL REFERENCES public.internal_key_result(id) ON DELETE CASCADE,
  date                              date NOT NULL,
  value                             numeric,
  current_target_key_result_value   numeric,
  achieved                          boolean NOT NULL DEFAULT false,
  created_by                        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at                        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS internal_key_result_track_kr_idx
  ON public.internal_key_result_track(internal_key_result_id, date);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.internal_goal              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_key_result        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_key_result_track  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "internal_goal: internal staff all"             ON public.internal_goal;
DROP POLICY IF EXISTS "internal_key_result: internal staff all"       ON public.internal_key_result;
DROP POLICY IF EXISTS "internal_key_result_track: internal staff all" ON public.internal_key_result_track;

CREATE POLICY "internal_goal: internal staff all"
  ON public.internal_goal FOR ALL
  USING       (public.get_user_type() = ANY (ARRAY['admin','manager','operational']::os_user_type[]))
  WITH CHECK  (public.get_user_type() = ANY (ARRAY['admin','manager','operational']::os_user_type[]));

CREATE POLICY "internal_key_result: internal staff all"
  ON public.internal_key_result FOR ALL
  USING       (public.get_user_type() = ANY (ARRAY['admin','manager','operational']::os_user_type[]))
  WITH CHECK  (public.get_user_type() = ANY (ARRAY['admin','manager','operational']::os_user_type[]));

CREATE POLICY "internal_key_result_track: internal staff all"
  ON public.internal_key_result_track FOR ALL
  USING       (public.get_user_type() = ANY (ARRAY['admin','manager','operational']::os_user_type[]))
  WITH CHECK  (public.get_user_type() = ANY (ARRAY['admin','manager','operational']::os_user_type[]));
