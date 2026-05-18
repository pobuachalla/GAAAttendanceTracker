import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import AttendanceGrid from './AttendanceGrid'

async function getAttendanceData(sessionId: string) {
  const [session, attendances, activePlayers, codes] = await Promise.all([
    prisma.session.findUnique({
      where: { id: sessionId },
      include: { type: true, venue: true, season: true },
    }),
    prisma.attendance.findMany({
      where: { sessionId },
      include: { player: true, attendanceCode: true },
    }),
    prisma.player.findMany({
      where: { archivedAt: null },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    }),
    prisma.attendanceCode.findMany({
      orderBy: { sortOrder: 'asc' },
    }),
  ])

  return { session, attendances, activePlayers, codes }
}

export default async function AttendancePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [data, userSession] = await Promise.all([
    getAttendanceData(id),
    auth(),
  ])

  if (!data.session) notFound()

  const role = userSession?.user?.role ?? 'COACH'
  const userId = userSession?.user?.id ?? ''

  // Build existing attendance map
  const attendanceMap: Record<string, { code: string; note: string | null }> = {}
  for (const a of data.attendances) {
    attendanceMap[a.playerId] = { code: a.code, note: a.note }
  }

  return (
    <AttendanceGrid
      session={data.session}
      players={data.activePlayers}
      attendanceMap={attendanceMap}
      codes={data.codes}
      role={role}
      userId={userId}
    />
  )
}
