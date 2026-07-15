import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import CaseType from './screens/CaseType.jsx'
import County from './screens/County.jsx'
import Wizard from './screens/Wizard.jsx'
import Calculator from './screens/Calculator.jsx'
import Preview from './screens/Preview.jsx'
import Readiness from './screens/Readiness.jsx'
import Cabinet from './screens/Cabinet.jsx'
import CountyPage from './screens/CountyPage.jsx'
import ReviewCheckout from './screens/ReviewCheckout.jsx'
import AttorneyReview from './screens/AttorneyReview.jsx'
import { REVIEWED_TIER_ENABLED } from './config/features.js'

export default function App() {
  return (
    <Routes>
      {/* SEO landing pages — own layout, no wizard shell */}
      <Route path="/california/:county" element={<CountyPage />} />
      <Route element={<Layout />}>
        <Route path="/" element={<CaseType />} />
        <Route path="/county" element={<County />} />
        <Route path="/wizard" element={<Wizard />} />
        <Route path="/calculator" element={<Calculator />} />
        <Route path="/preview" element={<Preview />} />
        <Route path="/review" element={<Readiness />} />
        <Route path="/cabinet" element={<Cabinet />} />
        {/* Attorney-review tier — mounted only when the flag is on (off in prod) */}
        {REVIEWED_TIER_ENABLED && (
          <>
            <Route path="/review-checkout" element={<ReviewCheckout />} />
            <Route path="/attorney" element={<AttorneyReview />} />
          </>
        )}
        <Route path="*" element={<CaseType />} />
      </Route>
    </Routes>
  )
}
