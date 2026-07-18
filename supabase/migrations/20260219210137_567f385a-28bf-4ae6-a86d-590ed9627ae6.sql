
-- Create audit log table
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  admin_email text,
  action text NOT NULL,
  target_user_id uuid,
  target_email text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.admin_audit_log
FOR SELECT
USING (public.is_admin());

-- Only service role inserts (edge functions), no direct user inserts
-- We don't create INSERT policy for authenticated users - edge functions use service role
