import type { Frame } from '../universe.types'
import { PS_DORMANT, PS_STAR } from '../universe.types'
import { light } from '../drawUtils'
import { HUES } from '../palette'

/* ============================================================
   Foreground particle field — all active non-star particles.
   Visibility driven by timeline.expansion.
   Trails drawn for EXPANDING particles during blast.
   ============================================================ */

export function drawParticleField(frame: Frame): void {
  const { ctx, time, intensity, pool, timeline } = frame
  const emerge = timeline.expansion + timeline.matter * 0.5 + timeline.spacetime * 0.3
  const hueLookup = HUES

  for (let i = 0; i < pool.count; i++) {
    const st = pool.state[i]
    if (st === PS_DORMANT || st === PS_STAR) continue

    const shim = 0.7 + 0.3 * Math.sin(time * 0.5 + pool.phase[i])
    const a = pool.alpha[i] * 1.4 * shim * intensity * Math.min(1, emerge)
    if (a <= 0.004) continue

    const hue = hueLookup[pool.hueIdx[i] % hueLookup.length]

    // Trails for EXPANDING particles — more visible during blast
    if (st === 2 && pool.prevX[i] !== pool.px[i]) {
      const trailAlpha = a * 0.5
      ctx.strokeStyle = `rgba(${hue},${trailAlpha})`
      ctx.lineWidth = Math.max(0.5, pool.size[i] * 0.5)
      ctx.beginPath()
      ctx.moveTo(pool.prevX[i], pool.prevY[i])
      ctx.lineTo(pool.px[i], pool.py[i])
      ctx.stroke()
      pool.prevX[i] = pool.px[i]
      pool.prevY[i] = pool.py[i]
    }

    light(ctx, pool.px[i], pool.py[i], pool.size[i] * pool.depth[i], hue, a)
  }
}
