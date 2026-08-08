/* ============================================================
   Living Universe — shared types.
   The particle pool uses typed arrays for zero-allocation.
   Galaxies, black holes, waves, and constellation nodes remain
   as objects (too few to benefit from typed arrays).
   ============================================================ */

export interface Vec2 {
  x: number
  y: number
}

/* ---------- Particle states (Int32Array values) ---------- */
export const PS_DORMANT = 0
export const PS_COMPRESSING = 1
export const PS_EXPANDING = 2
export const PS_DRIFTING = 3
export const PS_ORBITING = 4
export const PS_STAR = 5

/* ---------- Birth phases ---------- */
export const BP_VOID = 0
export const BP_SINGULARITY = 1
export const BP_COMPRESSION = 2
export const BP_IGNITION = 3
export const BP_BLAST = 4
export const BP_EXPANSION = 5
export const BP_FORMATION = 6
export const BP_CONTINUOUS = 7

/* ---------- Quality levels ---------- */
export const QL_ULTRA = 0
export const QL_HIGH = 1
export const QL_MEDIUM = 2
export const QL_LOW = 3

/* ---------- Narrative state (scroll-driven on landing) ---------- */
export type UniverseState =
  | 'birth'
  | 'chaos'
  | 'formation'
  | 'organization'
  | 'trajectory'
  | 'constellation'
  | 'data'
  | 'convergence'
  | 'focus'
  | 'results'

export interface LayerConfig {
  poolSize: number
  galaxies: number
  blackHoles: number
  heroStarFraction: number
  starFraction: number
  dim: number
  speed: number
  expansion: number
  centralCore: boolean
  connections: boolean
}

/* ---------- Galaxy ---------- */
export type GalaxyKind = 'spiral' | 'elliptical' | 'irregular'

export interface GalaxyPoint {
  a: number
  r: number
  size: number
  alpha: number
}

export interface Galaxy {
  x: number
  y: number
  z: number
  kind: GalaxyKind
  radius: number
  arms: number
  rotation: number
  rotSpeed: number
  phase: number
  hue: string
  opacity: number
  baseOpacity: number
  seed: number
  points: GalaxyPoint[]
}

/* ---------- Black Hole ---------- */
export interface DiskParticle {
  angle: number
  radius: number
  alpha: number
  size: number
  speed: number
}

export interface BlackHole {
  x: number
  y: number
  radius: number
  influence: number
  strength: number
  hue: string
  diskParticles: DiskParticle[]
  diskRotation: number
}

/* ---------- Wave ---------- */
export interface Wave {
  x: number
  y: number
  born: number
  duration: number
  maxRadius: number
  hue: string
  strength: number
}

/* ---------- Constellation ---------- */
export interface ConstellationNode {
  id: string
  label: string
  x: number
  y: number
  r: number
  mastery: number
  accuracy: number
  retention: number
  hue: string
  children?: ConstellationNode[]
}

export interface UniverseData {
  nodes: ConstellationNode[]
  anomalies: { x: number; y: number; strength: number; radius: number }[]
  readiness: number
  activity: number
}

/* ---------- Particle Pool (typed arrays) ---------- */
export interface ParticlePool {
  count: number
  px: Float32Array
  py: Float32Array
  vx: Float32Array
  vy: Float32Array
  size: Float32Array
  alpha: Float32Array
  depth: Float32Array
  phase: Float32Array
  freq: Float32Array
  hueIdx: Uint8Array
  state: Int32Array
  seed: Float32Array
  /** Previous position for trail rendering during blast */
  prevX: Float32Array
  prevY: Float32Array
}

/* ---------- Camera ---------- */
export interface Camera {
  x: number
  y: number
  zoom: number
  rotation: number
  targetX: number
  targetY: number
  targetZoom: number
  driftPhase: number
}

/* ---------- Cosmic Timeline (scroll-driven) ---------- */
export interface CosmicTimeline {
  progress: number
  singularity: number
  explosion: number
  expansion: number
  spacetime: number
  matter: number
  stars: number
  galaxies: number
  intelligence: number
  knowledge: number
  strategy: number
  mastery: number
}

/* Interpolation helpers — continuous, reversible, no jumps. */
export function linterp(progress: number, start: number, end: number, from: number, to: number): number {
  if (progress <= start) return from
  if (progress >= end) return to
  const t = (progress - start) / (end - start)
  return from + (to - from) * t
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

/* ---------- Cosmic Events ---------- */
export type EventType = 'supernova' | 'gravitational_wave' | 'galaxy_flare' | 'blackhole_burst'

export interface CosmicEvent {
  type: EventType
  x: number
  y: number
  born: number
  duration: number
  intensity: number
}

/* ---------- Quality (adaptive) ---------- */
export interface QualityProfile {
  level: number
  isMobile: boolean
  reducedMotion: boolean
  dpr: number
  cursorSim: boolean
  gravitySim: boolean
  maxGalaxies: number
  staticFrame: boolean
  visible: boolean
  /** fraction of pool actually rendered (adaptive) */
  renderFraction: number
}

/* ---------- State params (per narrative state) ---------- */
export interface StateParams {
  coreActive: boolean
  orbitBias: number
  constellationVisible: boolean
  expansion: number
  dim: number
  coreRings: number
  coreSpeed: number
}

/* ---------- Frame (per-draw context for layers) ---------- */
export interface Frame {
  ctx: CanvasRenderingContext2D
  w: number
  h: number
  time: number
  quality: QualityProfile
  intensity: number
  state: UniverseState
  params: StateParams
  cursor: Vec2
  expansion: number
  /** Scroll-driven cosmic timeline — all formation values derived from this */
  timeline: CosmicTimeline
  camera: Camera
  pool: ParticlePool
  galaxies: Galaxy[]
  blackHoles: BlackHole[]
  waves: Wave[]
  nodes: ConstellationNode[]
  anomalies: UniverseData['anomalies']
  data: UniverseData | null
  core: Vec2
  breathPhase: number
  breathAmount: number
}
