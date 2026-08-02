const SAFE_INTERNAL_PATH = /^\/(?!\/)[a-zA-Z0-9/_?&=.#%+-]*$/;

/** Accept only same-site application paths for post-auth redirects. */
export function safeInternalPath(value: string | null | undefined, fallback = "/"): string {
  if (!value || !SAFE_INTERNAL_PATH.test(value)) return fallback;
  return value;
}

/** Normalises an email without allowing CR/LF header injection. */
export function normaliseEmail(value: string): string | null {
  const email = value.trim().toLowerCase();
  if (/\r|\n/.test(email) || email.length > 254) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}
