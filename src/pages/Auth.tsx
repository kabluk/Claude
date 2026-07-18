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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="px-4 py-3 flex items-center justify-between border-b border-gray-100 bg-white">
        <Link to="/" className="font-bold text-brand-700 text-lg">Detention Navigator</Link>
        <LanguageToggle />
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">
            {mode === 'sign_in' ? t('auth.sign_in') : t('auth.sign_up')}
          </h1>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.email')}
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.password')}
              </label>
              <input
                type="password"
                required
                autoComplete={mode === 'sign_in' ? 'current-password' : 'new-password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
            >
              {loading
                ? t('common.loading')
                : mode === 'sign_in'
                ? t('auth.sign_in')
                : t('auth.sign_up')}
            </button>
          </form>

          <div className="mt-5 text-center text-sm">
            {mode === 'sign_in' ? (
              <p className="text-gray-600">
                {t('auth.no_account')}{' '}
                <button
                  onClick={() => { setMode('sign_up'); setError(null) }}
                  className="text-brand-600 font-medium hover:underline"
                >
                  {t('auth.sign_up')}
                </button>
              </p>
            ) : (
              <p className="text-gray-600">
                {t('auth.have_account')}{' '}
                <button
                  onClick={() => { setMode('sign_in'); setError(null) }}
                  className="text-brand-600 font-medium hover:underline"
                >
                  {t('auth.sign_in')}
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
