'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface SessionType { id: string; name: string }

export default function SessionTypesPage() {
  const [types, setTypes] = useState<SessionType[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    const res = await fetch('/api/settings/session-types')
    setTypes(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/settings/session-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Failed'); return }
      setShowForm(false)
      setName('')
      await load()
    } finally { setSaving(false) }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/settings" className="text-gray-400 hover:text-gray-600 text-sm">← Settings</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">Session Types</h1>
        <div className="flex-1" />
        <button onClick={() => setShowForm(!showForm)} className="bg-[#006837] hover:bg-[#005429] text-white text-sm font-semibold px-4 py-2 rounded-lg">
          + Add Type
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-5 mb-5 space-y-3">
          <h2 className="font-semibold text-gray-900">New Session Type</h2>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Strength & Conditioning"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006837]"
          />
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-[#006837] hover:bg-[#005429] text-white text-sm font-semibold py-2.5 rounded-lg disabled:opacity-50">
              {saving ? 'Adding…' : 'Add Type'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? <div className="py-12 text-center text-gray-400">Loading…</div> : types.length === 0 ? (
          <div className="py-12 text-center text-gray-400">No session types yet</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {types.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-5 py-4">
                <div className="font-medium text-gray-900">{t.name}</div>
                <div className="text-sm text-gray-400">
                  {t.name.includes('Match') ? '⚽' : '🏃'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
