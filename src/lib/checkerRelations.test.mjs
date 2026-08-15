// G-CHECKER-INTERLINK (D-179): гейт для relatedCheckersFor(). Импорт из
// checkerRelations.ts, НЕ из checkers.ts: последний тянет `paths` из data.ts
// (JSON-таксономии через Vite-алиасы), которые `tsx --test` не разрешает —
// тот же барьер, что у guides.ts/guideRelations.ts (D-176).
//
// Фикстура повторяет РЕАЛЬНЫЙ реестр CHECKERS на момент узла (6 чекеров,
// 4 colour + 2 text) — включая распределение по темам, потому что именно
// оно определяет порядок выдачи.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { relatedCheckersFor } from './checkerRelations.ts'

const CONTRAST = '/checkers/contrast-checker/'
const READABILITY = '/checkers/readability-checker/'
const BLINDNESS = '/checkers/color-blindness-simulator/'
const CONVERTER = '/checkers/color-converter/'
const TTS = '/checkers/text-to-speech/'
const PALETTE = '/checkers/color-palette-generator/'

const FIXTURE = [
  { href: CONTRAST, title: 'Colour contrast checker', dek: '…', topic: 'colour' },
  { href: READABILITY, title: 'Readability checker', dek: '…', topic: 'text' },
  { href: BLINDNESS, title: 'Colour blindness simulator', dek: '…', topic: 'colour' },
  { href: CONVERTER, title: 'Colour converter', dek: '…', topic: 'colour' },
  { href: TTS, title: 'Text-to-speech reader', dek: '…', topic: 'text' },
  { href: PALETTE, title: 'Colour palette generator', dek: '…', topic: 'colour' },
]

test('чекер никогда не ссылается сам на себя', () => {
  for (const c of FIXTURE) {
    assert.ok(!relatedCheckersFor(FIXTURE, c.href).some((o) => o.href === c.href), c.href)
  }
})

test('каждый чекер получает непустую выдачу — «звезды» больше нет', () => {
  // Прямая проверка дефекта, ради которого узел заведён: раньше
  // contrast-checker не ссылался НИ НА ОДИН другой чекер.
  for (const c of FIXTURE) {
    assert.ok(relatedCheckersFor(FIXTURE, c.href).length > 0, `${c.href} без связей`)
  }
})

test('сначала своя тема, потом остальные', () => {
  // Контраст — colour, в фикстуре ещё 3 colour: лимит 3 покрывается своей
  // темой целиком, текстовые не попадают.
  const forContrast = relatedCheckersFor(FIXTURE, CONTRAST)
  assert.deepEqual(
    forContrast.map((c) => c.href),
    [BLINDNESS, CONVERTER, PALETTE],
  )
  assert.ok(forContrast.every((c) => c.topic === 'colour'))
})

test('когда своей темы не хватает на лимит — добор остальными, в порядке реестра', () => {
  // Читаемость — text, вторая (и единственная) text-пара это TTS.
  // Оставшиеся два места добираются colour-чекерами по порядку реестра.
  const forReadability = relatedCheckersFor(FIXTURE, READABILITY)
  assert.equal(forReadability.length, 3)
  assert.equal(forReadability[0].href, TTS, 'своя тема идёт первой')
  assert.deepEqual(forReadability.slice(1).map((c) => c.href), [CONTRAST, BLINDNESS])
})

test('limit соблюдается', () => {
  assert.equal(relatedCheckersFor(FIXTURE, CONTRAST, 2).length, 2)
  assert.equal(relatedCheckersFor(FIXTURE, CONTRAST, 5).length, 5)
})

test('неизвестный href — отдаём всё остальное, а не пустоту', () => {
  // Страница, которой нет в реестре, не должна остаться совсем без связей
  // (деградация мягкая, не «ничего не показываем»).
  const res = relatedCheckersFor(FIXTURE, '/checkers/not-registered-yet/')
  assert.equal(res.length, 3)
  assert.deepEqual(res.map((c) => c.href), [CONTRAST, READABILITY, BLINDNESS])
})
