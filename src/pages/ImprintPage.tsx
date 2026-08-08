import { Layout } from '@/components/Layout'
import { paths } from '@/lib/data'

// Легальные реквизиты предоставлены владельцем напрямую 2026-08-08 (D-089),
// не выдуманы. index остаётся false: A0-ORIGIN (реальный домен вместо
// accessatlas.example) — отдельный незакрытый узел, и снимать noindex до
// него преждевременно (см. GRAPH.yaml). Разведено с Layout: locale/htmlLang
// не трогаются — эта страница на английском, как и весь остальной chrome.
export default function ImprintPage() {
  return (
    <Layout
      title="Imprint"
      description="Legal notice for AccessAtlas."
      path={paths.imprint()}
      index={false}
      crumbs={[]}
    >
      <h1 className="h1">Imprint</h1>
      <div className="prose-guide mt-6 max-w-2xl">
        <h2>Operator</h2>
        <p>
          Murman Express Inc
          <br />
          A California corporation
          <br />
          2699&frac12; N Beachwood Drive, STE 4048
          <br />
          Los Angeles, CA 90068
          <br />
          United States
        </p>

        <h2>Represented by</h2>
        <p>Evgenii Skliarov, CEO</p>

        <h2>Contact</h2>
        <p>
          Email: <a href="mailto:zincroom@gmail.com">zincroom@gmail.com</a>
          <br />
          Phone: <a href="tel:+12134218848">+1 213 421 8848</a>
        </p>
      </div>
    </Layout>
  )
}
