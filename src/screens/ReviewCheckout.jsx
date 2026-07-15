import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext.jsx'
import { useAppState } from '../state/AppState.jsx'

// Reviewed-tier checkout — TWO EXPLICITLY SEPARATE transactions:
//   (1) our Stripe: the platform (software) fee (Essentials/Family, see pricing.js);
//   (2) the attorney's own engagement letter + his payment link — paid DIRECTLY
//       to the attorney, never merged with (1) and never routed through us
//       (fee-splitting bar, Rule 5.4; see docs/DECISIONS.md).
// Feature-flagged: this route only mounts when REVIEWED_TIER_ENABLED.

// Bilingual copy (EN default, RU). Operational screen behind a flag — kept local
// rather than in the shipped i18n bundles so adding a product locale stays cheap.
const STR = {
  en: {
    title: 'Attorney review (optional)',
    lead: 'Have a licensed California family-law attorney review your packet before you file. This is two separate payments.',
    t1: 'Transaction 1 — Califormis software',
    t1desc: 'The ${price} platform fee for preparing your packet. Paid to Califormis.',
    pay1: 'Pay ${price} to Califormis',
    paid1: 'Paid ✓',
    t2: 'Transaction 2 — Attorney review',
    t2desc: 'Paid DIRECTLY to the reviewing attorney under their own engagement letter. Califormis does not receive, hold, or split this fee.',
    engTitle: 'Attorney engagement letter',
    engBody:
      'This limited-scope engagement is between you and the reviewing attorney. The attorney will review your prepared forms for completeness and consistency before filing. Fees ($75–125) are billed and paid directly to the attorney. Califormis is a software provider and is not your attorney.',
    accept: 'I have read and accept the attorney’s engagement letter, and will pay the attorney directly.',
    payAttorney: 'Pay the attorney directly →',
    submit: 'Send my packet for attorney review',
    step1first: 'Complete Transaction 1 first.',
    queued: 'Your packet is in the attorney review queue.',
    status: 'Status',
    back: '← Back to dashboard',
    note: 'Note: the two payments are always separate. Califormis never bills the attorney’s fee.',
  },
  ru: {
    title: 'Проверка адвокатом (по желанию)',
    lead: 'Лицензированный семейный адвокат Калифорнии проверит ваш пакет перед подачей. Это две отдельные оплаты.',
    t1: 'Транзакция 1 — программа Califormis',
    t1desc: 'Плата ${price} за подготовку пакета. Платится Califormis.',
    pay1: 'Оплатить ${price} в Califormis',
    paid1: 'Оплачено ✓',
    t2: 'Транзакция 2 — проверка адвокатом',
    t2desc: 'Платится НАПРЯМУЮ адвокату по его engagement letter. Califormis эту оплату не получает, не удерживает и не делит.',
    engTitle: 'Engagement letter адвоката',
    engBody:
      'Это соглашение ограниченного объёма между вами и проверяющим адвокатом. Адвокат проверит подготовленные формы на полноту и согласованность перед подачей. Гонорар ($75–125) выставляется и оплачивается напрямую адвокату. Califormis — поставщик ПО и не является вашим адвокатом.',
    accept: 'Я прочитал(а) и принимаю engagement letter адвоката и оплачу адвокату напрямую.',
    payAttorney: 'Оплатить адвокату напрямую →',
    submit: 'Отправить пакет на проверку адвокату',
    step1first: 'Сначала завершите Транзакцию 1.',
    queued: 'Ваш пакет в очереди на проверку адвокатом.',
    status: 'Статус',
    back: '← Назад в кабинет',
    note: 'Важно: две оплаты всегда раздельны. Califormis никогда не выставляет гонорар адвоката.',
  },
}

export default function ReviewCheckout() {
  const { lang } = useI18n()
  const { payment, review, payPlatform, acceptEngagement, attorneyFeeRange, price } = useAppState()
  const base = STR[lang] || STR.en
  // Interpolate the per-case platform price ({price} token) into the copy.
  const L = { ...base, t1desc: base.t1desc.replace('{price}', price), pay1: base.pay1.replace('{price}', price) }
  const [accepted, setAccepted] = useState(false)

  const platformPaid = payment?.status === 'paid'
  const [lo, hi] = attorneyFeeRange || [75, 125]

  return (
    <section className="screen">
      <p className="screen__eyebrow">Reviewed tier</p>
      <h1 className="screen__title">{L.title}</h1>
      <p className="screen__lead">{L.lead}</p>

      {/* Transaction 1 — platform fee (our Stripe) */}
      <div className="panel">
        <h2>{L.t1}</h2>
        <p>{L.t1desc}</p>
        <button
          className="btn btn--primary"
          onClick={payPlatform}
          disabled={platformPaid}
        >
          {platformPaid ? L.paid1 : L.pay1}
        </button>
      </div>

      {/* Transaction 2 — attorney engagement (direct to attorney) */}
      <div className="panel" style={{ opacity: platformPaid ? 1 : 0.55 }}>
        <h2>
          {L.t2} <span style={{ fontWeight: 400 }}>(${lo}–{hi})</span>
        </h2>
        <p>{L.t2desc}</p>

        <h3>{L.engTitle}</h3>
        <p style={{ fontSize: '0.9rem' }}>{L.engBody}</p>

        {!platformPaid && <p className="fl100__fl105">⚠ {L.step1first}</p>}

        {platformPaid && !review && (
          <>
            <label style={{ display: 'block', margin: '0.75rem 0' }}>
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />{' '}
              {L.accept}
            </label>
            {/* The attorney's OWN payment link (placeholder) — a separate checkout */}
            <a className="btn" href="#attorney-payment-link" rel="noreferrer">
              {L.payAttorney}
            </a>{' '}
            <button
              className="btn btn--primary"
              disabled={!accepted}
              onClick={acceptEngagement}
            >
              {L.submit}
            </button>
          </>
        )}

        {review && (
          <p className="fl100__hint">
            ✓ {L.queued} <b>{L.status}:</b> {review.status}
          </p>
        )}
      </div>

      <p className="fl100__hint">ℹ {L.note}</p>
      <p>
        <Link to="/cabinet">{L.back}</Link>
      </p>
    </section>
  )
}
