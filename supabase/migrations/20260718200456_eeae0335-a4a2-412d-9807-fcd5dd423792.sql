-- Add employer role to app_role enum if not present
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'employer' AND enumtypid = 'public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'employer';
  END IF;
END $$;

-- Employer tier enum
DO $$ BEGIN
  CREATE TYPE public.employer_tier AS ENUM ('starter', 'growth', 'enterprise');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Employer link status enum
DO $$ BEGIN
  CREATE TYPE public.employer_link_status AS ENUM ('pending', 'active', 'paused', 'ended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Employer organisations
CREATE TABLE IF NOT EXISTS public.employer_organisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_person TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  postal_code TEXT,
  city TEXT,
  country TEXT NOT NULL DEFAULT 'DE',
  tax_id TEXT,
  vat_id TEXT,
  tier public.employer_tier NOT NULL DEFAULT 'starter',
  seat_count INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.employer_organisations TO authenticated;
GRANT ALL ON public.employer_organisations TO service_role;

ALTER TABLE public.employer_organisations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employers manage their own organisation"
  ON public.employer_organisations FOR ALL
  USING (owner_user_id = auth.uid() OR public.is_admin())
  WITH CHECK (owner_user_id = auth.uid() OR public.is_admin());

CREATE TRIGGER trg_employer_orgs_updated_at
  BEFORE UPDATE ON public.employer_organisations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Employer ↔ minder links
CREATE TABLE IF NOT EXISTS public.employer_minder_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES public.employer_organisations(id) ON DELETE CASCADE,
  minder_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_name TEXT,
  employee_email TEXT,
  subsidy_cents INTEGER NOT NULL DEFAULT 0,
  monthly_hour_cap INTEGER,
  funding_note TEXT,
  status public.employer_link_status NOT NULL DEFAULT 'pending',
  started_on DATE,
  ended_on DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employer_id, minder_user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.employer_minder_links TO authenticated;
GRANT ALL ON public.employer_minder_links TO service_role;

ALTER TABLE public.employer_minder_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employer owner manages own links"
  ON public.employer_minder_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.employer_organisations o
      WHERE o.id = employer_minder_links.employer_id
        AND o.owner_user_id = auth.uid()
    ) OR public.is_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employer_organisations o
      WHERE o.id = employer_minder_links.employer_id
        AND o.owner_user_id = auth.uid()
    ) OR public.is_admin()
  );

CREATE POLICY "Minder can view own employer links"
  ON public.employer_minder_links FOR SELECT
  USING (minder_user_id = auth.uid());

CREATE TRIGGER trg_employer_links_updated_at
  BEFORE UPDATE ON public.employer_minder_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
