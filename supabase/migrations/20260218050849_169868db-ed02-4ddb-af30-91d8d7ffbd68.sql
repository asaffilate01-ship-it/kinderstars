
-- Create contracts table
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID NOT NULL,
  contract_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  parent_name TEXT,
  parent_email TEXT,
  parent_phone TEXT,
  parent_address TEXT,
  parent_postcode TEXT,
  child_name TEXT,
  child_dob DATE,
  childminder_name TEXT,
  funding_ref TEXT,
  local_authority TEXT,
  employer_name TEXT,
  hours_per_week TEXT,
  rate_per_hour TEXT,
  start_date DATE,
  signed_at TIMESTAMP WITH TIME ZONE,
  signed_by_parent BOOLEAN DEFAULT false,
  signed_by_agency BOOLEAN DEFAULT false,
  expires_at DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins manage all contracts"
ON public.contracts FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Users view own contracts"
ON public.contracts FOR SELECT
USING (auth.uid() = created_by);

CREATE POLICY "Users create own contracts"
ON public.contracts FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users update own contracts"
ON public.contracts FOR UPDATE
USING (auth.uid() = created_by);

-- Timestamp trigger
CREATE TRIGGER update_contracts_updated_at
BEFORE UPDATE ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for status filtering
CREATE INDEX idx_contracts_status ON public.contracts(status);
CREATE INDEX idx_contracts_created_by ON public.contracts(created_by);
CREATE INDEX idx_contracts_contract_type ON public.contracts(contract_type);
