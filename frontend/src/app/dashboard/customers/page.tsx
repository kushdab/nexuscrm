'use client'
import { useEffect, useState, useCallback, useRef } from 'react'

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
const EMPTY_FORM = {
  first_name:'', last_name:'', email:'', company:'', title:'', phone:'', stage:'lead',
  city:'', state:'', country:'', zip_code:'',
}

// ── Address Autocomplete (Nominatim / OpenStreetMap — free, no API key) ──────
interface NominatimResult {
  display_name: string
  address: {
    city?: string; town?: string; village?: string; suburb?: string
    state?: string; county?: string
    postcode?: string
    country?: string
    country_code?: string
  }
}

function useAddressAutocomplete(onSelect: (vals: Record<string,string>) => void) {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState<NominatimResult[]>([])
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>|null>(null)

  useEffect(() => {
    if (query.length < 3) { setResults([]); setOpen(false); return }
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      setLoading(true)
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=6&countrycodes=us`
        const r = await fetch(url, { headers: { 'Accept-Language': 'en' } })
        if (r.ok) { const d = await r.json(); setResults(d); setOpen(d.length > 0) }
      } catch { /* ignore */ }
      setLoading(false)
    }, 400)
  }, [query])

  function pick(item: NominatimResult) {
    const a = item.address
    const city = a.city || a.town || a.village || a.suburb || ''
    const state = a.state || a.county || ''
    const country = a.country || ''
    const zip_code = a.postcode || ''
    onSelect({ city, state, country, zip_code })
    setQuery('')
    setResults([])
    setOpen(false)
  }

  return { query, setQuery, results, open, setOpen, loading, pick }
}

// ── Reusable field ────────────────────────────────────────────────────────────
function Field({ label, value, onChange, required, type='text', options, placeholder }:{
  label:string; value:string; onChange:(v:string)=>void;
  required?:boolean; type?:string; options?:string[]; placeholder?:string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {options ? (
        <select value={value} onChange={e=>onChange(e.target.value)}
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          {options.map(o=><option key={o} value={o} className="capitalize">{o.charAt(0).toUpperCase()+o.slice(1)||'—'}</option>)}
        </select>
      ) : (
        <input type={type} value={value} required={required} placeholder={placeholder}
          onChange={e=>onChange(e.target.value)}
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      )}
    </div>
  )
}

// ── Address section with autocomplete ────────────────────────────────────────
function AddressSection({
  form, setForm
}: {
  form: typeof EMPTY_FORM
  setForm: (fn: (x: typeof EMPTY_FORM) => typeof EMPTY_FORM) => void
}) {
  const ac = useAddressAutocomplete(vals =>
    setForm(x => ({ ...x, ...vals }))
  )

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider pt-1">Address</p>

      {/* Search bar */}
      <div className="relative">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            type="text"
            value={ac.query}
            onChange={e => ac.setQuery(e.target.value)}
            placeholder="Search address to auto-fill…"
            className="w-full border border-blue-300 rounded-xl pl-9 pr-3 py-2.5 text-sm bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
          />
          {ac.loading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">…</span>
          )}
        </div>
        {ac.open && ac.results.length > 0 && (
          <div className="absolute z-50 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
            {ac.results.map((item, i) => (
              <button key={i} type="button"
                onMouseDown={() => ac.pick(item)}
                className="w-full text-left px-4 py-3 text-sm hover:bg-blue-50 border-b border-slate-100 last:border-0 transition-colors">
                <span className="text-slate-800 font-medium">
                  {(item.address.city || item.address.town || item.address.village || item.address.suburb) || ''}
                  {item.address.state ? `, ${item.address.state}` : ''}
                </span>
                <span className="text-slate-400 text-xs ml-1">
                  {item.address.postcode ? `· ${item.address.postcode}` : ''}
                </span>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{item.display_name}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Manual fields */}
      <Field label="City" value={form.city} placeholder="e.g. Salt Lake City"
        onChange={v => setForm(x => ({...x, city: v}))} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="State / Province" value={form.state} placeholder="e.g. Utah"
          onChange={v => setForm(x => ({...x, state: v}))} />
        <Field label="Zip / Postal Code" value={form.zip_code} placeholder="e.g. 84101"
          onChange={v => setForm(x => ({...x, zip_code: v}))} />
      </div>
      <Field label="Country" value={form.country} placeholder="e.g. United States"
        onChange={v => setForm(x => ({...x, country: v}))} />
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [stage, setStage]         = useState('')
  const [sortField, setSortField] = useState('first_name')
  const [sortDir, setSortDir]     = useState<'asc'|'desc'>('asc')
  const [page, setPage]           = useState(1)
  const [total, setTotal]         = useState(0)
  const [showAdd, setShowAdd]     = useState(false)
  const [addForm, setAddForm]     = useState({ ...EMPTY_FORM })
  const [addSaving, setAddSaving] = useState(false)
  const [editing, setEditing]     = useState<Customer | null>(null)
  const [editForm, setEditForm]   = useState({ ...EMPTY_FORM })
  const [editSaving, setEditSaving] = useState(false)
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
    if (r.ok) { setShowAdd(false); setAddForm({ ...EMPTY_FORM }); load() }
    setAddSaving(false)
  }

  function openEdit(c: Customer) {
    setEditing(c)
    setEditForm({
      first_name: c.first_name||'', last_name: c.last_name||'',
      email: c.email||'', company: c.company||'', title: c.title||'',
      phone: c.phone||'', stage: c.stage||'lead',
      city: c.city||'', state: c.state||'', country: c.country||'', zip_code: c.zip_code||'',
    })
    setDeleteConfirm(false)
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault(); setEditSaving(true)
    const token = localStorage.getItem('crm_token')!
    let r = await fetch(`${API}/api/v1/contacts/${editing!.id}`, {
      method:'PATCH', headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json' },
      body: JSON.stringify(editForm),
    })
    if (!r.ok) {
      r = await fetch(`${API}/api/v1/contacts/${editing!.id}`, {
        method:'PUT', headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json' },
        body: JSON.stringify(editForm),
      })
    }
    if (r.ok) { setEditing(null); load() }
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

  const FormBody = ({ form, setForm, saving, btnLabel }: {
    form: typeof EMPTY_FORM
    setForm: (fn: (x: typeof EMPTY_FORM) => typeof EMPTY_FORM) => void
    saving: boolean
    btnLabel: string
  }) => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Field label="First Name" value={form.first_name} required onChange={v=>setForm(x=>({...x,first_name:v}))} />
        <Field label="Last Name"  value={form.last_name}  required onChange={v=>setForm(x=>({...x,last_name:v}))} />
      </div>
      <Field label="Email"     type="email" value={form.email}   required onChange={v=>setForm(x=>({...x,email:v}))} />
      <Field label="Phone"     type="tel"   value={form.phone}            onChange={v=>setForm(x=>({...x,phone:v}))} />
      <Field label="Company"               value={form.company}           onChange={v=>setForm(x=>({...x,company:v}))} />
      <Field label="Job Title"             value={form.title}             onChange={v=>setForm(x=>({...x,title:v}))} />
      <Field label="Stage" value={form.stage} onChange={v=>setForm(x=>({...x,stage:v}))}
        options={STAGES.filter(s=>s)} />
      <AddressSection form={form} setForm={setForm} />
      <button type="submit" disabled={saving}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors">
        {saving ? 'Saving…' : btnLabel}
      </button>
    </>
  )

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
                {[['first_name','Name'],['company','Company'],['email','Email'],['stage','Stage']].map(([f,l])=>(
                  <th key={f} onClick={()=>toggleSort(f)}
                    className="px-5 py-3.5 text-left cursor-pointer hover:text-slate-700 select-none whitespace-nowrap">
                    {l}<SortIcon f={f}/>
                  </th>
                ))}
                <th className="px-5 py-3.5 text-left">Location</th>
                <th className="px-5 py-3.5 text-left text-blue-400">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400">Loading…</td></tr>
              ) : customers.length===0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400">No customers found.</td></tr>
              ) : customers.map(c=>(
                <tr key={c.id} onClick={()=>openEdit(c)}
                  className="hover:bg-blue-50/40 cursor-pointer transition-colors group">
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
                    {[c.city, c.state, c.zip_code].filter(Boolean).join(', ') || '—'}
                  </td>
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
        {loading ? <div className="text-center py-10 text-slate-400">Loading…</div>
        : customers.length===0 ? <div className="text-center py-10 text-slate-400">No customers found.</div>
        : customers.map(c=>(
          <div key={c.id} onClick={()=>openEdit(c)}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 cursor-pointer hover:border-blue-300 transition-colors">
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
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${BADGE[c.stage]||'bg-slate-100 text-slate-600'}`}>
                {c.stage}
              </span>
            </div>
            <div className="mt-3 space-y-1 text-xs text-slate-500">
              {c.email && <p>✉ {c.email}</p>}
              {c.phone && <p>📞 {c.phone}</p>}
              {(c.city||c.state) && <p>📍 {[c.city, c.state, c.zip_code].filter(Boolean).join(', ')}</p>}
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

      {/* ── Add Customer Modal ───────────────────────────────────────────── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">New Customer</h2>
              <button onClick={()=>setShowAdd(false)} className="text-slate-400 hover:text-slate-700 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <FormBody form={addForm} setForm={setAddForm as any} saving={addSaving} btnLabel="Add Customer" />
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Customer Drawer ─────────────────────────────────────────── */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-end bg-black/40"
          onClick={e=>{ if(e.target===e.currentTarget){ setEditing(null); setDeleteConfirm(false) }}}>
          <div className="bg-white w-full sm:w-[420px] sm:h-full rounded-t-3xl sm:rounded-none shadow-2xl flex flex-col max-h-[92vh] sm:max-h-full overflow-hidden"
            onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
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
              <FormBody form={editForm} setForm={setEditForm as any} saving={editSaving} btnLabel="✓ Save Changes" />
              <div className="pt-2">
                {!deleteConfirm ? (
                  <button type="button" onClick={()=>setDeleteConfirm(true)}
                    className="w-full py-2.5 border border-red-200 text-red-500 hover:bg-red-50 font-medium rounded-xl transition-colors text-sm">
                    Delete Customer
                  </button>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-sm font-semibold text-red-700 mb-3">
                      Delete {editing.first_name} {editing.last_name}? This cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <button type="button" onClick={handleDelete}
                        className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm">Yes, Delete</button>
                      <button type="button" onClick={()=>setDeleteConfirm(false)}
                        className="flex-1 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-sm">Cancel</button>
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
