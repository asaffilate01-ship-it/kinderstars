
CREATE TYPE public.safeguarding_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.safeguarding_status AS ENUM ('open', 'in_review', 'jugendamt_notified', 'resolved', 'closed');
CREATE TYPE public.safeguarding_category AS ENUM (
  'physical_concern', 'emotional_concern', 'neglect', 'sexual_concern',
  'domestic_violence', 'online_safety', 'accident_injury', 'behavioural_change', 'other'
);

CREATE TABLE public.safeguarding_concerns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_initials TEXT NOT NULL,
  child_age_years INTEGER,
  category safeguarding_category NOT NULL,
  severity safeguarding_severity NOT NULL DEFAULT 'medium',
  status safeguarding_status NOT NULL DEFAULT 'open',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  location TEXT,
  description TEXT NOT NULL,
  immediate_actions TEXT,
  witnesses TEXT,
  jugendamt_notified BOOLEAN NOT NULL DEFAULT false,
  jugendamt_notified_at TIMESTAMPTZ,
  jugendamt_reference TEXT,
  parents_informed BOOLEAN NOT NULL DEFAULT false,
  parents_informed_at TIMESTAMPTZ,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.safeguarding_concerns TO authenticated;
GRANT ALL ON public.safeguarding_concerns TO service_role;

ALTER TABLE public.safeguarding_concerns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reporters can view their own concerns"
  ON public.safeguarding_concerns FOR SELECT TO authenticated
  USING (reporter_id = auth.uid());

CREATE POLICY "Admins can view all concerns"
  ON public.safeguarding_concerns FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "Reporters can create concerns"
  ON public.safeguarding_concerns FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Reporters can update open concerns"
  ON public.safeguarding_concerns FOR UPDATE TO authenticated
  USING (reporter_id = auth.uid() AND status = 'open')
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Admins can update any concern"
  ON public.safeguarding_concerns FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete concerns"
  ON public.safeguarding_concerns FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE TRIGGER update_safeguarding_concerns_updated_at
  BEFORE UPDATE ON public.safeguarding_concerns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_safeguarding_concerns_reporter ON public.safeguarding_concerns(reporter_id);
CREATE INDEX idx_safeguarding_concerns_status ON public.safeguarding_concerns(status);
CREATE INDEX idx_safeguarding_concerns_severity ON public.safeguarding_concerns(severity);
