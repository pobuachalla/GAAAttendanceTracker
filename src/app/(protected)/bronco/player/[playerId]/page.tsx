'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { use } from 'react'
import { calcZones, formatTime } from '@/lib/bronco-calc'

interface PlayerResult {
  id: string
  timeSeconds: number
  mas: number
  session: { id: string; date: string; conditions: string | null }
  player: { id: string; firstName: string; lastName: string; displayName: string | null }
}

export default function PlayerBroncoPage({ params }: { params: Promise<{ playerId: string }> }) {
  const { playerId } = use(params)
  const [results, setResults] = useState<PlayerResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/bronco/players/${playerId}`)
      .then((r) => r.json())
      .then((data) => { setResults(data); setLoading(false) })
  }, [playerId])

  if (loading) return <div className="text-center py-12 text-gray-400">Loading…</div>
  if (results.length === 0) return (
    <div className="max-w-xl mx-auto text-center py-12">
      <Link href="/bronco" className="text-gray-400 hover:text-gray-600 text-sm">← Bronco Tests</Link>
      <p className="mt-6 text-gray-500">No bronco results for this player yet.</p>
    </div>
  )

  const player = results[0].player
  const name = player.displayName || `${player.firstName} ${player.lastName}`
  const latest = results[results.length - 1]
  const best = results.reduce((a, b) => a.mas > b.mas ? a : b)
  const latestZones = calcZones(latest.mas)
  const masValues = results.map((r) => r.mas)
  const minMas = Math.min(...masValues)
  const maxMas = Math.max(...masValues)
  const chartRange = maxMas - minMas || 1

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/bronco" className="text-gray-400 hover:text-gray-600 text-sm">← Bronco Tests</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">{name}</h1>
        <p className="text-sm text-gray-500">{results.length} test{results.length !== 1 ? 's' : ''} recorded</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-[#006837]">{latest.mas}</div>
          <div className="text-xs text-gray-400 mt-0.5">Latest MAS (km/h)</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-[#FFCD00]">{best.mas}</div>
          <div className="text-xs text-gray-400 mt-0.5">Best MAS (km/h)</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          {results.length >= 2 ? (() => {
            const delta = results[results.length - 1].mas - results[results.length - 2].mas
            return (
              <>
                <div className={`text-2xl font-bold ${delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                  {delta > 0 ? '+' : ''}{delta.toFixed(2)}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">Last change</div>
              </>
            )
          })() : (
            <>
              <div className="text-2xl font-bold text-gray-300">—</div>
              <div className="text-xs text-gray-400 mt-0.5">Last change</div>
            </>
          )}
        </div>
      </div>

      {/* Mini chart (SVG bar chart) */}
      {results.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4 text-sm">MAS Progress</h2>
          <div className="flex items-end gap-2 h-32">
            {results.map((r, i) => {
              const heightPct = ((r.mas - minMas) / chartRange) * 70 + 30
              const isLatest = i === results.length - 1
              return (
                <div key={r.id} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-xs text-gray-500 font-semibold">{r.mas}</div>
                  <div
                    className={`w-full rounded-t-sm transition-all ${isLatest ? 'bg-[#006837]' : 'bg-[#006837]/30'}`}
                    style={{ height: `${heightPct}%` }}
                    title={`${new Date(r.session.date).toLocaleDateString('en-IE')}: ${r.mas} km/h`}
                  />
                  <div className="text-[10px] text-gray-400 text-center">
                    {new Date(r.session.date).toLocaleDateString('en-IE', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Latest training zones */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-1 text-sm">Training Zones — Latest ({latest.mas} km/h MAS)</h2>
        <p className="text-xs text-gray-400 mb-4">Speeds for each intensity zone based on current MAS</p>
        <div className="space-y-3">
          <ZoneRow label="Recovery" pct="65%" speed={latestZones.recovery} color="blue" />
          <ZoneRow label="Aerobic Threshold" pct="80%" speed={latestZones.aerobicThreshold} color="yellow" />
          <ZoneRow label="High Intensity Speed Endurance" pct="90%" speed={latestZones.hise} color="red" />
        </div>
      </div>

      {/* History table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <h2 className="font-semibold text-gray-800 text-sm">All Results</h2>
        </div>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-2 font-medium text-gray-600">Date</th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Conditions</th>
              <th className="text-center px-4 py-2 font-medium text-gray-600">Time</th>
              <th className="text-center px-4 py-2 font-medium text-gray-600">MAS (km/h)</th>
              <th className="text-center px-4 py-2 font-medium text-gray-600">Recovery</th>
              <th className="text-center px-4 py-2 font-medium text-gray-600">AeT</th>
              <th className="text-center px-4 py-2 font-medium text-gray-600">HISE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {results.slice().reverse().map((r, i) => {
              const z = calcZones(r.mas)
              const prev = results[results.length - 1 - i - 1]
              const delta = prev ? r.mas - prev.mas : null
              const isBest = r.mas === best.mas
              return (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap">
                    <Link href={`/bronco/${r.session.id}`} className="hover:text-[#006837]">
                      {new Date(r.session.date).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </Link>
                    {isBest && <span className="ml-1 text-[10px] bg-[#FFCD00] text-[#006837] font-bold px-1 rounded">PB</span>}
                  </td>
                  <td className="px-4 py-2 text-gray-500 text-xs">{r.session.conditions || '—'}</td>
                  <td className="text-center px-4 py-2 font-mono">{formatTime(r.timeSeconds)}</td>
                  <td className="text-center px-4 py-2">
                    <span className="font-bold text-[#006837]">{r.mas}</span>
                    {delta !== null && (
                      <span className={`ml-1 text-[10px] ${delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                        ({delta > 0 ? '+' : ''}{delta.toFixed(2)})
                      </span>
                    )}
                  </td>
                  <td className="text-center px-4 py-2 text-blue-600">{z.recovery}</td>
                  <td className="text-center px-4 py-2 text-yellow-600">{z.aerobicThreshold}</td>
                  <td className="text-center px-4 py-2 text-red-600">{z.hise}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ZoneRow({ label, pct, speed, color }: { label: string; pct: string; speed: number; color: 'blue' | 'yellow' | 'red' }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    red: 'bg-red-100 text-red-700',
  }
  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs font-semibold px-2 py-0.5 rounded w-12 text-center ${colors[color]}`}>{pct}</span>
      <span className="text-sm text-gray-700 flex-1">{label}</span>
      <span className="font-bold text-gray-900">{speed} <span className="text-xs font-normal text-gray-400">km/h</span></span>
    </div>
  )
}
