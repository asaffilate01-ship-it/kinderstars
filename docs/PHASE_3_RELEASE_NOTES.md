# Phase 3 — payments, webhooks, uploads and health

## Delivered

- Upload allowlists and size limits are enforced in both the browser and Supabase Storage.
- SVG, executable, mismatched-MIME and oversized uploads are rejected.
- Checkout no longer accepts arbitrary Stripe price IDs from a browser.
- Paid courses are resolved from trusted database records.
- Booking totals are calculated server-side and use manual Stripe capture.
- Stripe fulfils bookings and paid training only after a verified checkout event.
- Stripe event receipts make webhook replays idempotent.
- Amiqus now verifies the documented `X-AQID-Signature` HMAC and fails closed.
- An authenticated operational health endpoint checks database and required production secrets.

## Production deployment order

1. Apply `20260802203000_harden_storage_uploads.sql`.
2. Apply `20260802204500_add_payment_webhook_receipts.sql`.
3. Set `ALLOWED_ORIGINS`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
   `AMIQUS_WEBHOOK_SECRET`, `RESEND_API_KEY` and a random `HEALTH_CHECK_TOKEN`.
4. Deploy `create-checkout`, `stripe-webhook`, `amiqus-webhook` and `health`.
5. Register Stripe endpoint `/functions/v1/stripe-webhook` for
   `checkout.session.completed` and copy its signing secret.
6. Register Amiqus endpoint `/functions/v1/amiqus-webhook` and copy its shared secret.
7. Run a Stripe test-mode booking and course purchase; verify exactly one database fulfilment per event.
8. Configure uptime monitoring to call `/functions/v1/health` with `X-Health-Token`.

## Still requires owner/vendor evidence

- Capture, cancellation, refund, dispute and payout flows need live-mode acceptance tests.
- Malware scanning needs a scanning provider or quarantine worker; MIME/size controls alone do not scan content.
- Legal text, production DNS/email authentication, backup restore and incident drills remain operational blockers.
