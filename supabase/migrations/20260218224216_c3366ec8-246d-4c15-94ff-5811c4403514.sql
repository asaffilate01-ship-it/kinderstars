
-- Remove the broad SELECT policy that re-exposes all columns
DROP POLICY IF EXISTS "Authenticated users view available childminder profiles via view" ON public.childminder_profiles;

-- Recreate view as SECURITY DEFINER so it doesn't need RLS on the table
-- This is the correct pattern for column-level security
DROP VIEW IF EXISTS public.childminder_public_profiles;

CREATE VIEW public.childminder_public_profiles
WITH (security_invoker = false) AS
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
