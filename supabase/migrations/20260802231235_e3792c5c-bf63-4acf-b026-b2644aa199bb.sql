-- Dedicated provider identifier avoids searching free-text review notes.
ALTER TABLE public.compliance_documents
  ADD COLUMN IF NOT EXISTS external_provider_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS compliance_documents_external_provider_id_key
  ON public.compliance_documents (external_provider_id)
  WHERE external_provider_id IS NOT NULL;

-- Financial completion may only be written by service-role Edge Functions.
CREATE OR REPLACE FUNCTION public.protect_booking_payment_state()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'authenticated' AND (
    NEW.flow_status IN ('captured', 'paid_out')
    OR NEW.stripe_payment_intent_id IS DISTINCT FROM OLD.stripe_payment_intent_id
    OR NEW.stripe_transfer_id IS DISTINCT FROM OLD.stripe_transfer_id
    OR NEW.captured_at IS DISTINCT FROM OLD.captured_at
    OR NEW.paid_out_at IS DISTINCT FROM OLD.paid_out_at
  ) THEN
    RAISE EXCEPTION 'Payment state must be changed by the secure payment service';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_booking_payment_state ON public.bookings;
CREATE TRIGGER protect_booking_payment_state
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.protect_booking_payment_state();