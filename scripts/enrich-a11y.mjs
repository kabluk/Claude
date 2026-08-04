#!/usr/bin/env node
// Применение патчей обогащения (data/a11y/enrich/*.json) к agencies.json.
// Правило то же, что у merge-a11y: собранное руками/проверенное не трогаем —
// патч заполняет ТОЛЬКО пустые поля. Доказательные ссылки добавляются в
// sourceRefs (дедуп по url), lastVerified обновляется у затронутых записей.
// Запуск: node scripts/enrich-a11y.mjs [--dry]
//
// Формат патча: [{ slug, hqCity?, founded?, headcountBand?, languages?,
//   services?, standards?, industries?, priceBand?, descriptionEn?,
//   descriptionDe?, descriptionFr?, descriptionPl?, descriptionEs?,
//   evidence?: [{url,label}] }]

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const A11Y = join(ROOT, 'data', 'a11y')
const ENRICH = join(A11Y, 'enrich')
const dry = process.argv.includes('--dry')

const SERVICES = ['audit', 'remediation', 'vpat', 'training', 'monitoring', 'consulting']
const STANDARDS = ['wcag-2-2', 'en-301-549', 'section-508', 'eaa', 'bitv', 'rgaa', 'ada']
const BANDS = ['budget', 'mid', 'premium', 'enterprise']
const HEADS = ['1', '2-10', '11-50', '51-200', '200+']
const DESC_KEYS = { descriptionEn: 'en', descriptionDe: 'de', descriptionFr: 'fr', descriptionPl: 'pl', descriptionEs: 'es' }

const agencies = JSON.parse(readFileSync(join(A11Y, 'agencies.json'), 'utf8'))
const bySlug = new Map(agencies.map((a) => [a.slug, a]))

if (!existsSync(ENRICH)) {
  console.error('Нет data/a11y/enrich/ — нечего применять.')
  process.exit(1)
}

let touched = 0
const stats = { city: 0, desc: 0, fields: 0, evidence: 0, skippedNonEmpty: 0, unknownSlug: 0 }
const notes = []

for (const f of readdirSync(ENRICH).filter((x) => x.endsWith('.json'))) {
  let batch
  try {
    batch = JSON.parse(readFileSync(join(ENRICH, f), 'utf8'))
  } catch (e) {
    notes.push(`  ✗ ${f}: не парсится (${e.message})`)
    continue
  }
  let applied = 0
  for (const p of batch) {
    const a = bySlug.get(p.slug)
    if (!a) {
      stats.unknownSlug++
      notes.push(`  ? ${f}: неизвестный slug "${p.slug}"`)
      continue
    }
    let changed = false
    const fill = (cond, apply) => {
      if (cond) {
        apply()
        changed = true
      } else stats.skippedNonEmpty++
    }

    if (p.hqCity) fill(!a.hq.city, () => { a.hq.city = p.hqCity; stats.city++ })
    if (p.founded) fill(!a.founded, () => { a.founded = p.founded; stats.fields++ })
    if (p.headcountBand && HEADS.includes(p.headcountBand))
      fill(!a.headcountBand, () => { a.headcountBand = p.headcountBand; stats.fields++ })
    if (p.priceBand && BANDS.includes(p.priceBand))
      fill(!a.priceBand, () => { a.priceBand = p.priceBand; stats.fields++ })
    if (Array.isArray(p.languages) && p.languages.length)
      fill(!a.languages?.length, () => { a.languages = p.languages; stats.fields++ })
    if (Array.isArray(p.services)) {
      const valid = p.services.filter((s) => SERVICES.includes(s))
      // услуги/стандарты — объединение (подтверждённые добавляем к имеющимся)
      const merged = [...new Set([...(a.services || []), ...valid])]
      if (merged.length !== (a.services || []).length) { a.services = merged; stats.fields++; changed = true }
    }
    if (Array.isArray(p.standards)) {
      const valid = p.standards.filter((s) => STANDARDS.includes(s))
      const merged = [...new Set([...(a.standards || []), ...valid])]
      if (merged.length !== (a.standards || []).length) { a.standards = merged; stats.fields++; changed = true }
    }
    if (Array.isArray(p.industries) && p.industries.length) {
      const merged = [...new Set([...(a.industries || []), ...p.industries])]
      if (merged.length !== (a.industries || []).length) { a.industries = merged; stats.fields++; changed = true }
    }
    for (const [key, loc] of Object.entries(DESC_KEYS)) {
      const text = p[key]
      if (!text) continue
      const words = String(text).trim().split(/\s+/).length
      if (words < 25 || words > 100) {
        notes.push(`  ? ${p.slug}: ${key} ${words} слов (нужно 40–80±) — пропущено`)
        continue
      }
      fill(!a.description?.[loc], () => {
        a.description = { ...(a.description || {}), [loc]: String(text).trim() }
        stats.desc++
      })
    }
    if (Array.isArray(p.evidence)) {
      const have = new Set((a.sourceRefs || []).map((r) => r.url))
      for (const ev of p.evidence) {
        if (ev?.url && !have.has(ev.url)) {
          a.sourceRefs.push({ url: ev.url, label: ev.label || 'enrichment source' })
          have.add(ev.url)
          stats.evidence++
          changed = true
        }
      }
    }
    if (changed) {
      a.lastVerified = '2026-08-04'
      applied++
      touched++
    }
  }
  notes.push(`  ${f}: затронуто записей ${applied} из ${batch.length}`)
}

console.log(`enrich-a11y${dry ? ' [dry-run]' : ''}: записей изменено ${touched}`)
console.log(`  города +${stats.city} · описания +${stats.desc} · прочие поля +${stats.fields} · источники +${stats.evidence}`)
console.log(`  пропущено (поле уже заполнено): ${stats.skippedNonEmpty} · неизвестных slug: ${stats.unknownSlug}`)
for (const n of notes) console.log(n)
if (!dry && touched > 0) {
  writeFileSync(join(A11Y, 'agencies.json'), JSON.stringify(agencies, null, 2) + '\n')
  console.log('Записано. Дальше: node scripts/build-a11y.mjs')
}
