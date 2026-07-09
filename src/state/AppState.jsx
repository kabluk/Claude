import { createContext, useContext, useEffect, useState } from 'react'
import { store } from '../data/repository.js'
import { useI18n } from '../i18n/I18nContext.jsx'

const AppStateContext = createContext(null)

export function AppStateProvider({ children }) {
  const { lang } = useI18n()
  const [user, setUser] = useState(() => store.getOrCreateUser())
  const [caseRec, setCaseRec] = useState(() => store.getOrCreateCase(user.id))
  const [answers, setAnswers] = useState(() => store.getAnswers(caseRec.id))
  const [payment, setPayment] = useState(() =>
    store.getOrCreatePayment(caseRec.id),
  )

  // Mirror the active UI language onto the User record.
  useEffect(() => {
    if (user && user.language !== lang) {
      setUser(store.updateUser(user.id, { language: lang }))
    }
  }, [lang]) // eslint-disable-line react-hooks/exhaustive-deps

  const updateUser = (patch) => setUser(store.updateUser(user.id, patch))
  const updateCase = (patch) => setCaseRec(store.updateCase(caseRec.id, patch))

  // Autosave a single interview answer and refresh local state.
  const saveAnswer = (fieldKey, value) => {
    store.upsertAnswer(caseRec.id, fieldKey, value)
    setAnswers(store.getAnswers(caseRec.id))
  }
  const getAnswer = (fieldKey) =>
    answers.find((a) => a.field_key === fieldKey)?.value ?? ''

  // Single financial profile for the case (incomes, timeshare, support result).
  // Stored as one JSON Answer under 'finance_profile'.
  let financeProfile = {}
  try {
    financeProfile = JSON.parse(getAnswer('finance_profile') || '{}') || {}
  } catch {
    financeProfile = {}
  }
  const updateFinanceProfile = (patch) => {
    const next = { ...financeProfile, ...patch }
    saveAnswer('finance_profile', JSON.stringify(next))
  }

  // Start a brand-new case for the same user (fresh answers + unpaid payment).
  const startNewCase = () => {
    const fresh = store.newCase(user.id)
    setCaseRec(fresh)
    setAnswers(store.getAnswers(fresh.id))
    setPayment(store.getOrCreatePayment(fresh.id))
  }

  const value = {
    user,
    caseRec,
    answers,
    payment,
    price: store.PRICE,
    updateUser,
    updateCase,
    saveAnswer,
    getAnswer,
    financeProfile,
    updateFinanceProfile,
    startNewCase,
  }

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  )
}

export function useAppState() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used within <AppStateProvider>')
  return ctx
}
