import type { Frame } from '../universe.types'
import { PS_DRIFTING } from '../universe.types'
import { light } from '../drawUtils'
import { NEUTRAL } from '../palette'

/* ============================================================
   Cosmic dust — PS_DRIFTING particles in far depth planes.
   Visibility driven by timeline.expansion.
   ============================================================ */

export function drawCosmicDust(frame: Frame): void {
  const { ctx, w, h, quality, pool, cursor, intensity, timeline } = frame
  const cx = w / 2
  const cy = h / 2
  const k = quality.isMobile ? 0.012 : 0.02
  const px = (cursor.x - cx) * k
  const py = (cursor.y - cy) * k
  const dustAlpha = timeline.expansion + timeline.matter * 0.3

  for (let i = 0; i < pool.count; i++) {
    if (pool.state[i] !== PS_DRIFTING) continue
    if (pool.depth[i] > 0.35) continue

    const d = pool.depth[i]
    const dx = pool.px[i] + px * d
    const dy = pool.py[i] + py * d + Math.sin(pool.phase[i]) * 0.4
    const a = pool.alpha[i] * intensity * 0.7 * dustAlpha
    if (a <= 0.004) continue
    light(ctx, dx, dy, pool.size[i] * d, NEUTRAL, a)
  }
}
