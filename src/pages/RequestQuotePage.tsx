// RFQ landing page (A2-LEAD-FORM). Pure UI: the form validates client-side and
// previews matching agencies from the already-bundled catalog, but does not
// submit anywhere — POST /api/lead doesn't exist yet (A2-LEAD-API, INTERFACES.md §2).
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
      description="Tell us your country, standard, service and budget — see which verified agencies in the AccessAtlas directory match, free."
      path={paths.requestQuote()}
      crumbs={[]}
    >
      <h1 className="h1">Request accessibility quotes</h1>
      <p className="lede">
        One form, matched against the directory's verified agencies. This build previews matches
        instantly from catalog data already on this page — it does not send your request to
        agencies yet.
      </p>

      <div
        role="note"
        className="mt-4 max-w-2xl rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
      >
        <strong>Nothing is sent when you submit this form.</strong> Live request routing to
        agencies (email, tracking, responses) isn't connected on this build. Until then, use the{' '}
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
