import { Outlet, useLocation } from 'react-router-dom'
import StepProgress from './StepProgress.jsx'
import Disclaimer from './Disclaimer.jsx'
import LanguageSwitcher from './LanguageSwitcher.jsx'
import { stepByPath } from '../data/steps.js'
import { useI18n } from '../i18n/I18nContext.jsx'

export default function Layout() {
  const { pathname } = useLocation()
  const step = stepByPath(pathname)
  const { t, fmt } = useI18n()

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__inner">
          <div className="brand">
            <span className="brand__mark">
              Califor<b>mis</b>
            </span>
            <span className="brand__tag">{t.brandTag}</span>
          </div>

          <div className="topbar__right">
            <span className="topbar__step">
              {fmt(t.common.stepOf, { n: step.n })} · {t.short[step.key]}
            </span>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <StepProgress current={step.n} />

      <main className="main">
        <Outlet />
      </main>

      <p className="forms-note">{t.common.formsNote}</p>
      <Disclaimer />
    </div>
  )
}
