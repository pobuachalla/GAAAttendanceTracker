'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { signOut } from 'next-auth/react'

interface NavItem {
  label: string
  href: string
  icon: string
  roles?: string[]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: '🏠' },
  { label: 'Players', href: '/players', icon: '👥' },
  { label: 'Sessions', href: '/sessions', icon: '📅' },
  { label: 'Leaderboard', href: '/leaderboard', icon: '🏆' },
  { label: 'Bronco Tests', href: '/bronco', icon: '⏱️' },
  { label: 'Settings', href: '/settings', icon: '⚙️', roles: ['MANAGER', 'ADMIN'] },
]

interface SidebarProps {
  userRole?: string
  userName?: string
}

export default function Sidebar({ userRole, userName }: SidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(userRole ?? '')
  )

  const NavLinks = () => (
    <>
      {visibleItems.map((item) => {
        const active =
          item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              active
                ? 'bg-[#FFCD00] text-[#006837] font-bold'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        )
      })}
    </>
  )

  return (
    <>
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#006837] text-white flex items-center justify-between px-4 py-3 h-14 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏐</span>
          <span className="font-bold text-sm">GAA Attendance</span>
        </div>
        <button
          className="p-2 rounded-lg hover:bg-white/10 min-h-0 min-w-0"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <div className="w-5 h-0.5 bg-white mb-1"></div>
          <div className="w-5 h-0.5 bg-white mb-1"></div>
          <div className="w-5 h-0.5 bg-white"></div>
        </button>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-full w-64 bg-[#006837] shadow-xl flex flex-col
          transition-transform duration-200
          lg:translate-x-0 lg:static lg:h-screen
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/20">
          <span className="text-3xl">🏐</span>
          <div>
            <div className="text-white font-bold text-base leading-tight">GAA Attendance</div>
            <div className="text-white/60 text-xs">U16 Squad Manager</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <NavLinks />
        </nav>

        {/* User info + Sign out */}
        <div className="px-3 py-4 border-t border-white/20">
          {userName && (
            <div className="px-4 py-2 text-white/60 text-xs mb-2 truncate">{userName}</div>
          )}
          {userRole && (
            <div className="px-4 py-1 mb-2">
              <span className="inline-block bg-[#FFCD00] text-[#006837] text-xs font-bold px-2 py-0.5 rounded">
                {userRole}
              </span>
            </div>
          )}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-white hover:bg-white/10 transition-colors"
          >
            <span className="text-lg">🚪</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile top spacer */}
      <div className="lg:hidden h-14" />
    </>
  )
}
