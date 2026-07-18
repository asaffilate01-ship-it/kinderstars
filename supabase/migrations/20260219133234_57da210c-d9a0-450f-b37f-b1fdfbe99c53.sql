
-- Add contract template versioning columns
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS template_version integer NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS clauses_snapshot jsonb DEFAULT NULL;

-- Comment explaining the purpose
COMMENT ON COLUMN public.contracts.template_version IS 'Version number of the contract template at time of creation';
COMMENT ON COLUMN public.contracts.clauses_snapshot IS 'Frozen copy of contract clauses at time of signing, so template updates do not affect signed contracts';
