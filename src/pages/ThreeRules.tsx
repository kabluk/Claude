import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import LanguageToggle from '../components/LanguageToggle'

/**
 * ThreeRules — Public free page, available without authentication.
 * Contains general information about what detained individuals commonly do,
 * published by immigrant rights organizations. Not legal advice.
 */
export default function ThreeRules() {
  const { t } = useTranslation('navigator')
  const { t: tc } = useTranslation('common')

  const content = t('steps.three_rules', { returnObjects: true }) as {
    title: string
    description: string
    guidance: string
    tips: string[]
    sources: Array<{ label: string; url: string }>
  }

  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-bold text-brand-700 text-lg">Detention Navigator</Link>
        <div className="flex items-center gap-4">
          <LanguageToggle />
          <Link to="/auth" className="text-sm text-brand-600 font-medium hover:underline">
            {tc('nav.sign_in')}
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Free badge */}
        <div className="mb-4">
          <span className="text-xs font-semibold bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
            Бесплатно · Free
          </span>
        </div>

        <h1 className="text-3xl font-bold text-gray-900">{content.title}</h1>
        <p className="mt-3 text-gray-600 leading-relaxed">{content.description}</p>

        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          {tc('disclaimer.text')}
        </div>

        <div className="mt-8 prose prose-gray max-w-none">
          <div className="whitespace-pre-line text-gray-700 leading-relaxed text-[15px]">
            {content.guidance}
          </div>
        </div>

        {/* Tips */}
        {content.tips.length > 0 && (
          <div className="mt-8 bg-brand-50 border border-brand-100 rounded-xl p-5">
            <h2 className="font-semibold text-brand-900 mb-3">{tc('checklist.tips')}</h2>
            <ul className="space-y-2">
              {content.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-brand-800">
                  <span className="text-brand-500 mt-0.5 shrink-0">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Sources */}
        {content.sources.length > 0 && (
          <div className="mt-6">
            <h2 className="font-semibold text-gray-700 mb-3 text-sm">{tc('checklist.sources')}</h2>
            <div className="space-y-1">
              {content.sources.map((src, i) => (
                <a
                  key={i}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-brand-600 hover:text-brand-800 underline"
                >
                  {src.label}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 border-t border-gray-100 pt-8 text-center">
          <p className="text-gray-600 mb-4">
            Полный навигатор с 8 шагами доступен бесплатно после регистрации.
            <br />
            <span className="text-gray-400">
              The full 8-step navigator is available free after registration.
            </span>
          </p>
          <Link
            to="/auth"
            className="inline-block bg-brand-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors"
          >
            {tc('nav.sign_in')} / {tc('auth.sign_up')}
          </Link>
        </div>
      </div>
    </div>
  )
}
