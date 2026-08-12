// A3-CRON-MONITORING-PAGES (D-139): брендовая страница подтверждения подписки
// на мониторинг. Заменяет прежнюю verify-ссылку письма, которая вела прямо на
// JSON-эндпоинт воркера (сырой JSON + чужой домен *.workers.dev — прод-инцидент).
// Читает ?token=, client-side зовёт GET /api/subscribe/verify (monitoring.ts) и
// показывает человеческий исход. noindex (index={false}): токен-gated, ценности
// для поиска ноль, открывается только по ссылке из письма.

import { Layout } from '@/components/Layout'
import { MonitoringAction } from '@/components/MonitoringAction'
import { confirmMonitoring, type MonitoringErrorReason } from '@/lib/monitoring'

// Человеческий текст под каждый код неуспеха — без кодов, без статусов, без
// сырого ответа сервера (VISION.md UX-требование 4). Каждая строка ведёт вперёд.
function confirmError(reason: MonitoringErrorReason): string {
  switch (reason) {
    case 'not-found':
      return 'This confirmation link is invalid or has expired. It may have already been used, or the link may have been broken across two lines in your email. Try subscribing again from a scan report.'
    case 'bad-request':
      return 'This confirmation link is missing the token it needs. Open the link directly from the email we sent you.'
    case 'unavailable':
      return 'Monitoring isn’t connected on this deployment yet, so we can’t confirm your subscription right now.'
    case 'network':
      return 'We couldn’t reach our server to confirm your subscription. Check your connection and open the link from your email again.'
    case 'server':
    default:
      return 'Something went wrong on our side while confirming your subscription. Please open the link again in a few minutes.'
  }
}

export default function MonitoringConfirmPage() {
  return (
    <Layout
      title="Confirm your monitoring subscription"
      description="Confirm your Verscala accessibility monitoring subscription."
      path="/monitoring/confirm/"
      index={false}
    >
      <MonitoringAction
        run={confirmMonitoring}
        workingHeading="Confirming your subscription…"
        workingBody="One moment while we confirm your accessibility monitoring subscription."
        successHeading="You’re subscribed"
        renderSuccess={(url) =>
          url ? (
            <>
              We’ll email you when{' '}
              <span className="font-mono break-words text-on-surface">{url}</span>’s accessibility
              changes — a new issue, a fixed one, or a score shift. No changes that week, no email.
            </>
          ) : (
            <>
              We’ll email you when this site’s accessibility changes — a new issue, a fixed one, or a
              score shift. No changes that week, no email.
            </>
          )
        }
        errorHeading="We couldn’t confirm this subscription"
        errorBody={confirmError}
        noTokenHeading="This link needs a confirmation token"
        noTokenBody="Open the confirmation link directly from the email we sent you — it carries a token this page needs to activate your subscription. If you typed the address by hand, part of it was likely left out."
        liveWorking="Confirming your subscription"
        liveSuccess="Subscription confirmed"
        liveError="We couldn’t confirm your subscription"
      />
    </Layout>
  )
}
