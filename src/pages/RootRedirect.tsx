import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Head } from 'vite-react-ssg'
import { LANGS, type Lang } from '@/lib/types'

// Корень определяет язык. На Netlify это делает редирект по Accept-Language
// (netlify.toml, force) — эта страница остаётся запасным путём для превью
// и работает без JavaScript через обычные ссылки.
export function RootRedirect() {
  const navigate = useNavigate()

  useEffect(() => {
    const prefs = (navigator.languages ?? [navigator.language]).map((l) =>
      l.slice(0, 2).toLowerCase(),
    )
    const found = prefs.find((p) => (LANGS as string[]).includes(p)) as Lang | undefined
    navigate(`/${found ?? 'en'}/`, { replace: true })
  }, [navigate])

  return (
    <div className="phone">
      <Head>
        <title>DETNAV</title>
      </Head>
      <main>
        <p className="brand" style={{ marginBottom: 24 }}>
          <i />
          DETNAV
        </p>
        <Link className="door" to="/en/">
          <b>English</b>
        </Link>
        <Link className="door y" to="/es/">
          <b>Español</b>
        </Link>
        <Link className="door g" to="/ru/">
          <b>Русский</b>
        </Link>
      </main>
    </div>
  )
}
