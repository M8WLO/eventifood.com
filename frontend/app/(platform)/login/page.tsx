'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { setToken } from '@/lib/auth'

type LoginMode = 'seller' | 'kitchen' | 'display' | 'menu'

const MODE_OPTIONS: { mode: LoginMode; label: string; desc: string; icon: string }[] = [
  { mode: 'seller',  label: 'Seller',           desc: 'Full dashboard access',          icon: '🏠' },
  { mode: 'kitchen', label: 'Kitchen board',     desc: 'Orders & kitchen display',        icon: '🍳' },
  { mode: 'display', label: 'Customer display',  desc: 'QR code fullscreen screen',       icon: '📺' },
  { mode: 'menu',    label: 'Menu screen',       desc: 'Menu display for a wall screen',  icon: '🍽️' },
]

const MODE_DESTINATIONS: Record<LoginMode, string> = {
  seller:  '/seller/dashboard',
  kitchen: '/seller/orders/board?kiosk=1',
  display: '/seller/display',
  menu:    '/seller/menu-display',
}

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loginMode, setLoginMode] = useState<LoginMode>('seller')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/login/', form)
      const dest = MODE_DESTINATIONS[loginMode]
      if (data.mfa_required) {
        const demoParam = data.is_demo ? '&demo=1' : ''
        router.push(`/verify-otp?token=${encodeURIComponent(data.partial_token)}&redirect=${encodeURIComponent(dest)}${demoParam}`)
      } else {
        setToken(data.access, data.refresh)
        router.push(dest)
      }
    } catch {
      setError('Invalid email or password.')
      setForm((p) => ({ ...p, password: '' }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-brand-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Welcome back</h1>
          <p className="text-gray-500 mt-1">Sign in to your Eventifood account</p>
        </div>
        <div className="card shadow-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email" required value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="input-field" placeholder="jane@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} required value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  className="input-field pr-10" placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Mode selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sign in as</label>
              <div className="grid grid-cols-2 gap-2">
                {MODE_OPTIONS.map((opt) => (
                  <button
                    key={opt.mode}
                    type="button"
                    onClick={() => setLoginMode(opt.mode)}
                    className={`flex items-start gap-2 p-2.5 rounded-xl border-2 text-left transition-colors ${
                      loginMode === opt.mode
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <span className="text-xl leading-none mt-0.5">{opt.icon}</span>
                    <div>
                      <p className={`text-xs font-semibold leading-tight ${loginMode === opt.mode ? 'text-brand-700' : 'text-gray-800'}`}>
                        {opt.label}
                      </p>
                      <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Signing in…' : `Sign in${loginMode !== 'seller' ? ` — ${MODE_OPTIONS.find(o => o.mode === loginMode)?.label}` : ''}`}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            No account?{' '}
            <Link href="/register" className="text-brand-600 hover:underline font-medium">Create one free</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
