// A3-CRON-SUBSCRIBE-FORM (D-135): подписка на еженедельный мониторинг сайта
// прямо со страницы отчёта. URL берётся из отчёта, который человек уже
// открыл, — заставлять его перепечатывать адрес нечего, но показать, НА ЧТО
// он подписывается, обязательно (иначе это подписка вслепую).
//
// Три вещи, которые здесь не украшение:
//   1. Успех говорит «проверьте почту», а не «готово». Подписка создаётся в
//      статусе pending и не сканирует ничего, пока не открыта ссылка из
//      письма (double opt-in, worker/routes/subscribe.js). Экран «Вы
//      подписаны» был бы прямой ложью о состоянии системы.
//   2. Ошибки — человеческим текстом с выходом (subscribeForm.ts), никогда
//      кодом и никогда сырым сообщением сервера.
//   3. Живой регион смонтирован с первого рендера и пустой (тот же урок, что
//      в library/Toast.tsx): скринридер объявляет ИЗМЕНЕНИЯ региона, за
//      которым уже наблюдает, поэтому регион, появляющийся вместе со своим
//      первым сообщением, часто не читается вовсе.

import { useEffect, useId, useRef, useState } from 'react'
import { FormField } from './library/FormField'
import { TurnstileWidget } from './TurnstileWidget'
import {
  canMonitorUrl,
  subscribeErrorMessage,
  submitSubscription,
  validateSubscribeForm,
  type SubscribeErrorCode,
} from '@/lib/subscribeForm'

type Stage =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'sent'; email: string }
  | { kind: 'failed'; code: SubscribeErrorCode }

export function SubscribeForm({ url }: { url: string }) {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | undefined>(undefined)
  const [stage, setStage] = useState<Stage>({ kind: 'idle' })
  // Тот же паттерн, что HomePage/ScanPage: виджет не рендерится вовсе без
  // VITE_TURNSTILE_SITE_KEY, токен просто остаётся пустым, и запрос уходит без
  // него — воркер пропускает проверку, когда у него нет TURNSTILE_SECRET_KEY
  // (worker/routes/subscribe.js). Это НЕ новый виджет: /api/subscribe
  // проверяет Turnstile ровно так же, как /api/scan, поэтому форма, которая
  // реально бьёт в API, обязана уметь отдать токен — иначе на проде с
  // настроенным секретом каждая подписка возвращала бы 403.
  const [turnstileToken, setTurnstileToken] = useState('')
  const formId = useId()
  const headingId = `${formId}-heading`
  const successRef = useRef<HTMLDivElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const prevStageKind = useRef(stage.kind)

  // Оба перехода между формой и панелью успеха уносят с экрана элемент, на
  // котором стоял фокус (кнопку submit / кнопку «другой адрес») — без явного
  // переноса клавиатурный пользователь каждый раз оказывался бы на <body>, в
  // самом верху длинного отчёта.
  //
  // Панель успеха при этом лежит ВНУТРИ живого региона и одновременно
  // получает фокус: объявление продублируется, зато не может пропасть ни при
  // заблокированном переносе фокуса, ни при пропущенном обновлении региона.
  // Из двух рисков выбран шум, а не тишина.
  useEffect(() => {
    if (stage.kind === 'sent') successRef.current?.focus()
    else if (stage.kind === 'idle' && prevStageKind.current === 'sent') emailRef.current?.focus()
    prevStageKind.current = stage.kind
  }, [stage.kind])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = validateSubscribeForm({ email, url })
    if (!result.valid) {
      setEmailError(result.errors.email)
      // Ошибку объявит role="alert" внутри FormField, но исправлять её человек
      // будет в поле — возвращаем туда каретку, а не оставляем её на кнопке.
      emailRef.current?.focus()
      return
    }
    setEmailError(undefined)
    setStage({ kind: 'submitting' })
    const outcome = await submitSubscription({
      email: result.value.email,
      url: result.value.url,
      ...(turnstileToken ? { turnstileToken } : {}),
    })
    setStage(
      outcome.kind === 'ok'
        ? { kind: 'sent', email: result.value.email }
        : { kind: 'failed', code: outcome.code },
    )
  }

  // URL приходит из завершённого скана, который воркер уже принял по тому же
  // критерию http(s) (worker/routes/scan.js::isHttpUrl) — невалидным он тут
  // быть не может. Если всё же пришёл, секции просто нет: показать форму,
  // которая гарантированно вернёт 400, хуже, чем не предлагать подписку.
  if (!canMonitorUrl(url)) return null

  const submitting = stage.kind === 'submitting'

  return (
    <section className="mt-10" aria-labelledby={headingId}>
      <h2 id={headingId} className="h2 mt-0">
        Watch this site for regressions
      </h2>
      <p className="lede">
        Accessibility drifts back. A redesign, a new plugin or a routine CMS update can quietly
        reintroduce issues you already fixed — and nobody notices until someone can’t use the site.
      </p>

      <div className="card mt-4 max-w-2xl">
        {stage.kind !== 'sent' && (
          <form onSubmit={handleSubmit} noValidate>
            <p className="text-sm text-on-surface-variant">
              We re-scan{' '}
              <span className="font-mono break-words text-on-surface">{url}</span> once a week and
              compare it with this report.
            </p>
            {/* Честно про то, чего ещё нет: еженедельный пересканы работают
                (A3-CRON-RESCAN-DELTA), а само письмо-дайджест ещё не включено
                (A3-CRON-DIGEST-EMAIL). Оговорка стоит ДО кнопки, а не в
                состоянии успеха: человек должен знать это, когда решает
                оставить адрес, а не после. Тот же принцип, что у honest
                degradation в панели плана. */}
            <p className="mt-2 text-xs text-on-surface-variant">
              The weekly summary email is still being switched on. Re-scans and change tracking run
              already — confirm your address now and you’ll be on the list for the first one.
            </p>

            <div className="mt-4">
              <FormField
                id={`${formId}-email`}
                label="Your email"
                hint="Used only for this site’s monitoring. No marketing, and you can stop it any time."
                error={emailError}
              >
                <input
                  ref={emailRef}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input mt-1.5 block w-full"
                />
              </FormField>
            </div>

            <div className="mt-4">
              <TurnstileWidget onToken={setTurnstileToken} />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn mt-4 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-surface-container-low disabled:text-on-surface-variant"
            >
              {submitting ? 'Sending…' : 'Email me when this changes'}
            </button>
          </form>
        )}

        {/* Живой регион — всегда в DOM, пустой в состоянии idle (см. шапку). */}
        <div role="status" aria-live="polite">
          {submitting && (
            <p className="mt-3 text-sm text-on-surface-variant">Setting up your subscription…</p>
          )}
          {stage.kind === 'sent' && (
            <div
              ref={successRef}
              tabIndex={-1}
              className="rounded-xl border border-[color:var(--color-success-border)] bg-[color:var(--color-success-soft)] p-4"
            >
              <p className="font-semibold text-[color:var(--color-success)]">
                One more step — check your inbox
              </p>
              <p className="mt-1.5 text-sm text-on-surface-variant">
                We’ve sent a confirmation link to{' '}
                <span className="font-mono break-words text-on-surface">{stage.email}</span>.
                Monitoring starts only when you open it: until then we scan nothing and send
                nothing. The email comes from <span className="font-mono">notify@verscala.com</span>{' '}
                — check your spam folder if it isn’t there in a few minutes.
              </p>
              <button
                type="button"
                onClick={() => setStage({ kind: 'idle' })}
                className="btn-ghost mt-4"
              >
                Use a different email
              </button>
            </div>
          )}
        </div>

        {/* role="alert" на монтировании — тот же механизм, на который уже
            опирается FormField для ошибок полей. */}
        {stage.kind === 'failed' && (
          <p role="alert" className="mt-3 text-sm font-medium text-[color:var(--color-critical)]">
            {subscribeErrorMessage(stage.code)}
          </p>
        )}
      </div>
    </section>
  )
}
