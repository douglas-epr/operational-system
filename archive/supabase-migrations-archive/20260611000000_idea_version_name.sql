-- Add version_name to the idea table for sequential per-project versioning.
-- Format: "Version N - Mon DD, YYYY HH24:MI"
-- N is assigned per project_id (NULL project_ids form their own group).

ALTER TABLE public.idea ADD COLUMN IF NOT EXISTS version_name text;

-- Backfill existing rows using ROW_NUMBER() per project partition, ordered by created_at.
UPDATE public.idea i
SET version_name = ranked.vname
FROM (
  SELECT
    id,
    'Version ' || ROW_NUMBER() OVER (
      PARTITION BY project_id
      ORDER BY created_at
    )::text
    || ' - '
    || to_char(created_at, 'DD/MM/YYYY HH24:MI') AS vname
  FROM public.idea
) ranked
WHERE i.id = ranked.id;

-- Trigger function: auto-assign version_name on new idea inserts.
-- Counts existing rows in the same project to derive the next N.
CREATE OR REPLACE FUNCTION public.idea_auto_version_name()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.version_name :=
    'Version ' ||
    ((SELECT COUNT(*) FROM public.idea
      WHERE project_id IS NOT DISTINCT FROM NEW.project_id) + 1)::text ||
    ' - ' ||
    to_char(COALESCE(NEW.created_at, now()), 'DD/MM/YYYY HH24:MI');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS idea_set_version_name ON public.idea;
CREATE TRIGGER idea_set_version_name
  BEFORE INSERT ON public.idea
  FOR EACH ROW
  WHEN (NEW.version_name IS NULL)
  EXECUTE FUNCTION public.idea_auto_version_name();
