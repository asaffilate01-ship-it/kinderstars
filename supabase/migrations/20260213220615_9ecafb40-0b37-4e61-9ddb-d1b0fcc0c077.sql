
-- Fix: Restrict user_roles SELECT to own role only
DROP POLICY "Admins can view roles" ON public.user_roles;
CREATE POLICY "Users view own role" 
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
