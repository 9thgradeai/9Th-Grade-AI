import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '../app'
import type { AppEnv } from '../types/env'

/* ============================================================
   User routes — profile CRUD.
   ============================================================ */

export const userRoutes = new Hono<AppEnv>()

// Get current user
userRoutes.get('/me', async (c) => {
  const userId = c.get('userId') as string
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      timezone: true,
      avatar: true,
      createdAt: true,
      onboardingData: true,
    },
  })

  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  return c.json(user)
})

// Save onboarding preferences (idempotent)
const preferencesSchema = z.object({
  examId: z.string().min(1),
  examDate: z.string(),
  dailyTime: z.string(),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  diagnosticScore: z.number().min(0).max(100),
  priorities: z.array(z.string()).optional(),
})

userRoutes.post('/me/preferences', async (c) => {
  const userId = c.get('userId') as string
  const body = await c.req.json()
  const parsed = preferencesSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400)
  }

  await prisma.user.update({
    where: { id: userId },
    data: { onboardingData: parsed.data },
  })

  return c.json({ ok: true, onboardingCompleted: true })
})

// Get current user's onboarding state
userRoutes.get('/me/onboarding', async (c) => {
  const userId = c.get('userId') as string
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { onboardingData: true },
  })
  return c.json({ onboardingCompleted: !!user?.onboardingData, data: user?.onboardingData ?? null })
})

// Update profile
const updateSchema = z.object({
  name: z.string().min(1).optional(),
  firstName: z.string().min(1).optional(),
  timezone: z.string().optional(),
  avatar: z.string().url().optional(),
})

userRoutes.put('/me', async (c) => {
  const userId = c.get('userId') as string
  const body = await c.req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400)
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: parsed.data,
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

  return c.json(user)
})

// Delete account
userRoutes.delete('/me', async (c) => {
  const userId = c.get('userId') as string

  await prisma.user.delete({ where: { id: userId } })

  c.header('Set-Cookie', 'token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0')
  return c.json({ ok: true })
})
