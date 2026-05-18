'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Venue { id: string; name: string; notes: string | null; archived: boolean }

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', notes: '' })

  async function load() {
    const res = await fetch('/api/venues')
    setVenues(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/venues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Failed'); return }
      setShowForm(false)
      setForm({ name: '', notes: '' })
      await load()
    } finally { setSaving(false) }
  }

  async function toggleArchive(venue: Venue) {
    await fetch(`/api/venues/${venue.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived: !venue.archived }),
    })
    await load()
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/settings" className="text-gray-400 hover:text-gray-600 text-sm">← Settings</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">Venues</h1>
        <div className="flex-1" />
        <button onClick={() => setShowForm(!showForm)} className="bg-[#006837] hover:bg-[#005429] text-white text-sm font-semibold px-4 py-2 rounded-lg">
          + Add Venue
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-5 mb-5 space-y-3">
          <h2 className="font-semibold text-gray-900">New Venue</h2>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
            <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006837]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006837]" />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-[#006837] hover:bg-[#005429] text-white text-sm font-semibold py-2.5 rounded-lg disabled:opacity-50">
              {saving ? 'Adding…' : 'Add Venue'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? <div className="py-12 text-center text-gray-400">Loading…</div> : venues.length === 0 ? (
          <div className="py-12 text-center text-gray-400">No venues yet</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {venues.map((v) => (
              <div key={v.id} className={`flex items-center justify-between px-5 py-4 ${v.archived ? 'opacity-50' : ''}`}>
                <div>
                  <div className="font-medium text-gray-900">{v.name}</div>
                  {v.notes && <div className="text-xs text-gray-500">{v.notes}</div>}
                </div>
                <button
                  onClick={() => toggleArchive(v)}
                  className="text-xs text-gray-500 border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50"
                >
                  {v.archived ? 'Restore' : 'Archive'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
