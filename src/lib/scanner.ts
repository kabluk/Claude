// Клиент сканера доступности: типы и вызовы Worker API (INTERFACES.md §2–3).
// Воркер живёт на отдельном origin от статического сайта — адрес задаётся при
// сборке через VITE_SCANNER_API (см. .env.example). Без него скан недоступен,
// но сайт всё равно собирается — сканер не должен блокировать каталог.

export type ScanFinding = {
  ruleId: string
  wcag: string[]
  impact: 'minor' | 'moderate' | 'serious' | 'critical'
  selector: string
  page: string
  html?: string
  // Проставляется воркером (worker/lib/jurisdiction.js) только на находках
  // "нет заявления о доступности" и только когда юрисдикция сайта подтверждённо
  // его требует — правовая база, и сумма штрафа ТОЛЬКО если она сверена с текстом
  // закона (сейчас лишь DE). См. INTERFACES.md §3, DECISIONS.md D-030/D-031.
  jurisdictionNote?: string
  // ISO-3166 alpha-2 юрисдикции, к которой относится заметка выше (D-040).
  // Нужен, чтобы страница отчёта могла увести немецкого посетителя на немецкий
  // путь, НЕ разбирая текст заметки регуляркой (копирайт менялся бы — логика
  // ломалась бы молча). Ставится ровно там же, где jurisdictionNote.
  jurisdictionCountry?: string
}

// 'busy' (A1-SCAN-BUSY-RETRY): очередь сканера упёрлась в лимит Browser
// Rendering. Отдельный код нужен именно потому, что это НЕ 'internal': у нас
// ничего не сломано и с сайтом пользователя всё в порядке — врать об этом
// нельзя (worker/lib/errors.js, worker/lib/scanJob.js).
export type ScanErrorCode = 'unreachable' | 'refused' | 'tls' | 'timeout' | 'blocked' | 'busy' | 'internal'

// CN-SCAN-PHASES (D-067): фазы, которые воркер РЕАЛЬНО проходит и пишет в D1
// (worker/lib/progress.js — источник; INTERFACES.md §3 — контракт).
export const SCAN_PHASES = ['discovering', 'statement', 'axe', 'dom-checks', 'aggregating'] as const
export type ScanPhase = (typeof SCAN_PHASES)[number]

export type ScanProgress = {
  phase: ScanPhase
  pagesDone: number | null
  pagesTotal: number | null
  updatedAt?: string
}

export type ScanReport = {
  id: string
  url: string
  status: 'running' | 'done' | 'error'
  pages: string[]
  findings: ScanFinding[]
  score: number | null
  error: string | null
  errorCode: ScanErrorCode | null
  createdAt: string
  completedAt: string | null
  // null: старый воркер/старая запись без прогресса, завершённый скан, или
  // непонятная форма — UI обязан работать без него (fallback D-064).
  progress: ScanProgress | null
  // A2-REPORT-PAYWALL: is the PDF remediation plan unlocked for this scan?
  // This is NOT a payment status — it means "was a lead left for this
  // scan_id" (worker/lib/db.js::hasLeadForScan). true unlocks the free
  // branch of the funnel (HANDOFF "Воронка": a lead is worth more than the
  // €19.99 plan); Stripe-paid unlock is a separate, later node. Only ever
  // true when status === 'done' (worker/routes/scan.js::withPlanUnlocked).
  planUnlocked: boolean
}

// Парсер прогресса — строгий к чужим формам, мягкий к отсутствию: всё, что не
// соответствует контракту (нет объекта, неизвестная фаза — в т.ч. от БОЛЕЕ
// НОВОГО воркера), превращается в null, и UI честно падает на трёхшаговый
// поток D-064, а не рисует мусор. Счётчики вне смысла (отрицательные, NaN)
// обнуляются в null по одному, не убивая фазу целиком.
export function parseScanProgress(raw: unknown): ScanProgress | null {
  if (typeof raw !== 'object' || raw === null) return null
  const o = raw as Record<string, unknown>
  if (typeof o.phase !== 'string' || !(SCAN_PHASES as readonly string[]).includes(o.phase)) return null
  const count = (v: unknown): number | null =>
    typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : null
  return {
    phase: o.phase as ScanPhase,
    pagesDone: count(o.pagesDone),
    pagesTotal: count(o.pagesTotal),
    updatedAt: typeof o.updatedAt === 'string' ? o.updatedAt : undefined,
  }
}

// `?.` не косметика: `import.meta.env` подставляет Vite, и вне сборки его нет
// вовсе. Без него этот модуль нельзя импортировать из node-теста — а он тянется
// как зависимость чистых функций (groupFindingsByRule), из-за чего оценка
// стоимости оставалась непокрытой тестами до D-046. В самой сборке поведение
// не меняется.
// .replace(/\/+$/,'') — не косметика (D-104): переменную в настройках GitHub
// владелец ввёл со слэшем на конце, бандл склеил `...workers.dev/` +
// `/api/scan` = `//api/scan`, роутер воркера такой путь не знает → 404
// «not found» под формой на проде. Значение из окружения — пользовательский
// ввод, нормализуем здесь, а не надеемся на дисциплину при вводе.
const API_BASE = (import.meta.env?.VITE_SCANNER_API ?? '').replace(/\/+$/, '')
export const TURNSTILE_SITE_KEY = import.meta.env?.VITE_TURNSTILE_SITE_KEY ?? ''

export class ScannerUnavailableError extends Error {}

// Тот же критерий, что worker/routes/scan.js::isHttpUrl — держать в синхроне вручную
// (worker — plain JS без общего с фронтендом модуля, см. D-010).
export function isValidScanUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  if (!API_BASE) throw new ScannerUnavailableError('VITE_SCANNER_API is not configured')
  return fetch(`${API_BASE}${path}`, init)
}

// countryCode (необязательный, ISO-3166 alpha-2) перебивает определение
// юрисдикции по домену — нужен для сайтов на .com/.eu и т.п., которые
// обслуживают конкретную страну, но по TLD не определяются вовсе (D-032).
export async function submitScan(
  url: string,
  opts?: { email?: string; turnstileToken?: string; countryCode?: string },
) {
  const res = await apiFetch('/api/scan', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url, ...opts }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(body.error ?? `scan request failed: HTTP ${res.status}`)
  }
  return (await res.json()) as { scanId: string }
}

// A2-REPORT-PAYWALL: strict-to-garbage, same rubric as parseScanProgress —
// an older deployed worker (D-022/D-064) simply won't send this field at
// all, and anything that isn't the literal boolean `true` must read as
// LOCKED, never accidentally unlocked. There is no partial/unknown state
// worth preserving here (unlike progress's phase enum): the field is a
// single boolean, so "not exactly true" and "absent" collapse to the same
// safe default.
export function parsePlanUnlocked(raw: unknown): boolean {
  return raw === true
}

export async function fetchScan(id: string): Promise<ScanReport | null> {
  const res = await apiFetch(`/api/scan/${encodeURIComponent(id)}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`failed to load scan: HTTP ${res.status}`)
  const raw = (await res.json()) as Omit<ScanReport, 'progress' | 'planUnlocked'> & {
    progress?: unknown
    planUnlocked?: unknown
  }
  // Задеплоенный воркер может быть старше этого клиента (D-022: деплой — решение
  // владельца): поля progress/planUnlocked может не быть вовсе — парсеры дают
  // null/false, UI живёт.
  return { ...raw, progress: parseScanProgress(raw.progress), planUnlocked: parsePlanUnlocked(raw.planUnlocked) }
}

// A2-REPORT-PAYWALL: the unlocked PDF plan is downloaded straight from the
// scanner origin (worker/routes/scanPdf.js), not this static site — reuses
// the same API_BASE every other scanner call already goes through, so the
// host is never hardcoded or duplicated in a page component.
export function scanPdfUrl(id: string): string {
  return `${API_BASE}/api/scan/${encodeURIComponent(id)}/pdf`
}

// A2-REPORT-PAYWALL: pure "what does the plan panel show" decision, kept out
// of ReportPage so it's testable without rendering. Three states, not two:
// a scan with zero issue groups has nothing to build a remediation plan
// from — showing a paywall (or even an unlocked-but-empty plan) for "we
// found nothing" would be a dishonest upsell, not a UX nicety.
export type PlanPanelState = 'hidden' | 'unlocked' | 'locked'

export function decidePlanPanel(
  report: Pick<ScanReport, 'planUnlocked'>,
  findingGroupCount: number,
): PlanPanelState {
  if (findingGroupCount === 0) return 'hidden'
  return report.planUnlocked ? 'unlocked' : 'locked'
}

// Понятные, не технические тексты под каждый errorCode (VISION.md UX-требование 4,
// D-013) — сырой error/стектрейс здесь никогда не показывается пользователю.
// АНГЛИЙСКИЙ (D-105): исходно строки были написаны по-русски (D-013 создавался
// до фиксации языка продукта) и прожили так до первого реального сбоя на
// проде — владелец увидел русскую ошибку на английском сайте. Ни один гейт
// это не ловил: тексты живут только в клиентском error-состоянии и не
// попадают в пререндеренный HTML, который проверяют наши проверки.
const ERROR_MESSAGES: Record<ScanErrorCode, string> = {
  unreachable: "We couldn't find this site. Check the address — it may be a typo, or the site may no longer exist.",
  refused: 'The site refused the connection. It may be temporarily down — please try again later.',
  tls: 'The site has a problem with its security certificate (HTTPS). We can’t scan it until that is fixed.',
  timeout: 'The site took too long to respond and the scan stopped. Try again — the server may be overloaded right now.',
  blocked: 'The site blocked our scanner (for example via robots.txt or bot protection). We respect these restrictions and do not bypass them.',
  busy: 'Our scanner is at capacity right now because of high demand — nothing is wrong with your site. Please try again in a few minutes.',
  internal: 'Something went wrong on our side during the scan. We already know about it — please try again in a few minutes.',
}

export function scanErrorMessage(errorCode: ScanErrorCode | null): string {
  return errorCode ? (ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES.internal) : ERROR_MESSAGES.internal
}

// D-107: score → слово, для карточки отчёта (макет владельца, Stitch). Пороги
// выбраны владельцем явно (не подобраны под красивую границу): 90 Excellent,
// 70 Good, 50 Needs work, ниже — Poor. Единственный источник правды — здесь;
// ReportPage только маппит грейд на chip-класс (те же 4 семантических токена
// severity, что уже красят находки — не вводим отдельную цветовую систему
// «под скор», см. styles.css chip-critical/-serious/-moderate/-success).
export type ScoreGrade = 'excellent' | 'good' | 'needs-work' | 'poor'

export function scoreGrade(score: number): ScoreGrade {
  if (score >= 90) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 50) return 'needs-work'
  return 'poor'
}

const SCORE_GRADE_LABEL: Record<ScoreGrade, string> = {
  excellent: 'Excellent',
  good: 'Good',
  'needs-work': 'Needs work',
  poor: 'Poor',
}
export const scoreGradeLabel = (grade: ScoreGrade) => SCORE_GRADE_LABEL[grade]

// chip-success переиспользуется для двух верхних грейдов — это не потеря
// различимости: сам грейд-текст (Excellent/Good) уже различает их, а зелёный
// цвет для обоих «в порядке» исходов совпадает с тем, как success-токен уже
// используется в блоке «находок не найдено» ниже по отчёту.
const SCORE_GRADE_CHIP_CLASS: Record<ScoreGrade, string> = {
  excellent: 'chip-success',
  good: 'chip-success',
  'needs-work': 'chip-moderate',
  poor: 'chip-critical',
}
export const scoreGradeChipClass = (grade: ScoreGrade) => SCORE_GRADE_CHIP_CLASS[grade]

const IMPACT_LABEL: Record<ScanFinding['impact'], string> = {
  critical: 'Critical',
  serious: 'Serious',
  moderate: 'Moderate',
  minor: 'Minor',
}
export const impactLabel = (impact: ScanFinding['impact']) => IMPACT_LABEL[impact]

const IMPACT_ORDER: Record<ScanFinding['impact'], number> = { critical: 0, serious: 1, moderate: 2, minor: 3 }
export const impactRank = (impact: ScanFinding['impact']) => IMPACT_ORDER[impact]

// axe-core wcag-теги ("wcag2a", "wcag21aa", "wcag111") — НЕ то же самое, что
// StandardSlug каталога (data/a11y/types.ts). Это отдельная таксономия одного
// инструмента; путать их нельзя (см. D-013).
export function formatWcagTag(tag: string): string {
  const version = /^wcag(2|21|22)(a|aa|aaa)$/.exec(tag)
  if (version) {
    const [, ver, level] = version
    const versionLabel = ver === '2' ? '2.0' : ver === '21' ? '2.1' : '2.2'
    return `WCAG ${versionLabel} ${level.toUpperCase()}`
  }
  const criterion = /^wcag(\d)(\d)(\d+)$/.exec(tag)
  if (criterion) {
    const [, a, b, c] = criterion
    return `${a}.${b}.${c}`
  }
  return tag
}

export function groupFindingsByRule(findings: ScanFinding[]) {
  const byRule = new Map<
    string,
    {
      ruleId: string
      impact: ScanFinding['impact']
      wcag: string[]
      jurisdictionNote?: string
      jurisdictionCountry?: string
      instances: ScanFinding[]
    }
  >()
  for (const f of findings) {
    const existing = byRule.get(f.ruleId)
    if (existing) {
      existing.instances.push(f)
      // Правовая пометка одинакова для всех инстансов одного правила (её ставит
      // одна и та же юрисдикция) — берём первую непустую, чтобы группа не потеряла
      // её, если первый инстанс почему-то без неё.
      existing.jurisdictionNote ??= f.jurisdictionNote
      existing.jurisdictionCountry ??= f.jurisdictionCountry
    } else {
      byRule.set(f.ruleId, {
        ruleId: f.ruleId,
        impact: f.impact,
        wcag: f.wcag,
        jurisdictionNote: f.jurisdictionNote,
        jurisdictionCountry: f.jurisdictionCountry,
        instances: [f],
      })
    }
  }
  return [...byRule.values()].sort((a, b) => impactRank(a.impact) - impactRank(b.impact))
}
