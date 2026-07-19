-- KinderStars DE — booking state machine v2 (licensed marketplace flow)

DO $$ BEGIN
  CREATE TYPE public.booking_flow_status AS ENUM (
    'requested','accepted','authorized','in_progress','completed',
    'captured','paid_out','declined','cancelled','disputed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS flow_status public.booking_flow_status NOT NULL DEFAULT 'requested',
  ADD COLUMN IF NOT EXISTS hourly_rate_cents INTEGER,
  ADD COLUMN IF NOT EXISTS total_amount_cents INTEGER,
  ADD COLUMN IF NOT EXISTS platform_fee_cents INTEGER,
  ADD COLUMN IF NOT EXISTS minder_payout_cents INTEGER,
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT,
  ADD COLUMN IF NOT EXISTS check_in_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS check_out_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS actual_hours NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS authorized_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS captured_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paid_out_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS parent_rating SMALLINT CHECK (parent_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS parent_review TEXT;

CREATE TABLE IF NOT EXISTS public.booking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  from_status public.booking_flow_status,
  to_status public.booking_flow_status,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.booking_events TO authenticated;
GRANT ALL ON public.booking_events TO service_role;

ALTER TABLE public.booking_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "booking_events read own" ON public.booking_events
    FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.bookings b
        WHERE b.id = booking_id
          AND (b.parent_id = auth.uid() OR b.childminder_id = auth.uid())
      )
      OR public.is_admin()
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "booking_events insert own" ON public.booking_events
    FOR INSERT TO authenticated
    WITH CHECK (
      actor_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.bookings b
        WHERE b.id = booking_id
          AND (b.parent_id = auth.uid() OR b.childminder_id = auth.uid())
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "booking_events admin all" ON public.booking_events
    FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE VIEW public.recurring_engagement_flags AS
  SELECT
    parent_id,
    childminder_id,
    COUNT(*) AS bookings_last_30d,
    SUM(COALESCE(actual_hours, 0)) AS hours_last_30d,
    MIN(booking_date) AS first_date,
    MAX(booking_date) AS last_date
  FROM public.bookings
  WHERE flow_status IN ('completed','captured','paid_out')
    AND booking_date >= (CURRENT_DATE - INTERVAL '30 days')
  GROUP BY parent_id, childminder_id
  HAVING COUNT(*) >= 3;

CREATE INDEX IF NOT EXISTS bookings_flow_status_idx ON public.bookings(flow_status);
CREATE INDEX IF NOT EXISTS bookings_parent_id_idx ON public.bookings(parent_id);
CREATE INDEX IF NOT EXISTS bookings_childminder_id_idx ON public.bookings(childminder_id);
CREATE INDEX IF NOT EXISTS booking_events_booking_idx ON public.booking_events(booking_id, created_at DESC);