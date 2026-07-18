
-- =============================================
-- PHASE 1: FULL PLATFORM DATABASE SCHEMA
-- =============================================

-- 1. Extend app_role enum with childminder and parent roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'childminder';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'parent';

-- 2. PROFILES TABLE (shared across all roles)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  
  -- Auto-assign role from metadata
  IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, (NEW.raw_user_meta_data->>'role')::app_role);
    
    UPDATE public.profiles SET role = (NEW.raw_user_meta_data->>'role')::app_role WHERE user_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. CHILDMINDER DETAILS (extended profile for childminders)
CREATE TABLE public.childminder_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  postcode_district text,
  town text,
  max_distance_miles integer DEFAULT 10,
  max_children integer DEFAULT 3,
  age_groups text[] DEFAULT '{}',
  experience_years integer,
  bio text,
  hours text,
  days text[] DEFAULT '{}',
  languages text[] DEFAULT '{}',
  ofsted_urn text,
  ofsted_rating text,
  ofsted_last_inspection date,
  dbs_number text,
  dbs_issue_date date,
  insurance_provider text,
  insurance_expiry date,
  first_aid_expiry date,
  next_of_kin_name text,
  next_of_kin_phone text,
  next_of_kin_relation text,
  is_available boolean DEFAULT true,
  is_live boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.childminder_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Childminders can view own details" ON public.childminder_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Childminders can update own details" ON public.childminder_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Childminders can insert own details" ON public.childminder_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all childminder profiles" ON public.childminder_profiles FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Public can view available childminders" ON public.childminder_profiles FOR SELECT USING (is_available = true);

CREATE TRIGGER update_childminder_profiles_updated_at BEFORE UPDATE ON public.childminder_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. CERTIFICATES
CREATE TABLE public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  issuer text,
  issue_date date,
  expiry_date date,
  certificate_url text,
  verified boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own certificates" ON public.certificates FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all certificates" ON public.certificates FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 5. SHIFTS
CREATE TABLE public.shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  childminder_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  parent_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL DEFAULT 'Shift',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','offered','accepted','declined','in_progress','completed','cancelled')),
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  location_address text,
  location_postcode text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Childminders can view own shifts" ON public.shifts FOR SELECT USING (auth.uid() = childminder_id);
CREATE POLICY "Parents can view own shifts" ON public.shifts FOR SELECT USING (auth.uid() = parent_id);
CREATE POLICY "Childminders can update own shifts" ON public.shifts FOR UPDATE USING (auth.uid() = childminder_id);
CREATE POLICY "Admins can manage all shifts" ON public.shifts FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON public.shifts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. TIMESHEETS
CREATE TABLE public.timesheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid REFERENCES public.shifts(id) ON DELETE CASCADE,
  childminder_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clock_in timestamptz,
  clock_out timestamptz,
  break_minutes integer DEFAULT 0,
  total_hours numeric(5,2),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','approved','rejected')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Childminders manage own timesheets" ON public.timesheets FOR ALL USING (auth.uid() = childminder_id) WITH CHECK (auth.uid() = childminder_id);
CREATE POLICY "Admins manage all timesheets" ON public.timesheets FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TRIGGER update_timesheets_updated_at BEFORE UPDATE ON public.timesheets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. AVAILABILITY
CREATE TABLE public.availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own availability" ON public.availability FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all availability" ON public.availability FOR SELECT USING (public.is_admin());

-- 8. PARENT PROFILES
CREATE TABLE public.parent_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  address_line1 text,
  address_line2 text,
  city text,
  postcode text,
  has_pets boolean DEFAULT false,
  pet_details text,
  property_type text,
  parking_available boolean DEFAULT true,
  funding_type text CHECK (funding_type IN ('self_paid','15_hours_free','30_hours_free','student_ccg','tax_free_childcare','childcare_grant')),
  local_authority text,
  sfe_reference text,
  ccg_details text,
  payment_method text,
  special_requirements text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.parent_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents manage own profile" ON public.parent_profiles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage all parent profiles" ON public.parent_profiles FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TRIGGER update_parent_profiles_updated_at BEFORE UPDATE ON public.parent_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. CHILDREN
CREATE TABLE public.children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date NOT NULL,
  gender text,
  health_issues text,
  allergies text,
  dietary_requirements text,
  special_needs text,
  emergency_contact_name text,
  emergency_contact_phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents manage own children" ON public.children FOR ALL USING (auth.uid() = parent_id) WITH CHECK (auth.uid() = parent_id);
CREATE POLICY "Admins manage all children" ON public.children FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TRIGGER update_children_updated_at BEFORE UPDATE ON public.children
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. INVOICES
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL UNIQUE,
  from_user_id uuid REFERENCES auth.users(id),
  to_user_id uuid REFERENCES auth.users(id),
  amount numeric(10,2) NOT NULL DEFAULT 0,
  tax numeric(10,2) DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
  due_date date,
  paid_date date,
  line_items jsonb DEFAULT '[]',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own invoices" ON public.invoices FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "Users create own invoices" ON public.invoices FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Admins manage all invoices" ON public.invoices FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. MESSAGES (in-app messaging)
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "Users send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users mark own messages read" ON public.messages FOR UPDATE USING (auth.uid() = recipient_id);
CREATE POLICY "Admins manage all messages" ON public.messages FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 12. NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  type text DEFAULT 'info',
  read boolean DEFAULT false,
  link text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins create notifications" ON public.notifications FOR INSERT WITH CHECK (public.is_admin());

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 13. COMPLIANCE DOCUMENTS
CREATE TABLE public.compliance_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  document_url text,
  status text DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','expired')),
  reviewed_by uuid REFERENCES auth.users(id),
  review_notes text,
  expires_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.compliance_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own compliance docs" ON public.compliance_documents FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage all compliance docs" ON public.compliance_documents FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TRIGGER update_compliance_documents_updated_at BEFORE UPDATE ON public.compliance_documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 14. HELPER: get user role function
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.user_roles WHERE user_id = p_user_id LIMIT 1;
$$;
