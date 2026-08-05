// Сканирование сайта: Browser Rendering (env.BROWSER) + axe-core, инжектится как
// content-script (не через src=CDN — на целевой странице может быть CSP на script-src).
// axe-core версии фиксируется тут же и подтягивается один раз в edge Cache API.
//
// R5 (RISKS.md): ≤6 страниц/скан, таймаут на навигацию, честный user-agent.

import puppeteer from '@cloudflare/puppeteer'
import { sameOriginLinks } from './links.js'

const MAX_PAGES = 6
const NAV_TIMEOUT_MS = 15000
const AXE_VERSION = '4.10.2'
const AXE_CDN_URL = `https://cdn.jsdelivr.net/npm/axe-core@${AXE_VERSION}/axe.min.js`
const USER_AGENT = 'AccessAtlasBot/1.0 (+https://accessatlas.example/about; accessibility scanner)'

async function getAxeSource() {
  const cache = caches.default
  const cacheKey = new Request(AXE_CDN_URL)
  const cached = await cache.match(cacheKey)
  if (cached) return cached.text()

  const res = await fetch(AXE_CDN_URL)
  if (!res.ok) throw new Error(`axe-core fetch failed: HTTP ${res.status}`)
  const body = await res.text()
  const cacheable = new Response(body, { headers: { 'cache-control': 'public, max-age=604800' } })
  await cache.put(cacheKey, cacheable)
  return body
}

export async function scanSite(env, targetUrl) {
  const axeSource = await getAxeSource()
  const browser = await puppeteer.launch(env.BROWSER)
  const findings = []
  const pagesScanned = []

  try {
    const page = await browser.newPage()
    await page.setUserAgent(USER_AGENT)
    page.setDefaultNavigationTimeout(NAV_TIMEOUT_MS)

    await page.goto(targetUrl, { waitUntil: 'networkidle0' })
    const homeHtml = await page.content()
    const toVisit = [targetUrl, ...sameOriginLinks(homeHtml, targetUrl, MAX_PAGES - 1)]

    for (const pageUrl of toVisit.slice(0, MAX_PAGES)) {
      if (pageUrl !== targetUrl) {
        await page.goto(pageUrl, { waitUntil: 'networkidle0' })
      }
      await page.addScriptTag({ content: axeSource })
      const results = await page.evaluate(async () => await globalThis.axe.run())
      pagesScanned.push(pageUrl)

      for (const violation of results.violations) {
        const wcag = violation.tags.filter((t) => /^wcag\d/.test(t))
        for (const node of violation.nodes) {
          findings.push({
            ruleId: violation.id,
            wcag,
            impact: violation.impact ?? 'minor',
            selector: node.target.join(' '),
            page: pageUrl,
            html: node.html ? node.html.slice(0, 300) : undefined,
          })
        }
      }
    }
  } finally {
    await browser.close()
  }

  return { pages: pagesScanned, findings }
}
