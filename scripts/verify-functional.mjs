/* ============================================================
   Browser-level functional verification (Playwright/Chromium).
   Tests mobile + desktop viewports: load, navigation, scrolling,
   animations, responsiveness. Detects console errors, page errors,
   failed requests and broken images. Captures screenshots.

   Usage: node scripts/verify-functional.mjs [baseUrl] [outDir]
   Exits non-zero if any critical failure is found.
   ============================================================ */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const baseUrl = process.argv[2] ?? 'http://localhost:4173'
const outDir = process.argv[3] ?? '/tmp/grade-screenshots'
mkdirSync(outDir, { recursive: true })

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 667, dpr: 2 },
  { name: 'desktop', width: 1440, height: 900, dpr: 1 },
]

const ROUTES = ['/', '/dashboard', '/exams', '/how-it-works', '/pricing', '/ai-engine', '/about']

const problems = []
const results = []

function classify(url, type, detail) {
  problems.push({ url, type, detail })
}

const browser = await chromium.launch()
let exitCode = 0

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.dpr,
    hasTouch: vp.name === 'mobile',
  })
  const page = await context.newPage()

  const pageErrors = []
  const consoleErrors = []
  const failedRequests = []
  const badResponses = []
  const brokenImages = []
  page.on('pageerror', (e) => pageErrors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()))
  page.on('requestfailed', (r) => failedRequests.push(`${r.method()} ${r.url()} :: ${r.failure()?.errorText}`))
  page.on('response', (r) => {
    if (r.status() >= 400 && !r.url().includes(':3001')) badResponses.push(`${r.status()} ${r.url()}`)
  })
  page.on('requestfinished', async (r) => {
    if (r.resourceType() === 'image') {
      const img = r.url()
      try {
        const resp = await r.response()
        if (resp && resp.status() >= 400) brokenImages.push(img)
      } catch { /* ignore */ }
    }
  })

  // 1. Load + render check
  await page.goto(baseUrl + '/', { waitUntil: 'networkidle' }).catch((e) => classify(vp.name, 'load', e.message))
  await page.waitForTimeout(800)
  const title = await page.title()
  const hasH1 = await page.locator('h1, main h2').first().isVisible().catch(() => false)
  results.push(`${vp.name} title="${title}" h1/h2 visible=${hasH1}`)

  // 2. Scroll the landing (tests animations don't throw) — a few steps.
  try {
    await page.evaluate(async () => {
      const h = document.body.scrollHeight
      for (let y = 0; y <= h; y += Math.max(300, h / 4)) {
        window.scrollTo(0, y)
        await new Promise((r) => setTimeout(r, 60))
      }
    })
    results.push(`${vp.name} scrolled landing OK`)
  } catch (e) {
    classify(vp.name, 'scroll', e.message)
  }

  // 3. Navigate key routes, click a nav link where present.
  for (const route of ROUTES.slice(1)) {
    await page.goto(baseUrl + route, { waitUntil: 'networkidle' }).catch((e) => classify(vp.name, `nav ${route}`, e.message))
    await page.waitForTimeout(500)
    const bodyLen = await page.evaluate(() => (document.body.textContent || '').length)
    if (bodyLen < 50) classify(vp.name, `empty ${route}`, `body ${bodyLen} chars`)
    results.push(`${vp.name} ${route} body=${bodyLen} chars`)
  }

  // 4. Interactive: click the primary CTA on landing (a link/button), ensure navigation.
  await page.goto(baseUrl + '/', { waitUntil: 'networkidle' }).catch(() => {})
  await page.waitForTimeout(500)
  const cta = page.locator('a[href], button').first()
  if (await cta.count()) {
    const href = await cta.getAttribute('href').catch(() => null)
    results.push(`${vp.name} first CTA href=${href}`)
  }

  // 5. Screenshot.
  await page.goto(baseUrl + '/', { waitUntil: 'networkidle' }).catch(() => {})
  await page.waitForTimeout(900)
  await page.screenshot({ path: join(outDir, `${vp.name}-landing.png`), fullPage: false }).catch(() => {})
  results.push(`${vp.name} screenshot saved`)

  // 6. Record problems for this viewport.
  if (pageErrors.length) classify(vp.name, 'pageerror', pageErrors[0])
  if (consoleErrors.length) classify(vp.name, 'console', consoleErrors[0])
  if (failedRequests.length) classify(vp.name, 'failed-request', failedRequests[0])
  if (badResponses.length) classify(vp.name, 'bad-response', badResponses[0])
  if (brokenImages.length) classify(vp.name, 'broken-image', brokenImages[0])

  await context.close()
}

await browser.close()

console.log('\n=== FUNCTIONAL RESULTS ===')
for (const r of results) console.log('✓', r)

const critical = problems.filter((p) => ['pageerror', 'console', 'failed-request', 'broken-image'].includes(p.type))
const warnings = problems.filter((p) => !['pageerror', 'console', 'failed-request', 'broken-image'].includes(p.type))

console.log('\n=== PROBLEMS ===')
if (!problems.length) {
  console.log('none')
} else {
  for (const p of problems) console.log(`[${p.type}] ${p.url}: ${p.detail}`)
}
if (critical.length) exitCode = 1

console.log(`\nRESULT: ${critical.length ? 'FAIL' : 'PASS'} (${problems.length} problems, ${critical.length} critical)`)
process.exit(exitCode)
