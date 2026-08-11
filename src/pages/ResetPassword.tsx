import { useState } from 'react'
import { Link, useSearchParams, Navigate } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { Logo } from '@/components/navigation/Logo'
import { cn } from '@/lib/cn'
import { client, ApiError } from '@/lib/client'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (!token) return <Navigate to="/forgot-password" replace />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setError('')
    setSubmitting(true)
    try {
      await client.post('/auth/reset-password', { token, newPassword: password })
      setDone(true)
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 400 && err.message.includes('expired')) setError('This reset link has expired. Please request a new one.')
        else if (err.status === 400) setError('Invalid or expired reset link.')
        else if (err.status === 0) setError('Backend is not available.')
        else setError(err.message)
      } else {
        setError('Something went wrong.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="term-bg relative flex min-h-screen items-center justify-center px-4">
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="rounded-2xl border border-white/10 bg-space-900/80 p-6 backdrop-blur-xl sm:p-8">
          {done ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/15">
                <Check size={24} className="text-success" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-ink">Password reset</h1>
              <p className="mt-3 text-sm text-muted">Your password has been updated. You can now sign in.</p>
              <Link to="/login" className="mt-6 inline-block rounded-xl bg-accent px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hi">
                Sign In
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-center text-2xl font-semibold tracking-tight text-ink">Set new password</h1>
              <p className="mt-2 text-center text-sm text-muted">Enter your new password below.</p>
              {error && <div role="alert" className="mt-4 rounded-xl border border-danger/20 bg-danger/10 px-4 py-2.5 text-center text-sm text-danger">{error}</div>}
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="rp-password" className="mb-1.5 block text-xs font-medium text-faint">New password</label>
                  <input id="rp-password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-accent/50" />
                </div>
                <button type="submit" disabled={submitting}
                  className={cn('flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hi disabled:opacity-50')}>
                  {submitting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <>Reset password <ArrowRight size={16} /></>}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
