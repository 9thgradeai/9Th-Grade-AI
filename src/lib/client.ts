/* ============================================================
   HTTP client for the 9Th-Grade AI API.
   One thin, well-behaved fetch wrapper the whole app uses:
     - base URL: VITE_API_URL if set, else localhost:3001 in dev, else
       the same-origin `/api` (proxied to the backend via vercel.json so
       the HttpOnly auth cookie is same-site and attaches).
     - session: the backend's HttpOnly+Secure cookie is the durable store;
       we also keep an in-memory copy for the Bearer header, mirroring to
       localStorage ONLY in dev (plain-http localhost can't set the cookie).
     - per-request timeout (AbortController)
     - X-Request-Id propagation
     - structured ApiError (status + message + requestId)
     - single-flight token refresh on 401: renew the session once and retry
       before ever force-logging-out, so long sessions slide instead of
       hard-401ing when the 7-day token expires.
     - automatic retry with backoff ONLY for transient network errors
       on idempotent GETs (never for mutations)
   ============================================================ */

const TOKEN_KEY = 'grade.token'
const DEFAULT_TIMEOUT_MS = 10_000
const GET_RETRIES = 2
const RETRY_BASE_MS = 300

/** Same-origin `/api` in production (proxied to the backend, cookie-friendly). */
const configuredApi = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '')
export const API_BASE: string =
  configuredApi || (import.meta.env.DEV ? 'http://localhost:3001/api' : '/api')

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

/* --- Session token ----------------------------------------------------
   The HttpOnly cookie is the durable credential. We keep an in-memory copy
   for the Bearer header; in dev we mirror to localStorage (localhost can't
   receive the Secure cookie). In prod the token never touches localStorage,
   so XSS can't exfiltrate a session secret. */
let memToken: string | null = null

export function getToken(): string | null {
  return memToken ?? (import.meta.env.DEV ? localStorage.getItem(TOKEN_KEY) : null)
}

export function setToken(token: string | null): void {
  memToken = token
  if (import.meta.env.DEV) {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  }
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

/* --- Single-flight refresh ---------------------------------------------
   On 401 we try to renew the session once (POST /auth/refresh, cookie or
   Bearer). Only if refresh fails do we force-logout. `/auth/*` calls never
   self-refresh, avoiding loops. */
let refreshPromise: Promise<string | null> | null = null

function refreshSession(): Promise<string | null> {
  if (refreshPromise) return refreshPromise
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Id': requestId(),
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
        credentials: 'include',
        signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      })
      if (!res.ok) return null
      const data = (await res.json()) as { token?: string }
      if (!data.token) return null
      setToken(data.token)
      return data.token
    } catch {
      return null
    } finally {
      refreshPromise = null
    }
  })()
  return refreshPromise
}

async function request<T>(method: string, path: string, opts: RequestOptions = {}, authRetried = false): Promise<T> {
  const rid = requestId()
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
      let code: string | undefined
      try {
        const body = (await res.json()) as { error?: string; requestId?: string; code?: string }
        if (body.error) message = body.error
        serverRid = body.requestId
        code = body.code
      } catch {
        /* non-JSON error body */
      }
      const err = new ApiError(res.status, message, serverRid ?? rid, code)

      /* 401: renew the session once, then retry; otherwise clear auth. */
      if (res.status === 401) {
        const isAuthCall = path.startsWith('/auth/')
        if (!isAuthCall && !authRetried) {
          const renewed = await refreshSession()
          if (renewed) {
            return await request<T>(method, path, opts, true)
          }
        }
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
