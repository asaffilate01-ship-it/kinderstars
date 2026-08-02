import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("https://example.supabase.co/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/auth/v1/")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: null }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]", headers: { "content-range": "0-0/0" } });
  });
});

test("public homepage exposes the primary childcare journeys", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/KinderStars/i);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /anmelden|login/i }).first()).toBeVisible();
});

test("legal routes render without a server-side 404", async ({ page }) => {
  for (const path of ["/impressum", "/datenschutz", "/agb", "/beschwerdeverfahren"]) {
    await page.goto(path);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.getByText(/404|not found/i)).toHaveCount(0);
  }
});

test("anonymous users cannot enter parent portal", async ({ page }) => {
  await page.goto("/parent");
  await expect(page).toHaveURL(/\/auth\?role=parent/);
});

test("anonymous users cannot enter childminder portal", async ({ page }) => {
  await page.goto("/childminder");
  await expect(page).toHaveURL(/\/auth\?role=childminder/);
});

test("unknown routes have an accessible recovery link", async ({ page }) => {
  await page.goto("/this-route-does-not-exist");
  await expect(page.getByRole("link").first()).toBeVisible();
});
