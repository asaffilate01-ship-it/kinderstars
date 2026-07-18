
CREATE TABLE public.partner_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  price_label TEXT,
  price_from_cents INT,
  duration_label TEXT,
  logo_url TEXT,
  referral_url TEXT NOT NULL,
  referral_token TEXT,
  commission_label TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.partner_courses TO anon, authenticated;
GRANT ALL ON public.partner_courses TO service_role;
ALTER TABLE public.partner_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Partner courses public read" ON public.partner_courses FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage partner courses" ON public.partner_courses FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER trg_partner_courses_updated BEFORE UPDATE ON public.partner_courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.partner_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  partner_course_id UUID NOT NULL REFERENCES public.partner_courses(id) ON DELETE CASCADE,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  commission_cents INT,
  commission_status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.partner_referrals TO authenticated;
GRANT ALL ON public.partner_referrals TO service_role;
ALTER TABLE public.partner_referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own referrals" ON public.partner_referrals FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users log own clicks" ON public.partner_referrals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins update commissions" ON public.partner_referrals FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER trg_partner_referrals_updated BEFORE UPDATE ON public.partner_referrals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
