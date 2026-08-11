// D-108: сторожевой таймаут на весь прогон scanSite().
// SCAN-RESILIENCE (2026-08-10): «одна плохая страница не убивает скан» —
// успокоение сети вместо networkidle0, изоляция подстраниц, один перезапуск
// браузерной сессии, блокировка мусорного трафика.
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
// (тот же приём, что env.AXE_SOURCE_URL, D-067), а пороги — через
// env.SCAN_TIMEOUT_MS и env.SETTLE_MS. Настоящие 120с/4с тест не ждёт: механику
// проверяют десятки миллисекунд, а не длительность.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  scanSite, resolveScanTimeoutMs, resolveSettleMs, shouldBlockRequest, isTrackerHost,
  isSessionDead, SETTLE_MS,
} from './axe.js'
import { classifyError } from './errors.js'

const TARGET = 'https://example.test/'
const KONTAKT = 'https://example.test/kontakt'
const HOME_HTML = `<!doctype html><html><body>
  <h1>Home</h1>
  <a href="/kontakt">Kontakt</a>
</body></html>`

// Три страницы: главная + две обычные подстраницы без приоритетных ключевых слов,
// поэтому pickPriorityLinks сохраняет DOM-порядок и обход детерминирован.
const PAGE_A = 'https://example.test/a1'
const PAGE_B = 'https://example.test/a2'
const HOME3_HTML = `<!doctype html><html><body>
  <h1>Home</h1>
  <a href="/a1">One</a>
  <a href="/a2">Two</a>
</body></html>`
const SUB_HTML = '<!doctype html><html><body><h1>Sub</h1></body></html>'

// Фейковая страница puppeteer: отвечает ровно на те вызовы, которые делает
// scanSite. Проверки из domChecks.js получают ReferenceError (в Node нет
// document/window) — то есть отклонённый промис, который production-код уже
// глушит через .catch(); это и есть их штатное поведение на неподдающейся
// странице, ничего специально имитировать не нужно.
function makeFakePage(opts, shared, browser) {
  const {
    hangOnAxeRun = null, neverIdle = false, homeHtml = HOME_HTML,
    navFails = () => null, axeAttaches = () => true, dieAfterAxeRuns = null,
    // D-131: подменяет ответ axe.run(), чтобы проверить ЗАХВАТ полей
    // help/helpUrl/failureSummary. Функция от currentUrl — per-node
    // failureSummary должен оставаться разным у разных элементов.
    axeViolations = null,
  } = opts
  let currentUrl = null

  // Смерть браузерной СЕССИИ: любой последующий вызов отвечает так же, как
  // реальный CDP при обрыве, и isConnected() становится false.
  function guardSession() {
    if (!browser.connected) throw new Error('Protocol error (Runtime.callFunctionOn): Target closed.')
  }

  return {
    async setUserAgent() {},
    async setBypassCSP() {},
    setDefaultNavigationTimeout() {},
    async setRequestInterception(enabled) { shared.interception = enabled },
    on(event, handler) { if (event === 'request') shared.requestHandler = handler },
    async waitForNetworkIdle(options) {
      shared.idleWaits.push(options)
      // Сайт с непрерывной аналитикой/long-poll: тишины НЕТ никогда. Промис,
      // который не резолвится и не отклоняется, — то, что `.catch()` вокруг
      // waitForNetworkIdle поймать не может (урок D-108).
      if (neverIdle) return new Promise(() => {})
    },
    async goto(url, options) {
      guardSession()
      shared.gotos.push({ url, options })
      const failure = navFails(url, shared)
      if (failure) throw new Error(failure)
      currentUrl = url
    },
    async content() {
      guardSession()
      return currentUrl === TARGET ? homeHtml : SUB_HTML
    },
    async addScriptTag() { guardSession() },
    async evaluate(fn, ...args) {
      const src = String(fn)
      if (src.includes('globalThis.axe.run')) {
        guardSession()
        const index = shared.axeRuns.length
        // Зависание: промис, который не резолвится и не отклоняется НИКОГДА —
        // именно то, что .catch() поймать не может (в этом и был баг D-108).
        if (index === hangOnAxeRun) return new Promise(() => {})
        shared.axeRuns.push(currentUrl)
        if (dieAfterAxeRuns !== null && shared.axeRuns.length === dieAfterAxeRuns) browser.connected = false
        if (axeViolations) return { violations: axeViolations(currentUrl) }
        return {
          violations: [{
            id: 'fake-rule', tags: ['wcag2aa', 'cat.text'], impact: 'serious',
            nodes: [{ target: ['body'], html: `<p>${currentUrl}</p>` }],
          }],
        }
      }
      if (src.includes('typeof globalThis.axe')) {
        guardSession()
        return axeAttaches(currentUrl, shared)
      }
      return fn(...args) // проверки domChecks — упадут на отсутствии DOM, это ок
    },
  }
}

function makeFakeBrowser(opts, shared) {
  const browser = {
    connected: true,
    isConnected() { return browser.connected },
    async newPage() { return makeFakePage(opts, shared, browser) },
    async close() { shared.closeCalls += 1; browser.connected = false },
  }
  return browser
}

// Один объект состояния на весь скан — переживает перезапуск браузера, поэтому
// по нему видно и «сколько раз запускали браузер», и «какие страницы прошли axe».
function makeFakeEnv(opts = {}) {
  const shared = {
    closeCalls: 0, launches: 0, gotos: [], axeRuns: [], idleWaits: [],
    interception: null, requestHandler: null,
  }
  const env = {
    AXE_SOURCE_URL: 'https://fixture.test/axe.js',
    SCAN_TIMEOUT_MS: opts.timeoutMs ?? 5000,
    SETTLE_MS: opts.settleMs ?? 10,
    __launchBrowser: async () => {
      shared.launches += 1
      if (opts.failLaunchFrom && shared.launches >= opts.failLaunchFrom) {
        throw new Error(opts.launchError ?? 'Unable to create new browser: code: 429: message: Rate limit exceeded')
      }
      return makeFakeBrowser(opts, shared)
    },
  }
  return { env, shared }
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

const findingsFor = (result, ruleId) => result.findings.filter((f) => f.ruleId === ruleId)

test('D-108: зависший скан отклоняется сторожем, а не висит вечно', async () => {
  const { env, shared } = makeFakeEnv({ hangOnAxeRun: 1, timeoutMs: 60 })
  const progress = []

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
    assert.equal(shared.closeCalls, 1)

    // Прогресс, записанный ДО таймаута, не теряется и не портится: последнее,
    // что успел увидеть пользователь, — axe на второй странице из двух (ровно
    // как на проде: pagesDone: 5, pagesTotal: 6, и дальше тишина).
    assert.deepEqual(progress.at(0), ['discovering', 0, null])
    assert.deepEqual(progress.at(-1), ['axe', 1, 2])
  })
})

test('D-108: сторож не мешает нормальному скану завершиться', async () => {
  const { env, shared } = makeFakeEnv({})

  await withStubbedAxeFetch(async () => {
    const result = await scanSite(env, TARGET)
    assert.deepEqual(result.pages, [TARGET, KONTAKT])
    // Скан дошёл до конца: находки уровня сайта на месте (заявления о
    // доступности у фикстуры нет — значит, оно должно быть зафиксировано).
    assert.ok(result.findings.some((f) => f.ruleId === 'a11y-statement-missing'))
    assert.equal(shared.closeCalls, 1)
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

test('SCAN-RESILIENCE: порог успокоения сети — тот же шов, тот же откат на дефолт', () => {
  assert.equal(resolveSettleMs({ SETTLE_MS: 1500 }), 1500)
  assert.equal(resolveSettleMs({ SETTLE_MS: '2000' }), 2000)
  assert.equal(resolveSettleMs({}), SETTLE_MS)
  assert.equal(resolveSettleMs({ SETTLE_MS: 0 }), SETTLE_MS)
  assert.equal(resolveSettleMs({ SETTLE_MS: 'later' }), SETTLE_MS)
})

// (а) Сайт, у которого сеть НЕ затихает никогда (аналитика, long-poll, чат) —
// на networkidle0 это гарантированный NAV_TIMEOUT и смерть всего скана.
test('SCAN-RESILIENCE: сеть не затихает — страница всё равно просканирована', async () => {
  const { env, shared } = makeFakeEnv({ neverIdle: true, settleMs: 15, timeoutMs: 3000 })

  await withStubbedAxeFetch(async () => {
    const result = await scanSite(env, TARGET)
    assert.deepEqual(result.pages, [TARGET, KONTAKT])
    // Ожидание тишины реально было (иначе тест зелёный просто потому, что
    // waitForNetworkIdle никто не звал) и оно ограничено нашим порогом.
    assert.ok(shared.idleWaits.length >= 2, 'waitForNetworkIdle должен вызываться на каждой навигации')
    assert.equal(shared.idleWaits[0].timeout, 15)
    // Критерий загрузки — domcontentloaded, а не networkidle0: именно это
    // отвязывает готовность страницы от вечно шумящей сети.
    for (const { options } of shared.gotos) {
      assert.equal(options.waitUntil, 'domcontentloaded')
    }
  })
})

// (б) Одна подстраница недостижима (и повтор тоже не помог) — раньше это валило
// весь скан; теперь страница пропускается, остальные проверяются.
test('SCAN-RESILIENCE: подстраница падает на навигации — скан продолжается без неё', async () => {
  const { env, shared } = makeFakeEnv({
    homeHtml: HOME3_HTML,
    navFails: (url) => (url === PAGE_A ? 'net::ERR_CONNECTION_RESET at https://example.test/a1' : null),
  })

  await withStubbedAxeFetch(async () => {
    const result = await scanSite(env, TARGET)
    assert.deepEqual(result.pages, [TARGET, PAGE_B])

    const skipped = findingsFor(result, 'scan-meta-page-skipped')
    assert.equal(skipped.length, 1)
    assert.equal(skipped[0].page, PAGE_A)
    assert.equal(skipped[0].impact, 'minor')
    assert.match(skipped[0].html, /ERR_CONNECTION_RESET/)

    // Повтор навигации был ровно один (две попытки на битую страницу).
    assert.equal(shared.gotos.filter((g) => g.url === PAGE_A).length, 2)
    // Битая страница не попадает ни в pages, ни в находки axe.
    assert.equal(result.findings.filter((f) => f.page === PAGE_A && f.ruleId === 'fake-rule').length, 0)
    assert.equal(shared.closeCalls, 1)
  })
})

// Разовая осечка на ГЛАВНОЙ не должна стоить всего скана: её отказ фатален, тем
// более она заслуживает того же одного повтора, что и подстраницы.
test('SCAN-RESILIENCE: главная сорвалась один раз — повтор, скан идёт дальше', async () => {
  const { env, shared } = makeFakeEnv({
    navFails: (url, state) => (
      url === TARGET && state.gotos.filter((g) => g.url === TARGET).length === 1
        ? 'net::ERR_CONNECTION_RESET at https://example.test/'
        : null
    ),
  })

  await withStubbedAxeFetch(async () => {
    const result = await scanSite(env, TARGET)
    assert.deepEqual(result.pages, [TARGET, KONTAKT])
    assert.equal(shared.gotos.filter((g) => g.url === TARGET).length, 2, 'ровно один повтор навигации на главную')
    assert.equal(findingsFor(result, 'scan-meta-page-skipped').length, 0)
  })
})

// (в) axe не внедрился. На подстранице — причина пропуска; на главной —
// прежний громкий отказ (без главной отчёт бессмыслен).
test('SCAN-RESILIENCE: axe не внедрился на подстранице — пропуск, скан жив', async () => {
  const { env } = makeFakeEnv({
    homeHtml: HOME3_HTML,
    axeAttaches: (url) => url !== PAGE_A,
  })

  await withStubbedAxeFetch(async () => {
    const result = await scanSite(env, TARGET)
    assert.deepEqual(result.pages, [TARGET, PAGE_B])
    const skipped = findingsFor(result, 'scan-meta-page-skipped')
    assert.equal(skipped.length, 1)
    assert.match(skipped[0].html, /axe-core failed to attach on https:\/\/example\.test\/a1/)
  })
})

test('SCAN-RESILIENCE: axe не внедрился на ГЛАВНОЙ — скан падает, как раньше', async () => {
  const { env } = makeFakeEnv({
    homeHtml: HOME3_HTML,
    axeAttaches: (url) => url !== TARGET,
  })

  await withStubbedAxeFetch(async () => {
    const err = await scanSite(env, TARGET).then(() => null, (e) => e)
    assert.ok(err instanceof Error, 'отказ главной обязан валить скан целиком')
    assert.match(err.message, /axe-core failed to attach on https:\/\/example\.test\//)
  })
})

// (г) Браузерная сессия умирает посреди скана («Protocol error … Target closed»,
// D-110 серия №4). Один перезапуск — и скан доходит до конца.
test('SCAN-RESILIENCE: сессия умерла посреди скана — один перезапуск, скан доходит до конца', async () => {
  const { env, shared } = makeFakeEnv({ homeHtml: HOME3_HTML, dieAfterAxeRuns: 1 })

  await withStubbedAxeFetch(async () => {
    const result = await scanSite(env, TARGET)
    assert.deepEqual(result.pages, [TARGET, PAGE_A, PAGE_B])
    // Браузер запускали дважды: исходный + перезапуск через тот же шов.
    assert.equal(shared.launches, 2)
    // Закрыт и мёртвый (best-effort на перезапуске), и финальный.
    assert.equal(shared.closeCalls, 2)
    // Находки страницы, на которой умерла сессия, сохранены и НЕ удвоены
    // повторным проходом.
    const homeViolations = result.findings.filter((f) => f.ruleId === 'fake-rule' && f.page === TARGET)
    assert.equal(homeViolations.length, 1)
    assert.equal(findingsFor(result, 'scan-meta-page-skipped').length, 0)
  })
})

// Инвариант перезапуска, который легко потерять молча (найден канарейкой
// родительской сессии: снятие `currentUrl = null` в restartBrowser не роняло
// ни одного теста): свежий браузер открывается на пустой странице, и если код
// после перезапуска ВЕРИТ старому currentUrl, повторный проход пропускает
// навигацию и запускает axe по about:blank — «чистая» страница в отчёте,
// неотличимая от настоящей. Проверяем обе стороны: главная перенавигирована
// заново, и повторный axe-прогон видел НАСТОЯЩИЙ URL, а не пустоту.
test('SCAN-RESILIENCE: после перезапуска браузера страница перенавигируется, а не сканируется с пустого состояния', async () => {
  const { env, shared } = makeFakeEnv({ homeHtml: HOME3_HTML, dieAfterAxeRuns: 1 })

  await withStubbedAxeFetch(async () => {
    await scanSite(env, TARGET)
    // Навигация на главную: при discovering + заново после перезапуска.
    assert.equal(shared.gotos.filter((g) => g.url === TARGET).length, 2)
    // Повторный прогон axe шёл по реальной главной (фейк пишет в axeRuns
    // текущий URL страницы; по about:blank здесь оказался бы null).
    assert.equal(shared.axeRuns[0], TARGET)
    assert.equal(shared.axeRuns[1], TARGET)
  })
})

// (д) Перезапуск сам упал (типично — 429 при создании браузера). Скан обязан
// упасть целиком с этой ошибкой: её подхватит busy-ретрай очереди (D-112).
test('SCAN-RESILIENCE: перезапуск браузера упал — скан падает с ошибкой перезапуска', async () => {
  const { env, shared } = makeFakeEnv({ homeHtml: HOME3_HTML, dieAfterAxeRuns: 1, failLaunchFrom: 2 })

  await withStubbedAxeFetch(async () => {
    const err = await scanSite(env, TARGET).then(() => null, (e) => e)
    assert.ok(err instanceof Error)
    assert.match(err.message, /Unable to create new browser: code: 429/)
    // Именно ради этого ошибка не глушится: очередь ретраит busy с задержкой.
    assert.equal(classifyError(err.message), 'busy')
    assert.equal(shared.launches, 2)
  })
})

// (е) Перехват запросов: мусор режется, всё, что влияет на отрисовку, проходит.
test('SCAN-RESILIENCE: перехват запросов включён и режет только мусор', async () => {
  const { env, shared } = makeFakeEnv({})

  await withStubbedAxeFetch(async () => {
    await scanSite(env, TARGET)
  })

  assert.equal(shared.interception, true, 'setRequestInterception(true) обязателен')
  assert.equal(typeof shared.requestHandler, 'function')

  const run = (url, resourceType) => {
    const calls = []
    shared.requestHandler({
      url: () => url,
      resourceType: () => resourceType,
      async continue() { calls.push('continue') },
      async abort(reason) { calls.push(`abort:${reason}`) },
    })
    return calls
  }

  assert.deepEqual(run('https://static.hotjar.com/c/hotjar.js', 'script'), ['abort:blockedbyclient'])
  // Матч по hostname, а не по подстроке URL: честная статья про Hotjar грузится.
  assert.deepEqual(run('https://example.com/blog/hotjar.com-review', 'script'), ['continue'])
  assert.deepEqual(run('https://example.com/promo.mp4', 'media'), ['abort:blockedbyclient'])
  assert.deepEqual(run('https://example.com/site.css', 'stylesheet'), ['continue'])
  assert.deepEqual(run('https://example.com/logo.png', 'image'), ['continue'])

  // Сломанный запрос обязан ВСЁ РАВНО получить ответ — иначе он висит до
  // таймаута навигации и страница «грузится» вечно (главная ловушка request
  // interception). Две разные точки отказа, обе должны заканчиваться continue():
  const undecidable = []
  shared.requestHandler({
    url() { throw new Error('boom') }, // не смогли РЕШИТЬ, блокировать ли
    resourceType: () => 'script',
    async continue() { undecidable.push('continue') },
    async abort() { undecidable.push('abort') },
  })
  assert.deepEqual(undecidable, ['continue'])

  const brokenAbort = []
  shared.requestHandler({
    url: () => 'https://static.hotjar.com/c/hotjar.js',
    resourceType: () => 'script',
    async continue() { brokenAbort.push('continue') },
    abort() { throw new Error('Request is already handled!') }, // не смогли ВЫПОЛНИТЬ решение
  })
  assert.deepEqual(brokenAbort, ['continue'], 'сорвавшийся abort обязан закончиться continue, а не подвисшим запросом')
})

// Строки взяты ДОСЛОВНО из исходника установленного @cloudflare/puppeteer 1.3.0
// (node_modules/@cloudflare/puppeteer/lib/esm/puppeteer/…), а не сочинены по
// смыслу: первая версия SESSION_DEAD_RE содержала две несуществующие
// формулировки и упускала реальную «Session already detached». Тест — гейт
// против того же класса ошибки при следующем обновлении зависимости.
test('SCAN-RESILIENCE: смерть сессии отличается от отказа страницы по РЕАЛЬНЫМ строкам puppeteer', () => {
  const live = {}
  const dead = { isConnected: () => false }
  for (const message of [
    'Target closed', // common/CallbackRegistry.js:69, cdp/Page.js:185
    'Protocol error: Connection closed.', // cdp/Connection.js:84
    'Protocol error (Runtime.callFunctionOn): Session closed. Most likely the page has been closed.',
    'Protocol error: Connection closed. Most likely the page has been closed.', // cdp/Page.js:836
    'Session already detached. Most likely the page has been closed.', // cdp/CDPSession.js:88
  ]) {
    assert.equal(isSessionDead(live, new Error(message)), true, `должно читаться как смерть сессии: ${message}`)
  }

  // Отказы УРОВНЯ СТРАНИЦЫ: лечатся пропуском страницы, а не перезапуском
  // браузера — перепутать значит жечь платный ресурс на каждой битой странице.
  for (const message of [
    'net::ERR_CONNECTION_RESET at https://example.test/a1',
    'Navigation timeout of 15000 ms exceeded',
    'Navigating frame was detached',
    'axe-core failed to attach on https://example.test/a1 (page blocked script injection?)',
  ]) {
    assert.equal(isSessionDead(live, new Error(message)), false, `не смерть сессии: ${message}`)
  }

  // Второй, независимый от текста признак: сам браузер сообщает, что отвалился.
  assert.equal(isSessionDead(dead, new Error('anything at all')), true)
  assert.equal(isSessionDead(undefined, new Error('anything at all')), false)
})

test('SCAN-RESILIENCE: политика блокировки — чистая функция, границы поддоменов', () => {
  assert.equal(shouldBlockRequest('https://www.google-analytics.com/collect', 'script'), true)
  assert.equal(shouldBlockRequest('https://region1.google-analytics.com/g/collect', 'xhr'), true)
  assert.equal(shouldBlockRequest('https://mc.yandex.ru/metrika/tag.js', 'script'), true)
  assert.equal(shouldBlockRequest('https://example.com/hotjar.com/whatever', 'script'), false)
  assert.equal(shouldBlockRequest('https://nothotjar.com/a.js', 'script'), false)
  // Документ верхнего уровня не блокируется НИКОГДА — иначе скан самого
  // трекерного домена падал бы как «blocked», обвиняя сайт в нашем решении.
  assert.equal(shouldBlockRequest('https://hotjar.com/', 'document'), false)
  assert.equal(shouldBlockRequest('data:text/html,hi', 'script'), false)
  assert.equal(isTrackerHost('HOTJAR.COM'), true)
  assert.equal(isTrackerHost('hotjar.com.evil.test'), false)
})

// --- D-131: захват собственных подсказок axe-core ----------------------------
//
// help/helpUrl/failureSummary лежат в ТОМ ЖЕ results-объекте, который цикл по
// violations уже перебирает, и до D-131 просто выбрасывались. Строки ниже —
// настоящий вывод axe-core 4.x с живого прогона по en.zebrakita.de (тот же
// сайт, что D-129), не выдуманный текст «похожей формы».
const REAL_HELP = 'Images must have alternative text'
const REAL_HELP_URL = 'https://dequeuniversity.com/rules/axe/4.13/image-alt?application=axeAPI'

test('D-131: help/helpUrl/failureSummary попадают в находку из того же axe-результата', async () => {
  const { env } = makeFakeEnv({
    axeViolations: (url) => [{
      id: 'image-alt', tags: ['wcag2a', 'wcag111'], impact: 'critical',
      help: REAL_HELP, helpUrl: REAL_HELP_URL,
      nodes: [
        { target: ['img.a'], html: '<img class="a">', failureSummary: `Fix any of the following:\n  no alt on ${url} first image` },
        { target: ['img.b'], html: '<img class="b">', failureSummary: 'Fix any of the following:\n  Element has no title attribute' },
      ],
    }],
  })

  await withStubbedAxeFetch(async () => {
    const result = await scanSite(env, TARGET)
    const found = findingsFor(result, 'image-alt')
    assert.ok(found.length >= 2)
    // help/helpUrl — УРОВНЯ ПРАВИЛА: одинаковы у всех инстансов.
    for (const finding of found) {
      assert.equal(finding.help, REAL_HELP)
      assert.equal(finding.helpUrl, REAL_HELP_URL)
    }
    // failureSummary — УРОВНЯ ЭЛЕМЕНТА: у двух элементов одного правила разный.
    const onHome = found.filter((x) => x.page === TARGET)
    assert.equal(onHome.length, 2)
    assert.notEqual(onHome[0].failureSummary, onHome[1].failureSummary)
    assert.match(onHome[0].failureSummary, /no alt on https:\/\/example\.test\/ first image/)
  })
})

test('D-131: violation/node БЕЗ этих полей не падает и не подставляет заглушку', async () => {
  const { env } = makeFakeEnv({
    axeViolations: () => [{
      id: 'region', tags: ['cat.keyboard'], impact: 'moderate',
      nodes: [{ target: ['div'], html: '<div></div>' }], // ни help, ни helpUrl, ни failureSummary
    }],
  })

  await withStubbedAxeFetch(async () => {
    const result = await scanSite(env, TARGET)
    const found = findingsFor(result, 'region')
    assert.ok(found.length > 0)
    for (const finding of found) {
      assert.equal(finding.help, undefined)
      assert.equal(finding.helpUrl, undefined)
      assert.equal(finding.failureSummary, undefined)
      // Ключевое: undefined, а НЕ '' и не выдуманная строка/сконструированный URL.
      assert.ok(!('help' in JSON.parse(JSON.stringify(finding))), 'undefined не должен переживать сериализацию в findings_json')
    }
  })
})

test('D-131: собственные a11y-* проверки этих полей не получают вовсе', async () => {
  const { env } = makeFakeEnv({})
  await withStubbedAxeFetch(async () => {
    const result = await scanSite(env, TARGET)
    for (const finding of result.findings.filter((x) => x.ruleId.startsWith('a11y-'))) {
      assert.equal(finding.help, undefined, `${finding.ruleId} не должен иметь help`)
      assert.equal(finding.helpUrl, undefined)
      assert.equal(finding.failureSummary, undefined)
    }
  })
})

test('D-131: слишком длинный failureSummary обрезается, а не растит findings_json без границы', async () => {
  const long = 'Fix any of the following:\n  ' + 'x'.repeat(2000)
  const { env } = makeFakeEnv({
    axeViolations: () => [{
      id: 'image-alt', tags: ['wcag2a'], impact: 'critical', help: REAL_HELP, helpUrl: REAL_HELP_URL,
      nodes: [{ target: ['img'], html: '<img>', failureSummary: long }],
    }],
  })
  await withStubbedAxeFetch(async () => {
    const result = await scanSite(env, TARGET)
    const finding = findingsFor(result, 'image-alt')[0]
    assert.equal(finding.failureSummary.length, 600)
    assert.ok(long.startsWith(finding.failureSummary), 'обрезка — префикс исходной строки, не пересказ')
  })
})
