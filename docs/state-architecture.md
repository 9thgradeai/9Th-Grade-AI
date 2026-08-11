# State Architecture

The canonical layering rule for this codebase. Keep server state, UI state,
feature-local state, and auth strictly separated so no single value has two
competing sources of truth.

## The rule

```
Server/API state   → src/lib/api.ts (memo cache) + useAsync()
UI/theme state     → React Context (ThemeContext) — single source
Feature-local      → component useState / useAsync
Authentication     → AuthContext — single authoritative source
```

This codebase deliberately does **not** use Zustand or TanStack Query. The
same layering is achieved with React Context + a thin `api.ts` dedup/Ttl cache
and the `useAsync` hook. Do not introduce a global store or a second cache
layer just to move data — pages already consume `useAsync` results directly,
so there is no "API → store → component copy" chain to desync.

## Hard rules

1. **Server state has ONE source of truth in production: the real backend.**
   `fromBackend()` in `src/lib/api.ts` falls back to bundled mock `data/*`
   **only in `import.meta.env.DEV`**. In production any backend failure is
   rethrown so the UI renders a real error/empty state — never fabricated
   data.

2. **Auth is the single authoritative session source** — `AuthProvider` in
   `src/lib/auth.tsx`. Nothing else may decide "logged in". The session
   credential is the backend's HttpOnly cookie (durable) plus an in-memory
   copy for the Bearer header; localStorage is a dev-only mirror.

3. **Catalog metadata is owned by `src/lib/syllabus.ts`.** The mock payloads in
   `src/lib/data/index.ts` are a dev-only stand-in and must not drift as a
   second catalog; production reads the backend.

4. **Client-local persistence (e.g. `memoryStore.ts`) is a cache/ledger, not a
   competing source of truth** for backend-owned data. Where a value exists
   both locally and server-side, the backend wins and the local copy is merged
   read-only at the service boundary (`api.getRevisionItems()`).

## Adding new state

- Backend/remote data → add an `api.ts` method + consume via `useAsync`.
  Do not copy the result into component state.
- Theme/global UI → `ThemeContext`.
- One-component transient UI (open/closed, focus) → local `useState`.
- New auth state → extend `AuthContext`, never a side-channel.
