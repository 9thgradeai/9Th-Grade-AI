import { handle } from 'hono/vercel'
import { app } from '../src/app'

/**
 * Bundling entry for the Vercel Function. This file is esbuild-bundled into
 * the single self-contained `api/index.js` by `build:vercel`. Vercel's api/
 * builder only processes the entry file and cannot resolve the backend's
 * extensionless relative imports across src/, so we bundle everything into one
 * file (node_modules packages stay external). This entry lives outside api/ so
 * it is never detected as a function itself.
 *
 * Vercel's Node.js runtime invokes the exported function with a Node
 * `IncomingMessage`/`ServerResponse` (plain-object `headers`, no `.get`),
 * whereas Hono's `handle()` → `app.fetch(req)` expects a standard Web
 * `Request`. We therefore adapt: build a real `Request` from the incoming
 * message, run the app, and write the resulting `Response` back through the
 * Node server-response. A genuine Web `Request` (fetch-style invocation) is
 * passed straight through untouched.
 */
export const runtime = 'nodejs'

async function toWebRequest(req: import('node:http').IncomingMessage): Promise<Request> {
  const host = req.headers.host || 'localhost'
  const url = new URL(req.url || '/', `http://${host}`)

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
  let body: string | undefined
  if (hasBody) {
    body = await new Promise<string | undefined>((resolve) => {
      const chunks: Buffer[] = []
      req.on('data', (c: Buffer) => chunks.push(c))
      req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8') || undefined))
      req.on('error', () => resolve(undefined))
    })
  }

  return new Request(url.toString(), {
    method: req.method,
    headers: req.headers as Record<string, string>,
    body: hasBody ? body : undefined,
  })
}

async function writeNodeResponse(
  res: import('node:http').ServerResponse,
  response: Response,
): Promise<void> {
  res.statusCode = response.status
  for (const [k, v] of response.headers.entries()) {
    res.setHeader(k, v)
  }
  const buf = Buffer.from(await response.arrayBuffer())
  res.end(buf)
}

const fetchHandler = handle(app)

export default async function handler(
  req: Request | import('node:http').IncomingMessage,
  res?: import('node:http').ServerResponse,
): Promise<Response | void> {
  // fetch-style: Vercel passed a Web Request → return the Response directly.
  if (req && typeof req.headers?.get === 'function' && req instanceof Request) {
    return fetchHandler(req)
  }
  // node-style: adapt the IncomingMessage and write to the ServerResponse.
  const incoming = req as import('node:http').IncomingMessage
  const response = await fetchHandler(await toWebRequest(incoming))
  if (res) {
    await writeNodeResponse(res, response)
    return
  }
  return response
}
