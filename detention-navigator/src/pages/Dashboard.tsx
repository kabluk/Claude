import { useTranslation } from 'react-i18next'
import { SosButton } from '../components/ui/SosButton'
import { UrgencyBadge } from '../components/ui/UrgencyBadge'

interface DashboardProps {
  name: string
  detainedName: string
}

const MOCK_NOTIFICATIONS = [
  { id: 1, level: 'critical' as const, text: 'Hearing scheduled: July 28, 10:00 AM', date: 'Jul 21' },
  { id: 2, level: 'action_needed' as const, text: 'Bond hearing form must be filed by Friday', date: 'Jul 20' },
  { id: 3, level: 'info' as const, text: 'Legal aid clinic available Thursday 2–5 PM', date: 'Jul 19' },
]

export function Dashboard({ name, detainedName }: DashboardProps) {
  const { t } = useTranslation()

  return (
    <div className="min-h-svh flex flex-col bg-[#FBF7F2] max-w-md mx-auto">
      {/* Header */}
      <header className="px-5 pt-10 pb-6">
        <p className="text-[#1F3550]/60 text-sm mb-1">Hello, {name}</p>
        <h1 className="text-2xl">{detainedName}'s case</h1>
      </header>

      {/* Disclaimer */}
      <div className="mx-5 mb-6 px-4 py-3 bg-[#B98A2F]/10 rounded-xl border border-[#B98A2F]/30">
        <p className="text-sm text-[#7A5A1A]">{t('not_legal_advice')}</p>
      </div>

      {/* Notifications */}
      <section className="px-5 mb-6">
        <h2 className="text-lg mb-3">Updates</h2>
        <div className="flex flex-col gap-3">
          {MOCK_NOTIFICATIONS.map(n => (
            <div key={n.id} className="bg-white rounded-xl px-4 py-4 shadow-sm flex gap-3 items-start">
              <div className="flex-1">
                <div className="mb-2"><UrgencyBadge level={n.level} /></div>
                <p className="text-[#1F3550] text-base">{n.text}</p>
              </div>
              <span className="text-[#1F3550]/40 text-sm shrink-0 mt-1">{n.date}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Empty docs state */}
      <section className="px-5 mb-8">
        <h2 className="text-lg mb-3">Documents</h2>
        <div className="bg-white rounded-xl px-5 py-8 text-center shadow-sm">
          <p className="text-[#1F3550] font-semibold mb-2">{t('docs.empty_title')}</p>
          <p className="text-[#1F3550]/60 text-sm">{t('docs.empty_body')}</p>
        </div>
      </section>

      {/* SOS */}
      <div className="px-5 pb-10 mt-auto">
        <SosButton />
      </div>
    </div>
  )
}
