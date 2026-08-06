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
}

export type ScanErrorCode = 'unreachable' | 'refused' | 'tls' | 'timeout' | 'blocked' | 'internal'

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
}

const API_BASE = import.meta.env.VITE_SCANNER_API ?? ''

export class ScannerUnavailableError extends Error {}

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  if (!API_BASE) throw new ScannerUnavailableError('VITE_SCANNER_API is not configured')
  return fetch(`${API_BASE}${path}`, init)
}

export async function submitScan(url: string, opts?: { email?: string; turnstileToken?: string }) {
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

export async function fetchScan(id: string): Promise<ScanReport | null> {
  const res = await apiFetch(`/api/scan/${encodeURIComponent(id)}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`failed to load scan: HTTP ${res.status}`)
  return (await res.json()) as ScanReport
}

// Понятные, не технические тексты под каждый errorCode (VISION.md UX-требование 4,
// D-013) — сырой error/стектрейс здесь никогда не показывается пользователю.
const ERROR_MESSAGES: Record<ScanErrorCode, string> = {
  unreachable: 'Не удалось найти этот сайт. Проверьте адрес — возможно, опечатка или сайт больше не существует.',
  refused: 'Сайт отказался принять соединение. Возможно, он временно недоступен — попробуйте ещё раз позже.',
  tls: 'У сайта проблема с сертификатом безопасности (HTTPS). Мы не можем просканировать его, пока это не будет исправлено.',
  timeout: 'Сайт слишком долго не отвечал, и сканирование остановилось. Попробуйте ещё раз — возможно, сервер сейчас перегружен.',
  blocked: 'Сайт заблокировал наш сканер (например, через robots.txt или защиту от ботов). Мы уважаем эти ограничения и не обходим их.',
  internal: 'У нас на стороне что-то пошло не так во время сканирования. Мы уже знаем об этом — попробуйте ещё раз через несколько минут.',
}

export function scanErrorMessage(errorCode: ScanErrorCode | null): string {
  return errorCode ? (ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES.internal) : ERROR_MESSAGES.internal
}

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
  const byRule = new Map<string, { ruleId: string; impact: ScanFinding['impact']; wcag: string[]; instances: ScanFinding[] }>()
  for (const f of findings) {
    const existing = byRule.get(f.ruleId)
    if (existing) existing.instances.push(f)
    else byRule.set(f.ruleId, { ruleId: f.ruleId, impact: f.impact, wcag: f.wcag, instances: [f] })
  }
  return [...byRule.values()].sort((a, b) => impactRank(a.impact) - impactRank(b.impact))
}
