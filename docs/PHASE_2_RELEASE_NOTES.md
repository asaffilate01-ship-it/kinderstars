# KinderStars production upgrade — Phase 2

## Included

- Node 22 runtime alignment for local development and GitHub Actions.
- Controlled Dependabot minor/patch updates; breaking majors require a dedicated compatibility branch.
- Playwright desktop and mobile Chromium smoke journeys in CI.
- Anonymous parent and childminder portal guard tests.
- Public, legal and unknown-route browser checks.
- Server-side referral claiming after authenticated login.
- Referral codes are no longer enumerable by every client.
- Clients can no longer attach arbitrary referred users or bounty amounts.
- Anonymous insurance-status metadata access is revoked.
- RLS regression tests protect these rules from accidental rollback.

## Deployment order

1. Apply `supabase/migrations/20260802190000_harden_referrals_and_insurance.sql`.
2. Set `ALLOWED_ORIGINS` for the production Supabase project.
3. Deploy the `claim-referral` Edge Function.
4. Deploy the frontend.
5. Confirm the GitHub `Quality gates` workflow, including both Playwright projects.

## Still external/blocking

- Replace all Impressum placeholders with confirmed legal entity details.
- Validate Stripe live products, webhooks, refunds and reconciliation.
- Exercise Supabase backup restore and rollback.
- Configure production monitoring, email DNS and alert ownership.
- Add authenticated staging journeys using dedicated parent, childminder and admin test accounts.
