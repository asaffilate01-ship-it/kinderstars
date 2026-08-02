import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("payment and webhook security", () => {
  it("does not accept arbitrary client Stripe price IDs", () => {
    const checkout = source("supabase/functions/create-checkout/index.ts");
    expect(checkout).not.toContain("body.price_id");
    expect(checkout).toContain("course_id");
    expect(checkout).toContain("booking_id");
  });

  it("requires signed Stripe and Amiqus webhooks", () => {
    expect(source("supabase/functions/stripe-webhook/index.ts")).toContain("constructEventAsync");
    const amiqus = source("supabase/functions/amiqus-webhook/index.ts");
    expect(amiqus).toContain('req.headers.get("x-aqid-signature")');
    expect(amiqus).toContain('crypto.subtle.sign("HMAC"');
  });

  it("keeps webhook receipts private and unique", () => {
    const migration = source("supabase/migrations/20260802204500_add_payment_webhook_receipts.sql");
    expect(migration).toContain("provider_event_id TEXT NOT NULL UNIQUE");
    expect(migration).toContain("REVOKE ALL");
  });

  it("allows failed payment and malware events to be retried safely", () => {
    const payment = source("supabase/functions/stripe-webhook/index.ts");
    const malware = source("supabase/functions/malware-scan-webhook/index.ts");
    const migration = source("supabase/migrations/20260803010000_retry_safe_webhooks.sql");
    expect(payment).toContain('.eq("status", "failed")');
    expect(payment).toContain('status: "completed"');
    expect(malware).toContain('.eq("status", "failed")');
    expect(malware).toContain('status: "completed"');
    expect(migration).toContain("payment_webhook_events_status_check");
    expect(migration).toContain("malware_scan_events_status_check");
  });

  it("deduplicates partner CPD completion records", () => {
    const webhook = source("supabase/functions/partner-training-webhook/index.ts");
    const migration = source("supabase/migrations/20260803010000_retry_safe_webhooks.sql");
    expect(webhook).toContain('source_ref: `${p.provider}:${p.external_ref}`');
    expect(webhook).toContain('completed_date: now.split("T")[0]');
    expect(webhook).toContain('onConflict: "source_ref"');
    expect(migration).toContain("cpd_records_source_ref_key");
  });
});
