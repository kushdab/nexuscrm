'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || ''

interface Deal {
  id: string; title: string; value: number; stage: string
  contact_id?: string; description?: string
}

const COLUMNS = [
  { key: 'lead',        label: 'Lead',        color: 'border-blue-300 bg-blue-50',     badge: 'bg-blue-100 text-blue-700' },
  { key: 'qualified',   label: 'Qualified',   color: 'border-yellow-300 bg-yellow-50', badge: 'bg-yellow-100 text-yellow-700' },
  { key: 'proposal',    label: 'Proposal',    color: 'border-orange-300 bg-orange-50', badge: 'bg-orange-100 text-orange-700' },
  { key: 'negotiation', label: 'Negotiation', color: 'border-purple-300 bg-purple-50', badge: 'bg-purple-100 text-purple-700' },
  { key: 'closed_won',  label: 'Closed Won',  color: 'border-green-300 bg-green-50',   badge: 'bg-green-100 text-green-700' },
  { key: 'closed_lost', label: 'Closed Lost', color: 'border-red-300 bg-red-50',       badge: 'bg-red-100 text-red-700' },
]

export default function DealsPage() {
  const router  = useRouter()
  const [deals, setDeals]   = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView]     = useState<'kanban' | 'list'>('kanban')
  const [stageFilter, setStageFilter] = useState('')
  const [query, setQuery]   = useState('')

  const loadDeals = useCallback(async () => {
    const token = localStorage.getItem('crm_token')
    if (!token) { router.push('/login'); return }
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/v1/deals?limit=200`, { headers: { Authorization: `Bearer ${token}` }})
      if (res.status === 401) { localStorage.removeItem('crm_token'); router.push('/login'); return }
      const data = await res.json()
      setDeals(data.items || [])
    } finally { setLoading(false) }
  }, [router])

  useEffect(() => { loadDeals() }, [loadDeals])

  const filtered = deals.filter(d => {
    if (stageFilter && d.stage !== stageFilter) return false
    if (query && !d.title.toLowerCase().includes(query.toLowerCase())) return false
    return true
  })

  const byStage = (stage: string) => filtered.filter(d => d.stage === stage)
  const stageTotal = (stage: string) => byStage(stage).reduce((s, d) => s + (d.value || 0), 0)

  const totalPipeline = filtered.reduce((s, d) => s + (d.value || 0), 0)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">Deals</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {filtered.length} deals · Pipeline: <span className="font-semibold text-slate-700">${totalPipeline.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z"/>
            </svg>
            <input type="text" placeholder="Search deals…" value={query}
              onChange={e => setQuery(e.target.value)}
              className="pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"/>
          </div>

          {/* Stage filter (list view) */}
          {view === 'list' && (
            <select value={stageFilter} onChange={e => setStageFilter(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">All Stages</option>
              {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          )}

          {/* View toggle */}
          <div className="flex border border-slate-300 rounded-lg overflow-hidden">
            <button onClick={() => setView('kanban')}
              className={`px-3 py-2 text-sm transition-colors ${view === 'kanban' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
              Board
            </button>
            <button onClick={() => setView('list')}
              className={`px-3 py-2 text-sm transition-colors border-l border-slate-300 ${view === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
              List
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-400 text-sm">Loading deals…</div>
      ) : view === 'kanban' ? (
        /* ── KANBAN BOARD ── */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map(col => {
            const colDeals = byStage(col.key)
            const colTotal = stageTotal(col.key)
            return (
              <div key={col.key} className="flex-shrink-0 w-64">
                {/* Column header */}
                <div className={`rounded-t-xl border-t border-x ${col.color} px-3 py-2.5 flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${col.badge}`}>
                      {colDeals.length}
                    </span>
                    <span className="text-sm font-semibold text-slate-700">{col.label}</span>
                  </div>
                  <span className="text-xs text-slate-500">${(colTotal/1000).toFixed(0)}k</span>
                </div>

                {/* Cards */}
                <div className={`min-h-[200px] border-b border-x ${col.color} rounded-b-xl p-2 space-y-2`}>
                  {colDeals.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">No deals</p>
                  ) : colDeals.map(d => (
                    <div key={d.id}
                      className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                      <p className="text-sm font-medium text-slate-800 leading-snug">{d.title}</p>
                      <p className="text-sm font-bold text-slate-700 mt-1.5">${Number(d.value||0).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* ── LIST VIEW ── */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Deal</th>
                <th className="px-4 py-3 text-left">Stage</th>
                <th className="px-4 py-3 text-right">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-10 text-center text-slate-400">No deals match your filters.</td></tr>
              ) : filtered.map(d => {
                const col = COLUMNS.find(c => c.key === d.stage)
                return (
                  <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{d.title}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${col?.badge || 'bg-slate-100 text-slate-600'}`}>
                        {d.stage?.replace('_',' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-700">
                      ${Number(d.value||0).toLocaleString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
