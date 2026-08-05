import { Link } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { paths } from '@/lib/data'

export default function PrivacyPage() {
  return (
    <Layout
      title="Privacy Policy"
      description="What AccessAtlas does and does not collect. Static site, no accounts, no tracking scripts."
      path={paths.privacy()}
      crumbs={[]}
    >
      <h1 className="h1">Privacy Policy</h1>
      <div className="prose-guide mt-6 max-w-2xl">
        <p>
          <em>Last reviewed: 2026-08-05.</em> This describes what actually happens on this site
          today, not a generic template.
        </p>

        <h2>Data controller</h2>
        <p>
          Full legal identity and contact details for the operator of this site are published in
          our <Link className="underline underline-offset-2" to={paths.imprint()}>Imprint</Link>.
          For any privacy enquiry, use the email address on our{' '}
          <Link className="underline underline-offset-2" to={paths.contact()}>Contact</Link> page.
        </p>

        <h2>What this site does not do</h2>
        <ul>
          <li>No analytics or tracking scripts are loaded on any page.</li>
          <li>No cookies are set by this site.</li>
          <li>There are no user accounts, no logins, and no forms that submit data anywhere.</li>
          <li>
            Nothing you do while browsing — pages viewed, filters used, searches typed — is
            recorded or transmitted by this site. The client-side filters on listing pages run
            entirely in your browser against data already loaded with the page.
          </li>
        </ul>

        <h2>What is collected</h2>
        <p>
          If you email us, we receive whatever your email contains (address, name if you give one,
          message body) through our email provider, and use it only to answer you or act on your
          request. We do not use that information for marketing and do not share it with third
          parties.
        </p>
        <p>
          Our hosting provider and any content-delivery network in front of this site will, like
          essentially every web server, log technical request data (IP address, user agent,
          timestamp) for operational and security purposes, under its own retention policy. We do
          not access, aggregate or analyse those logs for tracking purposes.
        </p>

        <h2>Links to other sites</h2>
        <p>
          Agency profiles and guides link out to agencies' own websites and to government sources
          (accessibility declarations, legislation). Those sites have their own privacy practices,
          which we don't control and this policy doesn't cover.
        </p>

        <h2>If this changes</h2>
        <p>
          If we later add analytics, a lead-routing form, or any feature that collects personal
          data, this page will be updated to describe it accurately before that feature goes live
          — not after.
        </p>
      </div>
    </Layout>
  )
}
