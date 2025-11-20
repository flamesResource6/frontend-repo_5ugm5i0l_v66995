import { useEffect, useMemo, useState } from 'react'

const columns = [
  { key: 'todo', title: 'To Do' },
  { key: 'in_progress', title: 'In Progress' },
  { key: 'done', title: 'Done' },
]

function TaskCard({ task, onUpdate, onOpen }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-3 cursor-pointer hover:border-blue-400/40" onClick={()=>onOpen(task)}>
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-white font-medium">{task.title}</h4>
        {task.due_date && <span className="text-xs text-blue-200/70">{new Date(task.due_date).toLocaleDateString()}</span>}
      </div>
      {task.description && <p className="text-xs text-blue-200/80 line-clamp-2">{task.description}</p>}
      <div className="mt-2 flex items-center gap-2">
        <select value={task.status} onChange={(e)=>onUpdate(task.id,{ status: e.target.value })} className="text-xs bg-slate-900/60 border border-slate-700 rounded px-2 py-1 text-blue-200">
          {columns.map(c=> <option key={c.key} value={c.key}>{c.title}</option>)}
        </select>
      </div>
    </div>
  )
}

export default function Board({ backendUrl, token, project }) {
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [wsStatus, setWsStatus] = useState('')
  const [openTask, setOpenTask] = useState(null)
  const headers = useMemo(()=>({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }),[token])

  const load = async () => {
    const res = await fetch(`${backendUrl}/projects/${project.id}/tasks`, { headers })
    const data = await res.json()
    if (res.ok) setTasks(data)
  }

  useEffect(()=>{ load() // eslint-disable-next-line
  }, [project.id])

  useEffect(()=>{
    const ws = new WebSocket(`${backendUrl.replace('http','ws')}/ws/projects/${project.id}`)
    ws.onopen = ()=> setWsStatus('connected')
    ws.onclose = ()=> setWsStatus('disconnected')
    ws.onmessage = (ev)=>{
      const msg = JSON.parse(ev.data)
      if (msg.type === 'task_created') setTasks(prev=>[...prev, msg.task])
      if (msg.type === 'task_updated') setTasks(prev=> prev.map(t=> t.id===msg.task.id? msg.task : t))
      if (msg.type === 'comment_added') {
        // no-op here, detail handled in TaskDetail when open
      }
    }
    return ()=> ws.close()
  }, [project.id, backendUrl])

  const createTask = async (e) => {
    e.preventDefault()
    if (!title) return
    const res = await fetch(`${backendUrl}/projects/${project.id}/tasks`, {
      method:'POST', headers, body: JSON.stringify({ title, description: desc })
    })
    const data = await res.json()
    if (res.ok) { setTitle(''); setDesc(''); }
  }

  const updateTask = async (id, patch) => {
    const res = await fetch(`${backendUrl}/tasks/${id}`, { method: 'PATCH', headers, body: JSON.stringify(patch) })
    if (!res.ok) {
      console.error('Update failed')
    }
  }

  const groups = useMemo(()=>{
    const map = { todo: [], in_progress: [], done: [] }
    tasks.forEach(t=>{ (map[t.status]||map.todo).push(t) })
    return map
  }, [tasks])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white text-xl font-semibold">{project.name}</h3>
        <span className={`text-xs ${wsStatus==='connected'?'text-green-300':'text-yellow-300'}`}>WS: {wsStatus}</span>
      </div>

      <form onSubmit={createTask} className="bg-slate-800/60 border border-blue-500/10 rounded-xl p-3 flex gap-2">
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Task title" className="flex-1 bg-slate-900/70 border border-slate-700 rounded px-3 py-2 text-white" />
        <input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Description" className="flex-[2] bg-slate-900/70 border border-slate-700 rounded px-3 py-2 text-white" />
        <button className="bg-blue-600 hover:bg-blue-500 rounded px-4 text-white">Add</button>
      </form>

      <div className="grid md:grid-cols-3 gap-4">
        {columns.map(col=> (
          <div key={col.key} className="bg-slate-800/60 border border-white/10 rounded-xl p-3">
            <h4 className="text-white font-medium mb-2">{col.title}</h4>
            {groups[col.key].map(t=> (
              <TaskCard key={t.id} task={t} onUpdate={updateTask} onOpen={setOpenTask} />
            ))}
          </div>
        ))}
      </div>

      {openTask && (
        <TaskDetail backendUrl={backendUrl} token={token} task={openTask} onClose={()=>setOpenTask(null)} />
      )}
    </div>
  )
}

function TaskDetail({ backendUrl, token, task, onClose }){
  const [comments, setComments] = useState([])
  const [text, setText] = useState('')
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }

  const load = async ()=>{
    const res = await fetch(`${backendUrl}/tasks/${task.id}/comments`, { headers })
    const data = await res.json()
    if (res.ok) setComments(data)
  }
  useEffect(()=>{ load() // eslint-disable-next-line
  }, [task.id])

  const add = async (e) => {
    e.preventDefault()
    if (!text) return
    const res = await fetch(`${backendUrl}/tasks/${task.id}/comments`, { method: 'POST', headers, body: JSON.stringify({ content: text }) })
    const data = await res.json()
    if (res.ok) { setComments(prev=>[...prev, data]); setText('') }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 rounded-xl p-4 max-w-2xl w-full text-white">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">{task.title}</h3>
          <button onClick={onClose} className="text-blue-300 hover:text-white">Close</button>
        </div>
        <p className="text-blue-200/80 mb-3">{task.description}</p>
        <div className="space-y-2 max-h-64 overflow-auto bg-slate-800/60 border border-white/10 rounded p-2 mb-2">
          {comments.map(c=> (
            <div key={c.id} className="text-sm text-blue-100">
              <span className="text-blue-300">{c.author_id?.slice(-6)}:</span> {c.content}
            </div>
          ))}
        </div>
        <form onSubmit={add} className="flex gap-2">
          <input value={text} onChange={e=>setText(e.target.value)} className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2" placeholder="Write a comment..." />
          <button className="bg-blue-600 hover:bg-blue-500 rounded px-4">Send</button>
        </form>
      </div>
    </div>
  )
}
