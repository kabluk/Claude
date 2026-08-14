// RFQ landing page (A2-LEAD-FORM). The form validates client-side and previews
// matching agencies from the already-bundled catalog (no network) — sending
// the request to POST /api/lead (A2-LEAD-API) is a separate, explicit second
// step ("Send my request") so the visitor sees who would receive it first.
import { useSearchParams } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { LeadForm } from '@/components/LeadForm'
import { paths } from '@/lib/data'

export default function RequestQuotePage() {
  // Optional deep link from a scan report (?scanId=…) — client-side only param,
  // same pattern as /report/:id: not part of the static build, no getStaticPaths.
  const [searchParams] = useSearchParams()
  const scanId = searchParams.get('scanId') ?? undefined

  return (
    <Layout
      title="Request accessibility quotes"
      description="Tell us your country, standard, service and budget — see which verified agencies in the Verscala directory match, free."
      path={paths.requestQuote()}
      crumbs={[]}
    >
      <h1 className="h1">Request accessibility quotes</h1>
      <p className="lede">
        One form, matched against the directory's agencies. See who would match first — nothing
        goes out until you choose to send it.
      </p>

      <div
        role="note"
        className="mt-4 max-w-2xl rounded-md border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant"
      >
        <strong>Two steps, no surprises.</strong> "Preview matching agencies" only reads the
        catalog already on this page — nothing is sent. Only "Send my request", after you've seen
        the matches, submits your request. We currently notify agencies that have claimed and
        verified their listing; others may not respond. You can always use the{' '}
        <a className="underline underline-offset-2" href={paths.contact()}>
          contact email
        </a>{' '}
        or browse the{' '}
        <a className="underline underline-offset-2" href={paths.agencies()}>
          full agency directory
        </a>{' '}
        directly.
      </div>

      <div className="mt-6">
        <LeadForm scanId={scanId} />
      </div>
    </Layout>
  )
}
