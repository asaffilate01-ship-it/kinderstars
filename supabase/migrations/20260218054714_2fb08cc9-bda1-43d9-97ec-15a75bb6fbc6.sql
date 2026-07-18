
-- Add paid_to and is_paid columns to expenses
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS paid_to text;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS is_paid boolean NOT NULL DEFAULT false;
