-- Revise idea.version_name versioning logic:
--
--   • project_id IS NULL (General Ideas):
--       Version N is counted per idea NAME — ideas with the same name form a
--       sequence. A brand-new name starts at Version 1.
--
--   • project_id IS NOT NULL (project ideas):
--       Version N is counted per PROJECT — unchanged from the original trigger.
--
--   • UPDATE (project_id changes):
--       version_name is recalculated automatically using the target bucket's
--       count rule (name-based for NULL, project-based otherwise).

-- ── 1. Replace INSERT trigger function ───────────────────────────────────────

CREATE OR REPLACE FUNCTION public.idea_auto_version_name()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF NEW.project_id IS NULL THEN
    -- Count no-project ideas with the same name (case-insensitive).
    SELECT COUNT(*) INTO v_count
    FROM public.idea
    WHERE project_id IS NULL
      AND lower(name) = lower(NEW.name);
  ELSE
    -- Count ideas already in the same project.
    SELECT COUNT(*) INTO v_count
    FROM public.idea
    WHERE project_id = NEW.project_id;
  END IF;

  NEW.version_name :=
    'Version ' || (v_count + 1)::text
    || ' - '
    || to_char(COALESCE(NEW.created_at, now()), 'DD/MM/YYYY HH24:MI');

  RETURN NEW;
END;
$$;

-- ── 2. New UPDATE trigger function — fires when project_id changes ────────────

CREATE OR REPLACE FUNCTION public.idea_update_version_on_project_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Only recalculate when project_id actually changes.
  IF NEW.project_id IS NOT DISTINCT FROM OLD.project_id THEN
    RETURN NEW;
  END IF;

  IF NEW.project_id IS NULL THEN
    -- Moved back to General Ideas: count same-name ideas (excluding self).
    SELECT COUNT(*) INTO v_count
    FROM public.idea
    WHERE project_id IS NULL
      AND lower(name) = lower(NEW.name)
      AND id != NEW.id;
  ELSE
    -- Moved to a project: count ideas already in that project (excluding self).
    SELECT COUNT(*) INTO v_count
    FROM public.idea
    WHERE project_id = NEW.project_id
      AND id != NEW.id;
  END IF;

  NEW.version_name :=
    'Version ' || (v_count + 1)::text
    || ' - '
    || to_char(COALESCE(NEW.created_at, now()), 'DD/MM/YYYY HH24:MI');

  RETURN NEW;
END;
$$;

-- ── 3. Register the UPDATE trigger ───────────────────────────────────────────

DROP TRIGGER IF EXISTS idea_update_version_name ON public.idea;
CREATE TRIGGER idea_update_version_name
  BEFORE UPDATE ON public.idea
  FOR EACH ROW
  EXECUTE FUNCTION public.idea_update_version_on_project_change();

-- ── 4. Backfill all existing rows ────────────────────────────────────────────
--
-- No-project ideas: partition by lower(name), ordered by created_at.
-- Project ideas:    partition by project_id,  ordered by created_at.

WITH recalc AS (
  SELECT
    id,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY lower(name)
      ORDER BY created_at
    ) AS rn
  FROM public.idea
  WHERE project_id IS NULL

  UNION ALL

  SELECT
    id,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY project_id
      ORDER BY created_at
    ) AS rn
  FROM public.idea
  WHERE project_id IS NOT NULL
)
UPDATE public.idea i
SET version_name =
  'Version ' || recalc.rn::text
  || ' - '
  || to_char(recalc.created_at, 'DD/MM/YYYY HH24:MI')
FROM recalc
WHERE i.id = recalc.id;
