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
import { supportedJurisdictions, resolveJurisdiction } from '../../worker/lib/jurisdiction.js'

const dir = path.dirname(fileURLToPath(import.meta.url))
const source = fs.readFileSync(path.join(dir, 'jurisdictions.ts'), 'utf8')

// D-143: у опции теперь пять полей (code/label/law/verified/eaa) и она может быть
// разбита prettier'ом на несколько строк — регулярка идёт по телу объекта, а не
// по одной строке, и порядок полей внутри фиксирован (как в файле).
function uiCodes() {
  return [
    ...source.matchAll(
      /\{\s*code:\s*'([A-Z]{2})',\s*label:\s*'([^']+)',\s*law:\s*'([^']+)',\s*verified:\s*(true|false),\s*eaa:\s*(true|false),?\s*\}/g,
    ),
  ].map((m) => ({ code: m[1], label: m[2], law: m[3], verified: m[4] === 'true', eaa: m[5] === 'true' }))
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

// D-143: карточка «What's at risk» на /report/:id НАЗЫВАЕТ закон юрисдикции.
// Название берётся из этого зеркала, значит расхождение с воркером = мы называем
// пользователю не тот акт. Сверяем и `law`, и `verified` — второе решает, скажем
// ли мы «применяется» или «основание указано ориентировочно, не сверено с
// первоисточником» (D-034: FR/NL названы законами ПУБЛИЧНОГО сектора, поэтому
// verified:false там — не формальность).
test('law names mirror the worker exactly (the report card names this law to the user)', () => {
  const workerLaw = new Map(supportedJurisdictions().map((j) => [j.country, j.law]))
  for (const { code, law } of uiCodes()) {
    assert.equal(law, workerLaw.get(code), `law text for ${code} drifted from worker/lib/jurisdiction.js`)
  }
})

test('verified flag mirrors the worker exactly', () => {
  for (const { code, verified } of uiCodes()) {
    // resolveJurisdiction отдаёт полную запись юрисдикции по явному коду страны
    // (тот же путь, что user-override на /scan) — читаем `verified` из неё, а не
    // парсим исходник воркера регуляркой.
    const worker = resolveJurisdiction('https://example.com', code)
    assert.equal(verified, worker.verified === true, `verified for ${code} drifted from the worker`)
  }
})

// Change-detector: страна вне EAA — исключение, а не забытое поле. Добавляя
// новую юрисдикцию с eaa:false, автор обязан осознанно продлить этот список
// (иначе мы скажем ей «EAA применяется с 28 июня 2025», чего в её праве нет).
test('Norway is the only non-EAA basis in the mirror (its forskrift predates the EAA)', () => {
  assert.deepEqual(
    uiCodes().filter((j) => !j.eaa).map((j) => j.code),
    ['NO'],
  )
})

test('options are listed alphabetically by label (stable, predictable dropdown order)', () => {
  const labels = uiCodes().map((j) => j.label)
  assert.deepEqual(labels, [...labels].sort((a, b) => a.localeCompare(b, 'en')))
})
