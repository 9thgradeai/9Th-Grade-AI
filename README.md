# 9Th-Grade AI

> **The AI operating system for competitive exam preparation in Bangladesh.**

Your preparation, engineered by intelligence. 9Th-Grade AI is a frontend for an AI-powered competitive-exam preparation platform built around BCS, Bangladesh Bank AD, 9th-grade government jobs, NTRCA, and other first-class recruitment examinations.

The product idea: *Don't just show the candidate their preparation. Tell them how to improve it.*

## Stack

- **React 19** + **TypeScript** (strict)
- **Vite 8** with **Tailwind CSS v4** (CSS-first config, `@theme` tokens)
- **React Router 7** (route-level code splitting via `React.lazy`)
- **Framer Motion** (motion system)
- **Lucide** (icons)
- **Canvas 2D** `PreparationUniverse` engine — no Three.js

## Quick start

```bash
npm install
npm run dev      # dev server
npm run build    # tsc -b && vite build
npm run lint     # oxlint
```

## Architecture

```
src/
  App.tsx                  — Router (public / onboarding / authenticated)
  index.css                — Design system tokens + utilities (dark, deep-space)
  lib/
    types.ts               — Domain types (User, Exam, Subject, Topic, Test, Result…)
    data/index.ts          — Realistic sample data (BCS subjects, syllabus, questions)
    api.ts                 — Service abstraction (UI never imports mock data directly)
    session.ts             — In-memory bridge: completed run → results page
    useAsync.ts            — loading / data / error / reload hook
  components/
    universe/              — PreparationUniverse (particle field, orbits, nodes, cursor/scroll)
    ui/                    — Button, Card, Badge, Progress, Metric, Signal, Empty/Error states
    landing/               — Hero, Problem, CoreLoop, AIEngine, Syllabus, Exams, Memory, Analytics, CTA
    navigation/            — Navbar (transparent→blur), MobileNav, Footer, Logo
    dashboard/             — AIBriefing, DailyMission, NextBestAction, MetricTile
    exam/                  — QuestionRunner (shared by Practice + Mock)
  pages/                   — Landing, onboarding, and all authenticated screens
```

## Routes

Public marketing: `/`, `/how-it-works`, `/exams`, `/exams/:slug`, `/ai-engine`, `/pricing`, `/about`.

Onboarding (immersive): `/onboarding` — mission → exam date → study time → level → diagnostic → blueprint → transition into the app.

Authenticated: `/dashboard`, `/subjects/:id`, `/topics/:id`, `/practice`, `/mock-tests`, `/mock-tests/:id`, `/results/:id`, `/strategy`, `/memory`, `/progress`, `/rank`, `/profile`, `/settings`.

## Design system

- Deep-space black surfaces, restrained electric-blue / cyan / violet / white accent spectrum.
- Typography: Inter (UI), JetBrains Mono (metrics / AI signals / timestamps), Hind Siliguri (Bangla).
- Motion: Framer Motion, `prefers-reduced-motion` respected; the canvas engine renders a static frame for reduced-motion users.
- Performance: canvas-based particles (reduced density on mobile), animations pause when the tab is hidden, route-level code splitting.

## Notes for the real product

- All data flows through `services/api.ts` (here `lib/api.ts`) — swap its bodies for `fetch()` calls without touching components.
- Official syllabi are **configurable** by design (`Exam.configurableSyllabus`) and are never presented as unassailable fact.
- Bangla is supported throughout (`lang-bn` utility) for a Bangla-first experience.
