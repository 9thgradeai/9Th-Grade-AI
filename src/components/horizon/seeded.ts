/* Deterministic seeded RNG for the Cosmic Horizon star field.
   Positions, radii, opacity and connections are generated once from a
   fixed seed so the composition is identical on every render — no
   Math.random() during drawing. */

export type Rng = () => number

/** FNV-1a string hash → stable 32-bit seed. */
export function hashString(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** mulberry32 — tiny, fast, deterministic PRNG. */
export function makeRng(seed: number): Rng {
  let a = seed >>> 0
  return function rng(): number {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function rand(r: Rng, min: number, max: number): number {
  return min + r() * (max - min)
}

export function pick<T>(r: Rng, arr: readonly T[]): T {
  return arr[Math.floor(r() * arr.length)] as T
}
