// Детект заявления о доступности (accessibility statement) — A3-STATEMENT.
//
// Первое, что проверяет надзор (MLBF/DE, аналоги в FR/ES): не WCAG-соответствие,
// а само наличие и полнота заявления. Anlage 3 к §14 BFSG (DE) требует 4 пункта;
// EN 301 549 / EAA закрепляют тот же принцип во всех юрисдикциях ЕС под разными
// локальными названиями. См. BACKLOG.md "Сканер: разрыв..." (2026-08-06).
//
// Чистые функции над HTML-строками — без браузера, тестируются напрямую.

import { normalizeText, extractAnchors } from './textUtils.js'

// D-165: раньше все фразы матчились по ВХОЖДЕНИЮ, и голое немецкое слово
// «barrierefreiheit» ловило непрофильные ссылки («Barrierefreiheit am Arbeitsplatz» —
// карьерная страница), а английское требовало полную фразу «accessibility statement»,
// пропуская обычную ссылку просто «Accessibility». Делим на СИЛЬНЫЕ (специфичные для
// заявления — по вхождению) и СЛАБЫЕ (голое слово «доступность» — только если текст
// ссылки РАВЕН этому слову, т.е. ссылка буквально «Accessibility»/«Barrierefreiheit»).
const STRONG_LINK_PHRASES = [
  'accessibility statement', 'accessibility declaration',
  'barrierefreiheitserklärung', 'erklärung zur barrierefreiheit',
  "déclaration d'accessibilité", 'declaration accessibilite',
  'toegankelijkheidsverklaring',
  'deklaracja dostępności', 'deklaracja dostepnosci',
  'declaración de accesibilidad', 'declaracion de accesibilidad',
]
const WEAK_LINK_WORDS = [
  'accessibility', 'barrierefreiheit', 'accessibilité', 'zugänglichkeit',
  'toegankelijkheid', 'dostępność', 'accesibilidad',
]

const normalize = normalizeText
const NORMALIZED_STRONG = STRONG_LINK_PHRASES.map(normalize)
const NORMALIZED_WEAK = WEAK_LINK_WORDS.map(normalize)

// Декод самых частых HTML-сущностей до сравнения — CMS кодируют апострофы/акценты
// (`s&rsquo;applique`, `Accessibilit&eacute;`), и без декода реальный текст не матчился
// бы (ложный «пункт отсутствует» / пропуск ссылки) (D-165).
function decodeEntities(s) {
  return s
    .replace(/&(?:rsquo|lsquo|apos|#8217|#8216|#39);/gi, "'")
    .replace(/&(?:nbsp|#160);/gi, ' ')
    .replace(/&(?:eacute|#233);/gi, 'e').replace(/&(?:egrave|#232);/gi, 'e')
    .replace(/&(?:agrave|#224);/gi, 'a').replace(/&(?:ccedil|#231);/gi, 'c')
    .replace(/&(?:ndash|#8211|mdash|#8212);/gi, '-')
    .replace(/&amp;/gi, '&')
}

// Путь, который сам по себе выдаёт страницу заявления (сильнее любого текста ссылки).
const STATEMENT_HREF_HINTS = [
  'accessibility-statement', 'accessibility-declaration', 'barrierefreiheitserklaerung',
  'erklaerung-zur-barrierefreiheit', 'declaration-accessibilite', 'declaration-d-accessibilite',
  'toegankelijkheidsverklaring', 'deklaracja-dostepnosci', 'declaracion-de-accesibilidad',
]
// Путь статьи/гайда — НЕ страница заявления, даже если заголовок содержит фразу.
const ARTICLE_PATH_RE = /\/(guides?|blog|news|articles?|artykul|ratgeber|wissen|knowledge|magazin)\//i

// Ищет ссылку на заявление о доступности на переданной странице (обычно — главная,
// т.к. Anlage 3 требует "на видном месте", как правило футер/навигация главной).
// Возвращает абсолютный URL или null.
//
// D-165/D-166: НЕ «первая подходящая ссылка», а лучший кандидат по рангу. Живая
// проверка на verscala.com показала настоящий баг first-match: сайт, который ПУБЛИКУЕТ
// гайды про заявления (мы сами и почти любое a11y-агентство из каталога), отдавал
// заголовок гайда «Audit RGAA … déclaration d'accessibilité» → сканер оценивал ЧУЖУЮ
// страницу и выдавал ложный statement-incomplete, не заметив настоящего
// /accessibility-statement/ ниже в футере.
export function findStatementLink(html, baseUrl) {
  const anchors = extractAnchors(html)
  let best = null
  for (const { href, text } of anchors) {
    if (!text || !href) continue
    const normText = normalize(decodeEntities(text))
    const normHref = normalize(href)
    const strongPhrase = NORMALIZED_STRONG.find((phrase) => normText.includes(phrase))
    const weakExact = NORMALIZED_WEAK.some((word) => normText === word)
    const hrefHint = STATEMENT_HREF_HINTS.some((h) => normHref.includes(h))
    if (!strongPhrase && !weakExact && !hrefHint) continue

    let score = 0
    if (hrefHint) score += 100                                   // путь — самый надёжный сигнал
    if (strongPhrase && normText === strongPhrase) score += 60   // текст ровно «Accessibility Statement»
    else if (strongPhrase && normText.length <= strongPhrase.length + 12) score += 30
    else if (strongPhrase) score += 5                            // длинный заголовок, лишь содержащий фразу
    if (weakExact) score += 40                                   // ссылка ровно «Accessibility»
    if (ARTICLE_PATH_RE.test(href)) score -= 80                  // /guides/…, /blog/… — это статья
    if (score <= 0) continue

    let abs
    try { abs = new URL(href, baseUrl).toString() } catch { continue }
    if (!best || score > best.score) best = { url: abs, score }
  }
  return best ? best.url : null
}

// Anlage 3 к §14 BFSG требует 4 содержательных пункта на самой странице заявления:
// 1. описание услуги/контента в доступном формате (accessible alternative)
// 2. пояснение к обеспечению доступности (соответствие/несоответствие, план)
// 3. описание МЕТОДА проверки — как именно проверяли (аудит/самооценка/дата)
// 4. указание надзорного органа (Durchsetzungsstelle/enforcement body) + способ пожаловаться
//
// Это эвристика по ключевым словам на нормализованном тексте страницы (не HTML-тегам),
// намеренно консервативная — false negative (не увидели пункт, который есть) безопаснее
// false positive (сказали "всё в порядке" сайту, где пункта нет).
// Ключевые фразы намеренно короткие подстроки, а не целые предложения: живая
// проверка на реальном заявлении (bundesregierung.de/breg-de/barrierefreiheit,
// 2026-08-06) нашла false negative у первой версии — немецкий текст вставляет
// доп. слова ("Diese Erklärung ZUR BARRIEREFREIHEIT gilt für...", не «diese
// erklärung gilt für» подряд), а типовая методология называется поимённо
// («BITV-Test»), не описывается словом «geprüft»/«getestet».
const CONTENT_PATTERNS = {
  serviceDescription: [
    'gilt für die', 'gilt für diese', 'geltungsbereich', 'anwendungsbereich',
    'this statement applies', 'this accessibility statement applies', 'scope of this statement',
    "s'applique", 'champ d application', "champ d'application",
    'niniejsza deklaracja dotyczy', 'zakres deklaracji', 'ta deklaracja dostępności dotyczy',
    'aplica a', 'ámbito de aplicación',
  ],
  complianceExplanation: [
    'teilweise vereinbar', 'nicht vereinbar', 'vollständig vereinbar', 'konformitätsstatus',
    'partially compliant', 'fully compliant', 'not compliant', 'compliance status',
    'partiellement conforme', 'totalement conforme', 'non conforme',
    'częściowo zgodna', 'w pełni zgodna', 'niezgodna',
    'parcialmente conforme', 'totalmente conforme', 'no conforme',
  ],
  methodology: [
    'bitv-test', 'bitv test', 'selbstbewertung', 'selbsteinschätzung', 'wurde geprüft',
    'wurde getestet', 'prüfverfahren', 'überprüfung der einhaltung', 'externe prüfung',
    'self-assessment', 'self-evaluation', 'was tested', 'evaluation method', 'conducted an audit',
    'method used to prepare', 'methods used to prepare',
    'auto-évaluation', "a été évalué", "méthode d'évaluation", 'méthode utilisée', 'audit de conformité',
    'samoocena', 'została przetestowana', 'metoda oceny', 'metoda przygotowania',
    'autoevaluación', 'método utilizado', 'evaluación externa',
    // D-165: голое «audit» убрано — ловило непрофильное «financial audit report» и
    // ложно ставило methodology:true, маскируя реально отсутствующий пункт (FN-безопаснее
    // недосказать). Реальные a11y-случаи покрыты специфичными фразами выше
    // ('audit de conformité', 'conducted an audit', 'bitv-test', 'externe prüfung' …).
  ],
  enforcementBody: [
    'durchsetzungsstelle', 'überwachungsstelle', 'schlichtungsstelle', 'bundesfachstelle',
    'enforcement body', 'enforcement procedure', 'supervisory body', 'complaints procedure',
    'organisme de contrôle', 'défenseur des droits', 'procédure de réclamation',
    'organ nadzorczy', 'organ egzekwujący', 'procedura odwoławcza',
    'organismo de control', 'procedimiento de reclamación',
  ],
}

export function evaluateStatementContent(html) {
  const text = normalize(decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' '))
  const result = {}
  const missing = []
  for (const [key, phrases] of Object.entries(CONTENT_PATTERNS)) {
    const present = phrases.some((p) => text.includes(normalize(p)))
    result[key] = present
    if (!present) missing.push(key)
  }
  return { ...result, missingParts: missing, complete: missing.length === 0 }
}
