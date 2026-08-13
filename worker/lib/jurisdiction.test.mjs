import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  jurisdictionForUrl, applyJurisdictionWeight, resolveJurisdiction, supportedJurisdictions,
} from './jurisdiction.js'

test('maps real .de sites (bundesregierung.de, manufactum.de) to BFSG, verified with citation', () => {
  for (const url of ['https://www.bundesregierung.de/', 'https://www.manufactum.de/']) {
    const j = jurisdictionForUrl(url)
    assert.equal(j.country, 'DE')
    assert.equal(j.law, 'BFSG')
    assert.equal(j.statementRequired, true)
    assert.equal(j.verified, true)
    assert.match(j.citation, /Anlage 3 zu §14 BFSG/)
  }
})

// D-154: FR verified по первоисточнику (Légifrance) — ссылка теперь на частный
// сектор EAA (Code de la consommation art. L412-13), не на публичный RGAA.
test('maps a .fr site to the private-sector EAA law (Code de la consommation), verified', () => {
  const j = jurisdictionForUrl('https://www.impots.gouv.fr/')
  assert.equal(j.country, 'FR')
  assert.match(j.law, /L412-13/)
  assert.doesNotMatch(j.law, /RGAA/) // RGAA — публичный сектор, больше не наша ссылка
  assert.equal(j.statementRequired, true)
  assert.equal(j.verified, true)
})

// D-154: топ-5 рынков сверены с первоисточниками — FR/NL/IT/ES → verified:true
// (частный сектор EAA подтверждён), PL — ссылка исправлена, но verified:false
// (тело закона не прочитано из первоисточника). Сумм штрафов по-прежнему нет.
test('D-154 top-5: FR/NL/IT/ES verified private-sector; PL corrected but still unverified; no fine figures', () => {
  for (const [url, code] of [['https://x.fr/', 'FR'], ['https://x.nl/', 'NL'], ['https://x.it/', 'IT'], ['https://x.es/', 'ES']]) {
    const j = jurisdictionForUrl(url)
    assert.equal(j.country, code, url)
    assert.equal(j.verified, true, `${code} should be verified after D-154`)
    assert.doesNotMatch(JSON.stringify(j), /€|\bEUR\b|\beuros?\b/i)
  }
  const pl = jurisdictionForUrl('https://x.pl/')
  assert.match(pl.law, /Dz\.U\. 2024 poz\. 731/)
  assert.equal(pl.verified, false)
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
// D-154: IT переведён в verified (см. отдельный тест выше). Здесь — «остальные»,
// ещё ждущие сверки первоисточника на частный сектор: IE/AT/BE/SE/DK/FI/NO.
test('the still-unverified EAA jurisdictions (IE/AT/BE/SE/DK/FI/NO) require a statement but stay unverified (no fine figure)', () => {
  const cases = [
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
  assert.match(out[0].jurisdictionNote, /Anlage 3 zu §14 BFSG/)
  assert.equal(out[1].impact, 'serious') // не юридически-decisive правило — не трогаем
})

test('applyJurisdictionWeight bumps to critical in a still-unverified jurisdiction too, but omits the fine figure', () => {
  // .ie (Ireland) — ещё unverified после D-154, поэтому note помечен «not verified».
  const jurisdiction = jurisdictionForUrl('https://example.ie/')
  const out = applyJurisdictionWeight([{ ruleId: 'a11y-statement-missing', impact: 'serious' }], jurisdiction)
  assert.equal(out[0].impact, 'critical')
  assert.doesNotMatch(out[0].jurisdictionNote, /€|\bEUR\b|\beuros?\b/i) // никаких сумм в отчёте
  assert.match(out[0].jurisdictionNote, /not verified/)
})

test('applyJurisdictionWeight leaves findings untouched for unmapped jurisdiction (honest no-op, not a guess)', () => {
  const jurisdiction = jurisdictionForUrl('https://example.com/')
  const findings = [{ ruleId: 'a11y-statement-missing', impact: 'serious' }]
  assert.deepEqual(applyJurisdictionWeight(findings, jurisdiction), findings)
})

// D-040 — регрессия на молчаливую поломку главной цепочки продукта.
// Прежний код выходил рано на уже-critical находке, а axe.js отдаёт
// `a11y-statement-missing` именно с impact:'critical'. Итог: у САМОЙ решающей
// находки правового основания не было вовсе. Тест подаёт ту форму, которую
// реально отдаёт прод, а не удобную 'serious'.
test('the already-critical missing statement (the shape axe.js really emits) still gets its legal basis', () => {
  const jurisdiction = jurisdictionForUrl('https://www.bundesregierung.de/')
  const out = applyJurisdictionWeight([{ ruleId: 'a11y-statement-missing', impact: 'critical' }], jurisdiction)
  assert.equal(out[0].impact, 'critical')
  assert.match(out[0].jurisdictionNote, /Anlage 3 zu §14 BFSG/)
  assert.equal(out[0].jurisdictionCountry, 'DE')
})

// Анти-drift: тест выше опирается на то, что axe.js действительно отдаёт эту
// находку как 'critical'. Проверяем это по РЕАЛЬНОМУ исходнику модуля, а не по
// памяти — иначе фикстура снова разойдётся с продом и пропустит ту же ошибку.
test('axe.js really emits a11y-statement-missing as critical (guards the fixture above)', async () => {
  const { readFileSync } = await import('node:fs')
  const src = readFileSync(new URL('./axe.js', import.meta.url), 'utf8')
  const m = src.match(/ruleId:\s*'a11y-statement-missing'[^}]*?impact:\s*'(\w+)'/s)
  assert.ok(m, 'a11y-statement-missing emission not found in axe.js')
  assert.equal(m[1], 'critical')
})

test('jurisdictionCountry is set for every weighted finding, so the UI never parses the note text', () => {
  const out = applyJurisdictionWeight(
    [{ ruleId: 'a11y-statement-incomplete', impact: 'serious' }, { ruleId: 'color-contrast', impact: 'serious' }],
    jurisdictionForUrl('https://www.impots.gouv.fr/'),
  )
  assert.equal(out[0].jurisdictionCountry, 'FR')
  assert.equal(out[1].jurisdictionCountry, undefined) // не decisive — поля нет вовсе
})

// --- resolveJurisdiction: явный выбор страны пользователем (D-032) ---------

test('user override wins over TLD — the .com case TLD inference cannot solve at all', () => {
  const j = resolveJurisdiction('https://example.com/', 'DE')
  assert.equal(j.country, 'DE')
  assert.equal(j.source, 'user-override')
  assert.equal(j.statementRequired, true)
  // без override тот же URL не определяется вовсе — ровно та дыра, что override закрывает
  assert.equal(jurisdictionForUrl('https://example.com/').country, 'unknown')
})

test('user override wins even when the TLD maps to a different country', () => {
  const j = resolveJurisdiction('https://example.de/', 'FR')
  assert.equal(j.country, 'FR')
  assert.equal(j.source, 'user-override')
})

test('override is case- and whitespace-insensitive (a select value, not a strict contract)', () => {
  for (const raw of ['de', ' DE ', 'De']) {
    assert.equal(resolveJurisdiction('https://example.com/', raw).country, 'DE')
  }
})

test('unknown/empty/non-string override silently falls back to TLD instead of failing the scan', () => {
  for (const bad of ['ZZ', '', '   ', null, undefined, 42, {}]) {
    const j = resolveJurisdiction('https://example.de/', bad)
    assert.equal(j.country, 'DE', String(bad))
    assert.equal(j.source, 'tld')
  }
  assert.equal(resolveJurisdiction('https://example.com/', 'ZZ').country, 'unknown')
})

test('supportedJurisdictions lists every mapped country exactly once, each with a law', () => {
  const list = supportedJurisdictions()
  assert.equal(list.length, 13)
  assert.equal(new Set(list.map((j) => j.country)).size, 13)
  for (const j of list) assert.ok(j.law && j.law.length > 0, j.country)
  // каждая страна из списка реально резолвится как override
  for (const j of list) assert.equal(resolveJurisdiction('https://example.com/', j.country).country, j.country)
})

// D-035: суммы штрафов удалены отовсюду — проверка того, что они не вернутся
// незаметно при следующем добавлении юрисдикции. Причины в шапке jurisdiction.js.
test('no jurisdiction carries a fine amount — the report never shows a figure', () => {
  for (const { country } of supportedJurisdictions()) {
    const j = resolveJurisdiction('https://example.com/', country)
    for (const [key, value] of Object.entries(j)) {
      assert.ok(!/fine|penalty|amount|max.*eur/i.test(key), `${country}: поле ${key} похоже на сумму штрафа`)
      if (typeof value === 'number') assert.fail(`${country}: числовое поле ${key}=${value} — не сумма ли это?`)
    }
  }
})

test('jurisdictionNote never contains a money figure, in any jurisdiction', () => {
  for (const { country } of supportedJurisdictions()) {
    const j = resolveJurisdiction('https://example.com/', country)
    const [out] = applyJurisdictionWeight([{ ruleId: 'a11y-statement-missing', impact: 'serious' }], j)
    // Номера и годы в названиях законов ("RD 1112/2018", "D.Lgs. 82/2022",
    // "Lag (2023:254)") легитимны и НЕ должны считаться суммой — поэтому ищем
    // именно деньги: валютный маркер, либо группу цифр с разделителем тысяч
    // (100 000 / 100.000 / 100,000), а не любой длинный числовой ряд.
    assert.doesNotMatch(out.jurisdictionNote, /€|\bEUR\b|\beuros?\b|\d[\u00a0 .,]\d{3}\b/i,
      `${country}: сумма просочилась в отчёт — "${out.jurisdictionNote}"`)
  }
})
