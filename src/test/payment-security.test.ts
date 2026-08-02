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
});

