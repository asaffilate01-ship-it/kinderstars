
-- Add e-signature fields to contracts table
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS parent_signature_data text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS parent_signature_type text; -- 'typed' or 'drawn'
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS agency_signature_data text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS agency_signature_type text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS signed_by_parent_at timestamptz;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS signed_by_agency_at timestamptz;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS parent_eligibility_code text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS ofsted_urn text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS payment_source text; -- 'sfe_ccg', 'local_authority', 'employer', 'self_funded'
