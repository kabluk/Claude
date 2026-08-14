// RFQ-форма (A2-LEAD-FORM). Клиентская валидация по типу Lead из
// INTERFACES.md §3. Два явных шага, а не один сабмит: "Preview matches"
// читает только уже забандленные статические данные каталога (matchAgencies(),
// тот же вызов, что MatchedAgencies.tsx на отчёте сканера) — сетевых запросов
// не делает. Только ПОСЛЕ того, как человек увидел, кому уйдёт заявка, второй
// явный шаг "Send my request" реально бьёт в POST /api/lead (A2-LEAD-API).
// Двухшаговость — не техническое ограничение, а осознанный выбор по итогам
// research 2026-08-14 (domains/product.md «Lead Marketplace»): у аналогов
// (Angi после 2025, HomeAdvisor) юзер сам решает, кому раскрыть контакт,
// вместо слепой рассылки всем совпавшим при одном клике.

import { useEffect, useId, useRef, useState } from 'react'
import {
  PRICE_BANDS,
  SERVICES,
  STANDARDS,
  emptyLeadFormValues,
  leadErrorMessage,
  priceBandLabel,
  serviceLabel,
  standardLabel,
  submitLead,
  validateLeadForm,
  type LeadDraft,
  type LeadErrorCode,
  type LeadFormErrors,
  type LeadFormValues,
} from '@/lib/leadForm'
import { matchAgencies, standardForCountry } from '@/lib/matchAgencies'
import { countries } from '@/lib/data'
import { AgencyCard } from './AgencyCard'
import { TurnstileWidget, type TurnstileHandle } from './TurnstileWidget'

type Stage =
  | { kind: 'editing'; touchedStandard: boolean }
  | { kind: 'ready'; draft: LeadDraft }
  | { kind: 'sending'; draft: LeadDraft }
  | { kind: 'sent'; draft: LeadDraft; matched: string[] }
  | { kind: 'send-failed'; draft: LeadDraft; code: LeadErrorCode }

export function LeadForm({ scanId }: { scanId?: string }) {
  const [values, setValues] = useState<LeadFormValues>(emptyLeadFormValues)
  const [errors, setErrors] = useState<LeadFormErrors>({})
  const [stage, setStage] = useState<Stage>({ kind: 'editing', touchedStandard: false })
  const turnstileRef = useRef<TurnstileHandle>(null)
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
    // Пользователь возвращается редактировать форму после превью/отправки — не
    // показывать устаревший результат (или "Sent" от предыдущего черновика)
    // поверх новых значений.
    if (stage.kind !== 'editing') {
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

  async function handleSend(draft: LeadDraft) {
    setStage({ kind: 'sending', draft })
    // D-169-style execute: невидимая проверка запускается ровно в момент
    // реальной отправки, провал/незагруженный виджет не блокирует send —
    // сервер сам решает, обязателен ли токен (worker/routes/lead.js).
    let turnstileToken: string | undefined
    try {
      turnstileToken = await turnstileRef.current?.execute()
    } catch {
      turnstileToken = undefined
    }
    const outcome = await submitLead(draft, turnstileToken)
    setStage(
      outcome.kind === 'ok'
        ? { kind: 'sent', draft, matched: outcome.matched }
        : { kind: 'send-failed', draft, code: outcome.code },
    )
  }

  const draft = stage.kind !== 'editing' ? stage.draft : undefined
  const matches = draft
    ? matchAgencies({ countryCode: draft.country, service: draft.service, priceBand: draft.budget }, 5)
    : []

  // Тот же приём, что SubscribeForm: панель успеха уносит с экрана элемент, на
  // котором стоял фокус ("Send my request"/спиннер), без явного переноса
  // клавиатурный пользователь остался бы на теперь-невидимой кнопке.
  const sentRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (stage.kind === 'sent') sentRef.current?.focus()
  }, [stage.kind])

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

        <div className="mt-4">
          <TurnstileWidget ref={turnstileRef} />
        </div>

        <button type="submit" className="btn">
          Preview matching agencies
        </button>
      </form>

      {draft && (
        <section className="mt-8 max-w-2xl" aria-live="polite">
          <h2 className="h2 mt-0">Agencies that would match</h2>

          {stage.kind !== 'sent' && (
            <div className="rounded-md border border-[color:var(--color-moderate-border)] bg-[color:var(--color-moderate-soft)] px-4 py-3 text-sm text-[color:var(--color-moderate)]">
              <strong>Not sent yet.</strong> This is a preview of who would receive your request.
              Nothing is sent until you press “Send my request” below.
            </div>
          )}

          {matches.length > 0 ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {matches.map((a) => (
                <div key={a.slug}>
                  <AgencyCard a={a} />
                  {!a.claimed && (
                    <p className="mt-1 text-xs text-on-surface-variant">
                      Not yet verified on Verscala — may not respond immediately.
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="lede mt-4">No agencies match this combination yet.</p>
          )}

          {stage.kind !== 'sent' && (
            <button
              type="button"
              disabled={stage.kind === 'sending'}
              onClick={() => handleSend(draft)}
              className="btn mt-4 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-surface-container-low disabled:text-on-surface-variant"
            >
              {stage.kind === 'sending' ? 'Sending…' : 'Send my request'}
            </button>
          )}

          {stage.kind === 'send-failed' && (
            <p role="alert" className="mt-3 text-sm font-medium text-[color:var(--color-critical)]">
              {leadErrorMessage(stage.code)}
            </p>
          )}

          {stage.kind === 'sent' && (
            <div
              ref={sentRef}
              tabIndex={-1}
              className="mt-4 rounded-xl border border-[color:var(--color-success-border)] bg-[color:var(--color-success-soft)] p-4"
            >
              <p className="font-semibold text-[color:var(--color-success)]">Request sent</p>
              <p className="mt-1.5 text-sm text-on-surface-variant">
                Verified agencies among the matches above will be notified by email and can reach
                out to you directly. If none are verified yet in your area, we’ll keep matching new
                agencies as they join.
              </p>
            </div>
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
      <label htmlFor={htmlFor} className="block text-sm font-medium text-on-surface-variant">
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
