const DEFAULT_REDIRECT_PATH = "/dashboard";
const REDIRECT_ORIGIN = "https://txanalyzer.invalid";

/**
 * Accept only same-origin absolute paths. A path beginning with `//` or a
 * backslash can be normalized into an external URL by a browser, so both are
 * rejected before URL parsing.
 */
export function isSafeRedirectPath(value: string | null | undefined): value is string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return false;
  }

  try {
    const parsed = new URL(value, REDIRECT_ORIGIN);
    return parsed.origin === REDIRECT_ORIGIN;
  } catch {
    return false;
  }
}

export function getSafeRedirectPath(
  value: string | null | undefined,
  fallback = DEFAULT_REDIRECT_PATH,
): string {
  return isSafeRedirectPath(value) ? value : fallback;
}
