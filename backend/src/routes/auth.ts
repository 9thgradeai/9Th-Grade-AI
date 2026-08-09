import { Hono } from 'hono'
import { z } from 'zod'
import { randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '../app'
import type { AppEnv } from '../types/env'
import { signToken, verifyToken, authMiddleware } from '../middleware/auth'
import { rateLimit, clientIp } from '../middleware/rateLimit'
import { sendEmail } from '../lib/email'

/* ============================================================
   Auth routes — register, login, logout, session, password reset,
   email verification.
   ============================================================ */

export const authRoutes = new Hono<AppEnv>()

// Brute-force guard: 5 auth requests / min / IP.
authRoutes.use('*', rateLimit({ windowMs: 60_000, max: 5, key: (c) => clientIp(c) }))

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  firstName: z.string().min(1),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

// Register
authRoutes.post('/register', async (c) => {
  const body = await c.req.json()
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400)
  }

  const { email, password, name, firstName } = parsed.data

  // Check if user exists
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return c.json({ error: 'Email already registered' }, 409)
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12)

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      name,
      firstName,
      password: hashedPassword,
    },
  })

  // Transactional welcome email (fire-and-forget; mock in dev).
  void sendEmail({
    to: email,
    subject: 'Welcome to 9Th-Grade AI',
    text: `Hi ${firstName || name || 'there'},\n\nYour account is ready. Log in and run a diagnostic to unlock your personalized plan.\n\n— The 9Th-Grade AI team`,
  })

  // Sign token
  const token = signToken({ userId: user.id, email: user.email })

  // Set cookie
  c.header('Set-Cookie', `token=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`)

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      timezone: user.timezone,
      createdAt: user.createdAt,
    },
    token,
  }, 201)
})

// Login
authRoutes.post('/login', async (c) => {
  const body = await c.req.json()
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400)
  }

  const { email, password } = parsed.data

  // Find user
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.password) {
    return c.json({ error: 'Invalid email or password' }, 401)
  }

  // Verify password
  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    return c.json({ error: 'Invalid email or password' }, 401)
  }

  // Sign token
  const token = signToken({ userId: user.id, email: user.email })

  // Set cookie
  c.header('Set-Cookie', `token=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`)

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      timezone: user.timezone,
      createdAt: user.createdAt,
    },
    token,
  })
})

// Logout
authRoutes.post('/logout', (c) => {
  c.header('Set-Cookie', 'token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0')
  return c.json({ ok: true })
})

// Get current session
authRoutes.get('/session', async (c) => {
  const cookieToken = c.req.header('cookie')?.match(/token=([^;]+)/)?.[1]
  const headerToken = c.req.header('authorization')?.replace('Bearer ', '')
  const token = cookieToken || headerToken

  if (!token) {
    return c.json({ user: null })
  }

  const payload = verifyToken(token)
  if (!payload) {
    return c.json({ user: null })
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      timezone: true,
      avatar: true,
      createdAt: true,
    },
  })

  if (!user) {
    return c.json({ user: null })
  }

  return c.json({ user })
})

/* ------------------------------------------------------------------
   Password reset & email verification (Phase 8 hardening)
   ------------------------------------------------------------------ */

// POST /api/auth/forgot-password — always 200 to avoid leaking account existence.
authRoutes.post('/forgot-password', async (c) => {
  const parsed = z.object({ email: z.string().email() }).safeParse(await c.req.json())
  if (!parsed.success) return c.json({ error: 'Invalid email' }, 400)
  const { email } = parsed.data
  const user = await prisma.user.findUnique({ where: { email } })
  if (user) {
    const token = randomBytes(32).toString('hex')
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpires: new Date(Date.now() + 3600_000) },
    })
    void sendEmail({
      to: email,
      subject: 'Reset your 9Th-Grade AI password',
      text: `Use this token to reset your password. It expires in 1 hour:\n\n${token}\n\nPOST /api/auth/reset-password with { "token", "newPassword" }.`,
    })
  }
  return c.json({ ok: true })
})

// POST /api/auth/reset-password
authRoutes.post('/reset-password', async (c) => {
  const parsed = z
    .object({ token: z.string().min(10), newPassword: z.string().min(8) })
    .safeParse(await c.req.json())
  if (!parsed.success) return c.json({ error: 'Invalid input' }, 400)
  const { token, newPassword } = parsed.data
  const user = await prisma.user.findFirst({
    where: { resetToken: token, resetTokenExpires: { gt: new Date() } },
  })
  if (!user) return c.json({ error: 'Invalid or expired token' }, 400)
  const hashed = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed, resetToken: null, resetTokenExpires: null },
  })
  return c.json({ ok: true })
})

// POST /api/auth/change-password (authed)
authRoutes.post('/change-password', authMiddleware, async (c) => {
  const userId = c.get('userId') as string
  const parsed = z
    .object({ currentPassword: z.string(), newPassword: z.string().min(8) })
    .safeParse(await c.req.json())
  if (!parsed.success) return c.json({ error: 'Invalid input' }, 400)
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user?.password) return c.json({ error: 'Account has no password' }, 400)
  const valid = await bcrypt.compare(parsed.data.currentPassword, user.password)
  if (!valid) return c.json({ error: 'Current password is incorrect' }, 401)
  const hashed = await bcrypt.hash(parsed.data.newPassword, 12)
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } })
  return c.json({ ok: true })
})

// POST /api/auth/request-verification (authed)
authRoutes.post('/request-verification', authMiddleware, async (c) => {
  const userId = c.get('userId') as string
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return c.json({ error: 'User not found' }, 404)
  if (user.emailVerified) return c.json({ ok: true, alreadyVerified: true })
  const token = randomBytes(32).toString('hex')
  await prisma.user.update({ where: { id: userId }, data: { verificationToken: token } })
  void sendEmail({
    to: user.email,
    subject: 'Verify your 9Th-Grade AI email',
    text: `Use this token to verify your email:\n\n${token}\n\nPOST /api/auth/verify-email with { "token" }.`,
  })
  return c.json({ ok: true })
})

// POST /api/auth/verify-email
authRoutes.post('/verify-email', async (c) => {
  const parsed = z.object({ token: z.string().min(10) }).safeParse(await c.req.json())
  if (!parsed.success) return c.json({ error: 'Invalid token' }, 400)
  const user = await prisma.user.findFirst({ where: { verificationToken: parsed.data.token } })
  if (!user) return c.json({ error: 'Invalid token' }, 400)
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, verificationToken: null },
  })
  return c.json({ ok: true })
})
