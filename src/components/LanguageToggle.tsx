import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'

/**
 * RU / EN language switcher.
 * Updates i18n instance immediately and persists preference to the user's
 * profile (preferred_language) if they are logged in.
 */
export default function LanguageToggle() {
  const { i18n } = useTranslation()
  const currentLang = i18n.language === 'en' ? 'en' : 'ru'

  async function switchLanguage(lang: 'ru' | 'en') {
    await i18n.changeLanguage(lang)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      await supabase
        .from('profiles')
        .update({ preferred_language: lang })
        .eq('id', user.id)
    }
  }

  return (
    <div
      className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-muted)] p-0.5"
      role="group"
      aria-label="Language selector"
    >
      <button
        onClick={() => switchLanguage('ru')}
        className={`min-w-[44px] min-h-[44px] px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 cursor-pointer ${
          currentLang === 'ru'
            ? 'bg-brand-600 text-white shadow-sm'
            : 'text-[var(--color-foreground)] hover:text-brand-600'
        }`}
        aria-pressed={currentLang === 'ru'}
      >
        RU
      </button>
      <button
        onClick={() => switchLanguage('en')}
        className={`min-w-[44px] min-h-[44px] px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 cursor-pointer ${
          currentLang === 'en'
            ? 'bg-brand-600 text-white shadow-sm'
            : 'text-[var(--color-foreground)] hover:text-brand-600'
        }`}
        aria-pressed={currentLang === 'en'}
      >
        EN
      </button>
    </div>
  )
}
