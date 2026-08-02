import { describe, expect, it } from "vitest";
import { validateUpload } from "@/lib/upload-security";

const file = (name: string, type: string, size = 100) => ({ name, type, size });

describe("upload validation", () => {
  it("accepts supported compliance documents", () => {
    expect(validateUpload(file("certificate.PDF", "application/pdf"), "compliance-document")).toEqual({
      ok: true,
      extension: "pdf",
    });
  });

  it("rejects executable and mismatched content types", () => {
    expect(validateUpload(file("certificate.exe", "application/octet-stream"), "compliance-document").ok).toBe(false);
    expect(validateUpload(file("certificate.pdf", "text/html"), "compliance-document").ok).toBe(false);
  });

  it("rejects SVG avatars and oversized files", () => {
    expect(validateUpload(file("avatar.svg", "image/svg+xml"), "avatar").ok).toBe(false);
    expect(validateUpload(file("avatar.png", "image/png", 5 * 1024 * 1024 + 1), "avatar").ok).toBe(false);
  });
});

