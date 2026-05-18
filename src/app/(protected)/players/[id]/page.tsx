import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDate, CODE_BG_CLASSES, CODE_LABELS } from '@/lib/utils'
import { calcPlayerStats, rankPlayers, DEFAULT_WEIGHTS } from '@/lib/attendance-calc'
import PlayerEditModal from './PlayerEditModal'
import AttendanceTrendChart from './AttendanceTrendChart'

async function getPlayerData(id: string) {
  const player = await prisma.player.findUnique({
    where: { id },
    include: {
      statuses: {
        orderBy: { createdAt: 'desc' },
      },
      attendances: {
        include: {
          session: {
            include: { type: true, venue: true },
          },
          attendanceCode: true,
        },
        orderBy: { session: { date: 'desc' } },
      },
    },
  })

  if (!player) return null

  // Get weights from DB
  const codes = await prisma.attendanceCode.findMany()
  const weights: Record<string, number> = {}
  for (const c of codes) {
    weights[c.code] = c.weight
  }

  // Get all players for ranking
  const allPlayers = await prisma.player.findMany({
    where: { archivedAt: null },
    include: {
      attendances: {
        include: { session: { select: { cancelled: true } } },
      },
    },
  })

  const mergedWeights = { ...DEFAULT_WEIGHTS, ...weights }

  const allPlayerStats = allPlayers.map((p) => {
    const entries = p.attendances.map((a) => ({
      code: a.code,
      sessionCancelled: a.session.cancelled,
    }))
    const stats = calcPlayerStats(entries, mergedWeights)
    return {
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      displayName: p.displayName,
      percentage: stats.percentage,
      n: stats.n,
      breakdown: stats.breakdown,
    }
  })

  const ranked = rankPlayers(allPlayerStats)
  const myRank = ranked.find((r) => r.id === id)

  const myEntries = player.attendances.map((a) => ({
    code: a.code,
    sessionCancelled: a.session.cancelled,
  }))
  const myStats = calcPlayerStats(myEntries, mergedWeights)

  // Trend data (chronological)
  const trendData = [...player.attendances]
    .reverse()
    .filter((a) => !a.session.cancelled && a.code !== 'X')
    .map((a, idx, arr) => {
      // Running percentage up to this point
      const subset = arr.slice(0, idx + 1)
      const subStats = calcPlayerStats(
        subset.map((s) => ({ code: s.code, sessionCancelled: false })),
        mergedWeights
      )
      return {
        date: a.session.date,
        code: a.code,
        runningPct: subStats.percentage,
      }
    })

  return {
    player,
    stats: myStats,
    rank: myRank?.rank ?? null,
    totalPlayers: ranked.length,
    trendData,
  }
}

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getPlayerData(id)
  if (!data) notFound()

  const { player, stats, rank, totalPlayers, trendData } = data
  const isArchived = !!player.archivedAt
  const activeStatuses = player.statuses.filter(
    (s) => !s.endDate || s.endDate > new Date()
  )
  const isInjured = activeStatuses.some((s) => s.status === 'long_term_injured')
  const isCounty = activeStatuses.some((s) => s.status === 'county_duty')

  const positions: string[] = (() => {
    try {
      return JSON.parse(player.positions) as string[]
    } catch {
      return []
    }
  })()

  const last4 = player.attendances.slice(0, 4)

  const codeOrder = ['P', 'C', 'L', 'I', 'E', 'U', 'X']

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/players" className="text-gray-400 hover:text-gray-600 text-sm">
          ← Players
        </Link>
      </div>

      {/* Player Header */}
      <div className="bg-[#006837] text-white rounded-xl p-6 mb-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
              {player.firstName[0]}{player.lastName[0]}
            </div>
            <div>
              <h1 className="text-xl font-bold">
                {player.displayName || `${player.firstName} ${player.lastName}`}
              </h1>
              {player.displayName && (
                <p className="text-white/70 text-sm">{player.firstName} {player.lastName}</p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {isArchived && (
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Archived</span>
                )}
                {isInjured && (
                  <span className="text-xs bg-orange-400/30 text-orange-100 px-2 py-0.5 rounded-full">
                    Long-term Injured
                  </span>
                )}
                {isCounty && (
                  <span className="text-xs bg-blue-400/30 text-blue-100 px-2 py-0.5 rounded-full">
                    County Duty
                  </span>
                )}
                {positions.map((p) => (
                  <span key={p} className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{p}</span>
                ))}
              </div>
            </div>
          </div>
          <PlayerEditModal player={player} />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-[#006837]">
            {stats.percentage.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">Attendance %</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {rank !== null ? `#${rank}` : '—'}
          </div>
          <div className="text-xs text-gray-500 mt-1">Rank of {totalPlayers}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.n}</div>
          <div className="text-xs text-gray-500 mt-1">Sessions (N)</div>
        </div>
      </div>

      {/* Code Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <h2 className="font-semibold text-gray-900 mb-4">Code Breakdown</h2>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {codeOrder.map((code) => {
            const count = stats.breakdown[code] ?? 0
            return (
              <div key={code} className="text-center">
                <div
                  className={`w-full py-2 rounded-lg text-sm font-bold ${CODE_BG_CLASSES[code] ?? 'bg-gray-100 text-gray-700'}`}
                >
                  {code}
                </div>
                <div className="text-lg font-bold text-gray-900 mt-1">{count}</div>
                <div className="text-xs text-gray-400">{CODE_LABELS[code]?.split(' ')[0] ?? code}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Trend Chart */}
      {trendData.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
          <h2 className="font-semibold text-gray-900 mb-4">Attendance Trend</h2>
          <AttendanceTrendChart data={trendData} />
        </div>
      )}

      {/* Last 4 Sessions */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-5">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Last 4 Sessions</h2>
        </div>
        {last4.length === 0 ? (
          <div className="px-5 py-6 text-center text-gray-400 text-sm">No sessions recorded</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {last4.map((a) => (
              <Link
                key={a.id}
                href={`/sessions/${a.sessionId}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <div className="text-sm font-medium text-gray-900">{a.session.type.name}</div>
                  <div className="text-xs text-gray-500">
                    {formatDate(a.session.date)} · {a.session.venue.name}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {a.session.cancelled && (
                    <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">Cancelled</span>
                  )}
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${
                      CODE_BG_CLASSES[a.code] ?? 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {a.code}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Full history */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Full Attendance History</h2>
        </div>
        {player.attendances.length === 0 ? (
          <div className="px-5 py-6 text-center text-gray-400 text-sm">No attendance records</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {player.attendances.map((a) => (
              <Link
                key={a.id}
                href={`/sessions/${a.sessionId}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <div className="text-sm text-gray-900">{a.session.type.name}</div>
                  <div className="text-xs text-gray-500">
                    {formatDate(a.session.date)} · {a.session.venue.name}
                  </div>
                  {a.note && <div className="text-xs text-gray-400 italic mt-0.5">{a.note}</div>}
                </div>
                <div className="flex items-center gap-2">
                  {a.session.cancelled && (
                    <span className="text-xs text-gray-400">cancelled</span>
                  )}
                  <span
                    className={`inline-flex items-center justify-center w-7 h-7 rounded text-xs font-bold ${
                      CODE_BG_CLASSES[a.code] ?? 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {a.code}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
