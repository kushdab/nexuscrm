'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || ''

const CAMPAIGNS: Record<string, any> = {
  'welcome-series': {
    id: 'welcome-series',
    name: 'Welcome Series',
    type: 'Email',
    status: 'Active',
    subject: 'Welcome to NexusCRM — Let\'s get you started 🚀',
    preheader: 'Your account is ready. Here\'s everything you need to hit the ground running.',
    sentAt: '2026-06-10 09:00 AM',
    segment: 'New Leads',
    from: 'hello@nexuscrm.io',
    replyTo: 'support@nexuscrm.io',
    stats: {
      sent: 2480,
      delivered: 2391,
      bounced: 52,
      failed: 37,
      opened: 1124,
      clicked: 486,
      unsubscribed: 18,
      spam: 9,
    },
    body: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
  <div style="background:linear-gradient(135deg,#1e3a8a,#2563eb);padding:40px 32px;border-radius:12px 12px 0 0;text-align:center">
    <h1 style="color:#fff;font-size:28px;margin:0 0 8px">Welcome to NexusCRM</h1>
    <p style="color:#bfdbfe;margin:0;font-size:15px">Your account is ready. Let's get started.</p>
  </div>
  <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none">
    <p style="font-size:16px;line-height:1.6">Hi {{first_name}},</p>
    <p style="font-size:15px;line-height:1.7;color:#374151">Thank you for joining NexusCRM. You now have access to a world-class CRM platform to manage your contacts, track deals, and grow your revenue.</p>
    <div style="background:#f0f9ff;border-left:4px solid #2563eb;padding:16px 20px;border-radius:0 8px 8px 0;margin:24px 0">
      <p style="margin:0;font-size:14px;color:#1e40af;font-weight:600">Quick Start Checklist</p>
      <ul style="margin:8px 0 0;padding-left:20px;color:#374151;font-size:14px">
        <li>Import your contacts</li>
        <li>Set up your first pipeline</li>
        <li>Schedule a follow-up activity</li>
      </ul>
    </div>
    <div style="text-align:center;margin:32px 0">
      <a href="#" style="background:#2563eb;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">Open Your Dashboard →</a>
    </div>
    <p style="font-size:13px;color:#6b7280;text-align:center">Need help? Reply to this email or visit our docs.</p>
  </div>
  <div style="background:#f9fafb;padding:16px 32px;border-radius:0 0 12px 12px;text-align:center;border:1px solid #e5e7eb;border-top:none">
    <p style="font-size:12px;color:#9ca3af;margin:0">NexusCRM · 123 Business Ave, Nairobi, Kenya · <a href="#" style="color:#6b7280">Unsubscribe</a></p>
  </div>
</div>`,
    recipients: [
      { name: 'Sarah Kimani', email: 'sarah.k@techcorp.io', status: 'Opened', openedAt: '09:14 AM', clicked: true },
      { name: 'James Mwangi', email: 'j.mwangi@fintech.co', status: 'Delivered', openedAt: '—', clicked: false },
      { name: 'Amara Diallo', email: 'amara@startup.ng', status: 'Clicked', openedAt: '09:22 AM', clicked: true },
      { name: 'Peter Otieno', email: 'p.otieno@bank.ke', status: 'Bounced', openedAt: '—', clicked: false },
      { name: 'Nadia Hassan', email: 'nadia@ecom.co', status: 'Opened', openedAt: '10:01 AM', clicked: false },
      { name: 'Carlos Mendes', email: 'carlos@retail.br', status: 'Failed', openedAt: '—', clicked: false },
      { name: 'Liu Wei', email: 'l.wei@corp.cn', status: 'Unsubscribed', openedAt: '09:45 AM', clicked: false },
      { name: 'Fatima Al-Said', email: 'fatima@holding.ae', status: 'Opened', openedAt: '11:30 AM', clicked: true },
    ],
    timeline: [
      { time: '09:00 AM', event: 'Campaign sent to 2,480 recipients', type: 'send' },
      { time: '09:02 AM', event: '2,391 emails delivered to inbox', type: 'delivered' },
      { time: '09:03 AM', event: '52 bounces detected (invalid addresses)', type: 'bounce' },
      { time: '09:05 AM', event: '37 failed (quota / server errors)', type: 'fail' },
      { time: '09:14 AM', event: 'First open recorded — Sarah Kimani', type: 'open' },
      { time: '09:22 AM', event: 'First click — Amara Diallo (CTA button)', type: 'click' },
      { time: '12:00 PM', event: 'Peak opens window (45% of opens in first 3h)', type: 'info' },
      { time: '06:00 PM', event: '24-hour snapshot: 1,124 opens · 486 clicks · 18 unsubs', type: 'info' },
    ],
  },
  'q2-promo': {
    id: 'q2-promo',
    name: 'Q2 Promo Blast',
    type: 'Email',
    status: 'Completed',
    subject: 'Exclusive Q2 offer — 30% off all plans, this week only',
    preheader: 'Don\'t miss our biggest sale of the year.',
    sentAt: '2026-05-28 08:30 AM',
    segment: 'All Contacts',
    from: 'offers@nexuscrm.io',
    replyTo: 'sales@nexuscrm.io',
    stats: { sent: 5200, delivered: 5011, bounced: 121, failed: 68, opened: 1890, clicked: 734, unsubscribed: 44, spam: 21 },
    body: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
  <div style="background:linear-gradient(135deg,#7c3aed,#db2777);padding:40px 32px;border-radius:12px 12px 0 0;text-align:center">
    <p style="color:#fde68a;font-size:13px;font-weight:700;letter-spacing:2px;margin:0 0 8px">LIMITED TIME</p>
    <h1 style="color:#fff;font-size:32px;margin:0 0 8px">30% Off All Plans</h1>
    <p style="color:#f5d0fe;margin:0;font-size:15px">This week only — upgrade before Friday</p>
  </div>
  <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none">
    <p style="font-size:15px;line-height:1.7;color:#374151">Hi {{first_name}}, our Q2 sale is live. Use code <strong>Q2NEXUS30</strong> at checkout to lock in 30% off any plan — monthly or annual.</p>
    <div style="text-align:center;margin:32px 0">
      <a href="#" style="background:#7c3aed;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px">Claim 30% Off Now →</a>
    </div>
  </div>
</div>`,
    recipients: [
      { name: 'John Njoroge', email: 'john@saas.io', status: 'Clicked', openedAt: '08:45 AM', clicked: true },
      { name: 'Amina Bello', email: 'amina@agency.ng', status: 'Opened', openedAt: '08:52 AM', clicked: false },
      { name: 'Marco Rossi', email: 'm.rossi@ventures.it', status: 'Bounced', openedAt: '—', clicked: false },
      { name: 'Yuki Tanaka', email: 'yuki@tech.jp', status: 'Failed', openedAt: '—', clicked: false },
      { name: 'Grace Achieng', email: 'grace@ngo.ke', status: 'Delivered', openedAt: '—', clicked: false },
    ],
    timeline: [
      { time: '08:30 AM', event: 'Campaign sent to 5,200 recipients', type: 'send' },
      { time: '08:33 AM', event: '5,011 delivered · 121 bounced · 68 failed', type: 'delivered' },
      { time: '08:45 AM', event: 'First click — John Njoroge', type: 'click' },
      { time: '11:00 AM', event: 'Peak engagement window closed — 892 opens so far', type: 'info' },
      { time: '05:00 PM', event: 'End of day: 1,890 opens · 734 clicks · 44 unsubs', type: 'info' },
    ],
  },
}

const STATUS_COLORS: Record<string, string> = {
  Opened: 'bg-blue-100 text-blue-700',
  Clicked: 'bg-green-100 text-green-700',
  Delivered: 'bg-gray-100 text-gray-600',
  Bounced: 'bg-orange-100 text-orange-700',
  Failed: 'bg-red-100 text-red-700',
  Unsubscribed: 'bg-yellow-100 text-yellow-700',
  Spam: 'bg-pink-100 text-pink-700',
}

const TIMELINE_ICONS: Record<string, string> = {
  send: '📤', delivered: '✅', bounce: '↩️', fail: '❌', open: '👁', click: '🖱', info: 'ℹ️'
}

export default function CampaignDetail() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const [tab, setTab] = useState<'overview' | 'message' | 'recipients' | 'timeline'>('overview')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const campaign = CAMPAIGNS[id]

  useEffect(() => {
    const token = localStorage.getItem('crm_token')
    if (!token) router.push('/login')
  }, [router])

  if (!campaign) return (
    <div className="flex flex-col items-center justify-center h-full py-40 text-gray-400">
      <p className="text-4xl mb-4">📭</p>
      <p className="text-lg font-medium">Campaign not found</p>
      <Link href="/dashboard/marketing" className="mt-4 text-blue-600 hover:underline text-sm">← Back to Marketing</Link>
    </div>
  )

  const s = campaign.stats
  const deliveryRate   = ((s.delivered / s.sent) * 100).toFixed(1)
  const openRate       = ((s.opened / s.delivered) * 100).toFixed(1)
  const clickRate      = ((s.clicked / s.delivered) * 100).toFixed(1)
  const bounceRate     = ((s.bounced / s.sent) * 100).toFixed(1)
  const failRate       = ((s.failed / s.sent) * 100).toFixed(1)
  const clickToOpen    = ((s.clicked / s.opened) * 100).toFixed(1)

  const filtered = campaign.recipients.filter((r: any) => {
    const q = search.toLowerCase()
    const matchQ = r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
    const matchS = statusFilter === 'All' || r.status === statusFilter
    return matchQ && matchS
  })

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-5">
        <div className="flex flex-wrap items-center gap-3 mb-1">
          <Link href="/dashboard/marketing" className="text-gray-400 hover:text-blue-600 text-sm flex items-center gap-1">
            ← Marketing
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-700 font-medium">{campaign.name}</span>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4 mt-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">{campaign.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Sent {campaign.sentAt} · {campaign.type} · Segment: {campaign.segment}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              campaign.status === 'Active' ? 'bg-green-100 text-green-700' :
              campaign.status === 'Completed' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-600'
            }`}>{campaign.status}</span>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Duplicate
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto">

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 border border-gray-200 mb-6 w-fit overflow-x-auto">
          {(['overview','message','recipients','timeline'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all whitespace-nowrap ${
                tab === t ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'
              }`}>
              {t === 'overview' ? '📊 Overview' : t === 'message' ? '✉️ Message' : t === 'recipients' ? '👥 Recipients' : '🕐 Timeline'}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div className="space-y-6">

            {/* Delivery funnel */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-6">Delivery Funnel</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Sent', value: s.sent.toLocaleString(), pct: '100%', color: 'bg-blue-600', icon: '📤' },
                  { label: 'Delivered', value: s.delivered.toLocaleString(), pct: `${deliveryRate}%`, color: 'bg-green-500', icon: '✅' },
                  { label: 'Opened', value: s.opened.toLocaleString(), pct: `${openRate}%`, color: 'bg-purple-500', icon: '👁' },
                  { label: 'Clicked', value: s.clicked.toLocaleString(), pct: `${clickRate}%`, color: 'bg-orange-500', icon: '🖱' },
                ].map(card => (
                  <div key={card.label} className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                    <div className="text-2xl mb-2">{card.icon}</div>
                    <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                    <div className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold text-white ${card.color}`}>{card.pct}</div>
                    <div className="text-xs text-gray-500 mt-1">{card.label}</div>
                  </div>
                ))}
              </div>

              {/* Progress bars */}
              <div className="mt-6 space-y-3">
                {[
                  { label: 'Delivery Rate', pct: parseFloat(deliveryRate), color: 'bg-green-500' },
                  { label: 'Open Rate', pct: parseFloat(openRate), color: 'bg-purple-500' },
                  { label: 'Click Rate', pct: parseFloat(clickRate), color: 'bg-orange-500' },
                  { label: 'Click-to-Open Rate', pct: parseFloat(clickToOpen), color: 'bg-blue-500' },
                ].map(bar => (
                  <div key={bar.label} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-36 shrink-0">{bar.label}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                      <div className={`${bar.color} h-2.5 rounded-full transition-all`} style={{ width: `${Math.min(bar.pct, 100)}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 w-12 text-right">{bar.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Failure breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-base font-semibold text-gray-800 mb-4">Issues Breakdown</h2>
                <div className="space-y-4">
                  {[
                    { label: 'Bounced', value: s.bounced, pct: bounceRate, color: 'bg-orange-400', desc: 'Invalid or inactive addresses' },
                    { label: 'Failed', value: s.failed, pct: failRate, color: 'bg-red-500', desc: 'Server errors / quota limits' },
                    { label: 'Spam', value: s.spam, pct: ((s.spam / s.sent)*100).toFixed(1), color: 'bg-pink-500', desc: 'Marked as spam by recipients' },
                    { label: 'Unsubscribed', value: s.unsubscribed, pct: ((s.unsubscribed / s.sent)*100).toFixed(1), color: 'bg-yellow-500', desc: 'Opted out of future emails' },
                  ].map(row => (
                    <div key={row.label}>
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <span className="text-sm font-medium text-gray-700">{row.label}</span>
                          <span className="text-xs text-gray-400 ml-2">{row.desc}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-800">{row.value}</span>
                          <span className="text-xs text-gray-500">{row.pct}%</span>
                        </div>
                      </div>
                      <div className="bg-gray-100 rounded-full h-1.5">
                        <div className={`${row.color} h-1.5 rounded-full`} style={{ width: `${Math.min(parseFloat(row.pct)*10,100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-base font-semibold text-gray-800 mb-4">Campaign Details</h2>
                <dl className="space-y-3">
                  {[
                    { label: 'Subject', value: campaign.subject },
                    { label: 'Preheader', value: campaign.preheader },
                    { label: 'From', value: campaign.from },
                    { label: 'Reply To', value: campaign.replyTo },
                    { label: 'Audience', value: campaign.segment },
                    { label: 'Sent At', value: campaign.sentAt },
                    { label: 'Type', value: campaign.type },
                  ].map(item => (
                    <div key={item.label} className="flex gap-3">
                      <dt className="text-xs text-gray-400 w-20 shrink-0 pt-0.5">{item.label}</dt>
                      <dd className="text-sm text-gray-700 font-medium">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

          </div>
        )}

        {/* ── MESSAGE ── */}
        {tab === 'message' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-800">Email Preview</h2>
                <button onClick={() => window.print()}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition-colors">
                  🖨 Print / Save PDF
                </button>
              </div>
              {/* Email meta bar */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-1.5 text-sm border border-gray-100">
                <div className="flex gap-2"><span className="text-gray-400 w-16">From:</span><span className="font-medium text-gray-800">{campaign.from}</span></div>
                <div className="flex gap-2"><span className="text-gray-400 w-16">Subject:</span><span className="font-medium text-gray-800">{campaign.subject}</span></div>
                <div className="flex gap-2"><span className="text-gray-400 w-16">Preview:</span><span className="text-gray-500 italic">{campaign.preheader}</span></div>
                <div className="flex gap-2"><span className="text-gray-400 w-16">Sent:</span><span className="text-gray-700">{campaign.sentAt}</span></div>
              </div>
              {/* Rendered HTML */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 flex items-center gap-2 border-b border-gray-200">
                  <div className="w-3 h-3 rounded-full bg-red-400"/>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"/>
                  <div className="w-3 h-3 rounded-full bg-green-400"/>
                  <span className="text-xs text-gray-500 ml-2">Email render</span>
                </div>
                <div className="p-4 bg-[#f9f9f9]">
                  <div dangerouslySetInnerHTML={{ __html: campaign.body }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── RECIPIENTS ── */}
        {tab === 'recipients' && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {/* Filters */}
            <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3">
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search name or email…"
                className="flex-1 min-w-[200px] border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"/>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none bg-white">
                <option value="All">All Status</option>
                {['Delivered','Opened','Clicked','Bounced','Failed','Unsubscribed','Spam'].map(s => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <span className="self-center text-sm text-gray-500">{filtered.length} contacts</span>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Name','Email','Status','Opened At','Clicked'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((r: any) => (
                    <tr key={r.email} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800">{r.name}</td>
                      <td className="px-4 py-3 text-gray-500">{r.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-600'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{r.openedAt}</td>
                      <td className="px-4 py-3">
                        <span className={`text-sm ${r.clicked ? 'text-green-600 font-semibold' : 'text-gray-300'}`}>
                          {r.clicked ? '✓ Yes' : '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {filtered.map((r: any) => (
                <div key={r.email} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{r.name}</p>
                      <p className="text-xs text-gray-500">{r.email}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-600'}`}>
                      {r.status}
                    </span>
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-gray-400">
                    <span>Opened: {r.openedAt}</span>
                    <span>Clicked: {r.clicked ? '✓' : '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TIMELINE ── */}
        {tab === 'timeline' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-6">Delivery Timeline</h2>
            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200" />
              <div className="space-y-6">
                {campaign.timeline.map((item: any, i: number) => (
                  <div key={i} className="flex gap-4 relative">
                    <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-base shrink-0 z-10">
                      {TIMELINE_ICONS[item.type]}
                    </div>
                    <div className="flex-1 min-w-0 pb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{item.time}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          item.type === 'delivered' ? 'bg-green-100 text-green-700' :
                          item.type === 'bounce' ? 'bg-orange-100 text-orange-700' :
                          item.type === 'fail' ? 'bg-red-100 text-red-700' :
                          item.type === 'click' ? 'bg-purple-100 text-purple-700' :
                          item.type === 'open' ? 'bg-blue-100 text-blue-700' :
                          item.type === 'send' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>{item.type}</span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{item.event}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
