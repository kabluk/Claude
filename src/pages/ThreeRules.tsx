import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
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
    <div className="min-h-screen bg-[var(--color-background)]">

      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-[var(--color-border)] px-6 py-4 flex items-center justify-between">
        <Link to="/" className="font-heading text-xl font-semibold text-[var(--color-foreground)] tracking-tight">
          Detention Navigator
        </Link>
        <div className="flex items-center gap-5">
          <LanguageToggle />
          <Link
            to="/auth"
            className="min-h-[44px] inline-flex items-center text-sm text-brand-600 font-medium hover:text-brand-800 transition-colors duration-150"
          >
            {tc('nav.sign_in')}
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-14">

        {/* Free badge */}
        <div className="mb-6">
          <span className="inline-block text-xs font-semibold bg-success-light text-success px-3 py-1.5 rounded-full border border-green-200">
            Бесплатно · Free
          </span>
        </div>

        <h1 className="font-heading text-4xl md:text-5xl font-semibold text-[var(--color-foreground)] leading-tight">
          {content.title}
        </h1>
        <p className="mt-4 text-slate-600 leading-relaxed text-base">{content.description}</p>

        {/* Disclaimer */}
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-sm text-amber-800 leading-relaxed">
          {tc('disclaimer.text')}
        </div>

        {/* Guidance — three numbered cards */}
        <div className="mt-10 space-y-4">
          {content.guidance.split('\n\n').filter(Boolean).map((block, i) => {
            const borderColors = ['border-l-brand-600', 'border-l-success', 'border-l-accent']
            const bgColors = ['bg-brand-50', 'bg-success-light', 'bg-accent-light']
            return (
              <div
                key={i}
                className={`border border-[var(--color-border)] border-l-4 ${borderColors[i % 3]} rounded-xl px-6 py-5 ${bgColors[i % 3]}`}
              >
                <div className="flex items-start gap-4">
                  <span className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-white border border-[var(--color-border)] text-xs font-semibold text-[var(--color-foreground)]">
                    {i + 1}
                  </span>
                  <p className="text-[var(--color-foreground)] leading-relaxed text-sm whitespace-pre-line">{block.trim()}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Tips */}
        {content.tips.length > 0 && (
          <div className="mt-10 border border-[var(--color-border)] rounded-xl p-6">
            <h2 className="font-heading text-xl font-semibold text-[var(--color-foreground)] mb-4">
              {tc('checklist.tips')}
            </h2>
            <ul className="space-y-2.5">
              {content.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-700 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-600 mt-2 shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Sources */}
        {content.sources.length > 0 && (
          <div className="mt-8">
            <h2 className="font-medium text-slate-500 text-xs uppercase tracking-wide mb-3">
              {tc('checklist.sources')}
            </h2>
            <div className="space-y-2">
              {content.sources.map((src, i) => (
                <a
                  key={i}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-800 transition-colors duration-150 cursor-pointer"
                >
                  {src.label}
                  <ExternalLink size={13} />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-14 border-t border-[var(--color-border)] pt-10 text-center">
          <p className="text-slate-600 text-base leading-relaxed mb-6">
            Полный навигатор с 8 шагами доступен бесплатно после регистрации.
            <br />
            <span className="text-slate-400 text-sm mt-1 block">
              The full 8-step navigator is available free after registration.
            </span>
          </p>
          <Link
            to="/auth"
            className="min-h-[44px] inline-flex items-center justify-center bg-brand-600 text-white px-10 py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors duration-200 cursor-pointer"
          >
            {tc('nav.sign_in')} / {tc('auth.sign_up')}
          </Link>
        </div>

      </div>
    </div>
  )
}
