import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import LanguageToggle from '../components/LanguageToggle'

export default function Settings() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  async function handleDeleteAccount() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }

    setDeleting(true)
    try {
      // In production this should call a Supabase Edge Function that handles
      // cascade deletion and auth.users removal securely.
      // For now, sign out and redirect.
      await supabase.auth.signOut()
      navigate('/')
    } finally {
      setDeleting(false)
    }
  }

  async function exportData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [casesResult, profileResult] = await Promise.all([
      supabase.from('cases').select('*'),
      supabase.from('profiles').select('*').eq('id', user.id).single(),
    ])

    const exportData = {
      exported_at: new Date().toISOString(),
      profile: profileResult.data,
      cases: casesResult.data,
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `detention-navigator-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="text-gray-400 hover:text-gray-700">←</Link>
          <span className="font-bold text-brand-700">{t('settings.title')}</span>
        </div>
        <LanguageToggle />
      </nav>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">

        {/* Language */}
        <section className="bg-white border border-gray-100 rounded-2xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">{t('settings.language')}</h2>
          <div className="flex gap-3">
            <LanguageToggle />
          </div>
        </section>

        {/* Subscription */}
        <section className="bg-white border border-gray-100 rounded-2xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">{t('settings.subscription.title')}</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{t('settings.subscription.plan_free')}</p>
              <p className="text-xs text-gray-400 mt-0.5">Phase 1 navigator · 1 case</p>
            </div>
            <button
              className="text-sm bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
              onClick={() => {
                // Stripe checkout — Phase 4 implementation
                alert('Stripe integration coming in Phase 4')
              }}
            >
              {t('settings.subscription.upgrade')}
            </button>
          </div>
        </section>

        {/* Data */}
        <section className="bg-white border border-gray-100 rounded-2xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">{t('settings.data.title')}</h2>
          <div className="space-y-3">
            <button
              onClick={exportData}
              className="w-full text-left text-sm text-brand-600 underline hover:text-brand-800"
            >
              {t('settings.data.export')}
            </button>
            <div>
              {confirmDelete && (
                <p className="text-xs text-red-600 mb-2 bg-red-50 border border-red-200 rounded-lg p-3">
                  {t('settings.data.delete_confirm')}
                </p>
              )}
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="text-sm text-red-600 underline hover:text-red-800 disabled:opacity-50"
              >
                {deleting
                  ? t('settings.data.deleting')
                  : confirmDelete
                  ? t('common.confirm')
                  : t('settings.data.delete_account')}
              </button>
              {confirmDelete && !deleting && (
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="ml-4 text-sm text-gray-500 underline"
                >
                  {t('common.cancel')}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Sign out */}
        <button
          onClick={signOut}
          className="w-full border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors"
        >
          {t('nav.sign_out')}
        </button>

      </div>
    </div>
  )
}
