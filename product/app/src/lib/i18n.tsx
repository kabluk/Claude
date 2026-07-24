import { createContext, useContext, useState, type ReactNode } from 'react'

import app_ru from '../i18n/ru/app.json'
import app_en from '../i18n/en/app.json'
import app_es from '../i18n/es/app.json'
import onb_ru from '../i18n/ru/onboarding.json'
import onb_en from '../i18n/en/onboarding.json'
import nav_ru from '../i18n/ru/navigator.json'
import nav_en from '../i18n/en/navigator.json'
import hd_ru from '../i18n/ru/hearingday.json'
import hd_en from '../i18n/en/hearingday.json'
import hd_es from '../i18n/es/hearingday.json'

export type Lang = 'ru' | 'en' | 'es'
export const LANGS: { id: Lang; label: string }[] = [
  { id: 'ru', label: 'Русский' },
  { id: 'en', label: 'English' },
  { id: 'es', label: 'Español' },
]

const BUNDLES: Record<Lang, any> = {
  ru: Object.assign({}, app_ru, onb_ru, nav_ru, hd_ru),
  en: Object.assign({}, app_en, onb_en, nav_en, hd_en),
  es: Object.assign({}, app_es, hd_es), // es: пока только hearingday + app, остальное — fallback
}

function lookup(bundle: any, path: string): string | undefined {
  return path.split('.').reduce((o: any, k) => (o && typeof o === 'object' ? o[k] : undefined), bundle)
}

export function translate(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  let s = lookup(BUNDLES[lang], key) ?? lookup(BUNDLES.en, key) ?? lookup(BUNDLES.ru, key) ?? key
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{{${k}}}`).join(String(v))
  return s
}

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: string, v?: Record<string, string | number>) => string }>({
  lang: 'ru', setLang: () => {}, t: k => k,
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem('dn_lang') as Lang) || 'ru')
  const setLang = (l: Lang) => { localStorage.setItem('dn_lang', l); setLangState(l) }
  const t = (k: string, v?: Record<string, string | number>) => translate(lang, k, v)
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>
}

export const useI18n = () => useContext(Ctx)
