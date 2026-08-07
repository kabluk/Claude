// RFQ-форма (A2-LEAD-FORM). Клиентская валидация по типу Lead из
// INTERFACES.md §3; НИКАКОГО POST /api/lead — этот узел его не реализует
// (см. A2-LEAD-API). "Preview matches" ниже — не отправка: matchAgencies()
// читает только уже забандленные статические данные каталога (тот же вызов,
// что MatchedAgencies.tsx на отчёте сканера), сетевых запросов не делает.

import { useId, useState } from 'react'
import {
  PRICE_BANDS,
  SERVICES,
  STANDARDS,
  emptyLeadFormValues,
  priceBandLabel,
  serviceLabel,
  standardLabel,
  validateLeadForm,
  type LeadDraft,
  type LeadFormErrors,
  type LeadFormValues,
} from '@/lib/leadForm'
import { matchAgencies, standardForCountry } from '@/lib/matchAgencies'
import { countries } from '@/lib/data'
import { AgencyCard } from './AgencyCard'

type Stage =
  | { kind: 'editing'; touchedStandard: boolean }
  | { kind: 'ready'; draft: LeadDraft }

export function LeadForm({ scanId }: { scanId?: string }) {
  const [values, setValues] = useState<LeadFormValues>(emptyLeadFormValues)
  const [errors, setErrors] = useState<LeadFormErrors>({})
  const [stage, setStage] = useState<Stage>({ kind: 'editing', touchedStandard: false })
  const formId = useId()

  function setField<K extends keyof LeadFormValues>(key: K, value: LeadFormValues[K]) {
    setValues((v) => {
      const next = { ...v, [key]: value }
      // Подсказка стандарта по стране (та же связь country→law, что
      // matchAgencies.ts::standardForCountry) — только пока пользователь сам
      // не тронул поле "standard", иначе молча перезаписывали бы его выбор.
      if (key === 'country' && stage.kind === 'editing' && !stage.touchedStandard) {
        const suggested = standardForCountry(value)
        if (suggested) next.standard = suggested
      }
      return next
    })
    if (key === 'standard' && stage.kind === 'editing') {
      setStage({ kind: 'editing', touchedStandard: true })
    }
    // Пользователь возвращается редактировать форму после превью — не показывать
    // устаревший результат поверх новых значений.
    if (stage.kind === 'ready') {
      setStage({ kind: 'editing', touchedStandard: true })
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = validateLeadForm(values)
    if (!result.valid) {
      setErrors(result.errors)
      return
    }
    setErrors({})
    setStage({ kind: 'ready', draft: { ...result.value, scanId } })
  }

  const matches =
    stage.kind === 'ready'
      ? matchAgencies(
          { countryCode: stage.draft.country, service: stage.draft.service, priceBand: stage.draft.budget },
          5,
        )
      : []

  return (
    <div>
      <form onSubmit={handleSubmit} noValidate className="max-w-xl space-y-4">
        <Field label="Country" htmlFor={`${formId}-country`} error={errors.country}>
          <select
            id={`${formId}-country`}
            required
            value={values.country}
            onChange={(e) => setField('country', e.target.value)}
            aria-invalid={!!errors.country}
            aria-describedby={errors.country ? `${formId}-country-error` : undefined}
            className={selectClass}
          >
            <option value="">Select a country…</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Standard you need to meet" htmlFor={`${formId}-standard`} error={errors.standard}>
          <select
            id={`${formId}-standard`}
            required
            value={values.standard}
            onChange={(e) => setField('standard', e.target.value)}
            aria-invalid={!!errors.standard}
            aria-describedby={errors.standard ? `${formId}-standard-error` : undefined}
            className={selectClass}
          >
            <option value="">Select a standard…</option>
            {STANDARDS.map((s) => (
              <option key={s} value={s}>
                {standardLabel(s)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Service" htmlFor={`${formId}-service`} error={errors.service}>
          <select
            id={`${formId}-service`}
            required
            value={values.service}
            onChange={(e) => setField('service', e.target.value)}
            aria-invalid={!!errors.service}
            aria-describedby={errors.service ? `${formId}-service-error` : undefined}
            className={selectClass}
          >
            <option value="">Select a service…</option>
            {SERVICES.map((s) => (
              <option key={s} value={s}>
                {serviceLabel(s)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Budget" htmlFor={`${formId}-budget`} error={errors.budget}>
          <select
            id={`${formId}-budget`}
            required
            value={values.budget}
            onChange={(e) => setField('budget', e.target.value)}
            aria-invalid={!!errors.budget}
            aria-describedby={errors.budget ? `${formId}-budget-error` : undefined}
            className={selectClass}
          >
            <option value="">Select a budget range…</option>
            {PRICE_BANDS.map((p) => (
              <option key={p} value={p}>
                {priceBandLabel(p)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Deadline (optional)" htmlFor={`${formId}-deadline`} error={errors.deadline}>
          <input
            id={`${formId}-deadline`}
            type="date"
            value={values.deadline}
            onChange={(e) => setField('deadline', e.target.value)}
            aria-invalid={!!errors.deadline}
            aria-describedby={errors.deadline ? `${formId}-deadline-error` : undefined}
            className={selectClass}
          />
        </Field>

        <Field label="Contact email" htmlFor={`${formId}-email`} error={errors.email}>
          <input
            id={`${formId}-email`}
            type="email"
            inputMode="email"
            required
            value={values.email}
            onChange={(e) => setField('email', e.target.value)}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? `${formId}-email-error` : undefined}
            className={selectClass}
          />
        </Field>

        <Field label="Company (optional)" htmlFor={`${formId}-company`}>
          <input
            id={`${formId}-company`}
            type="text"
            value={values.company}
            onChange={(e) => setField('company', e.target.value)}
            className={selectClass}
          />
        </Field>

        <button type="submit" className="btn">
          Preview matching agencies
        </button>
      </form>

      {stage.kind === 'ready' && (
        <section className="mt-8 max-w-2xl" aria-live="polite">
          <h2 className="h2 mt-0">Agencies that would match</h2>
          <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <strong>Not sent yet.</strong> Request routing isn't live on this build — nothing was
            submitted anywhere. This is a preview of who would receive it once the backend
            (<code>POST /api/lead</code>) is connected.
          </div>

          {matches.length > 0 ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {matches.map((a) => (
                <AgencyCard key={a.slug} a={a} />
              ))}
            </div>
          ) : (
            <p className="lede mt-4">No agencies match this combination yet.</p>
          )}
        </section>
      )}
    </div>
  )
}

// Токены CN-TOKENS: единый .input, глобальное фокус-кольцо не подавляется.
const selectClass = 'input mt-1.5 block w-full'

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} role="alert" className="mt-1 text-sm font-medium text-[color:var(--color-critical)]">
          {error}
        </p>
      )}
    </div>
  )
}
