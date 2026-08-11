import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Logo } from '@/components/navigation/Logo'
import { cn } from '@/lib/cn'
import { useAuth } from '@/lib/auth'
import { ApiError } from '@/lib/client'

export default function Register() {
  const { user, loading, register } = useAuth()
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) return <Navigate to="/onboarding" replace />
  if (loading) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await register({ name, firstName, email, password })
      navigate('/onboarding', { replace: true })
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 0) setError('Backend is not available. Please try again later.')
        else if (err.code === 'EMAIL_IN_USE') setError('An account with this email already exists.')
        else setError(err.message)
      } else {
        setError('Registration failed. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="term-bg relative flex min-h-screen items-center justify-center px-4">

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="rounded-2xl border border-white/10 bg-space-900/80 p-6 backdrop-blur-xl sm:p-8">
          <h1 className="text-center text-2xl font-semibold tracking-tight text-ink">Create your account</h1>
          <p className="mt-2 text-center text-sm text-muted">Start building your AI preparation system.</p>

          {error && (
            <div role="alert" className="mt-4 rounded-xl border border-danger/20 bg-danger/10 px-4 py-2.5 text-center text-sm text-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="reg-firstname" className="mb-1.5 block text-xs font-medium text-faint">First name</label>
                <input
                  id="reg-firstname"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Rafi"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-accent/50"
                />
              </div>
              <div>
                <label htmlFor="reg-name" className="mb-1.5 block text-xs font-medium text-faint">Full name</label>
                <input
                  id="reg-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Rafi Hossain"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-accent/50"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" className="mb-1.5 block text-xs font-medium text-faint">Email</label>
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-accent/50"
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="mb-1.5 block text-xs font-medium text-faint">Password</label>
              <input
                id="reg-password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
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
                  Create Account
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-accent-hi transition-colors hover:text-accent">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
