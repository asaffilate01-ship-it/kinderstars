
-- 1. Create a SECURITY DEFINER function so ALL authenticated users can see names for messaging
-- The regular view profiles_display inherits RLS from profiles table which blocks non-admin users
CREATE OR REPLACE FUNCTION public.get_profiles_display()
RETURNS TABLE(user_id uuid, first_name text, last_name text, role app_role)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.first_name, p.last_name, p.role
  FROM public.profiles p;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_profiles_display() TO authenticated;
