-- Fix: Require authentication for user_roles SELECT
-- Drop existing policies and recreate with proper auth checks
DROP POLICY IF EXISTS "Users view own role" ON public.user_roles;

CREATE POLICY "Authenticated users view own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
