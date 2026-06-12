'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatTime } from '@/lib/bronco-calc'

interface BroncoSession {
  id: string
  date: string
  conditions: string | null
  notes: string | null
  _count: { results: number }
}

interface PlayerHistory {
  playerId: string
  playerName: string
  results: { date: string; mas: number; timeSeconds: number }[]
}

export default function BroncoPage() {
  const [sessions, setSessions] = useState<BroncoSession[]>([])
  const [teamHistory, setTeamHistory] = useState<PlayerHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const s = await fetch('/api/bronco').then((r) => r.json())
      setSessions(s)

      // Load full results for team progress view
      if (s.length > 0) {
        const details = await Promise.all(s.map((session: BroncoSession) => fetch(`/api/bronco/${session.id}`).then((r) => r.json())))
        const byPlayer: Record<string, PlayerHistory> = {}
        for (const d of details) {
          for (const result of d.results) {
            if (!byPlayer[result.playerId]) {
              byPlayer[result.playerId] = {
                playerId: result.playerId,
                playerName: result.player.displayName || `${result.player.firstName} ${result.player.lastName}`,
                results: [],
              }
            }
            byPlayer[result.playerId].results.push({ date: d.date, mas: result.mas, timeSeconds: result.timeSeconds })
          }
        }
        setTeamHistory(Object.values(byPlayer).sort((a, b) => {
          const lastA = a.results[a.results.length - 1]?.mas ?? 0
          const lastB = b.results[b.results.length - 1]?.mas ?? 0
          return lastB - lastA
        }))
      }

      setLoading(false)
    }
    load()
  }, [])

  const sessionDates = sessions.map((s) => new Date(s.date).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: '2-digit' }))

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading…</div>
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Bronco Tests</h1>
        <Link
          href="/bronco/new"
          className="bg-[#006837] hover:bg-[#005429] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          + New Test Session
        </Link>
      </div>

      {/* Sessions list */}
      {sessions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-3">⏱️</div>
          <p className="text-gray-500 text-sm">No bronco sessions yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((s) => (
            <Link
              key={s.id}
              href={`/bronco/${s.id}`}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:border-[#006837] hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-gray-900">
                    {new Date(s.date).toLocaleDateString('en-IE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  {s.conditions && <div className="text-xs text-gray-500 mt-0.5">{s.conditions}</div>}
                  {s.notes && <div className="text-xs text-gray-400 mt-1 line-clamp-2">{s.notes}</div>}
                </div>
                <span className="shrink-0 bg-[#006837]/10 text-[#006837] text-xs font-semibold px-2 py-1 rounded-full">
                  {s._count.results} players
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Team progress table */}
      {teamHistory.length > 0 && sessions.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Team MAS Progress (km/h)</h2>
            <p className="text-xs text-gray-400 mt-0.5">Maximum Aerobic Speed across all sessions — sorted by latest</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-2 font-medium text-gray-600 whitespace-nowrap">Player</th>
                  {sessionDates.map((d, i) => (
                    <th key={i} className="text-center px-3 py-2 font-medium text-gray-600 whitespace-nowrap">{d}</th>
                  ))}
                  <th className="text-center px-3 py-2 font-medium text-gray-600">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {teamHistory.map((ph) => {
                  const masMap: Record<string, number> = {}
                  const timeMap: Record<string, number> = {}
                  ph.results.forEach((r) => {
                    const dateKey = new Date(r.date).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: '2-digit' })
                    masMap[dateKey] = r.mas
                    timeMap[dateKey] = r.timeSeconds
                  })
                  const latest = ph.results[ph.results.length - 1]?.mas
                  const prev = ph.results[ph.results.length - 2]?.mas
                  const delta = latest && prev ? latest - prev : null
                  return (
                    <tr key={ph.playerId} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap">
                        <Link href={`/bronco/player/${ph.playerId}`} className="hover:text-[#006837]">
                          {ph.playerName}
                        </Link>
                      </td>
                      {sessionDates.map((d, i) => {
                        const mas = masMap[d]
                        const t = timeMap[d]
                        return (
                          <td key={i} className="text-center px-3 py-2 whitespace-nowrap">
                            {mas ? (
                              <span title={`${formatTime(t)} → ${mas} km/h`} className="font-semibold text-[#006837]">{mas}</span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        )
                      })}
                      <td className="text-center px-3 py-2 whitespace-nowrap">
                        {delta !== null ? (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${delta > 0 ? 'bg-green-100 text-green-700' : delta < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                            {delta > 0 ? '+' : ''}{delta.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
