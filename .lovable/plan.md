
# KinderStars DE — Phase 1 rebuild plan

Scope of this plan: **Phase 1 only** (Private in-home marketplace, Berlin + selected NRW cities). Phases 2–5 (employers/universities, Jugendamt/Jobcenter, Kita recruitment, regulated operation) are acknowledged in the data model and copy hooks but not built yet.

Everything UK-specific (Ofsted, DBS, GBP, en-GB, `.co.uk`, UK postcodes, community-language mix) is removed or replaced.

## 1. Brand, locale & SEO

- Primary language **de-DE**, secondary **en**. Drop cy/cs/sk/ro/ur/pl/ar bundles for now (can re-add Türkisch/Polnisch/Arabisch later); keep the i18n framework so it's easy to re-enable.
- `index.html`: `lang="de-DE"`, new title/description/OG, canonical `https://www.kinderstars.de/`, remove GA placeholder or keep as env-driven.
- Currency: EUR (€) everywhere.
- Address/geo model: replace UK postcodes with German **PLZ (5-digit)** + **Bundesland** + **Stadt/Kreis**. Seed only **Berlin** and **NRW** as active regions; other Bundesländer shown as "Bald verfügbar".
- Phone format: `+49`.

## 2. Terminology map (global find/replace + copy rewrite)

| UK term | DE replacement |
|---|---|
| Childminder | Betreuungsperson (generic) / Babysitter / Kinderfrau / Nanny / Kindertagespflegeperson (context-specific) |
| DBS check | erweitertes Führungszeugnis |
| Ofsted registered / Government approved | Jugendamt-anerkannt (only when actually true) |
| Paediatric first aid | Erste-Hilfe am Kind |
| Safeguarding | Kinderschutz |
| GDPR page | DSGVO / Datenschutzerklärung + Impressum (new) |
| Complaints procedure | Beschwerdeverfahren |
| Parent / Childminder portals | Eltern-Portal / Betreuer-Portal |

Care location constraint (per spec): **all care in the child's/parents' home**. Copy and booking flow must reflect this — no "at minder's home" option.

## 3. Directory & search

- Region filter: **Berlin** (with Bezirke) + **NRW** cities (Köln, Düsseldorf, Essen, Dortmund, Bochum, Duisburg, Wuppertal, Bonn, Münster, Aachen, Mönchengladbach, Krefeld, Bielefeld to start).
- Filter facets: care type (Babysitter, Kinderfrau, Nanny, Kindertagespflege), verification badges, languages spoken, availability (Abend/Wochenende/Schicht/Notfall), qualifications, age range of children, own transport.
- Autocomplete: swap UK postcode API for a German PLZ/city lookup (Nominatim/OpenPLZ — no key needed). Confirm before wiring.

## 4. Verification & badges (replace DBS/Ofsted set)

New badge system exactly per spec, stored per-minder as booleans + expiry dates:
- Identität verifiziert
- Arbeitserlaubnis geprüft
- Referenzen geprüft
- Erweitertes Führungszeugnis geprüft (+ expiry)
- Erste Hilfe am Kind gültig (+ expiry)
- KinderStars Kinderschutz-Schulung
- Qualifikation verifiziert
- Jugendamt-anerkannt (only settable by admin, per authority)

Rule enforced in code + copy: "government approved" wording is gated behind the Jugendamt flag.

Amiqus (UK KYC) is kept **only** for identity/right-to-work if it supports DE; otherwise stubbed behind a `KYC_PROVIDER` abstraction and a manual document upload flow for Führungszeugnis + certificates with admin review.

## 5. Plans, pricing & fees

Rebuild pricing pages to match the spec exactly.

**Minder plans:**
- Basic — kostenlos
- Verified — €9,99/Monat
- Professional — €19,99–€29,99/Monat
- Professional Plus — €39,99/Monat
- Jugendamt Ready — Setup-Gebühr + Monatsplan

Guardrail: keep Basic genuinely free and never gate "getting a job" behind a paid minder plan (§296 SGB III / employment-placement law). Paid plans sell tools, visibility, training, verification, invoicing.

**Parent plans:**
- Pay as you book — 12% Buchungsgebühr
- Family — €9,99/Monat + 6%
- Family Plus — €19,99/Monat + 3%
- Dauerhafte Nanny-Vermittlung — €299–€599 (parent/employer pays, not minder)
- Lohnabrechnung — €29–€49/Monat

Copy block on funded families: no undisclosed top-ups on publicly funded Kindertagespflege.

## 6. Payments (marketplace split)

Replace any direct-payment assumption with a **licensed marketplace provider** so LoungeTech never holds client money. Recommendation: **Stripe Connect** (Express accounts for minders, destination charges, EUR, SEPA + card). Alternatives noted: Adyen for Platforms, Mangopay.

Flow: parent pays → provider holds → split to minder + platform fee → invoices generated → refunds/chargebacks via provider. Requires Pro plan + Lovable Cloud; I'll set this up in a follow-up turn after you confirm the provider.

Booking record stores: gross, platform fee, minder net, VAT treatment, provider transfer IDs — needed for DAC7/PStTG reporting later.

## 7. Employment-status guardrail

New backend check: if the same parent books the same minder for **regular fixed hours over N weeks**, flag the booking pair and surface a banner:

> "Diese Buchung sieht nach einer regelmäßigen Anstellung aus. Wir empfehlen unsere Nanny-Vermittlung + Lohnabrechnung."

Routes the parent to the placement/payroll product instead of continuing as marketplace bookings (protects against Scheinselbständigkeit).

## 8. Au-pair — separate product surface

New route `/au-pair` clearly branded **KinderStars Au-pair-Vermittlung**, separate from the hourly marketplace. Copy reflects §296 SGB III (au-pair-paid fee capped at €150; host family pays). Au-pair profiles cannot be booked as hourly minders.

## 9. Kita recruitment — teaser only

Static "KinderStars für Kitas — Recruitment & Vermittlung geprüfter Fachkräfte" page. Explicit copy: **no** temporary staffing / no Arbeitnehmerüberlassung until AÜG structure exists. Lead-capture form only.

## 10. Legal & compliance pages (rewritten)

- **Impressum** (new, required by §5 TMG) — LoungeTech GmbH details.
- **Datenschutzerklärung** (DSGVO) — replaces UK GDPR page.
- **AGB** — platform terms, parent terms, minder terms, marketplace-payment disclosure, DAC7/PStTG notice.
- **Beschwerdeverfahren** — rewrite for DE.
- **Widerrufsbelehrung** for consumer bookings.
- Cookie banner: TTDSG-compliant (reject-all equal weight to accept).

Placeholder legal text clearly marked "Entwurf — vor Launch durch Anwalt prüfen lassen."

## 11. Data model changes (Lovable Cloud)

Migrations (single batch, RLS + GRANTs per rules):
- `profiles`: add `bundesland`, `plz`, `stadt`, replace `postcode` fields; add `preferred_language`.
- `minder_verifications`: badge booleans + `fuehrungszeugnis_expires_at`, `erste_hilfe_expires_at`, `jugendamt_approved_by`, `jugendamt_approved_at`.
- `plans`: seed new minder + parent plan rows in EUR.
- `bookings`: `gross_cents`, `platform_fee_cents`, `minder_net_cents`, `stripe_payment_intent`, `stripe_transfer_id`, `care_location` (locked to "family_home"), `is_recurring_flag`.
- `au_pair_profiles`: separate table, cannot join hourly bookings.
- `funding_sources` enum: `private | employer | university | jobcenter | jugendamt | agentur_fuer_arbeit | other`.

## 12. Copy hooks for later phases

Landing page includes a short "Für Arbeitgeber, Hochschulen, Jugendämter" strip with "Bald verfügbar" CTAs — no functional flow yet, just interest capture.

## 13. Explicit launch proposition (homepage hero + meta description)

> "KinderStars verbindet Familien in Berlin und NRW mit geprüften Betreuungspersonen für die Kinderbetreuung zu Hause. Eltern zahlen selbst oder mit Unterstützung von Arbeitgeber, Hochschule, Jobcenter oder Jugendamt. Wir übernehmen Matching, Buchung, Zahlung, Verifikation, Schulung und Compliance-Nachweise — öffentliche Förderung und amtliche Anerkennung bleiben Sache der zuständigen Behörde."

## Suggested execution order (each is one working turn)

1. Locale, brand, index.html, terminology sweep, drop unused i18n bundles, EUR, `/impressum` + `/datenschutz` skeletons.
2. Region/PLZ model + directory filters for Berlin + NRW; homepage + directory copy rewrite; care-location lock.
3. Verification badge system + admin review UI + Führungszeugnis/Erste-Hilfe expiry handling.
4. New pricing pages (minder + parent) + plan seed data + placement-law guardrails on minder plans.
5. Stripe Connect marketplace payments (needs Pro + your go-ahead) with fee split and invoices.
6. Recurring-booking employment-status detector + Nanny-placement/payroll product surface.
7. Au-pair separate product route.
8. Kita-recruitment teaser + employer/uni/Jugendamt teaser strip.
9. Full legal/AGB/Widerruf/cookie pass, DAC7 disclosures.

## Questions I need answered before I start

1. **Domain**: do you own `kinderstars.de`? (Affects canonical + email/Impressum.)
2. **Company details for Impressum** (LoungeTech GmbH address, HRB, Geschäftsführer, USt-IdNr., contact email) — can be placeholder until you send them.
3. **Payments provider**: confirm **Stripe Connect** (my recommendation) vs Adyen/Mangopay. Stripe needs a Pro plan; is the workspace on Pro?
4. **Amiqus**: do you want me to keep it for identity in DE, or replace with a stub + manual document review for now?
5. **Languages at launch**: German only, or German + English from day one? Any other languages you want live at Phase 1 (Türkisch? Arabisch? Polnisch?)?

Once you answer 1–5 (or say "your call"), I'll execute step 1 immediately.
