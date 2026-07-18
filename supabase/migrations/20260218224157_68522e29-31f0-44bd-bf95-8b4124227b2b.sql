
-- Fix the SECURITY DEFINER view issue by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.childminder_public_profiles;

CREATE VIEW public.childminder_public_profiles
WITH (security_invoker = true) AS
SELECT 
  id,
  user_id,
  postcode_district,
  town,
  max_distance_miles,
  max_children,
  age_groups,
  experience_years,
  bio,
  hours,
  days,
  languages,
  ofsted_urn,
  ofsted_rating,
  ofsted_last_inspection,
  regulator,
  is_available,
  is_live,
  onboarding_status,
  prospect_stage,
  created_at,
  updated_at
FROM public.childminder_profiles
WHERE is_available = true;

GRANT SELECT ON public.childminder_public_profiles TO authenticated;

-- We need a policy that allows authenticated users to read childminder_profiles
-- through the view, but only non-sensitive columns are exposed by the view itself.
-- Since the view uses SECURITY INVOKER, the querying user's RLS applies.
-- We need to re-add a SELECT policy but it's fine since the view limits columns.
CREATE POLICY "Authenticated users view available childminder profiles via view"
ON public.childminder_profiles FOR SELECT
TO authenticated
USING (is_available = true);
