
-- Create meetings table
CREATE TABLE public.meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  meeting_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT,
  organizer_id UUID NOT NULL,
  attendee_ids UUID[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins manage all meetings"
ON public.meetings FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Users can view meetings they're invited to
CREATE POLICY "Users view own meetings"
ON public.meetings FOR SELECT
USING (auth.uid() = organizer_id OR auth.uid() = ANY(attendee_ids));

-- Trigger for updated_at
CREATE TRIGGER update_meetings_updated_at
BEFORE UPDATE ON public.meetings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
