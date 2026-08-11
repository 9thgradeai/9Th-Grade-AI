/**
 * Safely resolve an auth `?redirect=` target so a protected route can return
 * the user to where they came from after login — without introducing an open
 * redirect (e.g. `//evil.com`, `/\evil.com`, or `javascript:...`).
 *
 * Only relative, same-app paths are accepted. Anything else returns null so the
 * caller falls back to the canonical destination (`/dashboard`).
 */
export function safeRedirect(value: string | null | undefined): string | null {
  if (!value) return null
  if (!value.startsWith('/')) return null // not a path → external/absolute
  if (value.startsWith('//')) return null // protocol-relative → external host
  if (value.includes('\\')) return null // backslash URL parsing bypass
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)) return null // explicit scheme
  return value
}
