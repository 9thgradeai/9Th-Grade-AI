import { Hono } from 'hono'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '../app'
import { signToken, verifyToken } from '../middleware/auth'
import { rateLimit, clientIp } from '../middleware/rateLimit'
import { sendEmail } from '../lib/email'

/* ============================================================
   Auth routes — register, login, logout, session.
   ============================================================ */

export const authRoutes = new Hono()

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
