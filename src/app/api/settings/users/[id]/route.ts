import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['MANAGER', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()

  const user = await prisma.user.update({
    where: { id },
    data: {
      name: body.name,
      role: body.role,
      active: body.active,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
      createdAt: true,
    },
  })

  return NextResponse.json(user)
}
