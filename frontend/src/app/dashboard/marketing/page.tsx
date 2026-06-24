'use client'
import { useEffect, useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts'

const API = process.env.NEXT_PUBLIC_API_URL || ''

type Campaign = {
  id: number; name: string; type: string; status: string
  subject: string; audience: string; sent: number; opened: number
  clicked: number; converted: number; revenue: number; scheduled: string
}

type Segment = { name: string; count: number; color: string }

const CAMPAIGN_TYPES = ['Email','SMS','Social','Push Notification']
const STATUS_COLORS: Record<string,string> = {
  active:'bg-green-100 text-green-700', draft:'bg-gray-100 text-gray-600',
  paused:'bg-yellow-100 text-yellow-700', completed:'bg-blue-100 text-blue-700'
}

function pct(n:number,d:number) { return d ? ((n/d)*100).toFixed(1)+'%' : '0%' }
function trend(v:number) {
  const sign = v >= 0 ? '+' : ''
  return <span className={v>=0?'text-emerald-600':'text-red-500'}>{sign}{v}%</span>
}

export default function MarketingPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [filter, setFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const router = useRouter()
  const [tab, setTab] = useState<'campaigns'|'automation'|'segments'|'scoring'>('campaigns')
  const [contacts, setContacts] = useState<any[]>([])

  // Seeded mock campaigns (in production: fetch from /api/v1/campaigns)
  useEffect(() => {
    const token = localStorage.getItem('crm_token')
    fetch(`${API}/api/v1/contacts/?skip=0&limit=100`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(d => setContacts(Array.isArray(d) ? d : d.items || [])).catch(() => {})

    setCampaigns([
      { id:1, name:'Q2 Product Launch', type:'Email', status:'completed', subject:'Introducing NexusCRM Pro', audience:'All Contacts', sent:60, opened:38, clicked:22, converted:8, revenue:24400, scheduled:'2026-06-01' },
      { id:2, name:'Lead Nurture Drip #1', type:'Email', status:'active', subject:'How to close deals 3x faster', audience:'Leads', sent:24, opened:17, clicked:11, converted:4, revenue:8800, scheduled:'2026-06-15' },
      { id:3, name:'Win-Back Campaign', type:'Email', status:'active', subject:'We miss you — here\'s 20% off', audience:'Churned', sent:8, opened:5, clicked:3, converted:1, revenue:2200, scheduled:'2026-06-18' },
      { id:4, name:'June SMS Blast', type:'SMS', status:'completed', subject:'Flash sale: 24hrs only', audience:'Customers', sent:45, opened:40, clicked:18, converted:9, revenue:19800, scheduled:'2026-06-10' },
      { id:5, name:'Webinar Invite', type:'Email', status:'paused', subject:'Free webinar: CRM best practices', audience:'Prospects', sent:30, opened:12, clicked:6, converted:2, revenue:4400, scheduled:'2026-06-20' },
      { id:6, name:'Summer Promo Push', type:'Push Notification', status:'draft', subject:'Summer deals are here 🌞', audience:'All Contacts', sent:0, opened:0, clicked:0, converted:0, revenue:0, scheduled:'2026-07-01' },
      { id:7, name:'LinkedIn Outreach', type:'Social', status:'active', subject:'Connect on LinkedIn', audience:'Leads', sent:15, opened:15, clicked:9, converted:3, revenue:6600, scheduled:'2026-06-22' },
      { id:8, name:'Onboarding Sequence', type:'Email', status:'active', subject:'Welcome to NexusCRM!', audience:'New Signups', sent:12, opened:11, clicked:8, converted:5, revenue:11000, scheduled:'2026-06-23' },
    ])
  }, [])

  const filtered = useMemo(() => campaigns.filter(c => {
    if (filter !== 'all' && c.status !== filter) return false
    if (typeFilter !== 'all' && c.type !== typeFilter) return false
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.subject.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [campaigns, filter, typeFilter, search])

  // Aggregate KPIs
  const totalSent      = campaigns.reduce((s,c) => s+c.sent, 0)
  const totalOpened    = campaigns.reduce((s,c) => s+c.opened, 0)
  const totalClicked   = campaigns.reduce((s,c) => s+c.clicked, 0)
  const totalConverted = campaigns.reduce((s,c) => s+c.converted, 0)
  const totalRevenue   = campaigns.reduce((s,c) => s+c.revenue, 0)
  const avgOpenRate    = totalSent ? ((totalOpened/totalSent)*100).toFixed(1) : '0'
  const avgClickRate   = totalSent ? ((totalClicked/totalSent)*100).toFixed(1) : '0'
  const avgConvRate    = totalSent ? ((totalConverted/totalSent)*100).toFixed(1) : '0'

  const barData = campaigns.filter(c=>c.sent>0).map(c => ({
    name: c.name.length>16 ? c.name.slice(0,16)+'…' : c.name,
    Sent: c.sent, Opened: c.opened, Clicked: c.clicked, Converted: c.converted
  }))

  const funnelData = [
    { name:'Sent', value: totalSent, fill:'#3b82f6' },
    { name:'Opened', value: totalOpened, fill:'#8b5cf6' },
    { name:'Clicked', value: totalClicked, fill:'#06b6d4' },
    { name:'Converted', value: totalConverted, fill:'#10b981' },
  ]

  const typeBreakdown = CAMPAIGN_TYPES.map(t => ({
    name: t,
    count: campaigns.filter(c => c.type===t).length,
    revenue: campaigns.filter(c => c.type===t).reduce((s,c) => s+c.revenue,0)
  }))

  const segments: Segment[] = [
    { name:'All Contacts', count: contacts.length || 60, color:'#3b82f6' },
    { name:'Leads', count: contacts.filter((c:any) => c.stage==='Lead').length || 18, color:'#8b5cf6' },
    { name:'Prospects', count: contacts.filter((c:any) => c.stage==='Prospect').length || 14, color:'#06b6d4' },
    { name:'Customers', count: contacts.filter((c:any) => c.stage==='Customer').length || 12, color:'#10b981' },
    { name:'Churned', count: contacts.filter((c:any) => c.stage==='Churned').length || 8, color:'#f59e0b' },
    { name:'New (30d)', count: 9, color:'#ec4899' },
  ]

  const scoringCriteria = [
    { action:'Opened an email', points:5, icon:'📧' },
    { action:'Clicked a link', points:10, icon:'🖱️' },
    { action:'Visited pricing page', points:20, icon:'💰' },
    { action:'Requested a demo', points:40, icon:'🎥' },
    { action:'Downloaded resource', points:15, icon:'📥' },
    { action:'Replied to email', points:25, icon:'↩️' },
    { action:'Attended webinar', points:30, icon:'🎓' },
    { action:'No activity 30d', points:-10, icon:'💤' },
  ]

  const automations = [
    { name:'Welcome Sequence', trigger:'Contact created', steps:4, status:'active', enrolled:12, converted:5 },
    { name:'Lead Nurture', trigger:'Stage = Lead', steps:6, status:'active', enrolled:18, converted:6 },
    { name:'Win-Back Flow', trigger:'Stage = Churned', steps:3, status:'active', enrolled:8, converted:1 },
    { name:'Deal Follow-up', trigger:'Deal idle 7d', steps:2, status:'paused', enrolled:5, converted:0 },
    { name:'Post-Purchase', trigger:'Deal = Closed Won', steps:5, status:'active', enrolled:9, converted:9 },
  ]

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-screen-2xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketing Hub</h1>
          <p className="text-sm text-gray-500 mt-0.5">Campaigns · Automation · Segments · Lead Scoring</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm self-start sm:self-auto">
          + New Campaign
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          { label:'Campaigns', value: campaigns.length, sub:`${campaigns.filter(c=>c.status==='active').length} active`, trend:+12, color:'border-t-blue-500' },
          { label:'Emails Sent', value: totalSent.toLocaleString(), sub:'across all campaigns', trend:+18, color:'border-t-purple-500' },
          { label:'Open Rate', value: avgOpenRate+'%', sub:`${totalOpened} opens`, trend:+4, color:'border-t-cyan-500' },
          { label:'Click Rate', value: avgClickRate+'%', sub:`${totalClicked} clicks`, trend:+7, color:'border-t-emerald-500' },
          { label:'Conversions', value: totalConverted, sub:`${avgConvRate}% conv. rate`, trend:+22, color:'border-t-orange-500' },
          { label:'Revenue', value:'$'+totalRevenue.toLocaleString(), sub:'attributed', trend:+31, color:'border-t-pink-500' },
        ].map(k => (
          <div key={k.label} className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 border-t-4 ${k.color}`}>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{k.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{k.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{k.sub}</p>
            <p className="text-xs mt-1">{trend(k.trend)} vs last month</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
        {(['campaigns','automation','segments','scoring'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-all whitespace-nowrap
              ${tab===t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'scoring' ? 'Lead Scoring' : t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {/* CAMPAIGNS TAB */}
      {tab === 'campaigns' && (
        <div className="space-y-5">
          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Campaign performance bar chart */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Campaign Performance</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} margin={{ left:-20, right:10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize:10 }} />
                  <YAxis tick={{ fontSize:10 }} />
                  <Tooltip />
                  <Legend iconSize={10} wrapperStyle={{ fontSize:11 }} />
                  <Bar dataKey="Sent" fill="#3b82f6" radius={[3,3,0,0]} />
                  <Bar dataKey="Opened" fill="#8b5cf6" radius={[3,3,0,0]} />
                  <Bar dataKey="Clicked" fill="#06b6d4" radius={[3,3,0,0]} />
                  <Bar dataKey="Converted" fill="#10b981" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Funnel */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Conversion Funnel</h3>
              <div className="space-y-3 mt-2">
                {funnelData.map((f,i) => {
                  const pctVal = funnelData[0].value ? (f.value/funnelData[0].value*100) : 0
                  return (
                    <div key={f.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-gray-700">{f.name}</span>
                        <span className="text-gray-500">{f.value.toLocaleString()} <span className="font-semibold" style={{color:f.fill}}>({pctVal.toFixed(1)}%)</span></span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3">
                        <div className="h-3 rounded-full transition-all" style={{ width:`${pctVal}%`, background:f.fill }} />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-4 gap-2 text-center">
                {typeBreakdown.map(t => (
                  <div key={t.name}>
                    <p className="text-xs text-gray-400">{t.name}</p>
                    <p className="text-sm font-bold text-gray-800">{t.count}</p>
                    <p className="text-xs text-gray-500">${(t.revenue/1000).toFixed(0)}k</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Campaign list */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row gap-3">
                <input value={search} onChange={e=>setSearch(e.target.value)}
                  placeholder="Search campaigns…"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <select value={filter} onChange={e=>setFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white focus:outline-none">
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
                <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white focus:outline-none">
                  <option value="all">All Types</option>
                  {CAMPAIGN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Campaign','Type','Status','Audience','Sent','Open Rate','Click Rate','Conv. Rate','Revenue'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.subject}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">{c.type}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[c.status]}`}>{c.status}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{c.audience}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{c.sent}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-12 bg-gray-100 rounded-full h-1.5">
                            <div className="h-1.5 bg-purple-500 rounded-full" style={{ width: pct(c.opened,c.sent) }} />
                          </div>
                          <span className="text-xs font-medium text-gray-700">{pct(c.opened,c.sent)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-12 bg-gray-100 rounded-full h-1.5">
                            <div className="h-1.5 bg-cyan-500 rounded-full" style={{ width: pct(c.clicked,c.sent) }} />
                          </div>
                          <span className="text-xs font-medium text-gray-700">{pct(c.clicked,c.sent)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-emerald-600">{pct(c.converted,c.sent)}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">${c.revenue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {filtered.map(c => (
                <div key={c.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.subject}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${STATUS_COLORS[c.status]}`}>{c.status}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center mt-2">
                    <div><p className="text-xs text-gray-400">Open Rate</p><p className="text-sm font-bold text-purple-600">{pct(c.opened,c.sent)}</p></div>
                    <div><p className="text-xs text-gray-400">Click Rate</p><p className="text-sm font-bold text-cyan-600">{pct(c.clicked,c.sent)}</p></div>
                    <div><p className="text-xs text-gray-400">Revenue</p><p className="text-sm font-bold text-gray-900">${c.revenue.toLocaleString()}</p></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AUTOMATION TAB */}
      {tab === 'automation' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Active Automation Flows</h3>
              <div className="space-y-3">
                {automations.map(a => (
                  <div key={a.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${a.status==='active'?'bg-green-500':'bg-yellow-400'}`} />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{a.name}</p>
                        <p className="text-xs text-gray-400">Trigger: {a.trigger} · {a.steps} steps</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-800">{a.enrolled}</p>
                      <p className="text-xs text-gray-400">enrolled</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Automation Conversion</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={automations}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize:9 }} />
                  <YAxis tick={{ fontSize:10 }} />
                  <Tooltip />
                  <Bar dataKey="enrolled" fill="#3b82f6" name="Enrolled" radius={[3,3,0,0]} />
                  <Bar dataKey="converted" fill="#10b981" name="Converted" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 p-3 bg-blue-50 rounded-xl text-sm text-blue-700">
                <strong>Avg conversion rate:</strong> {(automations.reduce((s,a)=>s+(a.enrolled?a.converted/a.enrolled:0),0)/automations.length*100).toFixed(1)}% across all active flows
              </div>
            </div>
          </div>

          {/* Sequence builder teaser */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-800">Sequence Builder</h3>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">Visual Builder</span>
            </div>
            <div className="flex items-center gap-0 overflow-x-auto pb-2">
              {['Trigger\nContact Created','Wait\n1 Day','Email\nWelcome Series','Wait\n3 Days','Email\nGetting Started','Wait\n7 Days','Email\nCheck-in'].map((step,i) => (
                <div key={i} className="flex items-center flex-shrink-0">
                  <div className={`text-center p-3 rounded-xl text-xs font-medium w-24
                    ${i===0?'bg-purple-100 text-purple-700 border-2 border-purple-300':
                      step.startsWith('Wait')?'bg-yellow-50 text-yellow-700 border border-yellow-200':
                      'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                    {step.split('\n').map((l,j) => <p key={j} className={j===0?'font-bold':'font-normal text-gray-500'}>{l}</p>)}
                  </div>
                  {i < 6 && <div className="w-6 text-center text-gray-300 text-lg">→</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SEGMENTS TAB */}
      {tab === 'segments' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Audience Segments</h3>
            <div className="space-y-3">
              {segments.map(s => {
                const pctVal = (contacts.length||60) ? (s.count/(contacts.length||60)*100) : 0
                return (
                  <div key={s.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{background:s.color}} />
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-gray-700">{s.name}</span>
                        <span className="text-gray-500">{s.count} contacts <span className="font-semibold" style={{color:s.color}}>({pctVal.toFixed(0)}%)</span></span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="h-2 rounded-full" style={{width:`${pctVal}%`,background:s.color}} />
                      </div>
                    </div>
                    <button className="text-xs px-2.5 py-1 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                      Campaign →
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Segment Breakdown</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={segments} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} paddingAngle={3} label={({name,percent}) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                  {segments.map((s,i) => <Cell key={i} fill={s.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* LEAD SCORING TAB */}
      {tab === 'scoring' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 mb-1">Scoring Criteria</h3>
            <p className="text-xs text-gray-400 mb-4">Points assigned per action — hot lead threshold: 50 pts</p>
            <div className="space-y-2">
              {scoringCriteria.map(s => (
                <div key={s.action} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{s.icon}</span>
                    <span className="text-sm text-gray-700">{s.action}</span>
                  </div>
                  <span className={`text-sm font-bold px-2 py-0.5 rounded-lg ${s.points > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                    {s.points > 0 ? '+' : ''}{s.points} pts
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Hot Leads (Score ≥ 50)</h3>
            <div className="space-y-2">
              {contacts.slice(0,8).map((c:any, i:number) => {
                const score = [78,65,91,52,84,60,73,55][i] || 50
                return (
                  <div key={c.id||i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{c.full_name || `Contact ${i+1}`}</p>
                      <p className="text-xs text-gray-400">{c.company_name || 'Unknown company'}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-gradient-to-r from-yellow-400 to-red-500" style={{width:`${Math.min(score,100)}%`}} />
                        </div>
                        <span className="text-sm font-bold text-gray-800">{score}</span>
                      </div>
                      <p className="text-xs text-orange-600 font-medium">{score>=80?'🔥 Hot':'⬆️ Warm'}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 p-3 bg-orange-50 rounded-xl text-xs text-orange-700">
              <strong>8 hot leads</strong> detected this week — assign to sales reps for immediate follow-up.
            </div>
          </div>
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Create Campaign</h2>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Campaign Name</label>
                <input className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Q3 Product Announcement" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Type</label>
                  <select className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {CAMPAIGN_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Audience</label>
                  <select className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {segments.map(s => <option key={s.name}>{s.name} ({s.count})</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Subject Line</label>
                <input className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Compelling subject line…" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Message / Content</label>
                <textarea rows={4} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Write your campaign message…" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Schedule Date</label>
                <input type="date" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowCreate(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  Save as Draft
                </button>
                <button onClick={() => setShowCreate(false)}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
                  Launch Campaign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
