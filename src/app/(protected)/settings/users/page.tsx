'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

interface User {
  id: string
  email: string
  name: string | null
  role: string
  active: boolean
  createdAt: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'COACH' })

  async function load() {
    const res = await fetch('/api/settings/users')
    if (res.ok) setUsers(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/settings/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Failed'); return }
      setShowForm(false)
      setForm({ email: '', password: '', name: '', role: 'COACH' })
      await load()
    } finally { setSaving(false) }
  }

  async function toggleActive(user: User) {
    await fetch(`/api/settings/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !user.active }),
    })
    await load()
  }

  const roleBadge = (role: string) => {
    const styles: Record<string, string> = {
      MANAGER: 'bg-[#006837] text-white',
      ADMIN: 'bg-purple-700 text-white',
      COACH: 'bg-blue-100 text-blue-800',
    }
    return styles[role] ?? 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/settings" className="text-gray-400 hover:text-gray-600 text-sm">← Settings</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">Users</h1>
        <div className="flex-1" />
        <button onClick={() => setShowForm(!showForm)} className="bg-[#006837] hover:bg-[#005429] text-white text-sm font-semibold px-4 py-2 rounded-lg">
          + Invite User
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-5 mb-5 space-y-3">
          <h2 className="font-semibold text-gray-900">Invite New User</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006837]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006837]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
              <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006837]">
                <option value="COACH">Coach</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Password *</label>
              <input type="password" required minLength={8} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006837]" />
            </div>
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-[#006837] hover:bg-[#005429] text-white text-sm font-semibold py-2.5 rounded-lg disabled:opacity-50">
              {saving ? 'Creating…' : 'Create User'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? <div className="py-12 text-center text-gray-400">Loading…</div> : users.length === 0 ? (
          <div className="py-12 text-center text-gray-400">No users</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {users.map((u) => (
              <div key={u.id} className={`flex items-center justify-between px-5 py-4 ${!u.active ? 'opacity-50' : ''}`}>
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 text-sm">{u.name ?? u.email}</div>
                  <div className="text-xs text-gray-500">{u.email} · Joined {formatDate(u.createdAt)}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadge(u.role)}`}>{u.role}</span>
                  <button
                    onClick={() => toggleActive(u)}
                    className="text-xs text-gray-500 border border-gray-300 px-2.5 py-1.5 rounded-lg hover:bg-gray-50"
                  >
                    {u.active ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
