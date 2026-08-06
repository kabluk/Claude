// RFQ-форма (A2-LEAD-FORM, INTERFACES.md §3 Lead, VISION.md Lead Marketplace).
// Только клиентская валидация + типы черновика лида. НИКАКИХ сетевых вызовов —
// POST /api/lead ещё не существует (это отдельный узел A2-LEAD-API). Этот модуль
// не должен импортировать fetch/scanner.ts и не должен ничего отправлять.

import { countries, SERVICES, STANDARDS, serviceLabel, standardLabel, tax } from './data'
import type { PriceBand, ServiceSlug, StandardSlug } from '@data/a11y/types'

// Ценовые диапазоны — тот же порядок, что в taxonomies.json (budget→enterprise),
// переиспользуем tax.priceBands, а не переизобретаем список (см. data.ts::priceLabel).
export const PRICE_BANDS = Object.keys(tax.priceBands) as PriceBand[]
export const priceBandLabel = (p: PriceBand) => tax.priceBands[p].en ?? p

export { SERVICES, STANDARDS, serviceLabel, standardLabel, countries }

// Черновик лида, который POST /api/lead примет в теле (id/matched/status/createdAt
// назначает сервер — см. INTERFACES.md §2–3). `country` — ISO alpha-2, тот же код,
// что MatchCriteria.countryCode в matchAgencies.ts, не свободный текст.
export type LeadDraft = {
  scanId?: string
  country: string
  standard: StandardSlug
  service: ServiceSlug
  budget: PriceBand
  deadline?: string
  contact: { email: string; company?: string }
}

// Сырые значения формы — всё строки (значения <select>/<input>), проверяются
// и приводятся к LeadDraft в validateLeadForm.
export type LeadFormValues = {
  country: string
  standard: string
  service: string
  budget: string
  deadline: string
  email: string
  company: string
}

export const emptyLeadFormValues: LeadFormValues = {
  country: '',
  standard: '',
  service: '',
  budget: '',
  deadline: '',
  email: '',
  company: '',
}

export type LeadFormErrors = Partial<
  Record<'country' | 'standard' | 'service' | 'budget' | 'deadline' | 'email', string>
>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Валиден только уже существующий ISO-код из каталога (data.ts::countries) —
// не гадаем/не принимаем произвольный текст, чтобы matchAgencies.ts потом не
// молча получал страну, которой нет ни у одного агентства.
function isKnownCountry(code: string): boolean {
  return countries.some((c) => c.code === code)
}

function isValidDeadline(value: string): boolean {
  // yyyy-mm-dd из <input type="date">; не в прошлом — тот же лексикографический
  // трюк с ISO-датами, что isFeatured() в data.ts.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const today = new Date().toISOString().slice(0, 10)
  return value >= today
}

export function validateLeadForm(
  values: LeadFormValues,
): { valid: true; value: LeadDraft } | { valid: false; errors: LeadFormErrors } {
  const errors: LeadFormErrors = {}

  if (!values.country || !isKnownCountry(values.country)) {
    errors.country = 'Select a country from the list.'
  }
  if (!values.standard || !STANDARDS.includes(values.standard as StandardSlug)) {
    errors.standard = 'Select the standard you need to meet.'
  }
  if (!values.service || !SERVICES.includes(values.service as ServiceSlug)) {
    errors.service = 'Select the service you need.'
  }
  if (!values.budget || !PRICE_BANDS.includes(values.budget as PriceBand)) {
    errors.budget = 'Select a budget range.'
  }
  if (values.deadline && !isValidDeadline(values.deadline)) {
    errors.deadline = 'Deadline must be a valid date, not in the past.'
  }
  const email = values.email.trim()
  if (!email || !EMAIL_RE.test(email)) {
    errors.email = 'Enter a valid contact email.'
  }

  if (Object.keys(errors).length > 0) return { valid: false, errors }

  const company = values.company.trim()
  return {
    valid: true,
    value: {
      country: values.country,
      standard: values.standard as StandardSlug,
      service: values.service as ServiceSlug,
      budget: values.budget as PriceBand,
      deadline: values.deadline || undefined,
      contact: { email, company: company || undefined },
    },
  }
}
