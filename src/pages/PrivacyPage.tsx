import { Link } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { paths } from '@/lib/data'

export default function PrivacyPage() {
  return (
    <Layout
      title="Privacy Policy"
      description="What Verscala does and does not collect — including the accessibility scanner. Static catalog, no accounts, no tracking scripts."
      path={paths.privacy()}
      crumbs={[]}
    >
      <h1 className="h1">Privacy Policy</h1>
      <div className="prose-guide mt-6 max-w-2xl">
        <p>
          <em>Last reviewed: 2026-08-06.</em> This describes what actually happens on this site
          today, not a generic template.
        </p>

        <h2>Data controller</h2>
        <p>
          Full legal identity and contact details for the operator of this site are published in
          our <Link className="underline underline-offset-2" to={paths.imprint()}>Imprint</Link>.
          For any privacy enquiry, use the email address on our{' '}
          <Link className="underline underline-offset-2" to={paths.contact()}>Contact</Link> page.
        </p>

        <h2>Browsing the catalog</h2>
        <ul>
          <li>No analytics or tracking scripts are loaded on any catalog page.</li>
          <li>No cookies are set by any catalog page.</li>
          <li>There are no user accounts or logins.</li>
          <li>
            Nothing you do while browsing — pages viewed, filters used, searches typed — is
            recorded or transmitted. The client-side filters on listing pages run entirely in your
            browser against data already loaded with the page.
          </li>
        </ul>

        <h2>If you run an accessibility scan</h2>
        <p>
          The <Link className="underline underline-offset-2" to={paths.scan()}>scan tool</Link> is
          a separate feature from the static catalog above, and does send data to our server:
        </p>
        <ul>
          <li>
            <strong>The URL you submit</strong>, and the scan results (pages visited, accessibility
            findings, score) are stored in our database so the report can be shown to you. Scans
            are kept for up to 90 days, after which they're automatically deleted. The report page
            itself is private: it's reachable only via an unguessable link, and is excluded from
            search engine indexing.
          </li>
          <li>
            <strong>No account or email is required</strong> to run a scan, and the scan form does
            not ask for one.
          </li>
          <li>
            <strong>Your IP address</strong> is used briefly to limit how many scans can be started
            from one IP address or against one target site per hour (abuse prevention). This
            rate-limit record expires automatically after an hour and is not linked to your scan
            report in the database.
          </li>
          <li>
            <strong>Bot verification (Cloudflare Turnstile):</strong> when active, the scan page
            loads a script from <code>challenges.cloudflare.com</code> and sends your IP address to
            Cloudflare to confirm you're not a bot before starting a scan. That check is subject to{' '}
            <a
              className="underline underline-offset-2"
              href="https://www.cloudflare.com/privacypolicy/"
              target="_blank"
              rel="noopener noreferrer nofollow"
            >
              Cloudflare's own privacy policy
            </a>
            , not ours, and may set its own cookie in your browser.
          </li>
          <li>
            <strong>Plain-language explanations of findings</strong>, where shown, are generated
            per issue type (e.g. "missing image alt text"), not per scanned site — nothing about
            your specific site or URL is sent beyond what's needed to generate that generic
            explanation, and the result is cached and reused for anyone who hits the same issue
            type.
          </li>
        </ul>

        <h2>What is collected if you email us</h2>
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
          If we later add analytics, a lead-routing form, scan report deletion controls, or any
          other feature that changes what personal data is collected, this page will be updated to
          describe it accurately before that feature goes live — not after.
        </p>
      </div>
    </Layout>
  )
}
