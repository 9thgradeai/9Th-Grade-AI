import { Context, Next } from 'hono'
import { prisma } from '../app'
import type { AppEnv } from '../types/env'

/* ============================================================
   RBAC middleware — role-based access control.
   Reads the user's role from the database (never from the client
   or JWT — brief §48), not from the token.

   Usage:
     app.use('/admin/*', roleGuard('admin'))
   ============================================================ */

export function roleGuard(...requiredRoles: string[]) {
  return async (c: Context<AppEnv>, next: Next) => {
    const userId = c.get('userId') as string | undefined
    if (!userId) {
      return c.json({ error: 'Authentication required' }, 401)
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }

    if (!requiredRoles.includes(user.role)) {
      return c.json({ error: 'Insufficient permissions' }, 403)
    }

    await next()
  }
}
