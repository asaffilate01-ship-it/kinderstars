
-- ============================================================
-- FIX 1: Childminder profiles sensitive data exposure
-- Create a public view with only non-sensitive columns
-- and remove the overly permissive SELECT policy
-- ============================================================

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users view available childminder profiles" ON public.childminder_profiles;

-- Create a secure view exposing only safe columns for directory searches
CREATE OR REPLACE VIEW public.childminder_public_profiles AS
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

-- Grant access to the view for authenticated users
GRANT SELECT ON public.childminder_public_profiles TO authenticated;

-- ============================================================
-- FIX 2: GDPR requests - allow users to submit and view own
-- ============================================================

CREATE POLICY "Users can submit own GDPR requests"
ON public.gdpr_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own GDPR requests"
ON public.gdpr_requests FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- ============================================================
-- FIX 3: Make avatars bucket private (authenticated-only)
-- ============================================================

UPDATE storage.buckets SET public = false WHERE id = 'avatars';

DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;

CREATE POLICY "Authenticated users view avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');
