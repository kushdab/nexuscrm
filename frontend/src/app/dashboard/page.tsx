'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || ''

interface Deal { id: string; title: string; value: number; stage: string }

const STAGE_COLOR: Record<string, string> = {
  lead:         'bg-blue-100 text-blue-700',
  qualified:    'bg-yellow-100 text-yellow-700',
  proposal:     'bg-orange-100 text-orange-700',
  negotiation:  'bg-purple-100 text-purple-700',
  closed_won:   'bg-green-100 text-green-700',
  closed_lost:  'bg-red-100 text-red-700',
  prospect:     'bg-slate-100 text-slate-600',
  customer:     'bg-teal-100 text-teal-700',
  qualification:'bg-yellow-100 text-yellow-700',
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats]   = useState({ contacts: 0, deals: 0, pipeline: 0 })
  const [deals, setDeals]   = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const token = localStorage.getItem('crm_token')
    if (!token) { router.push('/login'); return }
    const h = { Authorization: `Bearer ${token}` }
    try {
      const [cRes, dRes] = await Promise.all([
        fetch(`${API}/api/v1/contacts?limit=1`, { headers: h }),
        fetch(`${API}/api/v1/deals?limit=100`,  { headers: h }),
      ])
      if (cRes.status === 401) { localStorage.removeItem('crm_token'); router.push('/login'); return }
      const [cData, dData] = await Promise.all([cRes.json(), dRes.json()])
      const dealList: Deal[] = dData.items || []
      setDeals(dealList)
      setStats({
        contacts: cData.total ?? 0,
        deals:    dealList.filter(d => !['closed_won','closed_lost'].includes(d.stage)).length,
        pipeline: dealList.reduce((s, d) => s + (d.value || 0), 0),
      })
    } finally { setLoading(false) }
  }, [router])

  useEffect(() => { load() }, [load])

  const stageCount = deals.reduce((acc, d) => {
    acc[d.stage] = (acc[d.stage] || 0) + 1; return acc
  }, {} as Record<string, number>)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-semibold text-slate-800 mb-6">Overview</h2>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {[
          { label: 'Total Contacts', value: loading ? '—' : stats.contacts.toLocaleString(), href: '/dashboard/contacts', color: 'text-blue-600' },
          { label: 'Open Deals',     value: loading ? '—' : stats.deals.toLocaleString(),    href: '/dashboard/deals',    color: 'text-green-600' },
          { label: 'Pipeline Value', value: loading ? '—' : `$${stats.pipeline.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`, href: '/dashboard/deals', color: 'text-purple-600' },
        ].map(c => (
          <Link key={c.label} href={c.href}
            className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow block">
            <p className="text-sm text-slate-500 mb-1">{c.label}</p>
            <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deal stage breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Pipeline by Stage</h3>
            <Link href="/dashboard/deals" className="text-xs text-blue-600 hover:underline">View all →</Link>
          </div>
          {loading ? <p className="text-sm text-slate-400">Loading…</p> : (
            <div className="space-y-2">
              {Object.entries(stageCount).map(([stage, count]) => (
                <div key={stage} className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STAGE_COLOR[stage] || 'bg-slate-100 text-slate-600'}`}>
                    {stage.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-28 bg-slate-100 rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min((count / deals.length) * 100, 100)}%` }}/>
                    </div>
                    <span className="text-xs text-slate-500 w-4 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent deals */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Recent Deals</h3>
            <Link href="/dashboard/deals" className="text-xs text-blue-600 hover:underline">View all →</Link>
          </div>
          {loading ? <div className="p-6 text-sm text-slate-400">Loading…</div> : (
            <ul className="divide-y divide-slate-100">
              {deals.slice(0, 8).map(d => (
                <li key={d.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{d.title}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium capitalize ${STAGE_COLOR[d.stage] || 'bg-slate-100 text-slate-600'}`}>
                      {d.stage?.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">${Number(d.value||0).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
