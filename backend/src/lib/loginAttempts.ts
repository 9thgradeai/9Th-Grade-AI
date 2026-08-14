/* ============================================================
   Login attempt tracking — account-level brute-force protection.
   Combines IP-based and account-based tracking with exponential
   backoff. Accounts are never permanently locked.

   Uses Redis when available; falls back to in-memory store.
   ============================================================ */

import { cacheMode } from './cache'
import { Redis } from '@upstash/redis'

interface AttemptRecord {
  count: number
  firstAttempt: number
  lastAttempt: number
  lockedUntil: number
}

const MAX_ATTEMPTS = 5
const BASE_DELAY_MS = 1_000
const MAX_DELAY_MS = 30_000
const WINDOW_MS = 15 * 60_000 // 15 minutes

let redis: Redis | null = null
if (cacheMode === 'redis') {
  try {
    redis = Redis.fromEnv()
  } catch {
    redis = null
  }
}

const mem = new Map<string, AttemptRecord>()

function now() {
  return Date.now()
}

function memGet(key: string): AttemptRecord | null {
  const r = mem.get(key)
  if (!r) return null
  if (r.lockedUntil > now()) return r
  if (now() - r.lastAttempt > WINDOW_MS) {
    mem.delete(key)
    return null
  }
  return r
}

function memSet(key: string, record: AttemptRecord) {
  mem.set(key, record)
}

async function redisGet(key: string): Promise<AttemptRecord | null> {
  if (!redis) return null
  try {
    const raw = await redis.get(key)
    if (!raw) return null
    const record = raw as AttemptRecord
    if (record.lockedUntil > now()) return record
    if (now() - record.lastAttempt > WINDOW_MS) {
      await redis.del(key)
      return null
    }
    return record
  } catch {
    return null
  }
}

async function redisSet(key: string, record: AttemptRecord): Promise<void> {
  if (!redis) return
  try {
    await redis.set(key, record, { ex: Math.ceil(WINDOW_MS / 1000) })
  } catch {
    /* ignore */
  }
}

export async function getRecord(key: string): Promise<AttemptRecord | null> {
  const r = await redisGet(key)
  if (r) return r
  return memGet(key)
}

async function setRecord(key: string, record: AttemptRecord): Promise<void> {
  memSet(key, record)
  await redisSet(key, record)
}

export async function recordFailedLogin(accountKey: string, ipKey: string): Promise<void> {
  const nowMs = now()
  const accountRecord = (await getRecord(accountKey)) || { count: 0, firstAttempt: nowMs, lastAttempt: nowMs, lockedUntil: 0 }
  const ipRecord = (await getRecord(ipKey)) || { count: 0, firstAttempt: nowMs, lastAttempt: nowMs, lockedUntil: 0 }

  accountRecord.count += 1
  accountRecord.lastAttempt = nowMs
  if (accountRecord.count >= MAX_ATTEMPTS) {
    const delay = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** (accountRecord.count - MAX_ATTEMPTS))
    accountRecord.lockedUntil = nowMs + delay
  }

  ipRecord.count += 1
  ipRecord.lastAttempt = nowMs
  if (ipRecord.count >= MAX_ATTEMPTS) {
    const delay = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** (ipRecord.count - MAX_ATTEMPTS))
    ipRecord.lockedUntil = nowMs + delay
  }

  await setRecord(accountKey, accountRecord)
  await setRecord(ipKey, ipRecord)
}

export async function clearFailedLogin(accountKey: string, ipKey: string): Promise<void> {
  mem.delete(accountKey)
  mem.delete(ipKey)
  if (redis) {
    try {
      await redis.del(accountKey, ipKey)
    } catch {
      /* ignore */
    }
  }
}

export async function getLockoutRemaining(accountKey: string, ipKey: string): Promise<number> {
  const accountRecord = await getRecord(accountKey)
  const ipRecord = await getRecord(ipKey)
  const accountLock = accountRecord?.lockedUntil ?? 0
  const ipLock = ipRecord?.lockedUntil ?? 0
  const maxLock = Math.max(accountLock, ipLock)
  if (maxLock > now()) {
    return Math.ceil((maxLock - now()) / 1000)
  }
  return 0
}

export function isLockedOut(record: AttemptRecord | null): boolean {
  if (!record) return false
  return record.lockedUntil > now()
}
