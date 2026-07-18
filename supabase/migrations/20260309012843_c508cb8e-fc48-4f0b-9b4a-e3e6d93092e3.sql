
-- Drop the profiles_display view since we now have a SECURITY DEFINER function
-- This resolves the security linter warning about security definer views
DROP VIEW IF EXISTS public.profiles_display;
