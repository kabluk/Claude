import { Link } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { paths } from '@/lib/data'

// Легальные реквизиты (юрлицо/ФИО, адрес, регистрация, VAT) не выдуманы —
// их может дать только владелец. Страница честно помечена как ожидающая
// данных и закрыта от индексации (index=false), пока их нет. Как только
// реквизиты появятся: заполнить блок ниже, снять index={false} в Layout.
export default function ImprintPage() {
  return (
    <Layout
      title="Imprint"
      description="Legal notice for AccessAtlas."
      path={paths.imprint()}
      index={false}
      crumbs={[]}
    >
      <h1 className="h1">Imprint</h1>
      <div className="prose-guide mt-6 max-w-2xl">
        <p>
          The legal identity and contact details required here (operator name, address, and — for
          markets that require it — commercial register and VAT details) are being finalised and
          will be published on this page before the site's public launch.
        </p>
        <p>
          In the meantime, reach us via the email address on our{' '}
          <Link className="underline underline-offset-2" to={paths.contact()}>
            Contact
          </Link>{' '}
          page.
        </p>
      </div>
    </Layout>
  )
}
