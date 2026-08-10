import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { CosmicHorizon } from '@/components/horizon'
import { Logo } from '@/components/navigation/Logo'
import { cn } from '@/lib/cn'
import { client, ApiError } from '@/lib/client'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await client.post('/auth/forgot-password', { email })
      setDone(true)
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 0) setError('Backend is not available.')
        else setError(err.message)
      } else {
        setError('Something went wrong.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <CosmicHorizon variant="ambient" />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="rounded-2xl border border-white/10 bg-space-900/80 p-6 backdrop-blur-xl sm:p-8">
          {done ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/15">
                <Check size={24} className="text-success" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-ink">Check your email</h1>
              <p className="mt-3 text-sm text-muted">
                If an account exists for <strong className="text-ink">{email}</strong>, you'll receive a password reset link shortly.
              </p>
              <Link to="/login" className="mt-6 inline-block text-sm font-medium text-accent-hi transition-colors hover:text-accent">
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-center text-2xl font-semibold tracking-tight text-ink">Forgot your password?</h1>
              <p className="mt-2 text-center text-sm text-muted">Enter your email and we'll send a reset link.</p>
              {error && <div className="mt-4 rounded-xl border border-danger/20 bg-danger/10 px-4 py-2.5 text-center text-sm text-danger">{error}</div>}
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="fp-email" className="mb-1.5 block text-xs font-medium text-faint">Email</label>
                  <input id="fp-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-accent/50" />
                </div>
                <button type="submit" disabled={submitting}
                  className={cn('flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hi disabled:opacity-50')}>
                  {submitting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <>Send reset link <ArrowRight size={16} /></>}
                </button>
              </form>
              <p className="mt-6 text-center text-sm text-muted">
                <Link to="/login" className="font-medium text-accent-hi hover:text-accent">Back to sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
