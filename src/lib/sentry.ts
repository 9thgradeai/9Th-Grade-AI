/* Sentry error monitoring — lazy + env-guarded so the SDK stays out of the
   initial bundle unless VITE_SENTRY_DSN is configured. Without a DSN every
   function here is a no-op and the app is byte-for-byte unchanged.

   Error flow (the goal):
     user error -> UI handles gracefully -> boundary/API handler -> Sentry
   Never a white screen: the app-level ErrorBoundary renders a fallback and
   reports; window.onerror + unhandledrejection are captured by @sentry/react's
   default globalHandlersIntegration once init runs; API/network/auth failures
   are captured explicitly via captureApiError / reportError below. */

import type { ErrorEvent } from '@sentry/react'

const dsn = (import.meta.env.VITE_SENTRY_DSN as string | undefined)?.trim()

export function sentryEnabled(): boolean {
  return Boolean(dsn)
}

/* ---- PII / privacy scrubbing --------------------------------------------
   Strip emails, bearer tokens, and sensitive headers/fields before an event
   leaves the browser so credentials and personal data never reach Sentry. */
const SENSITIVE_FIELD = /(authorization|cookie|password|passwd|token|secret|api[-_]?key|email|jwt|set-cookie)/i
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g
const BEARER_RE = /(Bearer\s+)[A-Za-z0-9._-]+/g

function scrubString(s: string): string {
  return s.replace(EMAIL_RE, '[redacted]').replace(BEARER_RE, '$1[redacted]')
}

function scrubObject(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_FIELD.test(k)) {
      out[k] = '[redacted]'
      continue
    }
    out[k] = typeof v === 'string' ? scrubString(v) : v
  }
  return out
}

function scrubEvent(event: ErrorEvent): ErrorEvent {
  if (event.request) {
    if (event.request.data && typeof event.request.data === 'object') {
      event.request.data = scrubObject(event.request.data as Record<string, unknown>) as unknown as Record<string, string>
    }
    if (event.request.headers && typeof event.request.headers === 'object') {
      event.request.headers = scrubObject(event.request.headers as Record<string, unknown>) as unknown as Record<string, string>
    }
  }
  // Never send an email address as the identity — id only (attribution).
  if (event.user && typeof event.user === 'object' && 'email' in event.user) {
    event.user = { ...event.user, email: undefined }
  }
  if (typeof event.message === 'string') event.message = scrubString(event.message)
  return event
}

export async function initSentry(): Promise<void> {
  if (!dsn) return
  const Sentry = await import('@sentry/react')
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: (import.meta.env.VITE_COMMIT_SHA as string | undefined) || undefined,
    tracesSampleRate: 0.1,
    // Session replay intentionally OFF: it captures on-screen DOM which can
    // contain PII. Re-enable later with masking if needed.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    beforeSend: (event) => scrubEvent(event),
  })
  // @sentry/react default globalHandlersIntegration captures window.onerror
  // and unhandledrejection automatically once init runs — no manual listeners
  // (they would double-report).
}

/** Attribute errors to a user by id only (email is PII — never sent). */
export function setSentryUser(id: string | null): void {
  if (!dsn) return
  void import('@sentry/react').then((Sentry) => {
    if (id) Sentry.setUser({ id })
    else Sentry.setUser(null)
  })
}

/** Report a non-API error (render, practice-session, AI, etc.) with context. */
export function reportError(error: unknown, context?: Record<string, unknown>): void {
  if (!dsn) return
  void import('@sentry/react').then((Sentry) => {
    Sentry.withScope((scope) => {
      if (context) scope.setContext('extra', context)
      Sentry.captureException(error)
    })
  })
}

/** Capture an API/network failure with correlation tags (requestId, path…). */
export function captureApiError(
  error: unknown,
  tags: { path?: string; method?: string; status?: number; requestId?: string } = {},
): void {
  if (!dsn) return
  void import('@sentry/react').then((Sentry) => {
    Sentry.withScope((scope) => {
      if (tags.requestId) scope.setTag('request_id', tags.requestId)
      if (tags.path) scope.setTag('path', tags.path)
      if (tags.method) scope.setTag('method', tags.method)
      if (tags.status !== undefined) scope.setTag('http_status', String(tags.status))
      Sentry.captureException(error)
    })
  })
}
