/* ============================================================
   Application cache layer (Phase 7 — Scale).
   Uses Upstash Redis when UPSTASH_REDIS_REST_URL/TOKEN are set;
   otherwise falls back to an in-process map with TTL so the layer
   is testable in development. A shared store (Redis) makes the cache
   correct across multiple API instances.
   ============================================================ */

import { Redis } from '@upstash/redis'

const useRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
const redis = useRedis ? Redis.fromEnv() : null

/** Whether the cache is backed by Redis (shared) or the in-memory fallback. */
export const cacheMode: 'redis' | 'memory' = useRedis ? 'redis' : 'memory'

interface Entry {
  value: unknown
  expiresAt: number
}

const mem = new Map<string, Entry>()

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (redis) {
    try {
      return (await redis.get<T>(key)) ?? null
    } catch (err) {
      console.warn(`[cache] Redis GET failed for key="${key}", falling back to memory:`, err instanceof Error ? err.message : String(err))
      return null
    }
  }
  const e = mem.get(key)
  if (!e) return null
  if (e.expiresAt < Date.now()) {
    mem.delete(key)
    return null
  }
  return e.value as T
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  if (redis) {
    try {
      await redis.set(key, value, { ex: ttlSeconds })
      return
    } catch (err) {
      console.warn(`[cache] Redis SET failed for key="${key}", falling back to memory:`, err instanceof Error ? err.message : String(err))
    }
  }
  mem.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 })
}

export async function cacheDel(key: string): Promise<void> {
  if (redis) {
    try {
      await redis.del(key)
    } catch (err) {
      console.warn(`[cache] Redis DEL failed for key="${key}":`, err instanceof Error ? err.message : String(err))
    }
  }
  mem.delete(key)
}

/** Build a namespaced cache key from parts. */
export function cacheKey(...parts: Array<string | number>): string {
  return `cache:${parts.join(':')}`
}
