import { Context, Next } from 'hono'
import jwt from 'jsonwebtoken'
import type { AppEnv } from '../types/env'

/* ============================================================
   Auth middleware — verifies JWT from cookie or header.
   Attaches userId to context for downstream handlers.
   ============================================================ */

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-this'

/* Guard: refuse to start in production with the default dev secret. */
if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'dev-secret-change-this') {
  throw new Error('FATAL: JWT_SECRET must be set in production. Refusing to start with default secret.')
}

export interface AuthUser {
  userId: string
  email: string
}

const JWT_ISSUER = '9th-grade-ai'

export function signToken(payload: AuthUser): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d', issuer: JWT_ISSUER })
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET, { issuer: JWT_ISSUER }) as AuthUser
  } catch {
    return null
  }
}

export async function authMiddleware(c: Context<AppEnv>, next: Next) {
  // Try cookie first, then Authorization header
  const cookieToken = c.req.header('cookie')?.match(/token=([^;]+)/)?.[1]
  const headerToken = c.req.header('authorization')?.replace('Bearer ', '')
  const token = cookieToken || headerToken

  if (!token) {
    return c.json({ error: 'Authentication required' }, 401)
  }

  const user = verifyToken(token)
  if (!user) {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }

  c.set('userId', user.userId)
  c.set('email', user.email)
  await next()
}
