import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ playerId: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { playerId } = await params

  const results = await prisma.broncoResult.findMany({
    where: { playerId },
    include: { session: true },
    orderBy: { session: { date: 'asc' } },
  })

  return NextResponse.json(results)
}
