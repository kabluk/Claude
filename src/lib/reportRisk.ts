// D-143 (карточка «What's at risk» на /report/:id): вся ЧЕСТНОСТЬ этого блока
// живёт здесь, в чистых функциях, а не в JSX — потому что именно на ней блок
// стоит или падает. Карточка говорит пользователю про закон; сказать «EAA
// applies» сайту, про который мы не знаем даже страны, было бы ровно тем
// fear-marketing'ом, против которого написаны D-034/D-035 (R1).
//
// Три правила, каждое проверяется тестом (reportRisk.test.mjs):
//   1. Правовая плашка рисуется ТОЛЬКО когда юрисдикция реально определена
//      сканом и входит в наши 13 (jurisdictions.ts — зеркало воркера). Иначе
//      её нет вовсе, а подводка честно говорит, что закон мы не называем.
//   2. Названия законов НЕ сочиняются: берутся из зеркала, где сверены тестом
//      с worker/lib/jurisdiction.js. Срок EAA («с 28 июня 2025») называется
//      только для стран с eaa:true; для не-verified стран рядом идёт та же
//      оговорка, что уже стоит в jurisdictionNote воркера.
//   3. Сумм штрафов нет ни в одной ветке (D-035) — гейт на это отдельный
//      (scripts/no-fine-amounts.test.mjs), но и здесь их взяться неоткуда.

import { jurisdictionByCode, type JurisdictionOption } from './jurisdictions'
import type { ScanFinding, ScanReport } from './scanner'

export type ReportJurisdiction = JurisdictionOption

// Что скан РЕАЛЬНО знает о стране сайта — два независимых источника, оба из
// воркера, ни один не выдуман фронтендом:
//   • finding.jurisdictionCountry — юрисдикция, по которой воркер уже взвесил
//     находку (worker/lib/jurisdiction.js), самый сильный сигнал: он означает,
//     что правовой режим применён к отчёту, а не угадан здесь;
//   • report.countryCode + countrySource — определение страны сайта
//     (worker/lib/siteCountry.js). Источник 'unknown' (или отсутствующий) — это
//     буквально «не определили», такой стране нельзя приписывать закон.
// countryCode покрывает 19 рынков taxonomies.json, юрисдикций у нас 13 — US/GB
// и прочие честно дают null: закона для них мы не сверяли (см. комментарий
// «GB/US/CA/AU/CH/IN намеренно НЕ включены» в воркере).
export function resolveReportJurisdiction(
  report: Pick<ScanReport, 'countryCode' | 'countrySource' | 'findings'>,
): ReportJurisdiction | null {
  for (const f of report.findings) {
    const fromFinding = jurisdictionByCode(f.jurisdictionCountry)
    if (fromFinding) return fromFinding
  }
  if (report.countrySource && report.countrySource !== 'unknown') {
    const fromSite = jurisdictionByCode(report.countryCode)
    if (fromSite) return fromSite
  }
  return null
}

// Подводка карточки. Ветка без юрисдикции не молчит про пробел, а называет его:
// пользователь должен понимать, ПОЧЕМУ здесь не названо ни одного закона.
export function riskLede(jurisdiction: ReportJurisdiction | null): string {
  if (!jurisdiction) {
    return (
      'This isn’t just a score. We couldn’t determine which country’s rules apply to this site, ' +
      'so we don’t name a law here — the WCAG failures below apply regardless of jurisdiction:'
    )
  }
  return `This isn’t just a score. Here is what these findings mean for a site serving customers in ${jurisdiction.label}:`
}

export type LawCallout = { title: string; body: string }

// Текст правовой плашки. Ни одной формулировки «от себя»: срок и формулировка
// EAA — те же, что в гайдах (data/a11y/guides/european-accessibility-act-guide.md:
// «Directive (EU) 2019/882 has applied since 28 June 2025»), отсутствие единого
// надзора — тот же факт, что уже пишет блок Legal basis у находки (D-033),
// оговорка про несверенное основание — дословно из jurisdictionNote воркера.
export function lawCallout(jurisdiction: ReportJurisdiction | null): LawCallout | null {
  if (!jurisdiction) return null
  const { label, law, verified, eaa } = jurisdiction

  if (!eaa) {
    // Норвегия: не член ЕС. Своя основа старше EAA — срок EAA не называем.
    return {
      title: `Digital accessibility is regulated in ${label}.`,
      body:
        `${label} is not an EU member, but applies equivalent accessibility rules through the EEA agreement, ` +
        `and enforcement runs through national authorities. National basis: ${law} ` +
        `(indicative — not verified against primary law).`,
    }
  }
  if (verified) {
    return {
      title: `${law} / EN 301 549 applies.`,
      body:
        'The European Accessibility Act has applied since 28 June 2025 — covered services provided to ' +
        'consumers must conform now, and enforcement runs through national authorities.',
    }
  }
  return {
    title: `The European Accessibility Act applies in ${label}.`,
    body:
      'Directive (EU) 2019/882 has applied since 28 June 2025 — covered services provided to consumers ' +
      `must conform now, and enforcement runs through national authorities. National basis: ${law} ` +
      '(indicative — not verified against primary law).',
  }
}

// Та же оговорка, что уже стоит под блоком Legal basis у находки (D-034/D-035):
// без неё мы называли бы «обязанностью» то, от чего конкретный бизнес освобождён
// самой директивой. Показывается только вместе с плашкой — без названного закона
// оговаривать нечего.
export const LEGAL_SCOPE_NOTE =
  'Not legal advice. Microenterprises — fewer than 10 staff and no more than €2M turnover — can fall ' +
  'outside the EAA’s service requirements entirely (Article 4(5)), so a small business may be outside ' +
  'this regime. We never quote penalty figures: they depend on circumstances a scan cannot see.'

// Находки «нет заявления о доступности» / «заявление неполное» взаимоисключающи
// (worker/lib/axe.js), поэтому строка максимум одна.
const STATEMENT_RULE_IDS = ['a11y-statement-missing', 'a11y-statement-incomplete'] as const
export type StatementState = 'missing' | 'incomplete' | null

export function statementState(findings: Pick<ScanFinding, 'ruleId'>[]): StatementState {
  const ids = new Set(findings.map((f) => f.ruleId))
  if (ids.has(STATEMENT_RULE_IDS[0])) return 'missing'
  if (ids.has(STATEMENT_RULE_IDS[1])) return 'incomplete'
  return null
}

export type RiskRowsInput = {
  // Число РАЗЛИЧНЫХ правил уровня critical — та же шкала, что «Distinct rules»
  // в hero и что список находок, не вторая метрика (§25).
  criticalRules: number
  statement: StatementState
  // Название страны, если она определена: «separately enforceable» — правовое
  // утверждение, и делать его без юрисдикции нельзя.
  jurisdictionLabel: string | null
}

export function riskRows({ criticalRules, statement, jurisdictionLabel }: RiskRowsInput): string[] {
  const rows: string[] = []
  if (criticalRules > 0) {
    rows.push(
      `${criticalRules} critical issue${criticalRules === 1 ? '' : 's'} — the kind an auditor or a user ` +
        'complaint quotes verbatim',
    )
  }
  if (statement === 'missing') {
    rows.push(
      jurisdictionLabel
        ? `No accessibility statement found — in ${jurisdictionLabel} that is a separately enforceable requirement`
        : 'No accessibility statement found on the pages we scanned',
    )
  }
  if (statement === 'incomplete') {
    rows.push(
      jurisdictionLabel
        ? `Your accessibility statement is incomplete — in ${jurisdictionLabel} the statement itself is a separately enforceable requirement`
        : 'Your accessibility statement is missing details a complete statement is expected to carry',
    )
  }
  // Единственная строка без данных — и без единой цифры: не «через N дней», не
  // сумма, не срок. Утверждение про конкуренцию, а не про право.
  rows.push('Every week this stays unfixed is a week a competitor’s accessible site wins the customer')
  return rows
}
