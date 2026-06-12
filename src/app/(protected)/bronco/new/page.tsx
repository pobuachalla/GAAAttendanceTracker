'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewBroncoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    conditions: '',
    notes: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/bronco', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to create session')
        return
      }
      const bs = await res.json()
      router.push(`/bronco/${bs.id}`)
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/bronco" className="text-gray-400 hover:text-gray-600 text-sm">← Bronco Tests</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">New Test Session</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4 text-sm text-gray-600">
        <div className="font-semibold text-gray-900 mb-1">Bronco Test — 1200m Shuttle</div>
        <div className="text-xs text-gray-500">0→20→0, 0→40→0, 0→60→0 × 5 repetitions</div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Conditions</label>
            <input
              type="text"
              value={form.conditions}
              onChange={(e) => setForm((f) => ({ ...f, conditions: e.target.value }))}
              placeholder="e.g. Dry, light wind, artificial pitch"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006837]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              placeholder="Pre-test context, group details, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006837] resize-none"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
        )}

        <div className="flex gap-3">
          <Link href="/bronco" className="flex-1 text-center py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[#006837] hover:bg-[#005429] text-white text-sm font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating…' : 'Create & Start Recording'}
          </button>
        </div>
      </form>
    </div>
  )
}
