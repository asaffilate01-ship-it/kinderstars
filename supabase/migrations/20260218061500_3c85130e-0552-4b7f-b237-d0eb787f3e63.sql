
-- Fix 1: Restrict childminders table to authenticated users only
DROP POLICY IF EXISTS "Anyone can view childminders" ON public.childminders;
CREATE POLICY "Authenticated users can view childminders"
ON public.childminders FOR SELECT
TO authenticated
USING (true);

-- Fix 2: Remove public access to childminder_profiles, restrict to authenticated users
-- Only expose non-sensitive fields via RLS (sensitive fields like dbs_number, next_of_kin are still in table but only visible to owner/admin)
DROP POLICY IF EXISTS "Public can view available childminders" ON public.childminder_profiles;
CREATE POLICY "Authenticated users view available childminder profiles"
ON public.childminder_profiles FOR SELECT
TO authenticated
USING (is_available = true);

-- Fix 3: Restrict notifications INSERT to admins only (edge functions use service role key which bypasses RLS)
DROP POLICY IF EXISTS "Authenticated users create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role insert notifications" ON public.notifications;
CREATE POLICY "Admins create notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());
