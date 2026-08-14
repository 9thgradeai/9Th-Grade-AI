import type { MiddlewareHandler } from 'hono'

/* ============================================================
    Request ID middleware — ensures every request has a stable
    x-request-id for correlation across logs, Sentry, and client.
    ============================================================ */

export const requestId: MiddlewareHandler = async (c, next) => {
  const rid = c.req.header('x-request-id') ?? crypto.randomUUID()
  c.header('x-request-id', rid)
  c.set('requestId', rid)
  await next()
}
