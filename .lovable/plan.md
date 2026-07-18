

# Comprehensive Platform Update Plan

This plan addresses all the requested changes across the KinderStars platform. Due to the volume of work, it is broken into prioritized phases.

---

## Phase 1: Critical Fixes and Core Flow Changes

### 1.1 Remove Homepage Childminder Search
- Remove the `DirectorySection` component from `Index.tsx` (the `#directory` section)
- Update `HeroSection.tsx`: Change "Search Childminders" button to "Register Now" linking to `/auth`
- Change "Enquire Now" style buttons to "Register Now" across the homepage
- Update the "Can't find" / "Ask KinderStars" links to say "Register & Get Help" pointing to `/auth`

### 1.2 Display User Name Instead of Email
- In `AdminDashboard.tsx` header (line 684), change `{user?.email}` to show the user's first name from metadata: `{user?.user_metadata?.first_name || user?.email}`
- Apply same pattern to `ChildminderPortal.tsx` and `ParentPortal.tsx` headers

### 1.3 Contact Form SMTP Integration
- Create a new edge function `send-contact-email` that sends form submissions directly to `info@kinderstars.co.uk` via the existing Resend integration
- Update `ContactSection.tsx` to call this edge function instead of showing "form not connected"
- All email functions already use Resend -- this is SMTP-equivalent for the site. No third-party is needed since Resend delivers from your domain.

### 1.4 Preferred Payment Method -- Self-Funded Only
- In `ParentProfile.tsx`, add a `payment_method` field but only show it when the parent's funding type is "self_funded" or "private"
- For SFE, Local Authority, and Employer funded parents, remove payment method selection and display: "KinderStars will invoice the relevant funding body directly."

---

## Phase 2: Registration and Onboarding Overhaul

### 2.1 Childminder Registration Flow ("Join KinderStars")
- Create a dedicated registration page at `/register/childminder` with extended fields:
  - Personal details (name, email, phone, address, postcode)
  - Right to work confirmation
  - DBS status (yes/no, number if yes)
  - Experience summary
  - Availability preferences
- On submission: Create the auth account, send registration details directly to `info@kinderstars.co.uk` via the `send-email` edge function, and redirect to login
- After first login: Force redirect to `/childminder/onboarding` until onboarding status is "verified"

### 2.2 Parent Registration with KYC
- Enhance parent signup to collect ID verification details
- Add parent onboarding checklist (similar to childminder):
  - Verify identity (upload ID document)
  - Emergency contact details
  - Confirm address
  - Accept safeguarding policy
  - DBS (if applicable for supervised visits)
- Gate access to childminder search until parent onboarding is complete

### 2.3 Mandatory Onboarding Gate
- In `ChildminderPortal.tsx` and `ParentPortal.tsx`, add a check: if onboarding is incomplete, force redirect to the onboarding page
- Users cannot access any portal features until onboarding is verified by admin

---

## Phase 3: Admin Dashboard Enhancements

### 3.1 User Creation in Admin Dashboard
- Move the "Create User" functionality directly into the Admin Dashboard sidebar (currently at `/admin/create-user`)
- Add it as a new sidebar tab "Create User" under People section
- Include role selection with required permissions for each role type

### 3.2 MFA Management by Admin
- Add an MFA section in the Admin Dashboard where admin can:
  - View which users have MFA enabled
  - Enforce MFA for specific roles or all users
  - Reset MFA for users who lose access
- Remove MFA self-setup from user Settings pages (admin controls MFA enrollment)
- Update `MFASetup.tsx` to be admin-only, showing a message to users that MFA is managed by KinderStars

### 3.3 MFA for All Login Types
- Ensure MFA verification is triggered after login for all roles (admin, childminder, parent)
- The existing `MFAVerify` component already handles this in `Auth.tsx` -- verify it works for all role types

### 3.4 Subscription Page Fix for Childminders
- Debug and fix `SubscriptionPage.tsx` -- currently not showing for childminders
- Add annual subscription toggle:
  - Monthly: £4.99/month
  - Annual: £49.90/year (2 months free, equivalent to 10 months)
- Add toggle switch between monthly and annual plans
- Update the subscription database to support `plan: "annual"` alongside "monthly" and "free_trial"

### 3.5 Roster: Parent and Minder Tabs with Drag-Drop
- In the Gantt scheduler, add two side panels:
  - **Minders tab**: List of available childminders that can be dragged onto the timeline
  - **Parents tab**: List of parents/children that can be dragged onto shift slots
- Enable dropping both parents and minders onto the scheduler grid
- Conflict detection for:
  - Double-booked childminders (existing)
  - Double-booked children (new) -- flag if same child assigned to two shifts at same time
  - Multi-minder support: allow two minders on one shift with a visual indicator
  - Multi-parent booking: allow multiple parent bookings on the same childminder slot

### 3.6 Safeguarding, GDPR & Incident Logs
- Add new sidebar sections in Admin Dashboard:
  - **Safeguarding**: Safeguarding protocols, concern reporting, referral tracking
  - **Incident Log**: Record and track incidents with date, type, involved parties, actions taken, outcome
  - **GDPR Compliance**: Data subject requests log, data retention tracking, consent records
- Database migration: Create `incidents` and `gdpr_requests` tables with RLS (admin only)

### 3.7 Contract Templates
- Add predefined contract templates to the Contracts tab:
  - SFE/CCG childcare contract
  - Local authority funding agreement
  - Private/self-funded parent contract
  - Childminder employment agreement
  - Employer-funded childcare contract
- Templates auto-fill with parent/childminder/child details from the database

### 3.8 Seed 200 Dummy Parents and Children
- Update the `seed-demo-data` edge function to create approximately 200 parent profiles with corresponding children
- Use realistic UK names, addresses, and postcodes
- Include a mix of funding types (SFE, LA, self-funded, employer)

---

## Phase 4: Email & Communication

### 4.1 All Emails Via Site SMTP
- Verify all edge functions (`send-email`, `send-welcome-email`, `send-notification`, `check-compliance-expiry`, `check-contract-expiry`) route through the single Resend integration
- The Resend API key is already configured -- this is your SMTP equivalent
- Add a "Contact Us" email trigger from the homepage contact form
- Ensure the childminder registration form sends directly to your email

---

## Technical Details

### Database Changes (Migrations)
```text
1. CREATE TABLE public.incidents (
     id uuid PK, reporter_id uuid, incident_date timestamptz,
     incident_type text, description text, persons_involved text,
     actions_taken text, outcome text, status text DEFAULT 'open',
     created_at timestamptz, updated_at timestamptz
   ) + RLS (admin only)

2. CREATE TABLE public.gdpr_requests (
     id uuid PK, user_id uuid, request_type text,
     status text DEFAULT 'pending', notes text,
     completed_at timestamptz, created_at timestamptz
   ) + RLS (admin only)

3. ALTER TABLE subscriptions ADD COLUMN billing_period text DEFAULT 'monthly';
```

### Files to Create
- `src/pages/RegisterChildminder.tsx` -- Standalone registration page
- `supabase/functions/send-contact-email/index.ts` -- Contact form handler

### Files to Modify (Major)
- `src/pages/Index.tsx` -- Remove directory, update CTAs
- `src/components/HeroSection.tsx` -- Register Now button
- `src/components/ContactSection.tsx` -- SMTP integration
- `src/pages/AdminDashboard.tsx` -- Add safeguarding/incidents/GDPR tabs, user creation, MFA management, roster parent+minder tabs, contract templates
- `src/pages/portal/SubscriptionPage.tsx` -- Annual toggle, fix display
- `src/pages/portal/MFASetup.tsx` -- Admin-only messaging
- `src/pages/portal/ParentProfile.tsx` -- Conditional payment method
- `src/pages/portal/FindChildminder.tsx` -- Remove DBS/Ofsted from display (already done)
- `src/pages/Auth.tsx` -- Registration flow updates
- `src/pages/ChildminderPortal.tsx` -- Onboarding gate, display name
- `src/pages/ParentPortal.tsx` -- Onboarding gate, display name
- `src/App.tsx` -- Add new routes
- `supabase/functions/seed-demo-data/index.ts` -- 200 dummy parents/children

### Edge Function Updates
- `send-contact-email` (new) -- Sends contact form submissions to info@kinderstars.co.uk
- `seed-demo-data` -- Expand to include 200 parents with children

