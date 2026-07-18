import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import LanguageToggle from '../components/LanguageToggle'

interface ChecklistStep {
  key: string
  phase: number
  sort: number
}

interface StepProgress {
  step_key: string
  status: string
}

const PHASES = [1, 2, 3] as const

interface StepSource {
  label: string
  url: string
}

interface StepContent {
  title: string
  description: string
  guidance: string
  tips: string[]
  sources: StepSource[]
}

export default function Navigator() {
  const { t } = useTranslation(['common', 'navigator'])
  const { caseId } = useParams<{ caseId: string }>()
  const [steps, setSteps] = useState<ChecklistStep[]>([])
  const [progress, setProgress] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [activeStep, setActiveStep] = useState<string | null>(null)
  const [caseName, setCaseName] = useState('')

  useEffect(() => {
    if (!caseId) return

    async function load() {
      const [stepsResult, progressResult, caseResult] = await Promise.all([
        supabase.from('checklist_steps').select('*').order('sort'),
        supabase.from('checklist_progress').select('step_key, status').eq('case_id', caseId),
        supabase.from('cases').select('detainee_first_name, detainee_last_name').eq('id', caseId).single(),
      ])

      setSteps(stepsResult.data ?? [])

      const progressMap: Record<string, string> = {}
      for (const p of progressResult.data ?? []) {
        progressMap[p.step_key] = p.status
      }
      setProgress(progressMap)

      if (caseResult.data) {
        setCaseName(`${caseResult.data.detainee_first_name} ${caseResult.data.detainee_last_name}`)
      }

      setLoading(false)
    }

    load()
  }, [caseId])

  async function toggleStep(stepKey: string) {
    const current = progress[stepKey] ?? 'todo'
    const next = current === 'done' ? 'todo' : 'done'

    // Optimistic update
    setProgress(prev => ({ ...prev, [stepKey]: next }))

    await supabase.from('checklist_progress').upsert({
      case_id: caseId,
      step_key: stepKey,
      status: next,
      completed_at: next === 'done' ? new Date().toISOString() : null,
    })
  }

  function getStepContent(key: string): StepContent | null {
    try {
      return t(`steps.${key}`, { ns: 'navigator', returnObjects: true }) as StepContent
    } catch {
      return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const stepsByPhase = PHASES.reduce(
    (acc, phase) => {
      acc[phase] = steps.filter(s => s.phase === phase)
      return acc
    },
    {} as Record<number, ChecklistStep[]>
  )

  const doneCount = steps.filter(s => progress[s.key] === 'done').length
  const activeContent = activeStep ? getStepContent(activeStep) : null

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="text-gray-400 hover:text-gray-700">←</Link>
          <span className="font-bold text-brand-700 text-sm truncate max-w-[160px]">
            {caseName}
          </span>
        </div>
        <LanguageToggle />
      </nav>

      {/* Progress bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-brand-500 rounded-full h-2 transition-all"
              style={{ width: `${steps.length > 0 ? (doneCount / steps.length) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 shrink-0">
            {doneCount} / {steps.length}
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {PHASES.map(phase => (
          <section key={phase} className="mb-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
              {t(`checklist.phases.${phase}`, { ns: 'common' })}
            </h2>
            <div className="space-y-2">
              {stepsByPhase[phase]?.map(step => {
                const status = progress[step.key] ?? 'todo'
                const content = getStepContent(step.key)
                const isDone = status === 'done'

                return (
                  <div
                    key={step.key}
                    className={`bg-white border rounded-xl overflow-hidden ${
                      isDone ? 'border-green-200' : 'border-gray-100'
                    }`}
                  >
                    <div className="p-4 flex items-start gap-3">
                      <button
                        onClick={() => toggleStep(step.key)}
                        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isDone
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-brand-400'
                        }`}
                        aria-label={isDone ? t('checklist.mark_todo') : t('checklist.mark_done')}
                      >
                        {isDone && <span className="text-xs">✓</span>}
                      </button>
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => setActiveStep(activeStep === step.key ? null : step.key)}
                          className="text-left w-full"
                        >
                          <p className={`font-medium text-sm ${isDone ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                            {content?.title ?? step.key}
                          </p>
                          {content?.description && (
                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                              {content.description}
                            </p>
                          )}
                        </button>
                      </div>
                      <button
                        onClick={() => setActiveStep(activeStep === step.key ? null : step.key)}
                        className="text-gray-400 hover:text-gray-700 shrink-0"
                        aria-expanded={activeStep === step.key}
                      >
                        <span className={`text-xs transition-transform inline-block ${activeStep === step.key ? 'rotate-180' : ''}`}>
                          ▼
                        </span>
                      </button>
                    </div>

                    {/* Expanded detail */}
                    {activeStep === step.key && content && (
                      <div className="border-t border-gray-100 px-4 py-4 bg-gray-50">
                        <div className="prose prose-sm max-w-none">
                          <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                            {content.guidance}
                          </p>
                        </div>

                        {content.tips && content.tips.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                              {t('checklist.tips')}
                            </p>
                            <ul className="space-y-1.5">
                              {content.tips.map((tip, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                                  <span className="text-brand-500 mt-0.5 shrink-0">•</span>
                                  {tip}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {content.sources && content.sources.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                              {t('checklist.sources')}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {content.sources.map((src, i) => (
                                <a
                                  key={i}
                                  href={src.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-brand-600 underline hover:text-brand-800"
                                >
                                  {src.label}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
                          <button
                            onClick={() => toggleStep(step.key)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                              isDone
                                ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                : 'bg-green-500 text-white hover:bg-green-600'
                            }`}
                          >
                            {isDone ? t('checklist.mark_todo') : t('checklist.mark_done')}
                          </button>
                          <button
                            onClick={() => setActiveStep(null)}
                            className="text-xs text-gray-400 hover:text-gray-700"
                          >
                            {t('checklist.close')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
