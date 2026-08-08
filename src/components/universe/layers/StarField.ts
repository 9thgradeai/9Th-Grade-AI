import type { Frame } from '../universe.types'
import { PS_STAR } from '../universe.types'
import { light, glow, lensFlare } from '../drawUtils'
import { HUES } from '../palette'

/* ============================================================
   Star field — reads PS_STAR particles from the unified pool.
   Star visibility driven by timeline.stars (scroll-controlled).
   ============================================================ */

export function drawStarField(frame: Frame): void {
  const { ctx, time, intensity, quality, pool, timeline, blackHoles } = frame
  const reduced = quality.reducedMotion
  const starAlpha = timeline.stars

  for (let i = 0; i < pool.count; i++) {
    if (pool.state[i] !== PS_STAR) continue

    const tw = reduced ? 1 : 0.5 + 0.5 * Math.sin(time * pool.freq[i] + pool.phase[i])
    let a = pool.alpha[i] * 1.3 * tw * intensity * starAlpha
    if (a <= 0.003) continue

    let x = pool.px[i]
    let y = pool.py[i]

    // Gravitational lensing near black holes
    for (const bh of blackHoles) {
      const dx = x - bh.x
      const dy = y - bh.y
      const d2 = dx * dx + dy * dy
      const infl = bh.influence * bh.influence
      if (d2 < infl && d2 > 4) {
        const bend = (1 - Math.sqrt(d2) / bh.influence) * 0.35
        x = bh.x + dx * (1 + bend)
        y = bh.y + dy * (1 + bend)
      }
    }

    const hue = HUES[pool.hueIdx[i] % HUES.length]
    const r = pool.size[i] * pool.depth[i]

    if (pool.size[i] > 1.5) {
      if (r > 2) lensFlare(ctx, x, y, r * 3, hue, a * 0.5)
      glow(ctx, x, y, r * 10, hue, a * 0.35)
    }
    light(ctx, x, y, r, hue, a)
  }
}
