import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import LanguageToggle from '../components/LanguageToggle'

type Mode = 'sign_in' | 'sign_up'

export default function Auth() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard'

  const [mode, setMode] = useState<Mode>('sign_in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setLoading(true)

    try {
      if (mode === 'sign_in') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) {
          setError(t('auth.sign_in_error'))
          return
        }
        navigate(from, { replace: true })
      } else {
        const { error: signUpError } = await supabase.auth.signUp({ email, password })
        if (signUpError) {
          setError(signUpError.message)
          return
        }
        setSuccessMessage(t('auth.sign_up_success'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col">

      <nav className="px-6 py-4 flex items-center justify-between border-b border-[var(--color-border)] bg-white">
        <Link to="/" className="font-heading text-xl font-semibold text-[var(--color-foreground)] tracking-tight">
          Detention Navigator
        </Link>
        <LanguageToggle />
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-14">
        <div className="w-full max-w-sm">

          {/* Heading */}
          <div className="mb-8 text-center">
            <h1 className="font-heading text-4xl font-semibold text-[var(--color-foreground)]">
              {mode === 'sign_in' ? t('auth.sign_in') : t('auth.sign_up')}
            </h1>
            <p className="mt-2 text-sm text-slate-500">Detention Navigator</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-sm p-8">

            {error && (
              <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 leading-relaxed">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="mb-5 px-4 py-3 bg-success-light border border-green-200 rounded-lg text-sm text-success leading-relaxed">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5" htmlFor="email">
                  {t('auth.email')}
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full min-h-[44px] border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--color-foreground)] bg-[var(--color-background)] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow duration-150 placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5" htmlFor="password">
                  {t('auth.password')}
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete={mode === 'sign_in' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full min-h-[44px] border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--color-foreground)] bg-[var(--color-background)] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow duration-150 placeholder:text-slate-400"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[44px] bg-brand-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors duration-150 disabled:opacity-50 cursor-pointer"
              >
                {loading
                  ? t('common.loading')
                  : mode === 'sign_in'
                  ? t('auth.sign_in')
                  : t('auth.sign_up')}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-600">
              {mode === 'sign_in' ? (
                <p>
                  {t('auth.no_account')}{' '}
                  <button
                    onClick={() => { setMode('sign_up'); setError(null) }}
                    className="text-brand-600 font-medium hover:text-brand-800 transition-colors duration-150 cursor-pointer"
                  >
                    {t('auth.sign_up')}
                  </button>
                </p>
              ) : (
                <p>
                  {t('auth.have_account')}{' '}
                  <button
                    onClick={() => { setMode('sign_in'); setError(null) }}
                    className="text-brand-600 font-medium hover:text-brand-800 transition-colors duration-150 cursor-pointer"
                  >
                    {t('auth.sign_in')}
                  </button>
                </p>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
