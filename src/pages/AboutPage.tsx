import { Link } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { agencies, countries, paths } from '@/lib/data'

export default function AboutPage() {
  return (
    <Layout
      title="About AccessAtlas"
      description="What AccessAtlas is, how listings are verified, and what we deliberately leave out."
      path={paths.about()}
      crumbs={[]}
    >
      <h1 className="h1">About AccessAtlas</h1>
      <div className="prose-guide mt-6 max-w-3xl">
        <p>
          AccessAtlas is a directory of {agencies.length} agencies and consultancies that audit
          digital products for accessibility compliance — WCAG, EN 301 549, Section 508, the
          European Accessibility Act, BITV 2.0, RGAA and related national implementations —
          across {countries.length} countries.
        </p>

        <h2>Why we built this</h2>
        <p>
          Organisations facing an accessibility deadline typically start from a search engine and
          land on individual vendor websites, with no way to compare providers by country,
          standard, certification or price. We built a filterable, source-cited alternative.
        </p>

        <h2>How a listing gets in</h2>
        <p>Every agency on this site was added because at least one of the following was true:</p>
        <ul>
          <li>
            It holds a verifiable, checkable credential — a BIK BITV-Test Prüfstelle
            qualification, IAAP organisational membership, or similar.
          </li>
          <li>
            It is named as the auditor in a public, legally mandated accessibility statement
            published by a government body — the source we consider strongest, since these
            statements are published under legal obligation and rarely appear in any other
            directory.
          </li>
          <li>
            It publicly advertises accessibility audit, remediation, VPAT, training or monitoring
            services on its own website, and we found no evidence contradicting that.
          </li>
        </ul>
        <p>
          Every profile links to the source that justified its inclusion. Where we could not
          verify a fact — a city, a price band, a certification — we leave the field empty rather
          than guess. You will see incomplete profiles as a result; that is intentional.
        </p>

        <h2>What we deliberately exclude</h2>
        <p>
          We do not list automated accessibility overlay widgets. The accessibility community has
          documented, repeatedly, that overlays do not achieve compliance and can themselves
          create barriers — see our{' '}
          <Link className="underline underline-offset-2" to="/guides/wcag-audit-vs-overlay/">
            overlay vs. real audit guide
          </Link>{' '}
          for the sources. This directory lists firms that do audit and remediation work by
          people.
        </p>

        <h2>What this site does not do yet</h2>
        <p>
          There is no paid placement, no lead-routing form and no self-service claim flow live at
          the moment — all listings are free, and if you run one of the agencies listed here and
          want something corrected, added or removed, email us (see{' '}
          <Link className="underline underline-offset-2" to={paths.contact()}>
            Contact
          </Link>
          ) rather than looking for a dashboard that does not exist yet.
        </p>

        <h2>Corrections</h2>
        <p>
          If you find an error — a closed business, a wrong certification, an outdated URL — we
          want to know. See{' '}
          <Link className="underline underline-offset-2" to={paths.contact()}>
            Contact
          </Link>
          .
        </p>
      </div>
    </Layout>
  )
}
