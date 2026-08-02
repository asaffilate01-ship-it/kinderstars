import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20260802190000_harden_referrals_and_insurance.sql",
  "utf8",
);

describe("RLS privacy regressions", () => {
  it("removes public referral-code enumeration", () => {
    expect(migration).toContain('DROP POLICY IF EXISTS "Anyone can look up by code"');
  });

  it("prevents clients assigning their own referred user or bounty", () => {
    expect(migration).toContain("referred_user_id IS NULL");
    expect(migration).toContain("bounty_cents = 0");
    expect(migration).toContain("auth.uid() = referrer_user_id");
  });

  it("removes anonymous access to insurance metadata", () => {
    expect(migration).toContain("REVOKE SELECT ON public.v_childminder_insurance_status FROM anon");
  });
});
