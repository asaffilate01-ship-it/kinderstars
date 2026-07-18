
-- Incidents table for safeguarding
CREATE TABLE public.incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid,
  incident_date timestamptz NOT NULL DEFAULT now(),
  incident_type text NOT NULL DEFAULT 'general',
  description text,
  persons_involved text,
  actions_taken text,
  outcome text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all incidents" ON public.incidents FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON public.incidents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- GDPR requests table
CREATE TABLE public.gdpr_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  request_type text NOT NULL DEFAULT 'access',
  status text NOT NULL DEFAULT 'pending',
  notes text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gdpr_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all gdpr requests" ON public.gdpr_requests FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TRIGGER update_gdpr_requests_updated_at BEFORE UPDATE ON public.gdpr_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add billing_period to subscriptions
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS billing_period text NOT NULL DEFAULT 'monthly';
