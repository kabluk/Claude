import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { supabase, type User } from '../lib/supabase'

interface ProtectedRouteProps {
  children: ReactNode
}

/**
 * Auth guard — redirects unauthenticated users to /auth.
 * Preserves the intended destination in location state so Auth can redirect back.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const location = useLocation()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Still loading
  if (user === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (user === null) {
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  return <>{children}</>
}
