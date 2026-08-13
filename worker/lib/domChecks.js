// Проверки, для которых axe-core принципиально недостаточно — нужен живой браузер,
// управляющий viewport/фокусом/воспроизведением, а не статический DOM-снепшот.
// A3-REFLOW, A3-KEYBOARD, A3-MEDIA, A3-RESIZE, A3-COOKIEBANNER (2026-08-06).
//
// Каждая функция принимает `page` — объект с Puppeteer-совместимым API
// (page.setViewport, page.evaluate, page.keyboard.press, page.$$, page.click),
// то же, что уже использует axe.js (@cloudflare/puppeteer). Живая проверка в этой
// сессии — Playwright + локальный HTTP-фикстур-сервер (127.0.0.1), т.к. реальный
// внешний HTTPS браузеру в этой песочнице недоступен (тот же барьер, что у A1-LANDING/
// A1-REPORT, D-010) — задокументировано в domains/backend.md, не тихо предположено.

const VIEWPORT_TOLERANCE_PX = 1 // избегаем false positive на субпиксельном округлении

// A3-REFLOW: WCAG 1.4.10 Reflow. На 320px CSS-ширине контент не должен требовать
// горизонтальной прокрутки (кроме таблиц/карт данных — эту оговорку не проверяем,
// эвристика намеренно грубая: false positive безопаснее молчания).
export async function checkReflow320(page, pageUrl) {
  const original = page.viewport ? page.viewport() : null
  await page.setViewport({ width: 320, height: 800 })
  // Даём странице время на CSS-реакцию (resize-листенеры, matchMedia) — без сна
  // некоторые сайты ещё не успели перестроить layout к моменту чтения scrollWidth.
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
  const overflow = await page.evaluate((tol) => {
    const root = document.documentElement
    return { scrollWidth: root.scrollWidth, clientWidth: root.clientWidth, over: root.scrollWidth > root.clientWidth + tol }
  }, VIEWPORT_TOLERANCE_PX)
  if (original) await page.setViewport(original)

  if (!overflow.over) return null
  return {
    ruleId: 'a11y-reflow-320',
    wcag: ['wcag1.4.10'],
    impact: 'serious',
    selector: 'html',
    page: pageUrl,
    html: `scrollWidth=${overflow.scrollWidth} clientWidth=${overflow.clientWidth} at 320px viewport`,
  }
}

// A3-KEYBOARD: обход Tab, поиск focus trap (одинаковый activeElement N подряд
// нажатий) и невидимого фокуса (нет визуального индикатора у сфокусированного
// элемента). Эвристика для невидимого фокуса грубая (computed outline/box-shadow) —
// сайты с кастомным :focus-visible через другие CSS-свойства (background-color,
// border) дадут false positive; безопаснее, чем молчать про реальный focus trap.
const MAX_TAB_STEPS = 40
const TRAP_REPEAT_THRESHOLD = 4 // столько раз подряд один и тот же элемент -> trap
// Одиночный прыжок назад законен (skip-link, модалка), повторяющийся — нет.
const MIN_OUT_OF_ORDER_STEPS = 2

export async function checkKeyboardTraversal(page, pageUrl) {
  // Сбрасываем накопитель предыдущего элемента: функция может вызываться на
  // нескольких страницах подряд в одном браузере, и остаточная ссылка дала бы
  // ложный «прыжок назад» на первом же шаге следующей страницы.
  await page.evaluate(() => {
    delete window.__aaPrevFocused
    document.body.focus()
  })
  const selectors = []
  let sameStreak = 0
  let trapSelector = null
  let lastInvisible = false // невидимость фокуса ПОСЛЕДНЕГО реально сфокусированного шага
  const outOfOrder = [] // шаги, где фокус ушёл назад по документу (9.2.4.3)

  for (let i = 0; i < MAX_TAB_STEPS; i++) {
    await page.keyboard.press('Tab')
    // Живая проверка (2026-08-06) нашла реальный баг первой версии: если читать
    // document.activeElement ОТДЕЛЬНЫМ evaluate() после выхода из цикла, фокус уже
    // мог уйти с последнего элемента на body (Tab после последней ссылки) — тогда
    // проверялся невидимый outline у body, не у реального последнего элемента, и
    // страница с явным `a:focus{outline:3px solid blue}` ложно помечалась как
    // "невидимый фокус". Читаем sel и invisible ЗА ОДИН evaluate, пока элемент точно
    // ещё в фокусе.
    const step = await page.evaluate(() => {
      const el = document.activeElement
      if (!el || el === document.body) return null
      const sel = el.id ? `#${el.id}` : el.tagName.toLowerCase() +
        (typeof el.className === 'string' && el.className ? `.${el.className.trim().split(/\s+/).join('.')}` : '')
      const cs = getComputedStyle(el)
      const invisible = (cs.outlineStyle === 'none' || cs.outlineWidth === '0px') && cs.boxShadow === 'none'

      // A3-FOCUS-ORDER (9.2.4.3): порядок обхода должен следовать порядку в DOM.
      // Сравниваем с ПРЕДЫДУЩИМ сфокусированным элементом через
      // compareDocumentPosition — узел нельзя вернуть наружу, поэтому держим
      // ссылку на нём же, в окне страницы. Прыжок назад по документу — сигнал,
      // что порядок переопределён (обычно положительным tabindex).
      const prev = window.__aaPrevFocused
      let backwards = false
      if (prev && prev.isConnected && prev !== el) {
        // DOCUMENT_POSITION_FOLLOWING = prev идёт ПОСЛЕ el, т.е. фокус ушёл назад
        backwards = Boolean(el.compareDocumentPosition(prev) & Node.DOCUMENT_POSITION_FOLLOWING)
      }
      // Trap = фокус реально застрял на ОДНОМ И ТОМ ЖЕ УЗЛЕ. Сравниваем identity узла
      // (prev === el), НЕ строку-селектор: ряд одинаковых карточек (напр.
      // `a.card.flex...`) даёт совпадающие селекторы на РАЗНЫХ узлах, и сравнение по
      // строке ложно объявляло ловушку, пока фокус нормально шёл по карточкам (D-165).
      const sameAsPrev = Boolean(prev && prev === el)
      window.__aaPrevFocused = el
      const tabindex = el.getAttribute('tabindex')
      const positiveTabindex = tabindex !== null && Number(tabindex) > 0

      return { sel, invisible, backwards, positiveTabindex, sameAsPrev }
    })
    if (step === null) break // вышли за пределы фокусируемых элементов — конец обхода
    if (step.sameAsPrev) {
      sameStreak++
      if (sameStreak >= TRAP_REPEAT_THRESHOLD) {
        trapSelector = step.sel
        break
      }
    } else {
      sameStreak = 0
    }
    if (step.backwards) outOfOrder.push({ sel: step.sel, positiveTabindex: step.positiveTabindex })
    selectors.push(step.sel)
    lastInvisible = step.invisible
  }

  const findings = []
  if (trapSelector) {
    findings.push({
      ruleId: 'a11y-keyboard-trap', wcag: ['wcag2.1.2'], impact: 'critical',
      selector: trapSelector, page: pageUrl,
      html: `Tab did not move focus past this element after ${TRAP_REPEAT_THRESHOLD} presses`,
    })
  }

  // 9.2.4.3 Focus Order. Одиночный прыжок назад бывает законным (модалка,
  // skip-link, кастомный виджет), поэтому сообщаем только о ПОВТОРЯЮЩЕМСЯ
  // расхождении — и отдельно называем положительный tabindex, если он есть:
  // это почти всегда настоящая причина, а не совпадение.
  if (outOfOrder.length >= MIN_OUT_OF_ORDER_STEPS) {
    const withPositiveTabindex = outOfOrder.filter((o) => o.positiveTabindex)
    findings.push({
      ruleId: 'a11y-focus-order',
      wcag: ['wcag243'],
      impact: 'serious',
      selector: outOfOrder[0].sel,
      page: pageUrl,
      html: `tab order moves backwards through the document ${outOfOrder.length} times` +
        (withPositiveTabindex.length
          ? `; ${withPositiveTabindex.length} of those elements use a positive tabindex, which overrides document order`
          : ' (heuristic — a modal or custom widget may reorder focus legitimately)'),
    })
  }

  if (selectors.length && !trapSelector && lastInvisible) {
    findings.push({
      ruleId: 'a11y-focus-invisible', wcag: ['wcag2.4.7'], impact: 'serious',
      selector: selectors[selectors.length - 1], page: pageUrl,
      html: 'focused element has no detectable outline or box-shadow (heuristic, may false-positive on custom focus styles)',
    })
  }

  return findings
}

// A3-MEDIA: автовоспроизведение без mute (1.4.2) и видео без <track kind="captions"> (1.2.2).
export async function checkMedia(page, pageUrl) {
  const results = await page.evaluate(() => {
    const out = []
    for (const v of document.querySelectorAll('video')) {
      const sel = v.id ? `#${v.id}` : 'video'
      if (v.autoplay && !v.muted) out.push({ kind: 'autoplay', selector: sel })
      const hasCaptions = [...v.querySelectorAll('track')].some((t) => t.kind === 'captions' || t.kind === 'subtitles')
      if (!hasCaptions) out.push({ kind: 'captions', selector: sel })
    }
    for (const a of document.querySelectorAll('audio')) {
      if (a.autoplay && !a.muted) out.push({ kind: 'autoplay', selector: a.id ? `#${a.id}` : 'audio' })
    }
    return out
  })

  return results.map((r) =>
    r.kind === 'autoplay'
      ? { ruleId: 'a11y-autoplay-media', wcag: ['wcag1.4.2'], impact: 'moderate', selector: r.selector, page: pageUrl, html: 'autoplay media without mute/pause-on-load control' }
      : { ruleId: 'a11y-video-no-captions', wcag: ['wcag1.2.2'], impact: 'serious', selector: r.selector, page: pageUrl, html: 'video has no <track kind="captions"> or "subtitles">' }
  )
}

// A3-RESIZE: WCAG 1.4.4, текст 200%. Приближение через CSS `zoom` (Chromium-специфично,
// но Browser Rendering — это Chromium) — не идентично браузерному Ctrl+ (тот также
// масштабирует chrome окна), но меняет layout тем же способом, каким его видит движок
// рендеринга. Честное ограничение, не выдаём за точную симуляцию.
export async function checkResize200(page, pageUrl) {
  const overflow = await page.evaluate((tol) => {
    const root = document.documentElement
    const prevZoom = root.style.zoom
    root.style.zoom = '200%'
    const result = { scrollWidth: root.scrollWidth, clientWidth: root.clientWidth }
    root.style.zoom = prevZoom
    return { ...result, over: result.scrollWidth > result.clientWidth + tol }
  }, VIEWPORT_TOLERANCE_PX)

  if (!overflow.over) return null
  return {
    ruleId: 'a11y-resize-200', wcag: ['wcag1.4.4'], impact: 'serious', selector: 'html', page: pageUrl,
    html: `scrollWidth=${overflow.scrollWidth} clientWidth=${overflow.clientWidth} at 200% zoom`,
  }
}

// A3-COOKIEBANNER: баннер согласия перекрывает страницу до его закрытия — axe (и все
// проверки выше) видят DOM с баннером поверх контента, а не реальную страницу.
// Детект по computed-style (fixed/sticky + высокий z-index + существенная площадь
// viewport'а + cookie-лексика в тексте) — статический HTML-парсинг сюда не годится
// (нужны computed position/z-index после рендера). Живая проверка (2026-08-06,
// bundesregierung.de): реальный баннер использует class="bpa-cookie-banner" —
// сигнатуры конкретных вендоров (OneTrust #onetrust-banner-sdk, Cookiebot
// #CybotCookiebotDialog) добавлены как быстрый путь, но основной путь — эвристика
// по стилям+тексту, не завязана на конкретный вендор.
const KNOWN_BANNER_SELECTORS = [
  '#onetrust-banner-sdk', '#CybotCookiebotDialog', '#complianz-cookie-banner',
  '#usercentrics-root', '.cc-window', '.cookie-consent-banner',
]
const ACCEPT_BUTTON_KEYWORDS = [
  'accept all', 'accept', 'agree', 'i agree', 'ok',
  'alle akzeptieren', 'akzeptieren', 'zustimmen', 'einverstanden',
  "j'accepte", 'tout accepter', 'accepter',
  'zaakceptuj wszystkie', 'zaakceptuj', 'akceptuję',
  'aceptar todo', 'aceptar',
]

export async function detectAndDismissCookieBanner(page) {
  const bannerHandle = await page.evaluate((known) => {
    const isCookieText = (t) => /\bcookie|datenschutz|consent|rgpd|cookies|plik[oó]w? cookie|zgod[aę]\b/i.test(t)
    for (const sel of known) {
      const el = document.querySelector(sel)
      if (el) return { selector: sel, matchedBy: 'known-vendor' }
    }
    const vw = window.innerWidth, vh = window.innerHeight
    const all = document.body.querySelectorAll('*')
    for (const el of all) {
      const cs = getComputedStyle(el)
      if (cs.position !== 'fixed' && cs.position !== 'sticky') continue
      const z = parseInt(cs.zIndex, 10)
      if (!z || z < 100) continue
      const rect = el.getBoundingClientRect()
      const coverage = (rect.width * rect.height) / (vw * vh)
      if (coverage < 0.1) continue // маленький виджет ("назад наверх") — не баннер
      if (!isCookieText(el.textContent || '')) continue
      return { selector: el.id ? `#${el.id}` : el.className ? `.${String(el.className).trim().split(/\s+/)[0]}` : cs.position, matchedBy: 'heuristic' }
    }
    return null
  }, KNOWN_BANNER_SELECTORS)

  if (!bannerHandle) return { found: false, dismissed: false, selector: null }

  const dismissed = await page.evaluate((keywords) => {
    const buttons = [...document.querySelectorAll('button, a, [role="button"]')]
    const norm = (s) => (s || '').trim().toLowerCase()
    const btn = buttons.find((b) => keywords.some((k) => norm(b.textContent).includes(k)))
    if (btn) {
      btn.click()
      return true
    }
    return false
  }, ACCEPT_BUTTON_KEYWORDS)

  if (dismissed) {
    // даём баннеру время уйти из DOM/скрыться перед тем, как axe читает страницу дальше
    await page.evaluate(() => new Promise((r) => setTimeout(r, 300)))
  }

  return { found: true, dismissed, selector: bannerHandle.selector }
}

// A3-HEADINGS (9.2.4.6 Headings and labels): заголовок обязан описывать тему
// раздела. Полностью автоматизировать «описательность» нельзя — это смысл, — но
// один случай проверяется однозначно и без ложных срабатываний: ПУСТОЙ заголовок
// не описывает ничего по определению. Учитываем доступное имя целиком
// (aria-label/aria-labelledby, alt вложенной картинки), поэтому <h2><img alt="Цены">
// пустым не считается. Скрытые заголовки (display:none) пропускаем — их нет ни для
// кого, включая скринридер.
const MAX_REPORTED_EMPTY_HEADINGS = 5

export async function checkEmptyHeadings(page, pageUrl) {
  const empties = await page.evaluate(() => {
    const out = []
    const nodes = document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"]')
    for (const h of nodes) {
      const cs = getComputedStyle(h)
      if (cs.display === 'none' || cs.visibility === 'hidden') continue
      if (h.getAttribute('aria-hidden') === 'true') continue
      const labelled = (h.getAttribute('aria-label') || '').trim()
      const labelledBy = h.getAttribute('aria-labelledby')
      const fromRef = labelledBy
        ? labelledBy.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? '').join(' ').trim()
        : ''
      const imgAlt = [...h.querySelectorAll('img[alt]')].map((i) => i.getAttribute('alt')).join(' ').trim()
      const text = (h.textContent || '').trim()
      if (text || labelled || fromRef || imgAlt) continue
      out.push(h.id ? `#${h.id}` : h.tagName.toLowerCase())
    }
    return out
  })

  if (empties.length === 0) return null
  return {
    ruleId: 'a11y-empty-heading',
    wcag: ['wcag246'],
    impact: 'moderate',
    selector: empties.slice(0, MAX_REPORTED_EMPTY_HEADINGS).join(', '),
    page: pageUrl,
    html: `${empties.length} heading${empties.length === 1 ? '' : 's'} with no text or accessible name — a heading that says nothing cannot describe its section`,
  }
}
