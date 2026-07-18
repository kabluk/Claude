import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

type TabKey = 'verification' | 'questions' | 'fee_phases' | 'payments' | 'contact_log' | 'agreement'

interface Attorney {
  id: string
  full_name: string
  firm_name: string
  status: string
}

function AttorneyDetailTabs({ attorney }: { attorney: Attorney }) {
  const { t } = useTranslation('attorney')
  const [activeTab, setActiveTab] = useState<TabKey>('verification')

  const tabs: TabKey[] = ['verification', 'questions', 'fee_phases', 'payments', 'contact_log', 'agreement']

  return (
    <div className="mt-4">
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
              activeTab === tab
                ? 'border-b-2 border-brand-600 text-brand-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t(`tabs.${tab}`)}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {activeTab === 'verification' && (
          <div>
            <h3 className="font-semibold text-gray-900">{t('verification.title')}</h3>
            <p className="mt-1 text-sm text-gray-600">{t('verification.subtitle')}</p>
            <ul className="mt-3 space-y-2">
              {(t('verification.items', { returnObjects: true }) as string[]).map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <input type="checkbox" className="mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'questions' && (
          <div>
            <h3 className="font-semibold text-gray-900">{t('questions.title')}</h3>
            <p className="mt-1 text-sm text-gray-600">{t('questions.subtitle')}</p>
            {(['experience', 'scope', 'fees', 'communication', 'documents'] as const).map((group) => (
              <div key={group} className="mt-4">
                <h4 className="font-medium text-gray-800">{t(`questions.groups.${group}.label`)}</h4>
                <ul className="mt-2 space-y-3">
                  {(t(`questions.groups.${group}.items`, { returnObjects: true }) as string[]).map((q, i) => (
                    <li key={i} className="text-sm">
                      <p className="text-gray-700">{q}</p>
                      <textarea
                        rows={2}
                        className="mt-1 w-full text-sm border border-gray-300 rounded px-2 py-1 resize-none"
                        placeholder="..."
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'fee_phases' && (
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{t('fee_phases.title')}</h3>
              <button className="text-sm text-brand-600 hover:underline">{t('fee_phases.add_phase')}</button>
            </div>
            <p className="mt-1 text-sm text-gray-600">{t('fee_phases.subtitle')}</p>
            <p className="mt-4 text-sm text-gray-400 italic">— {t('fee_phases.add_phase')} —</p>
          </div>
        )}

        {activeTab === 'payments' && (
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{t('payments.title')}</h3>
              <button className="text-sm text-brand-600 hover:underline">{t('payments.add_payment')}</button>
            </div>
            <p className="mt-4 text-sm text-gray-500">{t('payments.no_payments')}</p>
          </div>
        )}

        {activeTab === 'contact_log' && (
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{t('contact_log.title')}</h3>
              <button className="text-sm text-brand-600 hover:underline">{t('contact_log.add_entry')}</button>
            </div>
            <p className="mt-1 text-sm text-gray-600">{t('contact_log.subtitle')}</p>
            <p className="mt-4 text-sm text-gray-500">{t('contact_log.no_entries')}</p>
          </div>
        )}

        {activeTab === 'agreement' && (
          <div>
            <h3 className="font-semibold text-gray-900">{t('agreement.title')}</h3>
            <p className="mt-1 text-sm text-gray-600">{t('agreement.subtitle')}</p>
            <ul className="mt-3 space-y-2">
              {(t('agreement.items', { returnObjects: true }) as string[]).map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <input type="checkbox" className="mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

function FeeComparisonView() {
  const { t } = useTranslation('attorney')
  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
      <h3 className="font-semibold text-gray-900">{t('fee_comparison.title')}</h3>
      <p className="mt-1 text-sm text-gray-600">{t('fee_comparison.subtitle')}</p>
      <p className="mt-4 text-sm text-gray-400 italic">{t('fee_comparison.no_data')}</p>
    </div>
  )
}

function BudgetPlanner() {
  const { t } = useTranslation('attorney')
  return (
    <div className="mt-6 p-4 border border-gray-200 rounded-lg">
      <h3 className="font-semibold text-gray-900">{t('budget_planner.title')}</h3>
      <p className="mt-1 text-sm text-gray-600">{t('budget_planner.subtitle')}</p>
      <div className="mt-3 grid grid-cols-3 gap-4 text-center">
        {(['total_quoted', 'total_paid', 'balance'] as const).map((key) => (
          <div key={key} className="p-3 bg-gray-50 rounded">
            <p className="text-xs text-gray-500">{t(`budget_planner.${key}`)}</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">—</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-gray-500">{t('budget_planner.billing_note')}</p>
    </div>
  )
}

export default function AttorneyManager() {
  const { caseId } = useParams<{ caseId: string }>()
  const { t } = useTranslation('attorney')
  const [attorneys] = useState<Attorney[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selected = attorneys.find((a) => a.id === selectedId) ?? null

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('page_title')}</h1>
      <p className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
        {t('disclaimer')}
      </p>
      <p className="mt-2 text-xs text-gray-500">{t('jurisdiction_note')}</p>

      <div className="mt-6 flex items-center justify-between">
        <span className="text-sm text-gray-600">
          {attorneys.length === 0 ? t('no_attorneys') : `${attorneys.length} attorney(s)`}
        </span>
        <button className="px-4 py-2 bg-brand-600 text-white text-sm rounded hover:bg-brand-700">
          {t('add_attorney')}
        </button>
      </div>

      {attorneys.length === 0 && (
        <div className="mt-4 text-sm text-gray-400 italic">{t('no_attorneys')}</div>
      )}

      {attorneys.map((attorney) => (
        <div
          key={attorney.id}
          className="mt-3 border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-brand-400"
          onClick={() => setSelectedId(attorney.id === selectedId ? null : attorney.id)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{attorney.full_name}</p>
              <p className="text-sm text-gray-500">{attorney.firm_name}</p>
            </div>
            <span className="text-xs px-2 py-1 bg-gray-100 rounded">
              {t(`attorney_status.${attorney.status}`)}
            </span>
          </div>
          {selectedId === attorney.id && <AttorneyDetailTabs attorney={attorney} />}
        </div>
      ))}

      <FeeComparisonView />
      <BudgetPlanner />

      {/* Suppress unused variable warning */}
      <span className="hidden">{caseId}</span>
    </div>
  )
}
