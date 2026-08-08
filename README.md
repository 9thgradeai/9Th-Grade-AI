<div align="center">

<img src="public/favicon.svg" alt="9Th-Grade AI Logo" width="100" />

# 9Th-Grade AI

### The AI Operating System for Competitive Exam Preparation

**Your preparation, engineered by intelligence.**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

A cinematic, AI-powered exam preparation platform for **BCS**, **Bangladesh Bank AD**, **9th-grade government jobs**, **NTRCA**, and first-class competitive recruitment examinations in Bangladesh.

The product philosophy: *Don't just show the candidate their preparation. Tell them how to improve it.*

<br />

**[Live Demo](https://9thgradeai.vercel.app)** · **[Documentation](#)** · **[Report Issues](https://github.com/9thgradeai/9Th-Grade-AI/issues)**

</div>

---

## Table of Contents

- [Features](#features)
- [The Living Universe](#the-living-universe)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Routes](#routes)
- [Design System](#design-system)
- [Performance](#performance)
- [Project Structure](#project-structure)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

---

## Features

| Feature | Description |
|---------|-------------|
| **AI-Powered Strategy** | Generates personalized daily plans, revision schedules, and target priorities based on your performance data |
| **Adaptive Practice** | Questions adjust difficulty in real-time based on accuracy, speed, and confidence |
| **Memory Engine** | Spaced repetition system that schedules reviews just before you forget |
| **Cosmic Universe** | Scroll-synchronized cinematic background that evolves from singularity → mastery |
| **Mock Exams** | Full-length timed simulations with AI diagnosis and next-best-action |
| **Performance Analytics** | Track mastery, accuracy, speed, retention, and percentile across all subjects |
| **Bangla Support** | Native Bangla typography for Bangla-medium candidates |

---

## The Living Universe

The background is not decoration — it's a **visual storytelling engine**. A scroll-synchronized cosmic simulation communicates the journey from chaos to mastery.

```
SINGULARITY → COSMIC BLAST → EXPANSION → STARS → GALAXIES → INTELLIGENCE → KNOWLEDGE → STRATEGY → MASTERY
```

### Engine Architecture

```
SCROLL → Cosmic Timeline → Camera + Macro State → Simulation Engine → Renderer
```

- **Typed-array particle pool** — 3,200 particles in `Float32Array` channels, zero per-frame allocation
- **Scroll-driven evolution** — scroll position IS the cosmic timeline; scrolling backward reverses the universe
- **Two-loop architecture** — timeline loop (scroll-driven) + simulation loop (time-driven ambient motion)
- **Synthesized blast sound** — Web Audio API: low rumble + sharp crack + deep echo; no external audio files
- **Screen shake** — canvas translation during blast with exponential decay
- **Noise-based turbulence** — simplex noise for smooth, continuous, non-repeating particle displacement
- **Camera evolution** — zoom/position/rotation derived from scroll progress
- **Adaptive quality** — 4 levels (ULTRA/HIGH/MEDIUM/LOW) with frame-time hysteresis
- **Data-driven constellations** — mastery → brightness, weakness → gravitational anomaly
- **Reduced motion** — respects `prefers-reduced-motion` with static cosmic background

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 19 + TypeScript (strict mode) |
| **Build** | Vite 8 with hot module replacement |
| **Styling** | Tailwind CSS v4 (CSS-first config, `@theme` design tokens) |
| **Routing** | React Router 7 (route-level code splitting) |
| **Motion** | Framer Motion (section transitions, scroll integration) |
| **Icons** | Lucide React |
| **Rendering** | Canvas 2D (no Three.js, no heavy dependencies) |
| **Linting** | oxlint |

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/9thgradeai/9Th-Grade-AI.git
cd 9Th-Grade-AI

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Lint
npm run lint

# Preview production build
npm run preview
```

---

## Architecture

### Routing

```
Public Marketing     /  /how-it-works  /exams  /exams/:slug  /ai-engine  /pricing  /about
Immersive Onboarding /onboarding
Authenticated        /dashboard  /subjects/:id  /topics/:id  /practice  /mock-tests
                     /results/:id  /strategy  /memory  /progress  /rank  /profile  /settings
```

### Data Flow

All UI components depend on `lib/api.ts` — swap its bodies for `fetch()` calls to a real backend without touching any component.

```
UI Component → api.ts → lib/data/index.ts (mock) → [swap for backend]
```

### Design Tokens

```css
--color-space-950: #05060a;    /* Deep space background */
--color-accent: #4f7cff;       /* Electric blue */
--color-cyan: #4fd1ff;         /* Secondary accent */
--color-violet: #8b5cf6;       /* Tertiary accent */
--color-ink: #e8ecf6;          /* Primary text */
--color-muted: #8b94ab;        /* Secondary text */
```

---

## Project Structure

```
src/
├── App.tsx                          # Router (public / onboarding / authenticated)
├── index.css                        # Design system tokens + utilities
├── lib/
│   ├── types.ts                     # Domain types (User, Exam, Subject, Topic…)
│   ├── api.ts                       # Service abstraction layer
│   ├── data/index.ts                # Realistic sample data (BCS subjects, questions)
│   └── useAsync.ts                  # Loading / data / error hook
├── components/
│   ├── universe/                    # Living Universe engine
│   │   ├── LivingUniverse.tsx        #   Public entry component
│   │   ├── UniverseController.ts     #   Two-loop scroll-driven simulation
│   │   ├── universe.types.ts         #   Typed-array pool, timeline, camera
│   │   ├── noise.ts                  #   Simplex noise for turbulence
│   │   ├── sound.ts                  #   Web Audio blast synthesis
│   │   ├── seeded.ts                 #   Deterministic RNG
│   │   └── layers/                   #   Draw modules (Star, Galaxy, Nebula…)
│   ├── ui/                          # Design system primitives
│   ├── landing/                     # Landing page sections
│   ├── navigation/                  # Navbar, Footer, Logo
│   ├── dashboard/                   # Dashboard widgets
│   └── exam/                        # Question runner
├── pages/                           # Route-level page components
└── main.tsx                         # Entry point
```

---

## Performance

| Metric | Target | Implementation |
|--------|--------|----------------|
| **Desktop FPS** | 60 | Typed-array pool, zero per-frame allocation, RAF |
| **Mobile FPS** | 30–60 | Adaptive quality, reduced particle count |
| **Bundle** | < 100KB gzipped | Route-level code splitting, no heavy deps |
| **Reduced Motion** | Static background | Respects `prefers-reduced-motion` |
| **Tab Hidden** | Pause simulation | `visibilitychange` listener |

---

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | TypeScript check + Vite production build |
| `npm run lint` | Run oxlint |
| `npm run preview` | Preview production build locally |

### Debug Overlay

In development mode, a debug panel appears in the top-right corner showing:

- FPS and frame time
- Active particle count
- Quality level (ULTRA/HIGH/MEDIUM/LOW)
- Current cosmic phase
- Scroll progress percentage
- Simulation time

### Code Quality

- TypeScript strict mode with `noUnusedLocals`, `noUnusedParameters`
- `verbatimModuleSyntax` — all type imports use `import type`
- `erasableSyntaxOnly` — no enums, no namespaces
- oxlint for fast linting
- Zero `Math.random()` in the universe engine — fully deterministic seeded RNG

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

```
feat: add new cosmic event type
fix: resolve star twinkle synchronization
perf: optimize particle pool allocation
docs: update README architecture section
```

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with intelligence. Designed for mastery.**

**[9Th-Grade AI](https://github.com/9thgradeai/9Th-Grade-AI)**

</div>
