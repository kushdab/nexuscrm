'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || ''

const NAV = [
  { href: '/dashboard',            icon: '⬛', label: 'Overview'    },
  { href: '/dashboard/customers',  icon: '👥', label: 'Customers'   },
  { href: '/dashboard/deals',      icon: '💼', label: 'Deals'       },
  { href: '/dashboard/marketing',  icon: '📣', label: 'Marketing'   },
  { href: '/dashboard/reports',    icon: '📊', label: 'Reports'     },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [user, setUser]       = useState<{ full_name: string; email: string } | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('crm_token')
    if (!token) { router.push('/login'); return }
    fetch(`${API}/api/v1/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null).then(d => d && setUser(d)).catch(() => {})
  }, [router])

  useEffect(() => { setMobileOpen(false) }, [pathname])

  function logout() { localStorage.removeItem('crm_token'); router.push('/login') }

  const initials = user?.full_name?.split(' ').map((w:string) => w[0]).join('').slice(0,2).toUpperCase() || '?'

  const SidebarContent = () => (
    <>
      <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
        {!collapsed && (
          <span className="text-lg font-extrabold tracking-tight text-white">
            Nexus<span className="text-blue-400">CRM</span>
          </span>
        )}
        <button onClick={() => setCollapsed(c => !c)}
          className="hidden md:flex p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors ml-auto">
          {collapsed ? '→' : '←'}
        </button>
        <button onClick={() => setMobileOpen(false)}
          className="md:hidden p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors ml-auto text-xl">
          ✕
        </button>
      </div>

      <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, icon, label }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl text-sm font-medium transition-all
                ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-white/60 hover:bg-white/8 hover:text-white'}`}>
              <span className="text-base">{icon}</span>
              {(!collapsed || mobileOpen) && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        {user && (
          <div className={`flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors ${collapsed && !mobileOpen ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {initials}
            </div>
            {(!collapsed || mobileOpen) && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user.full_name}</p>
                <p className="text-xs text-white/40 truncate">{user.email}</p>
              </div>
            )}
          </div>
        )}
        <button onClick={logout}
          className={`mt-2 flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors font-medium ${collapsed && !mobileOpen ? 'justify-center' : ''}`}>
          <span>⏻</span>
          {(!collapsed || mobileOpen) && <span>Sign Out</span>}
        </button>
      </div>
    </>
  )

  return (
    <div className="flex h-screen bg-[#f0f2f5] overflow-hidden">

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col w-64 bg-[#111827] text-white transition-transform duration-300 md:hidden
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className={`hidden md:flex flex-col bg-[#111827] text-white transition-all duration-300 flex-shrink-0
        ${collapsed ? 'w-16' : 'w-60'}`}>
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 text-xl">☰</button>
          <span className="font-extrabold tracking-tight text-gray-900">Nexus<span className="text-blue-600">CRM</span></span>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
            {initials}
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
