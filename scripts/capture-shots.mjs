/* Capture reduced-motion (static) landing screenshots for visual comparison.
   Usage: node scripts/capture-shots.mjs <tag> <baseUrl> <outDir> */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const tag = process.argv[2] ?? 'shot'
const baseUrl = process.argv[3] ?? 'http://localhost:4173'
const outDir = process.argv[4] ?? '/tmp/shots'
mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch()
const shots = []
for (const vp of [{ name: 'm', w: 375, h: 667 }, { name: 'd', w: 1440, h: 900 }]) {
  const ctx = await browser.newContext({
    viewport: { width: vp.w, height: vp.h },
    reducedMotion: 'reduce',
  })
  const page = await ctx.newPage()
  await page.goto(baseUrl + '/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  // capture at top and scrolled to the hero-adjacent section
  const path1 = join(outDir, `${tag}-${vp.name}-top.png`)
  await page.screenshot({ path: path1, fullPage: false })
  shots.push(path1)
  await page.evaluate(() => window.scrollTo(0, 900))
  await page.waitForTimeout(800)
  const path2 = join(outDir, `${tag}-${vp.name}-scroll.png`)
  await page.screenshot({ path: path2, fullPage: false })
  shots.push(path2)
  await ctx.close()
}
console.log('captured:', shots.join(' '))
await browser.close()
