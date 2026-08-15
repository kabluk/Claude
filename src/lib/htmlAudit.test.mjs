// G-CHECKER-HTML-PARSER (D-183): гейт чистого ядра alt-text и heading
// анализа. Здесь вся логика решений «ошибка / предупреждение / чисто» —
// поэтому проверяется досконально, включая границы (декоративное vs
// информативное, прыжок уровня ВНИЗ vs подъём ВВЕРХ). Извлечение из DOM
// (htmlExtract.ts) тестируется отдельно живым audit-прогоном — тут его нет.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { analyzeAltText, analyzeHeadings, summarize } from './htmlAudit.ts'

const codes = (findings) => findings.map((f) => f.code).sort()

// --- Alt text ---

test('нет атрибута alt на информативной картинке — ошибка', () => {
  const f = analyzeAltText([{ alt: null, src: '/logo.png', decorativeByRole: false }])
  assert.deepEqual(codes(f), ['alt-missing'])
  assert.equal(f[0].severity, 'error')
})

test('нет alt, но элемент декоративен по роли — не ошибка', () => {
  const f = analyzeAltText([{ alt: null, src: '/spacer.gif', decorativeByRole: true }])
  assert.deepEqual(f, [])
})

test('alt="" на информативной картинке — предупреждение, на декоративной — тишина', () => {
  const info = analyzeAltText([{ alt: '', src: '/chart.png', decorativeByRole: false }])
  assert.deepEqual(codes(info), ['alt-empty'])
  assert.equal(info[0].severity, 'warning')

  const deco = analyzeAltText([{ alt: '', src: '/border.png', decorativeByRole: true }])
  assert.deepEqual(deco, [])
})

test('alt повторяет имя файла — ошибка (это не описание)', () => {
  const byExt = analyzeAltText([{ alt: 'hero-banner.jpg', src: '/img/hero-banner.jpg', decorativeByRole: false }])
  assert.deepEqual(codes(byExt), ['alt-filename'])

  const byBasename = analyzeAltText([{ alt: 'DSC_0042', src: '/photos/DSC_0042', decorativeByRole: false }])
  assert.deepEqual(codes(byBasename), ['alt-filename'])
})

test('избыточный префикс "image of" — предупреждение', () => {
  const f = analyzeAltText([{ alt: 'Image of a red bicycle', src: '/bike.png', decorativeByRole: false }])
  assert.deepEqual(codes(f), ['alt-redundant-prefix'])
  assert.match(f[0].message, /image of/)
})

test('слишком длинный alt — предупреждение, короткий осмысленный — чисто', () => {
  const long = analyzeAltText([{ alt: 'x'.repeat(200), src: '/a.png', decorativeByRole: false }])
  assert.deepEqual(codes(long), ['alt-too-long'])

  const good = analyzeAltText([{ alt: 'A red bicycle leaning against a brick wall', src: '/bike.png', decorativeByRole: false }])
  assert.deepEqual(good, [])
})

test('один alt может собрать сразу несколько предупреждений (префикс + длина)', () => {
  const f = analyzeAltText([{ alt: 'Photo of ' + 'y'.repeat(160), src: '/a.png', decorativeByRole: false }])
  assert.deepEqual(codes(f), ['alt-redundant-prefix', 'alt-too-long'])
})

// --- Heading structure ---

test('нет заголовков вовсе — ошибка, дальше не анализируем', () => {
  const { findings, outline } = analyzeHeadings([])
  assert.deepEqual(codes(findings), ['headings-none'])
  assert.deepEqual(outline, [])
})

test('нет h1 — ошибка', () => {
  const { findings } = analyzeHeadings([{ level: 2, text: 'Section' }])
  assert.ok(findings.some((f) => f.code === 'headings-no-h1'))
})

test('несколько h1 — предупреждение, не ошибка', () => {
  const { findings } = analyzeHeadings([
    { level: 1, text: 'First' },
    { level: 1, text: 'Second' },
  ])
  const f = findings.find((x) => x.code === 'headings-multiple-h1')
  assert.ok(f)
  assert.equal(f.severity, 'warning')
})

test('прыжок уровня ВНИЗ через один (h2→h4) — ошибка', () => {
  const { findings } = analyzeHeadings([
    { level: 1, text: 'Title' },
    { level: 2, text: 'Section' },
    { level: 4, text: 'Deep' },
  ])
  assert.ok(findings.some((f) => f.code === 'headings-skipped-level'))
})

test('подъём ВВЕРХ через уровни (h4→h2) — НЕ ошибка (закрытие секций)', () => {
  const { findings } = analyzeHeadings([
    { level: 1, text: 'Title' },
    { level: 2, text: 'A' },
    { level: 3, text: 'A.1' },
    { level: 2, text: 'B' },
  ])
  assert.ok(!findings.some((f) => f.code === 'headings-skipped-level'))
})

test('первый заголовок не h1 — предупреждение', () => {
  const { findings } = analyzeHeadings([
    { level: 2, text: 'Starts too deep' },
    { level: 1, text: 'Real title later' },
  ])
  assert.ok(findings.some((f) => f.code === 'headings-first-not-h1'))
})

test('пустой заголовок — ошибка', () => {
  const { findings } = analyzeHeadings([
    { level: 1, text: 'Title' },
    { level: 2, text: '   ' },
  ])
  assert.ok(findings.some((f) => f.code === 'headings-empty'))
})

test('корректная иерархия h1→h2→h3→h2 — чисто', () => {
  const { findings, outline } = analyzeHeadings([
    { level: 1, text: 'Title' },
    { level: 2, text: 'A' },
    { level: 3, text: 'A.1' },
    { level: 2, text: 'B' },
  ])
  assert.deepEqual(findings, [])
  assert.equal(outline.length, 4)
})

// --- summarize ---

test('summarize считает ошибки и предупреждения раздельно', () => {
  const findings = [
    { severity: 'error', code: 'a', message: '', context: '' },
    { severity: 'warning', code: 'b', message: '', context: '' },
    { severity: 'error', code: 'c', message: '', context: '' },
  ]
  assert.deepEqual(summarize(findings), { errors: 2, warnings: 1 })
  assert.deepEqual(summarize([]), { errors: 0, warnings: 0 })
})
