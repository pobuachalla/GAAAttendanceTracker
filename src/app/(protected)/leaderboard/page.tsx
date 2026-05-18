import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { calcPlayerStats, rankPlayers, DEFAULT_WEIGHTS, formatPercent } from '@/lib/attendance-calc'
import { CODE_BG_CLASSES } from '@/lib/utils'

async function getLeaderboard(seasonId?: string) {
  const codes = await prisma.attendanceCode.findMany()
  const weights: Record<string, number> = {}
  for (const c of codes) {
    weights[c.code] = c.weight
  }
  const mergedWeights = { ...DEFAULT_WEIGHTS, ...weights }

  const players = await prisma.player.findMany({
    where: { archivedAt: null },
    include: {
      attendances: {
        where: seasonId ? { session: { seasonId } } : undefined,
        include: { session: { select: { cancelled: true } } },
      },
    },
  })

  const stats = players.map((p) => {
    const entries = p.attendances.map((a) => ({
      code: a.code,
      sessionCancelled: a.session.cancelled,
    }))
    const s = calcPlayerStats(entries, mergedWeights)
    return {
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      displayName: p.displayName,
      percentage: s.percentage,
      n: s.n,
      breakdown: s.breakdown,
    }
  })

  return rankPlayers(stats)
}

async function getSeasons() {
  return prisma.season.findMany({ orderBy: { startDate: 'desc' } })
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ seasonId?: string }>
}) {
  const sp = await searchParams
  const [ranked, seasons] = await Promise.all([
    getLeaderboard(sp.seasonId),
    getSeasons(),
  ])

  const medalEmoji = ['🥇', '🥈', '🥉']

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Ranked by weighted attendance %
        </p>
      </div>

      {/* Season filter */}
      {seasons.length > 0 && (
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          <Link
            href="/leaderboard"
            className={`text-sm px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors ${
              !sp.seasonId
                ? 'bg-[#006837] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All time
          </Link>
          {seasons.map((s) => (
            <Link
              key={s.id}
              href={`/leaderboard?seasonId=${s.id}`}
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

      {/* Leaderboard */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {ranked.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <div className="text-4xl mb-3">🏆</div>
            <p>No data yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {ranked.map((player, i) => {
              const isTop3 = player.rank <= 3
              return (
                <Link
                  key={player.id}
                  href={`/players/${player.id}`}
                  className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors ${
                    isTop3 ? 'bg-yellow-50/50' : ''
                  }`}
                >
                  {/* Rank */}
                  <div className="w-8 text-center flex-shrink-0">
                    {player.rank <= 3 ? (
                      <span className="text-xl">{medalEmoji[player.rank - 1]}</span>
                    ) : (
                      <span className="text-sm font-bold text-gray-400">#{player.rank}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 bg-[#006837]/10 rounded-full flex items-center justify-center text-[#006837] font-bold text-sm flex-shrink-0">
                    {player.firstName[0]}{player.lastName[0]}
                  </div>

                  {/* Name & breakdown */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm">
                      {player.displayName || `${player.firstName} ${player.lastName}`}
                    </div>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {(['P', 'C', 'L', 'I', 'E', 'U'] as const).map((code) => {
                        const count = player.breakdown[code] ?? 0
                        if (!count) return null
                        return (
                          <span
                            key={code}
                            className={`text-xs px-1.5 py-0.5 rounded font-medium ${CODE_BG_CLASSES[code]}`}
                          >
                            {code}:{count}
                          </span>
                        )
                      })}
                      <span className="text-xs text-gray-400">N={player.n}</span>
                    </div>
                  </div>

                  {/* Percentage */}
                  <div className="text-right flex-shrink-0">
                    <div className={`text-lg font-bold ${isTop3 ? 'text-[#006837]' : 'text-gray-900'}`}>
                      {formatPercent(player.percentage)}
                    </div>
                    <div className="text-xs text-gray-400">{player.n} sessions</div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
