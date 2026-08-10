import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from '@/lib/types'
import { client, getToken, setToken } from '@/lib/client'
import { clearApiCache } from '@/lib/api'

/* ============================================================
   Auth store — session bootstrap, login, register, logout.
   Uses the Bearer token from localStorage. Additive and
   non-gating: when there's no token (or the API is unreachable)
   the app keeps working anonymously — data routes fall back to
   mock. A real login gate is a follow-up feature.
   ============================================================ */

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
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (payload: RegisterPayload) => Promise<User>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const applySession = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const me = await client.get<UserPayload>('/users/me')
      setUser(toUser(me))
    } catch {
      setToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void applySession()
  }, [applySession])

  const login = useCallback(async (email: string, password: string) => {
    const { user: u, token } = await client.post<SessionResponse>('/auth/login', {
      email,
      password,
    })
    setToken(token)
    setUser(toUser(u))
    return toUser(u)
  }, [])

  const register = useCallback(async (payload: RegisterPayload) => {
    const { user: u, token } = await client.post<SessionResponse>('/auth/register', payload)
    setToken(token)
    setUser(toUser(u))
    return toUser(u)
  }, [])

  const logout = useCallback(async () => {
    try {
      await client.post('/auth/logout')
    } catch {
      /* local logout regardless of network state */
    }
    setToken(null)
    setUser(null)
    clearApiCache()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
