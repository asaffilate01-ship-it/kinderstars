## KinderStars DE revenue model — build plan

Turn your pricing spec into working product surfaces. Split across turns to stay safe.

### Turn 1 — Subscription plans (rewrite `SubscriptionPage`)
Replace UK £-based Basic monthly/annual with the three-tier German model:

| Plan | Price | Notes |
|---|---|---|
| KinderStars Frei | €0 | Free registration, no unsupervised bookings |
| Compliance Plus | €14.99/mo (€149/yr) | Docs vault, reminders, refresher, earnings reports |
| Professional Compliance | €29.99/mo (€299/yr) | + Academy Complete + Jugendamt Ready prep + priority reviews |

- Add "€79 initial KinderStars Verified" as a one-off product shown above the recurring plans.
- Rewrite all £ copy → €, remove UK trial-end date, use `de-DE` date locale.
- Update Stripe `price_key` map (6 keys). New prices created inside Stripe are a separate follow-up — I'll leave TODO placeholders keyed by name so we can slot IDs in when payments are enabled.

### Turn 2 — Verification fee flow
- New `/portal/verifizierung/bestellen` page: €79 KinderStars Verified checkout with the 8-item scope list from the spec and the "not a government clearance" disclaimer.
- Gate "accept unsupervised bookings" behind `verification_tier >= verified`.
- Add renewal reminder (12-month expiry field on `minder_verification`).

### Turn 3 — KinderStars Academy catalogue
- New `/portal/akademie` page + `academy_courses` and `academy_enrollments` tables.
- Seed the 12 courses + 6 bundles from the spec with the exact €19–€149 pricing.
- Per-user progress, certificate PDF (KinderStars-branded, explicitly "professional-development certificate, not a state-recognised qualification").
- Bundle → auto-enrol into member courses.
- Included free for Professional Compliance subscribers.

### Turn 4 — Third-party course referrals
- New `partner_courses` table (paediatric first aid, QHB, German language, translations, tax courses).
- `/portal/externe-kurse` list with partner logo, price, "Buchen" button that hits partner URL with tracking token.
- Log referral clicks + completions; admin can record commission received.

### Turn 5 — Jugendamt Ready service
- €149 assessment product on `/portal/jugendamt-ready`.
- Structured checklist (qualifications review, missing docs, training pathway, application pack, appointment prep, evidence folder).
- €19.99/mo or €29.99/mo add-on for ongoing monitoring.
- Clear disclaimer: "KinderStars stellt keine Jugendamt-Anerkennung aus."

### Turn 6 — First-aid group sessions
- `first_aid_sessions` table (date, trainer, venue, capacity, seat price, cost).
- Public `/erste-hilfe` booking page — seat reservation flow.
- Auto-refresher reminder 22 months after completion.

### Turn 7 — Partner/insurance directory
- Simple `/partner` directory with categories (insurance, tax, payroll, pension, translation, first aid).
- Framed as advertising/introductions only — no commission-arranged insurance sales (regulatory guardrail from the spec).

### Turn 8 — Employer / B2B compliance portal
- New role `employer` + `employer_organisations` table.
- `/employer` dashboard: linked minders, compliance status matrix, invoice export.
- Pricing tier €199 / €499 / €999 monthly (shown on public `/fuer-arbeitgeber` landing).

### Turn 9 — Compliance SaaS white-label (later)
- Placeholder marketing page `/saas` with the four tiers (€99 / €299 / €750–2000 / bespoke) and a "Demo anfragen" form → super-admin inbox.
- No product build in this pass — landing + lead capture only.

### Turn 10 — Admin & revenue reporting
- Super-admin `/admin/umsatz` page: MRR, verification sales, course sales, referral commissions, Jugendamt Ready pipeline.
- Illustrative-1000-minders projection table from your spec, seeded with live numbers where available.

---

### Technical notes
- All prices live in a single `src/lib/pricing.ts` (EUR, VAT-inclusive shown, `Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })`).
- Stripe price IDs stored in a `stripe_prices` table so we can swap sandbox→live without redeploying.
- Every certificate/badge shipped by KinderStars includes the standard disclaimer sentence in de + en locales.
- New tables get grants + RLS per project conventions.

---

### Confirm before I start
1. Start with **Turn 1 (subscription plans)** now?
2. Payments: shall I switch the project to **Lovable-managed Stripe** (`enable_stripe_payments`) so Turn 1's price IDs are real? Requires Pro plan. If not now, I'll keep TODO placeholders.
3. Anything to drop from the 10-turn list, or change ordering?
