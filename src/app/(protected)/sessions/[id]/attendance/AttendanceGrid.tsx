'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDate, CODE_BG_CLASSES, CODE_LABELS, isWithin48Hours } from '@/lib/utils'

interface Player {
  id: string
  firstName: string
  lastName: string
  displayName: string | null
}

interface AttendanceCode {
  code: string
  label: string
  weight: number
  colour: string
  sortOrder: number
}

interface Session {
  id: string
  date: Date | string
  dayOfWeek: string
  startTime: string | null
  cancelled: boolean
  locked: boolean
  type: { name: string }
  venue: { name: string }
  season: { name: string }
}

interface AttendanceGridProps {
  session: Session
  players: Player[]
  attendanceMap: Record<string, { code: string; note: string | null }>
  codes: AttendanceCode[]
  role: string
  userId: string
}

const QUICK_CODES = ['P', 'C', 'L', 'I', 'E', 'U']

export default function AttendanceGrid({
  session,
  players,
  attendanceMap,
  codes,
  role,
}: AttendanceGridProps) {
  const router = useRouter()

  const [codes_state, setCodesState] = useState<Record<string, string>>(
    () => {
      const m: Record<string, string> = {}
      for (const p of players) {
        m[p.id] = attendanceMap[p.id]?.code ?? ''
      }
      return m
    }
  )

  const [notes, setNotes] = useState<Record<string, string>>(
    () => {
      const m: Record<string, string> = {}
      for (const p of players) {
        m[p.id] = attendanceMap[p.id]?.note ?? ''
      }
      return m
    }
  )

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [activeNote, setActiveNote] = useState<string | null>(null)
  const [undoStack, setUndoStack] = useState<Record<string, string>[]>([])
  const [bulkDone, setBulkDone] = useState(false)

  const canEdit = (() => {
    if (session.cancelled) return false
    if (session.locked && role === 'COACH') return false
    if (role === 'COACH' && !isWithin48Hours(session.date)) return false
    return true
  })()

  function setCode(playerId: string, code: string) {
    if (!canEdit) return
    setCodesState((prev) => ({ ...prev, [playerId]: prev[playerId] === code ? '' : code }))
    setSaved(false)
  }

  function handleBulkPresent() {
    if (!canEdit) return
    const snapshot = { ...codes_state }
    setUndoStack((s) => [...s, snapshot])
    setCodesState((prev) => {
      const next = { ...prev }
      for (const p of players) {
        if (!next[p.id]) next[p.id] = 'P'
      }
      return next
    })
    setBulkDone(true)
    setSaved(false)
  }

  function handleUndo() {
    if (undoStack.length === 0) return
    const prev = undoStack[undoStack.length - 1]
    setUndoStack((s) => s.slice(0, -1))
    setCodesState(prev)
    setBulkDone(false)
    setSaved(false)
  }

  const handleSave = useCallback(async () => {
    setSaving(true)
    setError('')
    try {
      const records = players
        .filter((p) => codes_state[p.id])
        .map((p) => ({
          playerId: p.id,
          code: codes_state[p.id],
          note: notes[p.id] || null,
        }))

      const res = await fetch(`/api/sessions/${session.id}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to save')
        return
      }

      setSaved(true)
      setBulkDone(false)
      setUndoStack([])
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }, [players, codes_state, notes, session.id, router])

  const recordedCount = players.filter((p) => codes_state[p.id]).length
  const notRecordedCount = players.length - recordedCount

  return (
    <div className="max-w-2xl mx-auto pb-32">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link href={`/sessions/${session.id}`} className="text-gray-400 hover:text-gray-600 text-sm">
          ← Session
        </Link>
      </div>

      <div className="bg-[#006837] text-white rounded-xl p-4 mb-4">
        <div className="text-white/70 text-xs">{session.season.name}</div>
        <div className="font-bold text-lg">{session.type.name}</div>
        <div className="text-white/70 text-sm">
          {formatDate(session.date)} · {session.dayOfWeek}
          {session.startTime && ` · ${session.startTime}`}
          · {session.venue.name}
        </div>
        <div className="flex gap-2 mt-2">
          {session.cancelled && (
            <span className="text-xs bg-red-500/30 text-red-100 px-2 py-0.5 rounded-full">Cancelled</span>
          )}
          {session.locked && (
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">🔒 Locked</span>
          )}
          {!canEdit && !session.cancelled && !session.locked && (
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">48h window expired</span>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-900">
            {recordedCount} / {players.length} recorded
          </span>
          <span className="text-sm text-gray-500">{notRecordedCount} remaining</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-[#006837] h-2 rounded-full transition-all"
            style={{ width: `${players.length > 0 ? (recordedCount / players.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Bulk actions */}
      {canEdit && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleBulkPresent}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
          >
            Mark remaining as P
          </button>
          {undoStack.length > 0 && (
            <button
              onClick={handleUndo}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Undo
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Player list */}
      <div className="space-y-2">
        {players.map((player) => {
          const currentCode = codes_state[player.id] ?? ''
          const hasNote = !!notes[player.id]
          const noteOpen = activeNote === player.id

          return (
            <div
              key={player.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <div className="flex items-center gap-3 p-3">
                {/* Avatar */}
                <div className="w-9 h-9 bg-[#006837]/10 rounded-full flex items-center justify-center text-[#006837] font-bold text-xs flex-shrink-0">
                  {player.firstName[0]}{player.lastName[0]}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {player.displayName || `${player.firstName} ${player.lastName}`}
                  </div>
                  {hasNote && (
                    <div className="text-xs text-gray-400 italic truncate">{notes[player.id]}</div>
                  )}
                </div>

                {/* Note button */}
                <button
                  onClick={() => setActiveNote(noteOpen ? null : player.id)}
                  className={`text-sm px-2 py-1.5 rounded-lg transition-colors min-h-0 min-w-0 ${
                    hasNote ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:bg-gray-100'
                  }`}
                  title="Add note"
                >
                  📝
                </button>

                {/* Code buttons */}
                <div className="flex gap-1">
                  {QUICK_CODES.map((code) => (
                    <button
                      key={code}
                      onClick={() => setCode(player.id, code)}
                      disabled={!canEdit}
                      className={`w-9 h-9 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                        currentCode === code
                          ? CODE_BG_CLASSES[code] + ' scale-110 shadow-sm'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-40'
                      }`}
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note input (expandable) */}
              {noteOpen && (
                <div className="px-3 pb-3 border-t border-gray-100 pt-2">
                  <input
                    type="text"
                    placeholder="Add note (optional)…"
                    value={notes[player.id] ?? ''}
                    onChange={(e) => {
                      setNotes((n) => ({ ...n, [player.id]: e.target.value }))
                      setSaved(false)
                    }}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006837]"
                    autoFocus
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Fixed Save Bar */}
      {canEdit && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3 lg:left-64">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <div className="flex-1 text-sm text-gray-600">
              {saved ? (
                <span className="text-green-600 font-medium">✓ Saved</span>
              ) : (
                <span>{recordedCount} recorded</span>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={saving || recordedCount === 0}
              className="bg-[#006837] hover:bg-[#005429] text-white font-bold px-6 py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Attendance'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
