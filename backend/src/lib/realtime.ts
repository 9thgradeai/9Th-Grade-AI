/* ============================================================
    Realtime event hub (Phase 6 — Scale).
    In-memory pub/sub keyed by user id, with optional Redis
    cross-instance fan-out via per-user lists. The transport is
    currently Server-Sent Events (SSE); the event model is
    transport-agnostic.

    When Upstash Redis is configured, publishes are pushed to a
    per-user Redis list so all instances can deliver events to their
    local SSE subscribers. Without Redis, the hub degrades to
    per-instance in-memory delivery.
    ============================================================ */

import { Redis } from '@upstash/redis'
import { cacheMode } from './cache'

export type RealtimeEventName =
  | 'progress:update'
  | 'task:completed'
  | 'recommendation:new'
  | 'streak:milestone'
  | 'ranking:updated'

export interface RealtimeEnvelope<E extends RealtimeEventName = RealtimeEventName> {
  event: E
  data: unknown
}

type Emitter = (frame: string) => void

const REDIS_LIST_TTL = 30 // seconds
const REDIS_LIST_KEY = (userId: string) => `realtime:${userId}`

class RealtimeHub {
  private subs = new Map<string, Set<Emitter>>()
  private redis: Redis | null = null
  private redisReady = false

  constructor() {
    if (cacheMode === 'redis') {
      try {
        this.redis = Redis.fromEnv()
        this.redisReady = true
      } catch {
        this.redis = null
        this.redisReady = false
      }
    }
  }

  /** Subscribe a user's transport. Returns an unsubscribe function. */
  subscribe(userId: string, emitter: Emitter): () => void {
    let set = this.subs.get(userId)
    if (!set) {
      set = new Set()
      this.subs.set(userId, set)
    }
    set.add(emitter)
    return () => {
      set.delete(emitter)
      if (set.size === 0) this.subs.delete(userId)
    }
  }

  /** Emit an event to a single user's open connections (local + remote). */
  async publishToUser<E extends RealtimeEventName>(userId: string, event: E, data: unknown): Promise<void> {
    const frame = JSON.stringify({ event, data })

    // Local subscribers
    const set = this.subs.get(userId)
    if (set) {
      for (const emit of set) {
        try { emit(frame) } catch { /* ignore */ }
      }
    }

    // Remote subscribers via Redis list
    if (this.redisReady && this.redis) {
      try {
        const key = REDIS_LIST_KEY(userId)
        await this.redis.lpush(key, frame)
        await this.redis.expire(key, REDIS_LIST_TTL)
      } catch { /* ignore publish errors */ }
    }
  }

  /** Emit an event to every open connection (local only). */
  broadcast<E extends RealtimeEventName>(event: E, data: unknown): void {
    const frame = JSON.stringify({ event, data })
    for (const set of this.subs.values()) {
      for (const emit of set) {
        try { emit(frame) } catch { /* ignore */ }
      }
    }
  }

  /** Drain and return pending events from the Redis list for a user. */
  async drainRedisEvents(userId: string): Promise<string[]> {
    if (!this.redisReady || !this.redis) return []
    try {
      const key = REDIS_LIST_KEY(userId)
      const frames = await this.redis.lrange<string>(key, 0, 50)
      if (frames.length > 0) {
        await this.redis.del(key)
      }
      return frames
    } catch {
      return []
    }
  }
}

export const realtime = new RealtimeHub()
