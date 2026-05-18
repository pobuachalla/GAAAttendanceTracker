import { auth } from '@/lib/auth'
import Link from 'next/link'

export default async function SettingsPage() {
  const session = await auth()
  const role = session?.user?.role ?? 'COACH'
  const isManager = ['MANAGER', 'ADMIN'].includes(role)

  const items = [
    {
      label: 'Seasons',
      href: '/settings/seasons',
      icon: '📆',
      desc: 'Manage seasons and set the active season',
      managerOnly: true,
    },
    {
      label: 'Venues',
      href: '/settings/venues',
      icon: '🏟️',
      desc: 'Add and manage training / match venues',
      managerOnly: true,
    },
    {
      label: 'Attendance Codes',
      href: '/settings/codes',
      icon: '🎯',
      desc: 'Adjust code weights and colours',
      managerOnly: true,
    },
    {
      label: 'Session Types',
      href: '/settings/session-types',
      icon: '📋',
      desc: 'Manage types of training and match sessions',
      managerOnly: true,
    },
    {
      label: 'Users',
      href: '/settings/users',
      icon: '👤',
      desc: 'Invite and manage coaches / managers',
      managerOnly: true,
    },
  ]

  const visible = items.filter((i) => !i.managerOnly || isManager)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your squad setup</p>
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-2">🔒</div>
          <p>You don't have access to settings.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-5 hover:border-[#006837] hover:shadow-sm transition-all"
            >
              <div className="w-12 h-12 bg-[#006837]/10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900">{item.label}</div>
                <div className="text-sm text-gray-500">{item.desc}</div>
              </div>
              <span className="text-gray-400">›</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
