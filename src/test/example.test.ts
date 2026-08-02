import { describe, expect, it } from "vitest";
import { SUBSCRIPTION_PLANS } from "@/lib/pricing";

describe("application bootstrap configuration", () => {
  it("always exposes a free registration option", () => {
    expect(SUBSCRIPTION_PLANS.some((plan) => plan.id === "free" && plan.monthlyCents === 0)).toBe(true);
  });
});
