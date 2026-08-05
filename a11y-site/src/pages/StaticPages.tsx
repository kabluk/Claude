// Служебные страницы: About / Contact / Privacy / Impressum / 404.
// About и Contact индексируются (E-E-A-T), Privacy и Impressum — noindex,follow,
// 404 — noindex. Ничего не выдумываем: реквизиты оператора — плейсхолдеры,
// которые владелец заполняет перед запуском (см. TODO ниже).

import { Link } from 'react-router-dom'
import { agencies, countries, paths } from '@dir/lib/data'
import { SITE_NAME } from '@dir/lib/seo'
import { Layout } from '@dir/components/Layout'

// TODO: заменить вместе с ORIGIN при покупке домена (seo.tsx,
// gen-a11y-sitemap.mjs) — адрес на домене-заглушке не работает.
export const CONTACT_EMAIL = 'contact@a11y-directory.example'

// Видимая пометка «заполнить перед запуском» — чтобы плейсхолдер невозможно
// было принять за настоящие реквизиты и невозможно было забыть.
function ToComplete({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 max-w-2xl rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-semibold">To be completed before launch</p>
      <div className="mt-1">{children}</div>
    </div>
  )
}

export function AboutPage() {
  return (
    <Layout
      title={`About ${SITE_NAME}`}
      description={`How ${SITE_NAME} verifies its ${agencies.length} listed digital-accessibility agencies: cited sources for every listing, no automated overlay widgets, free listings.`}
      path={paths.about()}
      crumbs={[]}
    >
      <h1 className="h1">About this directory</h1>
      <div className="prose-guide mt-6 max-w-3xl">
        <p>
          {SITE_NAME} is an independent catalog of {agencies.length} digital-accessibility
          agencies across {countries.length} countries — companies that audit, remediate and
          certify websites, apps and documents against WCAG, EN 301 549, Section 508, ADA, BFSG,
          RGAA and related standards.
        </p>
        <h2>How listings are verified</h2>
        <ul>
          <li>
            <strong>Every listing cites its sources.</strong> Each profile links to the evidence
            it was built from: the agency's own site plus, where available, independent
            confirmations such as IAAP organizational membership, the BIK BITV-Test list of
            Prüfstellen, the DHS Trusted Tester program, or a government accessibility statement
            naming the agency as its auditor.
          </li>
          <li>
            <strong>Nothing is invented.</strong> Fields we could not verify are left empty
            rather than guessed. Profiles below our evidence threshold are excluded from search
            indexing until they are complete.
          </li>
          <li>
            <strong>No overlay widgets.</strong> We list audit and remediation specialists only.
            Vendors whose primary product is an automated «accessibility overlay» are outside the
            scope of this directory.
          </li>
        </ul>
        <h2>How agencies get listed</h2>
        <p>
          Listings are free and added editorially — agencies do not pay to be included, and
          inclusion is not an endorsement. If you run an accessibility agency, you can{' '}
          <Link to={paths.contact()}>contact us</Link> to claim your profile, correct it, or
          request removal.
        </p>
        <h2>Corrections</h2>
        <p>
          Found an error — a wrong city, a dead link, an outdated certification? Please{' '}
          <Link to={paths.contact()}>tell us</Link>. We correct verified mistakes and note the
          source of the correction.
        </p>
      </div>
    </Layout>
  )
}

export function ContactPage() {
  return (
    <Layout
      title="Contact"
      description={`Contact ${SITE_NAME}: claim or correct an agency profile, request removal, or report an error.`}
      path={paths.contact()}
      crumbs={[]}
    >
      <h1 className="h1">Contact</h1>
      <div className="prose-guide mt-6 max-w-3xl">
        <p>
          Email is the fastest way to reach us:{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
        <h2>Agencies</h2>
        <p>
          To claim your profile, update details, or request removal, write from an address at the
          domain listed on your profile — that is how we verify you speak for the agency. Include
          the profile link and the change you need.
        </p>
        <h2>Everyone else</h2>
        <p>
          Corrections, questions about our <Link to={paths.about()}>verification method</Link>,
          or privacy requests (see the <Link to={paths.privacy()}>privacy policy</Link>) are all
          welcome at the same address.
        </p>
      </div>
    </Layout>
  )
}

export function PrivacyPage() {
  return (
    <Layout
      title="Privacy policy"
      description={`How ${SITE_NAME} handles data: no cookies, no analytics, no tracking; how listed-business data is sourced and how to request corrections or removal.`}
      path={paths.privacy()}
      index={false}
      crumbs={[]}
    >
      <h1 className="h1">Privacy policy</h1>
      <div className="prose-guide mt-6 max-w-3xl">
        <h2>What this site collects from visitors</h2>
        <p>
          Nothing beyond ordinary server logs. This is a static site: it sets no cookies, runs no
          analytics or advertising scripts, and embeds no third-party trackers. Our hosting
          provider may record standard request logs (IP address, user agent, requested URL) for
          security and operations; we do not use them to identify visitors.
        </p>
        <h2>Data about listed agencies</h2>
        <p>
          Profiles describe businesses, not private individuals, and are compiled from public
          sources: the agency's own website, certification registries, and public accessibility
          statements. Each profile cites its sources. The legal basis for this processing is
          legitimate interest (Art. 6(1)(f) GDPR) in operating a factual business directory.
        </p>
        <p>
          If a profile mentions you or your business and you want it corrected or removed,
          email us — see the <Link to={paths.contact()}>contact page</Link>. Removal requests
          from the listed business are honored.
        </p>
        <h2>Email</h2>
        <p>
          If you email us, we process your address and message only to reply, and do not add you
          to any mailing list.
        </p>
        <h2>Controller</h2>
        <ToComplete>
          <p>
            The data controller's name and address will be published here (and in the{' '}
            <Link className="underline underline-offset-2" to={paths.impressum()}>
              Impressum
            </Link>
            ) before the site goes live.
          </p>
        </ToComplete>
      </div>
    </Layout>
  )
}

export function ImpressumPage() {
  return (
    <Layout
      title="Impressum"
      description={`Legal notice (Impressum) for ${SITE_NAME}.`}
      path={paths.impressum()}
      index={false}
      crumbs={[]}
    >
      <h1 className="h1">Impressum</h1>
      <div className="prose-guide mt-6 max-w-3xl">
        <p>Legal notice pursuant to § 5 DDG (Germany) and equivalent EU provisions.</p>
        <ToComplete>
          <ul className="list-disc space-y-1 pl-5">
            <li>Operator name (person or legal entity)</li>
            <li>Postal address (a P.O. box is not sufficient under § 5 DDG)</li>
            <li>Email address and, if applicable, phone number</li>
            <li>If a company: legal form, registry court, registration number, VAT ID</li>
            <li>Person responsible for editorial content</li>
          </ul>
        </ToComplete>
        <p>
          Until launch, reach us at{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
        <h2>Liability for content</h2>
        <p>
          This directory lists businesses based on cited public sources and is provided for
          general information only; it is not legal advice and inclusion is not an endorsement.
          Despite careful checking we assume no liability for the content of external links —
          their operators remain responsible for their own pages. If you believe a listing is
          inaccurate, please <Link to={paths.contact()}>contact us</Link> and we will review it.
        </p>
      </div>
    </Layout>
  )
}

export function NotFoundPage() {
  return (
    <Layout
      title="Page not found"
      description="This page does not exist or has moved."
      path="/404/"
      index={false}
    >
      <h1 className="h1">Page not found</h1>
      <p className="lede">
        The page you asked for doesn't exist or has moved. It may have been renamed when the
        directory was reorganized.
      </p>
      <ul className="mt-6 list-disc space-y-1 pl-5 text-slate-700">
        <li>
          <Link className="underline underline-offset-2" to={paths.countries()}>
            Browse agencies by country
          </Link>
        </li>
        <li>
          <Link className="underline underline-offset-2" to={paths.services()}>
            Browse by service
          </Link>
        </li>
        <li>
          <Link className="underline underline-offset-2" to={paths.agencies()}>
            A–Z index of all {agencies.length} agencies
          </Link>
        </li>
        <li>
          <Link className="underline underline-offset-2" to="/guides/">
            Compliance guides
          </Link>
        </li>
      </ul>
    </Layout>
  )
}
