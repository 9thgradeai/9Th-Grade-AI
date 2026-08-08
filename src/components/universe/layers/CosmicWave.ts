import type { Frame } from '../universe.types'
import { PS_DORMANT } from '../universe.types'
import { rgba } from '../palette'

/* ============================================================
   Cosmic waves — short radial events from milestones or cosmic
   events. A ring expands and fades, pushing nearby particles
   outward. Waves are objects (few active).
   ============================================================ */

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

export function stepWaves(frame: Frame): void {
  const { pool, time, waves } = frame
  for (const wv of waves) {
    const progress = Math.min(1, (time - wv.born) / wv.duration)
    const radius = easeOut(progress) * wv.maxRadius
    for (let i = 0; i < pool.count; i++) {
      if (pool.state[i] === PS_DORMANT) continue
      const dx = pool.px[i] - wv.x
      const dy = pool.py[i] - wv.y
      const d = Math.hypot(dx, dy)
      if (Math.abs(d - radius) < 30 && d > 1) {
        const push = wv.strength * (1 - Math.abs(d - radius) / 30)
        pool.vx[i] += (dx / d) * push * 0.01
        pool.vy[i] += (dy / d) * push * 0.01
      }
    }
  }
}

export function drawCosmicWaves(frame: Frame): void {
  const { ctx, time, intensity, waves } = frame
  for (const wv of waves) {
    const progress = Math.min(1, (time - wv.born) / wv.duration)
    const radius = easeOut(progress) * wv.maxRadius
    const alpha = wv.strength * (1 - progress) * 0.5 * intensity
    if (alpha <= 0.004) continue
    ctx.strokeStyle = rgba(wv.hue, alpha)
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(wv.x, wv.y, radius, 0, Math.PI * 2)
    ctx.stroke()
  }
}
