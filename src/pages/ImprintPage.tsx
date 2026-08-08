import { Layout } from '@/components/Layout'
import { paths } from '@/lib/data'

// Легальные реквизиты предоставлены владельцем напрямую 2026-08-08 (D-089),
// не выдуманы. A0-ORIGIN закрыт (домен куплен 2026-08-08) — index больше не
// false, страница индексируется и попадает в sitemap (см. GRAPH.yaml).
// Разведено с Layout: locale/htmlLang не трогаются — эта страница на
// английском, как и весь остальной chrome.
export default function ImprintPage() {
  return (
    <Layout
      title="Imprint"
      description="Legal notice for Verscala."
      path={paths.imprint()}
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
          Email: <a href="mailto:info@verscala.com">info@verscala.com</a>
          <br />
          Phone: <a href="tel:+12134218848">+1 213 421 8848</a>
        </p>
      </div>
    </Layout>
  )
}
