-- Backfill: internal_project_assignees pivot table.
-- This table existed in the cloud DB but was missing from local migrations.
-- Columns: internal_project_id (FK → internal_project), user_id (FK → profiles).

CREATE TABLE IF NOT EXISTS public.internal_project_assignees (
  internal_project_id UUID NOT NULL
    REFERENCES public.internal_project(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL
    REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (internal_project_id, user_id)
);

ALTER TABLE public.internal_project_assignees ENABLE ROW LEVEL SECURITY;

-- Internal staff (admin, manager, operational) can manage assignees.
CREATE POLICY "int_proj_assignees: all internal staff"
  ON public.internal_project_assignees
  USING (
    public.get_user_type() = ANY (ARRAY[
      'admin'::public.os_user_type,
      'manager'::public.os_user_type,
      'operational'::public.os_user_type
    ])
  )
  WITH CHECK (
    public.get_user_type() = ANY (ARRAY[
      'admin'::public.os_user_type,
      'manager'::public.os_user_type,
      'operational'::public.os_user_type
    ])
  );

GRANT ALL ON TABLE public.internal_project_assignees TO anon;
GRANT ALL ON TABLE public.internal_project_assignees TO authenticated;
GRANT ALL ON TABLE public.internal_project_assignees TO service_role;
