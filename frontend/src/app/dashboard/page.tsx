'use client'
import { useEffect, useState } from 'react'

interface Stats {
  contacts: number
  deals: number
  revenue: number
}

export default function Dashboard() {
  const [stats] = useState<Stats>({ contacts: 0, deals: 0, revenue: 0 })
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">NexusCRM</h1>
        <a href={`${apiUrl}/api/docs`}
           className="text-sm text-blue-600 hover:underline" target="_blank" rel="noreferrer">
          API Docs ↗
        </a>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-semibold text-slate-800 mb-6">Dashboard</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          {[
            { label: 'Contacts', value: stats.contacts, color: 'blue' },
            { label: 'Open Deals', value: stats.deals, color: 'green' },
            { label: 'Pipeline Value', value: `$${stats.revenue.toLocaleString()}`, color: 'purple' },
          ].map((card) => (
            <div key={card.label}
                 className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <p className="text-sm text-slate-500 mb-1">{card.label}</p>
              <p className="text-3xl font-bold text-slate-900">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
          <p className="text-lg font-medium mb-2">Connect your data</p>
          <p className="text-sm">
            Use the{' '}
            <a href={`${apiUrl}/api/docs`} className="text-blue-600 hover:underline" target="_blank" rel="noreferrer">
              REST API
            </a>{' '}
            to import contacts, create deals, and start tracking your pipeline.
          </p>
        </div>
      </main>
    </div>
  )
}
