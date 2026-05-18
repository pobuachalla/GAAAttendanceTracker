'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const POSITIONS = [
  'GK', 'FB', 'RCB', 'LCB', 'RHB', 'CHB', 'LHB',
  'MF1', 'MF2', 'RHF', 'CHF', 'LHF', 'RCF', 'FF', 'LCF',
]

export default function NewPlayerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    displayName: '',
    dob: '',
    joinedAt: new Date().toISOString().split('T')[0],
    codePreference: 'dual',
    positions: [] as string[],
    parentName: '',
    parentPhone: '',
    parentEmail: '',
  })

  function togglePosition(pos: string) {
    setForm((f) => ({
      ...f,
      positions: f.positions.includes(pos)
        ? f.positions.filter((p) => p !== pos)
        : [...f.positions, pos],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/players', {
        method: 'POST',
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
        const data = await res.json()
        setError(data.error ?? 'Failed to create player')
        return
      }

      const player = await res.json()
      router.push(`/players/${player.id}`)
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/players" className="text-gray-400 hover:text-gray-600">
          ← Players
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">Add Player</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Basic Information</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006837]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Name (optional)
            </label>
            <input
              type="text"
              value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              placeholder="e.g. Tadhg Ó B."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006837]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={form.dob}
                onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006837]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Joined At
              </label>
              <input
                type="date"
                value={form.joinedAt}
                onChange={(e) => setForm((f) => ({ ...f, joinedAt: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006837]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code Preference
            </label>
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
        </div>

        {/* Positions */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Positions</h2>
          <div className="flex flex-wrap gap-2">
            {POSITIONS.map((pos) => (
              <button
                key={pos}
                type="button"
                onClick={() => togglePosition(pos)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
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

        {/* Parent/Guardian */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Parent / Guardian (optional)</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={form.parentName}
              onChange={(e) => setForm((f) => ({ ...f, parentName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006837]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={form.parentPhone}
                onChange={(e) => setForm((f) => ({ ...f, parentPhone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006837]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.parentEmail}
                onChange={(e) => setForm((f) => ({ ...f, parentEmail: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006837]"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Link
            href="/players"
            className="flex-1 text-center py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[#006837] hover:bg-[#005429] text-white text-sm font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Add Player'}
          </button>
        </div>
      </form>
    </div>
  )
}
