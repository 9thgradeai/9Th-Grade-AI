import { useEffect, useState } from 'react'
import { Link, useSearchParams, Navigate } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import { Logo } from '@/components/navigation/Logo'
import { client, ApiError } from '@/lib/client'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('No verification token found.'); return }
    let cancelled = false
    ;(async () => {
      try {
        await client.post('/auth/verify-email', { token })
        if (!cancelled) setStatus('success')
      } catch (err: unknown) {
        if (cancelled) return
        if (err instanceof ApiError) {
          if (err.status === 400) setMessage('Invalid or expired verification link.')
          else setMessage(err.message)
        } else {
          setMessage('Verification failed.')
        }
        if (!cancelled) setStatus('error')
      }
    })()
    return () => { cancelled = true }
  }, [token])

  if (!token) return <Navigate to="/" replace />

  return (
    <div className="term-bg relative flex min-h-screen items-center justify-center px-4">
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="rounded-2xl border border-white/10 bg-space-900/80 p-6 backdrop-blur-xl sm:p-8 text-center">
          {status === 'pending' && (
            <>
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
              <p className="mt-4 text-sm text-muted">Verifying your email…</p>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/15">
                <Check size={24} className="text-success" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-ink">Email verified</h1>
              <p className="mt-3 text-sm text-muted">Your email has been verified. You can now access all features.</p>
              <Link to="/login" className="mt-6 inline-block rounded-xl bg-accent px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hi">
                Sign In
              </Link>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger/15">
                <X size={24} className="text-danger" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-ink">Verification failed</h1>
              <p className="mt-3 text-sm text-muted">{message}</p>
              <Link to="/login" className="mt-6 inline-block text-sm font-medium text-accent-hi hover:text-accent">
                Go to sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
