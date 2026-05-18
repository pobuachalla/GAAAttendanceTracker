import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

async function getPlayers(includeArchived: boolean) {
  return prisma.player.findMany({
    where: includeArchived ? {} : { archivedAt: null },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    include: {
      statuses: {
        where: {
          OR: [
            { endDate: null },
            { endDate: { gte: new Date() } },
          ],
        },
      },
    },
  })
}

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string }>
}) {
  const sp = await searchParams
  const showArchived = sp.archived === 'true'
  const players = await getPlayers(showArchived)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Players</h1>
          <p className="text-gray-500 text-sm mt-1">
            {players.filter((p) => !p.archivedAt).length} active players
          </p>
        </div>
        <Link
          href="/players/new"
          className="bg-[#006837] hover:bg-[#005429] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2"
        >
          <span>+</span> Add Player
        </Link>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        <Link
          href="/players"
          className={`text-sm px-3 py-1.5 rounded-full font-medium transition-colors ${
            !showArchived
              ? 'bg-[#006837] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Active
        </Link>
        <Link
          href="/players?archived=true"
          className={`text-sm px-3 py-1.5 rounded-full font-medium transition-colors ${
            showArchived
              ? 'bg-[#006837] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All (incl. archived)
        </Link>
      </div>

      {/* Player list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {players.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <div className="text-4xl mb-3">👥</div>
            <p className="font-medium">No players found</p>
            <Link href="/players/new" className="text-[#006837] text-sm mt-2 inline-block hover:underline">
              Add the first player →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {players.map((player) => {
              const isArchived = !!player.archivedAt
              const isInjured = player.statuses.some((s) => s.status === 'long_term_injured')
              const isCounty = player.statuses.some((s) => s.status === 'county_duty')

              return (
                <Link
                  key={player.id}
                  href={`/players/${player.id}`}
                  className={`flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors ${
                    isArchived ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-[#006837]/10 rounded-full flex items-center justify-center text-[#006837] font-bold text-sm flex-shrink-0">
                      {player.firstName[0]}{player.lastName[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 text-sm">
                        {player.displayName || `${player.firstName} ${player.lastName}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        Joined {formatDate(player.joinedAt)} · {player.codePreference}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isInjured && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                        Injured
                      </span>
                    )}
                    {isCounty && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        County
                      </span>
                    )}
                    {isArchived && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        Archived
                      </span>
                    )}
                    <span className="text-gray-400 text-sm">›</span>
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
