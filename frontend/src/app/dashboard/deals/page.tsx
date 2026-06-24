'use client'
import { useEffect, useState, useCallback } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || ''

interface Deal {
  id: string; title: string; value: number; stage: string
  contact_name?: string; close_date?: string
}

const STAGES = ['lead','qualified','proposal','negotiation','closed_won','closed_lost']
const STAGE_LABEL: Record<string,string> = {
  lead:'Lead', qualified:'Qualified', proposal:'Proposal',
  negotiation:'Negotiation', closed_won:'Closed Won', closed_lost:'Closed Lost',
}
const STAGE_COLOR: Record<string,string> = {
  lead:'border-t-blue-400', qualified:'border-t-yellow-400', proposal:'border-t-orange-400',
  negotiation:'border-t-purple-400', closed_won:'border-t-green-400', closed_lost:'border-t-red-400',
}
const BADGE: Record<string,string> = {
  lead:'bg-blue-100 text-blue-700', qualified:'bg-yellow-100 text-yellow-700',
  proposal:'bg-orange-100 text-orange-700', negotiation:'bg-purple-100 text-purple-700',
  closed_won:'bg-green-100 text-green-700', closed_lost:'bg-red-100 text-red-700',
}

export default function DealsPage() {
  const [deals, setDeals]       = useState<Deal[]>([])
  const [loading, setLoading]   = useState(true)
  const [view, setView]         = useState<'kanban'|'list'>('kanban')
  const [filter, setFilter]     = useState('')
  const [search, setSearch]     = useState('')

  const load = useCallback(async () => {
    const token = localStorage.getItem('crm_token')
    if (!token) return
    setLoading(true)
    const r = await fetch(`${API}/api/v1/deals?limit=200`, { headers: { Authorization: `Bearer ${token}` } })
    if (r.ok) { const d = await r.json(); setDeals(d.items||[]) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = deals.filter(d =>
    (!filter || d.stage === filter) &&
    (!search || d.title.toLowerCase().includes(search.toLowerCase()))
  )

  const totalPipeline = deals.filter(d=>d.stage!=='closed_lost').reduce((s,d)=>s+(d.value||0),0)
  const wonValue = deals.filter(d=>d.stage==='closed_won').reduce((s,d)=>s+(d.value||0),0)
  const winRate = deals.length ? Math.round(deals.filter(d=>d.stage==='closed_won').length/deals.length*100) : 0

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Deals</h1>
          <p className="text-sm text-slate-500 mt-0.5">{deals.length} total deals</p>
        </div>
        <div className="flex gap-2">
          {(['kanban','list'] as const).map(v=>(
            <button key={v} onClick={()=>setView(v)}
              className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors border ${view===v?'bg-blue-600 text-white border-blue-600 shadow-md':'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
              {v==='kanban'?'⊞ Kanban':'☰ List'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label:'Pipeline', value:`$${totalPipeline.toLocaleString()}` },
          { label:'Won', value:`$${wonValue.toLocaleString()}` },
          { label:'Win Rate', value:`${winRate}%` },
        ].map(k=>(
          <div key={k.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 sm:p-4 text-center">
            <p className="text-xs text-slate-500">{k.label}</p>
            <p className="text-lg sm:text-2xl font-bold text-slate-900 mt-0.5">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filters (list view only) */}
      {view==='list' && (
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search deals…"
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select value={filter} onChange={e=>setFilter(e.target.value)}
            className="sm:w-48 border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Stages</option>
            {STAGES.map(s=><option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
          </select>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading…</div>
      ) : view==='kanban' ? (
        /* Kanban — horizontal scroll on mobile */
        <div className="overflow-x-auto pb-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
          <div className="flex gap-4" style={{minWidth: '900px'}}>
            {STAGES.map(s=>{
              const col = deals.filter(d=>d.stage===s)
              const colVal = col.reduce((sum,d)=>sum+(d.value||0),0)
              return (
                <div key={s} className={`flex-1 min-w-[160px] bg-white rounded-2xl border-t-4 ${STAGE_COLOR[s]} shadow-sm overflow-hidden`}>
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">{STAGE_LABEL[s]}</p>
                    <p className="text-lg font-bold text-slate-900 mt-0.5">{col.length}</p>
                    <p className="text-xs text-slate-400">${colVal.toLocaleString()}</p>
                  </div>
                  <div className="p-2 space-y-2 max-h-[60vh] overflow-y-auto">
                    {col.map(d=>(
                      <div key={d.id} className="bg-slate-50 rounded-xl p-3 hover:shadow-md transition-shadow cursor-pointer border border-slate-100">
                        <p className="text-sm font-semibold text-slate-800 leading-snug">{d.title}</p>
                        {d.contact_name && <p className="text-xs text-slate-400 mt-1">{d.contact_name}</p>}
                        <p className="text-sm font-bold text-blue-600 mt-2">${(d.value||0).toLocaleString()}</p>
                      </div>
                    ))}
                    {col.length===0 && <p className="text-xs text-slate-300 text-center py-4">No deals</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* List view */
        <>
          {/* Desktop table */}
          <div className="hidden sm:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5 text-left">Deal</th>
                    <th className="px-5 py-3.5 text-left">Stage</th>
                    <th className="px-5 py-3.5 text-right">Value</th>
                    <th className="px-5 py-3.5 text-left">Close Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(d=>(
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-semibold text-slate-800">{d.title}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${BADGE[d.stage]||''}`}>
                          {STAGE_LABEL[d.stage]||d.stage}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-slate-900">${(d.value||0).toLocaleString()}</td>
                      <td className="px-5 py-4 text-slate-500">{d.close_date||'—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {filtered.map(d=>(
              <div key={d.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-slate-900">{d.title}</p>
                  <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${BADGE[d.stage]||''}`}>
                    {STAGE_LABEL[d.stage]}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-lg font-bold text-blue-600">${(d.value||0).toLocaleString()}</p>
                  {d.close_date && <p className="text-xs text-slate-400">Closes {d.close_date}</p>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
