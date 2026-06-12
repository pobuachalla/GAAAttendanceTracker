import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calcMAS } from '@/lib/bronco-calc'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: sessionId } = await params
  const body = await req.json()
  const { playerId, timeSeconds } = body

  if (!playerId || !timeSeconds) {
    return NextResponse.json({ error: 'playerId and timeSeconds required' }, { status: 400 })
  }

  const mas = calcMAS(timeSeconds)

  const result = await prisma.broncoResult.upsert({
    where: { sessionId_playerId: { sessionId, playerId } },
    create: { sessionId, playerId, timeSeconds, mas },
    update: { timeSeconds, mas },
    include: { player: true },
  })

  return NextResponse.json(result)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: sessionId } = await params
  const { playerId } = await req.json()

  await prisma.broncoResult.deleteMany({ where: { sessionId, playerId } })
  return NextResponse.json({ ok: true })
}
