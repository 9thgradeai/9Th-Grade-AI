import { Hono } from 'hono'
import { z } from 'zod'
import Stripe from 'stripe'
import { prisma } from '../app'
import type { AppEnv } from '../types/env'
import { getAccess, type Plan } from '../lib/subscription'

/* ============================================================
   Payments routes (Phase 5).
   Uses Stripe when STRIPE_SECRET_KEY is configured. Without a key it
   runs in a clearly-labelled mock mode so the flow is testable in
   development — swap in real keys to go live (no code changes).
   ============================================================ */

const stripeKey = process.env.STRIPE_SECRET_KEY
const stripe = stripeKey ? new Stripe(stripeKey) : null
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
const MOCK = !stripe

export const paymentsRoutes = new Hono<AppEnv>()

// GET /api/payments/subscription
paymentsRoutes.get('/subscription', async (c) => {
  const userId = c.get('userId') as string
  const { subscription, plan, features } = await getAccess(userId)
  return c.json({
    mock: MOCK,
    plan,
    features,
    currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
    status: subscription?.status ?? 'none',
  })
})

const checkoutSchema = z.object({ plan: z.enum(['pro', 'enterprise']) })

// POST /api/payments/checkout
paymentsRoutes.post('/checkout', async (c) => {
  const userId = c.get('userId') as string
  const email = c.get('email') as string
  const body = await c.req.json()
  const parsed = checkoutSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400)
  }
  const plan = parsed.data.plan as Plan

  if (!stripe) {
    // Mock mode — no real charge; activation happens via the webhook.
    return c.json({
      mock: true,
      sessionId: `mock_${plan}_${userId}`,
      url: null,
      plan,
      note: 'No STRIPE_SECRET_KEY set — checkout is simulated.',
    })
  }

  let sub = await prisma.subscription.findUnique({ where: { userId } })
  let customerId = sub?.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({ email, metadata: { userId } })
    customerId = customer.id
  }
  const priceId = process.env.STRIPE_PRICE_PRO
  if (!priceId) {
    return c.json({ error: 'STRIPE_PRICE_PRO is not configured' }, 500)
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    client_reference_id: userId,
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { plan, userId },
    success_url: process.env.FRONTEND_URL + '/dashboard?checkout=success',
    cancel_url: process.env.FRONTEND_URL + '/pricing?checkout=cancelled',
  })

  // Persist customer id so later checkouts reuse the same customer.
  await prisma.subscription.upsert({
    where: { userId },
    update: { stripeCustomerId: customerId },
    create: { userId, stripeCustomerId: customerId, plan: 'free', status: 'active' },
  })

  return c.json({ mock: false, sessionId: session.id, url: session.url, plan })
})

// POST /api/payments/cancel
paymentsRoutes.post('/cancel', async (c) => {
  const userId = c.get('userId') as string
  const sub = await prisma.subscription.findUnique({ where: { userId } })
  if (!sub) return c.json({ error: 'No subscription to cancel' }, 404)

  if (stripe && sub.stripeSubscriptionId) {
    await stripe.subscriptions.cancel(sub.stripeSubscriptionId)
  }

  const updated = await prisma.subscription.update({
    where: { userId },
    data: { status: 'canceled' },
  })
  return c.json({ plan: updated.plan, status: updated.status, mock: MOCK })
})

/* ------------------------------------------------------------------
   Public webhook — mounted at /api/payments/webhook WITHOUT auth.
   ------------------------------------------------------------------ */

export const webhookRoute = new Hono()

webhookRoute.post('/', async (c) => {
  const raw = await c.req.raw.text()

  let event: Stripe.Event
  if (stripe && webhookSecret) {
    const signature = c.req.header('stripe-signature')
    if (!signature) return c.json({ error: 'Missing stripe-signature header' }, 400)
    try {
      event = stripe.webhooks.constructEvent(raw, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return c.json({ error: 'Invalid signature' }, 400)
    }
  } else {
    event = JSON.parse(raw) as Stripe.Event // mock / unverified mode
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = (session.client_reference_id as string) || session.metadata?.userId
      const plan = (session.metadata?.plan as Plan) || 'pro'
      const amount = session.amount_total ?? 0
      const currentPeriodEnd = defaultPeriodEnd()

      const subRef = session.subscription
      const subId = typeof subRef === 'string' ? subRef : subRef?.id ?? undefined
      const custRef = session.customer
      const custId = typeof custRef === 'string' ? custRef : custRef?.id ?? undefined

      if (userId) {
        await prisma.subscription.upsert({
          where: { userId },
          update: {
            plan,
            status: 'active',
            stripeSubscriptionId: subId,
            stripeCustomerId: custId,
            currentPeriodEnd,
          },
          create: {
            userId,
            plan,
            status: 'active',
            stripeSubscriptionId: subId,
            stripeCustomerId: custId,
            currentPeriodEnd,
          },
        })
        await prisma.invoice.create({
          data: {
            userId,
            subscriptionId: await subscriptionId(userId),
            stripeInvoiceId: (session.invoice as string) || null,
            amount,
            status: 'paid',
          },
        })
      }
      break
    }
    default:
      break
  }

  return c.json({ received: true })
})

/** A 30-day cycle as the subscription period end (Stripe would supply the
    exact timestamp; this vendored typings build omits the field, and mock
    mode has no live subscription anyway). */
function defaultPeriodEnd(): Date {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
}

async function subscriptionId(userId: string): Promise<string | null> {
  const sub = await prisma.subscription.findUnique({ where: { userId } })
  return sub?.id ?? null
}
