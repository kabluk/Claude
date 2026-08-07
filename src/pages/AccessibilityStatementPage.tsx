import { Link } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { paths } from '@/lib/data'
import { coverageSummary } from '@/lib/coverage'

// AccessAtlas' own accessibility statement (Anlage 3 zu §14 BFSG-style structure,
// same shape our own guide at /guides/barrierefreiheitserklaerung-bfsg-anlage3/
// recommends to others). Added 2026-08-07 after a gap was found: AccessAtlas
// sells paid "Featured" placement via Stripe, which raises the e-commerce-service
// question for the site itself — see the "Legal basis" section below for the
// live fact-check of that classification (not taken on faith).
//
// One section (provider identification) is honestly incomplete: it links to
// /imprint/, which is itself pending the owner's legal registration
// (A0-OWNER-LEGAL in docs/project/GRAPH.yaml). No entity, address, or contact
// is invented here. The enforcement-body section has the same limitation, for
// the same reason (which authority applies depends on which country the
// operator ends up registered in).
export default function AccessibilityStatementPage() {
  return (
    <Layout
      title="Accessibility Statement"
      description="AccessAtlas' own accessibility statement — scope, legal basis, conformity status with testing method, provider identification, and enforcement body."
      path={paths.accessibilityStatement()}
      crumbs={[]}
    >
      <h1 className="h1">Accessibility Statement</h1>
      <div className="prose-guide mt-6 max-w-2xl">
        <p>
          <em>Last reviewed: 2026-08-07.</em> AccessAtlas is itself in the business of digital
          accessibility, so we hold this site to the same disclosure standard we recommend to the
          agencies and sites we write about — see our guide on{' '}
          <Link className="underline underline-offset-2" to="/guides/barrierefreiheitserklaerung-bfsg-anlage3/">
            what an accessibility statement must contain under Anlage 3 BFSG
          </Link>{' '}
          for the structure this page follows.
        </p>

        <h2>Scope of this statement</h2>
        <p>
          This statement covers everything served from this domain: the static agency catalog,
          the free{' '}
          <Link className="underline underline-offset-2" to={paths.scan()}>
            accessibility scanner
          </Link>
          , and the paid "Featured" placements that accessibility agencies can purchase via Stripe
          checkout. It does not cover the external agency and vendor websites the catalog links
          to — we don't operate those.
        </p>

        <h2>Legal basis</h2>
        <p>
          The EU-wide legal basis is the European Accessibility Act, Directive (EU) 2019/882. Its
          German transposition, the Barrierefreiheitsstärkungsgesetz (BFSG), is the most
          concretely specified national model available — Anlage 3 zu § 14 BFSG lists the exact
          contents a statement must have, and that list is what structures this page. We use it as
          a template rather than a confirmed jurisdiction: AccessAtlas' operating entity is not
          registered yet (see{' '}
          <Link className="underline underline-offset-2" to={paths.imprint()}>
            Imprint
          </Link>
          ), so we don't yet know which country's transposition will actually govern us.
        </p>
        <p>
          One nuance worth stating honestly, because it's the reason this page exists: whether
          AccessAtlas is itself an "e-commerce service" under the Act is not a settled question for
          every part of the site. Both Art. 3(30) EAA and § 2 Nr. 26 BFSG define an e-commerce
          service as one provided "with a view to concluding a consumer contract" — and "consumer"
          (Art. 3(22) EAA / § 13 BGB) means a natural person acting outside their trade, business,
          or profession. Our paid Featured placements are sold to accessibility agencies acting in
          their trade, which reads as business-to-business, not a consumer contract — so that
          revenue stream alone may not trigger the e-commerce-service definition on its own
          strict terms. Our free public scan tool is a closer fit: it's offered electronically, at
          the individual request of any visitor, with no trade purpose required of the person
          requesting it. Rather than resolve that boundary for our own benefit, we publish this
          statement regardless of which reading is correct.
        </p>

        <h2>Conformity status</h2>
        <p>
          <strong>Self-assessed, partially conformant.</strong> This status comes from automated
          testing we run on our own site, not from an external audit — Anlage 3 accepts
          self-assessment as one of two valid methods, alongside third-party testing, and we name
          which one this is.
        </p>
        <ul>
          <li>
            <strong>Permanent self-scan.</strong> Every build runs our own scanner tooling
            (axe-core) against a fixed sample of pages covering every page template on the
            site, including this one (<code>npm run audit-a11y</code>), as a build gate — a
            page template that fails blocks release. As of this statement's last review date,
            that gate ran clean: 0 violations across all 26 sampled pages.
          </li>
          <li>
            <strong>Standard coverage.</strong> Of the {coverageSummary.total} checkable success
            criteria in EN 301 549 chapter 9 (Web), our own tooling automates{' '}
            {coverageSummary.covered} ({coverageSummary.percent}%) — see{' '}
            <Link className="underline underline-offset-2" to={paths.methodology()}>
              what our scanner checks and what it can't
            </Link>{' '}
            for the full breakdown. As that page states about the same number when we show it for
            other sites: automated coverage means a check exists, not that conformance is
            proven. The remaining criteria need a human reviewer, and no third-party audit of
            this site has been performed yet — that is the concrete gap behind "partially", not a
            hedge.
          </li>
        </ul>

        <h2>Provider identification</h2>
        <p>
          Anlage 3 requires the provider's identity and contact details here (the same information
          Art. 246 EGBGB requires for distance contracts). That data isn't invented: our operating
          entity, address, and registration details are pending the owner's legal setup, tracked as{' '}
          <code>A0-OWNER-LEGAL</code> in our project backlog. Once registered, the same details
          will appear on our{' '}
          <Link className="underline underline-offset-2" to={paths.imprint()}>
            Imprint
          </Link>{' '}
          page and be linked from here — not duplicated, so there's exactly one place these facts
          can drift out of date.
        </p>

        <h2>Enforcement body</h2>
        <p>
          Which market-surveillance authority has jurisdiction depends on the country our operating
          entity is registered in — the same open item as above. For illustration, the authority
          named in the guides on this site for the German market is the{' '}
          <a
            className="underline underline-offset-2"
            href="https://mlbf-barrierefrei.de/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Marktüberwachungsstelle der Länder für die Barrierefreiheit von Produkten und
            Dienstleistungen (MLBF)
          </a>
          , Magdeburg. That's a factual reference, not a claim that MLBF is our enforcement body —
          we'll name the actual applicable authority here once our registration is settled.
        </p>

        <h2>Feedback</h2>
        <p>
          If any part of this site is difficult to use with assistive technology, or you believe
          this statement is inaccurate or incomplete, tell us via our{' '}
          <Link className="underline underline-offset-2" to={paths.contact()}>
            Contact
          </Link>{' '}
          page — the same channel we use for every other correction on this site.
        </p>
      </div>
    </Layout>
  )
}
