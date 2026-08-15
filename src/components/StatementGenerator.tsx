// G-CHECKER-STATEMENT-GEN (D-181): форма генератора заявления о доступности.
// Вся текстовая логика — в src/lib/statementGenerator.ts (чистая,
// оттестирована отдельно, включая различие compliant/conformant из D-170).
// Здесь только UI и состояние.
//
// Дисциплина доступности (инструмент ПРО доступность обязан быть образцовым,
// тот же стандарт, что у остальных чекеров):
//  - каждое поле связано с настоящим <label> (не placeholder-в-роли-лейбла);
//  - ошибки валидации — role="alert", привязаны через aria-describedby;
//  - готовый текст живёт в <output> с aria-live="polite": скринридер узнаёт,
//    что документ пересобрался, без перевода фокуса;
//  - кнопка копирования сообщает результат текстом, а не только цветом.
//
// Дисциплина SSG-гидрации: начальное состояние детерминированное
// (emptyStatementInput), browser-only API (clipboard) трогаем только в
// обработчике клика, не в теле рендера — тот же урок, что в ContrastChecker.

import { cloneElement, isValidElement, useId, useMemo, useState, type ReactElement } from 'react'
import {
  STANDARD_LABELS,
  buildStatement,
  buildStatementHtml,
  emptyStatementInput,
  validateStatement,
  type ConformanceLevel,
  type StatementInput,
  type StatementStandard,
} from '@/lib/statementGenerator'

type Format = 'text' | 'html'

export function StatementGenerator() {
  const [values, setValues] = useState<StatementInput>(emptyStatementInput)
  const [showErrors, setShowErrors] = useState(false)
  const [format, setFormat] = useState<Format>('text')
  const [copied, setCopied] = useState(false)
  const formId = useId()

  const errors = validateStatement(values)
  const hasErrors = Object.keys(errors).length > 0

  // Документ пересобирается на каждый ввод — он и есть «результат», а не
  // награда за нажатие кнопки. Валидация при этом не блокирует показ:
  // незаполненные поля видны как [placeholder], что честнее пустого экрана
  // и сразу показывает, чего не хватает.
  const output = useMemo(
    () => (format === 'html' ? buildStatementHtml(values) : buildStatement(values)),
    [values, format],
  )

  function set<K extends keyof StatementInput>(key: K, value: StatementInput[K]) {
    setValues((v) => ({ ...v, [key]: value }))
    setCopied(false)
  }

  async function copy() {
    setShowErrors(true)
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  const err = (key: keyof typeof errors) => (showErrors ? errors[key] : undefined)

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-2">
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()} noValidate>
        <Field
          id={`${formId}-org`}
          label="Organisation name"
          hint="The statement is made on this organisation's behalf."
          error={err('orgName')}
          required
        >
          <input
            className="input mt-1.5 block w-full"
            value={values.orgName}
            onChange={(e) => set('orgName', e.target.value)}
            autoComplete="organization"
          />
        </Field>

        <Field
          id={`${formId}-site`}
          label="Site or app name"
          hint="What this statement covers — e.g. example.com or the Acme mobile app."
          error={err('siteName')}
          required
        >
          <input
            className="input mt-1.5 block w-full"
            value={values.siteName}
            onChange={(e) => set('siteName', e.target.value)}
          />
        </Field>

        <Field
          id={`${formId}-standard`}
          label="Standard you are targeting"
          hint="Name the standard you actually test against. EU-scope statements use EN 301 549 and its “compliant” wording; WCAG-only statements use “conformant”."
        >
          <select
            className="input mt-1.5 block w-full"
            value={values.standard}
            onChange={(e) => set('standard', e.target.value as StatementStandard)}
          >
            {(Object.keys(STANDARD_LABELS) as StatementStandard[]).map((s) => (
              <option key={s} value={s}>
                {STANDARD_LABELS[s]}
              </option>
            ))}
          </select>
        </Field>

        <Field
          id={`${formId}-conformance`}
          label="Current status"
          hint="Describe the real, current state. Publishing “fully” when you know of open issues is the fastest way to lose credibility with both users and regulators."
        >
          <select
            className="input mt-1.5 block w-full"
            value={values.conformance}
            onChange={(e) => set('conformance', e.target.value as ConformanceLevel)}
          >
            <option value="full">Fully — no known issues</option>
            <option value="partial">Partially — some known issues remain</option>
            <option value="none">Not yet — the standard is not met</option>
          </select>
        </Field>

        <Field
          id={`${formId}-basis`}
          label="How was this assessed?"
          hint="Both are valid; saying which one is what makes the claim checkable."
        >
          <select
            className="input mt-1.5 block w-full"
            value={values.basis}
            onChange={(e) => set('basis', e.target.value as StatementInput['basis'])}
          >
            <option value="self">Self-assessment</option>
            <option value="audit">Third-party audit</option>
          </select>
        </Field>

        {values.basis === 'audit' && (
          <Field id={`${formId}-auditor`} label="Auditor name" error={err('auditorName')} required>
            <input
              className="input mt-1.5 block w-full"
              value={values.auditorName}
              onChange={(e) => set('auditorName', e.target.value)}
            />
          </Field>
        )}

        <Field id={`${formId}-assessed`} label="Assessment date">
          <input
            type="date"
            className="input mt-1.5 block w-full"
            value={values.assessmentDate}
            onChange={(e) => set('assessmentDate', e.target.value)}
          />
        </Field>

        <Field
          id={`${formId}-limitations`}
          label="Known limitations (one per line)"
          hint="Plain language, not criterion numbers — “older PDFs are not tagged” beats “fails SC 1.3.1”. Leave empty and the section is omitted rather than published empty."
        >
          <textarea
            className="input-area mt-1.5 block w-full"
            rows={4}
            value={values.limitations}
            onChange={(e) => set('limitations', e.target.value)}
          />
        </Field>

        <Field
          id={`${formId}-email`}
          label="Feedback email"
          hint="A working channel is a required element of a statement — both in W3C WAI guidance and the EU model."
          error={err('email')}
          required
        >
          <input
            type="email"
            className="input mt-1.5 block w-full"
            value={values.email}
            onChange={(e) => set('email', e.target.value)}
          />
        </Field>

        <Field id={`${formId}-phone`} label="Feedback phone (optional)">
          <input
            type="tel"
            className="input mt-1.5 block w-full"
            value={values.phone}
            onChange={(e) => set('phone', e.target.value)}
          />
        </Field>

        <Field id={`${formId}-days`} label="Response time (business days)">
          <input
            type="number"
            min="1"
            className="input mt-1.5 block w-full"
            value={values.responseDays}
            onChange={(e) => set('responseDays', e.target.value)}
          />
        </Field>

        <Field id={`${formId}-tech`} label="Technologies the site relies on">
          <input
            className="input mt-1.5 block w-full"
            value={values.technologies}
            onChange={(e) => set('technologies', e.target.value)}
          />
        </Field>

        <Field
          id={`${formId}-tested`}
          label="Tested with (optional)"
          hint="Browser and assistive-technology combinations, e.g. “NVDA 2025.1 with Firefox”."
        >
          <input
            className="input mt-1.5 block w-full"
            value={values.testedWith}
            onChange={(e) => set('testedWith', e.target.value)}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id={`${formId}-prepared`} label="Prepared on">
            <input
              type="date"
              className="input mt-1.5 block w-full"
              value={values.preparedDate}
              onChange={(e) => set('preparedDate', e.target.value)}
            />
          </Field>
          <Field id={`${formId}-reviewed`} label="Last reviewed on">
            <input
              type="date"
              className="input mt-1.5 block w-full"
              value={values.reviewedDate}
              onChange={(e) => set('reviewedDate', e.target.value)}
            />
          </Field>
        </div>
      </form>

      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="h2 mt-0 mb-0">Your statement</h2>
          <div className="flex gap-2" role="group" aria-label="Output format">
            {(['text', 'html'] as Format[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => {
                  setFormat(f)
                  setCopied(false)
                }}
                aria-pressed={format === f}
                className={`chip ${format === f ? 'chip-accent' : ''}`}
              >
                {f === 'text' ? 'Plain text' : 'HTML'}
              </button>
            ))}
          </div>
        </div>

        {showErrors && hasErrors && (
          <p role="alert" className="mt-3 text-sm font-medium text-[color:var(--color-critical)]">
            Some required details are still missing — they appear as [placeholders] below. Fill them
            in before publishing.
          </p>
        )}

        {/* tabIndex=0 обязателен: блок прокручиваемый (max-h + overflow-auto),
            а прокрутить его без мыши можно, только если он может получить
            фокус — иначе клавиатурный пользователь физически не доберётся до
            нижней части собственного заявления. Поймано нашим же гейтом
            audit-a11y (scrollable-region-focusable, serious) на первом же
            прогоне этой страницы. Фокусируемому региону нужно и имя, отсюда
            aria-label. */}
        <output
          aria-live="polite"
          aria-label="Generated accessibility statement"
          tabIndex={0}
          className="mt-4 block max-h-[32rem] overflow-auto rounded-xl border border-outline-variant bg-surface-container-low p-4"
        >
          <pre className="whitespace-pre-wrap font-mono text-xs text-on-surface">{output}</pre>
        </output>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" className="btn" onClick={copy}>
            Copy {format === 'html' ? 'HTML' : 'text'}
          </button>
          <span aria-live="polite" className="text-sm text-on-surface-variant">
            {copied ? 'Copied to clipboard.' : ''}
          </span>
        </div>
      </div>
    </div>
  )
}

function Field({
  id,
  label,
  hint,
  error,
  required,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: React.ReactNode
}) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-on-surface-variant">
        {label}
        {required && <span aria-hidden="true"> *</span>}
        {required && <span className="sr-only"> (required)</span>}
      </label>
      {/* id и aria-describedby проставляются на сам контрол клонированием —
          иначе каждый из 13 вызовов дублировал бы эти атрибуты вручную, и
          достаточно забыть один, чтобы поле осталось без программной связи
          с подсказкой и ошибкой. Связь label↔контрол держится на htmlFor/id,
          поэтому id обязателен, а не опционален. */}
      {isValidElement(children)
        ? cloneElement(children as ReactElement<Record<string, unknown>>, {
            id,
            'aria-describedby': describedBy,
            'aria-invalid': error ? true : undefined,
          })
        : children}
      {hint && (
        <p id={hintId} className="mt-1 text-xs text-on-surface-variant">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-sm font-medium text-[color:var(--color-critical)]">
          {error}
        </p>
      )}
    </div>
  )
}
