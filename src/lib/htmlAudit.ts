// G-CHECKER-HTML-PARSER (D-183, 2026-08-15): чистое ядро двух чекеров —
// Alt Text Checker и Heading Structure Analyzer. Оба строятся на разборе
// вставленного HTML (ввод URL невозможен на клиенте из-за CORS — см.
// LEARNING_LOG 2026-08-15; это не чекер, а серверный сканер).
//
// Разделение по прецеденту readability.ts / guideRelations.ts: здесь —
// ТОЛЬКО анализ уже извлечённых структур (ImageInfo[], HeadingInfo[]),
// без единого обращения к DOM. Извлечение из HTML через DOMParser живёт в
// htmlExtract.ts (браузерная обёртка), не импортируется тестами. Причина не
// косметическая: DOMParser нет в Node, а именно в этих функциях лежит вся
// логика решений — что считать ошибкой, а что нет, — и она обязана быть
// покрыта юнит-тестами без браузера. Извлечение (querySelectorAll('img'),
// getAttribute) детерминированно и проверяется живым audit-прогоном.

export type Severity = 'error' | 'warning'

export interface Finding {
  severity: Severity
  // Короткий машинный код правила — стабилен, по нему тесты и группировка.
  code: string
  // Человеческий текст для пользователя (страница ПРО доступность обязана
  // объяснять, а не сыпать кодами — тот же принцип, что у readability).
  message: string
  // Контекст: селектор/фрагмент, чтобы человек нашёл место. Не HTML —
  // короткая ссылка на элемент.
  context: string
}

// --- Alt text ---

export interface ImageInfo {
  // null = атрибута alt нет вовсе; '' = alt="" (может быть намеренно
  // декоративным). Это РАЗНЫЕ случаи, и путать их нельзя.
  alt: string | null
  src: string
  // role="presentation" / role="none" / aria-hidden="true" — автор явно
  // пометил изображение декоративным. Тогда пустой/отсутствующий alt — не
  // ошибка, а согласованное намерение.
  decorativeByRole: boolean
}

// Префиксы, которые скринридер и так добавляет («image», «graphic») —
// дублировать их в alt избыточно. Список общепринятый (WebAIM, W3C tutorials).
const REDUNDANT_PREFIXES = ['image of ', 'picture of ', 'photo of ', 'graphic of ', 'a picture of ', 'an image of ']
const IMAGE_EXT_RE = /\.(jpe?g|png|gif|webp|svg|avif|bmp|tiff?)$/i
const MAX_ALT_LEN = 150

function basename(src: string): string {
  const noQuery = src.split(/[?#]/)[0]
  const parts = noQuery.split('/')
  return parts[parts.length - 1] || noQuery
}

export function analyzeAltText(images: ImageInfo[]): Finding[] {
  const findings: Finding[] = []
  for (const img of images) {
    const ctx = img.src ? basename(img.src) : '<img>'
    const alt = img.alt

    if (alt === null) {
      // Нет атрибута вовсе. Если элемент явно декоративен по роли — это
      // допустимо; иначе скринридер зачитает имя файла, что почти всегда мусор.
      if (!img.decorativeByRole) {
        findings.push({
          severity: 'error',
          code: 'alt-missing',
          message: 'No alt attribute. Screen readers will read the file name instead. Add alt="…" describing the image, or alt="" if it is purely decorative.',
          context: ctx,
        })
      }
      continue
    }

    const trimmed = alt.trim()

    if (trimmed === '') {
      // alt="" — валидно для декоративных. Не ошибка, но и не молчание:
      // мягко отмечаем, чтобы автор подтвердил намерение (пустой alt на
      // информативной картинке — частая настоящая ошибка).
      if (!img.decorativeByRole) {
        findings.push({
          severity: 'warning',
          code: 'alt-empty',
          message: 'Empty alt="". Correct only if the image is decorative and conveys no information. If it carries meaning, describe it.',
          context: ctx,
        })
      }
      continue
    }

    const lower = trimmed.toLowerCase()

    // alt повторяет имя файла — это не описание.
    if (IMAGE_EXT_RE.test(trimmed) || lower === basename(img.src).toLowerCase()) {
      findings.push({
        severity: 'error',
        code: 'alt-filename',
        message: 'The alt text looks like a file name, not a description. Describe what the image shows and why it matters.',
        context: ctx,
      })
      continue
    }

    const redundant = REDUNDANT_PREFIXES.find((p) => lower.startsWith(p))
    if (redundant) {
      findings.push({
        severity: 'warning',
        code: 'alt-redundant-prefix',
        message: `Drop the leading “${redundant.trim()}” — screen readers already announce that it is an image, so the prefix is repeated.`,
        context: ctx,
      })
    }

    if (trimmed.length > MAX_ALT_LEN) {
      findings.push({
        severity: 'warning',
        code: 'alt-too-long',
        message: `Alt text is ${trimmed.length} characters. Keep it concise (a sentence or so); move longer descriptions into surrounding text or a caption.`,
        context: ctx,
      })
    }
  }
  return findings
}

// --- Heading structure ---

export interface HeadingInfo {
  level: number // 1..6
  text: string
}

export interface HeadingResult {
  findings: Finding[]
  // Плоское оглавление для показа пользователю — уровень + текст в порядке
  // документа. Пустой текст сохраняем как есть, он же флагается отдельно.
  outline: { level: number; text: string }[]
}

export function analyzeHeadings(headings: HeadingInfo[]): HeadingResult {
  const findings: Finding[] = []
  const outline = headings.map((h) => ({ level: h.level, text: h.text.trim() }))

  if (headings.length === 0) {
    findings.push({
      severity: 'error',
      code: 'headings-none',
      message: 'No headings found. A page needs at least one heading (usually one h1) so screen-reader users can understand its structure and navigate it.',
      context: '<document>',
    })
    return { findings, outline }
  }

  const h1Count = headings.filter((h) => h.level === 1).length
  if (h1Count === 0) {
    findings.push({
      severity: 'error',
      code: 'headings-no-h1',
      message: 'No h1. Every page should have exactly one h1 naming what the page is about.',
      context: '<document>',
    })
  } else if (h1Count > 1) {
    findings.push({
      severity: 'warning',
      code: 'headings-multiple-h1',
      message: `Found ${h1Count} h1 headings. A single h1 per page is the widely-followed convention; multiple can confuse assistive-technology users about the page's main topic.`,
      context: '<document>',
    })
  }

  if (headings[0].level !== 1) {
    findings.push({
      severity: 'warning',
      code: 'headings-first-not-h1',
      message: `The first heading is an h${headings[0].level}, not an h1. The document outline usually starts at h1.`,
      context: headingCtx(headings[0]),
    })
  }

  // Пропуск уровня: с h2 нельзя прыгать на h4. Углубляться можно только на
  // один уровень за раз; ВВЕРХ (h4→h2) прыгать можно свободно — это закрытие
  // вложенных секций, не нарушение (то же правило, что у axe heading-order).
  let prev = headings[0].level
  for (let i = 1; i < headings.length; i++) {
    const cur = headings[i].level
    if (cur > prev + 1) {
      findings.push({
        severity: 'error',
        code: 'headings-skipped-level',
        message: `Heading level jumps from h${prev} to h${cur}, skipping h${prev + 1}. Don't skip levels going down — screen-reader users navigate by them and a gap reads as a missing section.`,
        context: headingCtx(headings[i]),
      })
    }
    prev = cur
  }

  for (const h of headings) {
    if (h.text.trim() === '') {
      findings.push({
        severity: 'error',
        code: 'headings-empty',
        message: `An h${h.level} has no text. An empty heading is announced as a heading with nothing in it, which is disorienting.`,
        context: `<h${h.level}>`,
      })
    }
  }

  return { findings, outline }
}

function headingCtx(h: HeadingInfo): string {
  const t = h.text.trim()
  return `<h${h.level}> ${t.length > 40 ? t.slice(0, 40) + '…' : t}`.trim()
}

// Общая сводка для UI: сколько ошибок / предупреждений. Пустой массив
// находок — это «чисто», и страница обязана сказать это явно (тишина
// читалась бы как «не проверяли»).
export function summarize(findings: Finding[]): { errors: number; warnings: number } {
  return {
    errors: findings.filter((f) => f.severity === 'error').length,
    warnings: findings.filter((f) => f.severity === 'warning').length,
  }
}
