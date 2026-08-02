-- Make provider webhook processing retry-safe instead of permanently consuming
-- an event before its business transaction has completed.
ALTER TABLE public.payment_webhook_events
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'completed',
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_error TEXT;
UPDATE public.payment_webhook_events SET processed_at = created_at WHERE processed_at IS NULL;
ALTER TABLE public.payment_webhook_events ALTER COLUMN status SET DEFAULT 'processing';
ALTER TABLE public.payment_webhook_events DROP CONSTRAINT IF EXISTS payment_webhook_events_status_check;
ALTER TABLE public.payment_webhook_events ADD CONSTRAINT payment_webhook_events_status_check
  CHECK (status IN ('processing', 'completed', 'failed'));

ALTER TABLE public.malware_scan_events
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'completed',
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_error TEXT;
UPDATE public.malware_scan_events SET processed_at = received_at WHERE processed_at IS NULL;
ALTER TABLE public.malware_scan_events ALTER COLUMN status SET DEFAULT 'processing';
ALTER TABLE public.malware_scan_events DROP CONSTRAINT IF EXISTS malware_scan_events_status_check;
ALTER TABLE public.malware_scan_events ADD CONSTRAINT malware_scan_events_status_check
  CHECK (status IN ('processing', 'completed', 'failed'));

ALTER TABLE public.cpd_records ADD COLUMN IF NOT EXISTS source_ref TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS cpd_records_source_ref_key
  ON public.cpd_records (source_ref) WHERE source_ref IS NOT NULL;