# Phase 4 — green CI, production safety and release evidence

## Delivered

- Fixed the Playwright homepage assertion to test the current registration journey.
- Moved the PWA build plugin out of production dependencies, removing the high-severity Vite advisory from the production audit.
- Made the high-severity dependency audit a blocking CI gate.
- Updated GitHub Actions to Node 24-compatible major versions.
- Disabled demo seeding by default, restricted it to owners and removed all hard-coded demo passwords.
- Removed service-worker caching of private Supabase Storage responses.
- Added a user-friendly application crash boundary.
- Corrected public PWA and flyer copy from UK funding/childcare claims to the German service.
- Added a manually approved production smoke workflow with downloadable release evidence.

## After upload

1. Confirm `Quality gates` is green on the new commit.
2. Keep `ENABLE_DEMO_SEEDING` unset in production. If staging needs it, set a unique 14+ character `DEMO_USER_PASSWORD` and remove the flag after seeding.
3. Create a protected GitHub Environment named `production` with a required reviewer.
4. Run `Production smoke evidence` with the exact HTTPS deployment URL after every production deployment.
5. Download and retain the generated evidence artifact with the release approval record.

## Remaining external blockers

- Replace the Impressum placeholders with confirmed German company details.
- Correct the inconsistent company address in all translated legal documents after legal-entity confirmation.
- Complete authenticated staging acceptance tests for parent, childminder and owner roles.
- Prove Stripe capture, refund, dispute and payout behaviour in live mode.
- Configure malware scanning, monitoring alerts, email DNS and backup/restore evidence.
