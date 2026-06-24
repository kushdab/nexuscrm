'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || ''

const NAV = [
  { href: '/dashboard',          icon: '▣', label: 'Overview'     },
  { href: '/dashboard/contacts', icon: '👤', label: 'Contacts'     },
  { href: '/dashboard/deals',    icon: '💼', label: 'Deals'        },
  { href: '/dashboard/reports',  icon: '📊', label: 'Reports'      },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<{ full_name: string; email: string } | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('crm_token')
    if (!token) { router.push('/login'); return }
    fetch(`${API}/api/v1/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setUser(d))
      .catch(() => {})
  }, [router])

  function logout() { localStorage.removeItem('crm_token'); router.push('/login') }

  const initials = user?.full_name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || '?'

  return (
    <div className="flex h-screen bg-[#f0f2f5] overflow-hidden">

      {/* ── Sidebar ── */}
      <aside
        className={`flex flex-col bg-[#111827] text-white transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'} flex-shrink-0`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
          {!collapsed && (
            <span className="text-lg font-extrabold tracking-tight text-white">
              Nexus<span className="text-blue-400">CRM</span>
            </span>
          )}
          <button onClick={() => setCollapsed(c => !c)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors ml-auto">
            {collapsed ? '→' : '←'}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, icon, label }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-xl text-sm font-medium transition-all
                  ${active
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
              >
                <span className="text-base flex-shrink-0">{icon}</span>
                {!collapsed && <span>{label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User footer */}
        <div className="border-t border-white/10 p-3">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            {!collapsed && user && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{user.full_name}</p>
                <p className="text-xs text-white/40 truncate">{user.email}</p>
              </div>
            )}
            {!collapsed && (
              <button onClick={logout} title="Sign out"
                className="text-white/40 hover:text-red-400 transition-colors text-sm">⏻</button>
            )}
          </div>
        </div>
      </aside>

      {/* ── Content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="text-gray-300">/</span>
            <span className="font-medium text-gray-800 capitalize">
              {pathname.split('/').filter(Boolean).slice(-1)[0] || 'Overview'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a href={`${API}/api/docs`} target="_blank" rel="noreferrer"
               className="text-xs text-blue-600 hover:underline px-3 py-1.5 rounded-lg border border-blue-200 hover:border-blue-400 transition-colors">
              API Docs ↗
            </a>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
