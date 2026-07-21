import { useTranslation } from 'react-i18next'

type Level = 'info' | 'action_needed' | 'critical'

const styles: Record<Level, string> = {
  info:          'bg-[#1F3550]/10 text-[#1F3550]',
  action_needed: 'bg-[#B98A2F]/15 text-[#7A5A1A]',
  critical:      'bg-[#C0564A]/15 text-[#8B3029]',
}

export function UrgencyBadge({ level }: { level: Level }) {
  const { t } = useTranslation()
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${styles[level]}`}>
      {level === 'critical' && <span className="mr-1" aria-hidden>●</span>}
      {t(`urgency.${level}`)}
    </span>
  )
}
