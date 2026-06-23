'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || ''

interface Contact {
  id: string
  first_name: string
  last_name: string
  email: string
  company: string
  title: string
  stage: string
}

interface Deal {
  id: string
  title: string
  value: number
  stage: string
}

interface Stats {
  contacts: number
  deals: number
  pipeline: number
}

export default function Dashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({ contacts: 0, deals: 0, pipeline: 0 })
  const [contacts, setContacts] = useState<Contact[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('crm_token')
    if (!token) { router.push('/login'); return }

    const headers = { Authorization: `Bearer ${token}` }
    try {
      const [cRes, dRes] = await Promise.all([
        fetch(`${API}/api/v1/contacts?limit=50`, { headers }),
        fetch(`${API}/api/v1/deals?limit=50`, { headers }),
      ])
      if (cRes.status === 401 || dRes.status === 401) {
        localStorage.removeItem('crm_token')
        router.push('/login')
        return
      }
      const [cData, dData] = await Promise.all([cRes.json(), dRes.json()])
      const contactList: Contact[] = cData.items || []
      const dealList: Deal[] = dData.items || []
      setContacts(contactList)
      setDeals(dealList)
      setStats({
        contacts: cData.total ?? contactList.length,
        deals: dealList.filter((d: Deal) => d.stage !== 'closed_lost').length,
        pipeline: dealList.reduce((s: number, d: Deal) => s + (d.value || 0), 0),
      })
    } catch {
      setError('Could not load data. Make sure the API is running.')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { fetchData() }, [fetchData])

  function logout() {
    localStorage.removeItem('crm_token')
    router.push('/login')
  }

  const stageBadge: Record<string, string> = {
    lead: 'bg-blue-100 text-blue-700',
    qualified: 'bg-yellow-100 text-yellow-700',
    proposal: 'bg-orange-100 text-orange-700',
    negotiation: 'bg-purple-100 text-purple-700',
    closed_won: 'bg-green-100 text-green-700',
    closed_lost: 'bg-red-100 text-red-700',
    prospect: 'bg-slate-100 text-slate-700',
    customer: 'bg-teal-100 text-teal-700',
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">NexusCRM</h1>
        <div className="flex items-center gap-4">
          <a href={`${API}/api/docs`} className="text-sm text-blue-600 hover:underline" target="_blank" rel="noreferrer">
            API Docs ↗
          </a>
          <button onClick={logout} className="text-sm text-slate-500 hover:text-slate-800">
            Sign out
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-semibold text-slate-800 mb-6">Dashboard</h2>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          {[
            { label: 'Total Contacts', value: loading ? '—' : stats.contacts, color: 'blue' },
            { label: 'Open Deals', value: loading ? '—' : stats.deals, color: 'green' },
            { label: 'Pipeline Value', value: loading ? '—' : `$${stats.pipeline.toLocaleString()}`, color: 'purple' },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <p className="text-sm text-slate-500 mb-1">{card.label}</p>
              <p className="text-3xl font-bold text-slate-900">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contacts table */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Contacts</h3>
              <span className="text-xs text-slate-400">{contacts.length} shown</span>
            </div>
            {loading ? (
              <div className="p-10 text-center text-slate-400 text-sm">Loading…</div>
            ) : contacts.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-sm">
                No contacts yet.{' '}
                <button onClick={() => {
                  const token = localStorage.getItem('crm_token')
                  if (!token) return
                  fetch(`${API}/api/v1/seed`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }})
                    .then(() => fetchData())
                }} className="text-blue-600 hover:underline">
                  Seed 30 demo contacts
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3 text-left">Name</th>
                      <th className="px-4 py-3 text-left">Company</th>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-left">Stage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {contacts.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {c.first_name} {c.last_name}
                        </td>
                        <td className="px-4 py-3 text-slate-500">{c.company}</td>
                        <td className="px-4 py-3 text-slate-500">{c.email}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${stageBadge[c.stage] || 'bg-slate-100 text-slate-600'}`}>
                            {c.stage}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Deals sidebar */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Recent Deals</h3>
            </div>
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-sm">Loading…</div>
            ) : deals.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">No deals yet.</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {deals.slice(0, 10).map(d => (
                  <li key={d.id} className="px-5 py-3">
                    <p className="text-sm font-medium text-slate-800 truncate">{d.title}</p>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${stageBadge[d.stage] || 'bg-slate-100 text-slate-600'}`}>
                        {d.stage?.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-500">${Number(d.value || 0).toLocaleString()}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
