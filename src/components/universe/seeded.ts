/* ============================================================
   Deterministic randomness.
   The same seed always produces the same cosmos, so a given page
   state renders an identical universe every load — consistent and
   debuggable. No Math.random() anywhere in the engine.
   ============================================================ */

export type RNG = () => number

/** mulberry32 — tiny, fast, good-enough PRNG. */
export function mulberry32(seed: number): RNG {
  let a = seed >>> 0
  return function next() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** FNV-1a hash — turns an arbitrary string into a 32-bit seed. */
export function hashSeed(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Deterministic RNG seeded from a number or string. */
export function makeRng(seed: number | string): RNG {
  const n = typeof seed === 'string' ? hashSeed(seed) : seed
  return mulberry32(n)
}

export function rngRange(rng: RNG, min: number, max: number): number {
  return min + rng() * (max - min)
}

export function rngInt(rng: RNG, min: number, max: number): number {
  return Math.floor(rngRange(rng, min, max + 1))
}

export function rngPick<T>(rng: RNG, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]
}
