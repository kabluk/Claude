// Сверка ЗЕРКАЛА: src/lib/jurisdictions.ts (список для UI-селектора) против
// настоящего worker/lib/jurisdiction.js — единственного источника правды.
// Воркер нельзя импортировать во фронтенд-сборку (plain ESM, D-010), поэтому
// список продублирован; этот тест ловит расхождение, если в воркер добавят
// юрисдикцию, а в селектор — забудут (или наоборот). Прецедент, зачем это нужно:
// jurisdictionNote существовал в воркере с D-030, но фронтенд про него не знал
// вовсе — фича считалась готовой, а пользователю была невидима.
//
// .ts читаем как текст и вытаскиваем коды регуляркой — гонять tsc ради одного
// массива констант дороже, чем распарсить его; тест упадёт и если формат файла
// изменится так, что коды перестанут находиться.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { supportedJurisdictions } from '../../worker/lib/jurisdiction.js'

const dir = path.dirname(fileURLToPath(import.meta.url))
const source = fs.readFileSync(path.join(dir, 'jurisdictions.ts'), 'utf8')

function uiCodes() {
  return [...source.matchAll(/\{\s*code:\s*'([A-Z]{2})'\s*,\s*label:\s*'([^']+)'\s*\}/g)].map((m) => ({
    code: m[1], label: m[2],
  }))
}

test('the UI jurisdiction list mirrors the worker exactly — no country in one but not the other', () => {
  const ui = uiCodes()
  assert.ok(ui.length > 0, 'regex found no options — jurisdictions.ts format changed, fix this test')
  const uiSet = new Set(ui.map((j) => j.code))
  const workerSet = new Set(supportedJurisdictions().map((j) => j.country))

  const missingInUi = [...workerSet].filter((c) => !uiSet.has(c))
  const extraInUi = [...uiSet].filter((c) => !workerSet.has(c))
  assert.deepEqual(missingInUi, [], 'worker supports these but the selector does not offer them')
  assert.deepEqual(extraInUi, [], 'selector offers these but the worker would ignore them')
})

test('every UI option has a non-empty human label and no duplicate codes', () => {
  const ui = uiCodes()
  assert.equal(new Set(ui.map((j) => j.code)).size, ui.length, 'duplicate country code in the selector')
  for (const { code, label } of ui) assert.ok(label.trim().length > 1, `empty label for ${code}`)
})

test('options are listed alphabetically by label (stable, predictable dropdown order)', () => {
  const labels = uiCodes().map((j) => j.label)
  assert.deepEqual(labels, [...labels].sort((a, b) => a.localeCompare(b, 'en')))
})
