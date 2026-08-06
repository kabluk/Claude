// Живые проверки реальным Chromium (Playwright) — DOM/фокус/viewport-механика,
// которую нельзя протестировать без настоящего браузера (A3-REFLOW, A3-KEYBOARD,
// A3-MEDIA, A3-RESIZE, A3-COOKIEBANNER, 2026-08-06). Продакшен-код (axe.js) гоняет
// эти же экспортированные функции через @cloudflare/puppeteer — здесь используется
// Playwright только как локальный движок для теста (тот же Chromium), через
// маленький адаптер API (setViewport/viewport() вместо setViewportSize/viewportSize()),
// чтобы тестировался БУКВАЛЬНО тот же production-код, не копия под другой API.
//
// Внешний HTTPS браузеру в этой песочнице недоступен (тот же барьер, что у
// A1-LANDING/A1-REPORT, D-010) — используется page.setContent() с локальным HTML,
// без сети вообще.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { chromium } from 'playwright'
import {
  checkReflow320, checkKeyboardTraversal, checkMedia, checkResize200, detectAndDismissCookieBanner,
} from './domChecks.js'

// Тот же паттерн, что scripts/audit-own-a11y.mjs: явный путь только если преустановлен.
const PREINSTALLED_CHROMIUM = '/opt/pw-browsers/chromium'
const launchOptions = existsSync(PREINSTALLED_CHROMIUM) ? { executablePath: PREINSTALLED_CHROMIUM } : {}

function adapt(pwPage, initialViewport) {
  let current = initialViewport
  return {
    async setViewport({ width, height }) {
      await pwPage.setViewportSize({ width, height })
      current = { width, height }
    },
    viewport() { return current },
    async evaluate(fn, ...args) { return pwPage.evaluate(fn, ...args) },
    keyboard: { async press(key) { await pwPage.keyboard.press(key) } },
  }
}

async function withPage(html, viewport, fn) {
  const browser = await chromium.launch(launchOptions)
  try {
    const pwPage = await browser.newPage()
    await pwPage.setViewportSize(viewport)
    await pwPage.setContent(html)
    await fn(adapt(pwPage, viewport))
  } finally {
    await browser.close()
  }
}

test('A3-REFLOW: fixed 900px layout overflows at 320px viewport, responsive layout does not', async () => {
  await withPage(
    '<div style="width:900px;background:#eee;">fixed-width legacy layout</div>',
    { width: 1280, height: 800 },
    async (page) => {
      const finding = await checkReflow320(page, 'p1')
      assert.equal(finding.ruleId, 'a11y-reflow-320')
      assert.equal(finding.impact, 'serious')
    },
  )
  await withPage(
    '<style>.box{max-width:100%;width:900px}</style><div class="box">responsive</div>',
    { width: 1280, height: 800 },
    async (page) => {
      assert.equal(await checkReflow320(page, 'p2'), null)
    },
  )
})

test('A3-REFLOW: restores the original viewport after the 320px check', async () => {
  await withPage('<p>hi</p>', { width: 1280, height: 800 }, async (page) => {
    await checkReflow320(page, 'p1')
    assert.deepEqual(page.viewport(), { width: 1280, height: 800 })
  })
})

test('A3-KEYBOARD: detects a real focus trap (element re-focuses itself on blur)', async () => {
  const html = `<a href="#">one</a><input id="trap"><a href="#">three, unreachable</a>
    <script>document.getElementById('trap').addEventListener('blur', (e) => e.target.focus())</script>`
  await withPage(html, { width: 1280, height: 800 }, async (page) => {
    const findings = await checkKeyboardTraversal(page, 'p1')
    assert.equal(findings.length, 1)
    assert.equal(findings[0].ruleId, 'a11y-keyboard-trap')
    assert.equal(findings[0].selector, '#trap')
  })
})

test('A3-KEYBOARD: flags a link with focus outline explicitly suppressed and not replaced', async () => {
  const html = `<style>a:focus{outline:none;box-shadow:none}</style>
    <a href="#">first</a><a href="#" id="last">second, invisible focus</a>`
  await withPage(html, { width: 1280, height: 800 }, async (page) => {
    const findings = await checkKeyboardTraversal(page, 'p1')
    assert.equal(findings.length, 1)
    assert.equal(findings[0].ruleId, 'a11y-focus-invisible')
    assert.equal(findings[0].selector, '#last')
  })
})

// Регрессия на реальный баг, найденный живой проверкой: реальный видимый outline
// (не suppressed) ложно флагался, потому что проверка невидимости фокуса читала
// document.activeElement ПОСЛЕ выхода из цикла Tab — когда фокус уже мог уйти на
// <body> (после последней ссылки). Исправлено: читаем видимость в том же evaluate,
// что и селектор, пока элемент точно ещё в фокусе.
test('A3-KEYBOARD: a real visible focus outline is NOT false-flagged (regression)', async () => {
  const html = `<style>a:focus{outline:3px solid blue}</style><a href="#">first</a><a href="#">second, real outline</a>`
  await withPage(html, { width: 1280, height: 800 }, async (page) => {
    assert.deepEqual(await checkKeyboardTraversal(page, 'p1'), [])
  })
})

test('A3-MEDIA: flags autoplay-without-mute and missing captions; clean video passes', async () => {
  await withPage(
    '<video id="promo" autoplay src="data:video/mp4;base64,AAAA"></video>',
    { width: 1280, height: 800 },
    async (page) => {
      const findings = await checkMedia(page, 'p1')
      const ruleIds = findings.map((f) => f.ruleId).sort()
      assert.deepEqual(ruleIds, ['a11y-autoplay-media', 'a11y-video-no-captions'])
    },
  )
  await withPage(
    '<video id="promo" autoplay muted src="data:video/mp4;base64,AAAA">' +
      '<track kind="captions" src="c.vtt" srclang="en"></video>',
    { width: 1280, height: 800 },
    async (page) => {
      assert.deepEqual(await checkMedia(page, 'p2'), [])
    },
  )
})

test('A3-RESIZE: fixed-width nowrap text clips at 200% zoom, normal paragraph does not', async () => {
  await withPage(
    '<div style="width:1200px;white-space:nowrap;">a long fixed-width line of text</div>',
    { width: 1280, height: 800 },
    async (page) => {
      const finding = await checkResize200(page, 'p1')
      assert.equal(finding.ruleId, 'a11y-resize-200')
    },
  )
  await withPage(
    '<p style="max-width:40ch;">ordinary reflowing paragraph</p>',
    { width: 1280, height: 800 },
    async (page) => {
      assert.equal(await checkResize200(page, 'p2'), null)
    },
  )
})

test('A3-COOKIEBANNER: detects and dismisses a known-vendor banner (OneTrust-style id)', async () => {
  const html = `<main><h1>real content</h1></main>
    <div id="onetrust-banner-sdk" style="position:fixed;bottom:0;width:100%;height:220px;z-index:2147483645;">
    <p>We use cookies.</p><button id="onetrust-accept-btn-handler">Accept All Cookies</button></div>`
  await withPage(html, { width: 1280, height: 800 }, async (page) => {
    const result = await detectAndDismissCookieBanner(page)
    assert.equal(result.found, true)
    assert.equal(result.dismissed, true)
    assert.equal(result.selector, '#onetrust-banner-sdk')
  })
})

test('A3-COOKIEBANNER: detects and dismisses a custom banner via style+text heuristic (no known vendor id)', () =>
  withPage(
    `<main><h1>real content</h1></main>
     <div class="custom-consent-overlay" style="position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9999;">
       <h2>Hinweis zum Datenschutz</h2><p>Wir verwenden Cookies.</p><button>Alle akzeptieren</button>
     </div>`,
    { width: 1280, height: 800 },
    async (page) => {
      const result = await detectAndDismissCookieBanner(page)
      assert.equal(result.found, true)
      assert.equal(result.dismissed, true)
    },
  ))

test('A3-COOKIEBANNER: does not false-positive on an unrelated small fixed widget (back-to-top button)', () =>
  withPage(
    '<main><h1>real content</h1></main><button style="position:fixed;bottom:10px;right:10px;width:40px;height:40px;z-index:500;">^</button>',
    { width: 1280, height: 800 },
    async (page) => {
      assert.deepEqual(await detectAndDismissCookieBanner(page), { found: false, dismissed: false, selector: null })
    },
  ))

test('A3-COOKIEBANNER: a clean page with no banner reports found:false', () =>
  withPage('<main><h1>real content</h1><p>nothing to see here</p></main>', { width: 1280, height: 800 }, async (page) => {
    assert.deepEqual(await detectAndDismissCookieBanner(page), { found: false, dismissed: false, selector: null })
  }))
