# KinderStars go-live checklist

No production launch may proceed until every blocking item is checked and evidenced.

## Automated release gates

- [ ] GitHub `Quality gates / verify` passes on the exact release commit.
- [ ] `npm ci`, type-check, lint, tests and production build pass from a clean checkout.
- [ ] High dependency advisories are fixed or documented with owner, exposure and expiry date.
- [ ] Parent, childminder and admin Playwright journeys pass on desktop and mobile.
- [ ] Supabase migrations are rehearsed against a fresh staging database.

## Security and privacy

- [ ] RLS tests prove anonymous, parent, childminder, admin and owner isolation.
- [ ] `ALLOWED_ORIGINS` contains only production and approved staging domains.
- [ ] Demo seeding is unavailable to non-admin users and disabled in production operations.
- [ ] Upload size, MIME, extension and malware controls are enabled.
- [ ] Stripe, Amiqus and training webhooks verify signatures and are idempotent.
- [ ] Data retention, export and erasure procedures have been exercised.
- [ ] CSP and other headers are verified on the actual hosting response.

## External services

- [ ] Supabase functions and secrets are deployed to the production project.
- [ ] Stripe live products, price lookup keys, webhook endpoint and refunds are tested.
- [ ] Resend sending domain has SPF, DKIM and DMARC configured.
- [ ] Amiqus production credentials and callback URL are verified.
- [ ] Scheduled compliance/contract expiry functions are enabled and monitored.

## Legal and operational

- [ ] Impressum placeholders are replaced with confirmed company information.
- [ ] Datenschutz, AGB, cancellation/refund and complaints wording is legally reviewed.
- [ ] Safeguarding escalation owner and response SLA are documented.
- [ ] Backups, point-in-time recovery and a restore exercise are evidenced.
- [ ] Error monitoring, uptime checks and alert recipients are configured.
- [ ] Rollback and incident-response runbooks are rehearsed.

## Release evidence

Record the release commit, CI run, deployment URL, migration version, smoke-test result, approver and rollback version in the release notes.
