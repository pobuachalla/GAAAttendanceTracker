import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

async function getDashboardStats() {
  const [playerCount, sessionCount, activeSeason, recentSessions] = await Promise.all([
    prisma.player.count({ where: { archivedAt: null } }),
    prisma.session.count({ where: { cancelled: false } }),
    prisma.season.findFirst({ where: { active: true } }),
    prisma.session.findMany({
      take: 5,
      orderBy: { date: 'desc' },
      include: {
        type: true,
        venue: true,
        _count: { select: { attendances: true } },
      },
    }),
  ])

  return { playerCount, sessionCount, activeSeason, recentSessions }
}

export default async function DashboardPage() {
  const session = await auth()
  const { playerCount, sessionCount, activeSeason, recentSessions } = await getDashboardStats()

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Welcome back, {session?.user?.name ?? 'Coach'}
        </p>
      </div>

      {/* Active Season Banner */}
      {activeSeason && (
        <div className="bg-[#006837] text-white rounded-xl px-5 py-4 mb-6 flex items-center justify-between">
          <div>
            <div className="text-xs text-white/70 uppercase tracking-wide">Active Season</div>
            <div className="text-lg font-bold">{activeSeason.name}</div>
            <div className="text-sm text-white/70">
              {formatDate(activeSeason.startDate)} – {formatDate(activeSeason.endDate)}
            </div>
          </div>
          <div className="text-4xl">🏆</div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon="👥"
          label="Active Players"
          value={playerCount}
          href="/players"
          color="green"
        />
        <StatCard
          icon="📅"
          label="Total Sessions"
          value={sessionCount}
          href="/sessions"
          color="blue"
        />
        <StatCard
          icon="🏆"
          label="Leaderboard"
          value="View"
          href="/leaderboard"
          color="yellow"
        />
        <StatCard
          icon="⚙️"
          label="Settings"
          value="Manage"
          href="/settings"
          color="gray"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link
          href="/sessions/new"
          className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-5 hover:border-[#006837] hover:shadow-md transition-all"
        >
          <div className="w-12 h-12 bg-[#006837]/10 rounded-xl flex items-center justify-center text-2xl">
            ➕
          </div>
          <div>
            <div className="font-semibold text-gray-900">New Session</div>
            <div className="text-sm text-gray-500">Create a training or match session</div>
          </div>
        </Link>

        <Link
          href="/players/new"
          className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-5 hover:border-[#006837] hover:shadow-md transition-all"
        >
          <div className="w-12 h-12 bg-[#006837]/10 rounded-xl flex items-center justify-center text-2xl">
            👤
          </div>
          <div>
            <div className="font-semibold text-gray-900">Add Player</div>
            <div className="text-sm text-gray-500">Register a new squad member</div>
          </div>
        </Link>
      </div>

      {/* Recent Sessions */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Sessions</h2>
          <Link href="/sessions" className="text-sm text-[#006837] font-medium hover:underline">
            View all
          </Link>
        </div>
        {recentSessions.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400">
            <div className="text-3xl mb-2">📅</div>
            No sessions yet
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentSessions.map((s) => (
              <Link
                key={s.id}
                href={`/sessions/${s.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-xl">
                    {s.type.name.includes('Match') ? '⚽' : '🏃'}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{s.type.name}</div>
                    <div className="text-xs text-gray-500">
                      {formatDate(s.date)} · {s.venue.name}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {s.cancelled && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                      Cancelled
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {s._count.attendances} attended
                  </span>
                  <span className="text-gray-400">›</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  href,
  color,
}: {
  icon: string
  label: string
  value: number | string
  href: string
  color: 'green' | 'blue' | 'yellow' | 'gray'
}) {
  const colorClasses = {
    green: 'bg-green-50 text-green-700',
    blue: 'bg-blue-50 text-blue-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    gray: 'bg-gray-50 text-gray-700',
  }

  return (
    <Link
      href={href}
      className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all hover:border-[#006837]"
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-3 ${colorClasses[color]}`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </Link>
  )
}
