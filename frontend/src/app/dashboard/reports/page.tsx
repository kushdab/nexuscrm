'use client'
import { useEffect, useState, useCallback } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || ''
const QUARTERS = ['Q1','Q2','Q3','Q4']
const Q_MONTHS: Record<string,[number,number,number]> = { Q1:[1,2,3], Q2:[4,5,6], Q3:[7,8,9], Q4:[10,11,12] }
const MONTH_NAMES = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const STAGE_COLOR: Record<string,string> = {
  lead:'bg-blue-500', qualified:'bg-yellow-500', proposal:'bg-orange-500',
  negotiation:'bg-purple-500', closed_won:'bg-green-500', closed_lost:'bg-red-500',
}

interface Deal   { id:string; value:number; stage:string; created_at:string; close_date?:string; title:string }
interface Contact{ id:string; created_at:string; first_name:string; last_name:string; company:string }

function inQ(dateStr:string, year:number, months:[number,number,number]) {
  if (!dateStr) return false
  const d = new Date(dateStr); return d.getFullYear()===year && months.includes(d.getMonth()+1)
}

export default function ReportsPage() {
  const now    = new Date()
  const [year, setYear]       = useState(now.getFullYear())
  const [quarter, setQuarter] = useState(`Q${Math.ceil((now.getMonth()+1)/3)}`)
  const [deals, setDeals]     = useState<Deal[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const token = localStorage.getItem('crm_token'); if (!token) return
    setLoading(true)
    const [dr, cr] = await Promise.all([
      fetch(`${API}/api/v1/deals?limit=1000`,    { headers:{ Authorization:`Bearer ${token}` } }),
      fetch(`${API}/api/v1/contacts?limit=1000`, { headers:{ Authorization:`Bearer ${token}` } }),
    ])
    if (dr.ok) { const d=await dr.json(); setDeals(d.items||[]) }
    if (cr.ok) { const d=await cr.json(); setContacts(d.items||[]) }
    setLoading(false)
  }, [])
  useEffect(()=>{ load() },[load])

  const months = Q_MONTHS[quarter]
  const prevQ  = quarter==='Q1'?'Q4':QUARTERS[QUARTERS.indexOf(quarter)-1]
  const prevY  = quarter==='Q1'?year-1:year
  const prevMs = Q_MONTHS[prevQ]

  // Current quarter metrics
  const qDeals    = deals.filter(d=>inQ(d.created_at,year,months))
  const qContacts = contacts.filter(c=>inQ(c.created_at,year,months))
  const qRevenue  = qDeals.filter(d=>d.stage==='closed_won').reduce((s,d)=>s+(d.value||0),0)
  const qPipeline = qDeals.filter(d=>d.stage!=='closed_lost').reduce((s,d)=>s+(d.value||0),0)
  const qWinRate  = qDeals.length ? Math.round(qDeals.filter(d=>d.stage==='closed_won').length/qDeals.length*100) : 0
  const qAvgDeal  = qDeals.length ? Math.round(qDeals.reduce((s,d)=>s+(d.value||0),0)/qDeals.length) : 0

  // Prev quarter metrics for % change
  const pDeals    = deals.filter(d=>inQ(d.created_at,prevY,prevMs))
  const pContacts = contacts.filter(c=>inQ(c.created_at,prevY,prevMs))
  const pRevenue  = pDeals.filter(d=>d.stage==='closed_won').reduce((s,d)=>s+(d.value||0),0)
  const pPipeline = pDeals.filter(d=>d.stage!=='closed_lost').reduce((s,d)=>s+(d.value||0),0)
  const pWinRate  = pDeals.length ? Math.round(pDeals.filter(d=>d.stage==='closed_won').length/pDeals.length*100) : 0

  function pct(curr:number, prev:number) {
    if (!prev) return curr>0 ? '+∞%' : '—'
    const p = Math.round((curr-prev)/prev*100)
    return (p>=0?'+':'')+p+'%'
  }
  function pctClass(curr:number, prev:number) {
    if (!prev) return 'text-slate-500'
    return curr>=prev ? 'text-green-600' : 'text-red-500'
  }

  // Monthly breakdown within quarter
  const monthlyData = months.map(m => ({
    month: MONTH_NAMES[m],
    revenue: deals.filter(d=>inQ(d.created_at,year,[m,m,m]) && d.stage==='closed_won').reduce((s,d)=>s+(d.value||0),0),
    pipeline: deals.filter(d=>inQ(d.created_at,year,[m,m,m]) && d.stage!=='closed_lost').reduce((s,d)=>s+(d.value||0),0),
    count: deals.filter(d=>inQ(d.created_at,year,[m,m,m])).length,
  }))

  // Stage breakdown
  const stageCounts = Object.fromEntries(['lead','qualified','proposal','negotiation','closed_won','closed_lost'].map(s=>[
    s, qDeals.filter(d=>d.stage===s).length
  ]))

  const kpis = [
    { label:'Revenue', value:`$${qRevenue.toLocaleString()}`, prev:pRevenue, curr:qRevenue, fmt:'$' },
    { label:'New Contacts', value:String(qContacts.length), prev:pContacts.length, curr:qContacts.length, fmt:'' },
    { label:'Deals Created', value:String(qDeals.length), prev:pDeals.length, curr:qDeals.length, fmt:'' },
    { label:'Win Rate', value:`${qWinRate}%`, prev:pWinRate, curr:qWinRate, fmt:'%' },
    { label:'Pipeline', value:`$${qPipeline.toLocaleString()}`, prev:pPipeline, curr:qPipeline, fmt:'$' },
    { label:'Avg Deal Size', value:`$${qAvgDeal.toLocaleString()}`, prev:0, curr:qAvgDeal, fmt:'$' },
  ]

  const maxBar = Math.max(...monthlyData.map(m=>m.pipeline), 1)

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quarterly Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">{quarter} {year} vs {prevQ} {prevY}</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select value={year} onChange={e=>setYear(Number(e.target.value))}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {[year-1,year,year+1].map(y=><option key={y} value={y}>{y}</option>)}
          </select>
          {QUARTERS.map(q=>(
            <button key={q} onClick={()=>setQuarter(q)}
              className={`px-4 py-2 text-sm font-bold rounded-xl border transition-colors ${quarter===q?'bg-blue-600 text-white border-blue-600 shadow-md':'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
              {q}
            </button>
          ))}
          <button onClick={()=>window.print()}
            className="px-4 py-2 text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors shadow-sm">
            ↓ Export PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading…</div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            {kpis.map(k=>(
              <div key={k.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <p className="text-xs text-slate-500 font-medium mb-1">{k.label}</p>
                <p className="text-xl sm:text-2xl font-extrabold text-slate-900">{k.value}</p>
                <p className={`text-xs font-semibold mt-1 ${pctClass(k.curr,k.prev)}`}>
                  {pct(k.curr,k.prev)} vs prev quarter
                </p>
              </div>
            ))}
          </div>

          {/* Monthly bar chart */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 mb-6">
            <h3 className="text-base font-bold text-slate-800 mb-5">Monthly Breakdown</h3>
            <div className="grid grid-cols-3 gap-4">
              {monthlyData.map(m=>(
                <div key={m.month}>
                  <p className="text-xs font-semibold text-slate-500 mb-2 text-center">{m.month}</p>
                  <div className="flex flex-col gap-1.5">
                    {/* Pipeline bar */}
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div className="bg-blue-400 h-3 rounded-full transition-all duration-500"
                        style={{width:`${Math.round(m.pipeline/maxBar*100)}%`}} />
                    </div>
                    {/* Revenue bar */}
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div className="bg-blue-700 h-3 rounded-full transition-all duration-500"
                        style={{width:`${Math.round(m.revenue/maxBar*100)}%`}} />
                    </div>
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-xs text-slate-500">{m.count} deals</p>
                    <p className="text-sm font-bold text-slate-800">${m.revenue.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-5 mt-4 pt-4 border-t border-slate-100">
              <span className="flex items-center gap-2 text-xs text-slate-500"><span className="w-3 h-3 rounded-full bg-blue-400 inline-block"/>Pipeline</span>
              <span className="flex items-center gap-2 text-xs text-slate-500"><span className="w-3 h-3 rounded-full bg-blue-700 inline-block"/>Revenue</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Stage breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
              <h3 className="text-base font-bold text-slate-800 mb-4">Stage Distribution</h3>
              <div className="space-y-3">
                {Object.entries(stageCounts).map(([s,count])=>{
                  const pct = qDeals.length ? Math.round(count/qDeals.length*100) : 0
                  return (
                    <div key={s}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-700 capitalize">{s.replace('_',' ')}</span>
                        <span className="text-slate-500">{count} · {pct}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5">
                        <div className={`${STAGE_COLOR[s]||'bg-slate-400'} h-2.5 rounded-full transition-all duration-700`}
                          style={{width:`${pct}%`}} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Top deals */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
              <h3 className="text-base font-bold text-slate-800 mb-4">Top Deals This Quarter</h3>
              <div className="space-y-2">
                {qDeals.sort((a,b)=>(b.value||0)-(a.value||0)).slice(0,6).map(d=>(
                  <div key={d.id} className="flex items-center justify-between gap-3">
                    <p className="text-sm text-slate-700 truncate">{d.title}</p>
                    <p className="text-sm font-bold text-slate-900 flex-shrink-0">${(d.value||0).toLocaleString()}</p>
                  </div>
                ))}
                {qDeals.length===0 && <p className="text-sm text-slate-400">No deals this quarter.</p>}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
