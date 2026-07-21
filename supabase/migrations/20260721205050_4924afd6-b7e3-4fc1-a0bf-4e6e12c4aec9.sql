
DROP VIEW IF EXISTS public.v_childminder_insurance_status;
CREATE VIEW public.v_childminder_insurance_status
WITH (security_invoker = on) AS
SELECT
  cp.user_id,
  cp.insurance_provider,
  cp.insurance_expiry,
  cp.insurance_verified_at,
  CASE
    WHEN cp.insurance_expiry IS NULL OR cp.insurance_provider IS NULL THEN 'missing'
    WHEN cp.insurance_expiry >= current_date THEN 'valid'
    WHEN cp.insurance_expiry + interval '30 days' >= current_date THEN 'grace'
    ELSE 'expired'
  END AS status,
  CASE
    WHEN cp.insurance_expiry IS NOT NULL AND cp.insurance_expiry < current_date
    THEN (cp.insurance_expiry + interval '30 days')::date
    ELSE NULL
  END AS grace_until
FROM public.childminder_profiles cp;
GRANT SELECT ON public.v_childminder_insurance_status TO authenticated, anon;
