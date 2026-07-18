import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import LanguageToggle from '../components/LanguageToggle'

export default function Landing() {
  const { t } = useTranslation('landing')
  const { t: tc } = useTranslation('common')

  const faqItems = t('faq.items', { returnObjects: true }) as Array<{
    question: string
    answer: string
  }>

  const freeFeatures = t('pricing.free.features', { returnObjects: true }) as string[]
  const paidFeatures = t('pricing.paid.features', { returnObjects: true }) as string[]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-brand-700 text-lg">Detention Navigator</span>
        <div className="flex items-center gap-4">
          <LanguageToggle />
          <Link
            to="/three-rules"
            className="text-sm text-gray-600 hover:text-gray-900 hidden sm:block"
          >
            {tc('nav.three_rules')}
          </Link>
          <Link
            to="/auth"
            className="text-sm bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
          >
            {tc('nav.sign_in')}
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-50 to-white px-4 py-16 md:py-24 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight text-balance">
            {t('hero.headline')}
          </h1>
          <p className="mt-6 text-lg md:text-xl text-gray-600 text-balance">
            {t('hero.subheadline')}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/auth"
              className="bg-brand-600 text-white px-8 py-3 rounded-xl text-base font-semibold hover:bg-brand-700 transition-colors"
            >
              {t('hero.cta_primary')}
            </Link>
            <Link
              to="/three-rules"
              className="border border-brand-300 text-brand-700 px-8 py-3 rounded-xl text-base font-semibold hover:bg-brand-50 transition-colors"
            >
              {t('three_rules_promo.cta')}
            </Link>
          </div>
          <p className="mt-4 text-xs text-gray-400">{t('hero.disclaimer_inline')}</p>
        </div>
      </section>

      {/* Modules */}
      <section className="px-4 py-16 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-10">
            {t('modules.heading')}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Navigator */}
            <div className="border border-brand-100 rounded-2xl p-6 bg-brand-50">
              <div className="text-3xl mb-3">🧭</div>
              <h3 className="font-bold text-gray-900 text-lg">{t('modules.navigator.title')}</h3>
              <p className="mt-2 text-gray-600 text-sm">{t('modules.navigator.description')}</p>
            </div>
            {/* Evidence */}
            <div className="border border-gray-100 rounded-2xl p-6 bg-gray-50">
              <div className="flex items-start gap-2 mb-3">
                <span className="text-3xl">📁</span>
                <span className="text-xs font-semibold bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full mt-1">
                  {t('modules.evidence.badge')}
                </span>
              </div>
              <h3 className="font-bold text-gray-900 text-lg">{t('modules.evidence.title')}</h3>
              <p className="mt-2 text-gray-600 text-sm">{t('modules.evidence.description')}</p>
            </div>
            {/* Monitor */}
            <div className="border border-gray-100 rounded-2xl p-6 bg-gray-50">
              <div className="flex items-start gap-2 mb-3">
                <span className="text-3xl">📡</span>
                <span className="text-xs font-semibold bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full mt-1">
                  {t('modules.monitor.badge')}
                </span>
              </div>
              <h3 className="font-bold text-gray-900 text-lg">{t('modules.monitor.title')}</h3>
              <p className="mt-2 text-gray-600 text-sm">{t('modules.monitor.description')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Three Rules Promo */}
      <section className="px-4 py-12 bg-amber-50 border-y border-amber-100">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">{t('three_rules_promo.heading')}</h2>
          <p className="mt-3 text-gray-700">{t('three_rules_promo.text')}</p>
          <Link
            to="/three-rules"
            className="mt-5 inline-block border border-amber-400 bg-white text-amber-800 px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-100 transition-colors"
          >
            {t('three_rules_promo.cta')}
          </Link>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-4 py-16 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-10">
            {t('pricing.heading')}
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Free */}
            <div className="border border-gray-200 rounded-2xl p-6">
              <p className="font-semibold text-gray-500 text-sm">{t('pricing.free.name')}</p>
              <p className="mt-1 text-4xl font-bold text-gray-900">{t('pricing.free.price')}</p>
              <ul className="mt-5 space-y-2">
                {freeFeatures.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="text-green-500">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/auth"
                className="mt-6 block text-center border border-brand-300 text-brand-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-50 transition-colors"
              >
                {t('pricing.free.cta')}
              </Link>
            </div>
            {/* Paid */}
            <div className="border-2 border-brand-500 rounded-2xl p-6 bg-brand-50">
              <p className="font-semibold text-brand-700 text-sm">{t('pricing.paid.name')}</p>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-gray-900">{t('pricing.paid.price')}</span>
                <span className="text-gray-500 text-sm">{t('pricing.paid.period')}</span>
              </div>
              <ul className="mt-5 space-y-2">
                {paidFeatures.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="text-brand-500">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/auth"
                className="mt-6 block text-center bg-brand-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors"
              >
                {t('pricing.paid.cta')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-16 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">{t('faq.heading')}</h2>
          <div className="space-y-4">
            {faqItems.map((item, i) => (
              <details key={i} className="bg-white border border-gray-200 rounded-xl p-5 group">
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex justify-between items-center">
                  {item.question}
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-3 text-gray-600 text-sm leading-relaxed">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-10 bg-white border-t border-gray-100 text-center text-sm text-gray-500">
        <p className="font-medium text-gray-700 mb-4">{t('footer.tagline')}</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link to="/three-rules" className="hover:text-gray-900">
            {t('footer.links.three_rules')}
          </Link>
          <span aria-hidden>·</span>
          <a href="#" className="hover:text-gray-900">
            {t('footer.links.privacy')}
          </a>
          <span aria-hidden>·</span>
          <a href="#" className="hover:text-gray-900">
            {t('footer.links.terms')}
          </a>
        </div>
        <p className="mt-4 text-xs text-gray-400">© {new Date().getFullYear()} Detention Navigator</p>
      </footer>
    </div>
  )
}
