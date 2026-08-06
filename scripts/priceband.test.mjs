// G-PRICE / D-045: гейт на цены в каталоге.
//
// Зачем отдельно от фикстурных тестов подбора (worker/lib/matchAgenciesServer.test.mjs):
// там проверяется АЛГОРИТМ на выдуманных данных, здесь — сами ДАННЫЕ и поведение
// алгоритма на реальном, частично заполненном каталоге. priceBand заполнен у
// меньшинства профилей и таким останется (большинство агентств цен не публикует),
// поэтому «частичное заполнение» — не временное состояние, а нормальное, и оно
// обязано быть покрыто тестом, а не надеждой.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import agencies from '../data/a11y/agencies.json' with { type: 'json' }
import taxonomies from '../data/a11y/taxonomies.json' with { type: 'json' }
import { matchAgencies } from '../worker/lib/matchAgenciesServer.js'

// Та же регулярка, что в scripts/build-a11y.mjs — сумма рядом с валютой,
// а не слово «price».
const PRICE_QUOTE =
  /(?:€|£|\$|zł|EUR|GBP|USD|PLN|CHF|SEK|DKK|NOK)\s?\d|\d[\d\s.,]*\s?(?:€|£|zł|EUR|GBP|USD|PLN|CHF|SEK|DKK|NOK|euro)/i

const priced = agencies.filter((a) => a.priceBand)

test('priceBand: только значения из taxonomies.priceBands', () => {
  const allowed = Object.keys(taxonomies.priceBands)
  for (const a of priced) assert.ok(allowed.includes(a.priceBand), `${a.slug}: ${a.priceBand}`)
})

test('priceBand: у каждой заполненной цены есть источник с дословной цитатой суммы', () => {
  // Ровно тот инвариант, что и в build-a11y.mjs: band выводится из цитаты,
  // значит цитата обязана лежать рядом. Без него «budget» неотличим от догадки.
  for (const a of priced) {
    const quoted = a.sourceRefs.filter((r) => PRICE_QUOTE.test(r.label || ''))
    assert.ok(quoted.length > 0, `${a.slug}: priceBand без sourceRef с ценой`)
  }
})

test('priceBand: пустое поле остаётся пустым — цену не подставляет ни сборка, ни UI', () => {
  // Страховка от «удобного» дефолта в будущем: отсутствие цены должно быть
  // именно отсутствием (undefined/null), а не 'budget' по умолчанию.
  for (const a of agencies) {
    if (!a.priceBand) assert.ok(a.priceBand === undefined || a.priceBand === null, a.slug)
  }
  assert.ok(priced.length < agencies.length, 'ожидается частичное заполнение, а не 100%')
})

test('подбор под отчёт не ломается там, где цен нет вообще (Германия: 0 из 40)', () => {
  // /report/:id передаёт band из estimateCost. В Германии ни одно агентство цену
  // не публикует — жёсткий фильтр обнулил бы блок. Проверяем на РЕАЛЬНЫХ данных,
  // что этого не происходит ни при одном из четырёх бэндов.
  const de = agencies.filter((a) => a.hq?.countryCode === 'DE' && a.services?.includes('audit'))
  assert.ok(de.length > 0)
  assert.equal(de.filter((a) => a.priceBand).length, 0)
  for (const band of Object.keys(taxonomies.priceBands)) {
    const got = matchAgencies({ countryCode: 'DE', service: 'audit', priceBand: band }, 5)
    assert.equal(got.length, 5, `band=${band} → ${got.length} агентств`)
  }
})

test('подбор под отчёт поднимает наверх совпавший бэнд там, где цены есть (Франция)', () => {
  const mid = matchAgencies({ countryCode: 'FR', service: 'audit', priceBand: 'mid' }, 5)
  assert.equal(mid[0].priceBand, 'mid', `первым ожидалось агентство с mid, получено ${mid[0].slug}`)
  // …но остальные не выкидываются: это тай-брейкер, а не фильтр (D-018).
  assert.ok(mid.some((a) => !a.priceBand), 'в выдаче должны оставаться и агентства без цены')
})
