
CREATE TABLE public.academy_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  duration_minutes INT NOT NULL DEFAULT 60,
  price_cents INT NOT NULL DEFAULT 0,
  stripe_price_key TEXT,
  is_bundle BOOLEAN NOT NULL DEFAULT false,
  bundle_course_slugs TEXT[] NOT NULL DEFAULT '{}',
  included_in_professional BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.academy_courses TO anon, authenticated;
GRANT ALL ON public.academy_courses TO service_role;
ALTER TABLE public.academy_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Academy courses are public" ON public.academy_courses FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage academy courses" ON public.academy_courses FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER trg_academy_courses_updated BEFORE UPDATE ON public.academy_courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.academy_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'enrolled',
  progress_percent INT NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  certificate_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academy_enrollments TO authenticated;
GRANT ALL ON public.academy_enrollments TO service_role;
ALTER TABLE public.academy_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own enrollments" ON public.academy_enrollments FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users create own enrollments" ON public.academy_enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own enrollments" ON public.academy_enrollments FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admins manage all enrollments" ON public.academy_enrollments FOR DELETE USING (public.is_admin());
CREATE TRIGGER trg_academy_enrollments_updated BEFORE UPDATE ON public.academy_enrollments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
