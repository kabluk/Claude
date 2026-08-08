// CN-COMPONENTS (§22, D-068): гейт согласованности библиотеки компонентов.
// Как page-lists.test.mjs и wcag-pages.test.mjs — читает РЕАЛЬНЫЕ файлы и
// требует, чтобы данные, реализация и постоянные проверки не разъезжались:
//
//  - каждый компонент в data/a11y/components.json структурно валиден;
//  - каждый ГОТОВЫЙ (status: 'ready') несёт полный набор по §22 (клавиатура,
//    скринридер, ARIA, ошибки) и имеет реальный файл-реализацию;
//  - каждый готовый компонент попадает в постоянный axe-аудит
//    (scripts/audit-own-a11y.mjs) — иначе живой пример «проходит» лишь потому,
//    что его никто не проверяет;
//  - открытое состояние модалки аудитируется отдельно (INTERACT), а не только
//    в статике.
//
// Порог осмысленности (R1, thin-content): страницу-заглушку под ещё не готовый
// компонент заводить нельзя — planned-записи не имеют impl и страницы.

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => readFileSync(join(ROOT, p), 'utf8')

const data = JSON.parse(read('data/a11y/components.json'))
const components = data.components
const ready = components.filter((c) => c.status === 'ready')
const planned = components.filter((c) => c.status === 'planned')

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

test('components.json is structurally valid', () => {
  assert.ok(Array.isArray(components) && components.length >= 13, `ожидалось ≥13 компонентов, найдено ${components?.length}`)
  const slugs = new Set()
  for (const c of components) {
    assert.ok(KEBAB.test(c.slug), `слаг не kebab-case: ${c.slug}`)
    assert.ok(!slugs.has(c.slug), `дублирующийся слаг: ${c.slug}`)
    slugs.add(c.slug)
    assert.ok(c.name && c.pattern && c.summary, `пустое поле у ${c.slug}`)
    assert.ok(['ready', 'planned'].includes(c.status), `неизвестный статус у ${c.slug}: ${c.status}`)
  }
})

test('at least the three fundamental components are ready', () => {
  assert.ok(ready.length >= 3, `готовых компонентов меньше трёх: ${ready.length}`)
})

test('every ready component carries the full §22 set and a real implementation file', () => {
  for (const c of ready) {
    assert.ok(c.impl, `${c.slug}: ready без impl`)
    assert.ok(existsSync(join(ROOT, `src/components/library/${c.impl}.tsx`)), `${c.slug}: нет файла реализации src/components/library/${c.impl}.tsx`)
    assert.ok(Array.isArray(c.keyboard) && c.keyboard.length >= 1, `${c.slug}: пустая keyboard`)
    for (const k of c.keyboard) assert.ok(k.keys && k.does, `${c.slug}: строка keyboard без keys/does`)
    assert.ok(Array.isArray(c.screenReader) && c.screenReader.length >= 1, `${c.slug}: пустой screenReader`)
    assert.ok(Array.isArray(c.ariaNotes) && c.ariaNotes.length >= 1, `${c.slug}: пустые ariaNotes`)
    assert.ok(Array.isArray(c.pitfalls) && c.pitfalls.length >= 1, `${c.slug}: пустые pitfalls`)
    for (const p of c.pitfalls) assert.ok(p.bad && p.good, `${c.slug}: pitfall без bad/good`)
  }
})

test('planned components stay honest placeholders — no impl, no page', () => {
  for (const c of planned) {
    assert.ok(!c.impl, `${c.slug}: planned, но имеет impl (страница-заглушка запрещена, R1)`)
  }
})

test('the sitemap is generated from components.json, not a hand list', () => {
  assert.ok(read('scripts/gen-a11y-sitemap.mjs').includes('components.json'), 'gen-a11y-sitemap.mjs не читает components.json')
})

test('every ready component page is in the permanent a11y audit — no live example escapes the gate', () => {
  const audit = read('scripts/audit-own-a11y.mjs')
  for (const c of ready) {
    assert.ok(audit.includes(`/components/${c.slug}/`), `нет в audit-own-a11y.mjs: /components/${c.slug}/`)
  }
})

test('the modal open state is audited, not just its static (closed) markup', () => {
  const audit = read('scripts/audit-own-a11y.mjs')
  assert.ok(audit.includes("'/components/modal-dialog/':"), 'открытое состояние модалки не подключено к INTERACT в audit-own-a11y.mjs')
})
