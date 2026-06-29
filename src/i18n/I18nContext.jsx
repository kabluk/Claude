import { createContext, useContext, useEffect, useState } from 'react'
import { translations, LANGS } from './translations.js'

const STORAGE_KEY = 'califormis.lang'
const I18nContext = createContext(null)

function readInitial() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && translations[saved]) return saved
  } catch {
    /* localStorage unavailable — fall back to default */
  }
  return 'en' // default language
}

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(readInitial)

  // Persist the user's choice and reflect it on <html lang>.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      /* ignore persistence errors */
    }
    document.documentElement.lang = lang
  }, [lang])

  const value = {
    lang,
    setLang,
    langs: LANGS,
    t: translations[lang],
    // Interpolate {placeholders}: fmt('Step {n} of 6', { n: 3 })
    fmt: (str, vars = {}) =>
      (str || '').replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? '')),
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within <I18nProvider>')
  return ctx
}
