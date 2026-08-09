import { Context, Next } from 'hono'
import { prisma } from '../app'
import type { AppEnv } from '../types/env'

/* ============================================================
   Admin guard — requires the authenticated user to have role=admin.
   Runs after authMiddleware (which sets userId).
   ============================================================ */

export async function requireAdmin(c: Context<AppEnv>, next: Next) {
  const userId = c.get('userId') as string
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })
  if (user?.role !== 'admin') {
    return c.json({ error: 'Admin access required' }, 403)
  }
  await next()
}
