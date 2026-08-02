import { describe, expect, it } from "vitest";
import { normaliseEmail, safeInternalPath } from "@/lib/security";
import { escapeHtml } from "@/lib/html-utils";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("security helpers", () => {
  it("rejects external and protocol-relative redirects", () => {
    expect(safeInternalPath("https://evil.example", "/portal")).toBe("/portal");
    expect(safeInternalPath("//evil.example", "/portal")).toBe("/portal");
    expect(safeInternalPath("/parent/bookings?state=open")).toBe("/parent/bookings?state=open");
  });

  it("normalises valid email and blocks header injection", () => {
    expect(normaliseEmail(" User@Example.DE ")).toBe("user@example.de");
    expect(normaliseEmail("user@example.de\r\nBcc:attacker@example.de")).toBeNull();
  });

  it("escapes untrusted HTML content", () => {
    expect(escapeHtml(`<img src=x onerror="alert(1)">`)).toBe(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
    );
  });

  it("does not persist private Supabase storage responses in the service worker", () => {
    const viteConfig = readFileSync(resolve(process.cwd(), "vite.config.ts"), "utf8");
    expect(viteConfig).not.toContain("supabase-storage");
    expect(viteConfig).not.toMatch(/supabase.*storage.*CacheFirst/is);
  });

  it("keeps demo seeding disabled and owner-only", () => {
    const seedFunction = readFileSync(resolve(process.cwd(), "supabase/functions/seed-demo-data/index.ts"), "utf8");
    expect(seedFunction).toContain('ENABLE_DEMO_SEEDING") !== "true"');
    expect(seedFunction).toContain('callerRole?.role !== "owner"');
    expect(seedFunction).not.toContain("KinderStars2024!");
    expect(seedFunction).not.toContain("Demo1234!");
  });

  it("enforces compliance approval and upload controls server-side", () => {
    const migration = readFileSync(
      resolve(process.cwd(), "supabase/migrations/20260802213000_harden_compliance_uploads.sql"),
      "utf8",
    );
    expect(migration).toContain("file_size_limit = 10485760");
    expect(migration).toContain("allowed_mime_types");
    expect(migration).toContain("status = 'pending'");
    expect(migration).toContain("reviewed_by IS NULL");
    expect(migration).toContain("Users delete own unapproved compliance docs");
    expect(migration).toContain("document.status = 'approved'");
    expect(migration).not.toMatch(/CREATE POLICY "Users manage own compliance docs"/);
  });
});
