import { Layout } from '@/components/Layout'
import { paths } from '@/lib/data'

// Контактный email — единственный реальный канал на сейчас (нет форм,
// нет бэкенда). Доменная почта появилась 2026-08-08 (M365, куплена вместе
// с verscala.com) — адрес обновлён с личного gmail на info@verscala.com.
const CONTACT_EMAIL = 'info@verscala.com'

export default function ContactPage() {
  return (
    <Layout
      title="Contact"
      description="How to reach Verscala — corrections, listing updates, and general enquiries."
      path={paths.contact()}
      crumbs={[]}
    >
      <h1 className="h1">Contact</h1>
      <div className="prose-guide mt-6 max-w-2xl">
        <p>
          There is no contact form or support ticketing system on this site yet — email is the
          only channel:
        </p>
        <p>
          <a
            className="text-lg font-semibold text-[color:var(--color-primary)] underline decoration-outline-variant underline-offset-2 hover:decoration-current"
            href={`mailto:${CONTACT_EMAIL}`}
          >
            {CONTACT_EMAIL}
          </a>
        </p>

        <h2>What to email us about</h2>
        <ul>
          <li>
            <strong>Correcting or updating a listing</strong> — a wrong fact, a closed business, a
            changed URL, or details you'd like added (city, price band, certifications) with a
            link we can verify them against.
          </li>
          <li>
            <strong>Requesting removal</strong> — if your agency is listed and you'd rather it
            wasn't, tell us and we'll take it down.
          </li>
          <li>
            <strong>Reporting an error in a guide</strong> — every legal fact in our guides is
            meant to be sourced; if one looks wrong, point us to why.
          </li>
          <li>
            <strong>Anything else</strong> — general questions about the directory.
          </li>
        </ul>

        <h2>Response time</h2>
        <p>
          This is a small, manually operated project — expect a reply within a few days, not
          instantly.
        </p>
      </div>
    </Layout>
  )
}
