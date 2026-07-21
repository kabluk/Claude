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
import ruAttorney from '../i18n/ru/attorney.json'
import enAttorney from '../i18n/en/attorney.json'
import ruTimeline from '../i18n/ru/timeline.json'
import enTimeline from '../i18n/en/timeline.json'
import ruCare from '../i18n/ru/care.json'
import enCare from '../i18n/en/care.json'
import ruRelease from '../i18n/ru/release.json'
import enRelease from '../i18n/en/release.json'
import ruCancellation from '../i18n/ru/cancellation.json'
import enCancellation from '../i18n/en/cancellation.json'
import esCancellation from '../i18n/es/cancellation.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ru: {
        common: ruCommon,
        navigator: ruNavigator,
        landing: ruLanding,
        attorney: ruAttorney,
        timeline: ruTimeline,
        care: ruCare,
        release: ruRelease,
        cancellation: ruCancellation,
      },
      en: {
        common: enCommon,
        navigator: enNavigator,
        landing: enLanding,
        attorney: enAttorney,
        timeline: enTimeline,
        care: enCare,
        release: enRelease,
        cancellation: enCancellation,
      },
      es: {
        common: enCommon,
        cancellation: esCancellation,
      },
    },
    fallbackLng: 'ru',
    defaultNS: 'common',
    ns: ['common', 'navigator', 'landing', 'attorney', 'timeline', 'care', 'release', 'cancellation'],
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
