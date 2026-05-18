import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calcPlayerStats, DEFAULT_WEIGHTS } from '@/lib/attendance-calc'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { searchParams } = new URL(req.url)
  const seasonId = searchParams.get('seasonId')

  const player = await prisma.player.findUnique({
    where: { id },
    include: {
      attendances: {
        where: seasonId
          ? { session: { seasonId } }
          : undefined,
        include: {
          session: {
            include: {
              type: true,
              venue: true,
            },
          },
          attendanceCode: true,
        },
        orderBy: { session: { date: 'desc' } },
      },
    },
  })

  if (!player) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Get weights from DB
  const codes = await prisma.attendanceCode.findMany()
  const weights: Record<string, number> = {}
  for (const c of codes) {
    weights[c.code] = c.weight
  }

  const entries = player.attendances.map((a) => ({
    code: a.code,
    sessionCancelled: a.session.cancelled,
  }))

  const stats = calcPlayerStats(entries, { ...DEFAULT_WEIGHTS, ...weights })

  // Last 4 sessions
  const last4 = player.attendances.slice(0, 4).map((a) => ({
    sessionId: a.sessionId,
    date: a.session.date,
    typeName: a.session.type.name,
    venue: a.session.venue.name,
    code: a.code,
    label: a.attendanceCode.label,
    cancelled: a.session.cancelled,
  }))

  return NextResponse.json({
    player: {
      id: player.id,
      firstName: player.firstName,
      lastName: player.lastName,
      displayName: player.displayName,
    },
    ...stats,
    last4,
    allAttendances: player.attendances.map((a) => ({
      sessionId: a.sessionId,
      date: a.session.date,
      code: a.code,
      cancelled: a.session.cancelled,
    })),
  })
}
