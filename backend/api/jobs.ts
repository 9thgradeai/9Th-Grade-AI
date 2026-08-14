import { Hono } from 'hono'
import { prisma } from '../src/app'
import { sendEmail } from '../src/lib/email'
import { realtime } from '../src/lib/realtime'
import { dequeueJob, markJobProcessed, requeueJob } from '../src/lib/jobs'
import { z } from 'zod'

const JOB_TIMEOUT_MS = 25_000

const emailJobSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  text: z.string().min(1),
})

const aiDiagnosisJobSchema = z.object({
  testId: z.string().min(1),
  userId: z.string().min(1),
})

const notificationJobSchema = z.object({
  userId: z.string().min(1),
  event: z.string().min(1),
  data: z.unknown(),
})

const app = new Hono()

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Job timed out after ${ms}ms`)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

app.post('/', async (c) => {
  const job = await dequeueJob()
  if (!job) return c.json({ status: 'idle' })

  try {
    await withTimeout(processJob(job), JOB_TIMEOUT_MS)
    await markJobProcessed(job)
    return c.json({ status: 'processed', jobId: job.id })
  } catch (err) {
    console.error(`Job ${job.id} failed:`, err)
    await requeueJob(job)
    return c.json({ status: 'error', jobId: job.id, error: (err as Error).message, retries: job.retries }, 500)
  }
})

async function processJob(job: any): Promise<void> {
  switch (job.type) {
    case 'email': {
      const payload = emailJobSchema.parse(job.payload)
      await sendEmail({
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
      })
      break
    }
    case 'ai-diagnosis': {
      const payload = aiDiagnosisJobSchema.parse(job.payload)
      const attempts = await prisma.questionAttempt.findMany({
        where: { testId: payload.testId },
        include: { question: { include: { topic: { include: { subject: true } } } } },
      })
      const modes: Record<string, number> = { 'concept-gap': 0, 'time-pressure': 0, careless: 0, 'difficulty-gap': 0 }
      for (const a of attempts) {
        if (a.correct) continue
        const q = a.question
        const overTarget = a.timeSpentSeconds > q.targetSeconds * 1.5
        const highConfidence = a.confidence >= 4
        const fast = a.timeSpentSeconds < q.targetSeconds * 0.6
        let mode: 'concept-gap' | 'time-pressure' | 'careless' | 'difficulty-gap'
        if (q.difficulty >= 4) mode = 'difficulty-gap'
        else if (overTarget) mode = 'time-pressure'
        else if (highConfidence && fast) mode = 'careless'
        else mode = 'concept-gap'
        modes[mode]++
      }
      const recs: Array<Record<string, unknown>> = []
      if (modes['concept-gap'] > 0) {
        recs.push({
          userId: payload.userId, kind: 'diagnosis', severity: 'high',
          title: 'Concept gaps detected',
          body: `${modes['concept-gap']} wrong answers trace to fundamentals. Review the affected topics, then re-attempt.`,
          actionLabel: 'Review topic', actionRoute: null,
        })
      }
      if (modes['time-pressure'] > 0) {
        recs.push({
          userId: payload.userId, kind: 'action', severity: 'medium',
          title: 'Time pressure is costing marks',
          body: `${modes['time-pressure']} errors happened after you ran long. Practise with a per-question timer to raise your pacing.`,
          actionLabel: 'Paced practice', actionRoute: null,
        })
      }
      if (modes.careless > 0) {
        recs.push({
          userId: payload.userId, kind: 'alert', severity: 'medium',
          title: 'Careless mistakes',
          body: `${modes.careless} wrong answers were quick and high-confidence. Slow down on 2-mark reads and double-check.`,
          actionLabel: null, actionRoute: null,
        })
      }
      if (modes['difficulty-gap'] > 0) {
        recs.push({
          userId: payload.userId, kind: 'strategy', severity: 'high',
          title: 'Pushing difficulty too fast',
          body: `${modes['difficulty-gap']} errors came from high-difficulty questions. Stabilise accuracy before advancing.`,
          actionLabel: null, actionRoute: null,
        })
      }
      if (recs.length === 0) {
        recs.push({
          userId: payload.userId, kind: 'diagnosis', severity: 'low',
          title: 'Clean session',
          body: 'No error pattern detected. Maintain the streak and raise the difficulty one step.',
          actionLabel: null, actionRoute: null,
        })
      }
      await prisma.aIRecommendation.createMany({ data: recs })
      realtime.publishToUser(payload.userId, 'recommendation:new', { count: recs.length })
      break
    }
    case 'notification': {
      const payload = notificationJobSchema.parse(job.payload)
      realtime.publishToUser(payload.userId, payload.event as any, payload.data)
      break
    }
    default:
      break
  }
}

export default app
