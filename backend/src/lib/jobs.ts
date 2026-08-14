/* ============================================================
    Background job queue (Phase 15 — Reliability).
    Uses Upstash Redis lists as a simple FIFO queue. A separate
    consumer (Vercel Cron or external worker) processes jobs.

    Enqueue with `enqueueJob(type, payload)`.
    The consumer endpoint is `POST /api/jobs/process`.
    ============================================================ */

import { Redis } from '@upstash/redis'
import { cacheMode } from './cache'

const JOB_QUEUE_KEY = 'jobs:queue'
const JOB_PROCESSED_KEY = 'jobs:processed'
const JOB_DEAD_LETTER_KEY = 'jobs:dead'
const MAX_RETRIES = 3

type JobType = 'email' | 'ai-diagnosis' | 'notification' | 'recalculate'

export interface Job {
  id: string
  type: JobType
  payload: Record<string, unknown>
  createdAt: string
  retries: number
}

let redis: Redis | null = null

function getRedis(): Redis | null {
  if (cacheMode !== 'redis') return null
  if (!redis) {
    try {
      redis = Redis.fromEnv()
    } catch {
      return null
    }
  }
  return redis
}

export async function enqueueJob(type: JobType, payload: Record<string, unknown>): Promise<string | null> {
  const r = getRedis()
  if (!r) return null
  try {
    const job: Job = {
      id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type,
      payload,
      createdAt: new Date().toISOString(),
      retries: 0,
    }
    await r.lpush(JOB_QUEUE_KEY, JSON.stringify(job))
    return job.id
  } catch {
    return null
  }
}

export async function dequeueJob(): Promise<Job | null> {
  const r = getRedis()
  if (!r) return null
  try {
    const raw = await r.rpop<string>(JOB_QUEUE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Job
  } catch {
    return null
  }
}

export async function markJobProcessed(job: Job): Promise<void> {
  const r = getRedis()
  if (!r) return
  try {
    await r.lpush(JOB_PROCESSED_KEY, JSON.stringify(job))
    await r.expire(JOB_PROCESSED_KEY, 86400)
  } catch { /* ignore */ }
}

export async function requeueJob(job: Job): Promise<void> {
  const r = getRedis()
  if (!r) return
  try {
    job.retries = (job.retries ?? 0) + 1
    if (job.retries >= MAX_RETRIES) {
      await r.lpush(JOB_DEAD_LETTER_KEY, JSON.stringify(job))
      await r.expire(JOB_DEAD_LETTER_KEY, 86400)
      console.error(`[jobs] Job ${job.id} moved to dead-letter queue after ${job.retries} retries`)
      return
    }
    await r.lpush(JOB_QUEUE_KEY, JSON.stringify(job))
  } catch { /* ignore */ }
}

export async function getQueueDepth(): Promise<number> {
  const r = getRedis()
  if (!r) return 0
  try {
    return (await r.llen(JOB_QUEUE_KEY)) ?? 0
  } catch {
    return 0
  }
}

export async function getDeadLetterDepth(): Promise<number> {
  const r = getRedis()
  if (!r) return 0
  try {
    return (await r.llen(JOB_DEAD_LETTER_KEY)) ?? 0
  } catch {
    return 0
  }
}
