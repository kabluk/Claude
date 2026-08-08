// SEO-примитивы: канонический URL, robots, OG-мета и JSON-LD.
// JSON-LD рендерится в теле страницы (валидно для Google) — не через Head,
// чтобы не зависеть от поведения helmet со <script>.

import { Head } from 'vite-react-ssg'

// TODO: заменить на боевой домен перед деплоем (.example — маркер-заглушка;
// та же константа продублирована в scripts/gen-a11y-sitemap.mjs).
export const ORIGIN = 'https://accessatlas.example'
export const SITE_NAME = 'AccessAtlas'

export function Meta({
  title,
  description,
  path,
  index = true,
  htmlLang,
}: {
  title: string
  description: string
  path: string // с завершающим слэшем, напр. '/germany/'
  index?: boolean
  // G-I18N-CHROME-DE: <html lang> для страницы. Намеренно рендерится ВНУТРИ
  // уже существующего <Head> этого компонента, а не как отдельный <Head> в
  // Layout.tsx — второй <Head>-сиблинг в дереве Layout сдвинул бы позиционные
  // индексы всех следующих детей Fragment'а на единицу, а с ними и
  // React.useId() у любого интерактивного компонента внутри <main>{children}
  // (Accordion/Combobox/формы) — тот же id при каждой пересборке ожидает
  // audit-a11y/визуальные снапшоты, а не только React. Один <Head>-компонент,
  // просто с ещё одним ребёнком — эту проблему не создаёт (сиблинги Meta в
  // Layout не сдвигаются от того, что происходит ВНУТРИ самого Meta).
  htmlLang?: string
}) {
  const url = `${ORIGIN}${path}`
  return (
    <Head>
      {htmlLang && <html lang={htmlLang} />}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {!index && <meta name="robots" content="noindex,follow" />}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta name="twitter:card" content="summary" />
    </Head>
  )
}

// `<` экранируется, чтобы «</script>» в данных не разорвал тег.
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}

export interface Crumb {
  name: string
  path: string
}

export const breadcrumbsLd = (trail: Crumb[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: trail.map((c, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: c.name,
    item: `${ORIGIN}${c.path}`,
  })),
})

export const itemListLd = (paths: string[]) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  itemListElement: paths.map((p, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    url: `${ORIGIN}${p}`,
  })),
})
