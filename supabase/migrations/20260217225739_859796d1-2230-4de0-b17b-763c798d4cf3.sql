
-- Subscriptions table for childminder billing
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan text NOT NULL DEFAULT 'free_trial',
  status text NOT NULL DEFAULT 'active',
  trial_ends_at timestamptz NOT NULL DEFAULT '2026-04-30T23:59:59Z',
  current_period_start timestamptz,
  current_period_end timestamptz,
  price_monthly numeric NOT NULL DEFAULT 4.99,
  currency text NOT NULL DEFAULT 'GBP',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscription"
ON public.subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users manage own subscription"
ON public.subscriptions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all subscriptions"
ON public.subscriptions FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
