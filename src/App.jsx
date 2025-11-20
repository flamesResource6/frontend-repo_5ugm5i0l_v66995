import { useEffect, useState } from 'react'
import AuthForm from './components/AuthForm'
import Dashboard from './components/Dashboard'

function App() {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    const token = localStorage.getItem('token')
    if (!token) { setLoading(false); return }
    fetch(`${backendUrl}/me`, { headers: { 'Authorization': `Bearer ${token}` }}).then(async r=>{
      if (!r.ok) { localStorage.removeItem('token'); setLoading(false); return }
      const user = await r.json()
      setSession({ token, user })
      setLoading(false)
    }).catch(()=> setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <AuthForm backendUrl={backendUrl} onAuthed={(s)=> setSession(s)} />
      </div>
    )
  }

  return (
    <Dashboard backendUrl={backendUrl} token={session.token} user={session.user} />
  )
}

export default App
