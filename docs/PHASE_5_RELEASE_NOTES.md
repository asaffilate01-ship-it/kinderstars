# Phase 5 — compliance authorization and upload hardening

## Delivered

- Replaces broad owner `FOR ALL` access on compliance records with least-privilege select, insert and delete policies.
- Prevents users from self-approving documents or setting reviewer fields through the Supabase API.
- Prevents deletion of approved compliance files through direct Storage API calls.
- Enforces the 10 MB file limit and PDF/JPEG/PNG MIME allow-list at the storage bucket, not only in the browser.
- Removes orphaned private files if database record creation fails.
- Adds regression coverage to the standard CI test suite.

## Deployment

1. Apply `20260802213000_harden_compliance_uploads.sql` to staging.
2. Verify a parent and childminder can upload, view and delete a pending document.
3. Verify the same user cannot update `status`, `reviewed_by` or `review_notes` directly.
4. Approve a test document as admin and verify its owner cannot delete either its row or storage object.
5. Apply the migration to production only after the staging evidence passes.

## Still required outside this repository

- Connect a malware-scanning provider and quarantine uploads until a clean result is recorded.
- Confirm the German legal entity details and obtain legal review.
- Complete live Stripe, Amiqus, email-domain, monitoring and backup-restore evidence.
