'use client'
import { useEffect, useState, useCallback } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || ''
const STAGES = ['', 'lead', 'prospect', 'qualified', 'proposal', 'negotiation', 'customer', 'churned']
const PER_PAGE = 12

interface Customer {
  id: string; first_name: string; last_name: string
  email: string; company: string; title: string; stage: string; phone: string
  city: string; state: string; country: string; zip_code: string
}

const BADGE: Record<string, string> = {
  lead:'bg-blue-100 text-blue-700', prospect:'bg-slate-100 text-slate-600',
  qualified:'bg-yellow-100 text-yellow-700', proposal:'bg-orange-100 text-orange-700',
  negotiation:'bg-purple-100 text-purple-700', customer:'bg-green-100 text-green-700',
  churned:'bg-red-100 text-red-700',
}

const EMPTY = { first_name:'', last_name:'', email:'', company:'', title:'', phone:'',
  stage:'lead', city:'', state:'', country:'', zip_code:'' }

function Input({ label, value, onChange, required, type='text' }:{
  label:string; value:string; onChange:(v:string)=>void; required?:boolean; type?:string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input type={type} value={value} required={required}
        onChange={e=>onChange(e.target.value)}
        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
    </div>
  )
}

function Select({ label, value, onChange, options }:{
  label:string; value:string; onChange:(v:string)=>void; options:string[]
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      <select value={value} onChange={e=>onChange(e.target.value)}
        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white
          focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize">
        {options.map(o=>(
          <option key={o} value={o}>{o ? o.charAt(0).toUpperCase()+o.slice(1) : '— Select —'}</option>
        ))}
      </select>
    </div>
  )
}

function AddressSection({ form, setForm }:{ form: typeof EMPTY; setForm: React.Dispatch<React.SetStateAction<typeof EMPTY>> }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Address</p>
      <Input label="City"  value={form.city}     onChange={v=>setForm(x=>({...x,city:v}))} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="State / Province" value={form.state}    onChange={v=>setForm(x=>({...x,state:v}))} />
        <Input label="Zip / Postal Code" value={form.zip_code} onChange={v=>setForm(x=>({...x,zip_code:v}))} />
      </div>
      <Input label="Country" value={form.country} onChange={v=>setForm(x=>({...x,country:v}))} />
      <p className="text-xs text-blue-500">📍 Used to plot this customer on the world map</p>
    </div>
  )
}

function formatLocation(c: Customer) {
  const parts = [c.city, c.state, c.country].filter(Boolean)
  return parts.join(', ')
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [stage, setStage]         = useState('')
  const [sortField, setSortField] = useState('first_name')
  const [sortDir, setSortDir]     = useState<'asc'|'desc'>('asc')
  const [page, setPage]           = useState(1)
  const [total, setTotal]         = useState(0)

  const [showAdd, setShowAdd]       = useState(false)
  const [addForm, setAddForm]       = useState({ ...EMPTY })
  const [addSaving, setAddSaving]   = useState(false)

  const [editing, setEditing]             = useState<Customer | null>(null)
  const [editForm, setEditForm]           = useState({ ...EMPTY })
  const [editSaving, setEditSaving]       = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

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
    if (r.ok) { const d = await r.json(); setCustomers(d.items||[]); setTotal(d.total||0) }
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

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault(); setAddSaving(true)
    const token = localStorage.getItem('crm_token')!
    const r = await fetch(`${API}/api/v1/contacts`, {
      method:'POST', headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json' },
      body: JSON.stringify(addForm),
    })
    if (r.ok) { setShowAdd(false); setAddForm({ ...EMPTY }); load() }
    setAddSaving(false)
  }

  function openEdit(c: Customer) {
    setEditing(c)
    setEditForm({ first_name:c.first_name||'', last_name:c.last_name||'', email:c.email||'',
      company:c.company||'', title:c.title||'', phone:c.phone||'', stage:c.stage||'lead',
      city:c.city||'', state:c.state||'', country:c.country||'', zip_code:c.zip_code||'' })
    setDeleteConfirm(false)
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault(); setEditSaving(true)
    const token = localStorage.getItem('crm_token')!
    let ok = false
    for (const method of ['PATCH', 'PUT']) {
      const r = await fetch(`${API}/api/v1/contacts/${editing!.id}`, {
        method, headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json' },
        body: JSON.stringify(editForm),
      })
      if (r.ok) { ok = true; break }
    }
    if (ok) { setEditing(null); load() }
    setEditSaving(false)
  }

  async function handleDelete() {
    const token = localStorage.getItem('crm_token')!
    const r = await fetch(`${API}/api/v1/contacts/${editing!.id}`, {
      method:'DELETE', headers:{ Authorization:`Bearer ${token}` },
    })
    if (r.ok || r.status === 204) { setEditing(null); load() }
    setDeleteConfirm(false)
  }

  const pages = Math.ceil(total / PER_PAGE)

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total.toLocaleString()} total · click any row to edit</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
          + Add Customer
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
                {[['first_name','Name'],['company','Company'],['email','Email'],['stage','Stage'],['city','Location']].map(([f,l])=>(
                  <th key={f} onClick={()=>toggleSort(f)}
                    className="px-5 py-3.5 text-left cursor-pointer hover:text-slate-700 select-none whitespace-nowrap">
                    {l}<SortIcon f={f}/>
                  </th>
                ))}
                <th className="px-5 py-3.5 text-left">Phone</th>
                <th className="px-5 py-3.5 text-left text-blue-400">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-400">Loading…</td></tr>
              ) : customers.length===0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-400">No customers found.</td></tr>
              ) : customers.map(c=>(
                <tr key={c.id} onClick={()=>openEdit(c)} className="hover:bg-blue-50/40 cursor-pointer transition-colors group">
                  <td className="px-5 py-4 font-semibold text-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {c.first_name?.[0]}{c.last_name?.[0]}
                      </div>
                      {c.first_name} {c.last_name}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-500">{c.company||'—'}</td>
                  <td className="px-5 py-4 text-slate-500">{c.email}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${BADGE[c.stage]||'bg-slate-100 text-slate-600'}`}>
                      {c.stage}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500 text-xs">
                    {formatLocation(c) ? (
                      <span className="flex items-center gap-1">📍 {formatLocation(c)}</span>
                    ) : '—'}
                  </td>
                  <td className="px-5 py-4 text-slate-500">{c.phone||'—'}</td>
                  <td className="px-5 py-4">
                    <span className="text-blue-400 group-hover:text-blue-600 text-lg transition-colors">✎</span>
                  </td>
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
        ) : customers.length===0 ? (
          <div className="text-center py-10 text-slate-400">No customers found.</div>
        ) : customers.map(c=>(
          <div key={c.id} onClick={()=>openEdit(c)} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 cursor-pointer hover:border-blue-300 transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {c.first_name?.[0]}{c.last_name?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{c.first_name} {c.last_name}</p>
                  <p className="text-xs text-slate-500">{c.title}{c.company?` · ${c.company}`:''}</p>
                </div>
              </div>
              <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${BADGE[c.stage]||'bg-slate-100 text-slate-600'}`}>
                {c.stage}
              </span>
            </div>
            <div className="mt-3 space-y-1 text-xs text-slate-500">
              {c.email && <p>✉ {c.email}</p>}
              {c.phone && <p>📞 {c.phone}</p>}
              {formatLocation(c) && <p>📍 {formatLocation(c)}{c.zip_code ? ` ${c.zip_code}` : ''}</p>}
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

      {/* ── Add Customer Modal ─────────────────────────────────────────────── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">New Customer</h2>
              <button onClick={()=>setShowAdd(false)} className="text-slate-400 hover:text-slate-700 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="First Name" value={addForm.first_name} required onChange={v=>setAddForm(x=>({...x,first_name:v}))} />
                <Input label="Last Name"  value={addForm.last_name}  required onChange={v=>setAddForm(x=>({...x,last_name:v}))} />
              </div>
              <Input label="Email"     type="email" value={addForm.email}   required onChange={v=>setAddForm(x=>({...x,email:v}))} />
              <Input label="Phone"     type="tel"   value={addForm.phone}            onChange={v=>setAddForm(x=>({...x,phone:v}))} />
              <Input label="Company"               value={addForm.company}           onChange={v=>setAddForm(x=>({...x,company:v}))} />
              <Input label="Job Title"             value={addForm.title}             onChange={v=>setAddForm(x=>({...x,title:v}))} />
              <Select label="Stage" value={addForm.stage} onChange={v=>setAddForm(x=>({...x,stage:v}))} options={STAGES.filter(s=>s)} />
              <AddressSection form={addForm} setForm={setAddForm} />
              <button type="submit" disabled={addSaving}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors">
                {addSaving ? 'Saving…' : 'Add Customer'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Customer Drawer ───────────────────────────────────────────── */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-end bg-black/40"
          onClick={e=>{ if(e.target===e.currentTarget){ setEditing(null); setDeleteConfirm(false) }}}>
          <div className="bg-white w-full sm:w-[440px] sm:h-full rounded-t-3xl sm:rounded-none shadow-2xl flex flex-col max-h-[92vh] sm:max-h-full overflow-hidden"
            onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                  {editing.first_name?.[0]}{editing.last_name?.[0]}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">{editing.first_name} {editing.last_name}</h2>
                  <p className="text-xs text-slate-500">Edit customer details</p>
                </div>
              </div>
              <button onClick={()=>{ setEditing(null); setDeleteConfirm(false) }}
                className="text-slate-400 hover:text-slate-700 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleEditSave} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="First Name" value={editForm.first_name} required onChange={v=>setEditForm(x=>({...x,first_name:v}))} />
                <Input label="Last Name"  value={editForm.last_name}  required onChange={v=>setEditForm(x=>({...x,last_name:v}))} />
              </div>
              <Input label="Email"     type="email" value={editForm.email}   required onChange={v=>setEditForm(x=>({...x,email:v}))} />
              <Input label="Phone"     type="tel"   value={editForm.phone}            onChange={v=>setEditForm(x=>({...x,phone:v}))} />
              <Input label="Company"               value={editForm.company}           onChange={v=>setEditForm(x=>({...x,company:v}))} />
              <Input label="Job Title"             value={editForm.title}             onChange={v=>setEditForm(x=>({...x,title:v}))} />
              <Select label="Stage" value={editForm.stage} onChange={v=>setEditForm(x=>({...x,stage:v}))} options={STAGES.filter(s=>s)} />
              <AddressSection form={editForm} setForm={setEditForm} />
              <div className="pt-2 space-y-3">
                <button type="submit" disabled={editSaving}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors">
                  {editSaving ? 'Saving…' : '✓ Save Changes'}
                </button>
                {!deleteConfirm ? (
                  <button type="button" onClick={()=>setDeleteConfirm(true)}
                    className="w-full py-2.5 border border-red-200 text-red-500 hover:bg-red-50 font-medium rounded-xl transition-colors text-sm">
                    Delete Customer
                  </button>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-sm font-semibold text-red-700 mb-3">Delete {editing.first_name}? This cannot be undone.</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={handleDelete}
                        className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm">Yes, Delete</button>
                      <button type="button" onClick={()=>setDeleteConfirm(false)}
                        className="flex-1 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium rounded-lg text-sm">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
