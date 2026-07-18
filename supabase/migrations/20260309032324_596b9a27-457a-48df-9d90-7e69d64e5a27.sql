
-- Fix 1: Recreate childminder_public_profiles view with SECURITY INVOKER and filter sensitive data
DROP VIEW IF EXISTS public.childminder_public_profiles;

CREATE VIEW public.childminder_public_profiles
WITH (security_invoker = true)
AS
SELECT
  id, user_id, postcode_district, town, age_groups, bio, hours, days, languages,
  experience_years, is_available, is_live, max_children, max_distance_miles,
  ofsted_urn, ofsted_rating, ofsted_last_inspection, regulator,
  onboarding_status, prospect_stage, created_at, updated_at
FROM public.childminder_profiles
WHERE is_live = true;

-- Fix 2: Drop the overly permissive interview_slots UPDATE policy and recreate for authenticated only
DROP POLICY IF EXISTS "Users book interview slots" ON public.interview_slots;

CREATE POLICY "Authenticated users book interview slots"
ON public.interview_slots
FOR UPDATE
TO authenticated
USING ((status = 'available'::text) OR (booked_by = auth.uid()))
WITH CHECK ((status = 'available'::text) OR (booked_by = auth.uid()));

-- Also fix the SELECT policy to be authenticated only
DROP POLICY IF EXISTS "Users view available interview slots" ON public.interview_slots;

CREATE POLICY "Authenticated users view available interview slots"
ON public.interview_slots
FOR SELECT
TO authenticated
USING ((status = 'available'::text) OR (booked_by = auth.uid()));
