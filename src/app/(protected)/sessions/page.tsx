import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

async function getSessions(seasonId?: string) {
  return prisma.session.findMany({
    where: seasonId ? { seasonId } : undefined,
    orderBy: { date: 'desc' },
    include: {
      type: true,
      venue: true,
      season: true,
      _count: { select: { attendances: true } },
    },
  })
}

async function getSeasons() {
  return prisma.season.findMany({ orderBy: { startDate: 'desc' } })
}

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ seasonId?: string }>
}) {
  const sp = await searchParams
  const [sessions, seasons] = await Promise.all([
    getSessions(sp.seasonId),
    getSeasons(),
  ])

  const activeSeason = seasons.find((s) => s.active)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sessions</h1>
          <p className="text-gray-500 text-sm mt-1">{sessions.length} sessions</p>
        </div>
        <Link
          href="/sessions/new"
          className="bg-[#006837] hover:bg-[#005429] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2"
        >
          <span>+</span> New Session
        </Link>
      </div>

      {/* Season filter */}
      {seasons.length > 0 && (
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          <Link
            href="/sessions"
            className={`text-sm px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors ${
              !sp.seasonId
                ? 'bg-[#006837] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All seasons
          </Link>
          {seasons.map((s) => (
            <Link
              key={s.id}
              href={`/sessions?seasonId=${s.id}`}
              className={`text-sm px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors ${
                sp.seasonId === s.id
                  ? 'bg-[#006837] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s.name}
              {s.active && <span className="ml-1 text-[#FFCD00]">●</span>}
            </Link>
          ))}
        </div>
      )}

      {/* Sessions list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {sessions.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <div className="text-4xl mb-3">📅</div>
            <p className="font-medium">No sessions yet</p>
            <Link href="/sessions/new" className="text-[#006837] text-sm mt-2 inline-block hover:underline">
              Create the first session →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sessions.map((s) => (
              <Link
                key={s.id}
                href={`/sessions/${s.id}`}
                className={`flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors ${
                  s.cancelled ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="text-2xl flex-shrink-0">
                    {s.type.name.includes('Match') ? '⚽' : '🏃'}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 text-sm flex items-center gap-2">
                      {s.type.name}
                      {s.opposition && (
                        <span className="text-gray-500 text-xs">vs {s.opposition}</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(s.date)} · {s.dayOfWeek} · {s.venue.name}
                    </div>
                    <div className="text-xs text-gray-400">{s.season.name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {s.cancelled && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                      Cancelled
                    </span>
                  )}
                  {s.locked && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      🔒
                    </span>
                  )}
                  <span className="text-xs text-gray-400">{s._count.attendances} ✓</span>
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
