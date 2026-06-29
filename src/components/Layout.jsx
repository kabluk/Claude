import { Outlet, useLocation } from 'react-router-dom'
import StepProgress from './StepProgress.jsx'
import Disclaimer from './Disclaimer.jsx'
import { stepByPath } from '../data/steps.js'

export default function Layout() {
  const { pathname } = useLocation()
  const step = stepByPath(pathname)

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__inner">
          <div className="brand">
            <span className="brand__mark">
              Califor<b>mis</b>
            </span>
            <span className="brand__tag">California Divorce Forms</span>
          </div>
          <span className="topbar__step">
            Шаг {step.n} из 6 · {step.short}
          </span>
        </div>
      </header>

      <StepProgress current={step.n} />

      <main className="main">
        <Outlet />
      </main>

      <Disclaimer />
    </div>
  )
}
