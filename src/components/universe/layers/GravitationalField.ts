import type { Frame } from '../universe.types'
import { PS_DORMANT } from '../universe.types'
import { rgba } from '../palette'

/* ============================================================
   Gravitational fields — clamped inverse-square attraction from
   black holes + cursor disturbance, applied to pool particles.
   Draws faint concentric rings to hint the field.
   ============================================================ */

export function stepGravity(frame: Frame): void {
  const { pool, quality, cursor, blackHoles } = frame
  if (!quality.gravitySim) return

  for (let i = 0; i < pool.count; i++) {
    if (pool.state[i] === PS_DORMANT) continue

    // Black hole gravity
    for (const bh of blackHoles) {
      const dx = bh.x - pool.px[i]
      const dy = bh.y - pool.py[i]
      const d2 = dx * dx + dy * dy
      if (d2 < 1) continue
      const d = Math.sqrt(d2)
      if (d > bh.influence) continue
      const force = Math.min(bh.strength / d2, 0.5)
      pool.vx[i] += (dx / d) * force * 0.02
      pool.vy[i] += (dy / d) * force * 0.02
    }

    // Cursor gravity
    if (quality.cursorSim) {
      const dx = cursor.x - pool.px[i]
      const dy = cursor.y - pool.py[i]
      const d2 = dx * dx + dy * dy
      if (d2 > 1 && d2 < 160 * 160) {
        const d = Math.sqrt(d2)
        const pull = (1 - d / 160) * 0.0004
        pool.vx[i] += (dx / d) * pull * pool.depth[i]
        pool.vy[i] += (dy / d) * pull * pool.depth[i]
      }
    }

    // Clamp velocity
    const sp = Math.hypot(pool.vx[i], pool.vy[i])
    if (sp > 0.6) {
      pool.vx[i] = (pool.vx[i] / sp) * 0.6
      pool.vy[i] = (pool.vy[i] / sp) * 0.6
    }
  }
}

export function drawGravitationalField(frame: Frame): void {
  const { ctx, intensity, timeline, blackHoles } = frame
  for (const bh of blackHoles) {
    const appear = timeline.spacetime
    if (appear <= 0.01) continue
    for (let i = 1; i <= 2; i++) {
      const rad = bh.influence * (0.4 + i * 0.22)
      ctx.strokeStyle = rgba(bh.hue, 0.03 * appear * intensity)
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.ellipse(bh.x, bh.y, rad, rad * 0.6, 0, 0, Math.PI * 2)
      ctx.stroke()
    }
  }
}
