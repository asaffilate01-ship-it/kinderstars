CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

REVOKE ALL ON public.payment_webhook_events FROM anon, authenticated;
GRANT ALL ON public.payment_webhook_events TO service_role;
ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;