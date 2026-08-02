import { describe, expect, it } from "vitest";
import { normaliseEmail, safeInternalPath } from "@/lib/security";
import { escapeHtml } from "@/lib/html-utils";

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
});
