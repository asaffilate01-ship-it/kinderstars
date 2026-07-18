-- Add delivered column to messages for 3-tick system
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS delivered boolean DEFAULT false;