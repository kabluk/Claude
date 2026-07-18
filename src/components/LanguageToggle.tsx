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

    // Persist preference for authenticated users
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
    <div className="flex items-center gap-1 text-sm font-medium" role="group" aria-label="Language selector">
      <button
        onClick={() => switchLanguage('ru')}
        className={`px-2 py-1 rounded transition-colors ${
          currentLang === 'ru'
            ? 'bg-brand-600 text-white'
            : 'text-gray-600 hover:text-gray-900'
        }`}
        aria-pressed={currentLang === 'ru'}
      >
        RU
      </button>
      <span className="text-gray-300" aria-hidden>|</span>
      <button
        onClick={() => switchLanguage('en')}
        className={`px-2 py-1 rounded transition-colors ${
          currentLang === 'en'
            ? 'bg-brand-600 text-white'
            : 'text-gray-600 hover:text-gray-900'
        }`}
        aria-pressed={currentLang === 'en'}
      >
        EN
      </button>
    </div>
  )
}
