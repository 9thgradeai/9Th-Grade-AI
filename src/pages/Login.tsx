import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { CosmicHorizon } from '@/components/horizon'
import { Logo } from '@/components/navigation/Logo'
import { cn } from '@/lib/cn'
import { useAuth } from '@/lib/auth'
import { ApiError } from '@/lib/client'
import { safeRedirect } from '@/lib/redirect'

export default function Login() {
  const { user, loading, login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  /* Resolve once; `safeRedirect` guarantees this is a relative app path. */
  const redirect = safeRedirect(searchParams.get('redirect'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) return <Navigate to={redirect ?? '/dashboard'} replace />
  if (loading) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email, password)
      navigate(redirect ?? '/dashboard', { replace: true })
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 0) setError('Backend is not available. Please try again later.')
        else if (err.code === 'INVALID_CREDENTIALS') setError('Invalid email or password.')
        else setError(err.message)
      } else {
        setError('Login failed. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <CosmicHorizon variant="ambient" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="rounded-2xl border border-white/10 bg-space-900/80 p-6 backdrop-blur-xl sm:p-8">
          <h1 className="text-center text-2xl font-semibold tracking-tight text-ink">Welcome back</h1>
          <p className="mt-2 text-center text-sm text-muted">Sign in to your preparation command center.</p>

          {error && (
            <div className="mt-4 rounded-xl border border-danger/20 bg-danger/10 px-4 py-2.5 text-center text-sm text-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-xs font-medium text-faint">Email</label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-accent/50"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="mb-1.5 block text-xs font-medium text-faint">Password</label>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-accent/50"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hi disabled:opacity-50',
              )}
            >
              {submitting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="mt-3 text-center text-sm text-muted">
            <Link to="/forgot-password" className="font-medium text-accent-hi transition-colors hover:text-accent">
              Forgot your password?
            </Link>
          </p>

          <p className="mt-4 text-center text-sm text-muted">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-accent-hi transition-colors hover:text-accent">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
