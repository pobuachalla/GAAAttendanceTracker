'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Session {
  id: string
  cancelled: boolean
  cancelReason: string | null
  locked: boolean
}

export default function SessionActions({
  session,
  role,
}: {
  session: Session
  role: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const isManager = ['MANAGER', 'ADMIN'].includes(role)

  async function handleToggleLock() {
    setLoading(true)
    try {
      await fetch(`/api/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locked: !session.locked }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch(`/api/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cancelled: !session.cancelled,
          cancelReason: !session.cancelled ? cancelReason : null,
        }),
      })
      setShowCancel(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  if (!isManager) return null

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={handleToggleLock}
          disabled={loading}
          className="bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {session.locked ? '🔓 Unlock' : '🔒 Lock'}
        </button>
        <button
          onClick={() => setShowCancel(true)}
          disabled={loading}
          className="bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {session.cancelled ? 'Restore' : 'Cancel'}
        </button>
      </div>

      {showCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">
              {session.cancelled ? 'Restore Session?' : 'Cancel Session?'}
            </h3>
            <form onSubmit={handleCancel}>
              {!session.cancelled && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason (optional)
                  </label>
                  <input
                    type="text"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006837]"
                  />
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCancel(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? '…' : session.cancelled ? 'Restore' : 'Cancel Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
