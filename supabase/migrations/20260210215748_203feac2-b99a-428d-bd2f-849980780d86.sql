
-- Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Childminders table
CREATE TABLE public.childminders (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_initial TEXT NOT NULL,
  town TEXT NOT NULL,
  postcode_district TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  age_groups TEXT[] NOT NULL DEFAULT '{}',
  days TEXT[] NOT NULL DEFAULT '{}',
  hours TEXT,
  languages TEXT[] NOT NULL DEFAULT '{}',
  experience_years INTEGER,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.childminders ENABLE ROW LEVEL SECURITY;

-- Helper function: check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
$$;

-- RLS: childminders - public read
CREATE POLICY "Anyone can view childminders"
  ON public.childminders FOR SELECT
  USING (true);

-- RLS: childminders - admin write
CREATE POLICY "Admins can insert childminders"
  ON public.childminders FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update childminders"
  ON public.childminders FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can delete childminders"
  ON public.childminders FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- RLS: user_roles - admin only
CREATE POLICY "Admins can view roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.is_admin() OR user_id = auth.uid());

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_childminders_updated_at
  BEFORE UPDATE ON public.childminders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed data
INSERT INTO public.childminders (id, first_name, last_initial, town, postcode_district, verified, age_groups, days, hours, languages, experience_years, bio) VALUES
  ('KS-LU1-001', 'Sarah', 'M', 'Luton', 'LU1', true, ARRAY['0-1','2-4'], ARRAY['Mon','Tue','Wed','Thu','Fri'], '08:00–18:00', ARRAY['English','Urdu'], 6, 'Warm, play-based childcare with daily learning activities, outdoor time, and a calm routine.'),
  ('KS-LU2-002', 'Aisha', 'K', 'Luton', 'LU2', false, ARRAY['2-4','5-8'], ARRAY['Mon','Wed','Thu','Fri'], '07:30–17:30', ARRAY['English','Punjabi'], 4, 'Friendly home-from-home care. Focus on confidence, communication, and creative play.'),
  ('KS-MK9-003', 'Rachel', 'T', 'Milton Keynes', 'MK9', true, ARRAY['0-1','2-4','5-8'], ARRAY['Tue','Wed','Thu'], '09:00–16:30', ARRAY['English'], 9, 'Experienced childminder offering structured routines, story time, sensory play, and school pickups (district based).'),
  ('KS-NW10-004', 'Hina', 'A', 'London', 'NW10', true, ARRAY['2-4','5-8'], ARRAY['Mon','Tue','Wed','Thu'], '08:00–17:00', ARRAY['English','Arabic'], 7, 'Positive, nurturing setting with learning through play, healthy snacks, and gentle behavioural guidance.');
