import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['MANAGER', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { code } = await params
  const body = await req.json()

  const existing = await prisma.attendanceCode.findUnique({ where: { code } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Can't change code, label of protected codes — only weight/colour
  const updateData: Record<string, unknown> = {}
  if (body.weight !== undefined) updateData.weight = body.weight
  if (body.colour !== undefined) updateData.colour = body.colour
  if (!existing.protected) {
    if (body.label !== undefined) updateData.label = body.label
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder
  }

  const updated = await prisma.attendanceCode.update({
    where: { code },
    data: updateData,
  })

  return NextResponse.json(updated)
}
