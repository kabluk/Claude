import { Link, useParams } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { JsonLd, ORIGIN, SITE_NAME } from '@/lib/seo'
import { paths, countryByCode } from '@/lib/data'
import { reportBySlug, stats, en301549Stats, jurisdictionStats, type ReportMeta } from '@/lib/reports'

// CN-RESEARCH (§23, D-071) / CN-RESEARCH-EN301549-AUTOMATION /
// CN-RESEARCH-JURISDICTION-COVERAGE: a data-product page. The prose is
// authored; every number is read from a computed stats object (never typed by
// hand). This page now backs THREE reports with DIFFERENT data shapes, so it
// is a dispatcher on `meta.slug`: a shared shell (JSON-LD, h1, dateline, dek)
// renders the same way for every report, and the body — everything below the
// dek — is a per-slug component looked up in REPORT_BODIES, the same
// "data → per-slug content" shape as DEMOS in src/lib/componentsLib.tsx.
// verified-audit-market's and en301549-automation-coverage's bodies below are
// UNCHANGED by adding the third report — same markup, same text, same
// numbers, so their output stays byte-identical.

function StatTile({ value, label, note }: { value: string | number; label: string; note?: string }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
      <div className="num text-2xl font-bold text-[color:var(--color-on-surface)]">{value}</div>
      <div className="mt-1 text-sm font-medium text-on-surface-variant">{label}</div>
      {note && <div className="mt-1 text-xs text-on-surface-variant">{note}</div>}
    </div>
  )
}

// A labelled bar per row. The bar is decorative (aria-hidden); the count next to
// it is real text, so length is never the only carrier of the value. Rendered as
// a table with row headers so a screen reader reads "France, 28".
function BarList({ caption, rows }: { caption: string; rows: { key: string; label: string; count: number }[] }) {
  const max = Math.max(...rows.map((r) => r.count), 1)
  return (
    <table className="mt-4 w-full border-collapse text-sm">
      <caption className="sr-only">{caption}</caption>
      <tbody>
        {rows.map((r) => (
          <tr key={r.key}>
            <th scope="row" className="w-44 py-1.5 pr-3 text-left align-middle font-normal text-on-surface-variant">
              {r.label}
            </th>
            <td className="py-1.5 align-middle">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-block h-2.5 rounded-full bg-[color:var(--color-info-border)]"
                  style={{ width: `${Math.max(3, (r.count / max) * 100)}%` }}
                />
                <span className="num text-on-surface-variant">{r.count}</span>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ---------------------------------------------------------------------------
// Report body: verified-audit-market (data/a11y/agencies.json via stats).
// Unchanged from before the multi-report refactor.
// ---------------------------------------------------------------------------
function VerifiedAuditMarketBody({ meta }: { meta: ReportMeta }) {
  const pct = (n: number) => Math.round((n / stats.total) * 100)
  const e = stats.evidence

  return (
    <>
      {/* The dateline's trailing text ("catalog records") is static JSX text,
          not an interpolated expression — kept that way deliberately so the
          SSR output for this report stays byte-identical to before the
          multi-report refactor (an interpolated trailing string would add an
          extra hydration comment marker that was not there before). */}
      <p className="mt-2 text-sm text-on-surface-variant">
        Updated <span className="num">{meta.updated}</span> · computed from{' '}
        <span className="num">{stats.total}</span> catalog records
      </p>
      <p className="lede">{meta.dek}</p>

      {/* Honest framing up front (§21): say what this is and, just as loudly,
          what it is not. */}
      <div className="mt-6 rounded-xl border border-[color:var(--color-info-border)] bg-[color:var(--color-info-soft)] p-4 text-sm text-on-surface-variant">
        <p>
          <strong>What this is.</strong> An analysis of the Verscala catalog as a dataset: who is
          listed, where they are based, which standards they name, and — the part most directories skip
          — what independent evidence backs each listing.
        </p>
        <p className="mt-2">
          <strong>What this is not.</strong> It is not a ranking or accessibility score of anyone&rsquo;s
          website. We have no scan corpus of third-party sites, so there are no site scores here to
          invent. Every figure below is counted from our own records and is only as complete as the
          catalog itself.
        </p>
      </div>

      <section className="mt-8">
        <h2 className="h2">The catalog at a glance</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile value={stats.total} label="Listed specialists" />
          <StatTile value={stats.hqCountries.count} label="Headquarters countries" note={`${stats.countriesCovered} covered by service area`} />
          <StatTile value={e.recordsWithAnyCert} label="With a verifiable credential" note={`${pct(e.recordsWithAnyCert)}% of listings`} />
          <StatTile value={e.recordsWithNamedAuditorStatement} label="Named in a published statement" note={`${pct(e.recordsWithNamedAuditorStatement)}% of listings`} />
        </div>
      </section>

      <section className="mt-10 max-w-3xl">
        <h2 className="h2">Where the specialists are based</h2>
        <p className="max-w-prose text-sm text-on-surface-variant">
          Headquarters country of each listing. The market the catalog has reached so far is
          concentrated in the EAA/BFSG and US-Section-508 economies — Germany and the United States lead,
          with Poland, France, the United Kingdom and the Netherlands close behind.
        </p>
        <BarList
          caption="Number of listed specialists by headquarters country"
          rows={stats.hqCountries.distribution.map((c) => ({ key: c.code, label: c.name, count: c.count }))}
        />
      </section>

      <section className="mt-10 max-w-3xl">
        <h2 className="h2">By which standard they work</h2>
        <p className="max-w-prose text-sm text-on-surface-variant">
          Standards each specialist declares it audits against (a listing can name several). WCAG 2.2 is
          the near-universal baseline; the European harmonised standard EN 301 549 and the EAA follow,
          reflecting where regulatory demand is sharpest.
        </p>
        <BarList
          caption="Number of listed specialists by declared standard"
          rows={stats.standards.map((s) => ({ key: s.slug, label: s.label, count: s.count }))}
        />
      </section>

      <section className="mt-10 max-w-3xl">
        <h2 className="h2">By what evidence they are listed</h2>
        <p className="max-w-prose text-sm text-on-surface-variant">
          A directory is only as trustworthy as the proof behind each entry. The strongest evidence we
          record is being named as the auditor in someone else&rsquo;s <em>published</em> accessibility
          statement — evidence that lives on a third party&rsquo;s domain, not the agency&rsquo;s own.{' '}
          <span className="num">{e.recordsWithNamedAuditorStatement}</span> of{' '}
          <span className="num">{stats.total}</span> listings carry exactly that.
        </p>
        <BarList
          caption="Listed specialists by type of verifiable credential"
          rows={[
            { key: 'statement', label: 'Named in a published statement', count: e.certKinds['statement-named-auditor'] ?? 0 },
            { key: 'bitv', label: 'BIK BITV-Test Prüfstelle', count: e.certKinds['bitv-pruefstelle'] ?? 0 },
            { key: 'iaap-org', label: 'IAAP organisational member', count: e.certKinds['iaap-org-member'] ?? 0 },
            { key: 'dhs', label: 'DHS Trusted Tester', count: e.certKinds['dhs-trusted-tester'] ?? 0 },
            { key: 'iaap-staff', label: 'IAAP-certified staff', count: e.certKinds['iaap-certified-staff'] ?? 0 },
          ]}
        />
        <h3 className="mt-6 text-base font-semibold text-on-surface">Who published that statement</h3>
        <p className="max-w-prose text-sm text-on-surface-variant">
          For the {e.recordsWithNamedAuditorStatement} named-auditor statements, we record who declared
          it — because &ldquo;a public body named them&rdquo; and &ldquo;a private company named
          them&rdquo; are different strengths of evidence, and we refuse to blur the two.
        </p>
        <BarList
          caption="Named-auditor statements by declarant type"
          rows={[
            { key: 'public', label: 'Public body', count: e.namedAuditorByDeclarant['public-body'] ?? 0 },
            { key: 'private', label: 'Private organisation', count: e.namedAuditorByDeclarant['private'] ?? 0 },
            { key: 'unknown', label: 'Declarant not named', count: e.namedAuditorByDeclarant['unknown'] ?? 0 },
          ]}
        />
      </section>

      <section className="mt-10 max-w-3xl">
        <h2 className="h2">What we deliberately do not claim</h2>
        <p className="max-w-prose text-sm text-on-surface-variant">
          The honest shape of a dataset includes its gaps. Two fields are populated only where a source
          proves them, and left empty otherwise rather than guessed:
        </p>
        <ul className="mt-4 space-y-3 text-sm text-on-surface-variant">
          <li className="rounded-xl border border-outline-variant p-4">
            <strong className="text-on-surface">Price.</strong> We publish a price band for only{' '}
            <span className="num">{stats.priceBands.withBand}</span> of{' '}
            <span className="num">{stats.total}</span> listings — the{' '}
            <span className="num">{stats.priceBands.withoutBand}</span> others have no verifiable
            published price, so we show none. A band is never inferred from a company&rsquo;s size or
            country.
          </li>
          <li className="rounded-xl border border-outline-variant p-4">
            <strong className="text-on-surface">Founding year.</strong>{' '}
            <span className="num">{stats.founded.withYear}</span> listings have a founding year we could
            verify against an imprint, register, or company-history page (the oldest dates to{' '}
            <span className="num">{stats.founded.oldest}</span>, the median to{' '}
            <span className="num">{stats.founded.median}</span>); the remaining{' '}
            <span className="num">{stats.founded.withoutYear}</span> are left blank rather than filled
            from an unverified third-party profile.
          </li>
        </ul>
      </section>

      <section className="mt-10 max-w-3xl">
        <h2 className="h2">How this was made</h2>
        <p className="max-w-prose text-sm text-on-surface-variant">
          Every number on this page is computed at build time from{' '}
          <span className="font-mono text-xs">data/a11y/agencies.json</span> by a single aggregator
          script — nothing here is transcribed by hand, and a test recomputes the figures from the
          catalog and fails if the published snapshot drifts. Each record in the catalog carries at
          least one cited source; across all {stats.total} listings there are{' '}
          <span className="num">{stats.sources.totalRefs}</span> source references, and{' '}
          <span className="num">{stats.sources.recordsWithMultiple}</span> listings stand on two or
          more.
        </p>
        <p className="mt-3 max-w-prose text-sm text-on-surface-variant">
          How each field is verified — and its limits — is documented in our{' '}
          <Link className="underline underline-offset-2" to={paths.methodology()}>
            methodology
          </Link>
          . You can browse the underlying records in the{' '}
          <Link className="underline underline-offset-2" to={paths.agencies()}>
            directory
          </Link>
          .
        </p>
      </section>

      <p className="mt-10 text-sm">
        <Link className="btn" to={paths.scan()}>
          Scan your website
        </Link>{' '}
        <span className="ml-2 text-on-surface-variant">
          Free instant check, then find a verified specialist from this dataset.
        </span>
      </p>
    </>
  )
}

// ---------------------------------------------------------------------------
// Report body: en301549-automation-coverage (data/a11y/en301549-coverage.json
// via en301549Stats, computed by scripts/en301549-report-data.mjs).
// ---------------------------------------------------------------------------
function En301549AutomationBody({ meta }: { meta: ReportMeta }) {
  const s = en301549Stats

  return (
    <>
      <p className="mt-2 text-sm text-on-surface-variant">
        Updated <span className="num">{meta.updated}</span> · computed from{' '}
        <span className="num">{s.total}</span> EN 301 549 criteria
      </p>
      <p className="lede">{meta.dek}</p>

      {/* Honest framing up front (§21) — the same principle as the first
          report's box, with this report's own content. */}
      <div className="mt-6 rounded-xl border border-[color:var(--color-info-border)] bg-[color:var(--color-info-soft)] p-4 text-sm text-on-surface-variant">
        <p>
          <strong>What this is.</strong> A criterion-by-criterion map of EN 301 549 chapter 9 (the
          web-accessibility chapter referenced by the European Accessibility Act): for each of the{' '}
          {s.total} success criteria, whether an automated check exists — an axe-core rule, one of
          Verscala&rsquo;s own worker checks, or both — and where automation stops entirely.
        </p>
        <p className="mt-2">
          <strong>What this is not.</strong> &ldquo;Automated&rdquo; means <em>a test exists that can
          find failures</em>, not that passing it proves conformance. An automated pass never certifies
          a page as accessible — it only means the specific things a machine can check did not fail. The{' '}
          {s.manualOnly.count} criteria below with no automated check at all still need a human, and so
          do the {s.automated.count} with one, for everything the check cannot see.
        </p>
      </div>

      <section className="mt-8">
        <h2 className="h2">The chapter at a glance</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile value={s.total} label="EN 301 549 ch.9 criteria" note="Web (chapter 9), V3.2.1" />
          <StatTile value={`${s.automated.percent}%`} label="Have an automated check" note={`${s.automated.count} of ${s.total} criteria`} />
          <StatTile value={s.byStatus.axe} label="Covered by axe-core alone" />
          <StatTile value={s.byStatus.ours + s.byStatus.both} label="With our own worker check" note={`${s.byStatus.both} also covered by axe-core`} />
        </div>
      </section>

      <section className="mt-10 max-w-3xl">
        <h2 className="h2">Coverage by WCAG principle</h2>
        <p className="max-w-prose text-sm text-on-surface-variant">
          EN 301 549&rsquo;s web chapter incorporates WCAG&rsquo;s four organising principles —
          Perceivable, Operable, Understandable, Robust — grouped here by the first digit of each
          criterion&rsquo;s WCAG number, an objective, publicly documented split, not an editorial one.
          Automation coverage is uneven across them: structural and interface-level requirements
          automate more readily than judgement calls about meaning.
        </p>
        <BarList
          caption="EN 301 549 chapter 9 criteria with an automated check, by WCAG principle"
          rows={s.principles.map((p) => ({
            key: p.key,
            label: `${p.title} (${p.automated}/${p.total})`,
            count: p.automated,
          }))}
        />
      </section>

      <section className="mt-10 max-w-3xl">
        <h2 className="h2">What automation cannot prove</h2>
        <p className="max-w-prose text-sm text-on-surface-variant">
          These <span className="num">{s.manualCriteria.length}</span> criteria have{' '}
          <strong>no automated check at all</strong> in our data — not a gap in our tooling specifically,
          but the honest state of automated accessibility testing generally: judging whether an
          alternative is truly equivalent, whether an error message is genuinely helpful, or whether a
          navigation pattern stays predictable is not something a script can decide. Every one of these
          needs a human reviewer, every time.
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {s.manualCriteria.map((c) => (
            <li key={c.wcag} className="rounded-lg border border-outline-variant p-3 text-sm">
              <span className="num font-mono text-xs text-on-surface-variant">{c.wcag}</span>{' '}
              <span className="text-on-surface">{c.title}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 max-w-3xl">
        <h2 className="h2">Where our own checks go beyond bare axe-core</h2>
        <p className="max-w-prose text-sm text-on-surface-variant">
          <span className="num">{s.ownModules.length}</span> criteria get an automated check only
          because Verscala&rsquo;s own worker code adds one — axe-core&rsquo;s static-markup rules do
          not reach real-browser behaviour like keyboard traps, focus order, or resize/reflow at all.
          Each of these is a heuristic with a named, documented limitation, not a silent guess — the full
          caveat for each check is on its{' '}
          <Link className="underline underline-offset-2" to={paths.wcag()}>
            criterion page
          </Link>
          .
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {s.ownModules.map((m) => (
            <li key={m.wcag} className="rounded-lg border border-outline-variant p-3 text-sm">
              <span className="num font-mono text-xs text-on-surface-variant">{m.wcag}</span>{' '}
              <span className="text-on-surface">{m.title}</span>
              <div className="mt-1 font-mono text-xs text-on-surface-variant">{m.ours}</div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 max-w-3xl">
        <h2 className="h2">Why Verscala does not publish site scores</h2>
        <p className="max-w-prose text-sm text-on-surface-variant">
          With only {s.automated.percent}% of EN 301 549&rsquo;s web criteria having any automated check
          — and none of those checks proving conformance on their own — a single numeric
          &ldquo;accessibility score&rdquo; for a site would compress a mostly-manual standard into a
          number automation cannot honestly produce. That is why Verscala&rsquo;s own scanner reports
          findings against the rules it actually ran, not a score, and why our{' '}
          <Link className="underline underline-offset-2" to={paths.methodology()}>
            methodology
          </Link>{' '}
          and{' '}
          <Link className="underline underline-offset-2" to={paths.accessibilityStatement()}>
            accessibility statement
          </Link>{' '}
          name the same {s.automated.count}/{s.total} figure, not a friendlier one.
        </p>
      </section>

      <section className="mt-10 max-w-3xl">
        <h2 className="h2">How this was made</h2>
        <p className="max-w-prose text-sm text-on-surface-variant">
          Every number on this page is computed at build time from{' '}
          <span className="font-mono text-xs">data/a11y/en301549-coverage.json</span> — generated from{' '}
          {s.generatedFrom} — by a single aggregator script, separate from the one behind our other
          report; a test recomputes the figures from that same source and fails if the published
          snapshot drifts. This is the identical dataset that drives our{' '}
          <Link className="underline underline-offset-2" to={paths.methodology()}>
            methodology
          </Link>{' '}
          page and the per-criterion pages under{' '}
          <Link className="underline underline-offset-2" to={paths.wcag()}>
            /wcag/
          </Link>
          , read once here as a single narrative instead of a lookup table.
        </p>
      </section>

      <p className="mt-10 text-sm">
        <Link className="btn" to={paths.scan()}>
          Scan your website
        </Link>{' '}
        <span className="ml-2 text-on-surface-variant">
          See exactly which of these {s.total} criteria our free scan actually checked on your site.
        </span>
      </p>
    </>
  )
}

// ---------------------------------------------------------------------------
// Report body: jurisdiction-coverage-gap — a SYNTHESIS of
// data/a11y/agencies.json (report 1's source) and worker/lib/jurisdiction.js
// (the scanner's own jurisdiction list), via jurisdictionStats, computed by
// scripts/jurisdiction-report-data.mjs.
// ---------------------------------------------------------------------------
function JurisdictionCoverageGapBody({ meta }: { meta: ReportMeta }) {
  const j = jurisdictionStats
  const hasGap = j.uncovered.count > 0

  return (
    <>
      <p className="mt-2 text-sm text-on-surface-variant">
        Updated <span className="num">{meta.updated}</span> · computed from{' '}
        <span className="num">{j.totalJurisdictions}</span> jurisdictions
      </p>
      <p className="lede">{meta.dek}</p>

      {/* Honest framing up front (§21), same principle as the other two
          reports' boxes: this is about the CATALOG's composition, not a claim
          about the real world. */}
      <div className="mt-6 rounded-xl border border-[color:var(--color-info-border)] bg-[color:var(--color-info-soft)] p-4 text-sm text-on-surface-variant">
        <p>
          <strong>What this is.</strong> A join of two datasets Verscala already maintains: the{' '}
          {j.totalJurisdictions} jurisdictions its own scanner treats as legally requiring a website
          accessibility statement (the same list used to weight scan findings), crossed against how many
          catalog specialists actually list that country under their service area.
        </p>
        <p className="mt-2">
          <strong>What this is not.</strong> A jurisdiction with no listed specialist does not mean no
          specialist exists there — it means none is in <em>our</em> catalog yet. This page counts only
          our own records, the same discipline as our other reports: nothing here is inferred about
          agencies we have not verified and listed.
        </p>
      </div>

      <section className="mt-8">
        <h2 className="h2">The gap at a glance</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile value={j.totalJurisdictions} label="Jurisdictions requiring a statement" note="EU/EEA, EAA transposition or equivalent" />
          <StatTile value={j.uncovered.count} label="With zero catalog specialists" />
          <StatTile
            value={j.thinnestCoverage?.agencyCount ?? '—'}
            label="Thinnest coverage"
            note={j.thinnestCoverage ? j.thinnestCoverage.jurisdictions.join(', ') : undefined}
          />
          <StatTile
            value={j.deepestCoverage?.agencyCount ?? '—'}
            label="Deepest coverage"
            note={j.deepestCoverage ? j.deepestCoverage.jurisdictions.join(', ') : undefined}
          />
        </div>
      </section>

      <section className="mt-10 max-w-3xl">
        <h2 className="h2">Jurisdictions with zero catalog coverage</h2>
        {hasGap ? (
          <>
            <p className="max-w-prose text-sm text-on-surface-variant">
              These <span className="num">{j.uncovered.count}</span> jurisdictions legally require an
              accessibility statement, and the Verscala catalog currently lists no specialist serving
              any of them:
            </p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {j.uncovered.jurisdictions.map((r) => (
                <li key={r.country} className="rounded-lg border border-outline-variant p-3 text-sm">
                  <span className="font-medium text-on-surface">{r.name}</span>{' '}
                  <span className="text-on-surface-variant">— {r.law}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="max-w-prose text-sm text-on-surface-variant">
            None, currently — we checked all {j.totalJurisdictions} rather than assume this list would be
            empty or non-empty. Every jurisdiction the scanner treats as requiring a statement has at
            least one catalog specialist serving it today. That is a coverage floor, not a depth claim:
            see the breakdown below for how thin some of that coverage still is.
          </p>
        )}
      </section>

      <section className="mt-10 max-w-3xl">
        <h2 className="h2">How coverage breaks down, jurisdiction by jurisdiction</h2>
        <p className="max-w-prose text-sm text-on-surface-variant">
          Number of catalog specialists whose declared service area (
          <span className="font-mono text-xs">countriesServed</span>) includes each jurisdiction. Germany
          leads by a wide margin; several jurisdictions — Finland and Norway among them — currently have
          only {j.thinnestCoverage?.agencyCount ?? 0} each.
        </p>
        <BarList
          caption="Catalog specialists serving each jurisdiction that legally requires an accessibility statement"
          rows={j.covered.jurisdictions.map((r) => ({ key: r.country, label: r.name, count: r.agencyCount }))}
        />
      </section>

      <section className="mt-10 max-w-3xl">
        <h2 className="h2">How sure we are about each law citation</h2>
        <p className="max-w-prose text-sm text-on-surface-variant">
          <span className="num">{j.verifiedLawCount}</span> of {j.totalJurisdictions} law citations —
          Germany&rsquo;s BFSG — is checked against its primary legal text and, in our scanner, carries a
          specific article citation. The other <span className="num">{j.unverifiedLawCount}</span> are
          shown as-is from public legal sources but not yet cross-checked line-by-line against the primary
          statute the way Germany&rsquo;s was. <code>verified</code> here describes the quality of the{' '}
          <em>legal citation</em> only — it is not a statement about whether the underlying requirement to
          publish a statement is real (it is, for all {j.totalJurisdictions}) and never a statement about
          any penalty, which this page does not show for any jurisdiction, verified or not.
        </p>
      </section>

      <section className="mt-10 max-w-3xl">
        <h2 className="h2">Find or request a specialist</h2>
        <p className="max-w-prose text-sm text-on-surface-variant">
          Browse catalog specialists by country, or tell us which jurisdiction you need coverage for and
          we will help you find one.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {j.covered.jurisdictions.map((r) => {
            const c = countryByCode(r.country)
            return c ? (
              <Link key={r.country} to={paths.country(c)} className="chip hover:border-outline">
                {r.name} · {r.agencyCount}
              </Link>
            ) : null
          })}
        </div>
      </section>

      <section className="mt-10 max-w-3xl">
        <h2 className="h2">How this was made</h2>
        <p className="max-w-prose text-sm text-on-surface-variant">
          This report joins two datasets Verscala already publishes elsewhere, rather than introducing
          a third: the {j.totalJurisdictions}-jurisdiction list from{' '}
          <span className="font-mono text-xs">worker/lib/jurisdiction.js</span> — the same module our
          scanner uses at scan time to decide when a missing accessibility statement is a legally decisive
          finding, not just an invented list for this page — crossed against{' '}
          <span className="font-mono text-xs">data/a11y/agencies.json</span>, the catalog behind our{' '}
          <Link className="underline underline-offset-2" to={paths.reportDoc('verified-audit-market')}>
            first report
          </Link>
          . A build-time aggregator computes every number here, and a test recomputes them from both
          source files and fails if the published snapshot drifts.
        </p>
      </section>

      <p className="mt-10 text-sm">
        <Link className="btn" to={paths.requestQuote()}>
          Request a quote
        </Link>{' '}
        <span className="ml-2 text-on-surface-variant">
          Tell us your jurisdiction and we will route you to a verified specialist, or flag the gap.
        </span>
      </p>
    </>
  )
}

const REPORT_BODIES: Record<string, (props: { meta: ReportMeta }) => JSX.Element> = {
  'verified-audit-market': VerifiedAuditMarketBody,
  'jurisdiction-coverage-gap': JurisdictionCoverageGapBody,
  'en301549-automation-coverage': En301549AutomationBody,
}

function jsonLdFor(meta: ReportMeta, path: string) {
  const datasetLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: meta.title,
    description: meta.dek,
    creator: { '@type': 'Organization', name: SITE_NAME },
    dateModified: meta.updated,
    isAccessibleForFree: true,
    measurementTechnique: meta.measurementTechnique,
    variableMeasured: meta.variableMeasured,
    mainEntityOfPage: `${ORIGIN}${path}`,
  }
  const reportLd = {
    '@context': 'https://schema.org',
    '@type': 'Report',
    headline: meta.title,
    description: meta.dek,
    datePublished: meta.updated,
    dateModified: meta.updated,
    author: { '@type': 'Organization', name: SITE_NAME },
    publisher: { '@type': 'Organization', name: SITE_NAME },
    mainEntityOfPage: `${ORIGIN}${path}`,
  }
  return { datasetLd, reportLd }
}

export default function ReportDocPage() {
  const { slug } = useParams()
  const meta = reportBySlug(slug!)
  if (!meta) return null
  const path = paths.reportDoc(meta.slug)
  const Body = REPORT_BODIES[meta.slug]
  const { datasetLd, reportLd } = jsonLdFor(meta, path)

  return (
    <Layout
      title={`${meta.title} — Verscala`}
      description={meta.dek}
      path={path}
      crumbs={[{ name: 'Reports', path: paths.reports() }]}
    >
      <JsonLd data={datasetLd} />
      <JsonLd data={reportLd} />

      <h1 className="h1">{meta.title}</h1>

      {/* The dateline + dek are rendered INSIDE each per-slug body, not here —
          verified-audit-market's dateline ends in static text ("catalog
          records"), and keeping that text static (not an interpolated
          {meta.recordsLabel}) is what keeps its SSR output byte-identical to
          before this file supported more than one report. */}
      {Body ? <Body meta={meta} /> : null}
    </Layout>
  )
}
