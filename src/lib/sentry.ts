/* Sentry error monitoring — lazy + env-guarded so the SDK stays out of the
   initial bundle unless VITE_SENTRY_DSN is configured. Without a DSN this is
   a no-op and the app is byte-for-byte unchanged. */

const dsn = (import.meta.env.VITE_SENTRY_DSN as string | undefined)?.trim()

export function sentryEnabled(): boolean {
  return Boolean(dsn)
}

export async function initSentry(): Promise<void> {
  if (!dsn) return
  const Sentry = await import('@sentry/react')
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
  })
}

/** Attach the active Sentry hub to a thrown error for a given scope (best-effort). */
export function reportError(error: unknown, context?: Record<string, unknown>): void {
  if (!dsn) return
  void import('@sentry/react').then((Sentry) => {
    Sentry.withScope((scope) => {
      if (context) scope.setContext('extra', context)
      Sentry.captureException(error)
    })
  })
}
