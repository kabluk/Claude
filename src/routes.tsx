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
import { wcagPages } from './lib/wcag'
import { readyComponents } from './lib/componentsLib'
import { reports } from './lib/reports'

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
  // A3-CRON-MONITORING-PAGES (D-139): брендовые страницы подтверждения/отписки
  // подписки на мониторинг. Токен-gated, noindex (index={false} внутри), в
  // публичный sitemap не входят — из письма, не из поиска. Статические маршруты
  // (без ':'), поэтому пререндерятся: page-lists.test.mjs требует их в обоих
  // списках (audit — по факту, sitemap — как явное исключение с причиной).
  { path: '/monitoring/confirm', lazy: page(() => import('./pages/MonitoringConfirmPage')) },
  { path: '/monitoring/unsubscribe', lazy: page(() => import('./pages/MonitoringUnsubscribePage')) },
  { path: '/methodology', lazy: page(() => import('./pages/MethodologyPage')) },
  // CN-COMPONENTS (§22, D-068): библиотека доступных компонентов. Индекс честно
  // перечисляет все 13 паттернов; собственные страницы имеют только готовые
  // компоненты (порог — readyComponents в src/lib/componentsLib.tsx), пути из
  // data/a11y/components.json. Согласованность с sitemap/audit — components.test.mjs.
  { path: '/components', lazy: page(() => import('./pages/ComponentsIndexPage')) },
  {
    path: '/components/:slug',
    lazy: page(() => import('./pages/ComponentPage')),
    getStaticPaths: () => readyComponents.map((c) => paths.component(c.slug)),
  },
  // CN-WCAG-PAGES (D-066): справочник критериев — только критерии с реальной
  // автоматикой (порог в src/lib/wcag.ts), пути целиком из coverage-данных.
  // Статический сегмент /wcag ранжируется выше '/:country' (как /bfsg-check).
  { path: '/wcag', lazy: page(() => import('./pages/WcagIndexPage')) },
  {
    path: '/wcag/:criterion',
    lazy: page(() => import('./pages/WcagCriterionPage')),
    getStaticPaths: () => wcagPages.map((p) => paths.wcagCriterion(p.slug)),
  },
  // CN-RESEARCH (§43, D-071): data products из самого каталога. Индекс /reports/
  // + /reports/:slug (пути из reports в src/lib/reports.ts). Числа считаются
  // скриптом (data/a11y/reports.json), гейт — scripts/reports-data.test.mjs.
  // Статический сегмент /reports ранжируется выше '/:country'.
  { path: '/reports', lazy: page(() => import('./pages/ReportsIndexPage')) },
  {
    path: '/reports/:slug',
    lazy: page(() => import('./pages/ReportDocPage')),
    getStaticPaths: () => reports.map((r) => paths.reportDoc(r.slug)),
  },
  // Немецкий входной путь (D-041). Статический сегмент ранжируется react-router
  // выше динамического '/:country' ниже по файлу, поэтому со страной не спорит.
  { path: '/bfsg-check', lazy: page(() => import('./pages/BfsgCheckPage')) },
  // G-TOOL-CONTRAST (D-144): бесплатный чекер контраста — страница-магнит под
  // SEO-кластер «contrast checker». Чисто клиентский инструмент (математика
  // WCAG), но пререндерится (статический сегмент /tools/), поэтому попадает в
  // оба захардкоженных списка (page-lists.test.mjs). Сегмент /tools/ — задел
  // под следующие инструменты (growth.md).
  { path: '/checkers/contrast-checker', lazy: page(() => import('./pages/ContrastCheckerPage')) },
  // G-TOOL-READABILITY: второй инструмент-магнит того же семейства (SC 3.1.5,
  // AAA — честно отмечено на самой странице) + индекс /tools/ теперь, когда
  // инструментов два. Статические сегменты — тот же приоритет над '/:country'.
  { path: '/checkers', lazy: page(() => import('./pages/ToolsIndexPage')) },
  { path: '/checkers/readability-checker', lazy: page(() => import('./pages/ReadabilityCheckerPage')) },
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
  {
    path: '/accessibility-statement',
    lazy: page(() => import('./pages/AccessibilityStatementPage')),
  },
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
