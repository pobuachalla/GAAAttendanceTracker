import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sessions = await prisma.broncoSession.findMany({
    orderBy: { date: 'desc' },
    include: {
      _count: { select: { results: true } },
    },
  })

  return NextResponse.json(sessions)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { date, conditions, notes } = body

  if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 })

  const bs = await prisma.broncoSession.create({
    data: { date: new Date(date), conditions: conditions || null, notes: notes || null },
  })

  return NextResponse.json(bs, { status: 201 })
}
