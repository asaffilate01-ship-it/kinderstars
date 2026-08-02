-- Phase 6: safe childminder discovery and enforceable malware quarantine.
DROP VIEW IF EXISTS public.childminder_public_profiles;
CREATE VIEW public.childminder_public_profiles
WITH (security_invoker = false, security_barrier = true) AS
SELECT id, user_id, postcode_district, town, max_children, age_groups,
  experience_years, bio, hours, days, languages, ofsted_rating, regulator,
  is_available, is_live, onboarding_status, created_at, updated_at
FROM public.childminder_profiles
WHERE is_available = true AND is_live = true AND onboarding_status = 'verified';
REVOKE ALL ON public.childminder_public_profiles FROM PUBLIC, anon;
GRANT SELECT ON public.childminder_public_profiles TO authenticated;
DROP POLICY IF EXISTS "Authenticated users view available childminder profiles" ON public.childminder_profiles;
DROP POLICY IF EXISTS "Authenticated users view available childminder profiles via view" ON public.childminder_profiles;

ALTER TABLE public.compliance_documents ADD COLUMN IF NOT EXISTS malware_scan_status text,
  ADD COLUMN IF NOT EXISTS malware_scanned_at timestamptz,
  ADD COLUMN IF NOT EXISTS malware_scanner_ref text;
UPDATE public.compliance_documents SET malware_scan_status = CASE WHEN document_url IS NULL THEN 'not_required' ELSE 'legacy_accepted' END WHERE malware_scan_status IS NULL;
ALTER TABLE public.compliance_documents ALTER COLUMN malware_scan_status SET DEFAULT 'pending', ALTER COLUMN malware_scan_status SET NOT NULL;
ALTER TABLE public.compliance_documents DROP CONSTRAINT IF EXISTS compliance_documents_malware_scan_status_check;
ALTER TABLE public.compliance_documents ADD CONSTRAINT compliance_documents_malware_scan_status_check CHECK (malware_scan_status IN ('pending','clean','infected','error','not_required','legacy_accepted'));

DROP POLICY IF EXISTS "Users create pending compliance docs" ON public.compliance_documents;
CREATE POLICY "Users create pending compliance docs" ON public.compliance_documents FOR INSERT TO authenticated WITH CHECK (
 auth.uid() = user_id AND status = 'pending' AND reviewed_by IS NULL AND review_notes IS NULL
 AND malware_scan_status = 'pending' AND malware_scanned_at IS NULL AND malware_scanner_ref IS NULL
 AND document_url LIKE auth.uid()::text || '/%' AND document_url ~* '\.(pdf|jpe?g|png)$');

CREATE OR REPLACE FUNCTION public.enforce_clean_compliance_approval() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF NEW.status = 'approved' AND NEW.document_url IS NOT NULL AND NEW.malware_scan_status NOT IN ('clean','legacy_accepted') THEN
  RAISE EXCEPTION 'Compliance document cannot be approved before a clean malware scan';
 END IF;
 RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS enforce_clean_compliance_approval ON public.compliance_documents;
CREATE TRIGGER enforce_clean_compliance_approval BEFORE INSERT OR UPDATE ON public.compliance_documents FOR EACH ROW EXECUTE FUNCTION public.enforce_clean_compliance_approval();

CREATE TABLE IF NOT EXISTS public.malware_scan_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), provider_event_id text NOT NULL UNIQUE,
 document_id uuid NOT NULL REFERENCES public.compliance_documents(id) ON DELETE CASCADE,
 result text NOT NULL CHECK (result IN ('clean','infected','error')), scanner_ref text,
 received_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.malware_scan_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.malware_scan_events FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.malware_scan_events TO service_role;