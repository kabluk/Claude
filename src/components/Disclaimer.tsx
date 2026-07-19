import { useTranslation } from 'react-i18next'

/**
 * Persistent disclaimer banner — renders on every page, cannot be dismissed.
 * Required for UPL compliance.
 */
export default function Disclaimer() {
  const { t } = useTranslation('common')

  return (
    <div
      role="banner"
      className="w-full bg-amber-50 border-b border-amber-200 px-4 py-2 text-center"
      aria-label={t('disclaimer.aria_label')}
    >
      <p className="text-xs text-amber-800 font-body">
        {t('disclaimer.text')}
      </p>
    </div>
  )
}
