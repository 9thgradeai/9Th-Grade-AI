import { serve } from '@hono/node-server'
import { app, prisma } from './app'

const port = parseInt(process.env.PORT || '3001', 10)

console.log(`🚀 9Th-Grade AI API running on http://localhost:${port}`)

// Bootstrap: promote the ADMIN_EMAIL user to admin role on startup (if set).
const adminEmail = process.env.ADMIN_EMAIL
if (adminEmail) {
  prisma.user
    .updateMany({ where: { email: adminEmail }, data: { role: 'admin' } })
    .then((r) => {
      if (r.count > 0) console.log(`Admin role applied to ${adminEmail}`)
    })
    .catch(() => {})
}

serve({
  fetch: app.fetch,
  port,
})
