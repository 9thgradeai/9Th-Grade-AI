/* ============================================================
   Subscription & feature-gating helpers (Phase 5 — Payments).
   Plan is read from the Subscription row (defaults to 'free').
   Feature access is server-computed so clients can gate their UI;
   a hard server-side gate can be layered on later once the frontend
   consumes these flags.
   ============================================================ */

import { prisma } from '../app'

export type Plan = 'free' | 'pro' | 'enterprise'
export type Feature = 'mock-tests' | 'adaptive-tests' | 'ai-strategy' | 'unlimited-revision'

const PLAN_FEATURES: Record<Plan, Feature[]> = {
  free: ['mock-tests', 'adaptive-tests', 'ai-strategy', 'unlimited-revision'],
  pro: ['mock-tests', 'adaptive-tests', 'ai-strategy', 'unlimited-revision'],
  enterprise: ['mock-tests', 'adaptive-tests', 'ai-strategy', 'unlimited-revision'],
}

export function featureAccess(plan: string): Record<Feature, boolean> {
  const granted = PLAN_FEATURES[(plan as Plan) in PLAN_FEATURES ? (plan as Plan) : 'free'] ?? []
  const set = new Set(granted)
  const all: Feature[] = ['mock-tests', 'adaptive-tests', 'ai-strategy', 'unlimited-revision']
  return all.reduce((acc, f) => {
    acc[f] = set.has(f)
    return acc
  }, {} as Record<Feature, boolean>)
}

/** The user's effective plan, defaulting to 'free'. */
export async function getPlan(userId: string): Promise<Plan> {
  const sub = await prisma.subscription.findUnique({ where: { userId } })
  if (!sub || sub.status !== 'active') return 'free'
  return (sub.plan as Plan) in PLAN_FEATURES ? (sub.plan as Plan) : 'free'
}

/** The subscription row (or null) plus effective plan and access flags. */
export async function getAccess(userId: string) {
  const sub = await prisma.subscription.findUnique({ where: { userId } })
  const plan = await getPlan(userId)
  return { subscription: sub, plan, features: featureAccess(plan) }
}
