import { describe, expect, it } from "vitest";
import { FIRST_AID, SUBSCRIPTION_PLANS, VERIFICATION_FEE, eur } from "@/lib/pricing";

describe("production pricing catalogue", () => {
  it("uses unique plan and Stripe lookup keys", () => {
    expect(new Set(SUBSCRIPTION_PLANS.map((plan) => plan.id)).size).toBe(SUBSCRIPTION_PLANS.length);
    const keys = SUBSCRIPTION_PLANS.flatMap((plan) =>
      [plan.priceKeyMonthly, plan.priceKeyAnnual].filter(Boolean),
    );
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("keeps annual paid plans cheaper than twelve monthly payments", () => {
    for (const plan of SUBSCRIPTION_PLANS.filter((item) => item.monthlyCents > 0)) {
      expect(plan.annualCents).toBeGreaterThan(0);
      expect(plan.annualCents).toBeLessThan(plan.monthlyCents * 12);
    }
  });

  it("stores integer, positive charge amounts in cents", () => {
    for (const cents of [VERIFICATION_FEE.amountCents, FIRST_AID.seatPriceCents]) {
      expect(Number.isInteger(cents)).toBe(true);
      expect(eur(cents)).toBeGreaterThan(0);
    }
  });
});
