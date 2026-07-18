
-- 1. Enum
DO $$ BEGIN
  CREATE TYPE public.verification_tier AS ENUM ('registered', 'verified', 'jugendamt_approved');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Table
CREATE TABLE public.minder_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tier public.verification_tier NOT NULL DEFAULT 'registered',

  -- Level 1: KinderStars Registered
  identity_checked BOOLEAN NOT NULL DEFAULT false,
  address_checked BOOLEAN NOT NULL DEFAULT false,
  right_to_work_checked BOOLEAN NOT NULL DEFAULT false,
  phone_verified BOOLEAN NOT NULL DEFAULT false,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  basic_profile_completed BOOLEAN NOT NULL DEFAULT false,
  terms_accepted_at TIMESTAMPTZ,
  safeguarding_declaration_signed_at TIMESTAMPTZ,

  -- Level 2: KinderStars Verified
  fuehrungszeugnis_checked BOOLEAN NOT NULL DEFAULT false,
  fuehrungszeugnis_checked_at DATE,
  fuehrungszeugnis_renewal_date DATE,
  references_checked BOOLEAN NOT NULL DEFAULT false,
  references_count SMALLINT NOT NULL DEFAULT 0,
  video_interview_completed_at TIMESTAMPTZ,
  safeguarding_induction_completed_at TIMESTAMPTZ,
  knowledge_assessment_passed_at TIMESTAMPTZ,
  first_aid_certificate_date DATE,
  first_aid_expiry DATE,
  emergency_training_completed_at TIMESTAMPTZ,
  experience_declared BOOLEAN NOT NULL DEFAULT false,
  insurance_status TEXT,
  code_of_conduct_signed_at TIMESTAMPTZ,

  -- Level 3: Jugendamt Approved
  jugendamt_confirmed BOOLEAN NOT NULL DEFAULT false,
  jugendamt_confirmation_ref TEXT,
  jugendamt_confirmation_date DATE,
  jugendamt_approval_expiry DATE,
  jugendamt_municipality TEXT,
  local_qualifications_completed BOOLEAN NOT NULL DEFAULT false,
  qhb_training_documented BOOLEAN NOT NULL DEFAULT false,
  cpd_recorded BOOLEAN NOT NULL DEFAULT false,
  tax_social_insurance_documented BOOLEAN NOT NULL DEFAULT false,
  permitted_categories TEXT[],

  -- Metadata
  reviewer_id UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Grants
GRANT SELECT, INSERT, UPDATE ON public.minder_verification TO authenticated;
GRANT ALL ON public.minder_verification TO service_role;

-- 4. RLS
ALTER TABLE public.minder_verification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Minder can view own verification"
  ON public.minder_verification FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins manage verification"
  ON public.minder_verification FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Minder can insert own verification row"
  ON public.minder_verification FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 5. Guard trigger: block jugendamt_approved without confirmation ref, audit tier changes
CREATE OR REPLACE FUNCTION public.enforce_verification_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tier = 'jugendamt_approved'
     AND (NEW.jugendamt_confirmed IS NOT TRUE
          OR NEW.jugendamt_confirmation_ref IS NULL
          OR NEW.jugendamt_confirmation_date IS NULL) THEN
    RAISE EXCEPTION 'Jugendamt Approved tier requires jugendamt_confirmed, confirmation ref and confirmation date';
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.tier IS DISTINCT FROM OLD.tier THEN
    INSERT INTO public.admin_audit_log (actor_id, action, entity_type, entity_id, metadata)
    VALUES (
      auth.uid(),
      'verification_tier_change',
      'minder_verification',
      NEW.id,
      jsonb_build_object('from', OLD.tier, 'to', NEW.tier, 'user_id', NEW.user_id)
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER minder_verification_rules
  BEFORE INSERT OR UPDATE ON public.minder_verification
  FOR EACH ROW EXECUTE FUNCTION public.enforce_verification_rules();

CREATE TRIGGER minder_verification_updated_at
  BEFORE UPDATE ON public.minder_verification
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Helper view for public badge (safe, computed only)
CREATE OR REPLACE FUNCTION public.get_verification_tier(p_user_id UUID)
RETURNS public.verification_tier
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tier FROM public.minder_verification WHERE user_id = p_user_id LIMIT 1;
$$;
