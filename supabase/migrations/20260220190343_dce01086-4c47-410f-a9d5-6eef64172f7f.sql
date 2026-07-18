-- Add meeting_link and meeting_type to meetings table for interview support
ALTER TABLE public.meetings 
  ADD COLUMN IF NOT EXISTS meeting_link text,
  ADD COLUMN IF NOT EXISTS meeting_type text DEFAULT 'general';

-- Add interview_slots table for admin-published bookable interview slots
CREATE TABLE IF NOT EXISTS public.interview_slots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by uuid NOT NULL,
  slot_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  meeting_link text,
  role_target text NOT NULL DEFAULT 'childminder', -- 'childminder' or 'parent'
  booked_by uuid,
  booked_at timestamptz,
  status text NOT NULL DEFAULT 'available', -- available, booked, cancelled, completed
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.interview_slots ENABLE ROW LEVEL SECURITY;

-- Admins manage all slots
CREATE POLICY "Admins manage all interview slots"
  ON public.interview_slots FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- Users can view available slots for their role
CREATE POLICY "Users view available interview slots"
  ON public.interview_slots FOR SELECT
  USING (status = 'available' OR booked_by = auth.uid());

-- Users can book available slots (update booked_by)
CREATE POLICY "Users book interview slots"
  ON public.interview_slots FOR UPDATE
  USING (status = 'available' OR booked_by = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_interview_slots_updated_at
  BEFORE UPDATE ON public.interview_slots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();