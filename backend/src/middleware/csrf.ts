import type { MiddlewareHandler } from 'hono'

/* ============================================================
    CSRF protection — validates Origin header for state-changing
    requests (POST, PUT, PATCH, DELETE). GET and HEAD are exempt.

    The CORS middleware already validates Origin for cross-origin
    requests; this middleware adds an extra check for same-site
    requests that might bypass CORS (e.g., from a subdomain or
    compromised asset).

    Production-only enforcement: in development we allow all origins
    to avoid breaking local workflows.
    ============================================================ */

const isProd = process.env.NODE_ENV === 'production'
const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true // No origin = same-origin or curl/Postman
  if (!isProd) return true // Allow all in dev
  return allowedOrigins.some((allowed) => {
    if (allowed === origin) return true
    // Allow subdomains of allowed origins
    try {
      const allowedHost = new URL(allowed).host
      const originHost = new URL(origin).host
      return originHost === allowedHost || originHost.endsWith('.' + allowedHost)
    } catch {
      return false
    }
  })
}

export const csrfProtection: MiddlewareHandler = async (c, next) => {
  const method = c.req.method
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return next()
  }

  const origin = c.req.header('origin')
  const referer = c.req.header('referer')

  // If Origin is present, it must be allowed
  if (origin && !isAllowedOrigin(origin)) {
    return c.json({ error: 'Invalid origin' }, 403)
  }

  // If no Origin but has Referer, Referer must match allowed origins
  if (!origin && referer) {
    try {
      const refererUrl = new URL(referer)
      const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`
      if (!isAllowedOrigin(refererOrigin)) {
        return c.json({ error: 'Invalid referer' }, 403)
      }
    } catch {
      return c.json({ error: 'Invalid referer' }, 403)
    }
  }

  await next()
}
