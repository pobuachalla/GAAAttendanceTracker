import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'
import { isWithin48Hours } from '@/lib/utils'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const [sessionData, attendances, activePlayers] = await Promise.all([
    prisma.session.findUnique({
      where: { id },
      include: { type: true, venue: true },
    }),
    prisma.attendance.findMany({
      where: { sessionId: id },
      include: {
        player: true,
        attendanceCode: true,
        recorder: { select: { id: true, name: true } },
      },
    }),
    prisma.player.findMany({
      where: { archivedAt: null },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    }),
  ])

  if (!sessionData) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ session: sessionData, attendances, activePlayers })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const sessionData = await prisma.session.findUnique({ where: { id } })
  if (!sessionData) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  if (sessionData.locked && session.user.role === 'COACH') {
    return NextResponse.json({ error: 'Session is locked' }, { status: 403 })
  }

  // 48h window for coaches
  if (
    session.user.role === 'COACH' &&
    !isWithin48Hours(sessionData.date)
  ) {
    return NextResponse.json(
      { error: 'Edit window expired (48h for coaches)' },
      { status: 403 }
    )
  }

  // body = array of { playerId, code, note }
  const records: { playerId: string; code: string; note?: string }[] = body.records ?? []

  const results = []
  for (const record of records) {
    const existing = await prisma.attendance.findUnique({
      where: { sessionId_playerId: { sessionId: id, playerId: record.playerId } },
    })

    if (existing) {
      const updated = await prisma.attendance.update({
        where: { sessionId_playerId: { sessionId: id, playerId: record.playerId } },
        data: {
          code: record.code,
          note: record.note ?? null,
          recordedBy: session.user.id,
          recordedAt: new Date(),
        },
      })
      await createAuditLog({
        entity: 'Attendance',
        entityId: updated.id,
        action: 'UPDATE',
        actorId: session.user.id,
        before: existing,
        after: updated,
      })
      results.push(updated)
    } else {
      const created = await prisma.attendance.create({
        data: {
          sessionId: id,
          playerId: record.playerId,
          code: record.code,
          note: record.note ?? null,
          recordedBy: session.user.id,
        },
      })
      await createAuditLog({
        entity: 'Attendance',
        entityId: created.id,
        action: 'CREATE',
        actorId: session.user.id,
        after: created,
      })
      results.push(created)
    }
  }

  return NextResponse.json({ saved: results.length })
}
