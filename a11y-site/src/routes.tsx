import type { RouteRecord } from 'vite-react-ssg'
import {
  SERVICES,
  STANDARDS,
  agencies,
  agenciesIn,
  countries,
  paths,
  withService,
} from './lib/data'
import { guides } from './lib/guides'

// Ленивые импорты — свой чанк на шаблон страницы.
const page = (load: () => Promise<{ default: () => JSX.Element | null }>) => async () => ({
  Component: (await load()).default,
})

// Комбо страна×услуга существует только при ≥1 провайдере (иначе страницы нет
// вовсе; порог индексации ≥3 решает уже meta robots внутри страницы).
const combos = countries.flatMap((c) =>
  SERVICES.filter((s) => withService(agenciesIn(c.code), s).length > 0).map((s) => ({ c, s })),
)

export const routes: RouteRecord[] = [
  { path: '/', lazy: page(() => import('./pages/HomePage')) },
  {
    path: '/agencies',
    lazy: async () => ({ Component: (await import('./pages/TierPages')).AgenciesIndexPage }),
  },
  {
    path: '/agencies/:slug',
    lazy: page(() => import('./pages/AgencyPage')),
    getStaticPaths: () => agencies.map((a) => paths.agency(a.slug)),
  },
  {
    path: '/countries',
    lazy: async () => ({ Component: (await import('./pages/TierPages')).CountriesPage }),
  },
  {
    path: '/services',
    lazy: async () => ({ Component: (await import('./pages/TierPages')).ServicesPage }),
  },
  {
    path: '/services/:service',
    lazy: page(() => import('./pages/ServicePage')),
    getStaticPaths: () => SERVICES.map((s) => paths.service(s)),
  },
  {
    path: '/standards',
    lazy: async () => ({ Component: (await import('./pages/TierPages')).StandardsPage }),
  },
  {
    path: '/standards/:standard',
    lazy: page(() => import('./pages/StandardPage')),
    getStaticPaths: () => STANDARDS.map((s) => paths.standard(s)),
  },
  {
    path: '/guides',
    lazy: page(() => import('./pages/GuidesIndexPage')),
  },
  {
    path: '/guides/:slug',
    lazy: page(() => import('./pages/GuidePage')),
    getStaticPaths: () => guides.map((g) => `/guides/${g.slug}/`),
  },
  {
    path: '/about',
    lazy: async () => ({ Component: (await import('./pages/StaticPages')).AboutPage }),
  },
  {
    path: '/contact',
    lazy: async () => ({ Component: (await import('./pages/StaticPages')).ContactPage }),
  },
  {
    path: '/privacy',
    lazy: async () => ({ Component: (await import('./pages/StaticPages')).PrivacyPage }),
  },
  {
    path: '/impressum',
    lazy: async () => ({ Component: (await import('./pages/StaticPages')).ImpressumPage }),
  },
  // Статическая страница /404/ → пост-обработка копирует её в dist/404.html
  // (Cloudflare Pages отдаёт этот файл на любой несуществующий URL).
  {
    path: '/404',
    lazy: async () => ({ Component: (await import('./pages/StaticPages')).NotFoundPage }),
  },
  {
    path: '/:country',
    lazy: page(() => import('./pages/CountryPage')),
    getStaticPaths: () => countries.map((c) => paths.country(c)),
  },
  {
    path: '/:country/:service',
    lazy: page(() => import('./pages/ComboPage')),
    getStaticPaths: () => combos.map(({ c, s }) => paths.combo(c, s)),
  },
  // Клиентский catch-all для дев-сервера и SPA-переходов; в SSG не попадает
  // (пустой getStaticPaths), на проде несуществующие URL закрывает 404.html.
  {
    path: '*',
    lazy: async () => ({ Component: (await import('./pages/StaticPages')).NotFoundPage }),
    getStaticPaths: () => [],
  },
]
