'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

interface Season {
  id: string
  name: string
  startDate: string
  endDate: string
  ageCategory: string
  active: boolean
  _count: { sessions: number }
}

export default function SeasonsPage() {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    ageCategory: 'U16',
    active: false,
  })

  async function load() {
    const res = await fetch('/api/seasons')
    const data = await res.json()
    setSeasons(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/seasons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Failed to create')
        return
      }
      setShowForm(false)
      setForm({ name: '', startDate: '', endDate: '', ageCategory: 'U16', active: false })
      await load()
    } finally {
      setSaving(false)
    }
  }

  async function setActive(seasonId: string) {
    await fetch(`/api/seasons/${seasonId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: true }),
    })
    await load()
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/settings" className="text-gray-400 hover:text-gray-600 text-sm">← Settings</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">Seasons</h1>
        <div className="flex-1" />
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#006837] hover:bg-[#005429] text-white text-sm font-semibold px-4 py-2 rounded-lg"
        >
          + New Season
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-5 mb-5 space-y-4">
          <h2 className="font-semibold text-gray-900">New Season</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. U16 2026"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006837]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006837]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End Date *</label>
              <input
                type="date"
                required
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006837]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Age Category *</label>
              <input
                required
                value={form.ageCategory}
                onChange={(e) => setForm((f) => ({ ...f, ageCategory: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006837]"
              />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="active"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="active" className="text-sm text-gray-700">Set as active</label>
            </div>
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-[#006837] hover:bg-[#005429] text-white text-sm font-semibold py-2.5 rounded-lg disabled:opacity-50">
              {saving ? 'Creating…' : 'Create Season'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-gray-400">Loading…</div>
        ) : seasons.length === 0 ? (
          <div className="py-12 text-center text-gray-400">No seasons yet</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {seasons.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <div className="font-medium text-gray-900 flex items-center gap-2">
                    {s.name}
                    {s.active && (
                      <span className="text-xs bg-[#006837] text-white px-2 py-0.5 rounded-full">Active</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(s.startDate)} – {formatDate(s.endDate)} · {s.ageCategory} · {s._count.sessions} sessions
                  </div>
                </div>
                {!s.active && (
                  <button
                    onClick={() => setActive(s.id)}
                    className="text-xs text-[#006837] border border-[#006837] px-3 py-1.5 rounded-lg hover:bg-[#006837] hover:text-white transition-colors"
                  >
                    Set Active
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
