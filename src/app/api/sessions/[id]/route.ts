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

  const s = await prisma.session.findUnique({
    where: { id },
    include: {
      type: true,
      venue: true,
      season: true,
      attendances: {
        include: {
          player: true,
          attendanceCode: true,
          recorder: { select: { id: true, name: true } },
        },
      },
    },
  })

  if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(s)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const existing = await prisma.session.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Only managers can cancel/lock
  if (
    (body.cancelled !== undefined || body.locked !== undefined) &&
    !['MANAGER', 'ADMIN'].includes(session.user.role)
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const updated = await prisma.session.update({
    where: { id },
    data: body,
  })

  await createAuditLog({
    entity: 'Session',
    entityId: id,
    action: 'UPDATE',
    actorId: session.user.id,
    before: existing,
    after: updated,
  })

  return NextResponse.json(updated)
}
