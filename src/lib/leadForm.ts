// RFQ-форма (A2-LEAD-FORM, INTERFACES.md §3 Lead, VISION.md Lead Marketplace).
// Клиентская валидация + типы черновика лида + отправка. `POST /api/lead`
// (A2-LEAD-API, worker/routes/lead.js) готов и подключён здесь — тем же
// паттерном, что submitSubscription в subscribeForm.ts: preview остаётся
// первым шагом (matchAgencies() на забандленных данных, без сети), а
// submitLead() — вторым, явным шагом «Send my request», который пользователь
// запускает сам, увидев, кому уйдёт заявка (research 2026-08-14,
// domains/product.md «Lead Marketplace»: у аналогов юзер выбирает раскрыть
// контакт, а не получает слепую рассылку).

import { ScannerUnavailableError, apiFetch } from './scanner'
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

// Исходы отправки — тот же rubric, что SubscribeResult (subscribeForm.ts):
// код, не текст сервера, решение по HTTP-статусу (worker/routes/lead.js).
export type LeadErrorCode = 'bad_request' | 'forbidden' | 'rate_limited' | 'server' | 'network' | 'unavailable'

export type LeadResult =
  | { kind: 'ok'; leadId: string; matched: string[] }
  | { kind: 'failed'; code: LeadErrorCode }

// Response -> исход, чистая функция ради тестируемости без живого воркера
// (тот же приём, что interpretSubscribeResponse/interpretCheckoutResponse).
export async function interpretLeadResponse(res: Response): Promise<LeadResult> {
  if (res.ok) {
    const data = (await res.json().catch(() => ({}))) as { leadId?: unknown; matched?: unknown }
    return {
      kind: 'ok',
      leadId: typeof data.leadId === 'string' ? data.leadId : '',
      matched: Array.isArray(data.matched) ? data.matched.filter((m): m is string => typeof m === 'string') : [],
    }
  }
  if (res.status === 400) return { kind: 'failed', code: 'bad_request' }
  if (res.status === 403) return { kind: 'failed', code: 'forbidden' }
  if (res.status === 429) return { kind: 'failed', code: 'rate_limited' }
  return { kind: 'failed', code: 'server' }
}

const LEAD_ERROR_MESSAGES: Record<LeadErrorCode, string> = {
  bad_request: 'Something in the request wasn’t accepted. Go back, check the form, and try again.',
  forbidden:
    'We couldn’t confirm you’re not a bot. Reload the page and try once more — that usually resets the check.',
  rate_limited: 'Too many requests from your connection in the last hour. Wait an hour and try again.',
  server: 'Something went wrong on our side. Nothing was sent — please try again in a few minutes.',
  network: 'We couldn’t reach our server. Check your connection and try again — nothing was sent.',
  unavailable: 'Request routing isn’t connected on this deployment yet, so we can’t send it right now.',
}

export function leadErrorMessage(code: LeadErrorCode): string {
  return LEAD_ERROR_MESSAGES[code] ?? LEAD_ERROR_MESSAGES.server
}

// Тот же apiFetch/API_BASE, что submitSubscription/submitScan — единый origin
// (VITE_SCANNER_API), единый нормализатор хвостовых слэшей (D-104). Никогда
// не бросает: любой сбой становится `failed` с кодом, для которого выше есть
// человеческий текст (тот же принцип, что submitSubscription).
export async function submitLead(draft: LeadDraft, turnstileToken?: string): Promise<LeadResult> {
  try {
    const res = await apiFetch('/api/lead', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        country: draft.country,
        standard: draft.standard,
        service: draft.service,
        budget: draft.budget,
        ...(draft.deadline ? { deadline: draft.deadline } : {}),
        ...(draft.scanId ? { scanId: draft.scanId } : {}),
        contact: draft.contact,
        ...(turnstileToken ? { turnstileToken } : {}),
      }),
    })
    return await interpretLeadResponse(res)
  } catch (err) {
    if (err instanceof ScannerUnavailableError) return { kind: 'failed', code: 'unavailable' }
    return { kind: 'failed', code: 'network' }
  }
}
