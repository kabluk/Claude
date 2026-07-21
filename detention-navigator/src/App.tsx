import { useState } from 'react'
import { Onboarding } from './pages/Onboarding'
import { Dashboard } from './pages/Dashboard'

interface UserData {
  name: string
  detainedName: string
  lang: string
}

function App() {
  const [userData, setUserData] = useState<UserData | null>(null)

  if (!userData) {
    return <Onboarding onComplete={setUserData} />
  }

  return <Dashboard name={userData.name} detainedName={userData.detainedName} />
}

export default App
