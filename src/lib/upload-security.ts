export type UploadKind = "avatar" | "compliance-document";

const RULES = {
  avatar: {
    maxBytes: 5 * 1024 * 1024,
    mimeTypes: new Set(["image/jpeg", "image/png", "image/webp"]),
    extensions: new Set(["jpg", "jpeg", "png", "webp"]),
  },
  "compliance-document": {
    maxBytes: 10 * 1024 * 1024,
    mimeTypes: new Set(["application/pdf", "image/jpeg", "image/png"]),
    extensions: new Set(["pdf", "jpg", "jpeg", "png"]),
  },
} as const;

export type UploadValidation =
  | { ok: true; extension: string }
  | { ok: false; error: string };

export const validateUpload = (file: Pick<File, "name" | "size" | "type">, kind: UploadKind): UploadValidation => {
  const rule = RULES[kind];
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (!file.name.includes(".") || !rule.extensions.has(extension as never)) {
    return { ok: false, error: `Unsupported file extension. Allowed: ${[...rule.extensions].join(", ")}.` };
  }
  if (!rule.mimeTypes.has(file.type.toLowerCase() as never)) {
    return { ok: false, error: "The file content type does not match an allowed format." };
  }
  if (file.size <= 0) return { ok: false, error: "The file is empty." };
  if (file.size > rule.maxBytes) {
    return { ok: false, error: `File is too large. Maximum size is ${rule.maxBytes / 1024 / 1024} MB.` };
  }

  return { ok: true, extension };
};

