import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const player = await prisma.player.findUnique({
    where: { id },
    include: {
      statuses: true,
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

  if (!player) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(player)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const existing = await prisma.player.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { archived, ...updateData } = body

  const updatePayload: Record<string, unknown> = { ...updateData }

  if (archived === true && !existing.archivedAt) {
    updatePayload.archivedAt = new Date()
  } else if (archived === false && existing.archivedAt) {
    updatePayload.archivedAt = null
  }

  if (updatePayload.dob) {
    updatePayload.dob = new Date(updatePayload.dob as string)
  }
  if (updatePayload.joinedAt) {
    updatePayload.joinedAt = new Date(updatePayload.joinedAt as string)
  }
  if (updatePayload.positions && Array.isArray(updatePayload.positions)) {
    updatePayload.positions = JSON.stringify(updatePayload.positions)
  }

  const player = await prisma.player.update({
    where: { id },
    data: updatePayload,
  })

  await createAuditLog({
    entity: 'Player',
    entityId: player.id,
    action: 'UPDATE',
    actorId: session.user.id,
    before: existing,
    after: player,
  })

  return NextResponse.json(player)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['MANAGER', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const existing = await prisma.player.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const player = await prisma.player.update({
    where: { id },
    data: { archivedAt: new Date() },
  })

  await createAuditLog({
    entity: 'Player',
    entityId: player.id,
    action: 'DELETE',
    actorId: session.user.id,
    before: existing,
  })

  return NextResponse.json({ success: true })
}
