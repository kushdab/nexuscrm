'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || ''

const NAV = [
  { href: '/dashboard',          icon: '⊞', label: 'Overview'  },
  { href: '/dashboard/contacts', icon: '👤', label: 'Contacts'  },
  { href: '/dashboard/deals',    icon: '💼', label: 'Deals'     },
  { href: '/dashboard/reports',  icon: '📊', label: 'Reports'   },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<{ full_name: string; email: string } | null>(null)
  const [sideOpen, setSideOpen] = useState(false)   // mobile drawer
  const [collapsed, setCollapsed] = useState(false) // desktop collapse

  useEffect(() => {
    const token = localStorage.getItem('crm_token')
    if (!token) { router.push('/login'); return }
    fetch(`${API}/api/v1/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setUser(d))
      .catch(() => {})
  }, [router])

  // Close drawer on route change (mobile)
  useEffect(() => { setSideOpen(false) }, [pathname])

  function logout() { localStorage.removeItem('crm_token'); router.push('/login') }
  const initials = user?.full_name?.split(' ').map((w:string) => w[0]).join('').slice(0,2).toUpperCase() || '?'

  const SidebarContent = ({ compact }: { compact: boolean }) => (
    <>
      {/* Logo row */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-white/10 flex-shrink-0">
        {!compact && (
          <span className="text-lg font-extrabold tracking-tight text-white">
            Nexus<span className="text-blue-400">CRM</span>
          </span>
        )}
        {/* desktop collapse toggle (hidden on mobile) */}
        <button onClick={() => setCollapsed(c => !c)}
          className="hidden md:flex p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors ml-auto">
          {compact ? '→' : '←'}
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, icon, label }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-xl text-sm font-medium transition-all
                ${active ? 'bg-blue-600 text-white shadow-md' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
              <span className="text-base flex-shrink-0">{icon}</span>
              {!compact && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/10 p-4 flex-shrink-0">
        <div className={`flex items-center gap-3 ${compact ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
            {initials}
          </div>
          {!compact && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{user?.full_name || '…'}</p>
              <p className="text-xs text-white/50 truncate">{user?.email || ''}</p>
            </div>
          )}
        </div>
        {!compact && (
          <button onClick={logout}
            className="mt-3 w-full py-2 text-xs text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-left px-2">
            ⏏  Sign out
          </button>
        )}
      </div>
    </>
  )

  return (
    <div className="flex h-screen bg-[#f0f2f5] overflow-hidden">

      {/* ── Mobile drawer overlay ── */}
      {sideOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setSideOpen(false)} />
          {/* drawer panel */}
          <aside className="absolute left-0 top-0 h-full w-64 flex flex-col bg-[#111827] text-white shadow-2xl z-50">
            <SidebarContent compact={false} />
          </aside>
        </div>
      )}

      {/* ── Desktop sidebar ── */}
      <aside className={`hidden md:flex flex-col bg-[#111827] text-white transition-all duration-300 flex-shrink-0 ${collapsed ? 'w-16' : 'w-60'}`}>
        <SidebarContent compact={collapsed} />
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 bg-white border-b border-slate-200 px-4 py-3 flex-shrink-0 shadow-sm">
          <button onClick={() => setSideOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-base font-extrabold tracking-tight text-slate-900">
            Nexus<span className="text-blue-500">CRM</span>
          </span>
          <button onClick={logout} className="ml-auto text-xs text-slate-400 hover:text-slate-700 transition-colors">
            Sign out
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
