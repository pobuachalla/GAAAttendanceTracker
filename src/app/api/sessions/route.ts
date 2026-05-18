import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'
import { getDayOfWeek } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const seasonId = searchParams.get('seasonId')

  const sessions = await prisma.session.findMany({
    where: seasonId ? { seasonId } : undefined,
    orderBy: { date: 'desc' },
    include: {
      type: true,
      venue: true,
      season: true,
      _count: { select: { attendances: true } },
    },
  })

  return NextResponse.json(sessions)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    seasonId,
    typeId,
    date,
    startTime,
    venueId,
    opposition,
    homeAway,
    competition,
    ourScore,
    theirScore,
    notes,
  } = body

  if (!seasonId || !typeId || !date || !venueId) {
    return NextResponse.json(
      { error: 'seasonId, typeId, date, venueId required' },
      { status: 400 }
    )
  }

  const sessionDate = new Date(date)
  const dayOfWeek = getDayOfWeek(sessionDate)

  const newSession = await prisma.session.create({
    data: {
      seasonId,
      typeId,
      date: sessionDate,
      startTime: startTime || null,
      venueId,
      dayOfWeek,
      opposition: opposition || null,
      homeAway: homeAway || null,
      competition: competition || null,
      ourScore: ourScore || null,
      theirScore: theirScore || null,
      notes: notes || null,
    },
    include: {
      type: true,
      venue: true,
      season: true,
    },
  })

  await createAuditLog({
    entity: 'Session',
    entityId: newSession.id,
    action: 'CREATE',
    actorId: session.user.id,
    after: newSession,
  })

  return NextResponse.json(newSession, { status: 201 })
}
