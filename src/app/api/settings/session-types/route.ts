import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const types = await prisma.sessionType.findMany({
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(types)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['MANAGER', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { name } = body

  if (!name) {
    return NextResponse.json({ error: 'name required' }, { status: 400 })
  }

  const type = await prisma.sessionType.create({ data: { name } })
  return NextResponse.json(type, { status: 201 })
}
