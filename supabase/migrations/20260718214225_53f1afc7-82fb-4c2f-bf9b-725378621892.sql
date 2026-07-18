CREATE TABLE public.jugendamt_lookups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jugendamt_name text NOT NULL,
  contact_email text NOT NULL,
  contact_name text,
  bundesland text,
  city text,
  plz text,
  purpose text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.jugendamt_lookups TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jugendamt_lookups TO authenticated;
GRANT ALL ON public.jugendamt_lookups TO service_role;

ALTER TABLE public.jugendamt_lookups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can submit jugendamt lookup"
ON public.jugendamt_lookups FOR INSERT
WITH CHECK (true);

CREATE POLICY "admins can read jugendamt lookups"
ON public.jugendamt_lookups FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid() AND ur.role IN ('admin'::public.app_role, 'owner'::public.app_role)
));

CREATE POLICY "admins can update jugendamt lookups"
ON public.jugendamt_lookups FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid() AND ur.role IN ('admin'::public.app_role, 'owner'::public.app_role)
));

CREATE TRIGGER update_jugendamt_lookups_updated_at
BEFORE UPDATE ON public.jugendamt_lookups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();