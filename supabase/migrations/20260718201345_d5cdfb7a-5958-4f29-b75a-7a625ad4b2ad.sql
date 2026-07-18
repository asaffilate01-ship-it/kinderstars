
CREATE TYPE public.saas_lead_status AS ENUM ('new', 'contacted', 'qualified', 'won', 'lost');
CREATE TYPE public.saas_org_type AS ENUM ('traeger', 'kette', 'kommune', 'sonstiges');
CREATE TYPE public.saas_tier AS ENUM ('starter', 'growth', 'scale', 'bespoke');

CREATE TABLE public.saas_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text,
  org_type public.saas_org_type,
  estimated_seats integer,
  current_software text,
  message text,
  tier_interest public.saas_tier,
  status public.saas_lead_status NOT NULL DEFAULT 'new',
  admin_notes text,
  submitted_ip text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.saas_leads TO anon;
GRANT INSERT ON public.saas_leads TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.saas_leads TO authenticated;
GRANT ALL ON public.saas_leads TO service_role;

ALTER TABLE public.saas_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a saas lead"
ON public.saas_leads FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view saas leads"
ON public.saas_leads FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can update saas leads"
ON public.saas_leads FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete saas leads"
ON public.saas_leads FOR DELETE
TO authenticated
USING (public.is_admin());

CREATE TRIGGER update_saas_leads_updated_at
BEFORE UPDATE ON public.saas_leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
