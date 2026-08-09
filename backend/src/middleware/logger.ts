import type { MiddlewareHandler } from 'hono'

/* ============================================================
   Structured request logger (Phase 6 — monitoring).
   Emits one JSON line per request so logs can be shipped to
   Axiom/Sentry or a log aggregator without parsing free text.
   ============================================================ */

export const structuredLogger: MiddlewareHandler = async (c, next) => {
  const start = performance.now()
  await next()
  const ms = Math.round(performance.now() - start)
  const userId = (c.get('userId') as string | undefined) ?? null
  console.log(
    JSON.stringify({
      type: 'request',
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      ms,
      userId,
    }),
  )
}
