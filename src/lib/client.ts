/* ============================================================
   HTTP client for the 9Th-Grade AI API.
   One thin, well-behaved fetch wrapper the whole app uses:
     - base URL from VITE_API_URL (falls back to localhost:3001)
     - Bearer token from localStorage (cross-origin dev; the backend
       sets HttpOnly+Secure cookies which don't stick over plain-http
       localhost, but it also returns `token` in JSON — we use that)
     - per-request timeout (AbortController)
     - X-Request-Id propagation
     - structured ApiError (status + message + requestId)
     - automatic retry with backoff ONLY for transient network errors
       on idempotent GETs (never for mutations)
   ============================================================ */

export const API_BASE: string =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') ||
  'http://localhost:3001/api'

const TOKEN_KEY = 'grade.token'
const DEFAULT_TIMEOUT_MS = 10_000
const GET_RETRIES = 2
const RETRY_BASE_MS = 300

/** Structured error thrown by the client. `status === 0` means network failure. */
export class ApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly requestId?: string
  constructor(status: number, message: string, requestId?: string, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.requestId = requestId
    this.code = code
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export function isNetworkError(e: unknown): boolean {
  return e instanceof ApiError && e.status === 0
}

/** Whether the backend rejected the request because a paid feature is locked. */
export function isFeatureLocked(e: unknown): boolean {
  return e instanceof ApiError && e.code === 'FEATURE_LOCKED'
}

function requestId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

interface RequestOptions {
  body?: unknown
  headers?: Record<string, string>
  timeoutMs?: number
}

/**
 * Whether a real backend is reachable. In dev the local API (localhost:3001)
 * is the intended target, so we always try it. In production we only attempt
 * network calls when a backend URL is configured — otherwise every request
 * would fire a CORS/net failure to a host that isn't there, spamming the
 * console on a live site. Requests short-circuit to the mock fallback instead.
 */
const hasBackend = Boolean(import.meta.env.VITE_API_URL) || import.meta.env.DEV

async function request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
  const rid = requestId()

  if (!hasBackend) {
    throw new ApiError(0, 'No backend configured — using local data', rid)
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? DEFAULT_TIMEOUT_MS)

  const token = getToken()
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': rid,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...opts.headers,
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
      credentials: 'include',
    })

    if (!res.ok) {
      let message = `Request failed (${res.status})`
      let serverRid: string | undefined
      try {
        const body = (await res.json()) as { error?: string; requestId?: string; code?: string }
        if (body.error) message = body.error
        serverRid = body.requestId
      } catch {
        /* non-JSON error body */
      }
      let code: string | undefined
      try {
        const codeBody = await res.clone().json() as { code?: string }
        code = codeBody.code
      } catch { /* no code in response */ }
      const err = new ApiError(res.status, message, serverRid ?? rid, code)
      /* Brief §13: on 401, clear auth and redirect — never silently mock. */
      if (res.status === 401) {
        window.dispatchEvent(new Event('auth:logout'))
      }
      throw err
    }

    if (res.status === 204) return undefined as T
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof ApiError) throw e
    // AbortError or fetch TypeError → network / timeout.
    throw new ApiError(0, controller.signal.aborted ? 'Request timed out' : 'Network error', rid)
  } finally {
    clearTimeout(timeout)
  }
}

async function requestWithRetry<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
  const idempotentGet = method === 'GET'
  let lastErr: ApiError = new ApiError(0, 'Network error')

  for (let attempt = 0; attempt <= (idempotentGet ? GET_RETRIES : 0); attempt++) {
    try {
      return await request<T>(method, path, opts)
    } catch (e) {
      lastErr = e instanceof ApiError ? e : new ApiError(0, 'Network error')
      const retryable = idempotentGet && isNetworkError(lastErr)
      if (!retryable || attempt >= (idempotentGet ? GET_RETRIES : 0)) throw lastErr
      // Exponential backoff + jitter (never retry on non-GET or non-transient).
      await new Promise((r) =>
        setTimeout(r, RETRY_BASE_MS * 2 ** attempt + Math.random() * RETRY_BASE_MS),
      )
    }
  }
  throw lastErr
}

export const client = {
  get: <T>(path: string, opts?: RequestOptions) =>
    requestWithRetry<T>('GET', path, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>('POST', path, { ...opts, body }),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>('PUT', path, { ...opts, body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>('PATCH', path, { ...opts, body }),
  delete: <T>(path: string, opts?: RequestOptions) => request<T>('DELETE', path, opts),
}
