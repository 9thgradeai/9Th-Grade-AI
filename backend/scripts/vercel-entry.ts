import { handle } from 'hono/vercel'
import { app } from '../src/app'

/**
 * Bundling entry for the Vercel Function. This file is esbuild-bundled into
 * the single self-contained `api/handler.js` by `build:vercel`. Vercel's api/
 * builder only processes the entry file and cannot resolve the backend's
 * extensionless relative imports across src/, so we bundle everything into one
 * file (node_modules packages stay external). This entry lives outside api/ so
 * it is never detected as a function itself.
 */
export const runtime = 'nodejs'
export default handle(app)
