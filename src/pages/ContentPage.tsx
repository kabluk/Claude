import type { Lang, PageContent, UIStrings } from '@/lib/types'
import { Layout, Footer } from '@/components/Layout'
import { Blocks } from '@/components/Blocks'

export function ContentPage({
  lang,
  pageKey,
  c,
  ui,
}: {
  lang: Lang
  pageKey: string
  c: PageContent
  ui: UIStrings
}) {
  return (
    <Layout lang={lang} pageKey={pageKey} ui={ui} title={`${c.title} · DETNAV`} description={c.lede}>
      <h1 className="page-h1">{c.title}</h1>
      {c.lede && <p className="lede">{c.lede}</p>}
      <Blocks blocks={c.blocks} lang={lang} ui={ui} />
      <Footer ui={ui} />
    </Layout>
  )
}
