/* ============================================================
   Cosmic sound synthesis — Web Audio API only, no external files.
   Synthesizes a cinematic blast sound: low rumble → sharp crack
   → deep reverberant echo. Created once, triggered on blast.
   ============================================================ */

let ctx: AudioContext | null = null
let masterGain: GainNode | null = null
let initialized = false

function init() {
  if (initialized) return
  try {
    ctx = new AudioContext()
    masterGain = ctx.createGain()
    masterGain.gain.value = 0.35 // restrained volume
    masterGain.connect(ctx.destination)
    initialized = true
  } catch {
    // Web Audio not available — fail silently
  }
}

/** Create a white noise buffer. */
function createNoiseBuffer(duration: number): AudioBuffer {
  const sampleRate = ctx!.sampleRate
  const length = Math.floor(sampleRate * duration)
  const buffer = ctx!.createBuffer(1, length, sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1
  }
  return buffer
}

/** Play the cosmic blast sound. Safe to call multiple times. */
export function playBlastSound() {
  init()
  if (!ctx || !masterGain) return

  // Resume context if suspended (autoplay policy)
  if (ctx.state === 'suspended') ctx.resume()

  const now = ctx.currentTime

  // 1. Low rumble — deep oscillator that sweeps down
  const rumble = ctx.createOscillator()
  const rumbleGain = ctx.createGain()
  rumble.type = 'sine'
  rumble.frequency.setValueAtTime(80, now)
  rumble.frequency.exponentialRampToValueAtTime(25, now + 2.5)
  rumbleGain.gain.setValueAtTime(0.4, now)
  rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 3)
  rumble.connect(rumbleGain)
  rumbleGain.connect(masterGain)
  rumble.start(now)
  rumble.stop(now + 3)

  // 2. Sharp crack — noise burst with fast attack, fast decay
  const noiseBuffer = createNoiseBuffer(0.8)
  const noise = ctx.createBufferSource()
  noise.buffer = noiseBuffer
  const noiseGain = ctx.createGain()
  const noiseFilter = ctx.createBiquadFilter()
  noiseFilter.type = 'bandpass'
  noiseFilter.frequency.value = 2000
  noiseFilter.Q.value = 0.5
  noiseGain.gain.setValueAtTime(0, now + 0.02)
  noiseGain.gain.linearRampToValueAtTime(0.6, now + 0.04)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
  noise.connect(noiseFilter)
  noiseFilter.connect(noiseGain)
  noiseGain.connect(masterGain)
  noise.start(now + 0.02)
  noise.stop(now + 0.8)

  // 3. Sub bass thump
  const sub = ctx.createOscillator()
  const subGain = ctx.createGain()
  sub.type = 'sine'
  sub.frequency.setValueAtTime(40, now)
  sub.frequency.exponentialRampToValueAtTime(15, now + 1.5)
  subGain.gain.setValueAtTime(0.5, now)
  subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5)
  sub.connect(subGain)
  subGain.connect(masterGain)
  sub.start(now)
  sub.stop(now + 1.5)

  // 4. High shimmer — filtered noise tail
  const shimmer = ctx.createBufferSource()
  shimmer.buffer = createNoiseBuffer(4)
  const shimmerGain = ctx.createGain()
  const shimmerFilter = ctx.createBiquadFilter()
  shimmerFilter.type = 'highpass'
  shimmerFilter.frequency.value = 4000
  shimmerGain.gain.setValueAtTime(0, now + 0.1)
  shimmerGain.gain.linearRampToValueAtTime(0.15, now + 0.3)
  shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 4)
  shimmer.connect(shimmerFilter)
  shimmerFilter.connect(shimmerGain)
  shimmerGain.connect(masterGain)
  shimmer.start(now + 0.1)
  shimmer.stop(now + 4)

  // 5. Reverb-like tail using delayed copies
  const tail = ctx.createBufferSource()
  tail.buffer = createNoiseBuffer(3)
  const tailGain = ctx.createGain()
  const tailFilter = ctx.createBiquadFilter()
  tailFilter.type = 'lowpass'
  tailFilter.frequency.value = 800
  tailGain.gain.setValueAtTime(0, now + 0.2)
  tailGain.gain.linearRampToValueAtTime(0.1, now + 0.5)
  tailGain.gain.exponentialRampToValueAtTime(0.001, now + 3)
  tail.connect(tailFilter)
  tailFilter.connect(tailGain)
  tailGain.connect(masterGain)
  tail.start(now + 0.2)
  tail.stop(now + 3)
}

/** Play a subtle cosmic wave sound. */
export function playWaveSound() {
  init()
  if (!ctx || !masterGain) return
  if (ctx.state === 'suspended') ctx.resume()

  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(120, now)
  osc.frequency.exponentialRampToValueAtTime(60, now + 1.5)
  gain.gain.setValueAtTime(0.08, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5)
  osc.connect(gain)
  gain.connect(masterGain)
  osc.start(now)
  osc.stop(now + 1.5)
}
