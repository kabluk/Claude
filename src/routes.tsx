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
  { path: '/scan', lazy: page(() => import('./pages/ScanPage')) },
  // Скан-отчёты непредсказуемы (id генерируется Worker'ом) — нет getStaticPaths,
  // клиентский маршрут, как /404 catch-all ниже.
  { path: '/report/:id', lazy: page(() => import('./pages/ReportPage')) },
  // A2-LEAD-FORM: UI-only, без бэкенда (см. RequestQuotePage.tsx). Опциональный
  // ?scanId= — клиентский параметр, не влияет на пререндер.
  { path: '/request-quote', lazy: page(() => import('./pages/RequestQuotePage')) },
  { path: '/about', lazy: page(() => import('./pages/AboutPage')) },
  { path: '/contact', lazy: page(() => import('./pages/ContactPage')) },
  { path: '/privacy', lazy: page(() => import('./pages/PrivacyPage')) },
  { path: '/imprint', lazy: page(() => import('./pages/ImprintPage')) },
  // Статический /404/ — прямые ссылки и копия в dist/404.html (см.
  // gen-a11y-sitemap.mjs) для конвенции хостингов (Cloudflare Pages/Netlify).
  { path: '/404', lazy: page(() => import('./pages/NotFoundPage')) },
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
  // Клиентский catch-all: не пререндерится (vite-react-ssg отфильтровывает
  // пути с ':'/'*' из статической сборки), но подхватывает SPA-навигацию
  // на несуществующий путь в браузере после гидратации.
  { path: '*', lazy: page(() => import('./pages/NotFoundPage')) },
]
