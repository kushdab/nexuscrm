'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

import dynamic from 'next/dynamic'
const ClientWorldMap = dynamic(() => import('@/components/ClientWorldMap'), { ssr: false })

const API = process.env.NEXT_PUBLIC_API_URL || ''

interface Contact { id: string; stage: string; created_at: string }
interface Deal    { id: string; title: string; value: number; stage: string; created_at: string; contact_name?: string }

const STAGE_COLORS: Record<string, string> = {
  lead: '#3b82f6', prospect: '#6366f1', qualified: '#f59e0b',
  proposal: '#f97316', negotiation: '#8b5cf6',
  closed_won: '#10b981', closed_lost: '#ef4444',
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function Kpi({ label, value, sub, trend, color }: {
  label: string; value: string | number; sub?: string
  trend?: number; color?: string
}) {
  const up   = (trend ?? 0) >= 0
  const fmt  = trend !== undefined ? `${up?'+':''}${trend?.toFixed(1)}%` : undefined
  const bar  = color || '#3b82f6'
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative overflow-hidden">
      <div className="absolute top-0 left-0 h-1 w-full rounded-t-2xl" style={{ background: bar }} />
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</p>
      <p className="text-3xl font-extrabold text-gray-900 mb-1">{value}</p>
      <div className="flex items-center gap-2">
        {fmt && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full
            ${up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {up ? '▲' : '▼'} {fmt}
          </span>
        )}
        {sub && <span className="text-xs text-gray-400">{sub}</span>}
      </div>
    </div>
  )
}

function now() { return new Date() }
function monthStart(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1) }
function prevMonthStart(d: Date) { return new Date(d.getFullYear(), d.getMonth() - 1, 1) }
function prevMonthEnd(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 0, 23, 59, 59) }

export default function Overview() {
  const router = useRouter()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [deals,    setDeals]    = useState<Deal[]>([])
  const [loading,  setLoading]  = useState(true)

  const load = useCallback(async () => {
    const token = localStorage.getItem('crm_token')
    if (!token) { router.push('/login'); return }
    const h = { Authorization: `Bearer ${token}` }
    try {
      const [cr, dr] = await Promise.all([
        fetch(`${API}/api/v1/contacts?limit=500`, { headers: h }),
        fetch(`${API}/api/v1/deals?limit=500`,    { headers: h }),
      ])
      if (cr.status === 401) { localStorage.removeItem('crm_token'); router.push('/login'); return }
      const [cd, dd] = await Promise.all([cr.json(), dr.json()])
      setContacts(cd.items || [])
      setDeals(dd.items || [])
    } finally { setLoading(false) }
  }, [router])

  useEffect(() => { load() }, [load])

  // ── Derived metrics ──────────────────────────────────────────────
  const today       = now()
  const thisStart   = monthStart(today)
  const prevStart   = prevMonthStart(today)
  const prevEnd     = prevMonthEnd(today)

  const inRange     = (d: string, a: Date, b: Date) => { const t = new Date(d); return t >= a && t <= b }
  const thisMonthC  = contacts.filter(c => inRange(c.created_at, thisStart, today)).length
  const prevMonthC  = contacts.filter(c => inRange(c.created_at, prevStart, prevEnd)).length
  const contactTrend = prevMonthC ? ((thisMonthC - prevMonthC) / prevMonthC) * 100 : 0

  const openDeals   = deals.filter(d => !['closed_won','closed_lost'].includes(d.stage))
  const closedWon   = deals.filter(d => d.stage === 'closed_won')
  const closedLost  = deals.filter(d => d.stage === 'closed_lost')
  const winRate     = (closedWon.length + closedLost.length) > 0
    ? (closedWon.length / (closedWon.length + closedLost.length)) * 100 : 0
  const pipeline    = openDeals.reduce((s, d) => s + (d.value || 0), 0)
  const revenue     = closedWon.reduce((s, d) => s + (d.value || 0), 0)
  const avgDeal     = openDeals.length ? pipeline / openDeals.length : 0

  const thisMonthD  = openDeals.filter(d => inRange(d.created_at, thisStart, today)).length
  const prevMonthD  = openDeals.filter(d => inRange(d.created_at, prevStart, prevEnd)).length
  const dealTrend   = prevMonthD ? ((thisMonthD - prevMonthD) / prevMonthD) * 100 : 0

  // ── Monthly bar chart ────────────────────────────────────────────
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const m = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1)
    const me = new Date(today.getFullYear(), today.getMonth() - (5 - i) + 1, 0, 23, 59, 59)
    return {
      name: MONTHS[m.getMonth()],
      Pipeline: deals.filter(d => inRange(d.created_at, m, me)).reduce((s,d) => s+(d.value||0),0),
      Won:      deals.filter(d => d.stage==='closed_won' && inRange(d.created_at, m, me)).reduce((s,d) => s+(d.value||0),0),
    }
  })

  // ── Stage pie data ───────────────────────────────────────────────
  const stageCounts = deals.reduce((acc, d) => {
    acc[d.stage] = (acc[d.stage] || 0) + 1; return acc
  }, {} as Record<string, number>)
  const pieData = Object.entries(stageCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a,b) => b.value - a.value)

  const fmt = (n: number) => n >= 1_000_000 ? `$${(n/1_000_000).toFixed(1)}M`
    : n >= 1_000 ? `$${(n/1_000).toFixed(0)}K` : `$${n.toFixed(0)}`

  if (loading) return <div className="flex items-center justify-center h-full text-gray-400">Loading…</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {today.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
          </p>
        </div>
        <a href="/dashboard/reports"
           className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
          Generate Report →
        </a>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Kpi label="Total Contacts"   value={contacts.length} trend={contactTrend} sub="vs last month" color="#3b82f6" />
        <Kpi label="New This Month"   value={thisMonthC}      sub={`${prevMonthC} last month`}          color="#6366f1" />
        <Kpi label="Open Deals"       value={openDeals.length} trend={dealTrend}  sub="vs last month"  color="#f59e0b" />
        <Kpi label="Win Rate"         value={`${winRate.toFixed(1)}%`} sub={`${closedWon.length} won`} color="#10b981" />
        <Kpi label="Pipeline Value"   value={fmt(pipeline)}   sub={`${openDeals.length} deals`}        color="#8b5cf6" />
        <Kpi label="Avg Deal Size"    value={fmt(avgDeal)}    sub={`Revenue ${fmt(revenue)}`}          color="#f97316" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar chart — 6-month pipeline */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">6-Month Pipeline vs Revenue</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                tickFormatter={v => v >= 1000 ? `$${(v/1000).toFixed(0)}K` : `$${v}`} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)', fontSize: 12 }}
                formatter={(v: number) => [`$${v.toLocaleString()}`, undefined]} />
              <Bar dataKey="Pipeline" fill="#dbeafe" radius={[6,6,0,0]} />
              <Bar dataKey="Won"      fill="#3b82f6" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Donut — stage breakdown */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Deal Stage Breakdown</h3>
          {pieData.length === 0 ? (
            <p className="text-center text-sm text-gray-400 mt-12">No deals yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                     dataKey="value" nameKey="name" paddingAngle={3}>
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={STAGE_COLORS[entry.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <Legend iconType="circle" iconSize={8}
                  formatter={(v: string) => <span style={{ fontSize: 11, color: '#6b7280', textTransform: 'capitalize' }}>{v.replace('_',' ')}</span>} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)', fontSize: 12 }}
                  formatter={(v: number, n: string) => [v, n.replace('_',' ')]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent deals */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Recent Deals</h3>
          <a href="/dashboard/deals" className="text-xs text-blue-600 hover:underline">View all →</a>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wider">
              <th className="px-6 py-3 text-left">Deal</th>
              <th className="px-6 py-3 text-left">Stage</th>
              <th className="px-6 py-3 text-right">Value</th>
              <th className="px-6 py-3 text-right">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {deals.slice(0,8).map(d => (
              <tr key={d.id} className="hover:bg-blue-50/30 transition-colors">
                <td className="px-6 py-3 font-medium text-gray-800">{d.title}</td>
                <td className="px-6 py-3">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize"
                    style={{ background: (STAGE_COLORS[d.stage]||'#94a3b8')+'22', color: STAGE_COLORS[d.stage]||'#64748b' }}>
                    {d.stage?.replace('_',' ')}
                  </span>
                </td>
                <td className="px-6 py-3 text-right font-semibold text-gray-900">${(d.value||0).toLocaleString()}</td>
                <td className="px-6 py-3 text-right text-gray-400 text-xs">
                  {new Date(d.created_at).toLocaleDateString('en-US',{ month:'short', day:'numeric' })}
                </td>
              </tr>
            ))}
            {deals.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400">No deals yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
