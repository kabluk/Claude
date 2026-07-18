import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import LanguageToggle from '../components/LanguageToggle'

interface Case {
  id: string
  detainee_first_name: string
  detainee_last_name: string
  custody_status: string
  created_at: string
}

interface Alert {
  id: string
  type: string
  message_key: string
  created_at: string
  seen_at: string | null
}

export default function Dashboard() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const [cases, setCases] = useState<Case[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUserEmail(user?.email ?? null)

      const [casesResult, alertsResult] = await Promise.all([
        supabase.from('cases').select('id, detainee_first_name, detainee_last_name, custody_status, created_at').order('created_at', { ascending: false }),
        supabase.from('alerts').select('id, type, message_key, created_at, seen_at').is('seen_at', null).order('created_at', { ascending: false }).limit(10),
      ])

      setCases(casesResult.data ?? [])
      setAlerts(alertsResult.data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  async function markAlertSeen(alertId: string) {
    await supabase.from('alerts').update({ seen_at: new Date().toISOString() }).eq('id', alertId)
    setAlerts(prev => prev.filter(a => a.id !== alertId))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-brand-700 text-lg">Detention Navigator</span>
        <div className="flex items-center gap-4">
          <LanguageToggle />
          <Link to="/settings" className="text-sm text-gray-600 hover:text-gray-900">
            {t('nav.settings')}
          </Link>
          <button onClick={signOut} className="text-sm text-gray-600 hover:text-gray-900">
            {t('nav.sign_out')}
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {t('dashboard.welcome')}{userEmail ? `, ${userEmail.split('@')[0]}` : ''}
          </h1>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <section className="mb-6">
            <h2 className="text-base font-semibold text-gray-700 mb-3">{t('dashboard.alerts.title')}</h2>
            <div className="space-y-2">
              {alerts.map(alert => (
                <div key={alert.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start justify-between gap-4">
                  <p className="text-sm text-amber-900">{alert.message_key}</p>
                  <button
                    onClick={() => markAlertSeen(alert.id)}
                    className="text-xs text-amber-700 underline shrink-0"
                  >
                    {t('dashboard.alerts.mark_seen')}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Cases */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-700">{t('nav.dashboard')}</h2>
            <Link
              to="/onboarding"
              className="text-sm bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
            >
              + {t('dashboard.create_first')}
            </Link>
          </div>

          {cases.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center">
              <p className="text-gray-500 mb-4">{t('dashboard.no_cases')}</p>
              <Link
                to="/onboarding"
                className="inline-block bg-brand-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors"
              >
                {t('dashboard.create_first')}
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {cases.map(c => (
                <div key={c.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {c.detainee_first_name} {c.detainee_last_name}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {t('dashboard.case_card.last_updated', {
                          date: new Date(c.created_at).toLocaleDateString(),
                        })}
                      </p>
                    </div>
                    <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">
                      {t('dashboard.phase_labels.1')}
                    </span>
                  </div>
                  <div className="mt-4">
                    <Link
                      to={`/navigator/${c.id}`}
                      className="block text-center bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors"
                    >
                      {t('dashboard.case_card.open_navigator')}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
