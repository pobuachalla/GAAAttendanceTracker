'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const POSITIONS = [
  'GK', 'FB', 'RCB', 'LCB', 'RHB', 'CHB', 'LHB',
  'MF1', 'MF2', 'RHF', 'CHF', 'LHF', 'RCF', 'FF', 'LCF',
]

interface Player {
  id: string
  firstName: string
  lastName: string
  displayName: string | null
  dob: Date | null
  joinedAt: Date
  codePreference: string
  positions: string
  archivedAt: Date | null
  parentName: string | null
  parentPhone: string | null
  parentEmail: string | null
}

export default function PlayerEditModal({ player }: { player: Player }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const initialPositions = (() => {
    try { return JSON.parse(player.positions) as string[] } catch { return [] }
  })()

  const [form, setForm] = useState({
    firstName: player.firstName,
    lastName: player.lastName,
    displayName: player.displayName ?? '',
    dob: player.dob ? new Date(player.dob).toISOString().split('T')[0] : '',
    joinedAt: new Date(player.joinedAt).toISOString().split('T')[0],
    codePreference: player.codePreference,
    positions: initialPositions,
    parentName: player.parentName ?? '',
    parentPhone: player.parentPhone ?? '',
    parentEmail: player.parentEmail ?? '',
  })

  function togglePosition(pos: string) {
    setForm((f) => ({
      ...f,
      positions: f.positions.includes(pos)
        ? f.positions.filter((p) => p !== pos)
        : [...f.positions, pos],
    }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/players/${player.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          dob: form.dob || null,
          displayName: form.displayName || null,
          parentName: form.parentName || null,
          parentPhone: form.parentPhone || null,
          parentEmail: form.parentEmail || null,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Failed to save')
        return
      }
      setOpen(false)
      router.refresh()
    } catch {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  async function handleArchive() {
    if (!confirm(player.archivedAt ? 'Restore this player?' : 'Archive this player?')) return
    setLoading(true)
    try {
      await fetch(`/api/players/${player.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: !player.archivedAt }),
      })
      setOpen(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-2 rounded-lg transition-colors"
      >
        Edit
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Edit Player</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none min-h-0 min-w-0 p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006837]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={form.lastName}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006837]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={form.displayName}
                  onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006837]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={form.dob}
                    onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006837]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Joined At</label>
                  <input
                    type="date"
                    value={form.joinedAt}
                    onChange={(e) => setForm((f) => ({ ...f, joinedAt: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006837]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Code Preference</label>
                <select
                  value={form.codePreference}
                  onChange={(e) => setForm((f) => ({ ...f, codePreference: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006837]"
                >
                  <option value="dual">Dual</option>
                  <option value="football">Football</option>
                  <option value="hurling">Hurling</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Positions</label>
                <div className="flex flex-wrap gap-1.5">
                  {POSITIONS.map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => togglePosition(pos)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        form.positions.includes(pos)
                          ? 'bg-[#006837] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleArchive}
                  disabled={loading}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {player.archivedAt ? 'Restore' : 'Archive'}
                </button>
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2.5 bg-[#006837] hover:bg-[#005429] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
