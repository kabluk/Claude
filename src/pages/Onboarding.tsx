import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '../lib/supabase'
import LanguageToggle from '../components/LanguageToggle'

const TOTAL_STEPS = 3

const step2Schema = z.object({
  detainee_first_name: z.string().min(1, 'Required'),
  detainee_last_name: z.string().min(1, 'Required'),
  a_number: z.string().regex(/^A?\d{8,9}$/i, 'Format: A123456789').optional().or(z.literal('')),
  country_of_birth: z.string().optional(),
  entry_year: z.number().int().min(1900).max(new Date().getFullYear()).optional().nullable(),
})

type Step2Data = z.infer<typeof step2Schema>

export default function Onboarding() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
  })

  async function createCase(data: Step2Data) {
    setCreating(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/auth')
        return
      }

      // Ensure profile exists
      await supabase.from('profiles').upsert({ id: user.id }, { onConflict: 'id' })

      let a_number_encrypted: string | null = null

      if (data.a_number && data.a_number.trim()) {
        // Encrypt A-Number via Edge Function
        const { data: encResult, error: encError } = await supabase.functions.invoke(
          'encrypt-anumber',
          { body: { a_number: data.a_number.trim().toUpperCase() } }
        )
        if (!encError && encResult?.encrypted) {
          a_number_encrypted = encResult.encrypted
        }
      }

      const { data: newCase, error: caseError } = await supabase
        .from('cases')
        .insert({
          owner_id: user.id,
          detainee_first_name: data.detainee_first_name,
          detainee_last_name: data.detainee_last_name,
          a_number_encrypted,
          country_of_birth: data.country_of_birth || null,
          entry_year: data.entry_year || null,
        })
        .select('id')
        .single()

      if (caseError || !newCase) {
        setError('Failed to create case. Please try again.')
        return
      }

      navigate(`/navigator/${newCase.id}`)
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="px-4 py-3 flex items-center justify-between border-b border-gray-100 bg-white">
        <span className="font-bold text-brand-700 text-lg">Detention Navigator</span>
        <LanguageToggle />
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Step indicator */}
          <div className="mb-6">
            <p className="text-xs text-gray-400 mb-3">
              {t('onboarding.step', { current: step, total: TOTAL_STEPS })}
            </p>
            <div className="flex gap-1.5">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-1.5 rounded-full transition-colors ${
                    i + 1 <= step ? 'bg-brand-500' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <div>
              <h1 className="text-xl font-bold text-gray-900">{t('onboarding.step1_title')}</h1>
              <p className="mt-1 text-sm text-gray-500">{t('onboarding.step1_subtitle')}</p>
              <p className="mt-6 text-gray-700 text-sm">
                This tool is for family members or trusted supporters of someone being held in ICE detention.
              </p>
              <button
                onClick={() => setStep(2)}
                className="mt-8 w-full bg-brand-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors"
              >
                {t('onboarding.next')}
              </button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <form onSubmit={e => { e.preventDefault(); setStep(3) }}>
              <h1 className="text-xl font-bold text-gray-900">{t('onboarding.step2_title')}</h1>
              <p className="mt-1 text-sm text-gray-500">{t('onboarding.step2_subtitle')}</p>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('onboarding.first_name')}
                  </label>
                  <input
                    {...register('detainee_first_name')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  {errors.detainee_first_name && (
                    <p className="text-red-500 text-xs mt-1">{errors.detainee_first_name.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('onboarding.last_name')}
                  </label>
                  <input
                    {...register('detainee_last_name')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  {errors.detainee_last_name && (
                    <p className="text-red-500 text-xs mt-1">{errors.detainee_last_name.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('onboarding.a_number')}
                    <span className="ml-1 text-gray-400 text-xs">{t('common.optional')}</span>
                  </label>
                  <input
                    {...register('a_number')}
                    placeholder="A123456789"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">{t('onboarding.a_number_hint')}</p>
                  {errors.a_number && (
                    <p className="text-red-500 text-xs mt-1">{errors.a_number.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('onboarding.country_of_birth')}
                    <span className="ml-1 text-gray-400 text-xs">{t('common.optional')}</span>
                  </label>
                  <input
                    {...register('country_of_birth')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('onboarding.entry_year')}
                    <span className="ml-1 text-gray-400 text-xs">{t('common.optional')}</span>
                  </label>
                  <input
                    type="number"
                    {...register('entry_year', { valueAsNumber: true })}
                    placeholder="2015"
                    min={1900}
                    max={new Date().getFullYear()}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  {t('onboarding.back')}
                </button>
                <button
                  type="submit"
                  className="flex-2 flex-grow bg-brand-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors"
                >
                  {t('onboarding.next')}
                </button>
              </div>
            </form>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div>
              <h1 className="text-xl font-bold text-gray-900">{t('onboarding.step3_title')}</h1>
              <p className="mt-1 text-sm text-gray-500">{t('onboarding.step3_subtitle')}</p>

              <div className="mt-5">
                <p className="text-sm text-gray-600">
                  Facility information can be added or updated later from the case settings.
                  The ICE Detainee Locator (Step 1 of the navigator) will help find the current facility.
                </p>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  {t('onboarding.back')}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit(createCase)}
                  disabled={creating}
                  className="flex-2 flex-grow bg-brand-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
                >
                  {creating ? t('onboarding.creating_case') : t('onboarding.finish')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
