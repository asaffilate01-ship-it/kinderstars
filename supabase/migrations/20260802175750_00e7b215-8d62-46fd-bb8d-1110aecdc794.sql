DROP POLICY IF EXISTS "Anyone can look up by code" ON public.referral_codes;
DROP POLICY IF EXISTS "Users create referrals for themselves" ON public.referrals;

CREATE POLICY "Referrers create their own invitations"
ON public.referrals FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = referrer_user_id
  AND referred_user_id IS NULL
  AND bounty_cents = 0
  AND status = 'pending'
  AND trigger_event = 'signup'
);

REVOKE SELECT ON public.v_childminder_insurance_status FROM anon;