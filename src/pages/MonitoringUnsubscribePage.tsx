// A3-CRON-MONITORING-PAGES (D-139): брендовая страница отписки от мониторинга.
// Видимая пользователю unsubscribe-ссылка в теле дайджест-письма ведёт сюда
// (машинный заголовок List-Unsubscribe остаётся на воркер — см. D-139 и
// buildDigestEmail). Читает ?token=, client-side зовёт GET /api/subscribe/
// unsubscribe (monitoring.ts). Идемпотентна: сервер на повторный клик отдаёт
// тот же 200 (alreadyUnsubscribed:true), поэтому для страницы это тот же success.
// noindex (index={false}): токен-gated, ценности для поиска ноль.

import { Layout } from '@/components/Layout'
import { MonitoringAction } from '@/components/MonitoringAction'
import { unsubscribeMonitoring, type MonitoringErrorReason } from '@/lib/monitoring'

function unsubscribeError(reason: MonitoringErrorReason): string {
  switch (reason) {
    case 'not-found':
      return 'This unsubscribe link is invalid or has expired — you may already be unsubscribed. If you still receive monitoring emails, use the unsubscribe link in the most recent one.'
    case 'bad-request':
      return 'This unsubscribe link is missing the token it needs. Use the unsubscribe link from one of your monitoring emails.'
    case 'unavailable':
      return 'Monitoring isn’t connected on this deployment yet, so we can’t process the unsubscribe right now.'
    case 'network':
      return 'We couldn’t reach our server to unsubscribe you. Check your connection and open the link again — or use the unsubscribe link in your most recent email.'
    case 'server':
    default:
      return 'Something went wrong on our side while unsubscribing you. Please open the link again in a few minutes.'
  }
}

export default function MonitoringUnsubscribePage() {
  return (
    <Layout
      title="Unsubscribe from monitoring"
      description="Unsubscribe from Verscala accessibility monitoring emails."
      path="/monitoring/unsubscribe/"
      index={false}
    >
      <MonitoringAction
        run={unsubscribeMonitoring}
        workingHeading="Unsubscribing…"
        workingBody="One moment while we stop your accessibility monitoring emails."
        successHeading="You’ve unsubscribed"
        renderSuccess={(url) =>
          url ? (
            <>
              No more monitoring emails for{' '}
              <span className="font-mono break-words text-on-surface">{url}</span>. You can subscribe
              again any time from that site’s scan report.
            </>
          ) : (
            <>
              No more monitoring emails for this site. You can subscribe again any time from its scan
              report.
            </>
          )
        }
        errorHeading="We couldn’t process this unsubscribe"
        errorBody={unsubscribeError}
        noTokenHeading="This link needs an unsubscribe token"
        noTokenBody="Open the unsubscribe link directly from one of your monitoring emails — it carries a token this page needs. If you typed the address by hand, part of it was likely left out."
        liveWorking="Unsubscribing you"
        liveSuccess="You have been unsubscribed"
        liveError="We couldn’t process your unsubscribe"
      />
    </Layout>
  )
}
