import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seasons = await prisma.season.findMany({
    orderBy: { startDate: 'desc' },
    include: { _count: { select: { sessions: true } } },
  })
  return NextResponse.json(seasons)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['MANAGER', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { name, startDate, endDate, ageCategory, active } = body

  if (!name || !startDate || !endDate || !ageCategory) {
    return NextResponse.json({ error: 'name, startDate, endDate, ageCategory required' }, { status: 400 })
  }

  // If setting active, deactivate others
  if (active) {
    await prisma.season.updateMany({ data: { active: false } })
  }

  const season = await prisma.season.create({
    data: {
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      ageCategory,
      active: active ?? false,
    },
  })

  return NextResponse.json(season, { status: 201 })
}
