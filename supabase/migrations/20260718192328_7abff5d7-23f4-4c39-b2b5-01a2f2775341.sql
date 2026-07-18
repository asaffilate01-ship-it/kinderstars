
CREATE TYPE public.jugendamt_ready_status AS ENUM ('ordered','in_review','action_required','ready','submitted','completed','cancelled');
CREATE TYPE public.jugendamt_monitoring_tier AS ENUM ('none','basic','pro');

CREATE TABLE public.jugendamt_ready_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.jugendamt_ready_status NOT NULL DEFAULT 'ordered',
  bundesland TEXT,
  jugendamt_name TEXT,
  assigned_reviewer UUID REFERENCES auth.users(id),
  qualifications_review JSONB NOT NULL DEFAULT '{"status":"pending","notes":""}'::jsonb,
  missing_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  training_pathway JSONB NOT NULL DEFAULT '[]'::jsonb,
  application_pack JSONB NOT NULL DEFAULT '{"status":"pending","files":[]}'::jsonb,
  appointment_prep JSONB NOT NULL DEFAULT '{"status":"pending","notes":""}'::jsonb,
  evidence_folder JSONB NOT NULL DEFAULT '{"status":"pending","files":[]}'::jsonb,
  reviewer_notes TEXT,
  minder_notes TEXT,
  monitoring_tier public.jugendamt_monitoring_tier NOT NULL DEFAULT 'none',
  monitoring_active_until TIMESTAMPTZ,
  ordered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.jugendamt_ready_assessments TO authenticated;
GRANT ALL ON public.jugendamt_ready_assessments TO service_role;

ALTER TABLE public.jugendamt_ready_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own jugendamt ready"
  ON public.jugendamt_ready_assessments FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can insert own jugendamt ready"
  ON public.jugendamt_ready_assessments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jugendamt ready notes"
  ON public.jugendamt_ready_assessments FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins can delete jugendamt ready"
  ON public.jugendamt_ready_assessments FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE TRIGGER trg_jugendamt_ready_updated
  BEFORE UPDATE ON public.jugendamt_ready_assessments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_jugendamt_ready_user ON public.jugendamt_ready_assessments(user_id);
CREATE INDEX idx_jugendamt_ready_status ON public.jugendamt_ready_assessments(status);
