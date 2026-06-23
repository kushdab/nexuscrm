'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || ''
const PAGE_SIZE = 15

interface Contact {
  id: string; first_name: string; last_name: string
  email: string; phone: string; company: string; title: string; stage: string
}

const STAGES = ['lead','prospect','qualified','proposal','negotiation','customer','closed_won','closed_lost','churned']

const STAGE_COLOR: Record<string, string> = {
  lead:'bg-blue-100 text-blue-700', prospect:'bg-slate-100 text-slate-600',
  qualified:'bg-yellow-100 text-yellow-700', proposal:'bg-orange-100 text-orange-700',
  negotiation:'bg-purple-100 text-purple-700', customer:'bg-teal-100 text-teal-700',
  closed_won:'bg-green-100 text-green-700', closed_lost:'bg-red-100 text-red-700',
  churned:'bg-gray-100 text-gray-600',
}

type SortKey = 'name' | 'company' | 'stage' | 'email'
type SortDir = 'asc' | 'desc'

const BLANK = { first_name:'', last_name:'', email:'', phone:'', company:'', title:'', stage:'lead' }

export default function ContactsPage() {
  const router = useRouter()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  // Filters
  const [query, setQuery]       = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [sortKey, setSortKey]   = useState<SortKey>('name')
  const [sortDir, setSortDir]   = useState<SortDir>('asc')
  const [page, setPage]         = useState(1)

  // Add contact modal
  const [showAdd, setShowAdd]   = useState(false)
  const [form, setForm]         = useState(BLANK)
  const [saving, setSaving]     = useState(false)
  const [formErr, setFormErr]   = useState('')

  const token = useCallback(() => localStorage.getItem('crm_token'), [])

  const loadContacts = useCallback(async () => {
    const t = token()
    if (!t) { router.push('/login'); return }
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/v1/contacts?limit=200`, { headers: { Authorization: `Bearer ${t}` }})
      if (res.status === 401) { localStorage.removeItem('crm_token'); router.push('/login'); return }
      const data = await res.json()
      setContacts(data.items || [])
    } catch { setError('Failed to load contacts') }
    finally { setLoading(false) }
  }, [router, token])

  useEffect(() => { loadContacts() }, [loadContacts])

  // Client-side filter + sort
  const filtered = useMemo(() => {
    let list = [...contacts]
    if (stageFilter) list = list.filter(c => c.stage === stageFilter)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(c =>
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q) ||
        c.title?.toLowerCase().includes(q)
      )
    }
    list.sort((a, b) => {
      let va = '', vb = ''
      if (sortKey === 'name')    { va = `${a.first_name} ${a.last_name}`; vb = `${b.first_name} ${b.last_name}` }
      if (sortKey === 'company') { va = a.company || ''; vb = b.company || '' }
      if (sortKey === 'stage')   { va = a.stage || '';   vb = b.stage || '' }
      if (sortKey === 'email')   { va = a.email || '';   vb = b.email || '' }
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    })
    return list
  }, [contacts, query, stageFilter, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
    setPage(1)
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span className="ml-1 text-slate-300">↕</span>
    return <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  async function addContact() {
    const t = token(); if (!t) return
    setSaving(true); setFormErr('')
    try {
      const res = await fetch(`${API}/api/v1/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.detail || 'Failed to create contact')
      }
      setShowAdd(false); setForm(BLANK); loadContacts()
    } catch (e: unknown) { setFormErr(e instanceof Error ? e.message : 'Error') }
    finally { setSaving(false) }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">Contacts</h2>
          <p className="text-sm text-slate-500 mt-0.5">{filtered.length} of {contacts.length} contacts</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          Add Contact
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z"/>
          </svg>
          <input
            type="text" placeholder="Search name, email, company…"
            value={query} onChange={e => { setQuery(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Stage filter */}
        <select value={stageFilter} onChange={e => { setStageFilter(e.target.value); setPage(1) }}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="">All Stages</option>
          {STAGES.map(s => <option key={s} value={s}>{s.replace('_',' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
        </select>

        {/* Clear filters */}
        {(query || stageFilter) && (
          <button onClick={() => { setQuery(''); setStageFilter(''); setPage(1) }}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading contacts…</div>
        ) : paginated.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            {contacts.length === 0 ? 'No contacts yet. Click "Add Contact" to create one.' : 'No contacts match your filters.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                <tr>
                  {([['name','Name'],['company','Company'],['email','Email'],['stage','Stage']] as [SortKey, string][]).map(([k, label]) => (
                    <th key={k} onClick={() => toggleSort(k)}
                      className="px-4 py-3 text-left cursor-pointer select-none hover:text-slate-700">
                      {label}<SortIcon k={k} />
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                      {c.first_name} {c.last_name}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{c.company || '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{c.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STAGE_COLOR[c.stage] || 'bg-slate-100 text-slate-600'}`}>
                        {c.stage}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{c.title || '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{c.phone || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Showing {((page-1)*PAGE_SIZE)+1}–{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-md disabled:opacity-40 hover:bg-slate-50 transition-colors">
                ← Prev
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page + i - 3
                if (p < 1 || p > totalPages) return null
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`px-3 py-1.5 text-xs border rounded-md transition-colors ${
                      p === page ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 hover:bg-slate-50'
                    }`}>
                    {p}
                  </button>
                )
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-md disabled:opacity-40 hover:bg-slate-50 transition-colors">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">Add Contact</h3>
              <button onClick={() => { setShowAdd(false); setForm(BLANK); setFormErr('') }}
                className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {formErr && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{formErr}</div>}
              <div className="grid grid-cols-2 gap-4">
                {([['first_name','First name'],['last_name','Last name']] as [keyof typeof form, string][]).map(([f, label]) => (
                  <div key={f}>
                    <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                    <input type="text" value={form[f]}
                      onChange={e => setForm(x => ({ ...x, [f]: e.target.value }))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                  </div>
                ))}
              </div>
              {([['email','Email','email'],['phone','Phone','tel'],['company','Company','text'],['title','Job title','text']] as [keyof typeof form, string, string][]).map(([f, label, type]) => (
                <div key={f}>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                  <input type={type} value={form[f]}
                    onChange={e => setForm(x => ({ ...x, [f]: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Stage</label>
                <select value={form.stage} onChange={e => setForm(x => ({ ...x, stage: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  {STAGES.map(s => <option key={s} value={s}>{s.replace('_',' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button onClick={() => { setShowAdd(false); setForm(BLANK); setFormErr('') }}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={addContact} disabled={saving || !form.first_name || !form.last_name || !form.email}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
                {saving ? 'Saving…' : 'Add Contact'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
