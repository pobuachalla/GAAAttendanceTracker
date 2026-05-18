import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDate, CODE_BG_CLASSES } from '@/lib/utils'
import { auth } from '@/lib/auth'
import SessionActions from './SessionActions'

async function getSession(id: string) {
  return prisma.session.findUnique({
    where: { id },
    include: {
      type: true,
      venue: true,
      season: true,
      attendances: {
        include: {
          player: true,
          attendanceCode: true,
        },
        orderBy: { player: { lastName: 'asc' } },
      },
    },
  })
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [session, userSession] = await Promise.all([
    getSession(id),
    auth(),
  ])

  if (!session) notFound()

  const role = userSession?.user?.role ?? 'COACH'
  const isMatch = session.type.name.includes('Match')

  // Count codes
  const codeCounts: Record<string, number> = {}
  for (const a of session.attendances) {
    codeCounts[a.code] = (codeCounts[a.code] ?? 0) + 1
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/sessions" className="text-gray-400 hover:text-gray-600 text-sm">
          ← Sessions
        </Link>
      </div>

      {/* Session Header */}
      <div className="bg-[#006837] text-white rounded-xl p-6 mb-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-white/70 text-sm mb-1">{session.season.name}</div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              {session.type.name}
              {session.opposition && <span className="text-white/80 font-normal">vs {session.opposition}</span>}
            </h1>
            <div className="text-white/70 text-sm mt-1">
              {formatDate(session.date)} · {session.dayOfWeek} · {session.startTime && `${session.startTime} · `}{session.venue.name}
            </div>
            <div className="flex gap-2 mt-3">
              {session.cancelled && (
                <span className="text-xs bg-red-500/30 text-red-100 px-2.5 py-1 rounded-full">
                  ✕ Cancelled
                </span>
              )}
              {session.locked && (
                <span className="text-xs bg-white/20 text-white/80 px-2.5 py-1 rounded-full">
                  🔒 Locked
                </span>
              )}
              {isMatch && session.homeAway && (
                <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full capitalize">
                  {session.homeAway}
                </span>
              )}
              {isMatch && session.competition && (
                <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full">
                  {session.competition}
                </span>
              )}
            </div>
            {isMatch && (session.ourScore || session.theirScore) && (
              <div className="mt-3 text-lg font-bold">
                {session.ourScore} – {session.theirScore}
              </div>
            )}
          </div>
          <SessionActions session={session} role={role} />
        </div>
      </div>

      {/* Quick Stats */}
      {session.attendances.length > 0 && (
        <div className="flex gap-2 mb-5 flex-wrap">
          {Object.entries(codeCounts).map(([code, count]) => (
            <div
              key={code}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                CODE_BG_CLASSES[code] ?? 'bg-gray-200 text-gray-700'
              }`}
            >
              <span className="font-bold">{code}</span>
              <span>{count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Attendance CTA */}
      {!session.cancelled && (
        <Link
          href={`/sessions/${id}/attendance`}
          className="block w-full bg-[#FFCD00] hover:bg-yellow-400 text-[#006837] font-bold text-center py-4 rounded-xl mb-5 transition-colors shadow-sm"
        >
          📋 {session.attendances.length === 0 ? 'Take Attendance' : 'Edit Attendance'}
          <span className="text-sm font-normal ml-2 opacity-70">
            ({session.attendances.length} recorded)
          </span>
        </Link>
      )}

      {/* Attendance List */}
      {session.attendances.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">
              Attendance ({session.attendances.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {session.attendances.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {a.player.displayName || `${a.player.firstName} ${a.player.lastName}`}
                  </div>
                  {a.note && (
                    <div className="text-xs text-gray-400 italic">{a.note}</div>
                  )}
                </div>
                <span
                  className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${
                    CODE_BG_CLASSES[a.code] ?? 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {a.code}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {session.notes && (
        <div className="mt-5 bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-2">Notes</h2>
          <p className="text-gray-600 text-sm">{session.notes}</p>
        </div>
      )}
    </div>
  )
}
