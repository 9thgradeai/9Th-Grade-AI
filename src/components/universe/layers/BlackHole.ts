import type { Frame } from '../universe.types'
import { light, glow } from '../drawUtils'
import { rgba, WARM } from '../palette'

/* ============================================================
   Black holes — visible when timeline.spacetime > 0.1.
   Accretion disk rotates continuously.
   ============================================================ */

export function drawBlackHoles(frame: Frame): void {
  const { ctx, intensity, timeline, blackHoles } = frame
  const appear = timeline.spacetime
  if (appear <= 0.01) return

  for (const bh of blackHoles) {
    const bx = bh.x
    const by = bh.y

    // Accretion disk — brighter, more prominent
    for (const p of bh.diskParticles) {
      const rad = bh.radius * p.radius
      const x = bx + Math.cos(p.angle) * rad
      const y = by + Math.sin(p.angle) * rad * 0.55
      light(ctx, x, y, p.size * 1.3, WARM, p.alpha * 1.4 * intensity * appear)
    }

    // Event horizon
    ctx.fillStyle = 'rgba(2,3,6,0.98)'
    ctx.beginPath()
    ctx.arc(bx, by, bh.radius, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = rgba(bh.hue, 0.5 * appear * intensity)
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(bx, by, bh.radius, 0, Math.PI * 2)
    ctx.stroke()

    glow(ctx, bx, by, bh.influence * 0.3, bh.hue, 0.08 * appear * intensity)
  }
}
