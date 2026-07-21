import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import LanguageToggle from '../components/LanguageToggle'

type Answer = string | null

interface Answers {
  years: Answer
  qualifying_relative: Answer
  criminal: Answer
  prior_order: Answer
  absences: Answer
}

type ResultKey = 'strong' | 'possible' | 'unlikely'

const QUESTIONS = ['years', 'qualifying_relative', 'criminal', 'prior_order', 'absences'] as const
function computeResult(answers: Answers): ResultKey {
  // Not enough presence — unlikely
  if (answers.years === 'under_7') return 'unlikely'
  // No qualifying relative — unlikely
  if (answers.qualifying_relative === 'no') return 'unlikely'

  // Serious criminal or prior order — possible (not unlikely, attorney must review)
  const hasComplicatingFactor =
    answers.criminal === 'serious' ||
    answers.prior_order === 'yes' ||
    answers.absences === 'yes' ||
    answers.years === '7_to_10'

  if (hasComplicatingFactor) return 'possible'

  // Uncertain factors
  const hasUncertainFactor =
    answers.criminal === 'minor' ||
    answers.prior_order === 'unsure' ||
    answers.absences === 'unsure'

  if (hasUncertainFactor) return 'possible'

  return 'strong'
}

function getFactorsList(answers: Answers, t: (k: string) => string): string {
  const factors: string[] = []
  if (answers.years === '7_to_10') factors.push(t('cancellation:questions.years.options.7_to_10'))
  if (answers.criminal !== 'none') factors.push(t(`cancellation:questions.criminal.options.${answers.criminal}`))
  if (answers.prior_order === 'yes') factors.push(t('cancellation:questions.prior_order.options.yes'))
  if (answers.prior_order === 'unsure') factors.push(t('cancellation:questions.prior_order.options.unsure'))
  if (answers.absences !== 'no') factors.push(t(`cancellation:questions.absences.options.${answers.absences}`))
  return factors.join(', ')
}

const RESULT_COLORS: Record<ResultKey, string> = {
  strong: 'bg-green-50 border-green-200 text-green-900',
  possible: 'bg-amber-50 border-amber-200 text-amber-900',
  unlikely: 'bg-blue-50 border-blue-200 text-blue-900',
}

const RESULT_BADGE_COLORS: Record<ResultKey, string> = {
  strong: 'bg-green-100 text-green-700',
  possible: 'bg-amber-100 text-amber-700',
  unlikely: 'bg-blue-100 text-blue-700',
}

const RESULT_URGENCY_COLORS: Record<ResultKey, string> = {
  strong: 'bg-red-50 border-red-200 text-red-800',
  possible: 'bg-orange-50 border-orange-200 text-orange-800',
  unlikely: 'bg-gray-50 border-gray-200 text-gray-700',
}

export default function CancellationScreener() {
  const { t } = useTranslation(['cancellation', 'common'])
  const { caseId } = useParams<{ caseId?: string }>()

  const [step, setStep] = useState<'intro' | 'questions' | 'result'>('intro')
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Answers>({
    years: null,
    qualifying_relative: null,
    criminal: null,
    prior_order: null,
    absences: null,
  })
  const [detaineeName, setDetaineeName] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const totalQuestions = QUESTIONS.length
  const questionKey = QUESTIONS[currentQ]
  const currentAnswer = answers[questionKey]
  const isLast = currentQ === totalQuestions - 1

  const displayName = detaineeName.trim() || '—'

  function handleAnswer(value: string) {
    setAnswers(prev => ({ ...prev, [questionKey]: value }))
  }

  function handleNext() {
    if (isLast) {
      setStep('result')
    } else {
      setCurrentQ(prev => prev + 1)
    }
  }

  function handleBack() {
    if (currentQ === 0) {
      setStep('intro')
    } else {
      setCurrentQ(prev => prev - 1)
    }
  }

  function handleStartOver() {
    setStep('intro')
    setCurrentQ(0)
    setAnswers({ years: null, qualifying_relative: null, criminal: null, prior_order: null, absences: null })
    setSaved(false)
  }

  async function handleAddToCase() {
    if (!isSupabaseConfigured || !caseId) return
    setSaving(true)
    try {
      const result = computeResult(answers)
      await supabase.from('case_documents').insert({
        case_id: caseId,
        document_type: 'cancellation_screener',
        content: JSON.stringify({ answers, result, detaineeName }),
        created_at: new Date().toISOString(),
      })
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <Link to={caseId ? `/navigator/${caseId}` : '/dashboard'} className="text-sm text-brand-600 hover:text-brand-800">
            ← {t('common:nav.dashboard')}
          </Link>
          <LanguageToggle />
        </nav>

        <div className="max-w-lg mx-auto px-4 py-10">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-brand-600 px-6 py-8 text-white">
              <div className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-3">
                INA § 240A(b)
              </div>
              <h1 className="text-2xl font-bold leading-tight mb-3">
                {t('cancellation:title')}
              </h1>
              <p className="text-sm opacity-85 leading-relaxed">
                {t('cancellation:subtitle')}
              </p>
            </div>

            <div className="p-6">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <p className="text-xs text-amber-800 leading-relaxed">
                  {t('cancellation:disclaimer')}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('common:name_label', 'Name of detained person (optional)')}
                </label>
                <input
                  type="text"
                  value={detaineeName}
                  onChange={e => setDetaineeName(e.target.value)}
                  placeholder={t('common:name_placeholder', 'First and last name')}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <button
                onClick={() => setStep('questions')}
                className="w-full bg-brand-600 text-white py-3.5 rounded-xl font-semibold text-base hover:bg-brand-700 transition-colors"
              >
                {t('cancellation:start')}
              </button>

              <p className="text-xs text-gray-400 text-center mt-4">
                {t('cancellation:not_legal_advice')}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'questions') {
    const options = t(`cancellation:questions.${questionKey}.options`, { returnObjects: true }) as Record<string, string>

    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <button onClick={handleBack} className="text-sm text-brand-600 hover:text-brand-800">
            ← {t('cancellation:back')}
          </button>
          <span className="text-xs text-gray-500">
            {t('cancellation:question_of', { current: currentQ + 1, total: totalQuestions })}
          </span>
          <LanguageToggle />
        </nav>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-1 bg-brand-500 transition-all duration-300"
            style={{ width: `${((currentQ + 1) / totalQuestions) * 100}%` }}
          />
        </div>

        <div className="max-w-lg mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-500 mb-3">
              {t('cancellation:question_of', { current: currentQ + 1, total: totalQuestions })}
            </p>

            <h2 className="text-lg font-bold text-gray-900 mb-2 leading-snug">
              {t(`cancellation:questions.${questionKey}.text`, { name: displayName })}
            </h2>

            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              {t(`cancellation:questions.${questionKey}.hint`)}
            </p>

            <div className="space-y-3 mb-8">
              {Object.entries(options).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => handleAnswer(key)}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-all ${
                    currentAnswer === key
                      ? 'border-brand-500 bg-brand-50 text-brand-800 ring-1 ring-brand-400'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                      currentAnswer === key ? 'border-brand-500 bg-brand-500' : 'border-gray-300'
                    }`} />
                    {label}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={handleNext}
              disabled={!currentAnswer}
              className="w-full bg-brand-600 text-white py-3.5 rounded-xl font-semibold text-base hover:bg-brand-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLast ? t('cancellation:see_result') : t('cancellation:next')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Result
  const result = computeResult(answers)
  const yearsLabel = answers.years ? t(`cancellation:questions.years.options.${answers.years}`) : '—'
  const relativeLabel = answers.qualifying_relative ? t(`cancellation:questions.qualifying_relative.options.${answers.qualifying_relative}`) : '—'
  const factorsList = getFactorsList(answers, t)

  const attorneyNote = t(`cancellation:results.${result}.attorney_note`, {
    years: yearsLabel,
    relative: relativeLabel,
    factors: factorsList,
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <Link to={caseId ? `/navigator/${caseId}` : '/dashboard'} className="text-sm text-brand-600 hover:text-brand-800">
          ← {t('common:nav.dashboard')}
        </Link>
        <LanguageToggle />
      </nav>

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Result card */}
        <div className={`rounded-2xl border p-6 mb-4 ${RESULT_COLORS[result]}`}>
          <div className="flex items-start justify-between mb-4">
            <span className={`text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full ${RESULT_BADGE_COLORS[result]}`}>
              {t(`cancellation:results.${result}.label`)}
            </span>
          </div>

          <h2 className="text-lg font-bold leading-snug mb-3">
            {t(`cancellation:results.${result}.headline`, { name: displayName })}
          </h2>

          <div className="text-sm leading-relaxed whitespace-pre-line opacity-90">
            {t(`cancellation:results.${result}.body`, { name: displayName })}
          </div>
        </div>

        {/* Urgency banner */}
        <div className={`rounded-xl border px-4 py-3 mb-4 ${RESULT_URGENCY_COLORS[result]}`}>
          <p className="text-sm font-medium">
            ⚡ {t(`cancellation:results.${result}.urgency`)}
          </p>
        </div>

        {/* Attorney note */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-4 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
            {t('common:attorney_note_label', 'Attorney Note')}
          </h3>
          <p className="text-sm text-gray-800 leading-relaxed font-mono bg-gray-50 rounded-lg p-3">
            {attorneyNote}
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3 mb-6">
          {caseId && isSupabaseConfigured && (
            <button
              onClick={handleAddToCase}
              disabled={saving || saved}
              className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-colors ${
                saved
                  ? 'bg-green-100 text-green-700 cursor-default'
                  : 'bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60'
              }`}
            >
              {saved ? `✓ ${t('cancellation:added_to_case')}` : t('cancellation:add_to_case')}
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="w-full py-3.5 rounded-xl font-semibold text-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t('cancellation:print_for_attorney')}
          </button>

          <button
            onClick={handleStartOver}
            className="w-full py-3 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            {t('cancellation:start_over')}
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center leading-relaxed">
          {t('cancellation:legal_source')}<br />
          {t('cancellation:not_legal_advice')}
        </p>
      </div>
    </div>
  )
}
