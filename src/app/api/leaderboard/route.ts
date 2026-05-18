import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calcPlayerStats, rankPlayers, DEFAULT_WEIGHTS } from '@/lib/attendance-calc'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const seasonId = searchParams.get('seasonId')

  // Get active season if not specified
  let activeSeasonId = seasonId
  if (!activeSeasonId) {
    const activeSeason = await prisma.season.findFirst({ where: { active: true } })
    if (activeSeason) activeSeasonId = activeSeason.id
  }

  const codes = await prisma.attendanceCode.findMany()
  const weights: Record<string, number> = {}
  for (const c of codes) {
    weights[c.code] = c.weight
  }

  const players = await prisma.player.findMany({
    where: { archivedAt: null },
    include: {
      attendances: {
        where: activeSeasonId ? { session: { seasonId: activeSeasonId } } : undefined,
        include: { session: { select: { cancelled: true } } },
      },
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  })

  const playerStats = players.map((p) => {
    const entries = p.attendances.map((a) => ({
      code: a.code,
      sessionCancelled: a.session.cancelled,
    }))
    const stats = calcPlayerStats(entries, { ...DEFAULT_WEIGHTS, ...weights })
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

  const ranked = rankPlayers(playerStats)

  return NextResponse.json(ranked)
}
