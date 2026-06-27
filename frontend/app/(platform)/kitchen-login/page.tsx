'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { setToken } from '@/lib/auth'

const BOARD_URL = '/seller/orders/board?kiosk=1'

export default function KitchenLoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/login/', form)
      if (data.mfa_required) {
        const redirect = encodeURIComponent(BOARD_URL)
        router.push(`/verify-otp?token=${encodeURIComponent(data.partial_token)}&redirect=${redirect}`)
      } else {
        setToken(data.access, data.refresh)
        router.push(BOARD_URL)
      }
    } catch {
      setError('Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">👨‍🍳</div>
          <h1 className="text-3xl font-extrabold text-white">Kitchen sign in</h1>
          <p className="text-gray-400 mt-1 text-sm">Opens the kitchen board — no seller tools</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input
                type="email" required value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-xl px-4 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:border-gray-400"
                placeholder="jane@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <input
                type="password" required value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-xl px-4 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:border-gray-400"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-red-400 text-sm bg-red-950 border border-red-800 px-3 py-2 rounded-lg">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold py-3 rounded-xl text-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Open kitchen board'}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-gray-600 mt-6">
          <a href="/login" className="text-gray-500 hover:text-gray-400">← Back to full login</a>
        </p>
      </div>
    </main>
  )
}
