// G-CHECKER-STATEMENT-GEN (D-181): гейт генератора заявления о доступности.
// Заявление — регуляторный документ; ошибка в формулировке тиражируется на
// каждого пользователя инструмента, поэтому проверяется не «функция что-то
// вернула», а конкретные юридически значимые слова.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildStatement,
  buildStatementHtml,
  conformancePhrase,
  conformanceWord,
  emptyStatementInput,
  escapeHtml,
  validateStatement,
} from './statementGenerator.ts'

const FILLED = {
  ...emptyStatementInput,
  orgName: 'Acme GmbH',
  siteName: 'acme.example',
  assessmentDate: '2026-08-15',
  email: 'a11y@acme.example',
  preparedDate: '2026-08-15',
  reviewedDate: '2026-08-15',
}

// --- Ядро узла: compliant vs conformant (прецедент D-170) ---

test('EN 301 549 даёт "compliant", WCAG-рамки — "conformant"', () => {
  assert.equal(conformanceWord('en301549'), 'compliant')
  assert.equal(conformanceWord('wcag22aa'), 'conformant')
  assert.equal(conformanceWord('wcag21aa'), 'conformant')
})

test('фраза статуса собирается из рамки И уровня, для всех девяти сочетаний', () => {
  assert.equal(conformancePhrase('en301549', 'full'), 'fully compliant')
  assert.equal(conformancePhrase('en301549', 'partial'), 'partially compliant')
  assert.equal(conformancePhrase('en301549', 'none'), 'non-compliant')
  assert.equal(conformancePhrase('wcag22aa', 'full'), 'fully conformant')
  assert.equal(conformancePhrase('wcag22aa', 'partial'), 'partially conformant')
  assert.equal(conformancePhrase('wcag22aa', 'none'), 'non-conformant')
  assert.equal(conformancePhrase('wcag21aa', 'full'), 'fully conformant')
  assert.equal(conformancePhrase('wcag21aa', 'partial'), 'partially conformant')
  assert.equal(conformancePhrase('wcag21aa', 'none'), 'non-conformant')
})

test('в готовом тексте под EN 301 549 стоит именно "compliant" — та самая правка D-170', () => {
  const text = buildStatement({ ...FILLED, standard: 'en301549', conformance: 'partial' })
  assert.match(text, /partially compliant/)
  assert.doesNotMatch(text, /conformant/)
})

test('в готовом тексте под WCAG стоит "conformant", а не "compliant"', () => {
  const text = buildStatement({ ...FILLED, standard: 'wcag22aa', conformance: 'partial' })
  assert.match(text, /partially conformant/)
  assert.doesNotMatch(text, /partially compliant/)
})

test('несоответствие стандарту не смягчается за пользователя', () => {
  const text = buildStatement({ ...FILLED, standard: 'en301549', conformance: 'none' })
  assert.match(text, /non-compliant/)
  assert.doesNotMatch(text, /partially/)
})

// --- Честность вывода ---

test('секция известных ограничений отсутствует, если ограничения не названы', () => {
  // Пустой заголовок «Known limitations» читался бы как «проверили, всё
  // чисто» — утверждение, которого пользователь не делал.
  const text = buildStatement({ ...FILLED, limitations: '' })
  assert.doesNotMatch(text, /Known limitations/)
})

test('названные ограничения попадают в список построчно', () => {
  const text = buildStatement({ ...FILLED, limitations: 'PDFs are not tagged\nVideo lacks captions\n\n' })
  assert.match(text, /Known limitations/)
  assert.match(text, /- PDFs are not tagged/)
  assert.match(text, /- Video lacks captions/)
})

test('незаполненное обязательное поле даёт видимый плейсхолдер, а не пустоту', () => {
  const text = buildStatement(emptyStatementInput)
  assert.match(text, /\[Organisation Name\]/)
  assert.match(text, /\[address\]/)
  assert.match(text, /\[date\]/)
})

test('аудит называет аудитора, самооценка — не выдумывает его', () => {
  const audit = buildStatement({ ...FILLED, basis: 'audit', auditorName: 'Deque Systems' })
  assert.match(audit, /an audit conducted by Deque Systems on 2026-08-15/)
  assert.match(audit, /prepared using a third-party audit/)

  const self = buildStatement({ ...FILLED, basis: 'self' })
  assert.match(self, /a self-assessment completed on 2026-08-15/)
  assert.doesNotMatch(self, /audit conducted by/)
})

test('необязательные телефон и tested-with опускаются, когда пусты', () => {
  const text = buildStatement({ ...FILLED, phone: '', testedWith: '' })
  assert.doesNotMatch(text, /Phone:/)
  assert.doesNotMatch(text, /tested using/)

  const withBoth = buildStatement({ ...FILLED, phone: '+49 30 123456', testedWith: 'NVDA + Firefox' })
  assert.match(withBoth, /- Phone: \+49 30 123456/)
  assert.match(withBoth, /tested using NVDA \+ Firefox/)
})

// --- Валидация ---

test('валидация требует того, без чего заявление недействительно', () => {
  const errors = validateStatement(emptyStatementInput)
  assert.ok(errors.orgName)
  assert.ok(errors.siteName)
  assert.ok(errors.email, 'канал обратной связи обязателен и по W3C WAI, и по EU-шаблону')
})

test('заявленный аудит без имени аудитора отклоняется', () => {
  const errors = validateStatement({ ...FILLED, basis: 'audit', auditorName: '' })
  assert.ok(errors.auditorName)
  assert.equal(validateStatement({ ...FILLED, basis: 'audit', auditorName: 'TPGi' }).auditorName, undefined)
})

test('заполненная форма проходит валидацию без ошибок', () => {
  assert.deepEqual(validateStatement(FILLED), {})
})

// --- HTML-вывод ---

test('HTML экранирует пользовательский ввод — чужой тег не попадает в разметку', () => {
  assert.equal(escapeHtml('<script>x</script>'), '&lt;script&gt;x&lt;/script&gt;')
  const html = buildStatementHtml({ ...FILLED, orgName: 'Acme <script>alert(1)</script>' })
  assert.doesNotMatch(html, /<script>/)
  assert.match(html, /&lt;script&gt;/)
})

test('HTML содержит заголовки секций и список ограничений', () => {
  const html = buildStatementHtml({ ...FILLED, limitations: 'PDFs are not tagged' })
  assert.match(html, /<h1>Accessibility Statement for acme\.example<\/h1>/)
  assert.match(html, /<h2>Conformance status<\/h2>/)
  assert.match(html, /<h2>Feedback<\/h2>/)
  assert.match(html, /<li>PDFs are not tagged<\/li>/)
})
