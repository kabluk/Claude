// A3-CRON-RESCAN-DELTA (D-135): чистое сравнение двух сканов ОДНОГО URL.
//
// Единственный вход — два массива findings (форма ScanFinding, INTERFACES.md §3),
// ровно то, что лежит в `scans.findings_json` и что отдаёт `getScan().findings`.
// Никакого D1, никакой сети, никакого времени: модуль обязан оставаться чистым,
// потому что его единственный потребитель (A3-CRON-DIGEST-EMAIL) решает по нему,
// слать ли живому человеку письмо, — и такое решение должно быть воспроизводимо
// от одних и тех же двух массивов.
//
//   computeScanDelta(previousFindings, currentFindings, options?)
//     -> { new: ScanFinding[], resolved: ScanFinding[],
//          scoreChange: number, scoreBefore: number, scoreAfter: number,
//          scopedOutPages: string[] }
//
// options.previousPages / options.currentPages (необязательные, `ScanReport.pages`) —
// см. «СРАВНЕНИЕ ТОЛЬКО ПО ОБЩИМ СТРАНИЦАМ» ниже.
//
// ЗНАК scoreChange: `scoreAfter - scoreBefore`, то есть ПОЛОЖИТЕЛЬНОЕ значение =
// стало лучше (score в этом проекте — «чем больше, тем лучше», score.js).
// Названо и зафиксировано тестом намеренно: «изменение score» без знака —
// классический источник письма «у вас +7 проблем» на месте улучшения.

import { isMetaFinding, scoreFromFindings } from './score.js'

// РАЗДЕЛИТЕЛЬ ключа. U+0000 не встречается ни в CSS-селекторе, ни в URL, ни в
// ruleId — склейка через ':' или '|' дала бы коллизию на реальных селекторах
// (`a[href="x|y"]`, URL с ':').
const SEP = '\u0000'

// Правила, у которых `selector` — НЕ селектор элемента, а агрегат по странице.
// Найдено чтением worker/lib/axe.js, а не придумано: у `a11y-pdf-present`
// selector это строка вида `3 pdf link(s)` (axe.js, блок A3-PDF). Если включить
// её в ключ, то сайт, добавивший четвёртую PDF-ссылку, даст в дельте ОДНОВРЕМЕННО
// «новая находка» и «исправленная находка» — при том, что проблема ровно та же и
// никуда не делась. Для таких правил тождество — это (ruleId, page).
//
// Список держится минимальным и явным: расширять его «на всякий случай» опасно в
// другую сторону — склеятся разные реальные элементы одной страницы.
export const AGGREGATE_RULE_IDS = new Set(['a11y-pdf-present'])

// Стабильный идентификатор находки. Порядок в массиве НЕ участвует: axe обходит
// страницы и узлы в порядке, который меняется между прогонами (динамический DOM,
// разный порядок обнаружения ссылок), и сравнение по индексам показывало бы
// «изменения» на неизменившемся сайте.
//
// `html` в ключ НЕ входит намеренно: у наших собственных проверок это
// человекочитаемая сводка со счётчиками (`scrollWidth=1280 clientWidth=320`,
// `accessibility statement is missing: ...`), а у axe — фрагмент разметки,
// обрезанный до 300 символов. Всё это дрейфует при неизменной сути находки.
// `impact` тоже не входит: юрисдикционное взвешивание (jurisdiction.js) бампит
// impact у a11y-statement-* до critical, и находка не должна «исчезать и
// появляться» из-за смены юрисдикции или веса.
export function findingKey(finding) {
  const ruleId = typeof finding?.ruleId === 'string' ? finding.ruleId : ''
  const page = typeof finding?.page === 'string' ? finding.page : ''
  if (AGGREGATE_RULE_IDS.has(ruleId)) return `${ruleId}${SEP}${page}`
  const selector = typeof finding?.selector === 'string' ? finding.selector : ''
  return `${ruleId}${SEP}${page}${SEP}${selector}`
}

// Мультимножество: одинаковый ключ может честно встретиться дважды (две одинаковые
// записи одного правила на одной странице — например два узла с совпадающим
// target'ом axe после обрезки). Считаем КОЛИЧЕСТВА, а не факт наличия: если было
// две, а стала одна, одна действительно исправлена, и терять это нельзя.
function indexByKey(findings) {
  const index = new Map()
  for (const finding of findings) {
    const key = findingKey(finding)
    const bucket = index.get(key)
    if (bucket) bucket.push(finding)
    else index.set(key, [finding])
  }
  return index
}

// scan-meta-* — не нарушения сайта, а прозрачность качества скана (D-113,
// score.js::isMetaFinding). Они уже исключены из score; исключаем их и из
// new/resolved, чтобы дельта и scoreChange говорили об ОДНОМ И ТОМ ЖЕ множестве.
// Иначе подписчик получал бы письмо «новая находка: баннер cookie снят перед
// проверкой» при scoreChange = 0 — шум, за который отписываются.
function realFindings(findings) {
  return Array.isArray(findings) ? findings.filter((f) => f && !isMetaFinding(f)) : []
}

// СРАВНЕНИЕ ТОЛЬКО ПО ОБЩИМ СТРАНИЦАМ (опция, по умолчанию выключена).
//
// Найдено чтением реального обхода (worker/lib/links.js::pickPriorityLinks) и
// подтверждено живым прогоном по bundesregierung.de: набор обойдённых страниц
// НЕ фиксирован — это ≤6 ссылок, выбранных по ключевым словам из живой главной
// (плюс URL с query вроде `/service/kontakt?view=`). Стоит сайту поменять шапку,
// и на следующей неделе сканируется другая подстраница. Тогда все находки со
// старой страницы честно «исчезают», а с новой — «появляются», хотя никто ничего
// не чинил и не ломал: подписчик получает письмо про десятки изменений на ровном
// месте. Ровно та же ловушка ждёт сайты с session-id в ссылках
// (`;jsessionid=`, `?sid=`) — page-URL там разный при каждом обходе.
//
// Поэтому вызывающий может передать `pages` обоих сканов (ScanReport.pages), и
// тогда new/resolved считаются ТОЛЬКО по страницам, которые обошли ОБА скана;
// остальные попадают в `scopedOutPages` — их можно честно назвать в письме
// («на N страниц скан в этот раз не заходил»), а не выдать за изменения.
// score при этом остаётся посчитанным по ПОЛНЫМ наборам: это то же число, что
// лежит в `scans.score`, и расходиться с отчётом на сайте оно не должно.
function pageScope(options) {
  const previous = Array.isArray(options?.previousPages) ? options.previousPages.filter((p) => typeof p === 'string') : []
  const current = Array.isArray(options?.currentPages) ? options.currentPages.filter((p) => typeof p === 'string') : []
  if (previous.length === 0 || current.length === 0) return null

  const currentSet = new Set(current)
  const common = new Set(previous.filter((p) => currentSet.has(p)))
  const scopedOutPages = [...new Set([...previous, ...current])].filter((p) => !common.has(p))
  return { common, scopedOutPages }
}

export function computeScanDelta(previousFindings, currentFindings, options = {}) {
  const scope = pageScope(options)
  const inScope = (finding) => !scope || scope.common.has(finding?.page)

  const before = realFindings(previousFindings)
  const after = realFindings(currentFindings)

  const beforeIndex = indexByKey(before.filter(inScope))
  const afterIndex = indexByKey(after.filter(inScope))

  const added = []
  for (const [key, bucket] of afterIndex) {
    const had = beforeIndex.get(key)?.length ?? 0
    // Отдаём объекты ТЕКУЩЕГО скана: письмо описывает сегодняшнее состояние
    // (свежий html/failureSummary/impact), а не прошлогоднюю копию.
    added.push(...bucket.slice(had))
  }

  const resolved = []
  for (const [key, bucket] of beforeIndex) {
    const has = afterIndex.get(key)?.length ?? 0
    // А исчезнувшие описываем объектами ПРОШЛОГО скана — в текущем их нет вовсе.
    resolved.push(...bucket.slice(has))
  }

  // Score считаем тем же самым scoreFromFindings, что записан в scans.score
  // (worker/lib/scanJob.js), а не своей арифметикой: две формулы «оценки» в
  // одном продукте разъезжаются молча, и письмо противоречило бы отчёту.
  // Передаём УЖЕ отфильтрованные массивы, а не сырой вход: результат тот же
  // (scoreFromFindings сам пропускает scan-meta-*, так что число буквально
  // совпадает со `scans.score`), но `null` внутри массива из битой строки D1
  // здесь уже отброшен и не уронит чтение `f.impact`.
  const scoreBefore = scoreFromFindings(before)
  const scoreAfter = scoreFromFindings(after)

  return {
    new: added,
    resolved,
    scoreChange: scoreAfter - scoreBefore,
    scoreBefore,
    scoreAfter,
    scopedOutPages: scope?.scopedOutPages ?? [],
  }
}

// Удобство для A3-CRON-DIGEST-EMAIL: «письмо не шлём на нулевой дельте»
// (verify-критерий того узла) — один предикат, чтобы это условие не было
// переписано там заново чуть иначе. score-only изменение (правило то же, но
// impact вырос) намеренно СЧИТАЕТСЯ изменением: для владельца сайта переход
// serious -> critical это новость.
//
// ВНИМАНИЕ при включённом page-scope: scoreChange считается по полным наборам, а
// new/resolved — только по общим страницам, поэтому возможна дельта «список пуст,
// но score поехал» (изменилось на странице, которую в этот раз не обходили).
// Такое письмо описывать нечем — тот узел вправе требовать дополнительно
// `delta.new.length + delta.resolved.length > 0`.
export function isEmptyDelta(delta) {
  return delta.new.length === 0 && delta.resolved.length === 0 && delta.scoreChange === 0
}
