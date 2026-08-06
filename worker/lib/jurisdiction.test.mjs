import { test } from 'node:test'
import assert from 'node:assert/strict'
import { jurisdictionForUrl, applyJurisdictionWeight } from './jurisdiction.js'

test('maps real .de sites (bundesregierung.de, manufactum.de) to BFSG, verified with citation', () => {
  for (const url of ['https://www.bundesregierung.de/', 'https://www.manufactum.de/']) {
    const j = jurisdictionForUrl(url)
    assert.equal(j.country, 'DE')
    assert.equal(j.law, 'BFSG')
    assert.equal(j.statementRequired, true)
    assert.equal(j.verified, true)
    assert.equal(j.maxFineEUR, 100000)
    assert.match(j.citation, /§37 BFSG/)
  }
})

test('maps a real .fr site (impots.gouv.fr) to RGAA, statement required but NOT verified (no fine figure)', () => {
  const j = jurisdictionForUrl('https://www.impots.gouv.fr/')
  assert.equal(j.country, 'FR')
  assert.equal(j.law, 'RGAA')
  assert.equal(j.statementRequired, true)
  assert.equal(j.verified, false)
  assert.equal(j.maxFineEUR, undefined) // не показываем непроверенную сумму
})

test('unmapped TLD returns honest unknown, does not guess a jurisdiction', () => {
  const j = jurisdictionForUrl('https://example.com/')
  assert.equal(j.country, 'unknown')
  assert.equal(j.statementRequired, null)
})

// 2026-08-06: 8 юрисдикций добавлены под реальные страны в каталоге (agencies.json),
// каждая с законом транспозиции EAA, подтверждённым по официальному правовому порталу
// страны (RIS/Finlex/Lovdata/retsinformation.dk/riksdagen.se/ejustice.just.fgov.be/
// irishstatutebook.ie), не по агрегатору. Все — verified:false (нет проверенной суммы
// штрафа), тот же стандарт, что у FR/ES/NL/PL с самого начала A3-JURISDICTION.
test('new EAA-transposition jurisdictions (IT/IE/AT/BE/SE/DK/FI/NO) require a statement but stay unverified (no fine figure)', () => {
  const cases = [
    ['https://example.it/', 'IT', 'D.Lgs. 82/2022'],
    ['https://example.ie/', 'IE', 'S.I. No. 636/2023'],
    ['https://example.at/', 'AT', 'BaFG'],
    ['https://example.be/', 'BE', 'Loi du 5.11.2023 (2023046827)'],
    ['https://example.se/', 'SE', 'Lag (2023:254)'],
    ['https://example.dk/', 'DK', 'LOV nr 801 af 07/06/2022'],
    ['https://example.fi/', 'FI', 'Laki 306/2019 + asetus 179/2023'],
    ['https://example.no/', 'NO', 'Forskrift om universell utforming av IKT-løsninger'],
  ]
  for (const [url, country, lawFragment] of cases) {
    const j = jurisdictionForUrl(url)
    assert.equal(j.country, country, url)
    assert.match(j.law, new RegExp(lawFragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    assert.equal(j.statementRequired, true)
    assert.equal(j.verified, false)
    assert.equal(j.maxFineEUR, undefined)
  }
})

test('a jurisdiction with a deliberately unsupported TLD (.com, .co.uk, .com.au) stays honest unknown, not a silent guess', () => {
  for (const url of ['https://example.com/', 'https://example.co.uk/', 'https://example.com.au/']) {
    const j = jurisdictionForUrl(url)
    assert.equal(j.country, 'unknown')
    assert.equal(j.statementRequired, null)
  }
})

test('invalid URL does not throw', () => {
  const j = jurisdictionForUrl('not a url')
  assert.equal(j.country, 'unknown')
})

test('applyJurisdictionWeight bumps missing-statement to critical in a verified jurisdiction (DE)', () => {
  const jurisdiction = jurisdictionForUrl('https://www.bundesregierung.de/')
  const findings = [{ ruleId: 'a11y-statement-missing', impact: 'serious' }, { ruleId: 'color-contrast', impact: 'serious' }]
  const out = applyJurisdictionWeight(findings, jurisdiction)
  assert.equal(out[0].impact, 'critical')
  assert.match(out[0].jurisdictionNote, /§37 BFSG/)
  assert.equal(out[1].impact, 'serious') // не юридически-decisive правило — не трогаем
})

test('applyJurisdictionWeight bumps to critical in an unverified jurisdiction too, but omits the fine figure', () => {
  const jurisdiction = jurisdictionForUrl('https://www.impots.gouv.fr/')
  const out = applyJurisdictionWeight([{ ruleId: 'a11y-statement-missing', impact: 'serious' }], jurisdiction)
  assert.equal(out[0].impact, 'critical')
  assert.doesNotMatch(out[0].jurisdictionNote, /€|EUR|\d{4,}/) // никаких непроверенных цифр в отчёте
  assert.match(out[0].jurisdictionNote, /not verified/)
})

test('applyJurisdictionWeight leaves findings untouched for unmapped jurisdiction (honest no-op, not a guess)', () => {
  const jurisdiction = jurisdictionForUrl('https://example.com/')
  const findings = [{ ruleId: 'a11y-statement-missing', impact: 'serious' }]
  assert.deepEqual(applyJurisdictionWeight(findings, jurisdiction), findings)
})

test('applyJurisdictionWeight does not double-bump an already-critical finding (no redundant note overwrite)', () => {
  const jurisdiction = jurisdictionForUrl('https://www.bundesregierung.de/')
  const findings = [{ ruleId: 'a11y-statement-missing', impact: 'critical' }]
  assert.deepEqual(applyJurisdictionWeight(findings, jurisdiction), findings)
})
