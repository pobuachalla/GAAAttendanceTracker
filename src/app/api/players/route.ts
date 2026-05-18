import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const includeArchived = searchParams.get('includeArchived') === 'true'

  const players = await prisma.player.findMany({
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

  return NextResponse.json(players)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    firstName,
    lastName,
    displayName,
    dob,
    joinedAt,
    codePreference,
    positions,
    parentName,
    parentPhone,
    parentEmail,
    photoUrl,
  } = body

  if (!firstName || !lastName) {
    return NextResponse.json({ error: 'firstName and lastName required' }, { status: 400 })
  }

  const player = await prisma.player.create({
    data: {
      firstName,
      lastName,
      displayName: displayName || null,
      dob: dob ? new Date(dob) : null,
      joinedAt: joinedAt ? new Date(joinedAt) : new Date(),
      codePreference: codePreference ?? 'dual',
      positions: JSON.stringify(positions ?? []),
      parentName: parentName || null,
      parentPhone: parentPhone || null,
      parentEmail: parentEmail || null,
      photoUrl: photoUrl || null,
    },
  })

  await createAuditLog({
    entity: 'Player',
    entityId: player.id,
    action: 'CREATE',
    actorId: session.user.id,
    after: player,
  })

  return NextResponse.json(player, { status: 201 })
}
