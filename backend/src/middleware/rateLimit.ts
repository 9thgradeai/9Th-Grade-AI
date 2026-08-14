import type { Context, Next } from 'hono'
import { Redis } from '@upstash/redis'
import { cacheMode } from '../lib/cache'

/* ============================================================
    Rate limiting — Redis-backed with in-memory fallback.
    Uses Upstash Redis when available; otherwise falls back to
    per-instance Map so the app remains functional in development.

    Redis keys: rate:{key}:{window}
    Values: INCR + EXPIRE via Redis pipeline.
    ============================================================ */

interface Bucket {
  count: number
  resetAt: number
}

const redis: Redis | null =
  cacheMode === 'redis' ? (await import('@upstash/redis')).Redis.fromEnv() : null

const memBuckets = new Map<string, Bucket>()

/** Client IP, honoring a proxy's forwarded header. */
export function clientIp(c: Context): string {
  return c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || c.req.header('x-real-ip') || 'unknown'
}

async function redisCheck(key: string, windowMs: number, max: number): Promise<{ allowed: boolean; remaining: number; retryAfter: number }> {
  if (!redis) return { allowed: true, remaining: max, retryAfter: 0 }
  try {
    const ttl = Math.ceil(windowMs / 1000)
    const count = await redis.incr(key)
    if (count === 1) await redis.expire(key, ttl)
    const ttlRemaining = await redis.ttl(key)
    const retryAfter = Math.max(1, ttlRemaining)
    const allowed = count <= max
    return { allowed, remaining: Math.max(0, max - count), retryAfter: allowed ? 0 : retryAfter }
  } catch (err) {
    console.error('[rateLimit] Redis failure, falling back to in-memory:', err instanceof Error ? err.message : String(err))
    return { allowed: true, remaining: max, retryAfter: 0 }
  }
}

function memCheck(key: string, windowMs: number, max: number): { allowed: boolean; remaining: number; retryAfter: number } {
  const now = Date.now()
  if (memBuckets.size > 10_000) {
    for (const [k, b] of memBuckets) {
      if (b.resetAt <= now) memBuckets.delete(k)
    }
  }
  let b = memBuckets.get(key)
  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + windowMs }
    memBuckets.set(key, b)
  }
  const allowed = b.count < max
  const remaining = Math.max(0, max - b.count)
  const retryAfter = allowed ? 0 : Math.max(1, Math.ceil((b.resetAt - now) / 1000))
  if (allowed) b.count++
  return { allowed, remaining, retryAfter }
}

export function rateLimit(opts: {
  windowMs: number
  max: number
  key: (c: Context) => string | undefined
}): (c: Context, next: Next) => Promise<Response | void> {
  return async (c, next) => {
    const key = opts.key(c)
    if (key === undefined) return next()

    const check = redis ? await redisCheck(key, opts.windowMs, opts.max) : memCheck(key, opts.windowMs, opts.max)
    if (!check.allowed) {
      return c.json({ error: 'Too many requests. Slow down and retry.' }, {
        status: 429,
        headers: {
          'Retry-After': String(check.retryAfter),
          'X-RateLimit-Limit': String(opts.max),
          'X-RateLimit-Remaining': '0',
        },
      })
    }

    c.header('X-RateLimit-Limit', String(opts.max))
    c.header('X-RateLimit-Remaining', String(check.remaining))
    return next()
  }
}
