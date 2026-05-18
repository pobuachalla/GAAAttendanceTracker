'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Code {
  code: string
  label: string
  weight: number
  colour: string
  sortOrder: number
  protected: boolean
}

export default function CodesPage() {
  const [codes, setCodes] = useState<Code[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [editWeight, setEditWeight] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    const res = await fetch('/api/settings/codes')
    setCodes(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSave(code: string) {
    setSaving(true)
    try {
      await fetch(`/api/settings/codes/${code}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight: parseFloat(editWeight) }),
      })
      setEditing(null)
      await load()
    } finally { setSaving(false) }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/settings" className="text-gray-400 hover:text-gray-600 text-sm">← Settings</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">Attendance Codes</h1>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Adjust the weight of each attendance code. The weighted % formula is:
        (Σ code×weight) / N.
      </p>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-gray-400">Loading…</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {codes.map((c) => (
              <div key={c.code} className="flex items-center gap-4 px-5 py-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ backgroundColor: c.colour }}
                >
                  {c.code}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{c.label}</div>
                  <div className="text-xs text-gray-500">
                    {c.protected && <span className="mr-2">🔒 Protected</span>}
                    Sort: {c.sortOrder}
                  </div>
                </div>
                {editing === c.code ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={editWeight}
                      onChange={(e) => setEditWeight(e.target.value)}
                      className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006837]"
                    />
                    <button
                      onClick={() => handleSave(c.code)}
                      disabled={saving}
                      className="text-sm bg-[#006837] text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button onClick={() => setEditing(null)} className="text-sm text-gray-500 px-2 py-1.5">
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-900">{c.weight.toFixed(2)}</span>
                    <button
                      onClick={() => { setEditing(c.code); setEditWeight(String(c.weight)) }}
                      className="text-xs text-[#006837] border border-[#006837] px-3 py-1.5 rounded-lg hover:bg-[#006837] hover:text-white transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
