'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

const API = process.env.NEXT_PUBLIC_API_URL || ''

interface Contact { id:string; first_name:string; last_name:string; email:string; company:string; stage:string; created_at:string }
interface Deal    { id:string; title:string; value:number; stage:string; created_at:string }

const QUARTERS = [
  { label: 'Q1', months: [0,1,2],  name: 'January – March'   },
  { label: 'Q2', months: [3,4,5],  name: 'April – June'      },
  { label: 'Q3', months: [6,7,8],  name: 'July – September'  },
  { label: 'Q4', months: [9,10,11],name: 'October – December' },
]

const STAGE_COLORS: Record<string,string> = {
  lead:'#3b82f6',prospect:'#6366f1',qualified:'#f59e0b',
  proposal:'#f97316',negotiation:'#8b5cf6',
  closed_won:'#10b981',closed_lost:'#ef4444',
}

function Metric({ label, value, sub, color }: { label:string; value:string|number; sub?:string; color?:string }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm relative overflow-hidden print:shadow-none print:border-gray-300">
      <div className="absolute left-0 top-0 h-full w-1 rounded-l-xl" style={{ background: color||'#3b82f6' }} />
      <p className="text-xs text-gray-400 uppercase tracking-wider pl-3">{label}</p>
      <p className="text-2xl font-extrabold text-gray-900 pl-3 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 pl-3 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function ReportsPage() {
  const router = useRouter()
  const printRef = useRef<HTMLDivElement>(null)
  const today  = new Date()
  const curQ   = Math.floor(today.getMonth() / 3)

  const [year,    setYear]    = useState(today.getFullYear())
  const [quarter, setQuarter] = useState(curQ)
  const [contacts,setContacts]= useState<Contact[]>([])
  const [deals,   setDeals]   = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [org,     setOrg]     = useState('')

  const load = useCallback(async () => {
    const token = localStorage.getItem('crm_token')
    if (!token) { router.push('/login'); return }
    const h = { Authorization: `Bearer ${token}` }
    setLoading(true)
    try {
      const [cr, dr, ur] = await Promise.all([
        fetch(`${API}/api/v1/contacts?limit=1000`, { headers: h }),
        fetch(`${API}/api/v1/deals?limit=1000`,    { headers: h }),
        fetch(`${API}/api/v1/users/me`,             { headers: h }),
      ])
      const [cd, dd, ud] = await Promise.all([cr.json(), dr.json(), ur.json()])
      setContacts(cd.items || [])
      setDeals(dd.items || [])
      setOrg(ud.org_name || ud.organization?.name || '')
    } finally { setLoading(false) }
  }, [router])

  useEffect(() => { load() }, [load])

  // ── Quarter date range ──────────────────────────────────────────────────
  const q = QUARTERS[quarter]
  const qStart = new Date(year, q.months[0], 1)
  const qEnd   = new Date(year, q.months[2] + 1, 0, 23, 59, 59)
  const inQ    = (d: string) => { const t = new Date(d); return t >= qStart && t <= qEnd }

  // ── Previous quarter comparison ─────────────────────────────────────────
  const prevQi = (quarter - 1 + 4) % 4
  const prevY  = quarter === 0 ? year - 1 : year
  const pq     = QUARTERS[prevQi]
  const pStart = new Date(prevY, pq.months[0], 1)
  const pEnd   = new Date(prevY, pq.months[2] + 1, 0, 23, 59, 59)
  const inPQ   = (d: string) => { const t = new Date(d); return t >= pStart && t <= pEnd }

  // ── Compute metrics ─────────────────────────────────────────────────────
  const qContacts   = contacts.filter(c => inQ(c.created_at))
  const qDeals      = deals.filter(d => inQ(d.created_at))
  const pContacts   = contacts.filter(c => inPQ(c.created_at))
  const pDeals      = deals.filter(d => inPQ(d.created_at))

  const qClosedWon  = qDeals.filter(d => d.stage === 'closed_won')
  const qClosedLost = qDeals.filter(d => d.stage === 'closed_lost')
  const pClosedWon  = pDeals.filter(d => d.stage === 'closed_won')

  const qRevenue    = qClosedWon.reduce((s,d) => s+(d.value||0), 0)
  const pRevenue    = pClosedWon.reduce((s,d) => s+(d.value||0), 0)
  const qPipeline   = qDeals.filter(d => !['closed_won','closed_lost'].includes(d.stage))
                             .reduce((s,d) => s+(d.value||0), 0)
  const qWinRate    = (qClosedWon.length + qClosedLost.length) > 0
    ? (qClosedWon.length / (qClosedWon.length + qClosedLost.length)) * 100 : 0
  const qAvgDeal    = qDeals.length ? qDeals.reduce((s,d) => s+(d.value||0),0) / qDeals.length : 0

  const delta = (curr: number, prev: number) => {
    if (!prev) return null
    const d = ((curr - prev) / prev) * 100
    return { val: d, fmt: `${d >= 0 ? '+' : ''}${d.toFixed(1)}%`, up: d >= 0 }
  }
  const revDelta  = delta(qRevenue, pRevenue)
  const contDelta = delta(qContacts.length, pContacts.length)

  // ── Monthly breakdown within quarter ───────────────────────────────────
  const monthlyBreakdown = q.months.map(m => {
    const ms = new Date(year, m, 1)
    const me = new Date(year, m + 1, 0, 23, 59, 59)
    const inM = (d: string) => { const t = new Date(d); return t >= ms && t <= me }
    const md = deals.filter(d => inM(d.created_at))
    return {
      name: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m],
      Revenue:  md.filter(d => d.stage==='closed_won').reduce((s,d) => s+(d.value||0),0),
      Pipeline: md.filter(d => !['closed_won','closed_lost'].includes(d.stage)).reduce((s,d) => s+(d.value||0),0),
      Deals:    md.length,
    }
  })

  // ── Stage distribution ─────────────────────────────────────────────────
  const stageDist = Object.entries(
    qDeals.reduce((acc, d) => { acc[d.stage]=(acc[d.stage]||0)+1; return acc }, {} as Record<string,number>)
  ).map(([stage, count]) => ({ stage, count, pct: qDeals.length ? Math.round(count/qDeals.length*100) : 0 }))
   .sort((a,b) => b.count - a.count)

  const fmt = (n: number) => n >= 1_000_000 ? `$${(n/1_000_000).toFixed(2)}M`
    : n >= 1_000 ? `$${(n/1_000).toFixed(1)}K` : `$${n.toFixed(0)}`

  function handlePrint() { window.print() }

  const years = [today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1]

  if (loading) return <div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading…</div>

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .print-page { padding: 0; }
        }
      `}</style>

      <div className="space-y-6 print-page">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
            <p className="text-sm text-gray-400 mt-0.5">Generate and export quarterly business reports</p>
          </div>
          <div className="flex items-center gap-3">
            <select value={year} onChange={e => setYear(Number(e.target.value))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
              {years.map(y => <option key={y}>{y}</option>)}
            </select>
            {QUARTERS.map((qq, i) => (
              <button key={qq.label} onClick={() => setQuarter(i)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all
                  ${quarter === i
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'}`}>
                {qq.label}
              </button>
            ))}
            <button onClick={handlePrint}
              className="px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
              ⬇ Export PDF
            </button>
          </div>
        </div>

        {/* Report card */}
        <div ref={printRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print:rounded-none print:shadow-none print:border-none">

          {/* Report header */}
          <div className="bg-gradient-to-r from-[#111827] to-[#1e3a5f] px-8 py-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-blue-300 text-sm font-semibold uppercase tracking-widest">Quarterly Business Report</p>
                <h2 className="text-3xl font-extrabold mt-1">
                  {q.label} {year} &nbsp;·&nbsp; <span className="text-blue-300">{q.name}</span>
                </h2>
                <p className="text-white/60 text-sm mt-2">
                  Period: {qStart.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})} –{' '}
                  {qEnd.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold text-white">Nexus<span className="text-blue-400">CRM</span></p>
                {org && <p className="text-white/60 text-sm mt-1">{org}</p>}
                <p className="text-white/40 text-xs mt-1">
                  Generated {today.toLocaleDateString('en-US',{ month:'long', day:'numeric', year:'numeric' })}
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Executive summary */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Executive Summary</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Metric label="Revenue"       value={fmt(qRevenue)}
                  sub={revDelta ? `${revDelta.fmt} vs prev quarter` : 'No prev data'} color="#10b981" />
                <Metric label="New Contacts"  value={qContacts.length}
                  sub={contDelta ? `${contDelta.fmt} vs prev quarter` : undefined} color="#3b82f6" />
                <Metric label="Deals Created" value={qDeals.length}
                  sub={`${qClosedWon.length} closed won`} color="#f59e0b" />
                <Metric label="Win Rate"      value={`${qWinRate.toFixed(1)}%`}
                  sub={`${qClosedLost.length} closed lost`} color="#8b5cf6" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                <Metric label="Pipeline Value" value={fmt(qPipeline)}  sub="Open deals" color="#6366f1" />
                <Metric label="Avg Deal Size"  value={fmt(qAvgDeal)}   sub="All deals"  color="#f97316" />
                <Metric label="Total Deals"    value={qDeals.length}   sub={`${qDeals.filter(d=>d.stage==='closed_won').length} won · ${qDeals.filter(d=>d.stage==='closed_lost').length} lost`} color="#ef4444" />
              </div>
            </section>

            {/* Monthly breakdown chart */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Monthly Breakdown</h3>
              <div className="bg-gray-50 rounded-xl p-4">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlyBreakdown} barCategoryGap="35%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                      tickFormatter={v => v >= 1000 ? `$${(v/1000).toFixed(0)}K` : `$${v}`} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)', fontSize: 12 }}
                      formatter={(v: number) => [`$${v.toLocaleString()}`, undefined]} />
                    <Bar dataKey="Pipeline" fill="#dbeafe" radius={[4,4,0,0]} />
                    <Bar dataKey="Revenue"  fill="#3b82f6" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Stage distribution */}
            {stageDist.length > 0 && (
              <section>
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Deal Stage Distribution</h3>
                <div className="space-y-3">
                  {stageDist.map(({ stage, count, pct }) => (
                    <div key={stage} className="flex items-center gap-4">
                      <span className="w-28 text-xs font-medium text-gray-600 capitalize">{stage.replace('_',' ')}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: STAGE_COLORS[stage]||'#94a3b8' }} />
                      </div>
                      <span className="w-12 text-right text-xs font-semibold text-gray-700">{pct}%</span>
                      <span className="w-8 text-right text-xs text-gray-400">{count}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Top deals table */}
            {qDeals.length > 0 && (
              <section>
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Top Deals This Quarter</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-xs text-gray-400 uppercase tracking-wider">
                        <th className="py-2 text-left">Deal</th>
                        <th className="py-2 text-left">Stage</th>
                        <th className="py-2 text-right">Value</th>
                        <th className="py-2 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {[...qDeals].sort((a,b) => (b.value||0)-(a.value||0)).slice(0,10).map(d => (
                        <tr key={d.id}>
                          <td className="py-2.5 font-medium text-gray-800">{d.title}</td>
                          <td className="py-2.5">
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize"
                              style={{ background:(STAGE_COLORS[d.stage]||'#94a3b8')+'20', color:STAGE_COLORS[d.stage]||'#64748b' }}>
                              {d.stage.replace('_',' ')}
                            </span>
                          </td>
                          <td className="py-2.5 text-right font-semibold text-gray-900">${(d.value||0).toLocaleString()}</td>
                          <td className="py-2.5 text-right text-xs text-gray-400">
                            {new Date(d.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* New contacts table */}
            {qContacts.length > 0 && (
              <section>
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">New Contacts This Quarter</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-xs text-gray-400 uppercase tracking-wider">
                        <th className="py-2 text-left">Name</th>
                        <th className="py-2 text-left">Company</th>
                        <th className="py-2 text-left">Stage</th>
                        <th className="py-2 text-right">Added</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {qContacts.slice(0,10).map(c => (
                        <tr key={c.id}>
                          <td className="py-2.5 font-medium text-gray-800">{c.first_name} {c.last_name}</td>
                          <td className="py-2.5 text-gray-500">{c.company}</td>
                          <td className="py-2.5">
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize"
                              style={{ background:(STAGE_COLORS[c.stage]||'#94a3b8')+'20', color:STAGE_COLORS[c.stage]||'#64748b' }}>
                              {c.stage}
                            </span>
                          </td>
                          <td className="py-2.5 text-right text-xs text-gray-400">
                            {new Date(c.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Footer */}
            <div className="border-t border-gray-100 pt-4 flex items-center justify-between text-xs text-gray-400">
              <span>NexusCRM Quarterly Report · {q.label} {year}</span>
              <span>Confidential — for internal use only</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
