# Performance Baseline

Captured before the optimization pass in this session, against a **production
build** served statically (Vite preview). Dev-server measurements are excluded —
they reflect unminified source, on-demand transforms and an ~11 MB module graph,
not the shipped product.

## Methodology
- **Tooling**: Lighthouse 13.4.1 (via CLI), Playwright 1.62.1 + Chromium.
- **Target**: production build at `http://localhost:4173/`.
- **Runs**: 3 per configuration; metrics below are the **median**.
- **Mobile**: Lighthouse default (mobile form factor, simulated throttling).
- **Desktop**: Lighthouse `--preset=desktop`.
- Functional verification: Playwright/Chromium (mobile + desktop viewports).

## Scores (median of 3)

| Category | Mobile | Desktop |
| --- | ---: | ---: |
| Performance | 90 | 98 |
| Accessibility | 90 | 90 |
| Best Practices | 100 | 100 |
| SEO | 91 | 91 |

## Web Vitals & timings (median of 3)

| Metric | Mobile | Desktop |
| --- | ---: | ---: |
| FCP | 2043 ms | 449 ms |
| LCP | 3337 ms | 1171 ms |
| CLS | 0.000 | 0.000 |
| TBT | 5 ms | 0 ms |
| Speed Index | 2043 ms | 596 ms |
| TTFB | 1 ms | 1 ms |
| Main-thread work | 1.6 s | 0.5 s |
| Transfer size | 236 KiB | 237 KiB |

## Bottlenecks identified at baseline
1. **Critical-path JavaScript** — `index` (283 KB) + `proxy` (126 KB, framer-motion
   CJS) ≈ 409 KB raw loaded on every route. Script evaluation is the dominant
   main-thread cost and the primary FCP/LCP driver on throttled mobile.
2. **Perpetual cosmic-canvas animation** — the star-field rAF loop runs from the
   first frame, competing with the hero's first paint on low-end mobile.
3. **Backend network noise (production)** — with no `VITE_API_URL` configured, the
   app attempted `localhost:3001`, firing CORS/failed-request console errors on a
   live site before falling back to mock.

These three were the starting points for the optimization pass (see
`PERFORMANCE_REPORT.md`).
