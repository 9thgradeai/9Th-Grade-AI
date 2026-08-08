/* ============================================================
   Restrained cosmic palette — deep-space + cool accent hues,
   kept muted so content always stays readable. Values are
   "r,g,b" strings for direct rgba() interpolation.
   ============================================================ */

export const HUES = [
  '79,124,255', // electric blue (accent)
  '79,209,255', // cyan
  '139,92,246', // violet
  '255,255,255', // white
] as const

/** Warm accent used only for rare event bursts (supernova, waves). */
export const WARM = '255,196,120'

/** Soft neutral used for constellation links / static structure. */
export const NEUTRAL = '139,146,171'

export function rgba(hue: string, alpha: number): string {
  return `rgba(${hue},${alpha})`
}
