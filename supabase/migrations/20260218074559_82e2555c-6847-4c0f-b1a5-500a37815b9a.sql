
-- Add regulator field to childminder_profiles for Ofsted/CIW/Care Inspectorate/RQIA
ALTER TABLE public.childminder_profiles 
ADD COLUMN IF NOT EXISTS regulator text DEFAULT NULL;

-- Add prospect-specific fields
ALTER TABLE public.childminder_profiles 
ADD COLUMN IF NOT EXISTS prospect_stage text DEFAULT NULL;

-- Create a prospect training checklist table
CREATE TABLE public.prospect_training (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  regulator text NOT NULL DEFAULT 'ofsted',
  task_key text NOT NULL,
  task_label text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, task_key)
);

ALTER TABLE public.prospect_training ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own prospect training"
ON public.prospect_training FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all prospect training"
ON public.prospect_training FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE TRIGGER update_prospect_training_updated_at
BEFORE UPDATE ON public.prospect_training
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
