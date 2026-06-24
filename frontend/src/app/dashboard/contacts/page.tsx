'use client'
import { useEffect, useState, useCallback } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || ''
const STAGES = ['', 'lead', 'prospect', 'qualified', 'proposal', 'negotiation', 'customer', 'churned']
const PER_PAGE = 12

interface Contact {
  id: string; first_name: string; last_name: string
  email: string; company: string; title: string; stage: string; phone: string
}

const BADGE: Record<string,string> = {
  lead:'bg-blue-100 text-blue-700', prospect:'bg-slate-100 text-slate-600',
  qualified:'bg-yellow-100 text-yellow-700', proposal:'bg-orange-100 text-orange-700',
  negotiation:'bg-purple-100 text-purple-700', customer:'bg-green-100 text-green-700',
  churned:'bg-red-100 text-red-700',
}

export default function ContactsPage() {
  const [contacts, setContacts]   = useState<Contact[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [stage, setStage]         = useState('')
  const [sortField, setSortField] = useState('first_name')
  const [sortDir, setSortDir]     = useState<'asc'|'desc'>('asc')
  const [page, setPage]           = useState(1)
  const [total, setTotal]         = useState(0)
  const [showAdd, setShowAdd]     = useState(false)
  const [form, setForm]           = useState({ first_name:'', last_name:'', email:'', company:'', title:'', phone:'', stage:'lead' })
  const [saving, setSaving]       = useState(false)

  const load = useCallback(async () => {
    const token = localStorage.getItem('crm_token')
    if (!token) return
    setLoading(true)
    const params = new URLSearchParams({
      limit: String(PER_PAGE), offset: String((page-1)*PER_PAGE),
      ...(search && { search }), ...(stage && { stage }),
      sort_by: sortField, sort_dir: sortDir,
    })
    const r = await fetch(`${API}/api/v1/contacts?${params}`, { headers: { Authorization: `Bearer ${token}` } })
    if (r.ok) { const d = await r.json(); setContacts(d.items||[]); setTotal(d.total||0) }
    setLoading(false)
  }, [page, search, stage, sortField, sortDir])

  useEffect(() => { load() }, [load])

  function toggleSort(f: string) {
    if (sortField === f) setSortDir(d => d==='asc'?'desc':'asc')
    else { setSortField(f); setSortDir('asc') }
  }
  function SortIcon({ f }: { f: string }) {
    if (sortField !== f) return <span className="ml-1 text-slate-300">↕</span>
    return <span className="ml-1">{sortDir==='asc'?'↑':'↓'}</span>
  }

  async function addContact(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const token = localStorage.getItem('crm_token')!
    const r = await fetch(`${API}/api/v1/contacts`, {
      method:'POST', headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json' },
      body: JSON.stringify(form),
    })
    if (r.ok) { setShowAdd(false); setForm({ first_name:'',last_name:'',email:'',company:'',title:'',phone:'',stage:'lead' }); load() }
    setSaving(false)
  }

  const pages = Math.ceil(total / PER_PAGE)

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contacts</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total.toLocaleString()} total</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
          + Add Contact
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}
          placeholder="Search name, email, company…"
          className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <select value={stage} onChange={e=>{setStage(e.target.value);setPage(1)}}
          className="sm:w-48 border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Stages</option>
          {STAGES.filter(s=>s).map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
        </select>
      </div>

      {/* Table — desktop */}
      <div className="hidden sm:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
              <tr>
                {[['first_name','Name'],['company','Company'],['email','Email'],['title','Title'],['stage','Stage']].map(([f,l])=>(
                  <th key={f} onClick={()=>toggleSort(f)}
                    className="px-5 py-3.5 text-left cursor-pointer hover:text-slate-700 select-none whitespace-nowrap">
                    {l}<SortIcon f={f}/>
                  </th>
                ))}
                <th className="px-5 py-3.5 text-left">Phone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400">Loading…</td></tr>
              ) : contacts.length===0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400">No contacts found.</td></tr>
              ) : contacts.map(c=>(
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 font-semibold text-slate-800">{c.first_name} {c.last_name}</td>
                  <td className="px-5 py-4 text-slate-500">{c.company}</td>
                  <td className="px-5 py-4 text-slate-500">{c.email}</td>
                  <td className="px-5 py-4 text-slate-500">{c.title}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${BADGE[c.stage]||'bg-slate-100 text-slate-600'}`}>
                      {c.stage}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500">{c.phone||'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cards — mobile */}
      <div className="sm:hidden space-y-3">
        {loading ? (
          <div className="text-center py-10 text-slate-400">Loading…</div>
        ) : contacts.length===0 ? (
          <div className="text-center py-10 text-slate-400">No contacts found.</div>
        ) : contacts.map(c=>(
          <div key={c.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900">{c.first_name} {c.last_name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{c.title}{c.company?` · ${c.company}`:''}</p>
              </div>
              <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${BADGE[c.stage]||'bg-slate-100 text-slate-600'}`}>
                {c.stage}
              </span>
            </div>
            <div className="mt-3 space-y-1 text-xs text-slate-500">
              {c.email && <p>✉ {c.email}</p>}
              {c.phone && <p>📞 {c.phone}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            Showing {Math.min((page-1)*PER_PAGE+1, total)}–{Math.min(page*PER_PAGE, total)} of {total}
          </p>
          <div className="flex flex-wrap gap-1">
            {Array.from({length:Math.min(pages,7)},(_,i)=>{
              const p = pages<=7 ? i+1 : i===0?1:i===6?pages:page-3+i
              return (
                <button key={i} onClick={()=>setPage(p)}
                  className={`w-9 h-9 text-sm rounded-xl font-medium transition-colors ${p===page?'bg-blue-600 text-white shadow-md':'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}>
                  {p}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-3xl sm:rounded-t-2xl">
              <h2 className="text-lg font-bold text-slate-900">New Contact</h2>
              <button onClick={()=>setShowAdd(false)} className="text-slate-400 hover:text-slate-700 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={addContact} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[['first_name','First Name'],['last_name','Last Name']].map(([f,l])=>(
                  <div key={f}>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">{l}</label>
                    <input required value={form[f as keyof typeof form]}
                      onChange={e=>setForm(x=>({...x,[f]:e.target.value}))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                ))}
              </div>
              {[['email','Email','email'],['company','Company','text'],['title','Job Title','text'],['phone','Phone','tel']].map(([f,l,t])=>(
                <div key={f}>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{l}</label>
                  <input type={t} value={form[f as keyof typeof form]}
                    onChange={e=>setForm(x=>({...x,[f]:e.target.value}))}
                    required={f==='email'}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Stage</label>
                <select value={form.stage} onChange={e=>setForm(x=>({...x,stage:e.target.value}))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {STAGES.filter(s=>s).map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowAdd(false)}
                  className="flex-1 py-2.5 text-sm font-semibold border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition-colors">
                  {saving ? 'Saving…' : 'Add Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
