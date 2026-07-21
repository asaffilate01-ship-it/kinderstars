
-- ============ REFERRAL BOUNTIES ============
CREATE TABLE public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.referral_codes TO authenticated;
GRANT ALL ON public.referral_codes TO service_role;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own code" ON public.referral_codes FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users insert own code" ON public.referral_codes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can look up by code" ON public.referral_codes FOR SELECT USING (true);

CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  referred_email text,
  code text NOT NULL,
  trigger_event text NOT NULL DEFAULT 'signup', -- signup | verification_purchase | first_booking
  bounty_cents integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending', -- pending | qualified | paid | rejected
  qualified_at timestamptz,
  paid_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Referrer or referred read" ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_user_id OR auth.uid() = referred_user_id OR is_admin());
CREATE POLICY "Users create referrals for themselves" ON public.referrals FOR INSERT
  WITH CHECK (auth.uid() = referrer_user_id OR auth.uid() = referred_user_id);
CREATE POLICY "Admins update referrals" ON public.referrals FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE TRIGGER trg_referrals_updated BEFORE UPDATE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ KITA PARTNERSHIPS ============
CREATE TABLE public.kita_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_name text,
  contact_email text,
  contact_phone text,
  plz text,
  town text,
  address text,
  region text,
  notes text,
  status text NOT NULL DEFAULT 'lead', -- lead | active | inactive
  referral_code text UNIQUE,
  commission_rate_pct numeric(5,2) NOT NULL DEFAULT 10.00,
  contract_signed_at timestamptz,
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kita_partners TO authenticated;
GRANT ALL ON public.kita_partners TO service_role;
ALTER TABLE public.kita_partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage kita partners" ON public.kita_partners FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Kita owner reads own" ON public.kita_partners FOR SELECT USING (auth.uid() = owner_user_id);
CREATE POLICY "Public read active kita partners" ON public.kita_partners FOR SELECT USING (status = 'active');
CREATE TRIGGER trg_kita_partners_updated BEFORE UPDATE ON public.kita_partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.kita_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kita_partner_id uuid NOT NULL REFERENCES public.kita_partners(id) ON DELETE CASCADE,
  parent_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  parent_email text,
  family_notes text,
  status text NOT NULL DEFAULT 'received', -- received | matched | booked | paid | rejected
  commission_cents integer NOT NULL DEFAULT 0,
  matched_at timestamptz,
  booked_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.kita_referrals TO authenticated;
GRANT ALL ON public.kita_referrals TO service_role;
ALTER TABLE public.kita_referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage kita referrals" ON public.kita_referrals FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Kita owner reads referrals" ON public.kita_referrals FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.kita_partners kp WHERE kp.id = kita_partner_id AND kp.owner_user_id = auth.uid()));
CREATE POLICY "Parent reads own kita referral" ON public.kita_referrals FOR SELECT USING (auth.uid() = parent_user_id);
CREATE POLICY "Anyone can submit lead" ON public.kita_referrals FOR INSERT WITH CHECK (true);
CREATE TRIGGER trg_kita_referrals_updated BEFORE UPDATE ON public.kita_referrals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ TRAINING PROVIDER INTEGRATIONS ============
ALTER TABLE public.partner_courses
  ADD COLUMN IF NOT EXISTS api_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS webhook_secret_hint text,
  ADD COLUMN IF NOT EXISTS cpd_hours numeric(5,2);

CREATE TABLE public.partner_training_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_course_id uuid REFERENCES public.partner_courses(id) ON DELETE SET NULL,
  provider text NOT NULL,
  external_ref text,
  status text NOT NULL DEFAULT 'enrolled', -- enrolled | in_progress | completed | cancelled
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  cpd_hours numeric(5,2),
  certificate_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, external_ref)
);
GRANT SELECT ON public.partner_training_enrollments TO authenticated;
GRANT ALL ON public.partner_training_enrollments TO service_role;
ALTER TABLE public.partner_training_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own enrolments" ON public.partner_training_enrollments FOR SELECT
  USING (auth.uid() = user_id OR is_admin());
CREATE TRIGGER trg_pte_updated BEFORE UPDATE ON public.partner_training_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ LIABILITY INSURANCE ============
ALTER TABLE public.childminder_profiles
  ADD COLUMN IF NOT EXISTS insurance_policy_number text,
  ADD COLUMN IF NOT EXISTS insurance_document_url text,
  ADD COLUMN IF NOT EXISTS insurance_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS insurance_verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Helper view: insurance status with 30-day grace
CREATE OR REPLACE VIEW public.v_childminder_insurance_status AS
SELECT
  cp.user_id,
  cp.insurance_provider,
  cp.insurance_expiry,
  cp.insurance_verified_at,
  CASE
    WHEN cp.insurance_expiry IS NULL OR cp.insurance_provider IS NULL THEN 'missing'
    WHEN cp.insurance_expiry >= current_date THEN 'valid'
    WHEN cp.insurance_expiry + interval '30 days' >= current_date THEN 'grace'
    ELSE 'expired'
  END AS status,
  CASE
    WHEN cp.insurance_expiry IS NOT NULL AND cp.insurance_expiry < current_date
    THEN (cp.insurance_expiry + interval '30 days')::date
    ELSE NULL
  END AS grace_until
FROM public.childminder_profiles cp;
GRANT SELECT ON public.v_childminder_insurance_status TO authenticated, anon;
