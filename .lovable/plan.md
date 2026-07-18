# KinderStars DE — Build Plan

Grounded in your spec. Executed in phases so each step is reviewable and shippable. Every step keeps the legal wording exact: **KinderStars Verified ≠ Jugendamt Approved**.

## Guiding rules baked into every phase
- Never render "staatlich anerkannt", "Jugendamt approved" or "government certified" on internal content.
- "Jugendamt Ready" is a preparation package, never shown as "Jugendamt Approved".
- Führungszeugnis: store outcome + date + reviewer + renewal date only, not the certificate PDF long-term.
- Child sensitive data (allergies, meds, collection list) never public — only visible to the assigned minder + parent.
- Location only during an active booking check‑in/out.
- Roles in a separate `user_roles` table with `has_role()` security-definer function.

---

## Phase 1 — Verification tiers & badges (foundation)
1. DB: `minder_verification` table with columns for every Level 1/2/3 checklist item + `tier` enum (`registered | verified | jugendamt_approved`), reviewer, timestamps, renewal dates.
2. Badge component with three visual states matching the tier; tooltip explains the legal meaning.
3. Public minder cards show badge only when tier is granted; Level 1 renders as "Registered — not yet verified".
4. Guard: Jugendamt Approved requires an uploaded confirmation document reference before the flag can be set (admin action, audit-logged).

## Phase 2 — Minder onboarding & compliance dashboard
1. Onboarding wizard mapped 1:1 to Level 1 checklist (identity, address, right-to-work, phone/email OTP, terms, safeguarding declaration).
2. Minder dashboard: profile builder, document vault, availability calendar, service radius, rates, languages, age-group experience, compliance score, certificate-expiry alerts.
3. Compliance admin queue: onboarding, identity, Führungszeugnis, references, qualifications, right-to-work, first-aid expiry, insurance, safeguarding flags, duplicate detection, decision + reason + audit trail.

## Phase 3 — Parent dashboard & booking
1. Family/child profiles with private fields (allergies, meds, authorised collection) never exposed publicly.
2. PLZ search + map, filters (age, language, qualification, verified tier, availability).
3. Instant + request bookings, recurring bookings, favourites, secure messaging, video intro request.
4. Check-in/out (location only during active booking), live status, incident reports, reviews, cancellations, complaints/safeguarding report entry point.

## Phase 4 — Payments & subscriptions
1. Licensed marketplace payments (Stripe Connect — enable via `enable_stripe_payments` when you're ready).
2. Parent booking fee split; minder payouts; invoices; tax export.
3. Subscription plans exactly as specified:
   - Verified Starter €79 one-off
   - Verified Plus €19.99/mo
   - Professional €34.99/mo
   - Jugendamt Ready €149 setup + €29.99/mo
4. Recurring-booking detector warning re: Scheinselbständigkeit.

## Phase 5 — KinderStars Academy
1. Course catalogue (all 18 courses from your list with the suggested prices), free + paid.
2. Learning paths per minder type; video lessons, written guide, scenario exercises, quiz, pass mark, certificate, expiry, version, audit trail.
3. "Certificate of Completion" wording only — never "Jugendamt approved".
4. Third-party course booking (paediatric first aid): provider price €45 / retail €59 / margin €14 model, expiry monitoring, booking block when required cert expires.

## Phase 6 — Safeguarding dashboard (restricted role)
Urgent reports, allegation category, risk level, suspension, booking cancellation, parent contact, Jugendamt/police escalation, chronology, evidence, assigned officer, actions, closure review, anonymised trends. Access gated by `safeguarding_officer` role only.

## Phase 7 — Employer / University portal
Employee eligibility, childcare-credit allocation, budgets, approved categories, authorisations, anonymised utilisation, invoices, cost centres, SLA reporting. No child/family PII beyond billing + eligibility.

## Phase 8 — Jugendamt / public-body dashboard (pilot-gated)
Only exposed to accounts with a `public_body` role after a pilot agreement is recorded. Approved families, approved hours, minders, auth numbers, attendance, funding limits, invoices, case status, safeguarding notifications, document expiry, audit exports.

## Phase 9 — Super-admin (LoungeTech)
Users/roles, subscriptions, fees, payouts, refunds, chargebacks, training revenue, third-party commissions, cities, funding schemes, CMS, complaints, fraud, DSGVO requests, consent records, retention, analytics, DAC7/PStTG reporting, VAT export, system health, immutable audit log.

## Phase 10 — Mobile-ready polish
Responsive web is priority; native apps (React Native) are a later track. In-web equivalents built now: PWA install, push permission scaffold, biometric-login placeholder abstraction, emergency-report button, calendar sync (ICS export).

---

## Technical notes
- Roles table pattern (`user_roles` + `app_role` enum + `has_role()`) already required by our security rules — every new dashboard checks role via that function in RLS.
- Document vault: private storage bucket, signed URLs only, retention policy per doc type (Führungszeugnis outcome retained, PDF purged after review window).
- Audit log: append-only table, `service_role` insert, admin read via security-definer function.
- Feature flags per city (Berlin, NRW) so we can enable/disable geographic scope without redeploys.
- All copy shipped in `de.json` + `en.json`; the other languages (tr/ar/ur/uk/ru) inherit English fallback until translated.

## Recommended first build (this turn, on your approval)
**Phase 1 in full** — the verification tier model + badge is the legal spine of the platform and unblocks every other phase. Roughly:
- Migration: `verification_tier` enum, `minder_verification` table with the Level 1/2/3 checklist columns, RLS + GRANTs, audit trigger.
- `<VerificationBadge tier="..." />` component + tier legend page `/verifizierung`.
- Admin action to promote tier with required-evidence guard.
- Wire the badge into existing minder profile cards.

Say "start phase 1" (or name a different phase) and I'll build it in the next turn.
