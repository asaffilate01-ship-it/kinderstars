
-- Add onboarding status to childminder_profiles
ALTER TABLE public.childminder_profiles 
ADD COLUMN IF NOT EXISTS onboarding_status text NOT NULL DEFAULT 'pending';
-- Values: pending, documents_submitted, interview_scheduled, interview_completed, verified, rejected

-- Add onboarding checklist items table
CREATE TABLE public.onboarding_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  task_key text NOT NULL,
  task_label text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, task_key)
);

ALTER TABLE public.onboarding_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own onboarding tasks"
ON public.onboarding_tasks FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all onboarding tasks"
ON public.onboarding_tasks FOR ALL
USING (is_admin())
WITH CHECK (is_admin());
