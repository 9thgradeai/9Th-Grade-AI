import * as Sentry from '@sentry/node'

/* Sentry error monitoring — env-guarded. Without SENTRY_DSN this is a no-op. */

const dsn = process.env.SENTRY_DSN?.trim()

export function initSentry(): void {
  if (!dsn) return
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'production',
    tracesSampleRate: 1.0,
  })
}

export function captureError(error: unknown, tags?: Record<string, string | number | undefined>): void {
  if (!dsn) return
  Sentry.captureException(error, tags ? { tags } : undefined)
}
