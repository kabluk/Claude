// D-108: сторожевой таймаут на весь прогон scanSite().
//
// Тестируется РЕАЛЬНАЯ причина продового бага, а не её изображение: на проде два
// скана одного сайта (en.zebrakita.de, Google Sites) висели в status='running'
// 13 минут и 23 часа, застряв на РАЗНЫХ страницах, с непротухающим progress_json.
// Значит, зависало не на конкретной странице и не в page.goto() (у него есть
// NAV_TIMEOUT_MS), а где-то внутри обхода — предполагаемо в axe.run() внутри
// page.evaluate(), у которого таймаута не было вообще. Фейковая страница здесь
// повторяет ровно этот сценарий: axe.run() на ВТОРОЙ странице никогда не
// резолвится, при уже записанном прогрессе по первой.
//
// Browser Rendering — платный ресурс (approval_required, GRAPH.yaml) и в тесте
// недоступен, поэтому браузер подставляется через тестовый шов env.__launchBrowser
// (тот же приём, что env.AXE_SOURCE_URL, D-067), а порог сторожа — через
// env.SCAN_TIMEOUT_MS. Настоящие 120с тест не ждёт: 60 мс достаточно, чтобы
// проверить именно механику, а не длительность.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { scanSite, resolveScanTimeoutMs } from './axe.js'
import { classifyError } from './errors.js'

const TARGET = 'https://example.test/'
const HOME_HTML = `<!doctype html><html><body>
  <h1>Home</h1>
  <a href="/kontakt">Kontakt</a>
</body></html>`

// Фейковая страница puppeteer: отвечает ровно на те вызовы, которые делает
// scanSite. Проверки из domChecks.js получают ReferenceError (в Node нет
// document/window) — то есть отклонённый промис, который production-код уже
// глушит через .catch(); это и есть их штатное поведение на неподдающейся
// странице, ничего специально имитировать не нужно.
function makeFakePage({ hangOnAxeRun = null }) {
  let axeRuns = 0
  return {
    async setUserAgent() {},
    async setBypassCSP() {},
    setDefaultNavigationTimeout() {},
    async goto() {},
    async content() { return HOME_HTML },
    async addScriptTag() {},
    async evaluate(fn, ...args) {
      const src = String(fn)
      if (src.includes('globalThis.axe.run')) {
        const index = axeRuns++
        // Зависание: промис, который не резолвится и не отклоняется НИКОГДА —
        // именно то, что .catch() поймать не может (в этом и был баг).
        if (index === hangOnAxeRun) return new Promise(() => {})
        return { violations: [] }
      }
      if (src.includes('typeof globalThis.axe')) return true
      return fn(...args) // проверки domChecks — упадут на отсутствии DOM, это ок
    },
  }
}

function makeFakeBrowser(pageOptions) {
  const state = { closeCalls: 0 }
  return {
    state,
    browser: {
      async newPage() { return makeFakePage(pageOptions) },
      async close() { state.closeCalls += 1 },
    },
  }
}

// getAxeSource() ходит в сеть за axe-core; env.AXE_SOURCE_URL (D-067) уводит его
// с CDN на подставной ответ, чтобы тест не зависел от внешнего HTTPS.
async function withStubbedAxeFetch(fn) {
  const realFetch = globalThis.fetch
  globalThis.fetch = async () => new Response('/* fake axe-core */')
  try {
    return await fn()
  } finally {
    globalThis.fetch = realFetch
  }
}

function makeEnv({ launchBrowser, timeoutMs }) {
  return {
    AXE_SOURCE_URL: 'https://fixture.test/axe.js',
    SCAN_TIMEOUT_MS: timeoutMs,
    __launchBrowser: launchBrowser,
  }
}

test('D-108: зависший скан отклоняется сторожем, а не висит вечно', async () => {
  const { state, browser } = makeFakeBrowser({ hangOnAxeRun: 1 })
  const progress = []
  const env = makeEnv({ launchBrowser: async () => browser, timeoutMs: 60 })

  await withStubbedAxeFetch(async () => {
    const startedAt = Date.now()
    const err = await scanSite(env, TARGET, async (...args) => { progress.push(args) })
      .then(() => null, (e) => e)
    const elapsed = Date.now() - startedAt

    assert.ok(err instanceof Error, 'scanSite должен отклониться, а не зависнуть')
    assert.match(err.message, /scan timeout: no result after 60ms/)
    // Тест-раннер не подвешен: сторож сработал в своё время, а не через 120с.
    assert.ok(elapsed < 5000, `скан должен оборваться быстро, а не за ${elapsed}ms`)

    // Ключевое требование контракта: сообщение должно попадать в существующий
    // код `timeout` (errors.js), под который фронтенд уже имеет текст —
    // формулировка «timed out» этому паттерну НЕ соответствует.
    assert.equal(classifyError(err.message), 'timeout')

    // browser.close() выполняется и на ветке таймаута — иначе залипшая сессия
    // Browser Rendering осталась бы висеть (за неё и платим).
    assert.equal(state.closeCalls, 1)

    // Прогресс, записанный ДО таймаута, не теряется и не портится: последнее,
    // что успел увидеть пользователь, — axe на второй странице из двух (ровно
    // как на проде: pagesDone: 5, pagesTotal: 6, и дальше тишина).
    assert.deepEqual(progress.at(0), ['discovering', 0, null])
    assert.deepEqual(progress.at(-1), ['axe', 1, 2])
  })
})

test('D-108: сторож не мешает нормальному скану завершиться', async () => {
  const { state, browser } = makeFakeBrowser({ hangOnAxeRun: null })
  const env = makeEnv({ launchBrowser: async () => browser, timeoutMs: 5000 })

  await withStubbedAxeFetch(async () => {
    const result = await scanSite(env, TARGET)
    assert.deepEqual(result.pages, [TARGET, 'https://example.test/kontakt'])
    // Скан дошёл до конца: находки уровня сайта на месте (заявления о
    // доступности у фикстуры нет — значит, оно должно быть зафиксировано).
    assert.ok(result.findings.some((f) => f.ruleId === 'a11y-statement-missing'))
    assert.equal(state.closeCalls, 1)
  })
})

test('D-108: порог сторожа берётся из env, мусорное значение падает на дефолт', () => {
  assert.equal(resolveScanTimeoutMs({ SCAN_TIMEOUT_MS: 45000 }), 45000)
  assert.equal(resolveScanTimeoutMs({ SCAN_TIMEOUT_MS: '30000' }), 30000)
  // Дефолт — 120с: потолок «медленного, но живого» бюджета навигаций
  // (8 переходов × NAV_TIMEOUT_MS 15с), см. комментарий в axe.js.
  assert.equal(resolveScanTimeoutMs({}), 120000)
  assert.equal(resolveScanTimeoutMs(undefined), 120000)
  assert.equal(resolveScanTimeoutMs({ SCAN_TIMEOUT_MS: 'soon' }), 120000)
  assert.equal(resolveScanTimeoutMs({ SCAN_TIMEOUT_MS: 0 }), 120000)
  assert.equal(resolveScanTimeoutMs({ SCAN_TIMEOUT_MS: -1 }), 120000)
})
