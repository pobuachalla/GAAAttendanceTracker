'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Season { id: string; name: string; active: boolean }
interface SessionType { id: string; name: string }
interface Venue { id: string; name: string; archived: boolean }

export default function NewSessionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [seasons, setSeasons] = useState<Season[]>([])
  const [types, setTypes] = useState<SessionType[]>([])
  const [venues, setVenues] = useState<Venue[]>([])

  const [form, setForm] = useState({
    seasonId: '',
    typeId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    venueId: '',
    opposition: '',
    homeAway: 'home',
    competition: '',
    ourScore: '',
    theirScore: '',
    notes: '',
  })

  const [isMatch, setIsMatch] = useState(false)

  useEffect(() => {
    async function load() {
      const [s, t, v] = await Promise.all([
        fetch('/api/seasons').then((r) => r.json()),
        fetch('/api/settings/session-types').then((r) => r.json()),
        fetch('/api/venues').then((r) => r.json()),
      ])
      setSeasons(s)
      setTypes(t)
      setVenues(v.filter((v: Venue) => !v.archived))

      // Pre-select active season
      const active = s.find((s: Season) => s.active)
      if (active) setForm((f) => ({ ...f, seasonId: active.id }))
    }
    load()
  }, [])

  function handleTypeChange(typeId: string) {
    const type = types.find((t) => t.id === typeId)
    setIsMatch(type?.name.includes('Match') ?? false)
    setForm((f) => ({ ...f, typeId }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          opposition: isMatch ? form.opposition || null : null,
          homeAway: isMatch ? form.homeAway || null : null,
          competition: isMatch ? form.competition || null : null,
          ourScore: isMatch ? form.ourScore || null : null,
          theirScore: isMatch ? form.theirScore || null : null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to create session')
        return
      }

      const session = await res.json()
      router.push(`/sessions/${session.id}`)
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/sessions" className="text-gray-400 hover:text-gray-600 text-sm">
          ← Sessions
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">New Session</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Session Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Session Details</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Season *</label>
            <select
              required
              value={form.seasonId}
              onChange={(e) => setForm((f) => ({ ...f, seasonId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006837]"
            >
              <option value="">Select season…</option>
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}{s.active ? ' (active)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session Type *</label>
            <select
              required
              value={form.typeId}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006837]"
            >
              <option value="">Select type…</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006837]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006837]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Venue *</label>
            <select
              required
              value={form.venueId}
              onChange={(e) => setForm((f) => ({ ...f, venueId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006837]"
            >
              <option value="">Select venue…</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006837] resize-none"
            />
          </div>
        </div>

        {/* Match Details (conditional) */}
        {isMatch && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Match Details</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Opposition</label>
              <input
                type="text"
                value={form.opposition}
                onChange={(e) => setForm((f) => ({ ...f, opposition: e.target.value }))}
                placeholder="e.g. Castleknock GAA"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006837]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Home/Away</label>
                <select
                  value={form.homeAway}
                  onChange={(e) => setForm((f) => ({ ...f, homeAway: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006837]"
                >
                  <option value="home">Home</option>
                  <option value="away">Away</option>
                  <option value="neutral">Neutral</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Competition</label>
                <input
                  type="text"
                  value={form.competition}
                  onChange={(e) => setForm((f) => ({ ...f, competition: e.target.value }))}
                  placeholder="e.g. League"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006837]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Our Score</label>
                <input
                  type="text"
                  value={form.ourScore}
                  onChange={(e) => setForm((f) => ({ ...f, ourScore: e.target.value }))}
                  placeholder="e.g. 2-14"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006837]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Their Score</label>
                <input
                  type="text"
                  value={form.theirScore}
                  onChange={(e) => setForm((f) => ({ ...f, theirScore: e.target.value }))}
                  placeholder="e.g. 1-10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006837]"
                />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Link
            href="/sessions"
            className="flex-1 text-center py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[#006837] hover:bg-[#005429] text-white text-sm font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating…' : 'Create Session'}
          </button>
        </div>
      </form>
    </div>
  )
}
