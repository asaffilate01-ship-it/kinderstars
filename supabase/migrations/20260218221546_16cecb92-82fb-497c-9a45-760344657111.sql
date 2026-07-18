
-- Add assigned_to column to contracts so contracts can be linked to the parent/childminder/trainee user
ALTER TABLE public.contracts ADD COLUMN assigned_to uuid;

-- Add RLS policy so assigned users can view contracts assigned to them
CREATE POLICY "Assigned users view own contracts"
ON public.contracts
FOR SELECT
USING (auth.uid() = assigned_to);
