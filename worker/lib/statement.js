// Детект заявления о доступности (accessibility statement) — A3-STATEMENT.
//
// Первое, что проверяет надзор (MLBF/DE, аналоги в FR/ES): не WCAG-соответствие,
// а само наличие и полнота заявления. Anlage 3 к §14 BFSG (DE) требует 4 пункта;
// EN 301 549 / EAA закрепляют тот же принцип во всех юрисдикциях ЕС под разными
// локальными названиями. См. BACKLOG.md "Сканер: разрыв..." (2026-08-06).
//
// Чистые функции над HTML-строками — без браузера, тестируются напрямую.

import { normalizeText, extractAnchors } from './textUtils.js'

// Локализованные фразы для поиска ссылки на страницу заявления в HTML.
// Каждая фраза матчится регистронезависимо и без учёта диакритики (нормализуем текст ссылки).
const STATEMENT_LINK_PHRASES = [
  // en
  'accessibility statement', 'accessibility declaration',
  // de (BFSG/BITV)
  'barrierefreiheitserklärung', 'erklärung zur barrierefreiheit', 'barrierefreiheit',
  // fr (RGAA)
  "déclaration d'accessibilité", 'declaration accessibilite', 'accessibilité',
  // nl
  'toegankelijkheidsverklaring',
  // pl
  'deklaracja dostępności', 'deklaracja dostepnosci',
  // es
  'declaración de accesibilidad', 'declaracion de accesibilidad',
]

const normalize = normalizeText
const NORMALIZED_PHRASES = STATEMENT_LINK_PHRASES.map(normalize)

// Ищет ссылку на заявление о доступности на переданной странице (обычно — главная,
// т.к. Anlage 3 требует "на видном месте", как правило футер/навигация главной).
// Возвращает абсолютный URL или null. Консервативно: матчим по тексту ссылки,
// не по произвольному вхождению фразы в HTML — иначе много ложных срабатываний
// (упоминание слова "accessibility" где угодно на странице).
export function findStatementLink(html, baseUrl) {
  const anchors = extractAnchors(html)
  for (const { href, text } of anchors) {
    if (!text) continue
    const normText = normalize(text)
    if (NORMALIZED_PHRASES.some((phrase) => normText.includes(phrase))) {
      try {
        return new URL(href, baseUrl).toString()
      } catch {
        continue
      }
    }
  }
  return null
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
    'audit', // общий заимствованный термин, встречается во всех локалях (RGAA-отчёты
             // называют аудитора поимённо, "L'audit de conformité réalisé par ...")
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
  const text = normalize(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '))
  const result = {}
  const missing = []
  for (const [key, phrases] of Object.entries(CONTENT_PATTERNS)) {
    const present = phrases.some((p) => text.includes(normalize(p)))
    result[key] = present
    if (!present) missing.push(key)
  }
  return { ...result, missingParts: missing, complete: missing.length === 0 }
}
