#!/usr/bin/env node
// UPL copy-lint — guards the i18n copy against unauthorized-practice-of-law
// (advice-giving) language.
//
//   node scripts/check-upl-copy.mjs
//
// Under B&P §6400(g) a non-attorney service may not give "advice, explanation,
// opinion, or recommendation ... selection of forms". Our copy must stay
// NEUTRAL (facts + navigation, never "we recommend / you should"). This lint
// walks every translated string in src/i18n/translations.js and fails (exit 1)
// with the offending translation key + language if any banned phrase appears.
//
// The dictionaries are per-language and extensible. Neutrality must survive
// translation — when new locales get real content, fill their banned lists.

import { translations } from '../src/i18n/translations.js'

// Banned advice-giving phrases, per language. Matched case-insensitively as
// whole-ish phrases (word-boundary where the script supports it).
const BANNED = {
  en: [
    'we recommend',
    'you should',
    'best option',
    'most people choose',
    'will win',
    'advise you',
    'we suggest',
    'you must choose',
  ],
  ru: [
    'рекомендуем',
    'советуем',
    'следует выбрать',
    'лучший вариант',
    'большинство выбирает',
    'стоит выбрать',
    'вам нужно выбрать',
  ],
  es: [
    'recomendamos',
    'debería elegir',
    'mejor opción',
    'la mayoría elige',
    'le aconsejamos',
    'sugerimos',
  ],
  // Fill with neutrality-checked equivalents when real content lands (see §6).
  vi: [],
  zh: [],
  // Queued locales (P2 §6) — dictionaries prepared, content not yet translated.
  hy: [], // TODO(hy): armenian equivalents — legal-translator neutrality review
  ko: [], // TODO(ko): korean equivalents — legal-translator neutrality review
}

// Walk a translation subtree, yielding [dottedKey, string] for every string.
function* walk(node, prefix = '') {
  if (typeof node === 'string') {
    yield [prefix, node]
    return
  }
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) yield* walk(node[i], `${prefix}[${i}]`)
    return
  }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) yield* walk(v, prefix ? `${prefix}.${k}` : k)
  }
}

const violations = []
for (const [lang, tree] of Object.entries(translations)) {
  const banned = BANNED[lang] || []
  if (!banned.length) continue
  for (const [key, value] of walk(tree)) {
    const hay = value.toLowerCase()
    for (const phrase of banned) {
      if (hay.includes(phrase.toLowerCase())) {
        violations.push({ lang, key, phrase, value })
      }
    }
  }
}

if (violations.length) {
  console.error('\n✖ UPL copy-lint: advice-giving language found\n')
  for (const v of violations) {
    console.error(`  [${v.lang}] ${v.key}`)
    console.error(`      banned phrase: "${v.phrase}"`)
    console.error(`      in: "${v.value}"\n`)
  }
  console.error(
    `Failed: ${violations.length} violation(s). Copy must stay neutral — facts and\n` +
      'navigation only, never advice (B&P §6400(g)). Rewrite the string above.\n',
  )
  process.exit(1)
}

console.log('UPL copy-lint: clean ✓ (no advice-giving language in translations.js)')
