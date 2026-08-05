import { Link } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { paths } from '@/lib/data'

export default function NotFoundPage() {
  return (
    <Layout
      title="Page not found"
      description="This page doesn't exist on AccessAtlas."
      path="/404/"
      index={false}
      crumbs={[]}
    >
      <h1 className="h1">Page not found</h1>
      <p className="lede">
        The page you're looking for doesn't exist, or the link is out of date. Try one of these:
      </p>
      <ul className="mt-6 space-y-2">
        <li>
          <Link className="text-[color:var(--color-accent)] underline underline-offset-2" to={paths.countries()}>
            Browse agencies by country
          </Link>
        </li>
        <li>
          <Link className="text-[color:var(--color-accent)] underline underline-offset-2" to={paths.services()}>
            Browse by service
          </Link>
        </li>
        <li>
          <Link className="text-[color:var(--color-accent)] underline underline-offset-2" to={paths.agencies()}>
            See all agencies
          </Link>
        </li>
        <li>
          <Link className="text-[color:var(--color-accent)] underline underline-offset-2" to="/">
            Go to the homepage
          </Link>
        </li>
      </ul>
    </Layout>
  )
}
