import { useEffect, type ReactNode } from 'react'
import { Link, useLocation, useNavigationType } from 'react-router-dom'
import { agencies, countries, paths } from '@/lib/data'
import { Meta, JsonLd, breadcrumbsLd, SITE_NAME, type Crumb } from '@/lib/seo'
import { chromeDict, type ChromeLocale } from '@/lib/i18n'

// Сброс прокрутки при переходе между страницами. Без него react-router
// сохраняет позицию предыдущей страницы: клик по карточке агентства из
// середины длинного списка открывал профиль сразу в его середине (найдено
// владельцем на живом сайте, D-093).
//
// ХУК, а не JSX-компонент вроде <ScrollToTop /> внутри Layout — сознательно:
// новый узел в общем каркасе сдвинул бы позиционные индексы детей Fragment'а,
// а с ними React.useId() у любого интерактивного компонента на КАЖДОЙ из 451
// страницы (ровно этот баг ловили в D-087). Хук не добавляет узлов в дерево.
//
// Два исключения, оба намеренные:
// - есть #hash → страница открывается по якорю, прокрутку не трогаем;
// - navigationType === 'POP' (кнопки Назад/Вперёд) → пользователь ждёт
//   возврата на прежнее место, а не прыжка наверх.
function useScrollToTopOnNavigate() {
  const { pathname, hash } = useLocation()
  const navigationType = useNavigationType()
  useEffect(() => {
    if (hash) return
    if (navigationType === 'POP') return
    window.scrollTo(0, 0)
  }, [pathname, hash, navigationType])
}

export function Layout({
  title,
  description,
  path,
  index = true,
  crumbs,
  locale = 'en',
  htmlLang,
  children,
}: {
  title: string
  description: string
  path: string
  index?: boolean
  crumbs?: Crumb[] // без последнего звена-самой-страницы — оно добавится
  // G-I18N-CHROME-DE: язык ШАПКИ/ФУТЕРА (nav-лейблы, CTA, футер) — словарь
  // сейчас есть только для 'en'/'de'. Default 'en' — существующее поведение
  // всех ~440 английских страниц не меняется ни на байт.
  locale?: ChromeLocale
  // Язык ДОКУМЕНТА (<html lang>) — по умолчанию равен locale, но их
  // РАЗЛИЧИЕ осмысленно: на гайдах с fr/pl-контентом (GuidePage.tsx) chrome
  // остаётся английским (locale='en', словаря на fr/pl ещё нет), а тело
  // статьи — настоящее fr/pl; тогда htmlLang=g.locale передаётся отдельно,
  // чтобы <html lang> продолжал верно называть язык документа, как и до
  // этого узла, не откатываясь на 'en' вслед за словарём хрома. Единственный
  // источник правды для <html lang> в проекте всё равно один — этот компонент
  // (раньше страницы дублировали его через собственный <Head>).
  htmlLang?: string
  children: ReactNode
}) {
  useScrollToTopOnNavigate()
  const t = chromeDict(locale)
  const trail: Crumb[] = crumbs ? [{ name: t.breadcrumbHome, path: '/' }, ...crumbs] : []
  return (
    <>
      <Meta
        title={title}
        description={description}
        path={path}
        index={index}
        htmlLang={htmlLang ?? locale}
      />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-surface-container focus:px-3 focus:py-2 focus:shadow"
      >
        {t.skipToContent}
      </a>
      {/* CN-NAV (шапка, D-063) + CN-BRANDBOOK (D-072): sticky-шапка с лёгким
          backdrop-blur, как в макетах; Scan — первый и единственный акцентный
          элемент навигации, остальные пункты нейтральные. CTA справа — pill
          secondary-container (макет), не второй primary: один акцент на
          поверхность. */}
      <header className="sticky top-0 z-40 border-b border-outline-variant bg-background/80 backdrop-blur-xl">
        <div className="container-page flex flex-wrap items-center gap-x-6 gap-y-2 py-3">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
            {/* Логотип D-072: скруглённая плашка primary с белым stroke-глифом
                карты. СВОЙ inline-SVG в стиле иконочной системы проекта
                (stroke, currentColor, ~1.75) — Material Symbols/иконочные
                шрифты с CDN сознательно НЕ подключаются (§29: один икон-стиль;
                CSP/self-host, D-063). Токены brand-plate/brand-glyph — тема
                только светлая (D-073), dark-переопределения не существует. */}
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-plate text-brand-glyph"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4.5 w-4.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4Z" />
                <path d="M9 4v14" />
                <path d="M15 6v14" />
              </svg>
            </span>
            {SITE_NAME}
          </Link>
          {/* D-118: шапка сокращена до ядра IA — Scan (акцент) / Countries /
              Knowledge / Experts. Раньше 8 пунктов на мобиле переносились
              (flex-wrap) в 2–3 ряда, и шапка росла в высоту (жалоба владельца).
              Вторичные разделы (Services/Standards/Components/Reports) переехали
              в футер-nav «Explore» ниже — site-wide линк сохранён, SEO/анти-orphan
              (§23, D-071) не пострадал. URL /guides//agencies/ не переименованы
              (CN-NAV, D-062 §6): подписи IA — Knowledge/Experts, сами адреса и
              модель данных agencies не трогаем. */}
          {/* D-118: на мобиле nav занимает СВОЙ полный ряд (order-last w-full),
              тогда логотип и CTA делят ряд выше — итого 2 ряда, а не 3 (высота,
              жалоба владельца). На десктопе (md+) nav возвращается в общую строку
              (order-none w-auto): логотип · nav · CTA в один ряд. Только классы —
              структура DOM не меняется, useId не сдвигается. */}
          <nav aria-label={t.ariaMain} className="order-last flex w-full flex-wrap items-center gap-4 text-sm font-medium text-on-surface-variant md:order-none md:w-auto">
            <Link
              className="font-semibold text-[color:var(--color-primary)] hover:text-[color:var(--color-primary-hover)]"
              to={paths.scan()}
            >
              {t.nav.scan}
            </Link>
            <Link className="hover:text-on-surface" to={paths.countries()}>
              {t.nav.countries}
            </Link>
            <Link className="hover:text-on-surface" to="/guides/">
              {t.nav.knowledge}
            </Link>
            <Link className="hover:text-on-surface" to={paths.agencies()}>
              {t.nav.experts}
            </Link>
          </nav>
          <Link
            /* CN-BRANDBOOK-V2: primary-container сменил роль на «средний тон
               hover» (#5e6ad2) — текст на hover переключён на on-primary
               (белый, 4.70:1), а не on-primary-container (#00006e даёт на
               новом фоне только 3.65:1, провал AA). */
            className="ml-auto inline-flex items-center rounded-full bg-secondary-container px-4 py-1.5 font-mono text-xs font-medium tracking-[0.05em] uppercase text-on-secondary-container transition hover:bg-primary-container hover:text-on-primary"
            to={paths.scan()}
          >
            {t.ctaScanWebsite}
          </Link>
        </div>
      </header>
      {trail.length > 0 && (
        <nav aria-label={t.ariaBreadcrumb} className="container-page pt-4 text-sm text-on-surface-variant">
          <JsonLd data={breadcrumbsLd([...trail, { name: title, path }])} />
          <ol className="flex flex-wrap gap-1">
            {trail.map((c) => (
              <li key={c.path} className="after:mx-1 after:content-['/']">
                <Link className="hover:text-on-surface" to={c.path}>
                  {c.name}
                </Link>
              </li>
            ))}
            <li aria-current="page" className="text-on-surface-variant">
              {title}
            </li>
          </ol>
        </nav>
      )}
      <main id="main" className="container-page pb-16 pt-6">
        {children}
      </main>
      <footer className="border-t border-outline-variant bg-surface-container-low py-10 text-sm text-on-surface-variant">
        <div className="container-page space-y-3">
          {/* Числа — реальные данные (agencies.length/countries.length),
              обёрнуты в .num (tabular-nums, §25) как и раньше; текст вокруг —
              из словаря функциями introMiddle/introSuffix (не заморожена
              строка с числом внутри). Структура children (текст — span —
              текст — span — {' '} — текст) сохранена 1:1 с исходной, чтобы
              SSR-разметка (в т.ч. гидрационные <!-- --> между соседними
              текстовыми узлами) для английских страниц не сдвинулась ни на
              байт. */}
          <p>
            {SITE_NAME} — <span className="num">{agencies.length}</span>
            {t.footer.introMiddle(agencies.length, countries.length)}
            <span className="num">{countries.length}</span>{' '}
            {t.footer.introSuffix(agencies.length, countries.length)}
          </p>
          <p>{t.footer.noOverlays}</p>
          {/* D-118: вторичные разделы каталога, вынесенные из шапки ради её
              компактности. Отдельный landmark с уникальным именем (t.ariaExplore,
              landmark-unique D-083); цвет on-surface-variant (как ядро-nav), а не
              secondary — это навигация по разделам, не мелкий шрифт правовых
              ссылок ниже. Так каждый из 8 разделов сохраняет site-wide линк. */}
          <nav aria-label={t.ariaExplore} className="flex flex-wrap gap-x-4 gap-y-1 pt-2">
            <Link className="hover:text-on-surface" to={paths.services()}>
              {t.nav.services}
            </Link>
            <Link className="hover:text-on-surface" to={paths.standards()}>
              {t.nav.standards}
            </Link>
            <Link className="hover:text-on-surface" to={paths.components()}>
              {t.nav.components}
            </Link>
            <Link className="hover:text-on-surface" to={paths.reports()}>
              {t.nav.reports}
            </Link>
          </nav>
          {/* CN-BRANDBOOK-V2: --color-secondary — новый токен, назначенный
              именно футер-ссылкам в макете (5.8:1 на surface-container-low,
              AA). Только цвет текста меняется, разметка/структура прежние. */}
          <nav aria-label={t.ariaLegal} className="flex flex-wrap gap-x-4 gap-y-1 pt-2 text-secondary">
            <Link className="hover:text-on-surface" to={paths.about()}>
              {t.footer.nav.about}
            </Link>
            <Link className="hover:text-on-surface" to={paths.methodology()}>
              {t.footer.nav.whatWeCheck}
            </Link>
            <Link className="hover:text-on-surface" to={paths.contact()}>
              {t.footer.nav.contact}
            </Link>
            <Link className="hover:text-on-surface" to={paths.privacy()}>
              {t.footer.nav.privacy}
            </Link>
            <Link className="hover:text-on-surface" to={paths.imprint()}>
              {t.footer.nav.imprint}
            </Link>
            <Link className="hover:text-on-surface" to={paths.accessibilityStatement()}>
              {t.footer.nav.accessibilityStatement}
            </Link>
          </nav>
        </div>
      </footer>
    </>
  )
}
