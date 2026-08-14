import type { MiddlewareHandler } from 'hono'

/* ============================================================
   Security hardening headers (Phase 7 — Scale / hardening).
   Applied globally after a response is produced.
   ============================================================ */

export const securityHeaders: MiddlewareHandler = async (c, next) => {
  await next()
  c.header('X-Content-Type-Options', 'nosniff')
  c.header('X-Frame-Options', 'DENY')
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
  c.header('X-XSS-Protection', '0')
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  c.header('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')

  const isProd = process.env.NODE_ENV === 'production'
  if (isProd) {
    const csp = [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://resend.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
    c.header('Content-Security-Policy', csp)
  }
}
