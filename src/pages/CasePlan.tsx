import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

type SectionKey = 'care_plan' | 'support_letters' | 'release_readiness'

export default function CasePlan() {
  const { caseId } = useParams<{ caseId: string }>()
  const { t: tc } = useTranslation('care')
  const { t: tr } = useTranslation('release')
  const { t: tn } = useTranslation('common')
  const [activeSection, setActiveSection] = useState<SectionKey>('care_plan')

  const sections: { key: SectionKey; label: string }[] = [
    { key: 'care_plan', label: tc('page_title') },
    { key: 'support_letters', label: tc('sections.support_letters') },
    { key: 'release_readiness', label: tr('page_title') },
  ]

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900">{tn('nav.care_plan')}</h1>

      {/* Section tabs */}
      <div className="mt-4 flex gap-1 border-b border-gray-200 overflow-x-auto">
        {sections.map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
              activeSection === s.key
                ? 'border-b-2 border-brand-600 text-brand-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeSection === 'care_plan' && (
          <div>
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
              {tc('disclaimer')}
            </p>

            <h2 className="mt-4 font-semibold text-gray-900">{tc('sections.caregiver')}</h2>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-gray-700">{tc('caregiver.name')}</label>
                <input className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm text-gray-700">{tc('caregiver.phone')}</label>
                <input className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm text-gray-700">{tc('caregiver.relationship')}</label>
                <input className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm" />
              </div>
            </div>

            <h2 className="mt-6 font-semibold text-gray-900">{tc('sections.school')}</h2>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-gray-700">{tc('school.name')}</label>
                <input className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm text-gray-700">{tc('school.phone')}</label>
                <input className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm" />
              </div>
            </div>

            <h2 className="mt-6 font-semibold text-gray-900">{tc('checklist.title')}</h2>
            <p className="mt-1 text-sm text-gray-600">{tc('checklist.subtitle')}</p>
            <ul className="mt-3 space-y-2">
              {(tc('checklist.items', { returnObjects: true }) as string[]).map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <input type="checkbox" className="mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <h2 className="mt-6 font-semibold text-gray-900">{tc('sections.backups')}</h2>
            <p className="mt-2 text-sm text-gray-500">{tc('backups.no_backups')}</p>
            <button className="mt-2 text-sm text-brand-600 hover:underline">{tc('backups.add')}</button>

            <h2 className="mt-6 font-semibold text-gray-900">{tc('sections.documents')}</h2>
            <p className="mt-2 text-sm text-gray-500">{tc('documents.no_docs')}</p>
            <button className="mt-2 text-sm text-brand-600 hover:underline">{tc('documents.add')}</button>
          </div>
        )}

        {activeSection === 'support_letters' && (
          <div>
            <p className="text-sm text-gray-600">{tc('support_letters.info')}</p>
            <div className="mt-4 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">{tc('sections.support_letters')}</h2>
              <button className="text-sm text-brand-600 hover:underline">{tc('support_letters.add')}</button>
            </div>
            <p className="mt-4 text-sm text-gray-500">{tc('support_letters.no_letters')}</p>
          </div>
        )}

        {activeSection === 'release_readiness' && (
          <div>
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
              {tr('disclaimer')}
            </p>

            <h2 className="mt-4 font-semibold text-gray-900">{tr('sections.bond')}</h2>
            <p className="mt-1 text-xs text-gray-500">{tr('bond.info')}</p>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-gray-700">{tr('bond.amount')}</label>
                <input className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm" type="number" />
              </div>
              <div>
                <label className="block text-sm text-gray-700">{tr('bond.receipt')}</label>
                <input className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm" type="file" />
              </div>
            </div>

            <h2 className="mt-6 font-semibold text-gray-900">{tr('sections.sponsor')}</h2>
            <p className="mt-1 text-xs text-gray-500">{tr('sponsor.info')}</p>
            <div className="mt-2">
              <label className="block text-sm text-gray-700">{tr('sponsor.payer_name')}</label>
              <input className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm" />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input type="checkbox" id="payer_docs_ready" />
              <label htmlFor="payer_docs_ready" className="text-sm text-gray-700">
                {tr('sponsor.payer_docs_ready')}
              </label>
            </div>

            <h2 className="mt-6 font-semibold text-gray-900">{tr('sections.release_address')}</h2>
            <p className="mt-1 text-xs text-gray-500">{tr('release_address.info')}</p>
            <div className="mt-2">
              <label className="block text-sm text-gray-700">{tr('release_address.label')}</label>
              <input className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm" />
            </div>

            <h2 className="mt-6 font-semibold text-gray-900">{tr('checklist.title')}</h2>
            <p className="mt-1 text-sm text-gray-600">{tr('checklist.subtitle')}</p>
            <ul className="mt-3 space-y-2">
              {(tr('checklist.items', { returnObjects: true }) as string[]).map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <input type="checkbox" className="mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <span className="hidden">{caseId}</span>
    </div>
  )
}
