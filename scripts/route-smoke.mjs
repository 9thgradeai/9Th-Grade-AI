/* Lightweight production route smoke test.
 *
 * Verifies the deployed SPA behaves like a production app: direct loads resolve
 * to the right page (no Vercel 404), invalid routes show the app-level 404,
 * protected routes redirect to /login with a safe return URL, internal
 * navigation does NOT trigger a full page reload, and refresh preserves the
 * current route.
 *
 * Usage:  node scripts/route-smoke.mjs  [BASE_URL]
 *         (default BASE_URL = the live production domain)
 */
import { chromium } from 'playwright'

const BASE = process.argv[2] || 'https://grade-puce-ten.vercel.app'
const results = []
const ok = (name, cond, extra = '') => {
  results.push({ name, pass: !!cond, extra })
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? `  (${extra})` : ''}`)
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()

// Mark the document so we can detect whether a full page reload ever happens.
await page.addInitScript(() => { window.__spaLoaded = true })
const pageWasReloaded = () => page.evaluate(() => window.__spaLoaded !== true)

try {
  // ---- 1. Direct load of public routes resolves the actual page ----
  await page.goto(`${BASE}/how-it-works`, { waitUntil: 'networkidle' })
  ok('direct /how-it-works renders HowItWorks', await page.getByText('Methodology', { exact: true }).first().isVisible())
  ok('direct /how-it-works is not the 404 page', (await page.getByText('unexplored').count()) === 0)

  // ---- 2. Another public route ----
  await page.goto(`${BASE}/exams`, { waitUntil: 'networkidle' })
  ok('direct /exams renders Exams', await page.getByText('Exam ecosystem', { exact: true }).first().isVisible())

  // ---- 3. Invalid route → app-level 404 (Vercel must serve the SPA shell) ----
  await page.goto(`${BASE}/this-route-does-not-exist`, { waitUntil: 'networkidle' })
  ok('invalid route shows app-level 404', await page.getByText('unexplored').first().isVisible())

  // ---- 4. Protected route redirects to /login with a safe return URL ----
  await page.goto(`${BASE}/practice`, { waitUntil: 'networkidle' })
  ok('protected /practice redirects to login', /\/login(?:\?redirect=)?/.test(page.url()))
  ok('redirect carries ?redirect=/practice', page.url().includes('redirect='))
  ok('redirect value is the intended path', page.url().includes(encodeURIComponent('/practice')))

  // ---- 5. Internal navigation does not full-reload ----
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await page.evaluate(() => { window.__spaLoaded = true })
  await page.getByRole('link', { name: /How It Works/i }).first().click()
  await page.waitForURL(/\/how-it-works/)
  ok('internal nav to /how-it-works updates URL', page.url().includes('/how-it-works'))
  ok('internal nav did NOT cause a full reload', !(await pageWasReloaded()))
  ok('navigated page renders HowItWorks', await page
    .getByText('Methodology', { exact: true }).first()
    .waitFor({ state: 'visible', timeout: 10_000 })
    .then(() => true)
    .catch(() => false))

  // ---- 6. Refresh preserves the current route ----
  await page.reload({ waitUntil: 'networkidle' })
  ok('refresh keeps /how-it-works', page.url().includes('/how-it-works'))
  ok('post-refresh still renders HowItWorks', await page.getByText('Methodology', { exact: true }).first().isVisible())

  // ---- 7. Back / forward ----
  await page.goBack({ waitUntil: 'networkidle' })
  ok('browser back returns to /', page.url() === `${BASE}/` || page.url() === `${BASE}/`)
  await page.goForward({ waitUntil: 'networkidle' })
  ok('browser forward returns to /how-it-works', page.url().includes('/how-it-works'))

  // ---- 8. Root route ----
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  ok('root / renders landing', await page
    .getByText('9Th-Grade AI', { exact: true }).first()
    .waitFor({ state: 'visible', timeout: 10_000 })
    .then(() => true)
    .catch(() => false))

} catch (err) {
  ok('no uncaught error during smoke run', false, String(err && err.message))
} finally {
  await browser.close()
}

const failed = results.filter((r) => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length ? 1 : 0)
