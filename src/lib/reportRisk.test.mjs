// D-143: правило честности карточки «What's at risk» — плашка с законом
// появляется ТОЛЬКО когда юрисдикция реально определена сканом. Тест написан
// как «что мы обещаем пользователю», а не «что делает функция»: сайт на .com
// без определения страны не должен увидеть ни слова про EAA.
//
// Модуль импортируется напрямую через tsx (см. costEstimate.test.mjs) —
// формулировки не дублируются, тест читает те же строки, что видит человек.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  resolveReportJurisdiction,
  riskLede,
  lawCallout,
  riskRows,
  statementState,
  LEGAL_SCOPE_NOTE,
} from './reportRisk.ts'

const base = { countryCode: null, countrySource: null, findings: [] }
const finding = (extra = {}) => ({ ruleId: 'image-alt', wcag: [], impact: 'critical', selector: 'img', page: '/', ...extra })

test('юрисдикция с находки (воркер уже применил режим) — самый сильный источник', () => {
  const j = resolveReportJurisdiction({
    ...base,
    countryCode: 'US',
    countrySource: 'tld',
    findings: [finding(), finding({ ruleId: 'a11y-statement-missing', jurisdictionCountry: 'DE' })],
  })
  assert.equal(j?.code, 'DE')
  assert.equal(j?.law, 'BFSG')
})

test('страна сайта берётся, только если источник — не unknown и страна в наших 13', () => {
  assert.equal(resolveReportJurisdiction({ ...base, countryCode: 'IT', countrySource: 'schema-org' })?.code, 'IT')
  assert.equal(resolveReportJurisdiction({ ...base, countryCode: 'IT', countrySource: 'unknown' }), null)
  // США в каталоге есть, юрисдикции у нас нет — закон не сверяли, молчим.
  assert.equal(resolveReportJurisdiction({ ...base, countryCode: 'US', countrySource: 'tld' }), null)
  assert.equal(resolveReportJurisdiction({ ...base, countryCode: null, countrySource: 'unknown' }), null)
})

test('без юрисдикции нет ни плашки, ни единого упоминания EAA/закона', () => {
  const j = resolveReportJurisdiction({ ...base, countrySource: 'unknown' })
  assert.equal(lawCallout(j), null)
  const lede = riskLede(j)
  assert.match(lede, /regardless of jurisdiction/)
  assert.doesNotMatch(lede, /EAA|European Accessibility Act|BFSG|2019\/882|28 June/)
})

test('DE verified называет закон, срок EAA и национальный надзор', () => {
  const c = lawCallout(resolveReportJurisdiction({ ...base, countryCode: 'DE', countrySource: 'tld' }))
  assert.equal(c?.title, 'BFSG / EN 301 549 applies.')
  assert.match(c.body, /has applied since 28 June 2025/)
  assert.doesNotMatch(c.body, /indicative/)
})

// D-154: FR/NL/IT/ES сверены с первоисточниками → verified. Пример «ещё не
// сверено» переехал на Ирландию (IE остаётся verified:false — «остальные»).
test('не-verified страна ЕС (IE) получает оговорку «not verified»', () => {
  const c = lawCallout(resolveReportJurisdiction({ ...base, countryCode: 'IE', countrySource: 'tld' }))
  assert.match(c.title, /European Accessibility Act applies in Ireland/)
  assert.match(c.body, /indicative — not verified against primary law/)
})

// D-154: verified-страна называет закон в DE-формате, БЕЗ оговорки «indicative».
test('verified страна ЕС (FR после D-154) называет закон без оговорки', () => {
  const c = lawCallout(resolveReportJurisdiction({ ...base, countryCode: 'FR', countrySource: 'tld' }))
  assert.equal(c?.title, 'Code de la consommation art. L412-13 (ord. 2023-859) / EN 301 549 applies.')
  assert.match(c.body, /has applied since 28 June 2025/)
  assert.doesNotMatch(c.body, /indicative/)
})

test('Норвегия (ЕЭЗ, не ЕС) не получает срок EAA', () => {
  const c = lawCallout(resolveReportJurisdiction({ ...base, countryCode: 'NO', countrySource: 'tld' }))
  assert.match(c.body, /not an EU member/)
  assert.doesNotMatch(c.body, /28 June 2025/)
})

test('ни в одной ветке нет суммы штрафа (D-035)', () => {
  const money = /(?:€|EUR)\s?\d/
  const fine = /\bfine|penalt/i
  for (const code of ['DE', 'FR', 'NO', 'IT']) {
    const c = lawCallout(resolveReportJurisdiction({ ...base, countryCode: code, countrySource: 'tld' }))
    assert.ok(!(money.test(c.title + c.body) && fine.test(c.title + c.body)), `сумма рядом со штрафом для ${code}`)
  }
  // Оговорка про микропредприятия содержит порог €2M — это не санкция, а
  // основание освобождения; проверяем, что слова про штраф рядом с ним нет.
  assert.doesNotMatch(LEGAL_SCOPE_NOTE, /€2M[^.]*\b(fine|penalty)\b/i)
})

test('строка про заявление — только когда находка реально есть', () => {
  assert.equal(statementState([finding()]), null)
  assert.equal(statementState([finding({ ruleId: 'a11y-statement-missing' })]), 'missing')
  assert.equal(statementState([finding({ ruleId: 'a11y-statement-incomplete' })]), 'incomplete')

  const withoutStatement = riskRows({ criticalRules: 2, statement: null, jurisdictionLabel: 'Germany' })
  assert.equal(withoutStatement.length, 2)
  assert.ok(!withoutStatement.some((r) => /accessibility statement/.test(r)))
})

test('«separately enforceable» звучит только при известной юрисдикции', () => {
  const known = riskRows({ criticalRules: 0, statement: 'missing', jurisdictionLabel: 'Germany' })
  assert.match(known[0], /in Germany that is a separately enforceable requirement/)
  const unknown = riskRows({ criticalRules: 0, statement: 'missing', jurisdictionLabel: null })
  assert.match(unknown[0], /No accessibility statement found on the pages we scanned/)
  assert.ok(!unknown.some((r) => /enforceable/.test(r)))
})

test('строка про critical исчезает при нуле и согласована по числу', () => {
  assert.ok(!riskRows({ criticalRules: 0, statement: null, jurisdictionLabel: null })[0].startsWith('0'))
  assert.match(riskRows({ criticalRules: 1, statement: null, jurisdictionLabel: null })[0], /^1 critical issue —/)
  assert.match(riskRows({ criticalRules: 3, statement: null, jurisdictionLabel: null })[0], /^3 critical issues —/)
})

test('маркетинговая строка одна и без цифр (никаких выдуманных сроков)', () => {
  const rows = riskRows({ criticalRules: 2, statement: 'missing', jurisdictionLabel: 'Germany' })
  const last = rows[rows.length - 1]
  assert.match(last, /Every week this stays unfixed/)
  assert.doesNotMatch(last, /\d/)
})
