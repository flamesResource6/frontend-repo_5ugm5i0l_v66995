import { useState } from 'react'

export default function AuthForm({ onAuthed, backendUrl }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${backendUrl}/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'register' ? { name, email, password } : { email, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Request failed')
      if (mode === 'login') {
        localStorage.setItem('token', data.token)
        onAuthed({ token: data.token, user: data.user })
      } else {
        // auto login after register
        const loginRes = await fetch(`${backendUrl}/auth/login`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })
        })
        const loginData = await loginRes.json()
        if (!loginRes.ok) throw new Error(loginData.detail || 'Login failed')
        localStorage.setItem('token', loginData.token)
        onAuthed({ token: loginData.token, user: loginData.user })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md w-full mx-auto bg-slate-800/60 border border-blue-500/20 rounded-2xl p-6 text-white">
      <h2 className="text-2xl font-semibold mb-1">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
      <p className="text-blue-200/80 mb-6">{mode === 'login' ? 'Sign in to manage your projects' : 'Start collaborating in seconds'}</p>
      <form onSubmit={submit} className="space-y-4">
        {mode === 'register' && (
          <div>
            <label className="block text-sm text-blue-200 mb-1">Name</label>
            <input value={name} onChange={e=>setName(e.target.value)} className="w-full bg-slate-900/70 border border-slate-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
        )}
        <div>
          <label className="block text-sm text-blue-200 mb-1">Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-slate-900/70 border border-slate-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
        </div>
        <div>
          <label className="block text-sm text-blue-200 mb-1">Password</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-slate-900/70 border border-slate-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
        </div>
        {error && <div className="text-red-400 text-sm">{error}</div>}
        <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 rounded px-3 py-2 transition-colors">
          {loading ? 'Please wait...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
        </button>
      </form>
      <button onClick={()=>setMode(mode==='login'?'register':'login')} className="mt-4 w-full text-blue-300 hover:text-white text-sm">
        {mode==='login' ? "Don't have an account? Sign up" : 'Have an account? Sign in'}
      </button>
    </div>
  )
}
