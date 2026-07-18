#!/usr/bin/env tsx
/**
 * UPL (Unauthorized Practice of Law) compliance linter.
 * Reads all src/i18n/**\/*.json files and checks for banned phrase patterns
 * defined in compliance/upl-rules.json.
 * Exits with code 1 if any violations are found.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

interface BannedPattern {
  pattern: string
  reason: string
}

interface UplRules {
  version: string
  banned_patterns: BannedPattern[]
}

interface Violation {
  file: string
  key: string
  phrase: string
  pattern: string
  reason: string
}

function loadRules(): UplRules {
  const rulesPath = path.join(ROOT, 'compliance', 'upl-rules.json')
  const raw = fs.readFileSync(rulesPath, 'utf-8')
  return JSON.parse(raw) as UplRules
}

function collectJsonFiles(dir: string): string[] {
  const results: string[] = []
  if (!fs.existsSync(dir)) return results

  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...collectJsonFiles(full))
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      results.push(full)
    }
  }
  return results
}

function flattenObject(obj: unknown, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {}
  if (typeof obj !== 'object' || obj === null) return result

  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (typeof v === 'string') {
      result[key] = v
    } else if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (typeof item === 'string') {
          result[`${key}[${i}]`] = item
        } else if (typeof item === 'object' && item !== null) {
          Object.assign(result, flattenObject(item, `${key}[${i}]`))
        }
      })
    } else if (typeof v === 'object') {
      Object.assign(result, flattenObject(v, key))
    }
  }
  return result
}

function checkFile(filePath: string, patterns: BannedPattern[]): Violation[] {
  const violations: Violation[] = []
  let raw: string
  try {
    raw = fs.readFileSync(filePath, 'utf-8')
  } catch {
    console.error(`  Could not read: ${filePath}`)
    return violations
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    console.error(`  Invalid JSON: ${filePath}`)
    return violations
  }

  const flat = flattenObject(parsed)
  const relPath = path.relative(ROOT, filePath)

  for (const [key, value] of Object.entries(flat)) {
    const lower = value.toLowerCase()
    for (const { pattern, reason } of patterns) {
      if (lower.includes(pattern.toLowerCase())) {
        violations.push({ file: relPath, key, phrase: value, pattern, reason })
      }
    }
  }

  return violations
}

function main(): void {
  console.log('UPL Compliance Lint\n')

  const rules = loadRules()
  console.log(`Loaded ${rules.banned_patterns.length} banned patterns from compliance/upl-rules.json`)

  const i18nDir = path.join(ROOT, 'src', 'i18n')
  const files = collectJsonFiles(i18nDir)
  console.log(`Scanning ${files.length} i18n JSON files in src/i18n/\n`)

  const allViolations: Violation[] = []

  for (const file of files) {
    const violations = checkFile(file, rules.banned_patterns)
    allViolations.push(...violations)
  }

  if (allViolations.length === 0) {
    console.log('No UPL violations found.')
    process.exit(0)
  }

  console.error(`Found ${allViolations.length} UPL violation(s):\n`)
  for (const v of allViolations) {
    console.error(`  FILE:    ${v.file}`)
    console.error(`  KEY:     ${v.key}`)
    console.error(`  BANNED:  "${v.pattern}"`)
    console.error(`  REASON:  ${v.reason}`)
    console.error(`  VALUE:   "${v.phrase.slice(0, 120)}${v.phrase.length > 120 ? '...' : ''}"`)
    console.error('')
  }

  console.error('Fix violations before building. See compliance/upl-rules.json for safe alternatives.')
  process.exit(1)
}

main()
