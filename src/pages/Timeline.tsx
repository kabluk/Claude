import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

type Category = 'all' | 'arrest' | 'court' | 'bond' | 'document' | 'attorney' | 'facility' | 'family' | 'government' | 'other'

interface TimelineEntry {
  id: string
  occurred_at: string
  category: string
  title: string
  notes: string
  source: string
}

export default function Timeline() {
  const { caseId } = useParams<{ caseId: string }>()
  const { t } = useTranslation('timeline')
  const [entries] = useState<TimelineEntry[]>([])
  const [filterCategory, setFilterCategory] = useState<Category>('all')
  const [showForm, setShowForm] = useState(false)

  const categoryKeys: Category[] = ['all', 'arrest', 'court', 'bond', 'document', 'attorney', 'facility', 'family', 'government', 'other']

  const filtered = filterCategory === 'all'
    ? entries
    : entries.filter((e) => e.category === filterCategory)

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('page_title')}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => {/* export stub */}}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
          >
            {t('export')}
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-1.5 text-sm bg-brand-600 text-white rounded hover:bg-brand-700"
          >
            {t('add_entry')}
          </button>
        </div>
      </div>

      <p className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
        {t('disclaimer')}
      </p>

      {/* Category filter */}
      <div className="mt-4">
        <label className="block text-sm text-gray-700 mb-1">{t('filter_category')}</label>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as Category)}
          className="border border-gray-300 rounded px-3 py-2 text-sm"
        >
          {categoryKeys.map((key) => (
            <option key={key} value={key}>
              {key === 'all' ? t('all_categories') : t(`categories.${key}`)}
            </option>
          ))}
        </select>
      </div>

      {/* Entry form stub */}
      {showForm && (
        <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h2 className="font-semibold text-gray-900">{t('add_entry')}</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm text-gray-700">{t('form.occurred_at')}</label>
              <input type="datetime-local" className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm text-gray-700">{t('form.category')}</label>
              <select className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm">
                {categoryKeys.filter((k) => k !== 'all').map((key) => (
                  <option key={key} value={key}>{t(`categories.${key}`)}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm text-gray-700">{t('form.title')}</label>
              <input className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm text-gray-700">{t('form.notes')}</label>
              <textarea rows={3} className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none" />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button className="px-4 py-2 text-sm bg-brand-600 text-white rounded hover:bg-brand-700">
              {/* common save */}
              Save
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              {/* common cancel */}
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Entries list */}
      <div className="mt-6 space-y-3">
        {filtered.length === 0 && (
          <p className="text-sm text-gray-500">{t('no_entries')}</p>
        )}
        {filtered.map((entry) => (
          <div key={entry.id} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                  {t(`categories.${entry.category}`)}
                </span>
                <p className="mt-1 font-medium text-gray-900">{entry.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{entry.occurred_at}</p>
              </div>
              <span className="text-xs text-gray-400">
                {t(`source.${entry.source}`)}
              </span>
            </div>
            {entry.notes && <p className="mt-2 text-sm text-gray-600">{entry.notes}</p>}
          </div>
        ))}
      </div>

      <span className="hidden">{caseId}</span>
    </div>
  )
}
