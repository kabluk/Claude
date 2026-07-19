import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Navigation2, FolderOpen, Radio, ChevronDown, Shield, Check } from 'lucide-react'
import LanguageToggle from '../components/LanguageToggle'

export default function Landing() {
  const { t } = useTranslation('landing')
  const { t: tc } = useTranslation('common')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const faqItems = t('faq.items', { returnObjects: true }) as Array<{
    question: string
    answer: string
  }>

  const freeFeatures = t('pricing.free.features', { returnObjects: true }) as string[]
  const paidFeatures = t('pricing.paid.features', { returnObjects: true }) as string[]

  return (
    <div className="min-h-screen bg-[var(--color-background)]">

      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-[var(--color-border)] px-6 py-4 flex items-center justify-between">
        <span className="font-heading text-xl font-semibold text-[var(--color-foreground)] tracking-tight">
          Detention Navigator
        </span>
        <div className="flex items-center gap-5">
          <LanguageToggle />
          <Link
            to="/three-rules"
            className="hidden sm:block text-sm text-slate-600 hover:text-[var(--color-foreground)] transition-colors duration-150"
          >
            {tc('nav.three_rules')}
          </Link>
          <Link
            to="/auth"
            className="min-h-[44px] inline-flex items-center text-sm bg-brand-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-brand-700 transition-colors duration-150 cursor-pointer"
          >
            {tc('nav.sign_in')}
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-20 md:py-32 text-center bg-[var(--color-background)]">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-full px-4 py-1.5 mb-8">
            <Shield size={14} className="text-brand-600" />
            <span className="text-xs font-medium text-brand-700">{t('hero.disclaimer_inline')}</span>
          </div>
          <h1 className="font-heading text-5xl md:text-7xl font-semibold text-[var(--color-foreground)] leading-tight text-balance tracking-tight">
            {t('hero.headline')}
          </h1>
          <p className="mt-6 text-lg md:text-xl text-slate-600 text-balance max-w-2xl mx-auto leading-relaxed">
            {t('hero.subheadline')}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/auth"
              className="min-h-[44px] inline-flex items-center justify-center bg-brand-600 text-white px-8 py-3 rounded-xl text-base font-semibold hover:bg-brand-700 transition-colors duration-200 cursor-pointer"
            >
              {t('hero.cta_primary')}
            </Link>
            <Link
              to="/three-rules"
              className="min-h-[44px] inline-flex items-center justify-center border border-brand-300 text-brand-700 px-8 py-3 rounded-xl text-base font-semibold hover:bg-brand-50 transition-colors duration-200 cursor-pointer"
            >
              {t('three_rules_promo.cta')}
            </Link>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="px-6 py-20 bg-white border-t border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold text-center text-[var(--color-foreground)] mb-12">
            {t('modules.heading')}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">

            {/* Navigator */}
            <div className="border border-[var(--color-border)] rounded-2xl p-7 bg-[var(--color-background)] hover:border-brand-300 hover:shadow-sm transition-all duration-200 group">
              <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-brand-50 mb-5 group-hover:bg-brand-100 transition-colors duration-200">
                <Navigation2 size={22} className="text-brand-600" />
              </div>
              <h3 className="font-heading text-xl font-semibold text-[var(--color-foreground)]">
                {t('modules.navigator.title')}
              </h3>
              <p className="mt-2 text-slate-600 text-sm leading-relaxed">
                {t('modules.navigator.description')}
              </p>
            </div>

            {/* Evidence */}
            <div className="border border-[var(--color-border)] rounded-2xl p-7 bg-[var(--color-background)] hover:border-slate-300 hover:shadow-sm transition-all duration-200 group">
              <div className="flex items-start justify-between mb-5">
                <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-100 group-hover:bg-slate-200 transition-colors duration-200">
                  <FolderOpen size={22} className="text-slate-600" />
                </div>
                <span className="text-xs font-semibold bg-[var(--color-muted)] text-slate-500 px-2.5 py-1 rounded-full border border-[var(--color-border)]">
                  {t('modules.evidence.badge')}
                </span>
              </div>
              <h3 className="font-heading text-xl font-semibold text-[var(--color-foreground)]">
                {t('modules.evidence.title')}
              </h3>
              <p className="mt-2 text-slate-600 text-sm leading-relaxed">
                {t('modules.evidence.description')}
              </p>
            </div>

            {/* Monitor */}
            <div className="border border-[var(--color-border)] rounded-2xl p-7 bg-[var(--color-background)] hover:border-slate-300 hover:shadow-sm transition-all duration-200 group">
              <div className="flex items-start justify-between mb-5">
                <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-100 group-hover:bg-slate-200 transition-colors duration-200">
                  <Radio size={22} className="text-slate-600" />
                </div>
                <span className="text-xs font-semibold bg-[var(--color-muted)] text-slate-500 px-2.5 py-1 rounded-full border border-[var(--color-border)]">
                  {t('modules.monitor.badge')}
                </span>
              </div>
              <h3 className="font-heading text-xl font-semibold text-[var(--color-foreground)]">
                {t('modules.monitor.title')}
              </h3>
              <p className="mt-2 text-slate-600 text-sm leading-relaxed">
                {t('modules.monitor.description')}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Three Rules Promo */}
      <section className="px-6 py-16 bg-accent-light border-y border-amber-200">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-heading text-2xl md:text-3xl font-semibold text-[var(--color-foreground)]">
            {t('three_rules_promo.heading')}
          </h2>
          <p className="mt-4 text-slate-700 leading-relaxed">{t('three_rules_promo.text')}</p>
          <Link
            to="/three-rules"
            className="mt-6 min-h-[44px] inline-flex items-center justify-center border border-amber-400 bg-white text-amber-800 px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-50 transition-colors duration-150 cursor-pointer"
          >
            {t('three_rules_promo.cta')}
          </Link>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold text-center text-[var(--color-foreground)] mb-12">
            {t('pricing.heading')}
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">

            {/* Free */}
            <div className="border border-[var(--color-border)] rounded-2xl p-7">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">{t('pricing.free.name')}</p>
              <p className="mt-2 text-4xl font-heading font-semibold text-[var(--color-foreground)]">
                {t('pricing.free.price')}
              </p>
              <ul className="mt-6 space-y-3">
                {freeFeatures.map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                    <Check size={16} className="text-success mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/auth"
                className="mt-7 min-h-[44px] flex items-center justify-center border border-brand-300 text-brand-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-50 transition-colors duration-150 cursor-pointer"
              >
                {t('pricing.free.cta')}
              </Link>
            </div>

            {/* Paid */}
            <div className="border-2 border-brand-600 rounded-2xl p-7 bg-brand-50">
              <p className="text-sm font-medium text-brand-700 uppercase tracking-wide">{t('pricing.paid.name')}</p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-4xl font-heading font-semibold text-[var(--color-foreground)]">
                  {t('pricing.paid.price')}
                </span>
                <span className="text-slate-500 text-sm">{t('pricing.paid.period')}</span>
              </div>
              <ul className="mt-6 space-y-3">
                {paidFeatures.map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                    <Check size={16} className="text-brand-600 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/auth"
                className="mt-7 min-h-[44px] flex items-center justify-center bg-brand-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors duration-150 cursor-pointer"
              >
                {t('pricing.paid.cta')}
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-20 bg-[var(--color-muted)]">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-heading text-3xl font-semibold text-center text-[var(--color-foreground)] mb-10">
            {t('faq.heading')}
          </h2>
          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <div
                key={i}
                className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full min-h-[44px] px-6 py-4 flex justify-between items-center text-left cursor-pointer hover:bg-[var(--color-muted)] transition-colors duration-150"
                  aria-expanded={openFaq === i}
                >
                  <span className="font-medium text-[var(--color-foreground)] pr-4">{item.question}</span>
                  <ChevronDown
                    size={18}
                    className={`text-slate-400 shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5">
                    <p className="text-slate-600 text-sm leading-relaxed">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 bg-white border-t border-[var(--color-border)] text-center">
        <p className="font-heading text-base font-medium text-[var(--color-foreground)] mb-5">
          {t('footer.tagline')}
        </p>
        <div className="flex gap-5 justify-center flex-wrap text-sm text-slate-500">
          <Link to="/three-rules" className="hover:text-[var(--color-foreground)] transition-colors duration-150">
            {t('footer.links.three_rules')}
          </Link>
          <span aria-hidden className="text-slate-300">·</span>
          <a href="#" className="hover:text-[var(--color-foreground)] transition-colors duration-150">
            {t('footer.links.privacy')}
          </a>
          <span aria-hidden className="text-slate-300">·</span>
          <a href="#" className="hover:text-[var(--color-foreground)] transition-colors duration-150">
            {t('footer.links.terms')}
          </a>
        </div>
        <p className="mt-5 text-xs text-slate-400">© {new Date().getFullYear()} Detention Navigator</p>
      </footer>

    </div>
  )
}
