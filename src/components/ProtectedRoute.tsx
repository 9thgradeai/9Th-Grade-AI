import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'

/**
 * Route guard for authenticated-only routes.
 *
 * States:
 *   INITIALIZING → spinner (no flicker)
 *   AUTHENTICATED → render child route
 *   UNAUTHENTICATED → redirect to /login
 *
 * Brief §7: no mock dashboard data before authentication completes.
 */
export default function ProtectedRoute() {
  const { state, retry } = useAuth()

  /* Still bootstrapping — render nothing (no flicker, per brief §19). */
  if (state === 'INITIALIZING') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
      </div>
    )
  }

  if (state === 'UNAUTHENTICATED') {
    return <Navigate to="/login" replace />
  }

  /* Backend unreachable — keep the session token and offer a retry rather than
     silently logging the user out over a connectivity blip. */
  if (state === 'BACKEND_UNAVAILABLE') {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <span className="text-3xl">🌐</span>
        <h3 className="text-lg font-semibold text-ink">We can't reach the server</h3>
        <p className="max-w-sm text-sm text-muted">
          Your session is safe. Check your connection and try again.
        </p>
        <button
          onClick={() => void retry()}
          className="mt-2 inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-b from-accent-hi to-accent px-4 text-sm font-medium text-white transition-all hover:brightness-110"
        >
          Retry
        </button>
      </div>
    )
  }

  return <Outlet />
}
