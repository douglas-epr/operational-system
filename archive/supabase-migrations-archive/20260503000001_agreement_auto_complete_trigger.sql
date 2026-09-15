-- Auto-flip project_agreement_version.status to 'completed' whenever every
-- required signer is in signed_by[]. Until now this was handled inside
-- the `sign_agreement` RPC, which means an update arriving by any other
-- path (direct SQL, admin tool, future migration) would leave the status
-- stuck at 'ready_to_sign'.
--
-- A BEFORE UPDATE trigger keeps the invariant on every write — including
-- when an admin shrinks `required_signers` so that everyone left has
-- already signed. The trigger is idempotent: it only writes 'completed'
-- when the current status is 'ready_to_sign' AND the subset condition
-- holds. It never reverses a 'completed' or 'archived' status.

CREATE OR REPLACE FUNCTION public.project_agreement_version_auto_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only auto-complete from the 'ready_to_sign' state. Don't touch
  -- archived / draft / already-completed rows.
  IF NEW.status = 'ready_to_sign'
     AND array_length(NEW.required_signers, 1) IS NOT NULL
     AND NEW.required_signers <@ NEW.signed_by THEN
    NEW.status := 'completed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_project_agreement_version_auto_complete
  ON public.project_agreement_version;

CREATE TRIGGER trg_project_agreement_version_auto_complete
BEFORE INSERT OR UPDATE OF signed_by, required_signers, status
ON public.project_agreement_version
FOR EACH ROW
EXECUTE FUNCTION public.project_agreement_version_auto_complete();

-- One-shot backfill for any existing rows where the invariant already
-- holds but the status was never flipped. Touching only the status
-- column keeps the trigger from re-firing infinitely.
UPDATE public.project_agreement_version
   SET status = 'completed'
 WHERE status = 'ready_to_sign'
   AND array_length(required_signers, 1) IS NOT NULL
   AND required_signers <@ signed_by;
