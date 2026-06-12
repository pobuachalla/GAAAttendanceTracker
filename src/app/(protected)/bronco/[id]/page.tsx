'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { use } from 'react'
import { calcMAS, calcZones, formatTime, parseTimeInput } from '@/lib/bronco-calc'

interface Player {
  id: string
  firstName: string
  lastName: string
  displayName: string | null
  archivedAt: string | null
}

interface BroncoResult {
  id: string
  playerId: string
  timeSeconds: number
  mas: number
  player: Player
}

interface BroncoSession {
  id: string
  date: string
  conditions: string | null
  notes: string | null
  results: BroncoResult[]
}

function playerName(p: Player) {
  return p.displayName || `${p.firstName} ${p.lastName}`
}

export default function BroncoSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [session, setSession] = useState<BroncoSession | null>(null)
  const [allPlayers, setAllPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  // Timer state
  const [timerRunning, setTimerRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Recording state
  const [recordingPlayerId, setRecordingPlayerId] = useState<string | null>(null)
  const [manualInput, setManualInput] = useState('')
  const [manualError, setManualError] = useState('')
  const [saving, setSaving] = useState(false)

  // Expanded zones view
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null)

  const loadSession = useCallback(async () => {
    const s = await fetch(`/api/bronco/${id}`).then((r) => r.json())
    setSession(s)
  }, [id])

  useEffect(() => {
    async function load() {
      const [players] = await Promise.all([
        fetch('/api/players').then((r) => r.json()),
        loadSession(),
      ])
      setAllPlayers(players.filter((p: Player) => !p.archivedAt))
      setLoading(false)
    }
    load()
  }, [loadSession])

  // Timer
  useEffect(() => {
    if (timerRunning) {
      const started = Date.now() - elapsed * 10
      setStartedAt(started)
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - started) / 10))
      }, 50)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [timerRunning])

  function startTimer() {
    setElapsed(0)
    setTimerRunning(true)
  }

  function stopTimer() {
    setTimerRunning(false)
  }

  function resetTimer() {
    setTimerRunning(false)
    setElapsed(0)
    setStartedAt(null)
  }

  const elapsedSeconds = elapsed / 100

  async function recordTime(playerId: string, timeSeconds: number) {
    setSaving(true)
    await fetch(`/api/bronco/${id}/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, timeSeconds }),
    })
    await loadSession()
    setSaving(false)
    setRecordingPlayerId(null)
    setManualInput('')
    setManualError('')
  }

  async function deleteResult(playerId: string) {
    if (!confirm('Remove this result?')) return
    await fetch(`/api/bronco/${id}/results`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId }),
    })
    await loadSession()
  }

  function handleManualSubmit(playerId: string) {
    const t = parseTimeInput(manualInput)
    if (!t || t <= 0) {
      setManualError('Enter time as m:ss.s or seconds (e.g. 4:52.3 or 292.3)')
      return
    }
    recordTime(playerId, t)
  }

  if (loading || !session) {
    return <div className="text-center py-12 text-gray-400">Loading…</div>
  }

  const resultMap: Record<string, BroncoResult> = {}
  session.results.forEach((r) => { resultMap[r.playerId] = r })

  // Order: recorded (fastest first), then unrecorded (sorted by previous MAS desc, then name)
  const recorded = session.results.slice().sort((a, b) => a.timeSeconds - b.timeSeconds)
  const recordedIds = new Set(recorded.map((r) => r.playerId))
  const unrecorded = allPlayers
    .filter((p) => !recordedIds.has(p.id))
    .sort((a, b) => playerName(a).localeCompare(playerName(b)))

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/bronco" className="text-gray-400 hover:text-gray-600 text-sm">← Bronco Tests</Link>
          <h1 className="text-xl font-bold text-gray-900 mt-1">
            {new Date(session.date).toLocaleDateString('en-IE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </h1>
          {session.conditions && <p className="text-sm text-gray-500">{session.conditions}</p>}
          {session.notes && <p className="text-xs text-gray-400 mt-1">{session.notes}</p>}
        </div>
        <div className="text-right shrink-0">
          <div className="text-2xl font-bold text-[#006837]">{session.results.length}</div>
          <div className="text-xs text-gray-400">recorded</div>
        </div>
      </div>

      {/* Timer */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Stopwatch</h2>
        <div className="text-center">
          <div className="text-5xl font-mono font-bold text-gray-900 mb-4 tabular-nums">
            {Math.floor(elapsedSeconds / 60).toString().padStart(2, '0')}:
            {(elapsedSeconds % 60).toFixed(1).padStart(4, '0')}
          </div>
          <div className="flex justify-center gap-3">
            {!timerRunning ? (
              <button
                onClick={startTimer}
                className="bg-[#006837] hover:bg-[#005429] text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
              >
                {elapsed === 0 ? 'Start' : 'Resume'}
              </button>
            ) : (
              <button
                onClick={stopTimer}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
              >
                Stop
              </button>
            )}
            <button
              onClick={resetTimer}
              className="border border-gray-300 text-gray-600 hover:bg-gray-50 font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
            >
              Reset
            </button>
          </div>
          {elapsedSeconds > 0 && !timerRunning && (
            <p className="text-xs text-gray-400 mt-2">
              Stopped at {formatTime(elapsedSeconds)} → MAS {calcMAS(elapsedSeconds)} km/h — tap a player below to record
            </p>
          )}
        </div>
      </div>

      {/* Players — recorded */}
      {recorded.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="font-semibold text-gray-800 text-sm">Recorded ({recorded.length})</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {recorded.map((r, idx) => {
              const zones = calcZones(r.mas)
              const expanded = expandedPlayerId === r.playerId
              return (
                <div key={r.playerId}>
                  <div
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpandedPlayerId(expanded ? null : r.playerId)}
                  >
                    <span className="w-6 text-xs text-gray-400 text-center font-mono">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm">{playerName(r.player)}</div>
                      <div className="text-xs text-gray-500 font-mono">{formatTime(r.timeSeconds)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#006837]">{r.mas} <span className="text-xs font-normal text-gray-400">km/h</span></div>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setRecordingPlayerId(r.playerId); setManualInput(r.timeSeconds.toString()) }}
                        className="text-xs text-gray-400 hover:text-[#006837] px-1.5 py-0.5 rounded hover:bg-gray-100"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteResult(r.playerId) }}
                        className="text-xs text-gray-400 hover:text-red-600 px-1.5 py-0.5 rounded hover:bg-red-50"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Edit inline */}
                  {recordingPlayerId === r.playerId && (
                    <div className="px-4 pb-3 bg-blue-50">
                      <div className="flex gap-2 items-center">
                        <input
                          autoFocus
                          value={manualInput}
                          onChange={(e) => { setManualInput(e.target.value); setManualError('') }}
                          placeholder="m:ss.s"
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#006837]"
                          onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit(r.playerId)}
                        />
                        <button
                          onClick={() => handleManualSubmit(r.playerId)}
                          disabled={saving}
                          className="bg-[#006837] text-white text-sm px-3 py-1.5 rounded font-medium disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button onClick={() => setRecordingPlayerId(null)} className="text-gray-400 text-sm px-2">✕</button>
                      </div>
                      {manualError && <p className="text-red-500 text-xs mt-1">{manualError}</p>}
                    </div>
                  )}

                  {/* Zones panel */}
                  {expanded && !recordingPlayerId && (
                    <div className="px-4 pb-3 bg-gray-50 grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-blue-50 rounded-lg p-2">
                        <div className="font-semibold text-blue-700">{zones.recovery}</div>
                        <div className="text-blue-500">km/h</div>
                        <div className="text-gray-500 mt-0.5">Recovery (65%)</div>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-2">
                        <div className="font-semibold text-yellow-700">{zones.aerobicThreshold}</div>
                        <div className="text-yellow-500">km/h</div>
                        <div className="text-gray-500 mt-0.5">Aerobic Threshold (80%)</div>
                      </div>
                      <div className="bg-red-50 rounded-lg p-2">
                        <div className="font-semibold text-red-700">{zones.hise}</div>
                        <div className="text-red-500">km/h</div>
                        <div className="text-gray-500 mt-0.5">HISE (90%)</div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Players — unrecorded */}
      {unrecorded.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="font-semibold text-gray-800 text-sm">Not Yet Recorded ({unrecorded.length})</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {unrecorded.map((p) => (
              <div key={p.id}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-700 text-sm">{playerName(p)}</div>
                  </div>

                  {/* Record from timer */}
                  {elapsedSeconds > 0 && !timerRunning && recordingPlayerId !== p.id && (
                    <button
                      onClick={() => recordTime(p.id, elapsedSeconds)}
                      disabled={saving}
                      className="text-xs bg-[#006837] text-white px-3 py-1.5 rounded font-medium hover:bg-[#005429] disabled:opacity-50 whitespace-nowrap"
                    >
                      Record {formatTime(elapsedSeconds)}
                    </button>
                  )}

                  {/* Manual entry */}
                  {recordingPlayerId !== p.id && (
                    <button
                      onClick={() => { setRecordingPlayerId(p.id); setManualInput(''); setManualError('') }}
                      className="text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded font-medium hover:bg-gray-50"
                    >
                      Manual
                    </button>
                  )}
                </div>

                {recordingPlayerId === p.id && (
                  <div className="px-4 pb-3 bg-blue-50">
                    <div className="flex gap-2 items-center">
                      <input
                        autoFocus
                        value={manualInput}
                        onChange={(e) => { setManualInput(e.target.value); setManualError('') }}
                        placeholder="m:ss.s or seconds e.g. 4:52.3"
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#006837]"
                        onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit(p.id)}
                      />
                      <button
                        onClick={() => handleManualSubmit(p.id)}
                        disabled={saving}
                        className="bg-[#006837] text-white text-sm px-3 py-1.5 rounded font-medium disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button onClick={() => setRecordingPlayerId(null)} className="text-gray-400 text-sm px-2">✕</button>
                    </div>
                    {manualError && <p className="text-red-500 text-xs mt-1">{manualError}</p>}
                    {manualInput && parseTimeInput(manualInput) && (
                      <p className="text-xs text-green-700 mt-1">
                        MAS: {calcMAS(parseTimeInput(manualInput)!)} km/h
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
