
CREATE TABLE public.first_aid_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_date TIMESTAMPTZ NOT NULL,
  trainer_name TEXT NOT NULL,
  venue_name TEXT NOT NULL,
  venue_address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 12,
  seats_booked INTEGER NOT NULL DEFAULT 0,
  seat_price_cents INTEGER NOT NULL DEFAULT 6900,
  cost_per_seat_cents INTEGER NOT NULL DEFAULT 3500,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.first_aid_sessions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.first_aid_sessions TO authenticated;
GRANT ALL ON public.first_aid_sessions TO service_role;
ALTER TABLE public.first_aid_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view scheduled first-aid sessions" ON public.first_aid_sessions
  FOR SELECT USING (status IN ('scheduled', 'full', 'completed'));
CREATE POLICY "Admins manage first-aid sessions" ON public.first_aid_sessions
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER trg_first_aid_sessions_updated_at BEFORE UPDATE ON public.first_aid_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.first_aid_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.first_aid_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seat_count INTEGER NOT NULL DEFAULT 1,
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'reserved',
  completed_at TIMESTAMPTZ,
  refresher_due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.first_aid_bookings TO authenticated;
GRANT ALL ON public.first_aid_bookings TO service_role;
ALTER TABLE public.first_aid_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own first-aid bookings" ON public.first_aid_bookings
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users create own first-aid bookings" ON public.first_aid_bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own first-aid bookings" ON public.first_aid_bookings
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admins delete first-aid bookings" ON public.first_aid_bookings
  FOR DELETE USING (public.is_admin());
CREATE TRIGGER trg_first_aid_bookings_updated_at BEFORE UPDATE ON public.first_aid_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.first_aid_sessions (session_date, trainer_name, venue_name, venue_address, city, postal_code, capacity, seat_price_cents)
VALUES
  (now() + interval '14 days', 'Dr. Katrin Mayer', 'KinderStars Trainingszentrum', 'Musterstraße 12', 'Berlin', '10115', 12, 6900),
  (now() + interval '28 days', 'Sanitäter Team München', 'Gemeindesaal St. Anna', 'Annastraße 8', 'München', '80331', 15, 6900),
  (now() + interval '42 days', 'Malteser Ausbilder Köln', 'Bürgerhaus Ehrenfeld', 'Venloer Str. 429', 'Köln', '50825', 12, 6900);
