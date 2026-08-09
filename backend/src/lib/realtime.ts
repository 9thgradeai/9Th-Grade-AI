/* ============================================================
   Realtime event hub (Phase 6).
   In-memory pub/sub keyed by user id. The transport is currently
   Server-Sent Events (SSE) because the installed @hono/node-server
   build ships no WebSocket upgrade helper; the event model is
   transport-agnostic, so a WebSocket backend (ws package, or
   Vercel's upgradeWebSocket on Fluid Compute) can replace SSE later
   without changing producers.
   ============================================================ */

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

class RealtimeHub {
  private subs = new Map<string, Set<Emitter>>()

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

  /** Emit an event to a single user's open connections. */
  publishToUser<E extends RealtimeEventName>(userId: string, event: E, data: unknown): void {
    const frame = JSON.stringify({ event, data })
    const set = this.subs.get(userId)
    if (!set) return
    for (const emit of set) {
      try {
        emit(frame)
      } catch {
        /* a dropped socket must not break the producer */
      }
    }
  }

  /** Emit an event to every open connection. */
  broadcast<E extends RealtimeEventName>(event: E, data: unknown): void {
    const frame = JSON.stringify({ event, data })
    for (const set of this.subs.values()) {
      for (const emit of set) {
        try {
          emit(frame)
        } catch {
          /* ignore */
        }
      }
    }
  }
}

export const realtime = new RealtimeHub()
