import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import all translation files statically for Vite bundling
import ruCommon from '../i18n/ru/common.json'
import enCommon from '../i18n/en/common.json'
import ruNavigator from '../i18n/ru/navigator.json'
import enNavigator from '../i18n/en/navigator.json'
import ruLanding from '../i18n/ru/landing.json'
import enLanding from '../i18n/en/landing.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ru: {
        common: ruCommon,
        navigator: ruNavigator,
        landing: ruLanding,
      },
      en: {
        common: enCommon,
        navigator: enNavigator,
        landing: enLanding,
      },
    },
    fallbackLng: 'ru',
    defaultNS: 'common',
    ns: ['common', 'navigator', 'landing'],
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'dn_language',
    },
  })

export default i18n
