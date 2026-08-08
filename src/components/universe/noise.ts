/* ============================================================
   Compact 2D simplex noise — pure math, no dependencies.
   Used for cosmic turbulence, camera drift, breathing rhythm,
   and particle displacement. Deterministic: same input → same
   output. All movement must be temporally continuous — no
   frame-by-frame randomness.
   ============================================================ */

const F2 = 0.5 * (Math.sqrt(3) - 1)
const G2 = (3 - Math.sqrt(3)) / 6

const GRAD = [
  [1, 1], [-1, 1], [1, -1], [-1, -1],
  [1, 0], [-1, 0], [0, 1], [0, -1],
]

// Deterministic permutation table derived from a seed.
function buildPerm(seed: number): Uint8Array {
  const p = new Uint8Array(512)
  const base = new Uint8Array(256)
  for (let i = 0; i < 256; i++) base[i] = i
  // Fisher-Yates with seeded RNG (mulberry32 inline)
  let s = seed >>> 0
  for (let i = 255; i > 0; i--) {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    const j = ((t ^ (t >>> 14)) >>> 0) % (i + 1)
    const tmp = base[i]; base[i] = base[j]; base[j] = tmp
  }
  for (let i = 0; i < 512; i++) p[i] = base[i & 255]
  return p
}

function dot2(g: number[], x: number, y: number): number {
  return g[0] * x + g[1] * y
}

export type Noise2D = (x: number, y: number) => number

/** Create a noise2d function seeded for deterministic, repeatable results. */
export function createNoise2D(seed: number): Noise2D {
  const perm = buildPerm(seed)

  return function noise2d(xin: number, yin: number): number {
    const s = (xin + yin) * F2
    const i = Math.floor(xin + s)
    const j = Math.floor(yin + s)
    const t = (i + j) * G2
    const x0 = xin - (i - t)
    const y0 = yin - (j - t)

    const i1 = x0 > y0 ? 1 : 0
    const j1 = x0 > y0 ? 0 : 1

    const x1 = x0 - i1 + G2
    const y1 = y0 - j1 + G2
    const x2 = x0 - 1 + 2 * G2
    const y2 = y0 - 1 + 2 * G2

    const ii = i & 255
    const jj = j & 255
    const gi0 = perm[ii + perm[jj]] & 7
    const gi1 = perm[ii + i1 + perm[jj + j1]] & 7
    const gi2 = perm[ii + 1 + perm[jj + 1]] & 7

    let n0 = 0, n1 = 0, n2 = 0

    let t0 = 0.5 - x0 * x0 - y0 * y0
    if (t0 > 0) { t0 *= t0; n0 = t0 * t0 * dot2(GRAD[gi0], x0, y0) }

    let t1 = 0.5 - x1 * x1 - y1 * y1
    if (t1 > 0) { t1 *= t1; n1 = t1 * t1 * dot2(GRAD[gi1], x1, y1) }

    let t2 = 0.5 - x2 * x2 - y2 * y2
    if (t2 > 0) { t2 *= t2; n2 = t2 * t2 * dot2(GRAD[gi2], x2, y2) }

    // Return in range [-1, 1]
    return 70 * (n0 + n1 + n2)
  }
}

/** Fractional Brownian Motion — layered noise for richer turbulence. */
export function fbm(
  noise: Noise2D,
  x: number,
  y: number,
  octaves: number = 3,
  lacunarity: number = 2,
  gain: number = 0.5,
): number {
  let sum = 0
  let amp = 1
  let freq = 1
  let max = 0
  for (let i = 0; i < octaves; i++) {
    sum += noise(x * freq, y * freq) * amp
    max += amp
    amp *= gain
    freq *= lacunarity
  }
  return sum / max
}
