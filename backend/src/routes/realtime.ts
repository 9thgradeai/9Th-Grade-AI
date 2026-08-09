import { Hono } from 'hono'
import type { AppEnv } from '../types/env'
import { realtime } from '../lib/realtime'

/* ============================================================
   Realtime routes — Server-Sent Events stream for the authed user.
   Clients subscribe to live events (progress, tasks, rankings, etc.)
   ============================================================ */

export const realtimeRoutes = new Hono<AppEnv>()

const encoder = new TextEncoder()

// GET /api/realtime/events — long-lived SSE stream for the current user.
realtimeRoutes.get('/events', (c) => {
  const userId = c.get('userId') as string

  let cleanup: (() => void) | null = null
  let heartbeat: ReturnType<typeof setInterval> | null = null

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // Initial handshake frame so the client knows it connected.
      controller.enqueue(encoder.encode(`event: connected\ndata: {"userId":"${userId}"}\n\n`))

      // Push live frames to this connection.
      cleanup = realtime.subscribe(userId, (frame) => {
        controller.enqueue(encoder.encode(`event: message\ndata: ${frame}\n\n`))
      })

      // Heartbeat comment keeps the connection alive through idle proxies.
      heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`: ping\n\n`))
      }, 25000)
    },
    cancel() {
      if (cleanup) cleanup()
      if (heartbeat) clearInterval(heartbeat)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
})
