import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from '@/lib/types'
import { client, getToken, setToken, isNetworkError, ApiError } from '@/lib/client'
import { clearApiCache } from '@/lib/api'

/* ============================================================
   Auth store — production-grade state machine.

   States:
     INITIALIZING   — session bootstrap in progress (show spinner, no redirect)
     AUTHENTICATED  — real user loaded, app is usable
     UNAUTHENTICATED — no session, redirect to /login

   Critical rules (brief §13):
   - Auth methods (login/register/logout) NEVER fall back to mock data.
   - When JWT expires → 401 → state becomes UNAUTHENTICATED → /login.
   - No silent mock-user injection.
   ============================================================ */

export type AuthState = 'INITIALIZING' | 'AUTHENTICATED' | 'UNAUTHENTICATED' | 'BACKEND_UNAVAILABLE'

interface RegisterPayload {
  name: string
  firstName: string
  email: string
  password: string
}

/** Raw `User` as the backend returns it (superset of the frontend type). */
interface UserPayload {
  id: string
  email: string
  name?: string
  firstName?: string
  timezone?: string
  createdAt?: string
}

interface SessionResponse {
  user: UserPayload
  token: string
}

interface AuthContextValue {
  state: AuthState
  /** Null when UNAUTHENTICATED; real User when AUTHENTICATED. */
  user: User | null
  /** True only during INITIALIZING. Kept for backward compatibility with components. */
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (payload: RegisterPayload) => Promise<User>
  logout: () => Promise<void>
  /** Force-transition to UNAUTHENTICATED (called by client.ts on 401). */
  handleUnauthorized: () => void
  /** Re-run session bootstrap (e.g. after the backend comes back online). */
  retry: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/* ---- Helpers ---- */

function toUser(raw: UserPayload): User {
  return {
    id: raw.id,
    name: raw.name ?? raw.firstName ?? '',
    email: raw.email,
    firstName: raw.firstName ?? raw.name ?? '',
    timezone: raw.timezone ?? 'Asia/Dhaka',
    createdAt: raw.createdAt ?? new Date().toISOString(),
  }
}

/* ---- Provider ---- */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>('INITIALIZING')
  const [user, setUser] = useState<User | null>(null)

  const setAuthenticated = useCallback((u: UserPayload) => {
    setUser(toUser(u))
    setState('AUTHENTICATED')
  }, [])

  const setUnauthenticated = useCallback(() => {
    setToken(null)
    setUser(null)
    clearApiCache()
    setState('UNAUTHENTICATED')
  }, [])

  /* --- Bootstrap: check existing session on mount --- */
  const bootstrap = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setUnauthenticated()
      return
    }
    try {
      const me = await client.get<UserPayload>('/users/me')
      setAuthenticated(me)
    } catch (err) {
      // Only a definitive 401 (invalid/expired token) means logged out. A
      // network error or 5xx means the backend is unreachable — never wipe a
      // valid session over a connectivity blip; surface a retry instead.
      if (isNetworkError(err) || (err instanceof ApiError && err.status >= 500)) {
        setState('BACKEND_UNAVAILABLE')
        return
      }
      setUnauthenticated()
    }
  }, [setAuthenticated, setUnauthenticated])

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  /* --- Listen for 401 events dispatched by client.ts --- */
  useEffect(() => {
    const onUnauthorized = () => setUnauthenticated()
    window.addEventListener('auth:logout', onUnauthorized)
    return () => window.removeEventListener('auth:logout', onUnauthorized)
  }, [setUnauthenticated])

  /* --- Auth methods: NEVER fall back to mock (brief §2/§13) --- */
  const login = useCallback(async (email: string, password: string) => {
    const { user: u, token } = await client.post<SessionResponse>('/auth/login', {
      email,
      password,
    })
    setToken(token)
    setAuthenticated(u)
    return toUser(u)
  }, [setAuthenticated])

  const register = useCallback(async (payload: RegisterPayload) => {
    const { user: u, token } = await client.post<SessionResponse>('/auth/register', payload)
    setToken(token)
    setAuthenticated(u)
    return toUser(u)
  }, [setAuthenticated])

  const logout = useCallback(async () => {
    try {
      await client.post('/auth/logout')
    } catch {
      /* local logout regardless of network state */
    }
    setUnauthenticated()
  }, [setUnauthenticated])

  const handleUnauthorized = useCallback(() => {
    setUnauthenticated()
  }, [setUnauthenticated])

  const retry = useCallback(async () => {
    await bootstrap()
  }, [bootstrap])

  const value = useMemo<AuthContextValue>(
    () => ({
      state,
      user,
      loading: state === 'INITIALIZING',
      login,
      register,
      logout,
      handleUnauthorized,
      retry,
    }),
    [state, user, login, register, logout, handleUnauthorized, retry],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
