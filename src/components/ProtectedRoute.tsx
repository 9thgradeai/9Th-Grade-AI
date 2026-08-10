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
  const { state } = useAuth()

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

  return <Outlet />
}
