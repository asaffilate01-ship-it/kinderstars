
-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID NOT NULL,
  childminder_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  notes TEXT,
  decline_reason TEXT,
  children_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Parents can view/create their own bookings
CREATE POLICY "Parents view own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = parent_id);

CREATE POLICY "Parents create bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents cancel own bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = parent_id);

-- Childminders view and respond to their bookings
CREATE POLICY "Childminders view assigned bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = childminder_id);

CREATE POLICY "Childminders update assigned bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = childminder_id);

-- Admins manage all
CREATE POLICY "Admins manage all bookings" ON public.bookings
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
