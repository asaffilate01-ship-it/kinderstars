# Phase 7 — retry-safe integrations and release-source hardening

## Delivered

- Stripe payment events now move through processing, completed and failed states. Failed events can be safely retried instead of being discarded as duplicates.
- Malware scan callbacks use the same retry-safe lifecycle.
- Partner training completion writes the correct `completed_date` field and uses a unique provider source reference, preventing duplicate CPD credits.
- Environment-specific frontend configuration is removed from release source and replaced by a blank `.env.example`.
- CI now checks production-source invariants and scans Git history with Gitleaks.
- Automated payment security coverage increases from 19 to 21 total unit/regression tests.

## Deployment

1. Apply `20260803010000_retry_safe_webhooks.sql`.
2. Deploy `stripe-webhook`, `malware-scan-webhook`, and `partner-training-webhook`.
3. Set the three `VITE_SUPABASE_*` values in the hosting provider rather than committing `.env`.
4. Deliver one Stripe failure/retry, one duplicate Stripe delivery, one malware failure/retry, and one duplicate training completion in staging.
5. Confirm GitHub `Quality gates`, `dependency-audit`, and `secret-scan` are green on the release commit.

## Remaining launch blockers

- Replace all Impressum company placeholders with legally confirmed details.
- Complete legal review of privacy, terms, cancellation/refund, safeguarding and complaints material.
- Execute production-like acceptance journeys for parent, childminder, admin and Jugendamt/employer roles.
- Configure and evidence monitoring, backups/restore, alerting, provider credentials, email-domain authentication, Stripe live-mode reconciliation and rollback.
- Run the production smoke workflow against the final HTTPS deployment.
