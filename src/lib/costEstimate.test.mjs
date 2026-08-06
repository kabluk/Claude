// Калибровка оценки стоимости (D-046) — тест существует ровно затем, чтобы
// расширение сканера больше не двигало смету МОЛЧА.
//
// Что случилось: пороги pickBand (2/5/10) выставлялись, когда сканер отдавал
// только правила axe-core. К D-039 добавилось 15 собственных типов находок,
// 9 из них serious/critical; каждая поднимает effortScore. Тот же сайт, который
// раньше оценивался в «€10k–30k», стал получать «€30k+» — цифра росла от нашей
// добросовестности, а не от состояния сайта. Ни один тест этого не заметил,
// потому что тестов на калибровку не было вовсе: проверялась арифметика, но не
// то, КУДА попадает реалистичный сайт.
//
// Поэтому здесь фиксируются не формулы, а ИСХОДЫ на наборах находок, похожих на
// реальные. Если следующее правило снова сдвинет типовой сайт на бэнд вверх —
// упадёт этот тест, а не пользователь увидит цифру страшнее.
//
// Модуль импортируется НАПРЯМУЮ (через tsx) — формула нигде не дублируется.
// Ради этого в scanner.ts понадобился `import.meta.env?.` вместо `.`: без
// optional chaining модуль вообще не грузится вне Vite, из-за чего оценка
// стоимости и оставалась без тестов.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { estimateCost, effortScore } from './costEstimate.ts'

const f = (ruleId, impact) => ({ ruleId, impact, wcag: [], selector: 'x', page: 'p' })

// Реалистичные наборы. Числа взяты не с потолка: «типовой сайт» — это порядок
// находок, который axe-core даёт на обычном коммерческом сайте (6 различных
// правил, из них 2 серьёзных), плюс то, что теперь добавляет наш сканер.
const AXE_TYPICAL = [
  f('color-contrast', 'serious'),
  f('image-alt', 'critical'),
  f('link-name', 'moderate'),
  f('region', 'moderate'),
  f('landmark-one-main', 'moderate'),
  f('html-has-lang', 'moderate'),
]
const OUR_DOC_FINDINGS = [
  f('a11y-statement-missing', 'critical'),
  f('a11y-feedback-missing', 'serious'),
  f('a11y-pdf-present', 'moderate'),
]
const OUR_ENGINEERING_FINDINGS = [
  f('a11y-reflow-320', 'serious'),
  f('a11y-focus-invisible', 'serious'),
]

test('документные находки не влияют на смету — их стоимость не растёт с размером сайта', () => {
  const withoutDocs = effortScore(AXE_TYPICAL)
  const withDocs = effortScore([...AXE_TYPICAL, ...OUR_DOC_FINDINGS])
  assert.equal(withDocs, withoutDocs, 'заявление/обратная связь/PDF не должны удорожать смету')
})

test('scan-meta пометки не влияют на смету — это качество скана, не дефект сайта', () => {
  const base = effortScore(AXE_TYPICAL)
  const withMeta = effortScore([...AXE_TYPICAL, f('scan-meta-cookie-banner-dismissed', 'minor')])
  assert.equal(withMeta, base)
})

// РЕГРЕССИЯ на саму находку D-046, и одновременно определение того, что здесь
// считается «правильной калибровкой»: тот же сайт должен попадать в ТОТ ЖЕ бэнд,
// что и до расширения сканера. До него он давал 6 axe-правил / 2 серьёзных =
// score 10 → premium (по прежним порогам 2/5/10). Сейчас те же дефекты плюс наши
// инженерные находки дают score 16 → premium по новым порогам 4/12/24. Цель не
// «сделать дешевле», а «не сделать дороже без причины».
//
// Первая версия этого теста ожидала mid и упала — ошибка была в ожидании, не в
// коде: сайт с восемью различными нарушениями и четырьмя серьёзными не должен
// оцениваться как мелкая правка. Ожидание приведено к проверенному эталону, а не
// подогнано под вывод: эквивалентность «до/после» посчитана отдельно.
test('типовой сайт остаётся в том же бэнде, что и до расширения сканера (не уезжает в enterprise)', () => {
  const all = [...AXE_TYPICAL, ...OUR_DOC_FINDINGS, ...OUR_ENGINEERING_FINDINGS]
  const est = estimateCost(all)
  assert.notEqual(est.band, 'enterprise', 'типовой сайт не должен получать «€30k+»')
  assert.equal(est.band, 'premium', `ожидали premium (как и до D-030), получили ${est.band}`)

})

// Граница между «регрессия» и «правильное поведение» — здесь. Вторая версия
// предыдущего теста требовала, чтобы бэнд НЕ менялся от наших находок вообще, и
// это было неверно по существу: reflow на 320px и невидимый фокус — настоящие
// дефекты, требующие настоящей работы, и смета от них обязана расти. Расти она
// не должна только от ДОКУМЕНТНЫХ находок (это проверяет первый тест).
test('инженерные находки поднимают бэнд — это работа, а не бумажка', () => {
  const axeOnly = estimateCost(AXE_TYPICAL)
  const withEngineering = estimateCost([...AXE_TYPICAL, ...OUR_ENGINEERING_FINDINGS])
  assert.equal(axeOnly.band, 'mid')
  assert.equal(withEngineering.band, 'premium')
})

test('чистый сайт не оценивается вовсе, а не «budget по умолчанию»', () => {
  assert.equal(estimateCost([]), null)
})

test('сайт с единственной мелкой находкой попадает в budget', () => {
  const est = estimateCost([f('region', 'moderate')])
  assert.equal(est.band, 'budget')
})

// Верхние бэнды у нас НЕ подтверждены ни одной опубликованной ценой (D-046):
// из 17 найденных цен максимум ~€12k. Тест не запрещает enterprise, но требует,
// чтобы туда попадал действительно тяжёлый случай, а не обычный сайт.
test('enterprise достижим только на действительно большом наборе дефектов', () => {
  const many = Array.from({ length: 14 }, (_, i) => f(`rule-${i}`, i % 2 ? 'serious' : 'moderate'))
  const est = estimateCost(many)
  assert.equal(est.band, 'enterprise')
})
