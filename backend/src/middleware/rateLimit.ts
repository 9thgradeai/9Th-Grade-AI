import type { Context, Next } from 'hono'

/* ============================================================
   Rate limiting (Phase 6).
   In-memory fixed-window limiter. Per-instance only — swap for a
   shared store (Redis) in Phase 7 for multi-instance scaling.
   ============================================================ */

interface Bucket {
  count: number
  resetAt: number
}

/** Client IP, honoring a proxy's forwarded header. */
export function clientIp(c: Context): string {
  return c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || c.req.header('x-real-ip') || 'unknown'
}

export function rateLimit(opts: {
  windowMs: number
  max: number
  key: (c: Context) => string | undefined
}): (c: Context, next: Next) => Promise<Response | void> {
  // Per-instance store so distinct limiters (auth, api, ai) never share
  // buckets even when they key on the same value (e.g. userId).
  const buckets = new Map<string, Bucket>()

  return async (c, next) => {
    const key = opts.key(c)
    if (key === undefined) return next()

    const now = Date.now()
    // Prune stale buckets occasionally to bound memory.
    if (buckets.size > 10_000) {
      for (const [k, b] of buckets) {
        if (b.resetAt <= now) buckets.delete(k)
      }
    }

    let b = buckets.get(key)
    if (!b || b.resetAt <= now) {
      b = { count: 0, resetAt: now + opts.windowMs }
      buckets.set(key, b)
    }
    b.count += 1

    if (b.count > opts.max) {
      const retryAfter = Math.ceil((b.resetAt - now) / 1000)
      return c.json({ error: 'Too many requests. Slow down and retry.' }, {
        status: 429,
        headers: { 'Retry-After': String(Math.max(1, retryAfter)) },
      })
    }

    return next()
  }
}
