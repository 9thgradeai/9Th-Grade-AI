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
}
