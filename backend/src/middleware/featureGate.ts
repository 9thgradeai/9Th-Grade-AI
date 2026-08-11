import { Context, Next } from 'hono'
import type { AppEnv } from '../types/env'
import { getPlan, featureAccess, type Feature } from '../lib/subscription'

/* ============================================================
   Feature gate — server-side enforcement of paid features.

   Runs after authMiddleware (which sets userId). The plan is read
   from the Subscription row (defaults to 'free'), so access is
   server-authoritative — never inferred from the client.

   Usage:
     app.use('/revision', requireFeature('unlimited-revision'))
     // or inline (decision depends on the request body):
     if (!(await featureAllowed(userId, 'mock-tests'))) return locked(c, 'mock-tests')

   Denials return 402 Payment Required with a stable machine-readable
   body so the frontend can detect the paywall and show an upgrade
   prompt instead of masking it with a mock fallback.
   ============================================================ */

/** Whether `userId` may use `feature` under their current plan. */
export async function featureAllowed(userId: string, feature: Feature): Promise<boolean> {
  const plan = await getPlan(userId)
  return featureAccess(plan)[feature]
}

/** The shared 402 response body used by both the middleware and inline checks. */
export function lockedResponse(c: Context<AppEnv>, feature: Feature, plan: string) {
  return c.json(
    {
      error: 'This feature requires a paid plan',
      code: 'FEATURE_LOCKED',
      feature,
      plan,
    },
    402,
  )
}

/** Express-style guard that locks an entire route prefix behind a feature. */
export function requireFeature(feature: Feature) {
  return async (c: Context<AppEnv>, next: Next) => {
    const userId = c.get('userId') as string | undefined
    if (!userId) {
      return c.json({ error: 'Authentication required' }, 401)
    }

    const plan = await getPlan(userId)
    if (!featureAccess(plan)[feature]) {
      return lockedResponse(c, feature, plan)
    }

    await next()
  }
}
