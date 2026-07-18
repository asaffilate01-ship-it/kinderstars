
-- Replace overly permissive notification insert with authenticated-only
DROP POLICY IF EXISTS "Service role insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users create notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true);
