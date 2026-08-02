import type { RouteRecord } from 'vite-react-ssg'
import { LANGS, type Lang, type UIStrings } from './lib/types'
import { pathFor } from './lib/slugs'
import { RootRedirect } from './pages/RootRedirect'
import { HomePage } from './pages/HomePage'
import { ContentPage } from './pages/ContentPage'
import { JourneyPage } from './pages/JourneyPage'
import { IntakePage } from './pages/IntakePage'
import { StatePage } from './pages/StatePage'
import { FacilityPage } from './pages/FacilityPage'
import uiEn from '@content/en/ui'
import uiEs from '@content/es/ui'
import uiRu from '@content/ru/ui'

const UI: Record<Lang, UIStrings> = { en: uiEn, es: uiEs, ru: uiRu }

// Контент режется на чанки по страницам: каждый файл content/*/*.ts
// загружается только на своей странице.
const pageMods = import.meta.glob('../content/*/*.ts')
const intakeMods = import.meta.glob('../content/intake/*.ts')

/* eslint-disable @typescript-eslint/no-explicit-any */
function lazyFor(lang: Lang, file: string, render: (m: any) => JSX.Element) {
  return async () => {
    const load = pageMods[`../content/${lang}/${file}.ts`] ?? intakeMods[`../content/intake/${lang}.ts`]
    const m: any = await load()
    return { Component: () => render(m) }
  }
}

function routePath(lang: Lang, key: string): string {
  const p = pathFor(lang, key)
  return p.endsWith('/') && p.length > 1 ? p.slice(0, -1) : p
}

const CONTENT_PAGES = [
  'where',
  'anum',
  'documents',
  'firstcall',
  'verify',
  'connect',
  'visit',
  'attorney',
  'habeas',
  'docpack',
  'deadlines',
  'complaints',
  'forms',
  'orgs',
] as const

const LEGAL_PAGES = ['about', 'data', 'disclaimer'] as const

export const routes: RouteRecord[] = [
  { path: '/', element: <RootRedirect /> },
  ...LANGS.flatMap((lang): RouteRecord[] => {
    const ui = UI[lang]
    return [
      {
        path: routePath(lang, 'home'),
        lazy: lazyFor(lang, 'home', (m) => <HomePage lang={lang} c={m.default} ui={ui} />),
      },
      ...CONTENT_PAGES.map(
        (key): RouteRecord => ({
          path: routePath(lang, key),
          lazy: lazyFor(lang, key, (m) => (
            <ContentPage lang={lang} pageKey={key} c={m.default} ui={ui} />
          )),
        }),
      ),
      ...LEGAL_PAGES.map(
        (key): RouteRecord => ({
          path: routePath(lang, key),
          lazy: lazyFor(lang, 'legal', (m) => (
            <ContentPage lang={lang} pageKey={key} c={m[key]} ui={ui} />
          )),
        }),
      ),
      {
        path: routePath(lang, 'journey'),
        lazy: lazyFor(lang, 'journey', (m) => <JourneyPage lang={lang} c={m.default} ui={ui} />),
      },
      {
        path: routePath(lang, 'intake'),
        lazy: async () => {
          const m: any = await intakeMods[`../content/intake/${lang}.ts`]()
          return {
            Component: () => (
              <IntakePage lang={lang} c={m.default} ui={ui} title={ui.nav['intake']} />
            ),
          }
        },
      },
      ...(
        [
          ['state-ca', 'CA'],
          ['state-tx', 'TX'],
          ['state-la', 'LA'],
        ] as const
      ).map(
        ([key, code]): RouteRecord => ({
          path: routePath(lang, key),
          lazy: lazyFor(lang, 'directory', (m) => (
            <StatePage lang={lang} code={code} pageKey={key} dir={m.default} ui={ui} />
          )),
        }),
      ),
      {
        path: routePath(lang, 'facility-adelanto'),
        lazy: lazyFor(lang, 'directory', (m) => (
          <FacilityPage
            lang={lang}
            slug="adelanto"
            pageKey="facility-adelanto"
            dir={m.default}
            ui={ui}
          />
        )),
      },
    ]
  }),
]
