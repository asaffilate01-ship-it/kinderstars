-- Track KinderStars Verified 12-month expiry
ALTER TABLE public.minder_verification
  ADD COLUMN IF NOT EXISTS verified_from date,
  ADD COLUMN IF NOT EXISTS verified_until date;

-- When tier is promoted to 'verified' via app flow, we set both.
-- Sanity guard: verified_until must be after verified_from when both present.
CREATE OR REPLACE FUNCTION public.enforce_verification_dates()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.verified_from IS NOT NULL AND NEW.verified_until IS NOT NULL
     AND NEW.verified_until <= NEW.verified_from THEN
    RAISE EXCEPTION 'verified_until must be after verified_from';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_verification_dates ON public.minder_verification;
CREATE TRIGGER trg_enforce_verification_dates
BEFORE INSERT OR UPDATE ON public.minder_verification
FOR EACH ROW EXECUTE FUNCTION public.enforce_verification_dates();