# Phase 6 — directory privacy and malware quarantine

Restricts directory results to safe fields from verified, live and available childminders. Adds malware scan state, a signed idempotent webhook, database approval blocking, infected-file rejection and administrator scan visibility.

Apply `20260802220000_directory_privacy_and_malware_quarantine.sql`, deploy `malware-scan-webhook`, set a random 32-byte `MALWARE_SCAN_WEBHOOK_SECRET`, connect the scanner, then test clean/infected/error/duplicate events in staging.
