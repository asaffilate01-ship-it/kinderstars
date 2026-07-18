
ALTER TABLE public.expenses ADD COLUMN paid_by text NULL;
ALTER TABLE public.expenses ADD COLUMN reimbursed boolean NOT NULL DEFAULT false;
