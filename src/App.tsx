import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Suspense } from 'react'
import ProtectedRoute from './components/ProtectedRoute'
import Disclaimer from './components/Disclaimer'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Navigator from './pages/Navigator'
import ThreeRules from './pages/ThreeRules'
import Settings from './pages/Settings'
import AttorneyManager from './pages/AttorneyManager'
import CasePlan from './pages/CasePlan'
import Timeline from './pages/Timeline'
import CancellationScreener from './pages/CancellationScreener'

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Disclaimer />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/three-rules" element={<ThreeRules />} />

          {/* Protected routes */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/navigator/:caseId"
            element={
              <ProtectedRoute>
                <Navigator />
              </ProtectedRoute>
            }
          />
          <Route
            path="/evidence/:caseId"
            element={
              <ProtectedRoute>
                {/* Phase 2 — Evidence Builder placeholder */}
                <div className="p-8 text-center">
                  <h1 className="text-2xl font-semibold">Evidence Builder — Coming in Phase 2</h1>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/monitor/:caseId"
            element={
              <ProtectedRoute>
                {/* Phase 3 — Status Monitor placeholder */}
                <div className="p-8 text-center">
                  <h1 className="text-2xl font-semibold">Status Monitor — Coming in Phase 3</h1>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/attorney/:caseId"
            element={
              <ProtectedRoute>
                <AttorneyManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/plan/:caseId"
            element={
              <ProtectedRoute>
                <CasePlan />
              </ProtectedRoute>
            }
          />
          <Route
            path="/timeline/:caseId"
            element={
              <ProtectedRoute>
                <Timeline />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cancellation-screener"
            element={<CancellationScreener />}
          />
          <Route
            path="/cancellation-screener/:caseId"
            element={
              <ProtectedRoute>
                <CancellationScreener />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route
            path="*"
            element={
              <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-400">404</h1>
                  <p className="mt-2 text-gray-600">Page not found</p>
                  <a href="/" className="mt-4 inline-block text-brand-600 underline">
                    Go home
                  </a>
                </div>
              </div>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
