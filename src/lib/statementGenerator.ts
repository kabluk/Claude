// G-CHECKER-STATEMENT-GEN (D-181, 2026-08-15): чистая логика генератора
// заявления о доступности. Форма → готовый текст, ноль сети, ноль сервера.
//
// ИСТОЧНИК ФОРМУЛИРОВОК — не выдуман: структура и текст взяты из нашего же
// гайда `data/a11y/guides/accessibility-statement-guide.md` («A fillable
// template»), который построен на руководстве W3C WAI. Это тот же материал,
// который на сайте уже опубликован и вычитан, а не новая юридическая
// редактура (R1: ничего не выдумывать; заявление о доступности —
// регуляторный документ, сочинять в нём формулировки нельзя).
//
// ГЛАВНАЯ ТОНКОСТЬ, ради которой здесь вообще есть логика, а не шаблонная
// строка: слово, описывающее статус соответствия, РАЗНОЕ в двух рамках.
//   • Шаблон W3C WAI говорит "fully/partially **conformant**" — это
//     соответствие WCAG как техническому стандарту.
//   • Модельное заявление ЕС (Web Accessibility Directive и национальные
//     транспозиции — например немецкий BFSG, Anlage 3 zu §14) говорит
//     "fully/partially **compliant**".
// Проект уже наступал на это ровно один раз: собственное
// `/accessibility-statement/` было опубликовано со словом "conformant" и
// исправлено на "compliant" как юридически точную фразу EU-шаблона (D-170).
// Генератор обязан не растиражировать ту же ошибку на каждого пользователя:
// слово выбирается по выбранной рамке, а не берётся одно на все случаи.

export type StatementStandard = 'wcag22aa' | 'wcag21aa' | 'en301549'
export type ConformanceLevel = 'full' | 'partial' | 'none'
export type AssessmentBasis = 'self' | 'audit'

export interface StatementInput {
  orgName: string
  siteName: string
  standard: StatementStandard
  conformance: ConformanceLevel
  basis: AssessmentBasis
  auditorName: string
  assessmentDate: string
  limitations: string
  email: string
  phone: string
  responseDays: string
  technologies: string
  testedWith: string
  preparedDate: string
  reviewedDate: string
}

export const emptyStatementInput: StatementInput = {
  orgName: '',
  siteName: '',
  standard: 'wcag22aa',
  conformance: 'partial',
  basis: 'self',
  auditorName: '',
  assessmentDate: '',
  limitations: '',
  email: '',
  phone: '',
  responseDays: '5',
  technologies: 'HTML, CSS, JavaScript',
  testedWith: '',
  preparedDate: '',
  reviewedDate: '',
}

export const STANDARD_LABELS: Record<StatementStandard, string> = {
  wcag22aa: 'WCAG 2.2 Level AA',
  wcag21aa: 'WCAG 2.1 Level AA',
  en301549: 'EN 301 549',
}

// EN 301 549 — европейский стандарт, и заявление под ним читается
// регулятором ЕС; там модельная формулировка — "compliant". Для чистых
// WCAG-рамок остаётся терминология W3C — "conformant". Ровно это различие
// стоило проекту правки D-170 на собственном сайте.
export function conformanceWord(standard: StatementStandard): 'compliant' | 'conformant' {
  return standard === 'en301549' ? 'compliant' : 'conformant'
}

export function conformancePhrase(
  standard: StatementStandard,
  level: ConformanceLevel,
): string {
  const word = conformanceWord(standard)
  if (level === 'full') return `fully ${word}`
  if (level === 'partial') return `partially ${word}`
  // "non-compliant"/"non-conformant" — единственный честный вариант для
  // сайта, который стандарту пока не соответствует. Смягчать до
  // "partially" за пользователя нельзя: это его заявление о фактах.
  return `non-${word}`
}

export type StatementErrors = Partial<Record<'orgName' | 'siteName' | 'email' | 'auditorName', string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Проверяем ровно то, без чего заявление недействительно как документ:
// кто заявляет, о чём, и куда писать о проблеме (канал обратной связи —
// обязательный элемент и по W3C WAI, и по EU-шаблону). Всё остальное
// опционально и просто не попадает в вывод.
export function validateStatement(input: StatementInput): StatementErrors {
  const errors: StatementErrors = {}
  if (!input.orgName.trim()) errors.orgName = 'Enter the organisation name — the statement is made on its behalf.'
  if (!input.siteName.trim()) errors.siteName = 'Enter the site or app name the statement covers.'
  if (!input.email.trim() || !EMAIL_RE.test(input.email.trim())) {
    errors.email = 'Enter a real feedback address — a statement without a working contact channel is incomplete.'
  }
  if (input.basis === 'audit' && !input.auditorName.trim()) {
    errors.auditorName = 'Name the auditor — an audit claim without a named auditor cannot be verified.'
  }
  return errors
}

// Плейсхолдеры в квадратных скобках — как в шаблоне гайда. Пустое
// необязательное поле НЕ превращается в пустую строку в тексте: оно даёт
// либо честный плейсхолдер, либо секция опускается целиком. Публиковать
// «Email: » без адреса хуже, чем не публиковать секцию.
const ph = (value: string, placeholder: string) => (value.trim() ? value.trim() : `[${placeholder}]`)

export function buildStatement(input: StatementInput): string {
  const org = ph(input.orgName, 'Organisation Name')
  const site = ph(input.siteName, 'site/app name')
  const standard = STANDARD_LABELS[input.standard]
  const phrase = conformancePhrase(input.standard, input.conformance)
  const assessed = ph(input.assessmentDate, 'date')

  const basisText =
    input.basis === 'audit'
      ? `an audit conducted by ${ph(input.auditorName, 'auditor name')} on ${assessed}`
      : `a self-assessment completed on ${assessed}`

  const lines: string[] = [
    `Accessibility Statement for ${ph(input.siteName, 'Organisation / Site Name')}`,
    '',
    `${org} is committed to ensuring digital accessibility for people with`,
    'disabilities. We are continually improving the user experience for everyone',
    'and applying the relevant accessibility standards.',
    '',
    'Conformance status',
    `This website has been evaluated against ${standard} as of ${assessed}.`,
    `Based on ${basisText}, ${site} is ${phrase} with this standard.`,
  ]

  const limitationLines = input.limitations
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  // Секция известных ограничений появляется только если ограничения
  // названы. Заголовок «Known limitations» с пустым списком под ним читался
  // бы как «мы проверили и ничего не нашли» — утверждение, которого
  // пользователь не делал.
  if (limitationLines.length > 0) {
    lines.push('', 'Known limitations', 'The following known issues have not yet been fixed:')
    for (const l of limitationLines) lines.push(`- ${l}`)
    lines.push('We are working to resolve these and will update this statement as they', 'are fixed.')
  }

  lines.push(
    '',
    'Feedback',
    `We welcome your feedback on the accessibility of ${site}. Please let us know`,
    'if you encounter accessibility barriers:',
    `- Email: ${ph(input.email, 'address')}`,
  )
  if (input.phone.trim()) lines.push(`- Phone: ${input.phone.trim()}`)
  if (input.responseDays.trim()) {
    lines.push(`We try to respond to feedback within ${input.responseDays.trim()} business days.`)
  }

  lines.push(
    '',
    'Technical specifications',
    `Accessibility of ${site} relies on the following technologies to work with the`,
    'particular combination of web browser and any assistive technologies or',
    `plugins installed on your computer: ${ph(input.technologies, 'HTML, CSS, JavaScript')}.`,
  )
  if (input.testedWith.trim()) {
    lines.push(`This statement was tested using ${input.testedWith.trim()}, as of ${assessed}.`)
  }

  lines.push(
    '',
    'Preparation of this statement',
    `This statement was prepared on ${ph(input.preparedDate, 'date')} and last reviewed`,
    `on ${ph(input.reviewedDate, 'date')}. It was prepared using ${
      input.basis === 'audit' ? 'a third-party audit' : 'self-assessment'
    }.`,
  )

  return lines.join('\n')
}

// Тот же текст в виде HTML — вторая из двух форм, в которых заявление
// реально публикуют. Экранирование обязательно: поля вводит пользователь,
// и его «&» или «<» не должны ломать разметку (а вставка чужого тега в
// собственную страницу — это уже не косметика).
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function buildStatementHtml(input: StatementInput): string {
  const text = buildStatement(input)
  const blocks = text.split('\n\n')
  const out: string[] = []
  for (const [i, block] of blocks.entries()) {
    const blockLines = block.split('\n')
    if (i === 0) {
      out.push(`<h1>${escapeHtml(blockLines[0])}</h1>`)
      continue
    }
    // Заголовки секций шаблона — одиночная строка без завершающей точки,
    // за которой идёт текст. Список — строки, начинающиеся с "- ".
    const isHeading = ['Conformance status', 'Known limitations', 'Feedback', 'Technical specifications', 'Preparation of this statement'].includes(blockLines[0])
    if (isHeading) {
      out.push(`<h2>${escapeHtml(blockLines[0])}</h2>`)
      const rest = blockLines.slice(1)
      const listItems = rest.filter((l) => l.startsWith('- '))
      const prose = rest.filter((l) => !l.startsWith('- '))
      const before = prose.slice(0, listItems.length ? prose.findIndex((l) => l.startsWith('We are working')) : prose.length)
      if (before.filter(Boolean).length) out.push(`<p>${escapeHtml(before.join(' ').trim())}</p>`)
      if (listItems.length) {
        out.push('<ul>')
        for (const li of listItems) out.push(`  <li>${escapeHtml(li.slice(2))}</li>`)
        out.push('</ul>')
      }
      const after = prose.slice(before.length)
      if (after.filter(Boolean).length) out.push(`<p>${escapeHtml(after.join(' ').trim())}</p>`)
    } else {
      out.push(`<p>${escapeHtml(blockLines.join(' '))}</p>`)
    }
  }
  return out.join('\n')
}
