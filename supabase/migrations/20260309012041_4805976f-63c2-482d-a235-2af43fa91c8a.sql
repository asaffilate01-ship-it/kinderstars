
-- 1. Create profiles_display view (security definer) — exposes only name & role, no PII
-- This allows all authenticated users to see other users' names for messaging
CREATE OR REPLACE VIEW public.profiles_display AS
SELECT 
  user_id,
  first_name,
  last_name,
  role
FROM public.profiles;

-- Grant SELECT on the view to authenticated and anon roles
GRANT SELECT ON public.profiles_display TO authenticated;
GRANT SELECT ON public.profiles_display TO anon;

-- 2. Fix admin_audit_log — add INSERT policy so admin actions are logged
CREATE POLICY "Admins can insert audit logs"
ON public.admin_audit_log
FOR INSERT
WITH CHECK (is_admin());

-- 3. Allow users to delete their own notifications
CREATE POLICY "Users delete own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- 4. REPLICA IDENTITY FULL on messages so realtime UPDATE events carry old values
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- 5. REPLICA IDENTITY FULL on notifications for realtime badge accuracy
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- 6. Enable realtime on messages (if not already published)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END;
$$;
