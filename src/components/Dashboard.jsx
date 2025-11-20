import { useEffect, useMemo, useState } from 'react'
import Board from './Board'

export default function Dashboard({ backendUrl, token, user }) {
  const headers = useMemo(()=>({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }),[token])
  const [projects, setProjects] = useState([])
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [active, setActive] = useState(null)

  const load = async () => {
    const res = await fetch(`${backendUrl}/projects`, { headers })
    const data = await res.json()
    if (res.ok) {
      setProjects(data)
      if (!active && data[0]) setActive(data[0])
    }
  }

  useEffect(()=>{ load() // eslint-disable-next-line
  }, [])

  const createProject = async (e) => {
    e.preventDefault()
    if (!name) return
    const res = await fetch(`${backendUrl}/projects`, { method: 'POST', headers, body: JSON.stringify({ name, description: desc }) })
    const data = await res.json()
    if (res.ok) { setProjects(prev=>[...prev, data]); setName(''); setDesc(''); setActive(data) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white text-2xl font-bold">Projects</h1>
            <p className="text-blue-200/80 text-sm">Signed in as {user.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <a href="#" onClick={()=>{localStorage.removeItem('token'); window.location.reload()}} className="text-blue-300 hover:text-white text-sm">Log out</a>
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4">
            <form onSubmit={createProject} className="bg-slate-800/60 border border-blue-500/20 rounded-xl p-4">
              <h3 className="text-white font-semibold mb-3">New Project</h3>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Project name" className="w-full mb-2 bg-slate-900/70 border border-slate-700 rounded px-3 py-2 text-white" />
              <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Description" className="w-full mb-2 bg-slate-900/70 border border-slate-700 rounded px-3 py-2 text-white" />
              <button className="w-full bg-blue-600 hover:bg-blue-500 rounded px-3 py-2 text-white">Create</button>
            </form>

            <div className="bg-slate-800/60 border border-blue-500/20 rounded-xl p-4">
              <h3 className="text-white font-semibold mb-3">Your Projects</h3>
              <div className="space-y-2">
                {projects.map(p=> (
                  <button key={p.id} onClick={()=>setActive(p)} className={`w-full text-left px-3 py-2 rounded border ${active?.id===p.id? 'border-blue-500 text-white bg-blue-500/10' : 'border-white/10 text-blue-100 hover:bg-white/5'}`}>{p.name}</button>
                ))}
                {projects.length===0 && <p className="text-blue-200/70 text-sm">No projects yet.</p>}
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            {active ? (
              <Board backendUrl={backendUrl} token={token} project={active} />
            ) : (
              <div className="text-blue-200/80">Select a project</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
